#!/usr/bin/env python3
"""Focused synthetic MIR controls for the unselected V28 capability census."""

from __future__ import annotations

import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-native-capability-cut-v28.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_native_capability_cut_v28", SCRIPT)
assert SPEC and SPEC.loader
v28 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v28)

ROOT = v28.v6.ROOT_MANIFESTS["api"]
TOOLCHAIN = v28.v6.TOOLCHAIN
COERCION = ("    _4 = auth_foundation_authorization_ready_decision::authorize "
            "as for<'a, 'b> fn(ReadyAuthorization<'a, 'b>) -> "
            "BinaryAuthorizationDecision (PointerCoercion(ReifyFnPointer, Implicit));")


def mir(line: str = COERCION, name: str = "selected") -> str:
    return f"fn {name}() {{\n    bb0: {{\n{line}\n    }}\n}}\n"


def compiled_mir(source: str, *, alternate: bool = False) -> str:
    """Compile an external-crate hostile Rust control, never edit Auth."""
    with tempfile.TemporaryDirectory(prefix="auth-v28-compiled-control-") as temporary:
        directory = Path(temporary)
        dependency_path = directory / "decision.rs"
        library_path = directory / "libauth_foundation_authorization_ready_decision.rlib"
        input_path = directory / "control.rs"
        output_path = directory / "control.mir"
        dependency_path.write_text("pub fn authorize() {}\n")
        library = subprocess.run(
            [str(TOOLCHAIN), "rustc", "--edition=2021", "--crate-type=rlib",
             "--crate-name=auth_foundation_authorization_ready_decision",
             "-o", str(library_path), str(dependency_path)],
            capture_output=True, text=True, timeout=60, check=False)
        if library.returncode:
            raise AssertionError(library.stderr[-1000:])
        input_path.write_text(source)
        command = [str(TOOLCHAIN), "rustc", "--edition=2021", "--emit=mir",
                   "--extern", f"auth_foundation_authorization_ready_decision={library_path}",
                   "-o", str(output_path), str(input_path)]
        if alternate:
            command.extend(["--cfg", "alternate"])
        run = subprocess.run(command, capture_output=True, text=True,
                             timeout=60, check=False)
        if run.returncode:
            raise AssertionError(run.stderr[-1000:])
        return output_path.read_text()


class NativeCapabilityCutV28(unittest.TestCase):
    def test_selected_typed_function_item_is_accounted_for(self) -> None:
        result = v28.ready_references("api", {ROOT: mir()}, "selected()")
        self.assertEqual(result["compiled_reference_count"], 1)
        self.assertEqual(result["selected_root_reference"]["manifest"], ROOT)

    def test_extra_reference_in_another_local_artifact_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "reference count changed"):
            v28.ready_references("api", {ROOT: mir(), "helper/Cargo.toml": mir()},
                                 "selected()")

    def test_reference_in_unselected_root_function_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "outside selected root handoff"):
            v28.ready_references("api", {ROOT: mir(name="decoy")}, "selected()")

    def test_direct_policy_bypass_fails(self) -> None:
        line = ("    _0 = auth_foundation_authorization_ready_decision::authorize(_1) "
                "-> [return: bb1, unwind continue];")
        with self.assertRaisesRegex(ValueError, "not the selected typed callback"):
            v28.ready_references("api", {ROOT: mir(line)}, "selected()")

    def test_unclassified_pointer_reification_fails(self) -> None:
        line = "    _4 = auth_foundation_authorization_ready_decision::authorize as *const ();"
        with self.assertRaisesRegex(ValueError, "not the selected typed callback"):
            v28.ready_references("api", {ROOT: mir(line)}, "selected()")

    def test_missing_reference_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "reference count changed"):
            v28.ready_references("api", {ROOT: mir("    return;")}, "selected()")

    def test_compiled_direct_bypass_fails(self) -> None:
        hostile = compiled_mir(
            "fn authorize() {}\n"
            "fn selected() { auth_foundation_authorization_ready_decision::authorize(); }\n"
            "fn main() { selected(); }\n")
        self.assertIn(v28.READY_SYMBOL + "()", hostile)
        with self.assertRaisesRegex(ValueError, "not the selected typed callback"):
            v28.ready_references("api", {ROOT: hostile},
                                 next(name for name in v28.v27.v5.functions(hostile)
                                      if name.startswith("selected(")))

    def test_compiled_cfg_only_bypass_fails(self) -> None:
        hostile = compiled_mir(
            "fn authorize() {}\n"
            "fn selected() {\n"
            "    #[cfg(alternate)]\n"
            "    auth_foundation_authorization_ready_decision::authorize();\n}\n"
            "fn main() { selected(); }\n", alternate=True)
        self.assertIn(v28.READY_SYMBOL + "()", hostile)
        with self.assertRaisesRegex(ValueError, "not the selected typed callback"):
            v28.ready_references("api", {ROOT: hostile},
                                 next(name for name in v28.v27.v5.functions(hostile)
                                      if name.startswith("selected(")))

    def test_compiled_function_pointer_bypass_fails(self) -> None:
        hostile = compiled_mir(
            "fn authorize() {}\n"
            "fn selected() {\n"
            "    let policy: fn() = auth_foundation_authorization_ready_decision::authorize;\n"
            "    policy();\n}\n"
            "fn main() { selected(); }\n")
        self.assertIn(v28.READY_SYMBOL + " as fn()", hostile)
        with self.assertRaisesRegex(ValueError, "not the selected typed callback"):
            v28.ready_references("api", {ROOT: hostile},
                                 next(name for name in v28.v27.v5.functions(hostile)
                                      if name.startswith("selected(")))


if __name__ == "__main__":
    unittest.main()
