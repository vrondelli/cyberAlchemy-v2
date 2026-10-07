#!/usr/bin/env python3
"""Hostile standalone-MIR fixtures for V42; same-build replay runs separately."""

import importlib.util
import pathlib
import re
import subprocess
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-bridge-deny-mapping-v42.py")
SPEC = importlib.util.spec_from_file_location("auth_v42_under_test", SOURCE)
assert SPEC and SPEC.loader
v42 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v42)


def compiled_root(root):
    directory, crate, target = v42.v5.ROOTS[root]
    with tempfile.TemporaryDirectory(prefix=f"auth-v42-unit-{root}-") as temporary:
        target_dir = pathlib.Path(temporary)
        command = [str(v42.v5.TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                   "--target-dir", str(target_dir), "--manifest-path",
                   str(v42.v5.IMPL / directory / "Cargo.toml"), target,
                   "--", "--emit=mir"]
        result = subprocess.run(command, cwd=v42.v5.ROOT, capture_output=True,
                                text=True, timeout=600, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-1600:])
        candidates = list((target_dir / "debug/deps").glob(crate + "-*.mir"))
        if len(candidates) != 1:
            raise AssertionError("selected standalone MIR ambiguous")
        return candidates[0].read_text()


class V42ParserTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tags = v42.enum_tags()
        cls.prototype = compiled_root("prototype")
        cls.https = compiled_root("https")
        cls.tenant = compiled_root("tenant")

    def test_prototype_false_and_main_deny(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        self.assertTrue(result["selected_local_mir_gate_deny_maps_false"])
        self.assertFalse(result["cross_body_gate_deny_to_root_proven"])
        self.assertIn("false_json_block", result["output"])

    def test_variant_authority_hash_differs_from_baseline(self):
        marked = v42.enum_tags("marked")
        self.assertNotEqual(marked["authority_baseline_source_sha256"],
                            marked["authority_variant_source_sha256"])
        self.assertEqual(marked["outcome"], self.tags["outcome"])

    def test_altered_enum_declaration_rejected(self):
        authority = (v42.v40.v29.ORIGINAL_IMPL / v42.v40.AUTHORITY).read_text()
        state = (v42.v40.v29.ORIGINAL_IMPL / v42.STATE_SOURCE).read_text()
        mutant = authority.replace("    Denied,\n", "    Denied = 7,\n", 1)
        self.assertNotEqual(mutant, authority)
        with self.assertRaisesRegex(ValueError, "variant order changed"):
            v42.parse_enum_tags(mutant, state)

    def test_mismatched_variant_or_state_hash_rejected(self):
        tags = v42.enum_tags("marked")
        mapping = {"enum_source_sha256": {
            "authority_baseline": tags["authority_baseline_source_sha256"],
            "authority_variant": tags["authority_variant_source_sha256"],
            "state_model": tags["state_source_sha256"]}}
        row = {"source_sha256": {v42.v40.AUTHORITY: tags["authority_variant_source_sha256"]},
               "selected_mir_inspection": {"v42_bridge_mapping": {"variant": "marked"}}}
        before = {v42.v40.AUTHORITY: tags["authority_baseline_source_sha256"],
                  v42.STATE_SOURCE: tags["state_source_sha256"]}
        v42.check_variant_source_binding("marked", mapping, row, before)
        bad_row = {**row, "source_sha256": {v42.v40.AUTHORITY: "0" * 64}}
        with self.assertRaisesRegex(ValueError, "source/same-build binding"):
            v42.check_variant_source_binding("marked", mapping, bad_row, before)
        bad_before = {**before, v42.STATE_SOURCE: "1" * 64}
        with self.assertRaisesRegex(ValueError, "source/same-build binding"):
            v42.check_variant_source_binding("marked", mapping, row, bad_before)

    def test_tenant_false_collect_and_empty_error_fallback(self):
        result = v42.root_mapping("tenant", self.tenant, self.tags)
        self.assertEqual(result["boolean_local"], "_0")
        self.assertIn("collect_block", result["output"])
        self.assertTrue(result["output"]["whole_evaluation_error_yields_empty_vec_by_std_semantics"])

    def test_https_false_and_main_deny(self):
        result = v42.root_mapping("https", self.https, self.tags)
        self.assertTrue(result["selected_local_mir_gate_deny_maps_false"])
        self.assertIn("false_json_block", result["output"])

    def test_wrong_ready_tag_rejected(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        original = "switchInt(move _235) -> [3: " + result["ready_arm"]
        self.assertIn(original, self.prototype)
        mutant = self.prototype.replace(original, original.replace("[3:", "[2:"), 1)
        with self.assertRaisesRegex(ValueError, "AdmissionOutcome Ready/DENY"):
            v42.root_mapping("prototype", mutant, self.tags)

    def test_result_discriminant_wrong_local_rejected(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        original = f"{result['result_discriminant']} = discriminant({result['service_result_local']});"
        self.assertIn(original, self.prototype)
        mutant = self.prototype.replace(original,
                                        original.replace(result["service_result_local"], "_999"), 1)
        with self.assertRaisesRegex(ValueError, "discriminant/switch def-use"):
            v42.root_mapping("prototype", mutant, self.tags)

    def test_false_arm_flipped_true_rejected(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        original = f"    {result['false_arm']}: {{\n        {result['boolean_local']} = const false;"
        self.assertIn(original, self.prototype)
        mutant = self.prototype.replace(original, original.replace("const false", "const true"), 1)
        with self.assertRaisesRegex(ValueError, "true/false merge"):
            v42.root_mapping("prototype", mutant, self.tags)

    def test_binary_otherwise_true_path_rejected(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        original = (f"switchInt(move {result['decision_discriminant']}) -> "
                    f"[0: {result['true_arm']}, 1: {result['false_arm']}, otherwise: bb6]")
        self.assertIn(original, self.prototype)
        mutant = self.prototype.replace(original,
                                        original.replace("otherwise: bb6]",
                                                         f"otherwise: {result['true_arm']}]"), 1)
        with self.assertRaisesRegex(ValueError, "otherwise arm not unreachable"):
            v42.root_mapping("prototype", mutant, self.tags)

    def test_swapped_allow_deny_tags_rejected(self):
        tags = dict(self.tags)
        tags["decision"] = {"Allow": 1, "Deny": 0}
        with self.assertRaisesRegex(ValueError, "non-ALLOW arms"):
            v42.root_mapping("prototype", self.prototype, tags)

    def test_main_false_output_flipped_allow_rejected(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        deny = result["output"]["false_json_block"]
        original = f"    {deny}: {{\n        _7 = const \"{{\\\"decision\\\":\\\"DENY\\\"}}\";"
        self.assertIn(original, self.prototype)
        mutant = self.prototype.replace(original, original.replace("DENY", "ALLOW"), 1)
        with self.assertRaisesRegex(ValueError, "terminal JSON"):
            v42.root_mapping("prototype", mutant, self.tags)

    def test_main_false_output_rebound_after_selection_rejected(self):
        result = v42.root_mapping("prototype", self.prototype, self.tags)
        deny = result["output"]["false_json_block"]
        original = f"    {deny}: {{\n        _7 = const \"{{\\\"decision\\\":\\\"DENY\\\"}}\";"
        self.assertIn(original, self.prototype)
        mutant = self.prototype.replace(
            original, original + "\n        _7 = const \"{\\\"decision\\\":\\\"ALLOW\\\"}\";", 1)
        with self.assertRaisesRegex(ValueError, "local rebound"):
            v42.root_mapping("prototype", mutant, self.tags)

    def test_tenant_collect_wrong_vector_rejected(self):
        result = v42.root_mapping("tenant", self.tenant, self.tags)
        block = result["output"]["collect_ok_block"]
        original = f"    {block}: {{\n        _0 = Result::<Vec<bool>, Box<dyn StdError>>::Ok(move _402);"
        self.assertIn(original, self.tenant)
        mutant = self.tenant.replace(original, original.replace("move _402", "move _403"), 1)
        with self.assertRaisesRegex(ValueError, "collected bool vector to Ok"):
            v42.root_mapping("tenant", mutant, self.tags)

    def test_tenant_whole_error_default_removed_rejected(self):
        original = "Result::<Vec<bool>, Box<dyn StdError>>::unwrap_or_default"
        self.assertIn(original, self.tenant)
        mutant = self.tenant.replace(original, "Result::<Vec<bool>, Box<dyn StdError>>::unwrap", 1)
        with self.assertRaisesRegex(ValueError, "whole-error empty-vector fallback"):
            v42.root_mapping("tenant", mutant, self.tags)

    def test_tenant_json_reads_wrong_vector_rejected(self):
        result = v42.root_mapping("tenant", self.tenant, self.tags)
        original = "_14 = &_15;\n        _13 = to_value::<&Vec<bool>>(move _14)"
        self.assertIn(original, self.tenant)
        mutant = self.tenant.replace(original,
                                     original.replace("&_15", "&_16"), 1)
        with self.assertRaisesRegex(ValueError, "JSON vector output"):
            v42.root_mapping("tenant", mutant, self.tags)


if __name__ == "__main__":
    unittest.main()
