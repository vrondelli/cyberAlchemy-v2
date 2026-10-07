#!/usr/bin/env python3
"""Fast hostile fixtures for the V43 isolated prototype root-oracle control."""

import importlib.util
import json
import pathlib
import unittest

SOURCE = pathlib.Path(__file__).with_name("auth-v4b-root-flip-control-v43.py")
SPEC = importlib.util.spec_from_file_location("auth_v43_under_test", SOURCE)
assert SPEC and SPEC.loader
v43 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v43)


def build_rows():
    manifests = [v43.MANIFEST, v43.v40.AUTHORITY_MANIFEST,
                 v43.v40.GATE_MANIFEST, v43.v40.READY_MANIFEST,
                 v43.v40.POLICY_MANIFEST]
    source = {v43.ROOT_SOURCE: "root-base", v43.v40.AUTHORITY: "authority",
              v43.v40.GATE: "gate", v43.v40.READY: "ready",
              v43.v40.POLICY: "policy"}
    mir = {key: key + "-base" for key in manifests}
    baseline = {"source_sha256": source, "selected_mir_sha256": mir,
                "binary_sha256": "binary-base", "metadata_sha256": "metadata",
                "lock_sha256": "lock", "root_package_id": "package"}
    flipped = {**baseline,
               "source_sha256": {**source, v43.ROOT_SOURCE: "root-flip"},
               "selected_mir_sha256": {**mir, v43.MANIFEST: "root-mir-flip"},
               "binary_sha256": "binary-flip"}
    return baseline, flipped, manifests


class V43ControlTest(unittest.TestCase):
    def test_runtime_env_removes_ambient_trace_switch(self):
        source = {"AUTH_AUTHORIZATION_TRACE_STDERR": "1", "KEEP": "value"}
        selected = v43.runtime_env(source)
        self.assertNotIn("AUTH_AUTHORIZATION_TRACE_STDERR", selected)
        self.assertEqual(selected["KEEP"], "value")
        self.assertIn("AUTH_AUTHORIZATION_TRACE_STDERR", source)

    def test_exact_mapping_anchor(self):
        source = "let value = " + v43.OLD + ";"
        self.assertEqual(v43.flip_mapping(source), "let value = " + v43.NEW + ";")
        for hostile in (source.replace(v43.OLD, "not-the-anchor"),
                        source + " " + v43.OLD,
                        source + " " + v43.NEW):
            with self.assertRaisesRegex(ValueError, "anchor ambiguous"):
                v43.flip_mapping(hostile)

    def test_strict_gate_deny_trace_and_no_ready(self):
        expected = v43.v40.expected_trace(v43.ROOT, v43.VARIANT, "duplicate")
        self.assertEqual(v43.strict_trace("\n".join(expected) + "\n"), expected)
        for hostile in ("\n".join(expected[:-1]),
                        "\n".join(expected + ["AUTH_V39_READY request=verified-request epoch=1"]),
                        "\n".join(expected).replace("request=verified-request", "request=other", 1),
                        "\n".join(expected) + "\nextra"):
            with self.assertRaises(ValueError):
                v43.strict_trace(hostile)

    def test_terminal_output_exact(self):
        trace = "\n".join(v43.v40.expected_trace(v43.ROOT, v43.VARIANT,
                                                   "duplicate")) + "\n"
        self.assertEqual(v43.validate_run('{"decision":"DENY"}\n', trace,
                                          "DENY")["decision"], "DENY")
        self.assertEqual(v43.validate_run('{"decision":"ALLOW"}\n', trace,
                                          "ALLOW")["decision"], "ALLOW")
        for hostile in ('{"decision":"ALLOW"}', '{"decision":"DENY","extra":1}',
                        'not-json', '{"decisions":[false]}'):
            with self.assertRaisesRegex(ValueError, "terminal DENY output"):
                v43.validate_run(hostile, trace, "DENY")

    def test_fixture_identity_and_expiry(self):
        now = 1000
        payload = {"issuer": "local", "subject": "alice", "kind": "human",
                   "client": "client", "expires_at": now + 120}
        policy = {"principals": [{"issuer": "local", "subject": "alice",
                                  "kind": "human", "client": "client",
                                  "enabled": True, "read": True}]}
        raw, policy_raw, expiry = v43.fixture_bytes(payload, policy, now)
        self.assertEqual(expiry, now + 120)
        self.assertEqual(json.loads(raw), payload)
        self.assertEqual(json.loads(policy_raw), policy)
        with self.assertRaisesRegex(ValueError, "expired or expiry"):
            v43.fixture_bytes(payload, policy, now + 115)
        with self.assertRaisesRegex(ValueError, "identity drift"):
            v43.fixture_bytes(payload, {"principals": [{**policy["principals"][0],
                                                       "subject": "mallory"}]}, now)

    def test_hash_identity_controls(self):
        baseline, flipped, manifests = build_rows()
        v43.compare_builds(baseline, flipped, manifests)
        hostile_rows = [
            {**flipped, "source_sha256": {**flipped["source_sha256"],
                                           v43.v40.AUTHORITY: "authority-mutant"}},
            {**flipped, "selected_mir_sha256": {**flipped["selected_mir_sha256"],
                                                v43.v40.GATE_MANIFEST: "gate-mutant"}},
            {**flipped, "binary_sha256": baseline["binary_sha256"]},
            {**flipped, "metadata_sha256": "other-metadata"},
            {**flipped, "source_sha256": baseline["source_sha256"]},
        ]
        for hostile in hostile_rows:
            with self.assertRaises(ValueError):
                v43.compare_builds(baseline, hostile, manifests)


if __name__ == "__main__":
    unittest.main()
