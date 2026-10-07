#!/usr/bin/env python3
"""Compiled hostile controls for bounded V11b tenant result projection."""

from __future__ import annotations

import importlib.util
import re
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_tenant_projection_v11b", CASE / "auth-v4b-tenant-projection-v11b.py")
assert SPEC and SPEC.loader
verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verifier)
IMPL = verifier.v7.IMPL
TOOLCHAIN = ROOT / "tools/toolchain/run"
SOURCE = IMPL / "tenant-bridge/src/main.rs"
MANIFEST = IMPL / "tenant-bridge/Cargo.toml"


class TenantProjectionV11b(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.selected = None
        inventory, _ = verifier.v7.current_inventory()
        manifest = verifier.v6.ROOT_MANIFESTS[verifier.TENANT]
        members = sorted(inventory["selected_root_package_manifests"][verifier.TENANT])

        def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
            cls.selected = mir[manifest]
            return {"evaluate": verifier.evaluate_projection(cls.selected),
                    "main": verifier.main_projection(cls.selected)}

        cls.capture = tempfile.TemporaryDirectory(prefix="auth-v4b-v11b-current-")
        cls.current = verifier.v7.capture_root(verifier.TENANT, manifest, members,
                                               Path(cls.capture.name), inventory,
                                               mir_inspector=inspect)
        cls.fixture = tempfile.TemporaryDirectory(prefix="auth-v4b-v11b-mutant-")
        cls.fixture_path = Path(cls.fixture.name)
        (cls.fixture_path / "src").mkdir()
        (cls.fixture_path / "Cargo.toml").write_text(
            MANIFEST.read_text().replace('path = "../', f'path = "{IMPL}/'))

    @classmethod
    def tearDownClass(cls) -> None:
        if hasattr(cls, "fixture"):
            cls.fixture.cleanup()
        if hasattr(cls, "capture"):
            cls.capture.cleanup()

    def compile_mutant(self, source: str) -> str:
        (self.fixture_path / "src/main.rs").write_text(source)
        command = [str(TOOLCHAIN), "cargo", "rustc", "--offline",
                   "--manifest-path", str(self.fixture_path / "Cargo.toml"),
                   "--target-dir", str(self.fixture_path / "target"),
                   "--bin=auth-tenant-bridge", "--", "--emit=mir"]
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                timeout=300, check=False)
        self.assertEqual(result.returncode, 0, result.stderr[-2500:])
        candidates = list((self.fixture_path / "target/debug/deps").glob(
            "auth_tenant_bridge-*.mir"))
        self.assertEqual(len(candidates), 1)
        return candidates[0].read_text()

    def test_current_tenant_vector_and_main_projection_pass_bounded(self) -> None:
        self.assertIsNotNone(self.selected)
        result = self.current["selected_graph_inspection"]
        self.assertEqual(result["evaluate"]["selected_vector_normal_mir_provenance"], "pass")
        self.assertEqual(result["evaluate"]["early_false_vector_count"], 7)
        self.assertEqual(result["main"]["selected_json_print_argument_provenance"], "pass")

    def test_compiled_early_deny_true_vector_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "vec![false; r.permissions.len()]"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor, "vec![true; r.permissions.len()]", 1))
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "early deny vector is not all false"):
            verifier.evaluate_projection(mir)

    def test_compiled_deny_length_rewrite_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "let deny = || vec![false; r.permissions.len()];"
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            "let deny = || { let mut length = r.permissions.len(); "
            "if length > 0 { length -= 1; } vec![false; length] };", 1)
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "tenant deny permission length|tenant deny vector|deny helper CFG"):
            verifier.evaluate_projection(mir)

    def test_compiled_reverse_order_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "        .enumerate()\n        .map(|(i, _)| {"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "        .enumerate()\n        .rev()\n        .map(|(i, _)| {", 1))
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "selected collect|selected collection order changed"):
            verifier.evaluate_projection(mir)

    def test_compiled_mapped_iterator_consumed_before_collect_fails(self) -> None:
        source = SOURCE.read_text()
        start = "    Ok(r.permissions\n"
        end = "        .collect())\n}"
        self.assertIn(start, source)
        self.assertIn(end, source)
        mutant = source.replace(start, "    let mut mapped = r.permissions\n", 1).replace(
            end, "        ;\n    let _ = mapped.next();\n    Ok(mapped.collect())\n}", 1)
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        self.assertIn("::collect::<Vec<bool>>", mir)
        with self.assertRaisesRegex(ValueError, "selected map/collect path changed"):
            verifier.evaluate_projection(mir)

    def test_compiled_alternate_permission_vector_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "    Ok(r.permissions\n"
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            "    let fake_permissions: Vec<Permission> = Vec::new();\n"
            "    Ok(fake_permissions\n", 1)
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "iterator input is not r.permissions"):
            verifier.evaluate_projection(mir)

    def test_compiled_true_error_default_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "evaluate().unwrap_or_default()"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "evaluate().unwrap_or_else(|_| vec![true])", 1))
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "tenant main default projection"):
            verifier.main_projection(mir)

    def test_compiled_wrong_json_key_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = '{"decisions":evaluate().unwrap_or_default()}'
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            '{"wrong_key":evaluate().unwrap_or_default()}', 1))
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "tenant JSON decisions key"):
            verifier.main_projection(mir)

    def test_compiled_early_print_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "fn main() {\n    println!("
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            'fn main() {\n    if std::env::var_os("AUTH_BYPASS").is_some() {\n'
            '        println!("{}", "ALLOW");\n'
            '    }\n    println!(', 1)
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "alternate output site"):
            verifier.main_projection(mir)

    def test_compiled_early_normal_return_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "fn main() {\n    println!("
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            'fn main() {\n    if std::env::var_os("AUTH_BYPASS").is_some() { return; }\n    println!(', 1)
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "print-to-return|normal return classification"):
            verifier.main_projection(mir)

    def test_compiled_json_object_clear_after_insert_fails(self) -> None:
        source = SOURCE.read_text()
        prefix, _ = source.split("fn main()", 1)
        mutant = prefix + '''fn main() {
    let mut object = serde_json::json!({"decisions":evaluate().unwrap_or_default()});
    object.as_object_mut().unwrap().clear();
    println!("{}", object);
}
'''
        mir = self.compile_mutant(mutant)
        self.assertEqual(verifier.v10.root_output_provenance("tenant", mir)[
            "normal_path_provenance"], "pass")
        self.assertIn("serde_json::Map::<std::string::String, serde_json::Value>::insert", mir)
        self.assertIn("Object(move", mir)
        with self.assertRaisesRegex(ValueError,
                                    "JSON object not selected for display"):
            verifier.main_projection(mir)

    def test_mir_parser_extra_mapped_iterator_use_fails(self) -> None:
        # Parser-unit sensitivity only: the compiled next() mutant above
        # changes the call edge and fails even before this exclusive-use guard.
        mir = self.selected
        source = re.search(r"(?m)^\s*(_\d+) = <std::iter::Enumerate<[^\n]+::map::<bool,[^\n]+$",
                           verifier.v5.functions(mir)[
                               "evaluate() -> Result<Vec<bool>, Box<dyn StdError>>"])
        self.assertIsNotNone(source)
        mapped = source.group(1)
        collect = re.search(
            rf"(?m)^\s*_\d+ = [^\n]+::collect::<Vec<bool>>\(move {re.escape(mapped)}\) -> [^\n]+$",
            mir)
        self.assertIsNotNone(collect)
        changed = mir.replace(collect.group(0),
                              f"        _9000 = &mut {mapped};\n" + collect.group(0), 1)
        with self.assertRaisesRegex(ValueError, "selected mapped iterator.*extra normal use"):
            verifier.evaluate_projection(changed)

    def test_v10_selected_closure_identity_is_required(self) -> None:
        # Boundary unit: a distinct V10-proved closure cannot authorize this map.
        with patch.object(verifier.v10, "root_output_provenance",
                          return_value={"function": "evaluate::{closure#99}() -> bool"}):
            with self.assertRaisesRegex(ValueError,
                                        "selected map closure is not V10-checked"):
                verifier.evaluate_projection(self.selected)

    def test_mir_parser_extra_selected_object_borrow_fails(self) -> None:
        # Parser-unit sensitivity only; the compiled clear() mutant above
        # fails earlier when the selected display path is reshaped.
        mir = self.selected
        main = verifier.v5.functions(mir)["main() -> ()"]
        source = re.search(r"(?m)^\s*(_\d+) = Object\(move _\d+\);$", main)
        self.assertIsNotNone(source)
        selected_object = source.group(1)
        changed = mir.replace(source.group(0),
                              source.group(0) + f"\n        _9000 = &mut {selected_object};", 1)
        with self.assertRaisesRegex(ValueError, "selected JSON object.*extra normal use"):
            verifier.main_projection(changed)


if __name__ == "__main__":
    unittest.main()
