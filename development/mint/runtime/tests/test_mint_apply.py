from __future__ import annotations

import base64
import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

import test_mint_render as render_tests


RUNTIME_DIR = render_tests.RUNTIME_DIR
TEST_DIR = render_tests.TEST_DIR
mint = render_tests.mint
render = render_tests.render
snapshot = render_tests.snapshot


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


apply_runtime = load_module("mint_apply_test_runtime", RUNTIME_DIR / "apply_runtime.py")


class MintApplyRuntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.render_case = render_tests.MintRenderRuntimeTest(
            methodName="test_ready_render_is_deterministic_and_exactly_18_files"
        )
        self.render_case.setUp()
        self.root = self.render_case.root
        self.target = self.render_case.target
        self.manifest = self.render_case.manifest
        self.p0 = self.render_case.p0
        self.render_input = self.render_case.render_input
        self.render_output = self.render_case.run_render()
        self.journal_root = self.root / "journals"
        self.journal_root.mkdir()
        request_text = (TEST_DIR / "fixtures" / "valid-apply-request.json").read_text(encoding="utf-8")
        replacements = {
            "$ATTEMPT_ID": "apply-test",
            "$PLAN_ID": self.p0["plan"]["plan_id"],
            "$RENDER_ID": self.render_output["package"]["render_id"],
            "$TARGET_PATH": str(self.target),
            "$ALLOWED_ROOT": str(self.render_case.allowed_root),
            "$JOURNAL_ROOT": str(self.journal_root),
        }
        for key, value in replacements.items():
            request_text = request_text.replace(key, value)
        self.request = json.loads(request_text)

    def tearDown(self) -> None:
        self.render_case.tearDown()

    def apply(self, request=None, p0=None, rendered=None):
        return apply_runtime.apply_output(
            copy.deepcopy(self.manifest),
            copy.deepcopy(self.p0 if p0 is None else p0),
            copy.deepcopy(self.render_input),
            copy.deepcopy(self.render_output if rendered is None else rendered),
            copy.deepcopy(self.request if request is None else request),
            mint,
            render,
        )

    def recover(self, request=None, rendered=None):
        return apply_runtime.recover_output(
            copy.deepcopy(self.manifest),
            copy.deepcopy(self.p0),
            copy.deepcopy(self.render_input),
            copy.deepcopy(self.render_output if rendered is None else rendered),
            copy.deepcopy(self.request if request is None else request),
            mint,
            render,
        )

    def assert_blocked_without_target_or_journal(self, output, fragment: str, request=None) -> None:
        request = self.request if request is None else request
        self.assertEqual("blocked", output["receipt"]["status"])
        self.assertTrue(any(fragment in item for item in output["receipt"]["blockers"]), output["receipt"]["blockers"])
        self.assertFalse(self.target.exists())
        journal = Path(request["journal_root"]) / f"{request['attempt_id']}.journal.jsonl"
        self.assertFalse(journal.exists())

    def test_success_creates_exactly_18_bound_files_and_append_only_journal(self) -> None:
        before_templates = snapshot(mint.TEMPLATE_ROOT)
        before_framework = snapshot(self.render_case.framework)
        output = self.apply()
        receipt = output["receipt"]
        self.assertEqual("applied", receipt["status"])
        self.assertEqual(18, receipt["effects_applied"])
        self.assertEqual(18, receipt["target_file_writes"])
        self.assertEqual({"exists": True, "path": str(self.target), "regular_file_count": 18}, receipt["target_observation"])
        expected = {item["path"]: base64.b64decode(item["content_b64"], validate=True) for item in self.render_output["package"]["files"]}
        actual = {path.relative_to(self.target).as_posix(): path.read_bytes() for path in self.target.rglob("*") if path.is_file()}
        self.assertEqual(expected, actual)
        journal_path = Path(receipt["journal_path"])
        self.assertEqual(receipt["journal_sha256"], apply_runtime.digest_file(journal_path))
        records = apply_runtime.read_journal(journal_path)
        self.assertEqual("begin", records[0]["event"])
        self.assertEqual("complete", records[-1]["event"])
        self.assertEqual(list(range(1, len(records) + 1)), [record["sequence"] for record in records])
        self.assertEqual(before_templates, snapshot(mint.TEMPLATE_ROOT))
        self.assertEqual(before_framework, snapshot(self.render_case.framework))

    def test_fault_injection_at_every_effect_ordinal_recovers_exactly(self) -> None:
        for ordinal in range(2, 20):
            with self.subTest(ordinal=ordinal):
                request = copy.deepcopy(self.request)
                request["attempt_id"] = f"fault-{ordinal}"
                request["fault_after_ordinal"] = ordinal
                output = self.apply(request)
                receipt = output["receipt"]
                self.assertEqual("recovered", receipt["status"], receipt)
                self.assertEqual(ordinal - 1, receipt["target_file_writes"])
                self.assertEqual(ordinal - 1, receipt["files_removed"])
                self.assertFalse(self.target.exists())
                self.assertEqual([], receipt["residue"])
                journal = self.journal_root / f"fault-{ordinal}.journal.jsonl"
                self.assertEqual("recovered", apply_runtime.read_journal(journal)[-1]["event"])

    def test_manual_recovery_succeeds_for_untampered_partial_target(self) -> None:
        request = copy.deepcopy(self.request)
        request["attempt_id"] = "manual-recover"
        request["fault_after_ordinal"] = 5
        request["auto_recover"] = False
        failed = self.apply(request)
        self.assertEqual("failed", failed["receipt"]["status"])
        self.assertTrue(self.target.exists())
        recovered = self.recover(request)
        self.assertEqual("recovered", recovered["receipt"]["status"])
        self.assertFalse(self.target.exists())
        self.assertEqual([], recovered["receipt"]["residue"])

    def test_tampered_partial_file_blocks_recovery_without_deleting_any_target_file(self) -> None:
        request = copy.deepcopy(self.request)
        request["attempt_id"] = "tamper-recover"
        request["fault_after_ordinal"] = 3
        request["auto_recover"] = False
        failed = self.apply(request)
        self.assertEqual("failed", failed["receipt"]["status"])
        first_path = self.target / self.render_output["package"]["files"][0]["path"]
        first_path.write_text("tampered bytes\n", encoding="utf-8")
        before = snapshot(self.target)
        blocked = self.recover(request)
        self.assertEqual("recovery-blocked", blocked["receipt"]["status"])
        self.assertTrue(any("digest mismatch" in item for item in blocked["receipt"]["blockers"]))
        self.assertEqual(0, blocked["receipt"]["files_removed"])
        self.assertEqual(before, snapshot(self.target))

    def test_tampered_journal_path_blocks_recovery_without_deleting_outside_target(self) -> None:
        request = copy.deepcopy(self.request)
        request["attempt_id"] = "tamper-journal"
        request["fault_after_ordinal"] = 3
        request["auto_recover"] = False
        failed = self.apply(request)
        self.assertEqual("failed", failed["receipt"]["status"])
        journal_path = Path(failed["receipt"]["journal_path"])
        records = apply_runtime.read_journal(journal_path)
        created = next(record for record in records if record["event"] == "file-created")
        outside = self.root / "outside.md"
        source = self.target / created["path"]
        outside.write_bytes(source.read_bytes())
        created["path"] = "../../outside.md"
        journal_path.write_bytes(b"".join(apply_runtime.canonical_bytes(record) for record in records))
        before_target = snapshot(self.target)
        blocked = self.recover(request)
        self.assertEqual("recovery-blocked", blocked["receipt"]["status"])
        self.assertTrue(any("not admitted" in item or "unsafe" in item for item in blocked["receipt"]["blockers"]))
        self.assertEqual(0, blocked["receipt"]["files_removed"])
        self.assertEqual(before_target, snapshot(self.target))
        self.assertTrue(outside.exists())

    def test_completed_attempt_is_not_eligible_for_recovery(self) -> None:
        applied = self.apply()
        self.assertEqual("applied", applied["receipt"]["status"])
        before = snapshot(self.target)
        blocked = self.recover()
        self.assertEqual("recovery-blocked", blocked["receipt"]["status"])
        self.assertTrue(any("not eligible" in item for item in blocked["receipt"]["blockers"]))
        self.assertEqual(0, blocked["receipt"]["files_removed"])
        self.assertEqual(before, snapshot(self.target))

    def test_existing_target_and_attempt_reuse_block(self) -> None:
        self.target.mkdir()
        output = self.apply()
        self.assertEqual("blocked", output["receipt"]["status"])
        self.assertTrue(any("fresh pre-apply" in item or "target.path must be absent" in item for item in output["receipt"]["blockers"]))
        self.target.rmdir()

        request = copy.deepcopy(self.request)
        request["attempt_id"] = "reuse"
        request["fault_after_ordinal"] = 2
        first = self.apply(request)
        self.assertEqual("recovered", first["receipt"]["status"])
        second = self.apply(request)
        self.assertEqual("blocked", second["receipt"]["status"])
        self.assertTrue(any("reuse" in item for item in second["receipt"]["blockers"]))
        self.assertFalse(self.target.exists())

    def test_journal_root_must_be_narrow_disjoint_and_not_symlinked(self) -> None:
        broad = copy.deepcopy(self.request)
        broad["journal_root"] = "/"
        self.assert_blocked_without_target_or_journal(self.apply(broad), "too broad", broad)
        overlap = copy.deepcopy(self.request)
        overlap["journal_root"] = str(self.render_case.allowed_root)
        self.assert_blocked_without_target_or_journal(self.apply(overlap), "overlaps protected", overlap)
        actual = self.root / "actual-journals"
        actual.mkdir()
        linked = self.root / "linked-journals"
        linked.symlink_to(actual, target_is_directory=True)
        symlinked = copy.deepcopy(self.request)
        symlinked["journal_root"] = str(linked)
        self.assert_blocked_without_target_or_journal(self.apply(symlinked), "symlink", symlinked)

        non_boolean = copy.deepcopy(self.request)
        non_boolean["auto_recover"] = 1
        self.assert_blocked_without_target_or_journal(self.apply(non_boolean), "must be boolean", non_boolean)

    def test_plan_render_bytes_and_deferred_effect_drift_block_before_mutation(self) -> None:
        p0_drift = copy.deepcopy(self.p0)
        p0_drift["plan"]["effects"][1]["target_relative_path"] = "unsafe.md"
        self.assert_blocked_without_target_or_journal(self.apply(p0=p0_drift), "fresh pre-apply")

        byte_drift = copy.deepcopy(self.render_output)
        byte_drift["package"]["files"][0]["content_b64"] = base64.b64encode(b"changed\n").decode("ascii")
        self.assert_blocked_without_target_or_journal(self.apply(rendered=byte_drift), "byte size or digest mismatch")

        deferred = copy.deepcopy(self.render_output)
        deferred["package"]["files"][0]["effect_ordinal"] = 20
        deferred["package"]["files"][0]["path"] = "authority/decisions/deferred.md"
        self.assert_blocked_without_target_or_journal(self.apply(rendered=deferred), "render_id does not bind")

    def test_apply_contracts_and_every_journal_record_validate_shape(self) -> None:
        for name in ("mint-apply-request.v0.1.schema.json", "mint-journal-record.v0.1.schema.json", "mint-apply-receipt.v0.1.schema.json"):
            payload = json.loads((RUNTIME_DIR / "contracts" / name).read_text(encoding="utf-8"))
            self.assertEqual("https://json-schema.org/draft/2020-12/schema", payload["$schema"])
        output = self.apply()
        records = apply_runtime.read_journal(Path(output["receipt"]["journal_path"]))
        required = {"schema_version", "sequence", "attempt_id", "plan_id", "render_id", "target_path", "event", "path", "sha256", "size_bytes", "detail"}
        self.assertTrue(all(set(record) == required for record in records))

    def test_cli_apply_materializes_exact_files(self) -> None:
        manifest_path = self.root / "manifest.json"
        plan_path = self.root / "plan.json"
        bindings_path = self.root / "bindings.json"
        render_path = self.root / "render.json"
        request_path = self.root / "request.json"
        for path, payload in (
            (manifest_path, self.manifest),
            (plan_path, self.p0),
            (bindings_path, self.render_input),
            (render_path, self.render_output),
            (request_path, self.request),
        ):
            path.write_text(json.dumps(payload), encoding="utf-8")
        argv = [sys.executable, str(RUNTIME_DIR / "mint.py"), "apply", "--manifest", str(manifest_path), "--plan", str(plan_path), "--bindings", str(bindings_path), "--render", str(render_path), "--request", str(request_path)]
        completed = subprocess.run(argv, check=True, capture_output=True)
        self.assertEqual(b"", completed.stderr)
        self.assertEqual("applied", json.loads(completed.stdout)["receipt"]["status"])
        self.assertEqual(18, len([path for path in self.target.rglob("*") if path.is_file()]))

    def test_cli_recover_returns_success_and_removes_an_untampered_partial_target(self) -> None:
        request = copy.deepcopy(self.request)
        request["attempt_id"] = "cli-recover"
        request["fault_after_ordinal"] = 4
        request["auto_recover"] = False
        manifest_path = self.root / "recover-manifest.json"
        plan_path = self.root / "recover-plan.json"
        bindings_path = self.root / "recover-bindings.json"
        render_path = self.root / "recover-render.json"
        request_path = self.root / "recover-request.json"
        for path, payload in (
            (manifest_path, self.manifest),
            (plan_path, self.p0),
            (bindings_path, self.render_input),
            (render_path, self.render_output),
            (request_path, request),
        ):
            path.write_text(json.dumps(payload), encoding="utf-8")
        common = [
            "--manifest", str(manifest_path),
            "--plan", str(plan_path),
            "--bindings", str(bindings_path),
            "--render", str(render_path),
            "--request", str(request_path),
        ]
        failed = subprocess.run(
            [sys.executable, str(RUNTIME_DIR / "mint.py"), "apply", *common],
            check=False,
            capture_output=True,
        )
        self.assertEqual(2, failed.returncode)
        self.assertEqual("failed", json.loads(failed.stdout)["receipt"]["status"])
        self.assertTrue(self.target.exists())
        recovered = subprocess.run(
            [sys.executable, str(RUNTIME_DIR / "mint.py"), "recover", *common],
            check=True,
            capture_output=True,
        )
        self.assertEqual(b"", recovered.stderr)
        self.assertEqual("recovered", json.loads(recovered.stdout)["receipt"]["status"])
        self.assertFalse(self.target.exists())


if __name__ == "__main__":
    unittest.main()
