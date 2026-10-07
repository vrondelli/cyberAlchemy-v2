#!/usr/bin/env python3
"""Focused opt-in LLVM capture and exact-symbol candidate controls."""

from __future__ import annotations

import hashlib
import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_llvm_direct_target_v13", CASE / "auth-v4b-llvm-direct-target-v13.py")
assert SPEC and SPEC.loader
v13 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v13)


class LlvmDirectTargetV13(unittest.TestCase):
    def inspect(self, source: str) -> dict:
        manifest = "sample/Cargo.toml"
        return v13.inspect("sample", {manifest: "fn caller() {}"},
                           {manifest: source},
                           {manifest: {"llvm_sha256": hashlib.sha256(source.encode()).hexdigest()}})

    def test_exact_symbol_quoted_invoke_and_noninterposable_subset(self) -> None:
        result = self.inspect('''define internal void @"a\\20b"() {
entry:
  ret void
}
define void @caller() {
entry:
  call void @"a\\20b"()
  invoke void @"a\\20b"() to label %done unwind label %failed
}
''')
        self.assertEqual(result["call_like_site_count"], 2)
        self.assertEqual(result["classification_counts"],
                         {"same-module-noninterposable-direct": 2})
        self.assertEqual(result["sites"][0]["target_symbol_hex"], b"a b".hex())
        self.assertFalse(result["endpoint_set_closed"])

    def test_weak_available_external_alias_external_indirect_and_unparsed_stay_open(self) -> None:
        result = self.inspect('''@redirect = alias void (), ptr @weak
declare void @outside()
define linkonce_odr void @weak() {
entry:
  ret void
}
define available_externally void @available() {
entry:
  ret void
}
define void @caller(ptr %ptr) {
entry:
  call void @weak()
  call void @available()
  call void @redirect()
  call void @outside()
  call void %ptr()
  call void bitcast (ptr @weak to ptr)()
  call void asm sideeffect "call @weak()", ""()
  callbr void asm sideeffect "", ""() to label %done [label %other]
  ret void ; call void @weak()
}
''')
        self.assertEqual(result["classification_counts"], {
            "same-symbol-local-definition-candidate": 2,
            "alias-unresolved": 1, "declaration-or-external-unresolved": 1,
            "indirect": 1, "unparsed-or-callbr": 3})
        self.assertFalse(result["all_path_ready_dominance"])

    def test_duplicate_same_symbol_does_not_resolve(self) -> None:
        manifest_a, manifest_b = "a/Cargo.toml", "b/Cargo.toml"
        a = "define void @duplicate() {\nentry:\n  ret void\n}\n"
        b = "define void @duplicate() {\nentry:\n  ret void\n}\n" \
            "define void @caller() {\nentry:\n  call void @duplicate()\n}\n"
        result = v13.inspect("sample", {manifest_a: "", manifest_b: ""},
                             {manifest_a: a, manifest_b: b},
                             {manifest_a: {"llvm_sha256": hashlib.sha256(a.encode()).hexdigest()},
                              manifest_b: {"llvm_sha256": hashlib.sha256(b.encode()).hexdigest()}})
        self.assertEqual(result["classification_counts"],
                         {"duplicate-definition-unresolved": 1})

    def test_malformed_header_and_changed_sidecar_hash_fail_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "unparsed LLVM header"):
            self.inspect("define void malformed() {\n}\n")
        with self.assertRaisesRegex(ValueError, "LLVM sidecar hash mismatch"):
            v13.inspect("sample", {"a/Cargo.toml": ""},
                        {"a/Cargo.toml": "define void @f() {\n}\n"},
                        {"a/Cargo.toml": {"llvm_sha256": "wrong"}})

    def test_sidecar_binding_rejects_extra_codegen_unit_file(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v13-sidecar-test-") as temporary:
            target = Path(temporary)
            deps = target / "debug/deps"
            deps.mkdir(parents=True)
            mir = deps / "sample-1234567890abcdef.mir"
            mir.write_text("fn f() {}\n")
            (deps / "sample-1234567890abcdef.ll").write_text("define void @f() {\n}\n")
            expected = {"sample/Cargo.toml": {"crate": "sample",
                                               "package_id": "selected-package"}}
            identities = {"sample/Cargo.toml": {
                "package_id": "selected-package",
                "mir_sha256": hashlib.sha256(mir.read_bytes()).hexdigest()}}
            selected_row = {"package_id": "selected-package",
                            "manifest_path": str(v13.v7.IMPL / "sample/Cargo.toml"),
                            "target": {"name": "sample", "kind": ["lib"]},
                            "filenames": [str(deps / "libsample-1234567890abcdef.rlib")]}
            rows = [selected_row]
            llvm, augmented = v13.v7.bind_llvm_sidecars(rows, expected, target, identities)
            self.assertEqual(set(llvm), set(expected))
            self.assertEqual(len(augmented["sample/Cargo.toml"]["llvm_sha256"]), 64)
            (deps / "external-4567890abcdef123.ll").write_text("known external output\n")
            external_row = {"package_id": "external-package",
                            "manifest_path": "/registry/external/Cargo.toml",
                            "target": {"name": "external", "kind": ["lib"]},
                            "filenames": [str(deps / "libexternal-4567890abcdef123.rlib")]}
            rows.append(external_row)
            v13.v7.bind_llvm_sidecars(rows, expected, target, identities)
            with self.assertRaisesRegex(ValueError, "ambiguous"):
                v13.v7.bind_llvm_sidecars([*rows, dict(external_row)],
                                           expected, target, identities)
            (deps / "sample-1234567890abcdef.0.ll").write_text("extra codegen unit\n")
            with self.assertRaisesRegex(ValueError, "unattributed"):
                v13.v7.bind_llvm_sidecars(rows, expected, target, identities)
            (deps / "sample-1234567890abcdef.0.ll").unlink()
            (target / "debug/sample-567890abcdef1234.ll").write_text("extra root-level output\n")
            with self.assertRaisesRegex(ValueError, "unattributed"):
                v13.v7.bind_llvm_sidecars(rows, expected, target, identities)
            (target / "debug/sample-567890abcdef1234.ll").unlink()
            (target / "debug/sample.ll").write_text("unprefixed extra output\n")
            with self.assertRaisesRegex(ValueError, "unattributed"):
                v13.v7.bind_llvm_sidecars(rows, expected, target, identities)
            (target / "debug/sample.ll").unlink()
            (deps / "unknown-9999.ll").write_text("unknown output\n")
            with self.assertRaisesRegex(ValueError, "unattributed"):
                v13.v7.bind_llvm_sidecars(rows, expected, target, identities)

    def test_unhashed_selected_binary_uses_paired_mir_and_cargo_identity(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v13-bin-test-") as temporary:
            target = Path(temporary)
            deps = target / "debug/deps"
            deps.mkdir(parents=True)
            mir = deps / "sample-1234567890abcdef.mir"
            mir.write_text("fn f() {}\n")
            (deps / "sample-1234567890abcdef.ll").write_text("define void @f() {\n}\n")
            manifest = "sample/Cargo.toml"
            expected = {manifest: {"crate": "sample", "package_id": "selected-package"}}
            identities = {manifest: {"mir_sha256": hashlib.sha256(mir.read_bytes()).hexdigest()}}
            row = {"package_id": "selected-package",
                   "manifest_path": str(v13.v7.IMPL / manifest),
                   "target": {"name": "sample", "kind": ["bin"]},
                   "filenames": [str(target / "debug/sample")]}
            llvm, _ = v13.v7.bind_llvm_sidecars([row], expected, target, identities)
            self.assertEqual(set(llvm), {manifest})
            with self.assertRaisesRegex(ValueError, "selected-local LLVM Cargo row ambiguous"):
                v13.v7.bind_llvm_sidecars([{**row, "package_id": "wrong"}],
                                           expected, target, identities)

    def test_compiled_same_short_name_uses_exact_symbol(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v13-hostile-") as temporary:
            directory = Path(temporary)
            source = directory / "fixture.rs"
            output = directory / "fixture.ll"
            source.write_text('''mod a { #[inline(never)] pub fn authorize() -> u8 { 1 } }
mod b { #[inline(never)] pub fn authorize() -> u8 { 2 } }
#[unsafe(no_mangle)] pub extern "C" fn entry_a() -> u8 { a::authorize() }
#[unsafe(no_mangle)] pub extern "C" fn entry_b() -> u8 { b::authorize() }
''')
            run = subprocess.run([str(v13.v7.TOOLCHAIN), "rustc", "--edition=2024",
                                  "--crate-type=lib", "-Ccodegen-units=1", "-Copt-level=0",
                                  "--emit=llvm-ir", "-o", str(output), str(source)],
                                 capture_output=True, text=True, timeout=60, check=False)
            self.assertEqual(run.returncode, 0, run.stderr)
            result = self.inspect(output.read_text())
            sites = {bytes.fromhex(row["function_symbol_hex"]).decode(): row
                     for row in result["sites"] if
                     bytes.fromhex(row["function_symbol_hex"]).decode() in {"entry_a", "entry_b"}
                     and row["target_symbol_hex"] is not None
                     and "authorize" in bytes.fromhex(row["target_symbol_hex"]).decode()}
            self.assertEqual(set(sites), {"entry_a", "entry_b"})
            self.assertNotEqual(sites["entry_a"]["target_symbol_hex"],
                                sites["entry_b"]["target_symbol_hex"])
            self.assertTrue(all(row["classification"] in {
                "same-symbol-local-definition-candidate",
                "same-module-noninterposable-direct"} for row in sites.values()))


if __name__ == "__main__":
    unittest.main()
