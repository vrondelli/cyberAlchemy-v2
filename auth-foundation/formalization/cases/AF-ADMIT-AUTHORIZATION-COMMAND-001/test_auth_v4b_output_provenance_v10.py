#!/usr/bin/env python3
"""Compiled hostile ALLOW controls for the bounded V10 provenance checker."""

from __future__ import annotations

import importlib.util
import re
import subprocess
import tempfile
import unittest
from pathlib import Path


CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
IMPL = ROOT / "auth-foundation/implementation"
TOOLCHAIN = ROOT / "tools/toolchain/run"
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_output_provenance_v10", CASE / "auth-v4b-output-provenance-v10.py")
assert SPEC and SPEC.loader
verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verifier)


class OutputProvenanceV10(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.current = None

    @classmethod
    def current_mir(cls) -> dict[str, str]:
        if cls.current is None:
            cls.current, _ = verifier.v5.capture_mir()
        return cls.current

    def compile_decision_mutant(self, source: str) -> str:
        manifest = (IMPL / "authorization-ready-decision/Cargo.toml").read_text()
        manifest = manifest.replace('path = "../', f'path = "{IMPL}/')
        with tempfile.TemporaryDirectory(prefix="auth-v4b-v10-decision-mutant-") as temporary:
            path = Path(temporary)
            (path / "src").mkdir()
            (path / "src/lib.rs").write_text(source)
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline",
                       "--manifest-path", str(path / "Cargo.toml"),
                       "--target-dir", str(path / "target"), "--lib", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob(
                "auth_foundation_authorization_ready_decision-*.mir"))
            self.assertEqual(len(candidates), 1)
            return candidates[0].read_text()

    def compile_root_mutant(self, source: str) -> str:
        manifest = (IMPL / "authentication-prototype/bridge/Cargo.toml").read_text()
        manifest = manifest.replace('path = "../../', f'path = "{IMPL}/')
        with tempfile.TemporaryDirectory(prefix="auth-v4b-v10-root-mutant-") as temporary:
            path = Path(temporary)
            (path / "src").mkdir()
            (path / "src/main.rs").write_text(source)
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline",
                       "--manifest-path", str(path / "Cargo.toml"),
                       "--target-dir", str(path / "target"),
                       "--bin=auth-prototype-bridge", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob(
                "auth_prototype_bridge-*.mir"))
            self.assertEqual(len(candidates), 1)
            return candidates[0].read_text()

    def test_current_typed_result_chain_passes_without_full_claim(self) -> None:
        current = self.current_mir()
        decision = verifier.decision_provenance(current["decision"])
        authority = verifier.authority_return_provenance(current["authority"])
        admission = verifier.admission_return_provenance(current["admission"])
        self.assertEqual(decision["normal_path_provenance"], "pass")
        self.assertEqual(authority["normal_path_provenance"], "pass")
        self.assertEqual(admission["normal_path_provenance"], "pass")
        self.assertEqual(decision["return_writes"], 2)
        self.assertGreater(authority["return_writes"], 2)
        for root_id in ("api", "tenant", "prototype", "https"):
            with self.subTest(root_id=root_id):
                result = verifier.root_output_provenance(root_id, current[root_id])
                self.assertEqual(result["normal_path_provenance"], "pass")

    def test_compiled_early_allow_retains_policy_call_but_fails_provenance(self) -> None:
        source = (IMPL / "authorization-ready-decision/src/lib.rs").read_text()
        anchor = "    let decision = kernel::authorize(&context);"
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            '    if command.request_id == "bypass" {\n'
            '        return BinaryAuthorizationDecision::Allow;\n'
            '    }\n' + anchor, 1)
        mir = self.compile_decision_mutant(mutant)
        self.assertEqual(verifier.v5.decision_policy(mir, verifier.v5.functions(mir))["policy_calls"], 1)
        with self.assertRaisesRegex(ValueError, "ALLOW/DENY return provenance changed"):
            verifier.decision_provenance(mir)

    def test_compiled_early_root_allow_retains_handoff_but_fails_provenance(self) -> None:
        source = (IMPL / "authentication-prototype/bridge/src/main.rs").read_text()
        anchor = "    let outcome = service.with_ready(request, authorize_ready_decision);"
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            '    if std::env::var_os("AUTH_BYPASS").is_some() {\n'
            '        return Ok(true);\n'
            '    }\n' + anchor, 1)
        mir = self.compile_root_mutant(mutant)
        self.assertTrue(verifier.v9.root_handoff("prototype", mir)["function"].startswith("evaluate("))
        with self.assertRaisesRegex(ValueError, "unclassified return write"):
            verifier.root_output_provenance("prototype", mir)

    def test_compiled_swapped_policy_output_arms_fail_provenance(self) -> None:
        source = (IMPL / "authorization-ready-decision/src/lib.rs").read_text()
        self.assertIn("kernel::AuthorizationDecision::Allow => BinaryAuthorizationDecision::Allow", source)
        self.assertIn("kernel::AuthorizationDecision::Deny(_) => BinaryAuthorizationDecision::Deny", source)
        mutant = source.replace(
            "kernel::AuthorizationDecision::Allow => BinaryAuthorizationDecision::Allow",
            "kernel::AuthorizationDecision::Allow => BinaryAuthorizationDecision::Deny", 1,
        ).replace(
            "kernel::AuthorizationDecision::Deny(_) => BinaryAuthorizationDecision::Deny",
            "kernel::AuthorizationDecision::Deny(_) => BinaryAuthorizationDecision::Allow", 1,
        )
        mir = self.compile_decision_mutant(mutant)
        self.assertEqual(verifier.v5.decision_policy(mir, verifier.v5.functions(mir))["policy_calls"], 1)
        with self.assertRaisesRegex(ValueError, "ALLOW/DENY return provenance changed"):
            verifier.decision_provenance(mir)

    def test_compiled_indirect_policy_result_overwrite_is_rejected(self) -> None:
        source = (IMPL / "authorization-ready-decision/src/lib.rs").read_text()
        anchor = "    let decision = kernel::authorize(&context);"
        self.assertIn(anchor, source)
        mutant = source.replace(anchor,
            "    let mut decision = kernel::authorize(&context);\n"
            "    let writable: *mut kernel::AuthorizationDecision = &mut decision;\n"
            "    unsafe { *writable = kernel::AuthorizationDecision::Allow; }", 1)
        mir = self.compile_decision_mutant(mutant)
        self.assertEqual(verifier.v5.decision_policy(mir, verifier.v5.functions(mir))["policy_calls"], 1)
        with self.assertRaisesRegex(ValueError, "address escapes direct def-use check"):
            verifier.decision_provenance(mir)

    def test_compiled_indirect_bridge_boolean_overwrite_is_rejected(self) -> None:
        source = (IMPL / "authentication-prototype/bridge/src/main.rs").read_text()
        anchor = '''    Ok(matches!(
        outcome,
        Ok(AdmissionOutcome::Ready(BinaryAuthorizationDecision::Allow))
    ))'''
        self.assertIn(anchor, source)
        mutant = source.replace(anchor, '''    let mut allow = matches!(
        outcome,
        Ok(AdmissionOutcome::Ready(BinaryAuthorizationDecision::Allow))
    );
    let writable: *mut bool = &mut allow;
    if std::env::var_os("AUTH_BYPASS").is_some() {
        unsafe { *writable = true; }
    }
    Ok(allow)''', 1)
        mir = self.compile_root_mutant(mutant)
        self.assertTrue(verifier.v9.root_handoff("prototype", mir)["function"].startswith("evaluate("))
        # rustc gives the mutable alias a new local; its value-flow shape is
        # rejected before the narrow address-escape guard is reached.
        with self.assertRaisesRegex(ValueError, r"Ok\(bool\) positive source changed"):
            verifier.root_output_provenance("prototype", mir)

    def test_parser_unit_bridge_boolean_address_escape_is_rejected(self) -> None:
        # MIR-text guard control only; the compiled alias mutant above fails
        # earlier on its changed positive source shape.
        original = self.current_mir()["prototype"]
        anchor = "_0 = Result::<bool, Box<dyn StdError>>::Ok(move _233);"
        self.assertIn(anchor, original)
        changed = original.replace(anchor, "_1000 = &mut _233;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "address escapes direct def-use check"):
            verifier.root_output_provenance("prototype", changed)

    def test_parser_unit_rebound_policy_result_mir_is_rejected(self) -> None:
        # MIR-text parser control only; this is not a compiled mutant.
        original = self.current_mir()["decision"]
        policy_call = re.search(
            r"(?m)^\s*(_\d+) = auth_foundation_operation_auth_exact_permission_authorize::authorize\(copy _\d+\)",
            original)
        self.assertIsNotNone(policy_call)
        result = policy_call.group(1)
        discriminant = re.search(rf"(?m)^\s*_\d+ = discriminant\({re.escape(result)}\);", original)
        self.assertIsNotNone(discriminant)
        anchor = discriminant.group(0)
        changed = original.replace(anchor, f"{result} = copy _1000;\n" + anchor, 1)
        with self.assertRaisesRegex(ValueError, "policy result.*rebound"):
            verifier.decision_provenance(changed)


if __name__ == "__main__":
    unittest.main()
