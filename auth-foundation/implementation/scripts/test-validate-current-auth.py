#!/usr/bin/env python3
"""Fail-closed controls for the current selected Auth aggregate validator."""

import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("validate-current-auth.py")
SPEC = importlib.util.spec_from_file_location("auth_current_aggregate", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentAuthValidationTests(unittest.TestCase):
    def test_command_failure_retains_stdout_test_identity(self) -> None:
        from subprocess import CompletedProcess

        failed = CompletedProcess(args=["false"], returncode=1,
                                  stdout="test timing_sensitive ... FAILED\n",
                                  stderr="error: test failed\n")
        with patch.object(MODULE.subprocess, "run", return_value=failed):
            with self.assertRaisesRegex(ValueError, "timing_sensitive"):
                MODULE.command(["false"])

    def test_aggregate_snapshots_current_technical_sources(self) -> None:
        snapshot = MODULE.technical_source_snapshot()
        self.assertIn("implementation/authorization-api/tests/timeout_after_response.rs", snapshot)
        self.assertIn("implementation/scripts/validate-current-evidence-successor-v8.py", snapshot)
        self.assertIn("implementation/current-evidence-successor-v7/README.md", snapshot)
        self.assertIn("implementation/authorization-schema/migrations/0001_auth_state.sql", snapshot)
        self.assertIn("implementation/authorization-trace/src/lib.rs", snapshot)
        self.assertIn("implementation/scripts/validate-current-evidence-successor-v9.py", snapshot)
        self.assertIn("implementation/scripts/validate-current-evidence-successor-v10.py", snapshot)

    def test_aggregate_snapshots_current_sidecars_and_predecessors(self) -> None:
        protected = MODULE.protected_bytes()
        expected = {
            "implementation/standard-conformance/authorization-service-binding.json",
            "implementation/standard-conformance/trusted-input-evidence.json",
            "implementation/d65-chain.json",
            "implementation/current-trusted-input-successor-v1/authorization-service-binding.v4.json",
            "implementation/current-trusted-input-successor-v1/trusted-input-evidence.v3.json",
            "implementation/current-trusted-input-successor-v1/d65-chain.v7.json",
            "implementation/current-evidence-successor-v5/binding.json",
            "implementation/current-evidence-successor-v6/binding.json",
            "implementation/current-evidence-successor-v7/binding.json",
            "implementation/current-evidence-successor-v8/binding.json",
            "implementation/current-evidence-successor-v9/binding.json",
            "implementation/current-evidence-successor-v10/binding.json",
        }
        self.assertTrue(expected <= set(protected))

    def test_selected_rust_runs_trace_feature_api_integration(self) -> None:
        calls = []

        def record(args, *, cwd=MODULE.REPO, strict=False, timeout=900):
            calls.append((args, cwd))
            return ""

        with patch.object(MODULE, "command", side_effect=record):
            results = MODULE.selected_rust()
        api = MODULE.IMPL / "authorization-api"
        trace = [args for args, cwd in calls if cwd == api and args[1:3] == ["cargo", "test"]
                 and "--features" in args]
        self.assertEqual(trace, [[str(MODULE.TOOLCHAIN), "cargo", "test", "--locked",
                                  "--offline", "--all-targets", "--features", "trace"]])
        self.assertEqual(results["authorization-api"]["trace_feature_all_targets_test"], "pass")
        self.assertTrue(all(row["trace_feature_all_targets_test"] == "not_applicable"
                            for name, row in results.items() if name != "authorization-api"))

    def test_current_stages_exclude_historical_validator(self) -> None:
        self.assertEqual(len(MODULE.STAGES), 4)
        self.assertNotIn("validate.py", [script for _, script in MODULE.STAGES])
        self.assertNotIn("validate-trusted-input.py", [script for _, script in MODULE.STAGES])
        self.assertIn(("current_trusted_input_d65", "validate-current-trusted-input-successor-v1.py"),
                      MODULE.STAGES)
        self.assertIn(("selected_technical_v10", "validate-current-evidence-successor-v10.py"),
                      MODULE.STAGES)
        self.assertIn("authorization-api", MODULE.RUST_CRATES)
        self.assertEqual(len(MODULE.RUST_CRATES), 7)
        self.assertTrue({"authorization-api", "authorization-ready-authority",
                         "authorization-ready-decision"} <= MODULE.DOC_CRATES)

    def test_stage_failure_or_claim_escalation_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "invalid JSON"):
            MODULE.checked_json("selected_technical_v10", "not JSON")
        for value in ({"status": "fail", "runtime_guarantees_observed": False},
                      {"status": "pass", "runtime_guarantees_observed": True},
                      {"status": "pass", "runtime_guarantees_observed": False,
                       "targets": [{"current_target_observed": True}]}):
            with self.assertRaises(ValueError):
                MODULE.checked_json("runtime_projection", json.dumps(value))
        with self.assertRaisesRegex(ValueError, "v10 technical successor identity changed"):
            MODULE.checked_json("selected_technical_v10", json.dumps({
                "status": "pass", "runtime_guarantees_observed": False,
                "predecessor_status": "current", "changed_source": "other.rs"}))
        with self.assertRaisesRegex(ValueError, "current trusted-input/D65 successor incomplete"):
            MODULE.checked_json("current_trusted_input_d65", json.dumps({
                "status": "pass", "runtime_guarantees_observed": False,
                "checks": 94, "historical_predecessors": "preserved-source-stale",
                "service_binding": "implementation/standard-conformance/authorization-service-binding.json"}))
        current = {
            "status": "pass", "runtime_guarantees_observed": False,
            "authority_effect": "none", "checks": 94,
            "historical_predecessors": "preserved-source-stale",
            "service_binding": "implementation/current-trusted-input-successor-v1/authorization-service-binding.v4.json",
            "evidence": "implementation/current-trusted-input-successor-v1/trusted-input-evidence.v3.json",
            "d65_chain": "implementation/current-trusted-input-successor-v1/d65-chain.v7.json",
        }
        self.assertEqual(MODULE.checked_json("current_trusted_input_d65", json.dumps(current)), current)
        for mutation in ({"runtime_guarantees_observed": "false"},
                         {"authority_effect": "granted"}):
            with self.assertRaisesRegex(ValueError, "current trusted-input/D65 successor incomplete"):
                MODULE.checked_json("current_trusted_input_d65", json.dumps({**current, **mutation}))
        for observed in (None, "absent"):
            value = {"status": "pass", "binding":
                     "implementation/current-evidence-successor-v10/binding.json",
                     "cells": 15, "observed_local_rustc_input_count": 28,
                     "authority_effect": "none"}
            if observed != "absent":
                value["runtime_guarantees_observed"] = observed
            with self.assertRaisesRegex(ValueError, "v10 technical successor identity changed"):
                MODULE.checked_json("selected_technical_v10", json.dumps(value))

    def test_mir_indeterminate_ceiling_and_all_roots_are_required(self) -> None:
        valid = {"status": "indeterminate", "endpoint_set_closed": False,
                 "all_path_ready_dominance": False, "runtime_guarantees_observed": False,
                 "normal_mir_sha256": {name: "a" * 64 for name in MODULE.MIR_ROOTS},
                 "census": {"roots": {name: {} for name in ("api", "tenant", "prototype", "https")},
                            "admission": {}, "authority": {}, "decision": {}}}
        self.assertEqual(MODULE.checked_mir(json.dumps(valid))["status"], "indeterminate")
        for changed in (dict(valid, status="pass"),
                        dict(valid, runtime_guarantees_observed=True),
                        dict(valid, normal_mir_sha256={"api": "a" * 64})):
            with self.assertRaises(ValueError):
                MODULE.checked_mir(json.dumps(changed))

    def test_syntax_inventory_requires_eleven_passing_controls(self) -> None:
        self.assertEqual(MODULE.endpoint_inventory("# tests 11\n# pass 11\n# fail 0\n")["tests"], 11)
        with self.assertRaises(ValueError):
            MODULE.endpoint_inventory("# pass 7\n# fail 0\n")

    def test_closure_mir_requires_unresolved_effects_and_no_claim_upgrade(self) -> None:
        names = ("authentication-https/bridge", "authentication-prototype/bridge",
                 "authorization-admission-service", "authorization-api",
                 "authorization-metadata-reader", "authorization-ready-authority",
                 "authorization-ready-decision", "authorization-state-model",
                 "authorization-state-reader", "command-boundary-runtime-v2",
                 "standard-runtime", "tenant-bridge", "trusted-input-reader",
                 "trusted-input-runtime")
        digests = {f"{name}/Cargo.toml": "a" * 64 for name in names}
        counts = {kind: 1 for kind in ("generated-policy", "drop", "dynamic-target",
                                      "callback-carrier", "sql-boundary", "assert-panic",
                                      "unwind-resume")}
        valid = {"schema_version": "auth-foundation.v4b-selected-closure-census/v6-candidate",
                 "status": "indeterminate", "endpoint_set_closed": False,
                 "all_path_ready_dominance": False, "runtime_guarantees_observed": False,
                 "manifest_count": 14, "standalone_default_mir_sha256": digests,
                 "selected_root_local_features": {root: {name: [] for name in digests}
                                                  for root in MODULE.PUBLIC_ROOTS},
                 "compiled_policy_ingress": {"direct": [{"manifest":
                     "authorization-ready-decision/Cargo.toml", "line": 1}],
                     "reified": [], "unresolved": []},
                 "compiled_effect_edges": {"function_counts": {name: 1 for name in digests},
                     "terminator_count": len(counts), "class_counts": counts,
                     "unresolved_count": 6, "unwind_edge_count": 7,
                     "edges_sha256": "a" * 64},
                 "rustc_version_sha256": "a" * 64, "source_set_sha256": "a" * 64,
                 "predecessor_sha256": "a" * 64}
        self.assertEqual(MODULE.checked_closure_mir(json.dumps(valid))
                         ["unresolved_effect_terminators"], 6)
        for changed in (dict(valid, status="pass"),
                        dict(valid, endpoint_set_closed=True),
                        dict(valid, standalone_default_mir_sha256={}),
                        dict(valid, compiled_policy_ingress={"direct": [], "reified": [],
                                                              "unresolved": []}),
                        dict(valid, compiled_effect_edges={**valid["compiled_effect_edges"],
                                                         "unresolved_count": 0})):
            with self.assertRaises(ValueError):
                MODULE.checked_closure_mir(json.dumps(changed))

    def test_root_context_requires_all_four_bound_indeterminate_builds(self) -> None:
        builds = {}
        for name, manifest in MODULE.PUBLIC_MANIFESTS.items():
            artifacts = {f"candidate-{index}/Cargo.toml": {
                "package_id": f"local-{index}", "features": [], "mir_sha256": "a" * 64,
                "dep_info_sha256": "b" * 64, "rust_source_count": 1,
                "data_dependency_count": 0, "approved_external_data_dependencies": [],
                "unclassified_external_dependency_count": 0}
                         for index in range(9)}
            artifacts[manifest] = {"package_id": "root", "features": [], "mir_sha256": "a" * 64,
                "dep_info_sha256": "b" * 64, "rust_source_count": 1,
                "data_dependency_count": 0, "approved_external_data_dependencies": [],
                "unclassified_external_dependency_count": 0}
            artifacts["authorization-ready-decision/Cargo.toml"] = {
                "package_id": "decision", "features": [], "mir_sha256": "a" * 64,
                "dep_info_sha256": "b" * 64, "rust_source_count": 1,
                "data_dependency_count": 0, "approved_external_data_dependencies": [],
                "unclassified_external_dependency_count": 0}
            builds[name] = {"local_package_count": 11, "artifacts": artifacts,
                "metadata_sha256": "a" * 64, "lock_sha256": "a" * 64,
                "effect_edges_sha256": "a" * 64,
                "decision_capability_boundary": {
                    "selected_downstream_entrypoint_ids": ["generated-policy", "ready-decision"],
                    "known_entrypoint_count": 22,
                    "excluded_raw_decision_manifests":
                        MODULE.EXCLUDED_RAW_DECISION_MANIFESTS},
                "generated_policy_ingress": {"direct": [{"manifest":
                    "authorization-ready-decision/Cargo.toml", "line": 1}],
                    "reified": [], "unresolved": []},
                "effect_class_counts": {"generated-policy": 1, "drop": 2},
                "effect_terminators": 3, "unresolved_effect_terminators": 2}
        valid = {"schema_version": "auth-foundation.v4b-root-context-census/v7-candidate",
                 "status": "indeterminate", "instrumentation": "RUSTFLAGS=--emit=mir,link",
                 "endpoint_set_closed": False, "all_path_ready_dominance": False,
                 "runtime_guarantees_observed": False, "root_context_builds": builds,
                 "approved_external_data_sha256": {name: "c" * 64
                    for name in MODULE.APPROVED_SQL_DATA},
                 "rustc_version_sha256": "a" * 64, "source_set_sha256": "a" * 64,
                 "predecessor_sha256": "a" * 64}
        self.assertEqual(MODULE.checked_root_context_mir(json.dumps(valid))["roots"],
                         sorted(MODULE.PUBLIC_ROOTS))
        api_manifest = MODULE.PUBLIC_MANIFESTS["api"]
        for changed in (dict(valid, status="pass"),
                        dict(valid, endpoint_set_closed=True),
                        dict(valid, approved_external_data_sha256={}),
                        dict(valid, root_context_builds={"api": builds["api"]}),
                        dict(valid, root_context_builds={**builds, "api": {**builds["api"],
                             "decision_capability_boundary": {}}}),
                        dict(valid, root_context_builds={**builds, "api": {**builds["api"],
                             "artifacts": {**builds["api"]["artifacts"], api_manifest: {
                                 **builds["api"]["artifacts"][api_manifest],
                                 "unclassified_external_dependency_count": 1}}}}),
                        dict(valid, root_context_builds={**builds, "api": {**builds["api"],
                             "unresolved_effect_terminators": 0}})):
            with self.assertRaises(ValueError):
                MODULE.checked_root_context_mir(json.dumps(changed))


if __name__ == "__main__":
    unittest.main()
