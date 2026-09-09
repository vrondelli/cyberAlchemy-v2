from __future__ import annotations

import base64
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
TEST_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(RUNTIME_DIR))


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


mint = load_module("mint_render_test_planner", RUNTIME_DIR / "mint.py")
render = load_module("mint_render_test_runtime", RUNTIME_DIR / "render_runtime.py")


def snapshot(root: Path) -> list[tuple[str, str, int]]:
    if not root.exists():
        return []
    records = []
    for path in sorted(root.rglob("*"), key=lambda item: item.as_posix()):
        if path.is_file() and not path.is_symlink():
            data = path.read_bytes()
            records.append((path.relative_to(root).as_posix(), hashlib.sha256(data).hexdigest(), len(data)))
    return records


class MintRenderRuntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="mint-render-test-")
        self.root = Path(self.temp.name)
        self.allowed_root = self.root / "runs"
        self.allowed_root.mkdir()
        self.target = self.allowed_root / "render-target"
        self.framework = self.root / "framework"
        self.framework.mkdir()
        (self.framework / "FRAMEWORK.md").write_text("fixture framework\n", encoding="utf-8")
        self.protected = self.root / "protected"
        self.protected.mkdir()
        self.triage = self.root / "triage.json"
        self.triage.write_text('{"verdict":"new-authority (domain-local)"}\n', encoding="utf-8")
        template_digest, _ = mint.template_set_digest()
        manifest_text = (TEST_DIR / "fixtures" / "valid-private.json").read_text(encoding="utf-8")
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
            manifest_text = manifest_text.replace(key, value)
        self.manifest = json.loads(manifest_text)
        self.p0 = mint.plan_manifest(self.manifest)
        render_text = (TEST_DIR / "fixtures" / "valid-render-input.json").read_text(encoding="utf-8")
        render_text = render_text.replace("$PLAN_ID", self.p0["plan"]["plan_id"])
        render_text = render_text.replace("$MANIFEST_SHA256", self.p0["plan"]["manifest_sha256"])
        self.render_input = json.loads(render_text)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_render(self, render_input=None, p0=None):
        return render.render_output(
            copy.deepcopy(self.manifest),
            copy.deepcopy(self.p0 if p0 is None else p0),
            copy.deepcopy(self.render_input if render_input is None else render_input),
            mint,
        )

    def assert_blocked(self, output, fragment: str) -> None:
        self.assertEqual("blocked", output["package"]["status"])
        self.assertEqual([], output["package"]["files"])
        self.assertTrue(any(fragment in item for item in output["package"]["blockers"]), output["package"]["blockers"])
        self.assertEqual(0, output["receipt"]["writes_attempted"])
        self.assertEqual(0, output["receipt"]["writes_performed"])

    def test_ready_render_is_deterministic_and_exactly_18_files(self) -> None:
        first = self.run_render()
        second = self.run_render()
        self.assertEqual(mint.canonical_bytes(first), mint.canonical_bytes(second))
        package = first["package"]
        self.assertEqual("ready", package["status"])
        self.assertEqual(18, len(package["files"]))
        self.assertEqual(list(range(2, 20)), [item["effect_ordinal"] for item in package["files"]])
        self.assertEqual(18, len({item["path"] for item in package["files"]}))
        for item in package["files"]:
            content = base64.b64decode(item["content_b64"], validate=True)
            self.assertEqual(item["size_bytes"], len(content))
            self.assertEqual(item["sha256"], hashlib.sha256(content).hexdigest())
            self.assertNotRegex(content.decode("utf-8"), render.SEMANTIC_TOKEN_RE)

    def test_nav_source_compiles_to_two_explicit_outputs(self) -> None:
        files = self.run_render()["package"]["files"]
        nav = [item for item in files if item["source_template"] == "nav-and-decisions.md"]
        self.assertEqual(["authority/README.md", "authority/decisions/README.md"], [item["path"] for item in nav])
        self.assertEqual([15, 16], [item["effect_ordinal"] for item in nav])

    def test_render_is_no_write(self) -> None:
        before_root = snapshot(self.root)
        before_templates = snapshot(mint.TEMPLATE_ROOT)
        output = self.run_render()
        self.assertEqual("ready", output["package"]["status"])
        self.assertFalse(self.target.exists())
        self.assertEqual(before_root, snapshot(self.root))
        self.assertEqual(before_templates, snapshot(mint.TEMPLATE_ROOT))
        self.assertEqual(0, output["receipt"]["writes_performed"])

    def test_missing_unknown_unused_and_kind_method_bindings_block(self) -> None:
        missing = copy.deepcopy(self.render_input)
        missing["values"].pop("domain_commitment")
        self.assert_blocked(self.run_render(missing), "missing fields")
        unknown = copy.deepcopy(self.render_input)
        unknown["values"]["unused"] = "not consumed"
        self.assert_blocked(self.run_render(unknown), "unknown fields")
        wrong_methods = copy.deepcopy(self.render_input)
        wrong_methods["values"]["methods"][0]["kind_id"] = "OTHER_KIND"
        self.assert_blocked(self.run_render(wrong_methods), "cover exactly")

    def test_forbidden_resolution_phrase_and_multiline_semantic_value_block(self) -> None:
        laundering = copy.deepcopy(self.render_input)
        laundering["values"]["constitution_rules"][0]["rule"] = "CAV2 resolves this decision"
        self.assert_blocked(self.run_render(laundering), "forbidden framework-resolution phrase")
        multiline = copy.deepcopy(self.render_input)
        multiline["values"]["domain_commitment"] = "line one\nline two"
        self.assert_blocked(self.run_render(multiline), "single safe text line")

    def test_plan_and_digest_drift_block(self) -> None:
        plan_drift = copy.deepcopy(self.p0)
        plan_drift["plan"]["effects"][1]["source_sha256"] = "0" * 64
        self.assert_blocked(self.run_render(p0=plan_drift), "fresh plan recomputation")
        binding_drift = copy.deepcopy(self.render_input)
        binding_drift["plan_id"] = "0" * 64
        self.assert_blocked(self.run_render(binding_drift), "plan_id mismatch")

    def test_ir_path_collision_and_unresolved_semantic_token_block(self) -> None:
        original_path = render.IR_PATH
        ir = json.loads(original_path.read_text(encoding="utf-8"))
        ir["outputs"][1]["path_template"] = ir["outputs"][0]["path_template"]
        bad_ir = self.root / "bad-ir.json"
        bad_ir.write_text(json.dumps(ir), encoding="utf-8")
        try:
            render.IR_PATH = bad_ir
            self.assert_blocked(self.run_render(), "IR/P0 effect mismatch")
        finally:
            render.IR_PATH = original_path

        original_compiler = render.COMPILERS["authority_model"]
        try:
            render.COMPILERS["authority_model"] = lambda manifest, values: b"# Bad\n\n{{MISSING}}\n"
            self.assert_blocked(self.run_render(), "unresolved semantic token")
        finally:
            render.COMPILERS["authority_model"] = original_compiler

    def test_render_contract_json_documents_parse(self) -> None:
        for name in (
            "mint-render-input.v0.1.schema.json",
            "mint-render-package.v0.1.schema.json",
            "mint-render-receipt.v0.1.schema.json",
        ):
            payload = json.loads((RUNTIME_DIR / "contracts" / name).read_text(encoding="utf-8"))
            self.assertEqual("https://json-schema.org/draft/2020-12/schema", payload["$schema"])
        ir = json.loads((RUNTIME_DIR / "ir" / "stage2.v0.1.json").read_text(encoding="utf-8"))
        self.assertEqual(18, len(ir["outputs"]))

    def test_cli_render_is_deterministic(self) -> None:
        manifest_path = self.root / "manifest.json"
        plan_path = self.root / "plan.json"
        binding_path = self.root / "bindings.json"
        manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        plan_path.write_text(json.dumps(self.p0), encoding="utf-8")
        binding_path.write_text(json.dumps(self.render_input), encoding="utf-8")
        argv = [sys.executable, str(RUNTIME_DIR / "mint.py"), "render", "--manifest", str(manifest_path), "--plan", str(plan_path), "--bindings", str(binding_path)]
        first = subprocess.run(argv, check=True, capture_output=True)
        second = subprocess.run(argv, check=True, capture_output=True)
        self.assertEqual(b"", first.stderr)
        self.assertEqual(first.stdout, second.stdout)
        self.assertEqual("ready", json.loads(first.stdout)["package"]["status"])
        self.assertFalse(self.target.exists())


if __name__ == "__main__":
    unittest.main()
