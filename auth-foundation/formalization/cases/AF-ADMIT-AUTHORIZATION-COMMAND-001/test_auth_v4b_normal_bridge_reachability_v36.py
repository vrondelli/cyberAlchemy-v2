#!/usr/bin/env python3
"""Fast V36 identity and output controls; V36 CLI runs compiled mirrors."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("auth-v4b-normal-bridge-reachability-v36.py")
SPEC = importlib.util.spec_from_file_location("auth_v36_normal_bridge", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
v36 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v36)


class NormalBridgeReachabilityTests(unittest.TestCase):
    def test_same_build_identity_rejects_trace_and_missing_artifacts(self) -> None:
        manifest = v36.v29.v6.ROOT_MANIFESTS["prototype"]
        row = {"features": [], "target_name": "auth-prototype-bridge",
               "target_kind": ["bin"], "mir_sha256": "a" * 64,
               "package_id": "package"}
        build = {"artifacts": {manifest: row, v36.ADMISSION: row, v36.READY: row},
                 "metadata_sha256": "b" * 64, "lock_sha256": "c" * 64}
        witness = v36.check_same_build("prototype", build, "auth-prototype-bridge")
        self.assertEqual(witness["root_mir_sha256"], "a" * 64)
        with patch.dict(row, {"features": ["trace"]}):
            with self.assertRaisesRegex(ValueError, "trace feature active"):
                v36.check_same_build("prototype", build, "auth-prototype-bridge")
        with patch.dict(build["artifacts"], clear=True):
            with self.assertRaisesRegex(ValueError, "artifacts missing"):
                v36.check_same_build("prototype", build, "auth-prototype-bridge")

    def test_binary_must_be_selected_target_inside_build(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary)
            binary = target / "debug/auth-prototype-bridge"
            binary.parent.mkdir()
            binary.write_bytes(b"test executable bytes")
            self.assertEqual(v36.selected_binary(target, "auth-prototype-bridge"), binary)
            with self.assertRaisesRegex(ValueError, "unexpected bridge target"):
                v36.selected_binary(target, "other")
            binary.unlink()
            binary.symlink_to(target / "outside")
            with self.assertRaisesRegex(ValueError, "missing or escaped"):
                v36.selected_binary(target, "auth-prototype-bridge")

    def test_exact_mirror_rejects_added_path_and_changed_byte(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / "root.rs"
            source.write_bytes(b"selected")
            expected = {"root.rs": v36.v29.sha(b"selected")}
            v36.exact_mirror(base, expected, "prototype")
            source.write_bytes(b"different")
            with self.assertRaisesRegex(ValueError, "mirror source path or byte"):
                v36.exact_mirror(base, expected, "prototype")
            source.write_bytes(b"selected")
            (base / "unexpected.rs").write_bytes(b"extra")
            with self.assertRaisesRegex(ValueError, "mirror source path or byte"):
                v36.exact_mirror(base, expected, "prototype")

    def test_callback_mutant_has_one_sentinel_at_selected_call(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / v36.v29.ROOT_SOURCE["prototype"]
            source.parent.mkdir(parents=True)
            source.write_text(v36.v29.HANDOFF["prototype"])
            digest = v36.mutate_callback(base, "prototype")
            changed = source.read_text()
            self.assertEqual(changed.count(v36.CALLBACK_SENTINEL), 1)
            self.assertEqual(digest, v36.v29.sha(source.read_bytes()))
            with self.assertRaisesRegex(ValueError, "anchor changed"):
                v36.mutate_callback(base, "prototype")

    def test_executable_must_be_cargo_emitted_root_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary)
            binary = target / "debug/auth-prototype-bridge"
            binary.parent.mkdir()
            binary.write_bytes(b"binary")
            manifest = v36.v29.v6.ROOT_MANIFESTS["prototype"]
            build = {"artifacts": {manifest: {"package_id": "root-package"}}}
            row = {"package_id": "root-package",
                   "target": {"name": "auth-prototype-bridge", "kind": ["bin"]},
                   "executable": str(binary)}
            self.assertEqual(v36.bind_cargo_executable(
                "prototype", [row], build, manifest, target,
                "auth-prototype-bridge"), binary)
            with self.assertRaisesRegex(ValueError, "not bound"):
                v36.bind_cargo_executable("prototype", [{**row, "executable": None}],
                                          build, manifest, target,
                                          "auth-prototype-bridge")

    def test_executable_output_must_match_selected_bridge_result(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            binary = base / "debug/auth-prototype-bridge"
            binary.parent.mkdir()
            binary.write_bytes(b"same binary")
            policy = base / "policy.json"
            for allow, output in ((True, {"decision": "ALLOW"}),
                                  (False, {"decision": "DENY"})):
                with self.subTest(allow=allow):
                    completed = SimpleNamespace(returncode=0,
                                                stderr="", stdout=json.dumps(output))
                    with patch.object(v36.subprocess, "run", return_value=completed):
                        witness = v36.run_binary(binary, base, "prototype", policy, allow)
                    self.assertEqual(witness["output"], output)
                    self.assertEqual(json.loads(policy.read_text())["revision"], 1)
            completed = SimpleNamespace(returncode=0, stderr="",
                                        stdout='{"decision":"ALLOW"}')
            with patch.object(v36.subprocess, "run", return_value=completed):
                with self.assertRaisesRegex(ValueError, "result changed"):
                    v36.run_binary(binary, base, "prototype", policy, False)
            with patch.object(v36.subprocess, "run", return_value=completed):
                with self.assertRaisesRegex(ValueError, "execution failed"):
                    v36.run_binary(binary, base, "prototype", policy, True,
                                   v36.CALLBACK_SENTINEL + "\n")

    def test_candidate_promotion_is_only_three_bridge_admission_rows(self) -> None:
        with patch.object(v36.v29.v7, "current_inventory", return_value=({}, "pin")), \
             patch.object(v36, "evaluate_root", side_effect=lambda root, _: {"root": root}):
            value = v36.evaluate()
        self.assertEqual(set(value["roots"]), set(v36.ROOTS))
        self.assertEqual(value["candidate_promotions"], [
            {"root": root, "entrypoint": "admission-service-with-ready",
             "state": "reachable", "witness": "normal-same-build-allow-handoff"}
            for root in v36.ROOTS
        ])
        for key in ("endpoint_set_closed", "all_path_ready_dominance",
                    "runtime_guarantees_observed"):
            self.assertIs(value[key], False)


if __name__ == "__main__":
    unittest.main()
