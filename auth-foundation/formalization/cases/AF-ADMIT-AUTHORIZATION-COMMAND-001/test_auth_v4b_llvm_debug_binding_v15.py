#!/usr/bin/env python3
"""Hostile controls for attached LLVM debug/source endpoint bindings."""

from __future__ import annotations

import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_llvm_debug_binding_v15", CASE / "auth-v4b-llvm-debug-binding-v15.py")
assert SPEC and SPEC.loader
v15 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v15)


class LlvmDebugBindingV15(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="auth-v15-debug-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.package = self.root / "sample"
        self.source = self.package / "src/lib.rs"
        self.source.parent.mkdir(parents=True)
        self.source.write_text("pub fn authorize() {}\n")
        self.manifest = "sample/Cargo.toml"
        self.endpoint = "sample-endpoint"
        self.endpoint_patch = patch.dict(v15.ENDPOINTS, {
            self.endpoint: (self.manifest, "sample/src/lib.rs")}, clear=True)
        self.endpoint_patch.start()
        self.addCleanup(self.endpoint_patch.stop)
        self.root_patch = patch.object(v15, "IMPL", self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)

    def llvm(self, *, checksum: str | None = None, source_line: int = 1,
             attached: bool = True, linkage_name: str = "real",
             duplicate_subprogram: bool = False) -> str:
        digest = checksum or hashlib.md5(self.source.read_bytes()).hexdigest()
        metadata = (f'!1 = !DIFile(filename: "src/lib.rs", directory: "{self.package}", '
                    f'checksumkind: CSK_MD5, checksum: "{digest}")\n'
                    f'!10 = distinct !DISubprogram(name: "authorize", '
                    f'linkageName: "{linkage_name}", scope: !2, file: !1, '
                    f'line: {source_line}, type: !3, spFlags: DISPFlagDefinition)\n')
        if duplicate_subprogram:
            metadata += metadata.splitlines()[1].replace("!10 =", "!11 =") + "\n"
        return (f'define internal void @real()'
                f'{" !dbg !10" if attached else ""} {{\nentry:\n  ret void\n}}\n'
                + metadata)

    def bind(self, source: str, *, extra_modules: dict[str, str] | None = None) -> dict:
        llvm = {self.manifest: source, **(extra_modules or {})}
        return v15.bind_endpoint(self.endpoint, llvm, v15.definitions(llvm))

    def test_attached_exact_symbol_source_and_checksum(self) -> None:
        bound = self.bind(self.llvm())
        self.assertEqual(bound["symbol_hex"], b"real".hex())
        self.assertEqual(bound["source_line"], 1)
        self.assertEqual(bound["definition_linkage"], "internal")
        self.assertEqual(bound["binding"], "attached-debug-source-definition-candidate")

    def test_same_short_name_elsewhere_does_not_replace_exact_binding(self) -> None:
        other = ('define internal void @other() !dbg !20 {\nentry:\n  ret void\n}\n'
                 '!2 = !DIFile(filename: "other.rs", directory: "/elsewhere", '
                 'checksumkind: CSK_MD5, checksum: "00000000000000000000000000000000")\n'
                 '!20 = distinct !DISubprogram(name: "authorize", '
                 'linkageName: "other", scope: !3, file: !2, line: 1, '
                 'type: !4, spFlags: DISPFlagDefinition)\n')
        bound = self.bind(self.llvm() + other)
        self.assertEqual(bound["symbol_hex"], b"real".hex())

    def test_wrong_checksum_line_linkage_or_attachment_fails_closed(self) -> None:
        cases = [
            (self.llvm(checksum="0" * 32), "DIFile checksum"),
            (self.llvm(source_line=2), "debug subprogram ambiguous"),
            (self.llvm(linkage_name="wrong"), "attached unique LLVM definition"),
            (self.llvm(attached=False), "attached unique LLVM definition"),
            (self.llvm(duplicate_subprogram=True), "debug subprogram ambiguous"),
        ]
        for source, reason in cases:
            with self.subTest(reason=reason):
                with self.assertRaisesRegex(ValueError, reason):
                    self.bind(source)

    def test_duplicate_symbol_definition_in_another_module_fails_closed(self) -> None:
        duplicate = "define void @real() {\nentry:\n  ret void\n}\n"
        with self.assertRaisesRegex(ValueError, "attached unique LLVM definition"):
            self.bind(self.llvm(), extra_modules={"other/Cargo.toml": duplicate})

    def test_missing_selected_module_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "selected LLVM module missing"):
            v15.bind_endpoint(self.endpoint, {}, {})

    def test_other_public_policy_function_binds_exact_definition(self) -> None:
        self.source.write_text("pub fn authorize() {}\npub fn allow_iff() -> bool { true }\n")
        digest = hashlib.md5(self.source.read_bytes()).hexdigest()
        source = ("define void @real() !dbg !10 {\nentry:\n  ret void\n}\n"
                  "define i1 @helper() !dbg !11 {\nentry:\n  ret i1 true\n}\n"
                  f'!1 = !DIFile(filename: "src/lib.rs", directory: "{self.package}", '
                  f'checksumkind: CSK_MD5, checksum: "{digest}")\n'
                  '!10 = distinct !DISubprogram(name: "authorize", linkageName: "real", '
                  'scope: !2, file: !1, line: 1, type: !3)\n'
                  '!11 = distinct !DISubprogram(name: "allow_iff", linkageName: "helper", '
                  'scope: !2, file: !1, line: 2, type: !3)\n')
        llvm = {self.manifest: source}
        bound = v15.bind_public_function("helper", "allow_iff", self.manifest,
                                          "sample/src/lib.rs", llvm, v15.definitions(llvm))
        self.assertEqual(bound["symbol_hex"], b"helper".hex())
        self.assertEqual(bound["source_line"], 2)
        self.assertEqual(bound["function_name"], "allow_iff")

    def test_direct_weak_alias_and_indirect_sites_keep_v13_classification(self) -> None:
        def inspected(source: str) -> dict:
            return v15.inspect("sample", {self.manifest: "fn sample() {}"},
                               {self.manifest: source}, {self.manifest: {
                                   "llvm_sha256": hashlib.sha256(source.encode()).hexdigest()}})

        direct = self.llvm().replace(
            "!1 = !DIFile",
            "define void @caller() {\nentry:\n  call void @real()\n  ret void\n}\n"
            "!1 = !DIFile", 1)
        result = inspected(direct)
        self.assertEqual(result["exact_symbol_candidate_counts"], {self.endpoint: 1})
        self.assertEqual(result["exact_symbol_call_candidates"][self.endpoint][0]["classification"],
                         "same-module-noninterposable-direct")
        self.assertFalse(result["endpoint_set_closed"])

        weak = direct.replace("define internal void @real", "define linkonce_odr void @real", 1)
        result = inspected(weak)
        self.assertEqual(result["exact_symbol_call_candidates"][self.endpoint][0]["classification"],
                         "same-symbol-local-definition-candidate")
        self.assertEqual(result["linker_target_resolution"], "not_established")

        opaque = self.llvm().replace(
            "!1 = !DIFile",
            "@redirect = alias void (), ptr @real\n"
            "define void @caller(ptr %target) {\nentry:\n"
            "  call void @redirect()\n  call void %target()\n  ret void\n}\n"
            "!1 = !DIFile", 1)
        result = inspected(opaque)
        self.assertEqual(result["exact_symbol_candidate_counts"], {self.endpoint: 0})
        self.assertEqual(result["llvm_site_classification_counts"],
                         {"alias-unresolved": 1, "indirect": 1})
        self.assertFalse(result["all_path_ready_dominance"])


if __name__ == "__main__":
    unittest.main()
