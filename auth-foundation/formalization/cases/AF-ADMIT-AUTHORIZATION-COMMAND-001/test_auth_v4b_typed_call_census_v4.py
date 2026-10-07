#!/usr/bin/env python3
"""Hostile normal-MIR sensitivity controls for the partial V4b v4 census."""

import importlib.util
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("auth-v4b-typed-call-census-v4.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_typed_call_census", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def compiled_mir(source: str) -> str:
    with tempfile.TemporaryDirectory(prefix="auth-v4b-mir-mutant-") as temporary:
        directory = Path(temporary)
        source_dir = directory / "src"
        source_dir.mkdir()
        manifest = directory / "Cargo.toml"
        policy = MODULE.IMPL / "standard-runtime"
        manifest.write_text(f'''[package]
name = "auth-v4b-mutant"
version = "0.0.0"
edition = "2024"
[dependencies]
auth_foundation_operation_auth_exact_permission_authorize = {{ package = "auth-foundation-operation-auth-exact-permission-authorize", path = "{policy}" }}
''')
        path = source_dir / "lib.rs"
        path.write_text(source)
        result = subprocess.run([str(MODULE.TOOLCHAIN), "cargo", "rustc", "--offline",
                                 "--target-dir", str(directory / "target"),
                                 "--manifest-path", str(manifest), "--lib", "--", "--emit=mir"],
                                cwd=MODULE.ROOT, capture_output=True, text=True, timeout=120, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-1600:])
        artifacts = list((directory / "target/debug/deps").glob("auth_v4b_mutant-*.mir"))
        if len(artifacts) != 1:
            raise AssertionError(f"expected one mutant MIR artifact, found {len(artifacts)}")
        return artifacts[0].read_text()


def compiled_selected_api_mutant(kind: str = "direct-policy") -> str:
    """Compile a scratch copy of the selected API with a pre-gate decision call."""
    if kind not in ("direct-policy", "callback-policy", "legacy-resolved"):
        raise ValueError(f"unknown selected API mutant: {kind}")
    with tempfile.TemporaryDirectory(prefix="auth-v4b-selected-api-mutant-") as temporary:
        directory = Path(temporary)
        source = MODULE.IMPL / "authorization-api"
        copied = directory / "authorization-api"
        shutil.copytree(source, copied, ignore=shutil.ignore_patterns("target", "Cargo.lock", "__pycache__"))
        manifest = copied / "Cargo.toml"
        contents = manifest.read_text()
        for name in ("authorization-service", "authorization-state-model"):
            contents = contents.replace(f'path = "../{name}"',
                                        f'path = "{MODULE.IMPL / name}"')
        if kind == "legacy-resolved":
            dependency = (f'auth_foundation_runtime_adapter = {{ package = "auth-foundation-runtime-adapter", '
                          f'path = "{MODULE.IMPL / "runtime-adapter"}" }}\n')
        else:
            dependency = (f'auth_kernel = {{ package = "auth-foundation-operation-auth-exact-permission-authorize", '
                          f'path = "{MODULE.IMPL / "standard-runtime"}" }}\n')
        contents = contents.replace("[dependencies]\n", "[dependencies]\n" + dependency, 1)
        manifest.write_text(contents)
        library = copied / "src/lib.rs"
        code = library.read_text()
        needle = "let outcome = catch_unwind(AssertUnwindSafe(|| engine.authorize(request)));"
        if code.count(needle) != 1:
            raise AssertionError("selected API worker insertion point changed")
        if kind == "direct-policy":
            insertion = "pre_gate_policy_probe();\n            "
        elif kind == "callback-policy":
            insertion = "let callback = || pre_gate_policy_probe();\n            callback();\n            "
        else:
            insertion = "pre_gate_legacy_probe();\n            "
        code = code.replace(needle, insertion + needle, 1)
        if kind == "legacy-resolved":
            code += '''
fn pre_gate_legacy_probe() {
    use auth_foundation_runtime_adapter::{
        authorize_resolved, AuthorizationCommand, Permission, ResolvedAuthorizationState,
        RoleResolution,
    };
    let command = AuthorizationCommand {
        request_id: String::new(), session_id: String::new(),
        required_permission: Permission {
            resource: String::new(), action: String::new(), scope: String::new(),
        },
        scope_evidence_ref: String::new(),
    };
    let state = ResolvedAuthorizationState::new(
        Vec::new(), RoleResolution { roles: Vec::new(), complete: false }, false, 0, false,
    );
    let _ = authorize_resolved(command, 0, state);
}
'''
        else:
            code += '''
fn pre_gate_policy_probe() {
    let context = auth_kernel::EvaluationContext {
        request: auth_kernel::AuthorizationRequest {
            request_id: String::new(),
            session_id: String::new(),
            required_permission: auth_kernel::Permission {
                resource: String::new(), action: String::new(), scope: String::new(),
            },
            scope_evidence_ref: String::new(),
            decision_time: 0,
            current_authorization_revision: 0,
        },
        resolved_sessions: Vec::new(),
        resolved_roles: Vec::new(),
        trusted_scope_evidence: false,
        role_relation_complete: false,
    };
    let _ = auth_kernel::authorize(&context);
}
'''
        library.write_text(code)
        result = subprocess.run([str(MODULE.TOOLCHAIN), "cargo", "rustc", "--offline",
                                 "--target-dir", str(directory / "target"),
                                 "--manifest-path", str(manifest), "--lib", "--", "--emit=mir"],
                                cwd=MODULE.ROOT, capture_output=True, text=True, timeout=600, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-2000:])
        artifacts = list((directory / "target/debug/deps").glob("auth_foundation_authorization_api-*.mir"))
        if len(artifacts) != 1:
            raise AssertionError(f"expected one selected API mutant MIR, found {len(artifacts)}")
        return artifacts[0].read_text()


def compiled_selected_service_second_request_mutant() -> str:
    """Compile the actual selected service with an extra issuer for another request."""
    with tempfile.TemporaryDirectory(prefix="auth-v4b-selected-service-mutant-") as temporary:
        directory = Path(temporary)
        source = MODULE.IMPL / "authorization-service"
        copied = directory / "authorization-service"
        shutil.copytree(source, copied, ignore=shutil.ignore_patterns("target", "Cargo.lock", "__pycache__"))
        manifest = copied / "Cargo.toml"
        contents = manifest.read_text()
        for name in ("authorization-ready-authority", "authorization-ready-decision",
                     "authorization-state-model"):
            contents = contents.replace(f'path = "../{name}"',
                                        f'path = "{MODULE.IMPL / name}"')
        manifest.write_text(contents)
        library = copied / "src/lib.rs"
        code = library.read_text()
        for name, migration in (("sqlite-provider", "0001_auth_state.sql"),
                                ("trusted-input-provider", "0001_trusted_inputs.sql")):
            relative = f'include_str!("../../{name}/migrations/{migration}")'
            absolute = f'include_str!("{MODULE.IMPL / name / "migrations" / migration}")'
            if code.count(relative) != 1:
                raise AssertionError(f"selected service migration include changed: {name}")
            code = code.replace(relative, absolute, 1)
        needle = "let mut downstream_port_calls = 0;\n    let admitted = with_ready_in_transaction("
        if code.count(needle) != 1:
            raise AssertionError("selected service issuer insertion point changed")
        second = '''let mut downstream_port_calls = 0;
    let mut other_request = request.clone();
    other_request.request_id.push_str("-different");
    let _ = with_ready_in_transaction(
        epoch.transaction(), &other_request, epoch.evaluation_epoch_id,
        epoch.decision_time, |_ready| BinaryAuthorizationDecision::Deny,
    );
    let admitted = with_ready_in_transaction('''
        library.write_text(code.replace(needle, second, 1))
        result = subprocess.run([str(MODULE.TOOLCHAIN), "cargo", "rustc", "--offline",
                                 "--target-dir", str(directory / "target"),
                                 "--manifest-path", str(manifest), "--lib", "--", "--emit=mir"],
                                cwd=MODULE.ROOT, capture_output=True, text=True, timeout=600, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-2000:])
        artifacts = list((directory / "target/debug/deps").glob("auth_foundation_authorization_service-*.mir"))
        if len(artifacts) != 1:
            raise AssertionError(f"expected one selected service mutant MIR, found {len(artifacts)}")
        return artifacts[0].read_text()


class TypedCallCensusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mir, _ = MODULE.capture_mir()

    def test_current_normal_build_is_partial_and_indeterminate(self) -> None:
        census = MODULE.check_mir(self.mir)
        self.assertEqual(census["sensitive_calls"]["ready_decision_generated_policy"], 1)
        self.assertEqual(census["authority_cfg"]["deny_arm"], "bb56")

    def test_compiled_pre_gate_policy_call_is_rejected(self) -> None:
        mutant = compiled_mir("""
pub fn before_ready(context: &auth_foundation_operation_auth_exact_permission_authorize::EvaluationContext)
    -> auth_foundation_operation_auth_exact_permission_authorize::AuthorizationDecision {
    auth_foundation_operation_auth_exact_permission_authorize::authorize(context)
}
""")
        self.assertIn("= authorize(", mutant)
        changed = dict(self.mir, service=self.mir["service"] + mutant)
        with self.assertRaisesRegex(ValueError, "typed generated-policy call"):
            MODULE.check_mir(changed)

    def test_compiled_selected_api_pre_gate_policy_call_is_rejected(self) -> None:
        mutant = compiled_selected_api_mutant()
        self.assertIn("pre_gate_policy_probe", mutant)
        changed = dict(self.mir, api=mutant)
        with self.assertRaisesRegex(ValueError, "(?:direct|typed) generated-policy call"):
            MODULE.check_mir(changed)

    def test_compiled_selected_api_pre_gate_callback_policy_call_is_rejected(self) -> None:
        mutant = compiled_selected_api_mutant("callback-policy")
        self.assertTrue("pre_gate_policy_probe" in mutant, "callback's policy probe missing from MIR")
        changed = dict(self.mir, api=mutant)
        with self.assertRaisesRegex(ValueError, "(?:direct|typed) generated-policy call"):
            MODULE.check_mir(changed)

    def test_compiled_selected_api_pre_gate_legacy_resolved_call_is_rejected(self) -> None:
        mutant = compiled_selected_api_mutant("legacy-resolved")
        self.assertIn("pre_gate_legacy_probe", mutant)
        self.assertIn("authorize_resolved", mutant)
        changed = dict(self.mir, api=mutant)
        with self.assertRaisesRegex(ValueError, "legacy decision call"):
            MODULE.check_mir(changed)
        qualified = mutant.replace("= authorize_resolved(",
                                  "= auth_foundation_runtime_adapter::authorize_resolved(", 1)
        self.assertIn("= auth_foundation_runtime_adapter::authorize_resolved(", qualified)
        with self.assertRaisesRegex(ValueError, "qualified legacy decision call"):
            MODULE.check_mir(dict(self.mir, api=qualified))

    def test_compiled_selected_service_second_request_issuer_call_is_rejected(self) -> None:
        mutant = compiled_selected_service_second_request_mutant()
        self.assertIn("other_request", mutant)
        changed = dict(self.mir, service=mutant)
        with self.assertRaisesRegex(ValueError, "service READY issuer"):
            MODULE.check_mir(changed)

    def test_compiled_second_ready_issuance_is_rejected(self) -> None:
        mutant = compiled_mir("""
pub fn with_ready_in_transaction<T>() -> bool { true }
pub fn issue_different_request() -> bool {
    with_ready_in_transaction::<u8>()
}
""")
        self.assertIn("= with_ready_in_transaction::", mutant)
        changed = dict(self.mir, service=self.mir["service"] + mutant)
        with self.assertRaisesRegex(ValueError, "service READY issuer"):
            MODULE.check_mir(changed)

    def test_compiled_callback_policy_call_is_rejected(self) -> None:
        mutant = compiled_mir("""
use auth_foundation_operation_auth_exact_permission_authorize::{AuthorizationDecision, EvaluationContext};
pub fn pre_gate_callback<F: FnOnce() -> AuthorizationDecision>(callback: F) -> AuthorizationDecision {
    callback()
}
pub fn invoke(context: &EvaluationContext) -> AuthorizationDecision {
    pre_gate_callback(|| auth_foundation_operation_auth_exact_permission_authorize::authorize(context))
}
""")
        self.assertIn("= authorize(", mutant)
        changed = dict(self.mir, authority=self.mir["authority"] + mutant)
        with self.assertRaisesRegex(ValueError, "typed generated-policy call"):
            MODULE.check_mir(changed)

    def test_compiled_extra_raw_policy_call_inside_decision_crate_is_rejected(self) -> None:
        mutant = compiled_mir("""
use auth_foundation_operation_auth_exact_permission_authorize::{AuthorizationDecision, EvaluationContext};
pub fn raw(context: &EvaluationContext) -> AuthorizationDecision {
    auth_foundation_operation_auth_exact_permission_authorize::authorize(context)
}
""")
        self.assertIn("= authorize(", mutant)
        changed = dict(self.mir, decision=self.mir["decision"] + mutant)
        with self.assertRaisesRegex(ValueError, "extra or redirected typed policy call"):
            MODULE.check_mir(changed)

    def test_compiled_legacy_decision_call_is_rejected(self) -> None:
        mutant = compiled_mir("""
pub struct AuthorizationAdapter;
impl AuthorizationAdapter { pub fn authorize(&self) -> bool { true } }
pub fn pre_gate() -> bool { AuthorizationAdapter.authorize() }
""")
        self.assertIn("= AuthorizationAdapter::authorize(", mutant)
        changed = dict(self.mir, api=self.mir["api"] + mutant)
        with self.assertRaisesRegex(ValueError, "legacy decision call"):
            MODULE.check_mir(changed)

    def test_ready_branch_redirection_is_rejected(self) -> None:
        changed = dict(self.mir, authority=self.mir["authority"].replace(
            "switchInt(move _99) -> [0: bb57, otherwise: bb56]",
            "switchInt(move _99) -> [0: bb56, otherwise: bb57]", 1))
        with self.assertRaises(ValueError):
            MODULE.check_mir(changed)

    def test_comparison_to_non_ready_constant_is_rejected(self) -> None:
        current = "_1 = auth_foundation_command_boundary_v2_auth_command_boundary_admit_authorization_command::CommandBoundaryDecision::Ready;"
        changed = dict(self.mir, authority=self.mir["authority"].replace(
            current, current.replace("::Ready;", "::Deny;"), 1))
        with self.assertRaisesRegex(ValueError, "READY comparison constant changed"):
            MODULE.check_mir(changed)

    def test_comparison_to_other_promotion_is_rejected(self) -> None:
        current = "_103 = const with_ready_in_transaction::<'_, '_, R, impl FnOnce(&ReadyAuthorization<'transaction, 'connection>) -> R>::promoted[0];"
        changed = dict(self.mir, authority=self.mir["authority"].replace(
            current, current.replace("promoted[0]", "promoted[1]"), 1))
        with self.assertRaises(ValueError):
            MODULE.check_mir(changed)

    def test_comparison_to_different_result_is_rejected(self) -> None:
        changed = dict(self.mir, authority=self.mir["authority"].replace(
            "_100 = &_101;", "_100 = &_170;", 1))
        with self.assertRaisesRegex(ValueError, "def-use"):
            MODULE.check_mir(changed)

    def test_branch_on_different_value_is_rejected(self) -> None:
        changed = dict(self.mir, authority=self.mir["authority"].replace(
            "switchInt(move _99) -> [0: bb57, otherwise: bb56]",
            "switchInt(move _170) -> [0: bb57, otherwise: bb56]", 1))
        with self.assertRaises(ValueError):
            MODULE.check_mir(changed)


if __name__ == "__main__":
    unittest.main()
