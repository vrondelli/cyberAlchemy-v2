#!/usr/bin/env python3
"""Fast hostile normal-library MIR/source fixtures for V44's inner closure."""

import importlib.util
import pathlib
import subprocess
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-api-inner-deny-mapping-v44.py")
SPEC = importlib.util.spec_from_file_location("auth_v44_under_test", SOURCE)
assert SPEC and SPEC.loader
v44 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v44)


def compiled_api_library():
    with tempfile.TemporaryDirectory(prefix="auth-v44-unit-api-") as temporary:
        target = pathlib.Path(temporary)
        command = [str(v44.v5.TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                   "--target-dir", str(target), "--manifest-path",
                   str(v44.v5.IMPL / "authorization-api/Cargo.toml"),
                   "--lib", "--", "--emit=mir"]
        result = subprocess.run(command, cwd=v44.v5.ROOT, capture_output=True,
                                text=True, timeout=600, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-1500:])
        candidates = list((target / "debug/deps").glob(
            "auth_foundation_authorization_api-*.mir"))
        if len(candidates) != 1:
            raise AssertionError("selected API library MIR ambiguous")
        return candidates[0].read_text()


class V44InnerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mir = compiled_api_library()
        cls.tags = v44.v42.enum_tags("clean")
        cls.result = v44.inspect_inner(cls.mir, cls.tags)

    def test_non_test_source_and_concrete_inner_mir(self):
        source = (v44.v40.v29.ORIGINAL_IMPL / v44.API).read_text()
        v44.source_cfg(source)
        self.assertTrue(self.result["err_and_nonready_return_deny"])
        self.assertTrue(self.result["only_ready_copies_decision"])
        self.assertFalse(self.result["cross_body_service_return_proven"])

    def test_unit_test_cfg_substitution_rejected(self):
        source = (v44.v40.v29.ORIGINAL_IMPL / v44.API).read_text()
        selected = "#[cfg(not(test))]\n            let outcome = catch_unwind"
        self.assertIn(selected, source)
        mutant = source.replace(selected,
                                "#[cfg(test)]\n            let outcome = catch_unwind", 1)
        with self.assertRaisesRegex(ValueError, "source/cfg changed"):
            v44.source_cfg(mutant)

    def test_wrong_service_result_discriminant_rejected(self):
        local = self.result["call_result_local"]
        old = f"discriminant({local})"
        self.assertIn(old, self.mir)
        mutant = self.mir.replace(old, "discriminant(_999)", 1)
        with self.assertRaisesRegex(ValueError, "discriminant/switch"):
            v44.inspect_inner(mutant, self.tags)

    def test_ready_tag_swap_rejected(self):
        ready = self.result["outcome_ready_arm"]
        old = "switchInt(move " + self.result["outcome_discriminant"] + ") -> [3: " + ready
        self.assertIn(old, self.mir)
        mutant = self.mir.replace(old, old.replace("[3:", "[0:"), 1)
        with self.assertRaisesRegex(ValueError, "Ready/non-READY"):
            v44.inspect_inner(mutant, self.tags)

    def test_nonready_deny_flipped_allow_rejected(self):
        arm = self.result["gate_denied_uses_nonready_arm"]
        old = f"    {arm}: {{\n        _0 = Deny;"
        self.assertIn(old, self.mir)
        mutant = self.mir.replace(old, old.replace("Deny", "Allow"), 1)
        with self.assertRaisesRegex(ValueError, "DENY constructor"):
            v44.inspect_inner(mutant, self.tags)

    def test_unknown_result_arm_to_ready_rejected(self):
        old = (f"switchInt(move {self.result['result_discriminant']}) -> "
               f"[0: {self.result['result_ok_arm']}, "
               f"1: {self.result['result_error_arm']}, otherwise: bb6]")
        self.assertIn(old, self.mir)
        mutant = self.mir.replace(old,
                                  old.replace("otherwise: bb6]",
                                              "otherwise: " +
                                              self.result["outcome_ready_arm"] + "]"), 1)
        with self.assertRaisesRegex(ValueError, "unknown branch"):
            v44.inspect_inner(mutant, self.tags)

    def test_terminal_return_overwrite_rejected(self):
        end = self.result["denied_return_blocks"][0]
        old = f"    {end}: {{\n        return;"
        self.assertIn(old, self.mir)
        mutant = self.mir.replace(old,
                                  f"    {end}: {{\n        _0 = Allow;\n        return;", 1)
        with self.assertRaisesRegex(ValueError, "alternate decision return"):
            v44.inspect_inner(mutant, self.tags)

    def test_ready_payload_alias_rejected(self):
        local = self.result["ready_payload_local"]
        old = f"_0 = copy {local};"
        self.assertIn(old, self.mir)
        mutant = self.mir.replace(old, "_0 = copy _999;", 1)
        with self.assertRaisesRegex(ValueError, "only READY may copy"):
            v44.inspect_inner(mutant, self.tags)


if __name__ == "__main__":
    unittest.main()
