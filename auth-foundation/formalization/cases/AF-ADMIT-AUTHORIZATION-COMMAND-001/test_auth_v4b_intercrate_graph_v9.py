#!/usr/bin/env python3
"""Current four-root stitched graph and a compiled pre-READY policy bypass."""

from __future__ import annotations

import importlib.util
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
IMPL = ROOT / "auth-foundation/implementation"
TOOLCHAIN = ROOT / "tools/toolchain/run"
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_intercrate_graph_v9", CASE / "auth-v4b-intercrate-graph-v9.py")
assert SPEC and SPEC.loader
graph = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(graph)


class NamedEndpointParserControls(unittest.TestCase):
    def test_generic_and_trait_authorize_spellings_are_candidates(self) -> None:
        targets = (
            "SqliteAuthorizationService::<SystemDecisionClock>::authorize",
            "AuthorizationAdapter::<S,R,E,V,C>::authorize",
            "<SomeType as AuthorizationDecisionService>::authorize",
        )
        for target in targets:
            with self.subTest(target=target):
                mir = ("fn test() {\n    bb0: {\n"
                       f"        _0 = {target}(copy _1) -> [return: bb1, unwind: continue];\n"
                       "    }\n    bb1: {\n        return;\n    }\n}\n"
                       "fn dummy() {\n    bb0: {\n        return;\n    }\n}\n")
                self.assertEqual([row["target"] for row in graph.root_native_calls(
                    mir, broad_stage_guard=True)],
                                 [target])

    def test_root_ingress_name_is_not_assumed_downstream(self) -> None:
        mir = ("fn test() {\n    bb0: {\n"
               "        _0 = AuthorizationRuntime::authorize(copy _1) "
               "-> [return: bb1, unwind: continue];\n"
               "    }\n    bb1: {\n        return;\n    }\n}\n"
               "fn dummy() {\n    bb0: {\n        return;\n    }\n}\n")
        self.assertEqual(graph.root_native_calls(mir), [])


class IntercrateGraphV9(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.prototype = {}

        def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
            if root_id == "prototype":
                cls.prototype = {"mir": mir.copy(), "identities": identities.copy()}
            return graph.inspect(root_id, mir, identities)

        cls.current = graph.v7.evaluate(mir_inspector=inspect)

    def test_four_current_root_contexts_pass_without_full_claim(self) -> None:
        self.assertEqual(self.current["status"], "indeterminate")
        self.assertFalse(self.current["runtime_guarantees_observed"])
        self.assertEqual(set(self.current["root_context_builds"]),
                         {"api", "tenant", "prototype", "https"})
        for result in self.current["root_context_builds"].values():
            inspection = result["selected_graph_inspection"]
            self.assertEqual(inspection["bounded_property"]["status"], "pass")
            self.assertFalse(inspection["bounded_property"]["complete_native_endpoint_set"])
            self.assertFalse(inspection["bounded_property"]["allow_output_provenance_closed"])
            self.assertEqual(len(inspection["intercrate_edges"]), 4)
            self.assertEqual(len(inspection["selected_stage_native_calls"]), 1)
            self.assertEqual(inspection["selected_stage_native_calls"][0]["manifest"],
                             graph.DECISION)

    def test_non_root_stage_parser_rejects_extra_named_call(self) -> None:
        # Parser sensitivity only: the inserted MIR line is not a compiled,
        # well-typed pre-READY mutation.
        mir = self.prototype["mir"].copy()
        stage = graph.ADMISSION
        original = mir[stage]
        target = "SqliteAuthorizationService::<SystemDecisionClock>::authorize"
        injection = f"    _999 = {target}(copy _1) -> [return: bb1, unwind: continue];\n"
        self.assertIn("    bb0: {\n", original)
        mir[stage] = original.replace("    bb0: {\n", "    bb0: {\n" + injection, 1)
        calls = graph.selected_stage_native_calls(mir)
        self.assertTrue(any(row["manifest"] == stage and
                            row["target"] == target for row in calls))
        with self.assertRaisesRegex(ValueError, "extra or changed named native decision call"):
            graph.stitched_graph("prototype", mir, self.prototype["identities"])

    def test_compiled_admission_pregate_policy_call_is_rejected(self) -> None:
        admission = IMPL / "authorization-admission-service"
        source = (admission / "src/lib.rs").read_text()
        anchor = "fn valid_inbound_request(request: &InboundAuthorizationRequest) -> bool {"
        self.assertEqual(source.count(anchor), 1)
        self.assertLess(source.index("if !valid_inbound_request(&request)"),
                        source.index("let outcome = with_ready_in_transaction("))
        premature = '''
    std::hint::black_box(auth_kernel::authorize(&auth_kernel::EvaluationContext {
        request: auth_kernel::AuthorizationRequest {
            request_id: request.request_id.clone(), session_id: "none".into(),
            required_permission: auth_kernel::Permission {
                resource: "documents".into(), action: "read".into(), scope: "prototype".into(),
            },
            scope_evidence_ref: "scope".into(), decision_time: 0,
            current_authorization_revision: 1,
        },
        resolved_sessions: Vec::new(), resolved_roles: Vec::new(),
        trusted_scope_evidence: false, role_relation_complete: false,
    }));
'''
        manifest = (admission / "Cargo.toml").read_text()
        dependency = ('auth-kernel = { package = '
                      '"auth-foundation-operation-auth-exact-permission-authorize", '
                      'path = "../standard-runtime" }\n')
        self.assertEqual(manifest.count("\n[dev-dependencies]"), 1)
        manifest = manifest.replace("\n[dev-dependencies]",
                                    "\n" + dependency + "\n[dev-dependencies]", 1)
        with tempfile.TemporaryDirectory(prefix="auth-v4b-v9-admission-mutant-", dir=IMPL) as temporary:
            path = Path(temporary)
            (path / "src").mkdir()
            (path / "src/lib.rs").write_text(source.replace(anchor, anchor + premature, 1))
            shutil.copyfile(admission / "src/schema.rs", path / "src/schema.rs")
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--manifest-path",
                       str(path / "Cargo.toml"), "--target-dir", str(path / "target"),
                       "--lib", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob(
                "auth_foundation_authorization_admission_service-*.mir"))
            self.assertEqual(len(candidates), 1)
            mutant_mir = candidates[0].read_text()

        mir = self.prototype["mir"].copy()
        identities = self.prototype["identities"].copy()
        mir[graph.ADMISSION] = mutant_mir
        identities[graph.ADMISSION] = {**identities[graph.ADMISSION],
                                       "mir_sha256": graph.sha(mutant_mir.encode())}
        calls = graph.selected_stage_native_calls(mir)
        self.assertEqual(len(calls), 2)
        # This rustc MIR display shortens the imported external function to
        # `authorize`; the temporary source and Cargo dependency bind which
        # policy function was compiled, not this spelling by itself.
        self.assertTrue(any(row["manifest"] == graph.ADMISSION and
                            row["target"] == "authorize" for row in calls), calls)
        with self.assertRaisesRegex(ValueError, "extra or changed named native decision call"):
            graph.stitched_graph("prototype", mir, identities)

    def test_compiled_pregate_policy_call_breaks_stitched_property(self) -> None:
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
        manifest = (IMPL / "authentication-prototype/bridge/Cargo.toml").read_text()
        manifest = manifest.replace("../../", "../")
        manifest += ('\nauth-kernel = { package = '
                     '"auth-foundation-operation-auth-exact-permission-authorize", '
                     'path = "../standard-runtime" }\n')
        with tempfile.TemporaryDirectory(prefix="auth-v4b-v9-mutant-", dir=IMPL) as temporary:
            path = Path(temporary)
            (path / "src").mkdir()
            (path / "src/main.rs").write_text(source.replace(anchor, premature + anchor, 1))
            (path / "Cargo.toml").write_text(manifest)
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--manifest-path",
                       str(path / "Cargo.toml"), "--target-dir", str(path / "target"),
                       "--bin=auth-prototype-bridge", "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=300, check=False)
            self.assertEqual(result.returncode, 0, result.stderr[-2200:])
            candidates = list((path / "target/debug/deps").glob("auth_prototype_bridge-*.mir"))
            self.assertEqual(len(candidates), 1)
            mutant_mir = candidates[0].read_text()

        selected = graph.root_handoff("prototype", mutant_mir)
        self.assertTrue(selected["function"].startswith("evaluate("))
        self.assertTrue(graph.root_native_calls(mutant_mir))
        mir = self.prototype["mir"].copy()
        identities = self.prototype["identities"].copy()
        root_manifest = graph.v6.ROOT_MANIFESTS["prototype"]
        mir[root_manifest] = mutant_mir
        identities[root_manifest] = {**identities[root_manifest],
                                     "mir_sha256": graph.sha(mutant_mir.encode())}
        extracted = graph.stitched_graph("prototype", mir, identities)
        verdict = graph.check_stitched_property(extracted)
        self.assertEqual(verdict["status"], "fail")
        self.assertIn("policy-endpoint-not-dominated-by-same-ready-arm", verdict["violations"])
        self.assertIn("direct-native-root-entrypoint-outside-ready-token", verdict["violations"])
        with self.assertRaisesRegex(ValueError, "intercrate property failed"):
            graph.inspect("prototype", mir, identities)


if __name__ == "__main__":
    unittest.main()
