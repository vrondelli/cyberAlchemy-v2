#!/usr/bin/env python3
"""Fast hostile same-library composition fixtures for V46."""

import copy
import importlib.util
import pathlib
import subprocess
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-api-async-http-v46.py")
SPEC = importlib.util.spec_from_file_location("auth_v46_under_test", SOURCE)
assert SPEC and SPEC.loader
v46 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v46)


def compiled_api_library():
    with tempfile.TemporaryDirectory(prefix="auth-v46-unit-api-") as temporary:
        target = pathlib.Path(temporary)
        command = [str(v46.v45.v5.TOOLCHAIN), "cargo", "rustc", "--offline",
                   "--locked", "--target-dir", str(target), "--manifest-path",
                   str(v46.v45.v5.IMPL / "authorization-api/Cargo.toml"),
                   "--lib", "--", "--emit=mir"]
        result = subprocess.run(command, cwd=v46.v45.v5.ROOT, capture_output=True,
                                text=True, timeout=600, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-1500:])
        candidates = list((target / "debug/deps").glob(
            "auth_foundation_authorization_api-*.mir"))
        if len(candidates) != 1:
            raise AssertionError("selected API library MIR ambiguous")
        return candidates[0].read_text()


class V46AsyncHttpTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mir = compiled_api_library()
        inner = v46.v45.v44.inspect_inner(
            cls.mir, v46.v45.v44.v42.enum_tags("clean"))
        cls.parent = v46.v45.inspect_parent(cls.mir, inner)
        cls.composed = v46.inspect_composition(cls.mir, cls.parent)

    def mutant(self, old, new, reason):
        self.assertIn(old, self.mir)
        with self.assertRaisesRegex(ValueError, reason):
            v46.inspect_composition(self.mir.replace(old, new, 1), self.parent)

    def test_selected_normal_composition_and_ceiling(self):
        self.assertTrue(self.composed["conditional_completed_worker_ok_decision_to_http_200"])
        self.assertEqual(self.composed["async_constructor_capture_selectors"], "pass")
        self.assertEqual(self.composed["public_route_path"], "/v1/authorize")
        self.assertFalse(self.composed["timeout_cancels_blocking_worker_proven"])
        self.assertFalse(self.composed["tokio_axum_serde_execution_proven"])
        self.assertFalse(self.composed["http_bytes_proven"])

    def test_different_parent_identity_rejected(self):
        parent = dict(self.parent, function=self.parent["function"] + "-decoy")
        with self.assertRaisesRegex(ValueError, "parent and V11c worker identities"):
            v46.inspect_composition(self.mir, parent)

    def test_runtime_constructor_request_capture_rejected(self):
        self.mutant("{ self: copy _1, request: move _2 };",
                    "{ self: copy _1, request: move _99 };",
                    "runtime async constructor capture")

    def test_handler_constructor_request_capture_rejected(self):
        self.mutant("{ __arg0: move _1, request: move _2 };",
                    "{ __arg0: move _1, request: move _99 };",
                    "handler async constructor capture")

    def test_public_route_handler_substitution_rejected(self):
        self.mutant("post::<fn(State<ApiState>, axum::http::Request<Body>) -> impl Future<Output = Response<Body>> {authorize}",
                    "post::<fn(State<ApiState>, axum::http::Request<Body>) -> impl Future<Output = Response<Body>> {not_found}",
                    "public POST handler|public router")

    def test_join_handle_substitution_rejected(self):
        self.mutant("_56 = move _48;", "_56 = move _99;",
                    "worker handle/evaluation timeout binding")

    def test_timeout_outer_result_arms_swapped_rejected(self):
        self.mutant("switchInt(move _67) -> [0: bb37, 1: bb41, otherwise: bb13];",
                    "switchInt(move _67) -> [0: bb41, 1: bb37, otherwise: bb13];",
                    "timeout/join/worker result polarity")

    def test_join_result_arms_swapped_rejected(self):
        self.mutant("switchInt(move _66) -> [0: bb38, 1: bb40, otherwise: bb13];",
                    "switchInt(move _66) -> [0: bb40, 1: bb38, otherwise: bb13];",
                    "timeout/join/worker result polarity")

    def test_worker_result_arms_swapped_rejected(self):
        self.mutant("switchInt(move _65) -> [0: bb39, 1: bb40, otherwise: bb13];",
                    "switchInt(move _65) -> [0: bb40, 1: bb39, otherwise: bb13];",
                    "timeout/join/worker result polarity")

    def test_runtime_success_fabrication_rejected(self):
        self.mutant(
            "_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy _84);",
            "_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(BinaryAuthorizationDecision::Allow);",
            "runtime success/error result classification")

    def test_handler_timeout_to_ok_rejected(self):
        self.mutant("deny(const axum::http::StatusCode::GATEWAY_TIMEOUT)",
                    "respond(const axum::http::StatusCode::OK, BinaryAuthorizationDecision::Allow)",
                    "handler response sources|handler runtime success/error polarity")

    def test_handler_ok_wrong_payload_rejected(self):
        self.mutant("respond(const axum::http::StatusCode::OK, copy _44)",
                    "respond(const axum::http::StatusCode::OK, copy _99)",
                    "handler response sources|handler selected _44")

    def test_response_literal_flip_rejected(self):
        self.mutant('const "DENY"', 'const "ALLOW"',
                    "selected response|response decision|response.*changed")

    def test_variant_binding_rejects_source_mir_package_binary_drift(self):
        api, manifest = v46.v45.v44.API, v46.v45.v44.MANIFEST
        parent = {"function": self.parent["function"],
                  "api_library_source_sha256": "source",
                  "api_library_mir_sha256": "mir",
                  "api_library_package_id": "package",
                  "api_library_features": []}
        joined = dict(parent, variant="clean", parent_function=self.parent["function"],
                      async_constructor_capture_selectors="pass",
                      public_router_selector="pass", request_conversion_selector="pass",
                      worker_to_runtime_selector="pass", runtime_to_http_selector="pass",
                      normal_library_same_mir_string=True,
                      conditional_completed_worker_ok_decision_to_http_200=True,
                      timeout_error_http_status="GATEWAY_TIMEOUT",
                      join_or_worker_error_http_status="SERVICE_UNAVAILABLE",
                      public_route_path="/v1/authorize",
                      timeout_cancels_blocking_worker_proven=False,
                      tokio_axum_serde_execution_proven=False,
                      http_bytes_proven=False, transitive_effect_closure_proven=False)
        row = {"selected_mir_inspection": {"v45_parent_worker": parent,
                                           "v46_async_http": joined},
               "source_sha256": {api: "source"},
               "selected_mir_sha256": {manifest: "mir"},
               "test_package_id": "package", "binary_sha256": "binary",
               "observations": {"allow": {"test_binary_sha256": "binary"}}}
        v46.bind_variant("clean", row, {api: "source"})
        for change in (lambda item: item["source_sha256"].update({api: "wrong"}),
                       lambda item: item["selected_mir_sha256"].update({manifest: "wrong"}),
                       lambda item: item.update(test_package_id="wrong"),
                       lambda item: item["observations"]["allow"].update(
                           test_binary_sha256="wrong")):
            mutant = copy.deepcopy(row)
            change(mutant)
            with self.assertRaisesRegex(ValueError, "binding changed"):
                v46.bind_variant("clean", mutant, {api: "source"})
        for field, wrong in (("worker_to_runtime_selector", "pending"),
                             ("runtime_to_http_selector", "pending"),
                             ("timeout_error_http_status", "OK"),
                             ("timeout_cancels_blocking_worker_proven", True),
                             ("http_bytes_proven", True)):
            mutant = copy.deepcopy(row)
            mutant["selected_mir_inspection"]["v46_async_http"][field] = wrong
            with self.assertRaisesRegex(ValueError, "binding changed"):
                v46.bind_variant("clean", mutant, {api: "source"})


if __name__ == "__main__":
    unittest.main()
