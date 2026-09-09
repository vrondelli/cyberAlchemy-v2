from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


RUNTIME_DIR = Path(__file__).resolve().parents[1]
MODULE_PATH = RUNTIME_DIR / "mint.py"
FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "valid-private.json"
SPEC = importlib.util.spec_from_file_location("mint_runtime", MODULE_PATH)
assert SPEC and SPEC.loader
mint = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mint)


def tree_snapshot(root: Path) -> list[tuple[str, str, int]]:
    records: list[tuple[str, str, int]] = []
    if not root.exists():
        return records
    for path in sorted(root.rglob("*"), key=lambda item: item.as_posix()):
        if path.is_file() and not path.is_symlink():
            payload = path.read_bytes()
            records.append((path.relative_to(root).as_posix(), hashlib.sha256(payload).hexdigest(), len(payload)))
    return records


class MintPlanRuntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="mint-p0-test-")
        self.root = Path(self.temp.name)
        self.allowed_root = self.root / "runs"
        self.allowed_root.mkdir()
        self.target = self.allowed_root / "fixture-target"
        self.framework = self.root / "framework"
        self.framework.mkdir()
        (self.framework / "FRAMEWORK.md").write_text("fixture framework\n", encoding="utf-8")
        self.protected = self.root / "protected-corpus"
        self.protected.mkdir()
        (self.protected / "README.md").write_text("read only\n", encoding="utf-8")
        self.triage = self.root / "triage-receipt.json"
        self.triage.write_text('{"verdict":"new-authority (domain-local)"}\n', encoding="utf-8")
        template_digest, _ = mint.template_set_digest()
        raw = FIXTURE_PATH.read_text(encoding="utf-8")
        replacements = {
            "$TARGET_PATH": str(self.target),
            "$ALLOWED_ROOT": str(self.allowed_root),
            "$FRAMEWORK_SOURCE": str(self.framework),
            "$FRAMEWORK_SHA256": mint.tree_sha256(self.framework),
            "$TRIAGE_RECEIPT": str(self.triage),
            "$TRIAGE_SHA256": mint.sha256_file(self.triage),
            "$TEMPLATE_ROOT": str(mint.TEMPLATE_ROOT),
            "$TEMPLATE_SHA256": template_digest,
            "$PROTECTED_PATH": str(self.protected),
        }
        for key, value in replacements.items():
            raw = raw.replace(key, value)
        self.manifest = json.loads(raw)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def assert_blocked(self, manifest: dict, fragment: str) -> dict:
        output = mint.plan_manifest(manifest)
        self.assertEqual("blocked", output["plan"]["status"])
        self.assertTrue(any(fragment in blocker for blocker in output["plan"]["blockers"]), output["plan"]["blockers"])
        self.assertEqual([], output["plan"]["effects"])
        self.assertEqual(0, output["receipt"]["writes_performed"])
        return output

    def test_same_inputs_produce_byte_identical_output(self) -> None:
        first = mint.canonical_bytes(mint.plan_manifest(copy.deepcopy(self.manifest)))
        second = mint.canonical_bytes(mint.plan_manifest(copy.deepcopy(self.manifest)))
        self.assertEqual(first, second)

    def test_valid_private_manifest_has_exact_effect_inventory(self) -> None:
        output = mint.plan_manifest(self.manifest)
        plan = output["plan"]
        self.assertEqual("ready", plan["status"])
        self.assertEqual(22, len(plan["effects"]))
        stage_two = [effect for effect in plan["effects"] if effect["stage"] == "stage-2"]
        self.assertEqual(18, len(stage_two))
        self.assertEqual(19, output["receipt"]["effects_planned"])
        self.assertEqual(list(range(1, 23)), [effect["ordinal"] for effect in plan["effects"]])
        nav_paths = {
            effect["target_relative_path"]
            for effect in stage_two
            if effect["source_template"] == "nav-and-decisions.md"
        }
        self.assertEqual({"authority/README.md", "authority/decisions/README.md"}, nav_paths)

    def test_planning_does_not_mutate_target_source_templates_or_receipt_files(self) -> None:
        before_framework = tree_snapshot(self.framework)
        before_templates = tree_snapshot(mint.TEMPLATE_ROOT)
        before_root = tree_snapshot(self.root)
        output = mint.plan_manifest(self.manifest)
        self.assertEqual("ready", output["plan"]["status"])
        self.assertFalse(self.target.exists())
        self.assertEqual(before_framework, tree_snapshot(self.framework))
        self.assertEqual(before_templates, tree_snapshot(mint.TEMPLATE_ROOT))
        self.assertEqual(before_root, tree_snapshot(self.root))
        self.assertEqual(0, output["receipt"]["writes_attempted"])

    def test_path_safety_blocks_relative_broad_existing_source_and_symlink_targets(self) -> None:
        relative = copy.deepcopy(self.manifest)
        relative["target"]["path"] = "relative-target"
        self.assert_blocked(relative, "target.path must be absolute")

        broad = copy.deepcopy(self.manifest)
        broad["target"]["allowed_root"] = "/"
        broad["target"]["path"] = "/mint-p0-test-target"
        self.assert_blocked(broad, "too broad")

        self.target.mkdir()
        self.assert_blocked(copy.deepcopy(self.manifest), "target.path must be absent")
        self.target.rmdir()

        nested = copy.deepcopy(self.manifest)
        nested["target"]["allowed_root"] = str(self.framework)
        nested["target"]["path"] = str(self.framework / "target")
        self.assert_blocked(nested, "must be disjoint")

        actual = self.root / "actual-runs"
        actual.mkdir()
        linked = self.root / "linked-runs"
        linked.symlink_to(actual, target_is_directory=True)
        symlinked = copy.deepcopy(self.manifest)
        symlinked["target"]["allowed_root"] = str(linked)
        symlinked["target"]["path"] = str(linked / "target")
        self.assert_blocked(symlinked, "symlink component")

    def test_public_and_unsupported_attach_modes_block(self) -> None:
        public = copy.deepcopy(self.manifest)
        public["target"]["visibility"] = "public"
        self.assert_blocked(public, "target.visibility must be private")
        for mode in ("copy", "symlink"):
            candidate = copy.deepcopy(self.manifest)
            candidate["framework"]["attach_mode"] = mode
            self.assert_blocked(candidate, "framework.attach_mode must be submodule")

    def test_authority_binding_failures_block(self) -> None:
        no_kind = copy.deepcopy(self.manifest)
        no_kind["authority"]["domain_kinds"] = []
        self.assert_blocked(no_kind, "at least one domain-local kind")
        cases = (
            ("blocked_use", "", "blocked_use must be a non-empty string"),
            ("owner_route", "source-owner", "must be separate"),
            ("triage_receipt_ref", str(self.root / "missing.json"), "triage receipt must be"),
            ("triage_verdict", "existing-authority", "new-authority (domain-local)"),
        )
        for field, value, fragment in cases:
            with self.subTest(field=field):
                candidate = copy.deepcopy(self.manifest)
                candidate["authority"]["domain_kinds"][0][field] = value
                self.assert_blocked(candidate, fragment)

    def test_source_and_template_digest_drift_block(self) -> None:
        source_drift = copy.deepcopy(self.manifest)
        source_drift["framework"]["expected_sha256"] = "0" * 64
        self.assert_blocked(source_drift, "framework source digest mismatch")
        template_drift = copy.deepcopy(self.manifest)
        template_drift["template_set"]["expected_sha256"] = "0" * 64
        self.assert_blocked(template_drift, "template-set digest mismatch")

    def test_missing_allowlisted_template_blocks(self) -> None:
        copied = self.root / "templates"
        copied.mkdir()
        for name in mint.TEMPLATE_FILES[:-1]:
            (copied / name).write_bytes((mint.TEMPLATE_ROOT / name).read_bytes())
        old_root = mint.TEMPLATE_ROOT
        try:
            mint.TEMPLATE_ROOT = copied
            candidate = copy.deepcopy(self.manifest)
            candidate["template_set"]["root"] = str(copied)
            candidate["template_set"]["expected_sha256"] = "0" * 64
            self.assert_blocked(candidate, "missing allowlisted template")
        finally:
            mint.TEMPLATE_ROOT = old_root

    def test_effect_path_validator_rejects_escape_duplicate_case_and_prefix_collisions(self) -> None:
        errors = mint._validate_relative_paths(
            ["../escape", "authority/A.md", "authority/a.md", "authority/file", "authority/file/child"]
        )
        self.assertTrue(any("unsafe" in error for error in errors))
        self.assertTrue(any("case-colliding" in error for error in errors))
        self.assertTrue(any("prefix collision" in error for error in errors))

    def test_effects_are_create_only_or_unexecuted_argv_and_later_stages_are_deferred(self) -> None:
        plan = mint.plan_manifest(self.manifest)["plan"]
        for effect in plan["effects"]:
            self.assertIn(effect["operation"], {"create_file", "external_action"})
            self.assertNotIn(effect["operation"], {"overwrite", "delete", "rename", "chmod"})
        l0 = plan["effects"][0]
        self.assertEqual("external_action", l0["operation"])
        self.assertIsInstance(l0["argv"], list)
        self.assertNotIsInstance(l0["argv"], str)
        deferred = [effect for effect in plan["effects"] if effect["stage"] in {"stage-3", "stage-4"}]
        self.assertTrue(deferred)
        self.assertTrue(all(effect["disposition"] == "deferred" for effect in deferred))
        self.assertFalse(any(effect["stage"] == "stage-5" for effect in plan["effects"]))

    def test_receipt_binds_plan_and_records_zero_mutations(self) -> None:
        output = mint.plan_manifest(self.manifest)
        receipt = output["receipt"]
        self.assertEqual(output["plan"]["plan_id"], receipt["plan_id"])
        self.assertEqual(hashlib.sha256(mint.canonical_bytes(output["plan"])).hexdigest(), receipt["stdout_sha256"])
        self.assertRegex(receipt["receipt_id"], r"^[a-f0-9]{64}$")
        self.assertEqual(0, receipt["effects_applied"])
        self.assertEqual(0, receipt["writes_attempted"])
        self.assertEqual(0, receipt["writes_performed"])
        self.assertEqual(0, receipt["external_commands_executed"])

    def test_strict_schema_rejects_unknown_fields(self) -> None:
        candidate = copy.deepcopy(self.manifest)
        candidate["unexpected"] = True
        self.assert_blocked(candidate, "manifest unknown fields")

    def test_cli_is_executable_and_stdout_is_deterministic(self) -> None:
        manifest_path = self.root / "manifest.json"
        manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        argv = [sys.executable, str(MODULE_PATH), "plan", "--manifest", str(manifest_path)]
        first = subprocess.run(argv, check=True, capture_output=True)
        second = subprocess.run(argv, check=True, capture_output=True)
        self.assertEqual(b"", first.stderr)
        self.assertEqual(first.stdout, second.stdout)
        parsed = json.loads(first.stdout)
        self.assertEqual("ready", parsed["plan"]["status"])
        self.assertFalse(self.target.exists())


if __name__ == "__main__":
    unittest.main()
