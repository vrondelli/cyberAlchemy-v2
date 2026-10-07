#!/usr/bin/env python3
"""Hostile same-shape MIR fixtures for the bounded V45 parent-worker slice."""

import importlib.util
import pathlib
import subprocess
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-api-parent-worker-v45.py")
SPEC = importlib.util.spec_from_file_location("auth_v45_under_test", SOURCE)
assert SPEC and SPEC.loader
v45 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v45)


def compiled_api_library():
    with tempfile.TemporaryDirectory(prefix="auth-v45-unit-api-") as temporary:
        target = pathlib.Path(temporary)
        command = [str(v45.v5.TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                   "--target-dir", str(target), "--manifest-path",
                   str(v45.v5.IMPL / "authorization-api/Cargo.toml"),
                   "--lib", "--", "--emit=mir"]
        result = subprocess.run(command, cwd=v45.v5.ROOT, capture_output=True,
                                text=True, timeout=600, check=False)
        if result.returncode:
            raise AssertionError(result.stderr[-1500:])
        candidates = list((target / "debug/deps").glob(
            "auth_foundation_authorization_api-*.mir"))
        if len(candidates) != 1:
            raise AssertionError("selected API library MIR ambiguous")
        return candidates[0].read_text()


class V45ParentWorkerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mir = compiled_api_library()
        cls.inner = v45.v44.inspect_inner(cls.mir, v45.v44.v42.enum_tags("clean"))
        cls.parent = v45.inspect_parent(cls.mir, cls.inner)

    def check_mutant(self, old, new, error):
        self.assertIn(old, self.mir)
        with self.assertRaisesRegex(ValueError, error):
            v45.inspect_parent(self.mir.replace(old, new, 1), self.inner)

    def test_selected_normal_worker_and_open_effects(self):
        self.assertTrue(self.parent["same_engine_and_pool_put_on_catch_ok"])
        self.assertTrue(self.parent["put_continue_returns_same_decision"])
        self.assertFalse(self.parent["async_timeout_http_proven"])
        self.assertFalse(self.parent["transitive_effect_closure_proven"])
        self.assertTrue(any(row["kind"] == "unwind-terminate-cleanup"
                            for row in self.parent["local_effects"]["effect_rows"]))

    def test_request_capture_wrong_input_rejected(self):
        self.check_mutant(
            "request: move (_1.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest)",
            "request: move (_99.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest)",
            "inner closure engine/request capture")

    def test_engine_capture_wrong_reference_rejected(self):
        self.check_mutant("engine: move _29, request: move (_1.3:",
                          "engine: move _99, request: move (_1.3:",
                          "inner closure engine/request capture")

    def test_catch_wrong_wrapper_rejected(self):
        self.check_mutant("BinaryAuthorizationDecision>(move _27) -> [return: bb13",
                          "BinaryAuthorizationDecision>(move _99) -> [return: bb13",
                          "catch_unwind capture")

    def test_take_error_to_success_rejected(self):
        self.check_mutant("_24 = copy ((_19 as Break).0:",
                          "_24 = copy ((_19 as Continue).0:",
                          "take typed success arm ambiguous|same Break payload")

    def test_catch_error_to_success_rejected(self):
        self.check_mutant("_30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _40);",
                          "_30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(move _40);",
                          "catch Err exact WorkerUnavailable")

    def test_catch_error_decoy_wrong_payload_rejected(self):
        self.check_mutant("_40 = AuthorizationRuntimeError::WorkerUnavailable;\n        _30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _40);",
                          "_40 = AuthorizationRuntimeError::WorkerUnavailable;\n        _99 = AuthorizationRuntimeError::WorkerUnavailable;\n        _30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _99);",
                          "unique catch WorkerUnavailable constructor|catch Err exact WorkerUnavailable")

    def test_catch_error_post_constructor_touch_rejected(self):
        self.check_mutant("_40 = AuthorizationRuntimeError::WorkerUnavailable;\n        _30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _40);",
                          "_40 = AuthorizationRuntimeError::WorkerUnavailable;\n        deinit _40;\n        _30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _40);",
                          "catch WorkerUnavailable value touched")

    def test_put_wrong_engine_rejected(self):
        self.check_mutant("EnginePool::put(copy _35, move _37)",
                          "EnginePool::put(copy _35, move _99)",
                          "put same pool/engine")

    def test_taken_engine_unexpected_direct_touch_rejected(self):
        self.check_mutant("_18 = move _25;\n        _29 = &mut _18;",
                          "_18 = move _25;\n        _99 = &(_18.0: bool);\n        _29 = &mut _18;",
                          "taken engine value touched")

    def test_put_wrong_pool_rejected(self):
        self.check_mutant("_36 = &(_1.2: std::sync::Arc<EnginePool>);",
                          "_36 = &(_1.1: std::sync::Arc<EnginePool>);",
                          "put pool capture")

    def test_put_error_to_success_rejected(self):
        self.check_mutant("_39 = copy ((_33 as Break).0:",
                          "_39 = copy ((_33 as Continue).0:",
                          "put typed Break arm|put typed branch/discriminant labels|same Break payload")

    def test_take_residual_wrong_payload_rejected(self):
        self.check_mutant("from_residual(copy _24) -> [return: bb50",
                          "from_residual(copy _99) -> [return: bb50",
                          "same Break payload")

    def test_put_residual_wrong_payload_rejected(self):
        self.check_mutant("from_residual(copy _39) -> [return: bb21",
                          "from_residual(copy _99) -> [return: bb21",
                          "same Break payload")

    def test_success_wrong_decision_rejected(self):
        self.check_mutant("::Ok(copy _32);", "::Ok(copy _99);",
                          r"Ok\(same decision\)")

    def test_decision_projection_between_catch_and_put_rejected(self):
        self.check_mutant("_32 = copy ((_26 as Ok).0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision);",
                          "_32 = copy ((_26 as Ok).0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision);\n        _99 = &(_32.0: bool);",
                          "caught decision value touched")

    def test_decision_deinit_between_catch_and_put_rejected(self):
        self.check_mutant("_37 = move _18;\n        _34 = EnginePool::put",
                          "_37 = move _18;\n        deinit _32;\n        _34 = EnginePool::put",
                          "caught decision value touched")

    def test_decision_discriminant_between_catch_and_put_rejected(self):
        self.check_mutant("_41 = const false;\n        _37 = move _18;",
                          "_41 = const false;\n        SetDiscriminant(_32, 1);\n        _37 = move _18;",
                          "caught decision value touched")

    def test_success_start_block_rebind_rejected(self):
        self.check_mutant("_30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy _32);\n        goto -> bb22;",
                          "_30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy _32);\n        _30 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(_99);\n        goto -> bb22;",
                          "local _30 definition changed|put success value touched")

    def test_take_try_result_rebind_rejected(self):
        self.check_mutant("bb9: {\n        _23 = discriminant(_19);",
                          "bb9: {\n        _99 = &_19;\n        _23 = discriminant(_19);",
                          "take Try result value touched")

    def test_put_try_result_rebind_rejected(self):
        self.check_mutant("bb18: {\n        _38 = discriminant(_33);",
                          "bb18: {\n        deinit _33;\n        _38 = discriminant(_33);",
                          "put Try result value touched")

    def test_take_switch_labels_swapped_rejected(self):
        self.check_mutant("switchInt(move _23) -> [0: bb11, 1: bb12, otherwise: bb10];",
                          "switchInt(move _23) -> [1: bb11, 0: bb12, otherwise: bb10];",
                          "take typed branch/discriminant labels")

    def test_catch_switch_labels_swapped_rejected(self):
        self.check_mutant("switchInt(move _31) -> [0: bb15, 1: bb14, otherwise: bb10];",
                          "switchInt(move _31) -> [1: bb15, 0: bb14, otherwise: bb10];",
                          "catch typed branch/discriminant labels")

    def test_put_switch_labels_swapped_rejected(self):
        self.check_mutant("switchInt(move _38) -> [0: bb19, 1: bb20, otherwise: bb10];",
                          "switchInt(move _38) -> [1: bb19, 0: bb20, otherwise: bb10];",
                          "put typed branch/discriminant labels")

    def test_success_return_overwrite_rejected(self):
        self.check_mutant("_0 = copy _30;\n        drop(_26)",
                          "_0 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(_99);\n        drop(_26)",
                          "catch result merge")

    def test_alternate_normal_return_rejected(self):
        self.check_mutant("bb10: {\n        unreachable;",
                          "bb10: {\n        return;", "all normal returns|switch/unknown")

    def test_cleanup_termination_absence_rejected(self):
        mutant = self.mir.replace("unwind terminate(cleanup)", "unwind continue")
        with self.assertRaisesRegex(ValueError, r"unwind terminate\(cleanup\) rows absent"):
            v45.inspect_parent(mutant, self.inner)


if __name__ == "__main__":
    unittest.main()
