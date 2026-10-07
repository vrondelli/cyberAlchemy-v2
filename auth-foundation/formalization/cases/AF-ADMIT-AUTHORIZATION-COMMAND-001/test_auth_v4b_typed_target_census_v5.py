#!/usr/bin/env python3
"""Hostile current-MIR and compiled callback-bypass controls for v5."""

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
SCRIPT = CASE / "auth-v4b-typed-target-census-v5.py"
spec = importlib.util.spec_from_file_location("auth_v4b_typed_target_census_v5", SCRIPT)
assert spec and spec.loader
census = importlib.util.module_from_spec(spec)
spec.loader.exec_module(census)


class TypedTargetCensusV5(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mir, _ = census.capture_mir()

    def test_current_selected_normal_build_passes_without_claim_upgrade(self) -> None:
        result = census.check_mir(self.mir)
        self.assertEqual(set(result["roots"]), {"api", "tenant", "prototype", "https"})
        self.assertEqual(result["decision"]["policy_calls"], 1)

    def test_mir_rejects_swapped_or_rebound_callback_and_extra_policy_call(self) -> None:
        original = self.mir["prototype"]
        changed = original.replace(
            "_232 = auth_foundation_authorization_ready_decision::authorize as",
            "_232 = authorize_ready_decision as", 1,
        )
        with self.assertRaisesRegex(ValueError, "callback reification count"):
            census.check_mir({**self.mir, "prototype": changed})
        changed = original.replace(
            "_230 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>",
            "_232 = authorize_ready_decision as for<'a, 'b> fn(auth_foundation_authorization_ready_authority::ReadyAuthorization<'a, 'b>) -> auth_foundation_authorization_state_model::BinaryAuthorizationDecision (PointerCoercion(ReifyFnPointer(Safe), Implicit));\n        _230 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>", 1,
        )
        with self.assertRaisesRegex(ValueError, "callback local rebound"):
            census.check_mir({**self.mir, "prototype": changed})
        changed = original.replace(
            "_230 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>",
            "_1000 = auth_foundation_operation_auth_exact_permission_authorize::authorize(copy _1001);\n        _230 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>", 1,
        )
        with self.assertRaisesRegex(ValueError, "direct generated-policy call"):
            census.check_mir({**self.mir, "prototype": changed})

    def test_mir_rejects_second_issuer_and_gate_rebinding(self) -> None:
        original = self.mir["admission"]
        changed = original.replace(
            "_40 = with_ready_in_transaction::",
            "_1000 = with_ready_in_transaction::<'_, '_, R>(copy _41, copy _42, move _43, move _44, copy _3);\n        _40 = with_ready_in_transaction::", 1,
        )
        with self.assertRaisesRegex(ValueError, "issuer count"):
            census.check_mir({**self.mir, "admission": changed})
        original = self.mir["authority"]
        changed = original.replace("_102 = &_99;", "_99 = CommandBoundaryDecision::Ready;\n        _102 = &_99;", 1)
        with self.assertRaisesRegex(ValueError, "gate result rebound"):
            census.check_mir({**self.mir, "authority": changed})
        callback = re.search(r"(_\d+ = copy _5\(copy )(_\d+)(\) ->)", original)
        self.assertIsNotNone(callback, "lower READY callback invocation missing")
        changed = original.replace(callback.group(0),
            f"{callback.group(1)}_1000{callback.group(3)}", 1)
        with self.assertRaisesRegex(ValueError, "READY token/callback binding changed"):
            census.check_mir({**self.mir, "authority": changed})
        changed = original.replace(
            "_5: fn(ReadyAuthorization<'_, '_>) -> R",
            "_5: impl FnOnce(ReadyAuthorization<'_, '_>) -> R", 1)
        with self.assertRaisesRegex(ValueError, "bare READY function pointer"):
            census.check_mir({**self.mir, "authority": changed})

    def test_mir_rejects_ready_branch_redirection(self) -> None:
        original = self.mir["authority"]
        selected_name, selected_body = census.selected(census.functions(original), "with_ready_in_transaction(")
        self.assertTrue(selected_name)
        baseline = census.authority_dominance(original, census.functions(original))
        candidates = [match for match in re.finditer(
            r"switchInt\(move (_\d+)\) -> \[0: (bb\d+), otherwise: (bb\d+)\]", selected_body)
            if match.group(2) == baseline["ready_arm"] and match.group(3) == baseline["deny_arm"]]
        self.assertEqual(len(candidates), 1)
        branch = candidates[0].group(0)
        branch_local = candidates[0].group(1)
        changed = original.replace(branch,
            f"switchInt(move {branch_local}) -> [0: {baseline['deny_arm']}, otherwise: {baseline['ready_arm']}]", 1)
        with self.assertRaisesRegex(ValueError, "READY/DENY branch"):
            census.check_mir({**self.mir, "authority": changed})
        changed = original.replace(branch,
            f"switchInt(move _1000) -> [0: {baseline['ready_arm']}, otherwise: {baseline['deny_arm']}]", 1)
        with self.assertRaisesRegex(ValueError, "READY/DENY branch"):
            census.check_mir({**self.mir, "authority": changed})
        promoted = "CommandBoundaryDecision::Ready;"
        self.assertTrue(promoted in original, "READY promoted constant missing")
        changed = original.replace(promoted, "CommandBoundaryDecision::Deny;", 1)
        with self.assertRaisesRegex(ValueError, "compared value is READY"):
            census.check_mir({**self.mir, "authority": changed})

    def compile_bridge_mutant(self, replacement: str, extra_dependency: str) -> str:
        manifest = (IMPL / "authentication-prototype/bridge/Cargo.toml").read_text()
        manifest = manifest.replace("../../", "../")
        manifest += f"\n{extra_dependency}\n"
        with tempfile.TemporaryDirectory(prefix="auth-v4b-compiled-mutant-", dir=IMPL) as directory:
            path = Path(directory)
            (path / "src").mkdir()
            (path / "src/main.rs").write_text(replacement)
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--manifest-path",
                       str(path / "Cargo.toml"), "--target-dir", str(path / "target"),
                       "--bin=auth-prototype-bridge", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob("auth_prototype_bridge-*.mir"))
            self.assertEqual(len(candidates), 1)
            return candidates[0].read_text()

    def test_compiled_callback_swap_is_rejected(self) -> None:
        source = (IMPL / "authentication-prototype/bridge/src/main.rs").read_text()
        original_import = "use auth_foundation_authorization_ready_decision::authorize as authorize_ready_decision;"
        self.assertIn(original_import, source)
        mutant = source.replace(original_import,
            "fn authorize_ready_decision(_: auth_foundation_authorization_ready_authority::ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision { BinaryAuthorizationDecision::Allow }")
        mir = self.compile_bridge_mutant(mutant, "auth-foundation-authorization-ready-authority = { path = \"../authorization-ready-authority\" }")
        with self.assertRaisesRegex(ValueError, "callback reification count"):
            census.root_callback("prototype", mir, census.functions(mir))

    def test_compiled_pregate_raw_policy_call_is_rejected(self) -> None:
        source = (IMPL / "authentication-prototype/bridge/src/main.rs").read_text()
        anchor = "let outcome = service.with_ready(request, authorize_ready_decision);"
        self.assertIn(anchor, source)
        premature = '''let _ = auth_kernel::authorize(&auth_kernel::EvaluationContext {
        request: auth_kernel::AuthorizationRequest {
            request_id: "premature".into(), session_id: "none".into(),
            required_permission: auth_kernel::Permission {
                resource: "documents".into(), action: "read".into(), scope: "prototype".into(),
            },
            scope_evidence_ref: "scope".into(), decision_time: now,
            current_authorization_revision: 1,
        },
        resolved_sessions: Vec::new(), resolved_roles: Vec::new(),
        trusted_scope_evidence: false, role_relation_complete: false,
    });
    '''
        mutant = source.replace(anchor, premature + anchor)
        mir = self.compile_bridge_mutant(mutant,
            'auth-kernel = { package = "auth-foundation-operation-auth-exact-permission-authorize", path = "../standard-runtime" }')
        with self.assertRaisesRegex(ValueError, "direct generated-policy call"):
            census.root_callback("prototype", mir, census.functions(mir))

    def test_compiled_in_crate_policy_alias_is_rejected(self) -> None:
        source = (IMPL / "authorization-ready-decision/src/lib.rs").read_text()
        source += '''
use auth_kernel::authorize as raw_bypass;
pub fn bypass_generated_policy(context: &auth_kernel::EvaluationContext)
    -> auth_kernel::AuthorizationDecision {
    raw_bypass(context)
}
'''
        manifest = (IMPL / "authorization-ready-decision/Cargo.toml").read_text()
        with tempfile.TemporaryDirectory(prefix="auth-v4b-decision-mutant-", dir=IMPL) as directory:
            path = Path(directory)
            (path / "src").mkdir()
            (path / "src/lib.rs").write_text(source)
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--manifest-path",
                       str(path / "Cargo.toml"), "--target-dir", str(path / "target"),
                       "--lib", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob("auth_foundation_authorization_ready_decision-*.mir"))
            self.assertEqual(len(candidates), 1)
            mir = candidates[0].read_text()
        with self.assertRaisesRegex(ValueError, "additional typed generated-policy function"):
            census.decision_policy(mir, census.functions(mir))

    def test_compiled_in_crate_indirect_extra_policy_call_is_rejected(self) -> None:
        source = (IMPL / "authorization-ready-decision/src/lib.rs").read_text()
        anchor = "    let decision = kernel::authorize(&context);"
        self.assertIn(anchor, source)
        source = source.replace(anchor,
            "    let extra: fn(&kernel::EvaluationContext) -> kernel::AuthorizationDecision = kernel::authorize;\n"
            "    let _ = extra(&context);\n" + anchor, 1)
        manifest = (IMPL / "authorization-ready-decision/Cargo.toml").read_text()
        with tempfile.TemporaryDirectory(prefix="auth-v4b-indirect-mutant-", dir=IMPL) as directory:
            path = Path(directory)
            (path / "src").mkdir()
            (path / "src/lib.rs").write_text(source)
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--manifest-path",
                       str(path / "Cargo.toml"), "--target-dir", str(path / "target"),
                       "--lib", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob("auth_foundation_authorization_ready_decision-*.mir"))
            self.assertEqual(len(candidates), 1)
            mir = candidates[0].read_text()
        with self.assertRaisesRegex(ValueError, "generated-policy function pointer bypass"):
            census.decision_policy(mir, census.functions(mir))


if __name__ == "__main__":
    unittest.main()
