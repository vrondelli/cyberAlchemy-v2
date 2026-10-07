#!/usr/bin/env python3
"""Fast hostile source, artifact, fixture, marker, and oracle checks for V47."""

import copy
import importlib.util
import pathlib
import time
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-api-flip-control-v47.py")
SPEC = importlib.util.spec_from_file_location("auth_v47_under_test", SOURCE)
assert SPEC and SPEC.loader
v47 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v47)


def fake_builds():
    sources = {name: "same" for name in
               (v47.API, v47.v40.AUTHORITY, v47.v40.READY,
                v47.v40.POLICY, v47.v40.GATE, v47.v38.TEST)}
    mir = {name: "same" for name in v47.v40.SELECTED}
    baseline = {"source_sha256": sources,
                "selected_mir_sha256": mir,
                "metadata_sha256": "metadata", "lock_sha256": "lock",
                "test_package_id": "package", "api_features": [],
                "binary_sha256": "baseline-binary",
                "inspection": {"v44_inner_api": {
                    "err_and_nonready_return_deny": True,
                    "api_library_features": []}}}
    flipped = copy.deepcopy(baseline)
    flipped["source_sha256"][v47.API] = "flipped-source"
    flipped["selected_mir_sha256"][v47.MANIFEST] = "flipped-mir"
    flipped["binary_sha256"] = "flipped-binary"
    flipped["inspection"] = {"v44_rejected_exact_flip": True,
                             "v44_diagnostic_single_constructor_restoration_passed": True,
                             "api_library_features": []}
    return baseline, flipped


class V47FlipControlTest(unittest.TestCase):
    def test_exact_non_test_fallback_flip(self):
        source = (v47.v29.ORIGINAL_IMPL / v47.API).read_text()
        flipped = v47.flip_mapping(source)
        self.assertEqual(flipped.count(v47.NEW), 1)
        self.assertEqual(flipped.count(v47.OLD), 0)
        self.assertIn("#[cfg(test)]\n            let outcome = catch_unwind", flipped)
        self.assertEqual(source.replace(v47.OLD, v47.NEW, 1), flipped)

    def test_ambiguous_or_wrong_cfg_flip_rejected(self):
        for hostile in ("not-the-anchor", v47.OLD + v47.OLD,
                        v47.OLD + v47.NEW,
                        v47.OLD.replace("#[cfg(not(test))]", "#[cfg(test)]")):
            with self.assertRaisesRegex(ValueError, "unique cfg"):
                v47.flip_mapping(hostile)

    def test_harness_pins_actual_http_and_metrics_oracles(self):
        harness = v47.fixed_harness()
        self.assertIn("AUTH_V47_EXPIRES_AT", harness)
        self.assertIn("assert_eq!(response.status(), StatusCode::OK);", harness)
        self.assertIn('assert_eq!(value, serde_json::json!({"decision": expected}));',
                      harness)
        self.assertIn("assert_eq!(metrics.in_flight, 0", harness)

    def test_harness_anchor_or_oracle_loss_rejected(self):
        original = v47.v38.HARNESS
        try:
            for hostile in (
                original.replace(v47.HARNESS_ANCHOR, "let expires_at = 1;", 1),
                original.replace("assert_eq!(response.status(), StatusCode::OK);",
                                 "// missing status assertion", 1),
                original.replace('assert_eq!(value, serde_json::json!({"decision": expected}));',
                                 "// missing JSON assertion", 1)):
                v47.v38.HARNESS = hostile
                with self.assertRaisesRegex(ValueError, "fixture expiry or actual HTTP/metrics oracle"):
                    v47.fixed_harness()
        finally:
            v47.v38.HARNESS = original

    def test_strict_gate_deny_marker_prefix_and_terminal(self):
        baseline = v47.v40.expected_trace(v47.ROOT, v47.VARIANT, "duplicate")
        flipped = baseline[:-1] + [baseline[-1].replace("decision=DENY",
                                                        "decision=ALLOW")]
        self.assertEqual(v47.strict_markers("\n".join(baseline), "DENY"), baseline)
        self.assertEqual(v47.strict_markers("\n".join(flipped), "ALLOW"), flipped)
        for hostile in (flipped[:-2] + flipped[-1:],
                        flipped[:2] + ["AUTH_V39_READY request=auth_v38_duplicate epoch=1"]
                        + flipped[2:],
                        flipped[:-1] + [baseline[-1]]):
            with self.assertRaisesRegex(ValueError, "marker order or identity drift"):
                v47.strict_markers("\n".join(hostile), "ALLOW")

    def test_marker_coalescing_rejected(self):
        rows = v47.v40.expected_trace(v47.ROOT, v47.VARIANT, "duplicate")
        hostile = rows[0] + rows[1] + "\n" + "\n".join(rows[2:])
        with self.assertRaisesRegex(ValueError, "coalesced/duplicate"):
            v47.strict_markers(hostile, "DENY")

    def test_same_logical_fixture_and_expiry_validation(self):
        now = int(time.time())
        fixture = v47.logical_fixture(now + 80, "harness", now)
        self.assertEqual(fixture, v47.logical_fixture(now + 80, "harness", now))
        for expiry in (now, now + 5, now + 121, True):
            with self.assertRaisesRegex(ValueError, "expired/outside window"):
                v47.logical_fixture(expiry, "harness", now)

    def test_only_api_source_and_mir_binary_may_differ(self):
        baseline, flipped = fake_builds()
        v47.compare_builds(baseline, flipped)
        mutants = []
        for field, key in (("source_sha256", v47.v40.GATE),
                           ("selected_mir_sha256", v47.v40.GATE_MANIFEST)):
            mutant = copy.deepcopy(flipped)
            mutant[field][key] = "changed"
            mutants.append(mutant)
        for key in ("metadata_sha256", "lock_sha256", "test_package_id",
                    "api_features", "binary_sha256"):
            mutant = copy.deepcopy(flipped)
            mutant[key] = baseline[key] if key == "binary_sha256" else "changed"
            mutants.append(mutant)
        for mutant in mutants:
            with self.assertRaises(ValueError):
                v47.compare_builds(baseline, mutant)

    def test_v44_baseline_or_flip_rejection_absence_rejected(self):
        baseline, flipped = fake_builds()
        baseline["inspection"]["v44_inner_api"]["err_and_nonready_return_deny"] = False
        with self.assertRaisesRegex(ValueError, "baseline V44/flip rejection"):
            v47.compare_builds(baseline, flipped)
        baseline, flipped = fake_builds()
        flipped["inspection"]["v44_rejected_exact_flip"] = False
        with self.assertRaisesRegex(ValueError, "baseline V44/flip rejection"):
            v47.compare_builds(baseline, flipped)
        baseline, flipped = fake_builds()
        flipped["inspection"]["v44_diagnostic_single_constructor_restoration_passed"] = False
        with self.assertRaisesRegex(ValueError, "baseline V44/flip rejection"):
            v47.compare_builds(baseline, flipped)


if __name__ == "__main__":
    unittest.main()
