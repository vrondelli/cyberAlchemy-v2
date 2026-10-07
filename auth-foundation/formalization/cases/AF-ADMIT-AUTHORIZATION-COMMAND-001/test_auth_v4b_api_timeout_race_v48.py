#!/usr/bin/env python3
"""Fast hostile source, temporal, oracle, cleanup, and artifact fixtures for V48."""

import copy
import importlib.util
import pathlib
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-api-timeout-race-v48.py")
SPEC = importlib.util.spec_from_file_location("auth_v48_under_test", SOURCE)
assert SPEC and SPEC.loader
v48 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v48)


def expected_markers():
    request = v48.REQUEST
    return [f"AUTH_V48_CASE request={request}",
            f"AUTH_V48_HOLD request={request}",
            f"AUTH_V48_HTTP_DONE request={request} status=504 decision=DENY in_flight=1",
            f"AUTH_V48_RELEASE_REQUEST request={request}",
            f"AUTH_V48_PASSED request={request}",
            f"{v48.v40.PRE} request={request} epoch=1 auth_count=2 route_count=1",
            f"{v48.v40.GATE_RESULT} request={request} epoch=1 decision=Deny",
            f"AUTH_V48_END request={request} in_flight=0"]


def fake_build():
    before = {v48.v40.GATE: "gate", "authorization-api/Cargo.lock": "lock"}
    expected = {**before, v48.v38.TEST: "harness"}
    build = {"inspection": {"v48_hold_before_pool_take": True,
                            "api_library_mir_sha256": "api-mir",
                            "api_library_package_id": "package",
                            "api_library_features": []},
             "selected_mir_sha256": {name: "other-mir" for name in v48.v40.SELECTED},
             "test_package_id": "package", "metadata_sha256": "metadata",
             "lock_sha256": "lock"}
    build["selected_mir_sha256"][v48.MANIFEST] = "api-mir"
    return build, expected, before


class V48TimeoutRaceTest(unittest.TestCase):
    def test_exact_hold_between_inflight_guard_and_take(self):
        source = (v48.v29.ORIGINAL_IMPL / v48.API).read_text()
        changed = v48.mutate_api(source)
        self.assertEqual(changed.count(v48.HOLD_CALL), 1)
        self.assertLess(changed.index("let _in_flight = InFlightGuard"),
                        changed.index(v48.HOLD_CALL))
        self.assertLess(changed.index(v48.HOLD_CALL),
                        changed.index("let mut engine = pool.take()?;"))
        self.assertIn("state.request_id.as_deref() == Some(request_id)", changed)

    def test_hold_anchor_or_existing_control_rejected(self):
        source = (v48.v29.ORIGINAL_IMPL / v48.API).read_text()
        for hostile in (source.replace(v48.API_WORKER, "not-worker", 1),
                        source + v48.API_WORKER,
                        source + "v48_hold_before_pool_take"):
            with self.assertRaisesRegex(ValueError, "source anchor changed"):
                v48.mutate_api(hostile)

    def test_harness_pins_actual_held_http_and_cleanup_assertions(self):
        harness = v48.harness()
        for anchor in ("AUTH_V48_EXPIRES_AT", "Duration::from_millis(750)",
                       "keyed worker never acknowledged hold",
                       "HTTP completed before held ACK",
                       "worker released before HTTP 504",
                       "StatusCode::GATEWAY_TIMEOUT",
                       'serde_json::json!({"decision": "DENY"})',
                       "before.timed_out, before.in_flight",
                       "after.timed_out, after.in_flight",
                       "impl Drop for ReleaseOnDrop",
                       'if !self.cleaned {\n            eprintln!("AUTH_V48_RETAIN_OWNED_STAGE path={}", self.stage.display());',
                       "worker active; owned stage retained",
                       "std::fs::remove_dir(&self.stage)?"):
            self.assertIn(anchor, harness)
        drop_body = harness.split("impl Drop for OwnedStage {", 1)[1].split(
            "#[tokio::test]", 1)[0]
        self.assertNotIn("self.cleanup()", drop_body)
        self.assertNotIn("remove_file", drop_body)

    def test_harness_baseline_and_raii_cleanup_drift_rejected(self):
        original_hash = v48.HARNESS_SHA256
        original_prefix = v48.HARNESS_PREFIX
        try:
            v48.HARNESS_SHA256 = "wrong"
            with self.assertRaisesRegex(ValueError, "V38 harness seed/response baseline"):
                v48.harness()
            v48.HARNESS_SHA256 = original_hash
            v48.HARNESS_PREFIX = original_prefix.replace(
                "impl Drop for ReleaseOnDrop {", "impl NotDrop for ReleaseOnDrop {", 1)
            with self.assertRaisesRegex(ValueError, "harness transformation incomplete"):
                v48.harness()
            v48.HARNESS_PREFIX = original_prefix.replace(
                'return Err(std::io::Error::other("worker active; owned stage retained"));',
                "return Ok(());", 1)
            with self.assertRaisesRegex(ValueError, "harness transformation incomplete"):
                v48.harness()
            v48.HARNESS_PREFIX = original_prefix.replace(
                'if !self.cleaned {\n            eprintln!("AUTH_V48_RETAIN_OWNED_STAGE path={}", self.stage.display());',
                'if !self.cleaned {\n            let _ = self.cleanup();', 1)
            with self.assertRaisesRegex(ValueError, "harness transformation incomplete"):
                v48.harness()
        finally:
            v48.HARNESS_SHA256 = original_hash
            v48.HARNESS_PREFIX = original_prefix

    def test_strict_temporal_marker_order_and_no_ready_policy(self):
        baseline = expected_markers()
        self.assertEqual(v48.strict_markers("\n".join(baseline)), baseline)
        for hostile in (baseline[:2] + baseline[3:4] + baseline[2:3] + baseline[4:],
                        baseline[:2] + ["AUTH_V39_READY request=" + v48.REQUEST + " epoch=1"]
                        + baseline[2:],
                        baseline[:2] + [baseline[5]] + baseline[2:5] + baseline[6:],
                        baseline[:-1] + ["AUTH_V48_END request=wrong in_flight=0"]):
            with self.assertRaisesRegex(ValueError, "marker identity or order"):
                v48.strict_markers("\n".join(hostile))

    def test_coalesced_marker_rejected(self):
        rows = expected_markers()
        with self.assertRaisesRegex(ValueError, "coalesced or duplicate"):
            v48.strict_markers(rows[0] + rows[1] + "\n" + "\n".join(rows[2:]))

    def test_same_build_gate_metadata_and_lock_binding(self):
        build, expected, before = fake_build()
        v48.validate_build(build, expected, before, "metadata")
        mutants = []
        for field, value in (("test_package_id", "wrong"),
                             ("metadata_sha256", "wrong"),
                             ("lock_sha256", "wrong")):
            mutant = copy.deepcopy(build)
            mutant[field] = value
            mutants.append((mutant, expected, before))
        mutant = copy.deepcopy(build)
        mutant["selected_mir_sha256"][v48.MANIFEST] = "wrong"
        mutants.append((mutant, expected, before))
        mutant = copy.deepcopy(build)
        mutant["inspection"]["api_library_features"] = ["trace"]
        mutants.append((mutant, expected, before))
        changed = copy.deepcopy(expected)
        changed[v48.v40.GATE] = "wrong"
        mutants.append((build, changed, before))
        for candidate, expected_source, original in mutants:
            with self.assertRaisesRegex(ValueError, "artifact binding changed"):
                v48.validate_build(candidate, expected_source, original, "metadata")

    def test_fixed_expiry_bounded(self):
        self.assertEqual(v48.expiry_fixture(100), 220)


if __name__ == "__main__":
    unittest.main()
