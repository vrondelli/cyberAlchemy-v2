from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


RUNTIME = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "authority-package" / "valid-minimal.json"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path); module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None; sys.modules[name] = module; spec.loader.exec_module(module); return module


mint = load("mint", RUNTIME / "mint.py")
authority_package = load("authority_package", RUNTIME / "authority_package.py")
compiler = load("authority_compiler", RUNTIME / "authority_compiler.py")


class AuthorityCompilerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.package = json.loads(FIXTURE.read_text())

    def test_valid_package_compiles_exact_18_paths_and_b1_b9(self) -> None:
        output = compiler.compile_markdown(self.package, mint)
        self.assertEqual(output["receipt"]["status"], "ready")
        files = output["package"]["files"]
        self.assertEqual(len(files), 18)
        expected = [path.format(domain_slug="marketplace") for _, path in mint.STAGE_2_EFFECTS]
        self.assertEqual([item["path"] for item in files], expected)
        self.assertEqual(len(set(expected)), 18)
        self.assertEqual([item["baseline_id"] for item in output["package"]["b1_b9_parity"]], [f"B{i}" for i in range(1, 10)])

    def test_output_and_receipt_validate_against_schemas(self) -> None:
        output = compiler.compile_markdown(self.package, mint)
        for key, name in (("package", "authority-markdown-package.v0.1.schema.json"), ("receipt", "authority-markdown-receipt.v0.1.schema.json")):
            schema = json.loads((RUNTIME / "contracts" / name).read_text())
            Draft202012Validator(schema).validate(output[key])

    def test_compilation_is_deterministic_and_no_write(self) -> None:
        before = FIXTURE.read_bytes()
        first = mint.canonical_bytes(compiler.compile_markdown(self.package, mint))
        second = mint.canonical_bytes(compiler.compile_markdown(copy.deepcopy(self.package), mint))
        self.assertEqual(first, second)
        self.assertEqual(before, FIXTURE.read_bytes())
        self.assertEqual(json.loads(first)["receipt"]["writes_performed"], 0)

    def test_invalid_package_blocks_without_files(self) -> None:
        invalid = copy.deepcopy(self.package); invalid["status"] = "validated"
        output = compiler.compile_markdown(invalid, mint)
        self.assertEqual(output["receipt"]["status"], "blocked")
        self.assertEqual(output["package"]["files"], [])
        self.assertTrue(output["receipt"]["blockers"])

    def test_legacy_renderer_and_apply_catalog_remain_compatible(self) -> None:
        self.assertEqual(len(mint.STAGE_2_EFFECTS), 18)
        self.assertFalse(any(path.startswith("projects/zagr") for _, path in mint.STAGE_2_EFFECTS))

    def test_cli_is_deterministic(self) -> None:
        command = [sys.executable, str(RUNTIME / "mint.py"), "package-render", "--input", str(FIXTURE)]
        first = subprocess.run(command, capture_output=True, check=False)
        second = subprocess.run(command, capture_output=True, check=False)
        self.assertEqual(first.returncode, 0, first.stderr.decode())
        self.assertEqual(first.stdout, second.stdout)
        self.assertEqual(json.loads(first.stdout)["receipt"]["status"], "ready")


if __name__ == "__main__": unittest.main()
