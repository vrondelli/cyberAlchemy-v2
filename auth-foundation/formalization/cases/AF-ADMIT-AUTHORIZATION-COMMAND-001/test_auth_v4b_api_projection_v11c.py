#!/usr/bin/env python3
"""Production-build hostile controls for the incremental V11c API sublemma."""

from __future__ import annotations

import importlib.util
import re
import subprocess
import tempfile
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_api_projection_v11c", CASE / "auth-v4b-api-projection-v11c.py")
assert SPEC and SPEC.loader
verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verifier)
IMPL = verifier.v7.IMPL
SOURCE = IMPL / "authorization-api/src/lib.rs"
MANIFEST = IMPL / "authorization-api/Cargo.toml"
TOOLCHAIN = ROOT / "tools/toolchain/run"


class ApiProjectionV11c(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.capture = tempfile.TemporaryDirectory(prefix="auth-v11c-api-current-")
        cls.fixture = tempfile.TemporaryDirectory(prefix="auth-v11c-api-mutant-")
        cls.fixture_path = Path(cls.fixture.name)
        (cls.fixture_path / "src").mkdir()
        (cls.fixture_path / "Cargo.toml").write_text(
            MANIFEST.read_text().replace('path = "../', f'path = "{IMPL}/'))
        inventory, _ = verifier.v7.current_inventory()
        manifest = verifier.v6.ROOT_MANIFESTS[verifier.API]
        members = sorted(inventory["selected_root_package_manifests"][verifier.API])
        selected = {}

        def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
            selected["mir"] = mir[manifest]
            return verifier.inspect(root_id, mir, identities)

        cls.current = verifier.v7.capture_root(
            verifier.API, manifest, members, Path(cls.capture.name), inventory,
            mir_inspector=inspect)
        cls.selected = selected["mir"]

    @classmethod
    def tearDownClass(cls) -> None:
        cls.fixture.cleanup()
        cls.capture.cleanup()

    def compile_mutant(self, source: str) -> str:
        (self.fixture_path / "src/lib.rs").write_text(source)
        command = [str(TOOLCHAIN), "cargo", "rustc", "--offline",
                   "--manifest-path", str(self.fixture_path / "Cargo.toml"),
                   "--target-dir", str(self.fixture_path / "target"),
                   "--lib", "--", "--emit=mir"]
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                timeout=300, check=False)
        self.assertEqual(result.returncode, 0, result.stderr[-2500:])
        candidates = list((self.fixture_path / "target/debug/deps").glob(
            "auth_foundation_authorization_api-*.mir"))
        self.assertEqual(len(candidates), 1)
        return candidates[0].read_text()

    def test_current_production_router_and_response_pass_bounded(self) -> None:
        result = self.current["selected_graph_inspection"]
        self.assertEqual(result["api_router_projection"]["normal_mir_binding"], "pass")
        self.assertEqual(result["api_database_router_wrapper_projection"]["normal_mir_binding"], "pass")
        self.assertEqual(result["api_deny_projection"]["normal_mir_binding"], "pass")
        self.assertEqual(result["api_response_projection"]["selected_response_normal_mir_binding"], "pass")
        self.assertEqual(result["api_worker_projection"]["normal_mir_result_provenance"], "pass")
        self.assertEqual(result["api_runtime_poll_projection"]["normal_mir_poll_result_provenance"], "pass")
        self.assertEqual(result["api_handler_constructor_projection"]["normal_mir_input_capture"], "pass")
        self.assertEqual(result["api_runtime_constructor_projection"]["normal_mir_input_capture"], "pass")
        self.assertEqual(result["api_request_conversion_projection"]["normal_mir_field_mapping"], "pass")
        self.assertEqual(result["api_content_type_projection"]["normal_mir_media_type_projection"], "pass")
        self.assertEqual(result["api_handler_poll_projection"]["normal_mir_http_response_provenance"], "pass")
        self.assertEqual(result["api_not_found_projection"]["normal_mir_fallback_response"], "pass")
        self.assertEqual(result["api_method_not_allowed_projection"]["normal_mir_fallback_response"], "pass")
        self.assertEqual(result["api_composition_projection"]["bounded_normal_mir_function_chain"], "pass")

    def test_compiled_independent_worker_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "                    Ok(decision)\n"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "                    Ok(BinaryAuthorizationDecision::Allow)\n", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "checked worker Ok result|worker decision"):
            verifier.worker_projection(mir)

    def test_compiled_worker_panic_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "Err(_) => Err(AuthorizationRuntimeError::WorkerUnavailable),"
        self.assertIn(anchor, source)
        typed = source.replace("let result = match outcome {",
            "let result: Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> = match outcome {", 1)
        mir = self.compile_mutant(typed.replace(anchor,
            "Err(_) => Ok(BinaryAuthorizationDecision::Allow),", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "worker return result classification"):
            verifier.worker_projection(mir)

    def test_compiled_worker_skips_pool_return_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "                    pool.put(engine)?;\n"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor, "", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "worker pool return|worker return result classification"):
            verifier.worker_projection(mir)

    def test_compiled_runtime_replaces_worker_decision_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "            Ok(Ok(Ok(decision))) => decision,"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "            Ok(Ok(Ok(_decision))) => BinaryAuthorizationDecision::Allow,", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        worker = verifier.worker_projection(mir)
        # This compiled mutant renumbers the coroutine locals. The checker
        # rejects that changed layout before its result-specific predicate;
        # the MIR parser control below exercises the result predicate itself.
        with self.assertRaisesRegex(ValueError, "coroutine body pointer rebinding or escape|worker handle/evaluation timeout binding|runtime success/error result classification|runtime selected _84"):
            verifier.runtime_poll_projection(mir, worker)

    def test_compiled_runtime_timeout_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "                return Err(AuthorizationRuntimeError::TimedOut);"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "                return Ok(BinaryAuthorizationDecision::Allow);", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        worker = verifier.worker_projection(mir)
        with self.assertRaisesRegex(ValueError, "runtime success/error result classification"):
            verifier.runtime_poll_projection(mir, worker)

    def test_compiled_handler_malformed_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "return deny(StatusCode::UNSUPPORTED_MEDIA_TYPE);"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "return respond(StatusCode::OK, BinaryAuthorizationDecision::Allow);", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        # The compiled source change can renumber fixed MIR locals; parser
        # controls below exercise the branch-specific guard without drift.
        with self.assertRaisesRegex(ValueError, "HTTP handler coroutine pointer rebound or escaped|handler response sources|HTTP handler coroutine state|handler runtime call/request"):
            verifier.handler_poll_projection(mir)

    def test_compiled_handler_timeout_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "Err(AuthorizationRuntimeError::TimedOut) => deny(StatusCode::GATEWAY_TIMEOUT),"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "Err(AuthorizationRuntimeError::TimedOut) => respond(StatusCode::OK, BinaryAuthorizationDecision::Allow),", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "HTTP handler coroutine pointer rebound or escaped|handler response sources|handler runtime success/error polarity|HTTP handler coroutine state"):
            verifier.handler_poll_projection(mir)

    def test_compiled_not_found_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "async fn not_found() -> Response {\n    deny(StatusCode::NOT_FOUND)\n}"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "async fn not_found() -> Response {\n    respond(StatusCode::OK, BinaryAuthorizationDecision::Allow)\n}", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "not_found fallback status/normal return"):
            verifier.fallback_poll_projection(mir, "not_found", "NOT_FOUND")

    def test_compiled_handler_swapped_request_fields_fail(self) -> None:
        source = SOURCE.read_text()
        anchor = "            authentication_evidence_ref: value.authentication_evidence_ref,\n            route_id: value.route_id,"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "            authentication_evidence_ref: value.route_id,\n            route_id: value.authentication_evidence_ref,", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "parsed request field projection"):
            verifier.request_conversion_projection(mir)

    def test_compiled_content_type_helper_always_true_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = ("fn is_json_content_type(value: Option<&axum::http::HeaderValue>) -> bool {\n"
                  "    value\n        .and_then(|value| value.to_str().ok())\n"
                  "        .and_then(|value| value.split(';').next())\n"
                  "        .is_some_and(|value| value.trim().eq_ignore_ascii_case(\"application/json\"))\n}")
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "fn is_json_content_type(_: Option<&axum::http::HeaderValue>) -> bool { true }", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "content-type helper chain|selected body"):
            verifier.content_type_projection(mir)

    def test_compiled_body_limit_expansion_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "pub const MAX_AUTHORIZATION_BODY_BYTES: usize = 1024;"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "pub const MAX_AUTHORIZATION_BODY_BYTES: usize = usize::MAX;", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "compiled authorization body limit changed"):
            verifier.content_type_projection(mir)

    def test_compiled_alternate_public_handler_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = ".route(AUTHORIZE_PATH, post(authorize))"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            ".route(AUTHORIZE_PATH, post(not_found))", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "public POST handler"):
            verifier.router_projection(mir)

    def test_compiled_wrong_public_path_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = 'pub const AUTHORIZE_PATH: &str = "/v1/authorize";'
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            'pub const AUTHORIZE_PATH: &str = "/v1/authorize2";', 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "compiled public route path"):
            verifier.router_projection(mir)

    def test_compiled_database_router_wrapper_bypass_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "authorization_runtime_from_database(path, config).map(authorization_router)"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "authorization_runtime_from_database(path, config).map(|_| Router::new())", 1))
        self.assertEqual(verifier.router_projection(mir)["normal_mir_binding"], "pass")
        with self.assertRaisesRegex(ValueError, "database router wrapper"):
            verifier.database_router_wrapper_projection(mir)

    def test_compiled_swapped_response_literals_fail(self) -> None:
        source = SOURCE.read_text()
        anchor = 'BinaryAuthorizationDecision::Allow => "ALLOW",'
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            'BinaryAuthorizationDecision::Allow => "DENY",', 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "response ALLOW/DENY polarity"):
            verifier.respond_projection(mir)

    def test_compiled_changed_cache_header_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = 'HeaderValue::from_static("no-store")'
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            'HeaderValue::from_static("public")', 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "no-store header value"):
            verifier.respond_projection(mir)

    def test_compiled_post_response_mutation_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "    response\n}\n"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "    response.headers_mut().remove(header::CACHE_CONTROL);\n    response\n}\n", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError,
                                    "selected response|no-store response header|alternate response"):
            verifier.respond_projection(mir)

    def test_compiled_deny_helper_allow_fails(self) -> None:
        source = SOURCE.read_text()
        anchor = "respond(status, BinaryAuthorizationDecision::Deny)"
        self.assertIn(anchor, source)
        mir = self.compile_mutant(source.replace(anchor,
            "respond(status, BinaryAuthorizationDecision::Allow)", 1))
        self.assertEqual(verifier.v10.root_output_provenance("api", mir)[
            "normal_path_provenance"], "pass")
        with self.assertRaisesRegex(ValueError, "deny helper no longer"):
            verifier.deny_projection(mir)

    def test_mir_parser_rebound_response_discriminant_fails(self) -> None:
        # Parser-unit guard for a value rebind that does not require a new CFG.
        body = verifier.v5.functions(self.selected)[
            "respond(_1: StatusCode, _2: BinaryAuthorizationDecision) -> Response<Body>"]
        matched = re.search(r"(?m)^\s*(_\d+) = discriminant\(_2\);$", body)
        self.assertIsNotNone(matched)
        changed = self.selected.replace(matched.group(0),
            matched.group(0) + f"\n        {matched.group(1)} = const 0_isize;", 1)
        with self.assertRaisesRegex(ValueError, "response decision discriminant"):
            verifier.respond_projection(changed)

    def test_mir_parser_rebound_public_router_base_fails(self) -> None:
        # Parser-unit guard: a same-CFG Router rebind was not a compiled mutant.
        body = verifier.v5.functions(self.selected)[
            "authorization_router(_1: AuthorizationRuntime) -> Router"]
        matched = re.search(r"(?m)^\s*_5 = Router::<ApiState>::new\(\) -> \[return: bb1,[^\n]+$",
                            body)
        self.assertIsNotNone(matched)
        changed = self.selected.replace(matched.group(0),
            matched.group(0) + "\n        _5 = Router::<ApiState>::new() -> [return: bb1, unwind: bb11];", 1)
        with self.assertRaisesRegex(ValueError, "public router base"):
            verifier.router_projection(changed)

    def test_mir_parser_rebound_pool_take_result_fails(self) -> None:
        anchor = "_19 = <Result<SqliteAdmissionService, AuthorizationRuntimeError> as Try>::branch(move _20)"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_20 = Result::<SqliteAdmissionService, AuthorizationRuntimeError>::Err(AuthorizationRuntimeError::WorkerUnavailable);\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "selected pool take result"):
            verifier.worker_projection(changed)

    def test_mir_parser_rebound_pool_return_result_fails(self) -> None:
        anchor = "_33 = <Result<(), AuthorizationRuntimeError> as Try>::branch(move _34)"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_34 = Result::<(), AuthorizationRuntimeError>::Ok(const ());\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "selected pool return result"):
            verifier.worker_projection(changed)

    def test_mir_parser_swapped_pool_take_arms_fail(self) -> None:
        anchor = "switchInt(move _23) -> [0: bb11, 1: bb12, otherwise: bb10];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _23) -> [0: bb12, 1: bb11, otherwise: bb10];", 1)
        with self.assertRaisesRegex(ValueError, "pool take success/failure arms"):
            verifier.worker_projection(changed)

    def test_mir_parser_swapped_pool_return_arms_fail(self) -> None:
        anchor = "switchInt(move _38) -> [0: bb19, 1: bb20, otherwise: bb10];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _38) -> [0: bb20, 1: bb19, otherwise: bb10];", 1)
        with self.assertRaisesRegex(ValueError, "pool return success/failure arms"):
            verifier.worker_projection(changed)

    def test_mir_parser_rebound_runtime_worker_handle_fails(self) -> None:
        anchor = "_56 = move _48;"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_48 = spawn_blocking::<{closure@src/lib.rs:306:50: 306:57}, Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>(move _49) -> [return: bb27, unwind: bb64];\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "worker handle/evaluation timeout binding"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_swapped_runtime_timeout_arms_fail(self) -> None:
        anchor = "switchInt(move _67) -> [0: bb37, 1: bb41, otherwise: bb13];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _67) -> [0: bb41, 1: bb37, otherwise: bb13];", 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "timeout/join/worker result polarity"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_rebound_runtime_duration_source_fails(self) -> None:
        anchor = "_53 = copy ((*_54).3: std::time::Duration);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_54 = &(*_54);\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "evaluation duration/stored timeout future|runtime selected _54"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_rebound_stored_runtime_future_fails(self) -> None:
        anchor = "_58 = Pin::<&mut tokio::time::Timeout<tokio::task::JoinHandle<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>>>::new_unchecked(copy _59)"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_59 = &mut _120;\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "evaluation duration/stored timeout future|runtime selected _59"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_swapped_runtime_nested_discriminant_fails(self) -> None:
        anchor = "_65 = discriminant(((((_50 as Ok).0: std::result::Result<std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>, tokio::task::JoinError>) as Ok).0: std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>));"
        replacement = "_65 = discriminant(((_50 as Ok).0: std::result::Result<std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>, tokio::task::JoinError>));"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor, replacement, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "nested timeout/join/worker discriminants"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_fabricated_runtime_success_fails(self) -> None:
        anchor = "_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy _84);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(BinaryAuthorizationDecision::Allow);", 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "runtime success/error result classification"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_alternate_coroutine_state_to_ready_fails(self) -> None:
        anchor = "switchInt(move _103) -> [0: bb86, 1: bb85, 2: bb84, 3: bb82, 4: bb83, otherwise: bb13];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _103) -> [0: bb86, 1: bb85, 2: bb84, 3: bb82, 4: bb83, 5: bb60, otherwise: bb13];", 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "runtime coroutine state: variant arms changed"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_timeout_error_alias_fails(self) -> None:
        anchor = "_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _75);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_120 = &mut _75;\n        (*_120) = AuthorizationRuntimeError::WorkerUnavailable;\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "runtime selected _75"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_runtime_self_state_rebind_fails(self) -> None:
        anchor = "_110 = no_retag copy (((*_104) as variant#4).0: &AuthorizationRuntime);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "(((*_104) as variant#4).0: &AuthorizationRuntime) = &_120;\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "coroutine input state rebinding"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_runtime_coroutine_pointer_rebind_fails(self) -> None:
        anchor = "_110 = no_retag copy (((*_104) as variant#4).0: &AuthorizationRuntime);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_104 = &mut _120;\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "coroutine body pointer rebinding"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_runtime_worker_pool_rebind_fails(self) -> None:
        anchor = "_49 = {closure@src/lib.rs:306:50: 306:57} { permit: move _10, metrics: move _44, pool: move _40,"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_40 = move _120;\n        " + anchor, 1)
        worker = verifier.worker_projection(changed)
        with self.assertRaisesRegex(ValueError, "worker pool not selected from runtime state|runtime selected _40"):
            verifier.runtime_poll_projection(changed, worker)

    def test_mir_parser_handler_result_rebind_fails(self) -> None:
        anchor = "_43 = discriminant(_40);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_40 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(BinaryAuthorizationDecision::Allow);\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler runtime success/error polarity|handler selected _40"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_response_rebind_fails(self) -> None:
        anchor = "_0 = Poll::<Response<Body>>::Ready(move _51);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_51 = respond(const axum::http::StatusCode::OK, BinaryAuthorizationDecision::Allow) -> [return: bb38, unwind: bb44];\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler response sources|handler selected _51"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_alternate_ready_state_fails(self) -> None:
        anchor = "switchInt(move _52) -> [0: bb68, 1: bb67, 2: bb66, 3: bb64, 4: bb65, otherwise: bb12];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _52) -> [0: bb68, 1: bb67, 2: bb66, 3: bb64, 4: bb65, 5: bb38, otherwise: bb12];", 1)
        with self.assertRaisesRegex(ValueError, "handler coroutine state"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_fallback_response_rebind_fails(self) -> None:
        anchor = "_0 = Poll::<Response<Body>>::Ready(move _3);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_3 = respond(const axum::http::StatusCode::OK, BinaryAuthorizationDecision::Allow) -> [return: bb1, unwind: bb2];\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "not_found fallback status/normal return|not_found selected response"):
            verifier.fallback_poll_projection(changed, "not_found", "NOT_FOUND")

    def test_mir_parser_handler_content_type_arms_fail(self) -> None:
        anchor = "switchInt(move _4) -> [0: bb5, otherwise: bb4];"
        self.assertIn(anchor, self.selected)
        # The same switch text occurs in another function; mutate the handler copy.
        at = self.selected.rfind(anchor)
        changed = (self.selected[:at] +
                   "switchInt(move _4) -> [0: bb4, otherwise: bb5];" +
                   self.selected[at + len(anchor):])
        with self.assertRaisesRegex(ValueError, "content-type denial polarity"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_body_result_arms_fail(self) -> None:
        anchor = "switchInt(move _21) -> [0: bb17, 1: bb16, otherwise: bb12];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _21) -> [0: bb16, 1: bb17, otherwise: bb12];", 1)
        with self.assertRaisesRegex(ValueError, "body failure polarity"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_json_result_arms_fail(self) -> None:
        anchor = "switchInt(move _27) -> [0: bb21, 1: bb20, otherwise: bb12];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "switchInt(move _27) -> [0: bb20, 1: bb21, otherwise: bb12];", 1)
        with self.assertRaisesRegex(ValueError, "parsed-request provenance"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_parsed_request_rebind_fails(self) -> None:
        anchor = "_23 = move _28;"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_28 = move _120;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler selected _28|parsed-request provenance"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_state_rebind_fails(self) -> None:
        anchor = "_31 = &((((*_53) as variant#4).0: ApiState).0: AuthorizationRuntime);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "(((*_53) as variant#4).0: ApiState) = move _120;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler runtime state rebound"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_body_result_alias_fails(self) -> None:
        anchor = "_21 = discriminant(_8);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_120 = &mut _8;\n        (*_120) = Result::<axum::body::Bytes, axum::Error>::Ok(move _121);\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler selected _8"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_content_type_alias_fails(self) -> None:
        anchor = "_4 = is_json_content_type(move _5)"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_120 = &mut _5;\n        (*_120) = Option::<&axum::http::HeaderValue>::Some(&_121);\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler selected _5"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_body_alias_fails(self) -> None:
        anchor = "_10 = to_bytes(move _11, const MAX_AUTHORIZATION_BODY_BYTES)"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_120 = &mut _11;\n        (*_120) = move _121;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler selected _11"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_request_slot_rebind_fails(self) -> None:
        anchor = "_12 = move (((*_53) as variant#4).1: axum::http::Request<axum::body::Body>);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "(((*_53) as variant#4).1: axum::http::Request<axum::body::Body>) = move _120;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "selected request state rebound"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_extracted_state_mutation_fails(self) -> None:
        anchor = "_3 = move ((*_53).0: axum::extract::State<ApiState>);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            anchor + "\n        _120 = &mut _3;\n        (*_120) = move _121;", 1)
        with self.assertRaisesRegex(ValueError, "handler extracted runtime state"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_request_conversion_input_mutation_fails(self) -> None:
        anchor = "_2 = move (_1.0: std::string::String);"
        function = "fn <impl at src/lib.rs:421:1: 421:67>::from(_1: AuthorizationApiRequest)"
        self.assertIn(function, self.selected)
        at = self.selected.index(anchor, self.selected.index(function))
        changed = (self.selected[:at] +
                   "_120 = &mut _1;\n        ((*_120).0: std::string::String) = const String::new();\n        " +
                   self.selected[at:])
        with self.assertRaisesRegex(ValueError, "parsed request input"):
            verifier.request_conversion_projection(changed)

    def test_mir_parser_handler_poll_input_rebind_fails(self) -> None:
        anchor = "_53 = copy (_1.0: &mut {async fn body of authorize()});"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_1 = move _120;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler poll input"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_handler_poll_context_rebind_fails(self) -> None:
        anchor = "_55 = move _2 as std::ptr::NonNull<std::task::Context<'_>> (Transmute);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_2 = move _120;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "handler poll context"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_public_router_intermediate_aliases_fail(self) -> None:
        cases = (
            ("_3 = Router::<ApiState>::fallback", "_4", "routed intermediate"),
            ("_2 = Router::<ApiState>::method_not_allowed_fallback", "_3", "fallback intermediate"),
            ("_0 = Router::<ApiState>::with_state", "_2", "method-fallback intermediate"),
            ("_8 = ApiState { runtime: move _9 };", "_9", "runtime intermediate"),
        )
        for anchor, local, diagnostic in cases:
            with self.subTest(local=local):
                at = self.selected.index(anchor, self.selected.index("fn authorization_router("))
                changed = (self.selected[:at] +
                           f"_120 = &mut {local};\n        (*_120) = move _121;\n        " +
                           self.selected[at:])
                with self.assertRaisesRegex(ValueError, diagnostic):
                    verifier.router_projection(changed)

    def test_mir_parser_public_router_result_alias_fails(self) -> None:
        start = self.selected.index("fn authorization_router(")
        anchor = "bb6: {\n        return;"
        at = self.selected.index(anchor, start)
        changed = (self.selected[:at] +
                   anchor.replace("return;", "_120 = &mut _0;\n        (*_120) = move _121;\n        return;") +
                   self.selected[at + len(anchor):])
        with self.assertRaisesRegex(ValueError, "public router result"):
            verifier.router_projection(changed)

    def test_mir_parser_worker_request_field_rebind_fails(self) -> None:
        anchor = "_28 = {closure@src/lib.rs:324:57: 324:59}"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "(_1.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest) = move _120;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "worker captured request field"):
            verifier.worker_projection(changed)

    def test_mir_parser_worker_request_input_escape_fails(self) -> None:
        anchor = "_28 = {closure@src/lib.rs:324:57: 324:59}"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "_120 = &mut _1;\n        (*_120) = move _121;\n        " + anchor, 1)
        with self.assertRaisesRegex(ValueError, "worker captured request field"):
            verifier.worker_projection(changed)

    def test_mir_parser_database_router_wrapper_target_fails(self) -> None:
        anchor = "move _3, authorization_router) -> [return: bb2, unwind continue];"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "move _3, alternate_router) -> [return: bb2, unwind continue];", 1)
        with self.assertRaisesRegex(ValueError, "database router wrapper"):
            verifier.database_router_wrapper_projection(changed)

    def test_mir_parser_handler_constructor_request_capture_fails(self) -> None:
        anchor = "{ __arg0: move _1, request: move _2 };"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "{ __arg0: move _1, request: move _120 };", 1)
        with self.assertRaisesRegex(ValueError, "handler async constructor capture"):
            verifier.async_constructor_projection(changed, "handler")

    def test_mir_parser_runtime_constructor_request_capture_fails(self) -> None:
        anchor = "{ self: copy _1, request: move _2 };"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            "{ self: copy _1, request: move _120 };", 1)
        with self.assertRaisesRegex(ValueError, "runtime async constructor capture"):
            verifier.async_constructor_projection(changed, "runtime")

    def test_mir_parser_worker_return_place_alias_fails(self) -> None:
        function = "fn <impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}::{closure#0}("
        anchor = "_0 = copy _30;"
        at = self.selected.index(anchor, self.selected.index(function))
        changed = (self.selected[:at] + anchor +
                   "\n        _120 = &mut _0;\n        (*_120) = move _121;" +
                   self.selected[at + len(anchor):])
        with self.assertRaisesRegex(ValueError, "worker return place"):
            verifier.worker_projection(changed)

    def test_mir_parser_handler_return_place_alias_fails(self) -> None:
        anchor = "_0 = Poll::<Response<Body>>::Ready(move _51);"
        self.assertIn(anchor, self.selected)
        changed = self.selected.replace(anchor,
            anchor + "\n        _120 = &mut _0;\n        (*_120) = move _121;", 1)
        with self.assertRaisesRegex(ValueError, "HTTP handler return place"):
            verifier.handler_poll_projection(changed)

    def test_mir_parser_respond_return_place_alias_fails(self) -> None:
        function = "fn respond(_1: StatusCode, _2: BinaryAuthorizationDecision)"
        anchor = "_0 = move _5;"
        at = self.selected.index(anchor, self.selected.index(function))
        changed = (self.selected[:at] + anchor +
                   "\n        _120 = &mut _0;\n        (*_120) = move _121;" +
                   self.selected[at + len(anchor):])
        with self.assertRaisesRegex(ValueError, "response return place"):
            verifier.respond_projection(changed)

    def test_mir_parser_fallback_constructor_return_place_aliases_fail(self) -> None:
        for function, status in (("not_found", "NOT_FOUND"),
                                 ("method_not_allowed", "METHOD_NOT_ALLOWED")):
            with self.subTest(function=function):
                start = self.selected.index(f"fn {function}() ->")
                at = self.selected.index("        return;", start)
                changed = (self.selected[:at] +
                           "        _120 = &mut _0;\n        (*_120) = move _121;\n" +
                           self.selected[at:])
                with self.assertRaisesRegex(ValueError, "constructor return place"):
                    verifier.fallback_poll_projection(changed, function, status)


if __name__ == "__main__":
    unittest.main()
