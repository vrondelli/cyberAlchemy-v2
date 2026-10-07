#!/usr/bin/env python3
"""Fast source/observation hostile controls for the V38 candidate."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v38", CASE / "auth-v4b-normal-api-reachability-v38.py")
assert SPEC and SPEC.loader
v38 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v38)


class NormalApiReachabilityV38Tests(unittest.TestCase):
    def test_mirror_harness_only_removes_exclusively_created_sqlite_stage(self):
        source = v38.HARNESS
        self.assertIn("match std::fs::create_dir(&stage)", source)
        self.assertIn("Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue", source)
        self.assertIn("std::fs::remove_dir(&stage).expect", source)
        self.assertNotIn("remove_dir_all", source)
        self.assertNotIn("temp_dir().join(format!(\"auth-v38-{}-{nonce}.sqlite\"", source)

    def test_api_marker_injection_exact_anchors(self):
        source = v38.HANDLER_ANCHOR + v38.RUNTIME_ANCHOR + v38.WORKER_ANCHOR
        changed = v38.mutate_api(source)
        for marker in ("AUTH_V38_HTTP", "AUTH_V38_RUNTIME", "AUTH_V38_WORKER"):
            self.assertEqual(changed.count(marker), 1)
        self.assertLess(changed.index("AUTH_V38_WORKER"),
                        changed.index(v38.WORKER_ANCHOR) + len(v38.WORKER_ANCHOR) + 100)

    def test_missing_or_duplicate_source_anchor_rejected(self):
        with self.assertRaisesRegex(ValueError, "anchor changed"):
            v38.mutate_api(v38.HANDLER_ANCHOR + v38.RUNTIME_ANCHOR)
        with self.assertRaisesRegex(ValueError, "anchor changed"):
            v38.mutate_api(v38.HANDLER_ANCHOR * 2 + v38.RUNTIME_ANCHOR +
                           v38.WORKER_ANCHOR)

    def test_marked_allow_requires_full_order_and_same_request(self):
        log = "\n".join(f"AUTH_V38_{name} request=auth_v38_allow" +
                        (" epoch=1" if name == "READY" else "")
                        for name in ("CASE", *v38.MARKERS))
        log += "\nAUTH_V38_END request=auth_v38_allow decision=ALLOW\n"
        self.assertEqual(len(v38.markers(log, "allow", "marked")), 7)
        with self.assertRaisesRegex(ValueError, "marker order"):
            v38.markers(log.replace("auth_v38_allow epoch=1",
                                    "other_request epoch=1"), "allow", "marked")
        with self.assertRaisesRegex(ValueError, "marker order"):
            v38.markers(log.replace("AUTH_V38_READY", "AUTH_V38_POLICY"),
                        "allow", "marked")

    def test_duplicate_pre_gate_rejects_downstream_entry(self):
        log = "\n".join(f"AUTH_V38_{name} request=auth_v38_duplicate"
                        for name in ("CASE", "HTTP", "RUNTIME", "WORKER"))
        log += "\nAUTH_V38_END request=auth_v38_duplicate decision=DENY\n"
        self.assertEqual(len(v38.markers(log, "duplicate", "marked")), 5)
        with self.assertRaisesRegex(ValueError, "marker order"):
            v38.markers(log.replace("AUTH_V38_END", "AUTH_V38_READY request=auth_v38_duplicate\nAUTH_V38_END"),
                        "duplicate", "marked")

    def test_clean_and_policy_mutant_markers_are_distinct(self):
        clean = "AUTH_V38_CASE request=auth_v38_allow\n" \
                "AUTH_V38_END request=auth_v38_allow decision=ALLOW\n"
        mutant = "AUTH_V38_CASE request=auth_v38_allow\n" + "\n".join(
            f"AUTH_V38_{name} request=auth_v38_allow" +
            (" epoch=1" if name == "READY" else "") for name in v38.MARKERS) + \
            "\nAUTH_V38_END request=auth_v38_allow decision=DENY\n"
        self.assertEqual(len(v38.markers(clean, "allow", "clean")), 2)
        self.assertEqual(len(v38.markers(mutant, "allow", "policy-deny")), 7)

    def test_wrong_test_target_or_trace_feature_is_rejected(self):
        with tempfile.TemporaryDirectory(prefix="auth-v38-unit-") as temporary:
            base = Path(temporary)
            implementation = base / "implementation"
            target = base / "target"
            target.mkdir()
            binary = target / "v38_probe"
            binary.write_bytes(b"synthetic test binary")
            package_id = "synthetic-api-package"
            metadata = {"packages": [{"id": package_id,
                                     "manifest_path": str(implementation / v38.MANIFEST)}]}
            expected = {name: {"package_id": package_id,
                               "features": []} for name in v38.SELECTED}
            test_row = {"package_id": package_id, "target": {
                "name": "v38_probe", "kind": ["test"],
                "src_path": str(implementation / v38.TEST)},
                "features": [], "executable": str(binary)}
            with patch.object(v38.v29.v7, "expected_local_artifacts", return_value=expected):
                with self.assertRaisesRegex(ValueError, "test artifact ambiguous"):
                    v38.artifact_binding([test_row, test_row], metadata,
                                         list(v38.SELECTED), target, implementation)
                with self.assertRaisesRegex(ValueError, "feature binding changed"):
                    v38.artifact_binding([{**test_row, "features": ["trace"]}], metadata,
                                         list(v38.SELECTED), target, implementation)
                with self.assertRaisesRegex(ValueError, "executable or feature binding changed"):
                    v38.artifact_binding([{**test_row, "executable": str(base / "wrong")}],
                                         metadata, list(v38.SELECTED), target, implementation)


if __name__ == "__main__":
    unittest.main()
