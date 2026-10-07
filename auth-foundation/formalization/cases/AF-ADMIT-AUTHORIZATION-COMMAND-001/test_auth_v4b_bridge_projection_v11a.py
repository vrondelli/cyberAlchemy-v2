#!/usr/bin/env python3
"""Compiled bridge-main controls for the bounded V11a projection."""

from __future__ import annotations

import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path


CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_bridge_projection_v11a", CASE / "auth-v4b-bridge-projection-v11a.py")
assert SPEC and SPEC.loader
verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verifier)
IMPL = verifier.v7.IMPL
TOOLCHAIN = ROOT / "tools/toolchain/run"


class BridgeProjectionV11a(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.selected = {}

        def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
            if root_id in verifier.BRIDGES:
                selected = mir[verifier.v6.ROOT_MANIFESTS[root_id]]
                cls.selected[root_id] = selected
                return verifier.inspect_main(root_id, selected)
            return {}

        cls.current = verifier.v7.evaluate(mir_inspector=inspect)
        cls.fixture = tempfile.TemporaryDirectory(prefix="auth-v4b-v11a-mutant-")
        cls.fixture_path = Path(cls.fixture.name)
        (cls.fixture_path / "src").mkdir()
        manifest = (IMPL / "authentication-prototype/bridge/Cargo.toml").read_text()
        (cls.fixture_path / "Cargo.toml").write_text(
            manifest.replace('path = "../../', f'path = "{IMPL}/'))

    @classmethod
    def tearDownClass(cls) -> None:
        if hasattr(cls, "fixture"):
            cls.fixture.cleanup()

    def compile_mutant(self, source: str) -> str:
        (self.fixture_path / "src/main.rs").write_text(source)
        command = [str(TOOLCHAIN), "cargo", "rustc", "--offline",
                   "--manifest-path", str(self.fixture_path / "Cargo.toml"),
                   "--target-dir", str(self.fixture_path / "target"),
                   "--bin=auth-prototype-bridge", "--", "--emit=mir"]
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                timeout=300, check=False)
        self.assertEqual(result.returncode, 0, result.stderr[-2500:])
        candidates = list((self.fixture_path / "target/debug/deps").glob(
            "auth_prototype_bridge-*.mir"))
        self.assertEqual(len(candidates), 1)
        return candidates[0].read_text()

    def source(self) -> str:
        return (IMPL / "authentication-prototype/bridge/src/main.rs").read_text()

    def test_current_two_bridge_mains_pass_bounded_projection(self) -> None:
        self.assertEqual(self.current["status"], "indeterminate")
        self.assertFalse(self.current["runtime_guarantees_observed"])
        self.assertEqual(set(self.selected), set(verifier.BRIDGES))
        for root_id in verifier.BRIDGES:
            with self.subTest(root_id=root_id):
                self.assertEqual(verifier.inspect_main(root_id, self.selected[root_id])[
                    "selected_literal_to_print_argument"], "pass")

    def test_compiled_error_default_allow_fails_projection(self) -> None:
        source = self.source()
        self.assertIn("evaluate().unwrap_or(false)", source)
        mir = self.compile_mutant(source.replace(
            "evaluate().unwrap_or(false)", "evaluate().unwrap_or(true)", 1))
        self.assertEqual(verifier.v10.root_output_provenance("prototype", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "error/default must be false"):
            verifier.inspect_main("prototype", mir)

    def test_compiled_inverted_literals_fail_projection(self) -> None:
        source = self.source()
        prefix, main = source.split("fn main()", 1)
        self.assertIn("ALLOW", main)
        self.assertIn("DENY", main)
        main = main.replace("ALLOW", "TEMP_LITERAL", 1).replace(
            "DENY", "ALLOW", 1).replace("TEMP_LITERAL", "DENY", 1)
        mir = self.compile_mutant(prefix + "fn main()" + main)
        self.assertEqual(verifier.v10.root_output_provenance("prototype", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "output literal polarity changed"):
            verifier.inspect_main("prototype", mir)

    def test_compiled_early_allow_print_fails_projection(self) -> None:
        source = self.source()
        anchor = "    let allow = evaluate().unwrap_or(false);"
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            '    if std::env::var_os("AUTH_BYPASS").is_some() {\n'
            '        println!("{}", r#"{"decision":"ALLOW"}"#);\n'
            '        return;\n'
            '    }\n' + anchor, 1)
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("prototype", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "alternate print path"):
            verifier.inspect_main("prototype", mir)


if __name__ == "__main__":
    unittest.main()
