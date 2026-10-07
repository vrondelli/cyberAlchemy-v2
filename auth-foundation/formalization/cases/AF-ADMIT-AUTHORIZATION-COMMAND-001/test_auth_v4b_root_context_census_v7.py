#!/usr/bin/env python3
"""Fail-closed artifact-identity controls for root-context MIR capture."""

from __future__ import annotations

import copy
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("auth-v4b-root-context-census-v7.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_root_context_census_v7", SCRIPT)
assert SPEC and SPEC.loader
census = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(census)


class RootContextCensusV7(unittest.TestCase):
    @staticmethod
    def policy_graph() -> tuple[dict, dict]:
        root = census.v6.ROOT_MANIFESTS["api"]
        middle = "authorization-admission-service/Cargo.toml"
        ready = census.v6.ALLOWED_CALLER
        policy = census.v6.POLICY_MANIFEST
        manifests = (root, middle, ready, policy)
        identity = {manifest: f"local:{manifest}" for manifest in manifests}

        def edge(manifest: str, kind=None, name="dependency") -> dict:
            return {"name": name, "pkg": identity[manifest],
                    "dep_kinds": [{"kind": kind, "target": None}]}

        dependencies = {
            root: [edge(middle), edge(ready)],
            middle: [edge(ready)],
            ready: [edge(policy, name="auth-kernel")],
            policy: [],
        }
        metadata = {
            "packages": [{"id": identity[manifest],
                          "manifest_path": str(census.IMPL / manifest)}
                         for manifest in manifests],
            "resolve": {"root": identity[root],
                        "nodes": [{"id": identity[manifest],
                                   "deps": dependencies[manifest]}
                                  for manifest in manifests]},
        }
        expected = {manifest: {"package_id": identity[manifest]}
                    for manifest in manifests}
        return metadata, expected

    def test_only_ready_decision_has_direct_normal_generated_policy_capability(self) -> None:
        metadata, expected = self.policy_graph()
        result = census.policy_direct_dependency_boundary("api", metadata, expected)
        self.assertEqual(result["generated_policy_direct_normal_predecessor"],
                         census.v6.ALLOWED_CALLER)
        self.assertEqual(result["normal_local_manifest_count"], 4)

        ready = expected[census.v6.ALLOWED_CALLER]["package_id"]
        policy = expected[census.v6.POLICY_MANIFEST]["package_id"]
        root = metadata["resolve"]["root"]
        middle = expected["authorization-admission-service/Cargo.toml"]["package_id"]
        nodes = {row["id"]: row for row in metadata["resolve"]["nodes"]}
        normal = {"kind": None, "target": None}
        for source in (root, middle):
            changed = copy.deepcopy(metadata)
            changed_nodes = {row["id"]: row for row in changed["resolve"]["nodes"]}
            changed_nodes[source]["deps"].append(
                {"name": "renamed-policy", "pkg": policy,
                 "dep_kinds": [normal]})
            with self.subTest(source=source), self.assertRaisesRegex(
                    ValueError, "escaped READY decision"):
                census.policy_direct_dependency_boundary("api", changed, expected)

        renamed = copy.deepcopy(metadata)
        next(row for row in renamed["resolve"]["nodes"] if row["id"] == ready)[
            "deps"][0]["name"] = "renamed-auth-kernel"
        census.policy_direct_dependency_boundary("api", renamed, expected)

        dev_only = copy.deepcopy(metadata)
        next(row for row in dev_only["resolve"]["nodes"] if row["id"] == root)[
            "deps"].append({"name": "test-policy", "pkg": policy,
                            "dep_kinds": [{"kind": "dev", "target": None}]})
        census.policy_direct_dependency_boundary("api", dev_only, expected)
        self.assertEqual(nodes[ready]["deps"][0]["pkg"], policy)

    def test_policy_dependency_graph_fails_on_missing_or_ambiguous_edges(self) -> None:
        metadata, expected = self.policy_graph()
        ready = expected[census.v6.ALLOWED_CALLER]["package_id"]
        policy = expected[census.v6.POLICY_MANIFEST]["package_id"]

        removed = copy.deepcopy(metadata)
        next(row for row in removed["resolve"]["nodes"] if row["id"] == ready)[
            "deps"][0]["dep_kinds"][0]["kind"] = "dev"
        with self.assertRaisesRegex(ValueError, "normal local Cargo closure drift"):
            census.policy_direct_dependency_boundary("api", removed, expected)

        substituted = copy.deepcopy(removed)
        substituted["resolve"]["nodes"][0]["deps"].append(
            {"name": "replacement-policy", "pkg": policy,
             "dep_kinds": [{"kind": None, "target": None}]})
        with self.assertRaisesRegex(ValueError, "escaped READY decision"):
            census.policy_direct_dependency_boundary("api", substituted, expected)

        missing = copy.deepcopy(metadata)
        next(row for row in missing["resolve"]["nodes"] if row["id"] == ready)[
            "deps"][0]["pkg"] = "missing-package-id"
        with self.assertRaisesRegex(ValueError, "package ID missing"):
            census.policy_direct_dependency_boundary("api", missing, expected)

        duplicated = copy.deepcopy(metadata)
        duplicated["resolve"]["nodes"].append(copy.deepcopy(duplicated["resolve"]["nodes"][-1]))
        with self.assertRaisesRegex(ValueError, "identity ambiguous"):
            census.policy_direct_dependency_boundary("api", duplicated, expected)

        closure_drift = copy.deepcopy(metadata)
        extra = "authorization-extra/Cargo.toml"
        closure_drift["packages"].append(
            {"id": "extra-local", "manifest_path": str(census.IMPL / extra)})
        closure_drift["resolve"]["nodes"].append({"id": "extra-local", "deps": []})
        closure_drift["resolve"]["nodes"][0]["deps"].append(
            {"name": "extra", "pkg": "extra-local",
             "dep_kinds": [{"kind": None, "target": None}]})
        with self.assertRaisesRegex(ValueError, "normal local Cargo closure drift"):
            census.policy_direct_dependency_boundary("api", closure_drift, expected)

        duplicate_manifest = copy.deepcopy(metadata)
        duplicate_manifest["packages"].append(
            {"id": "second-policy-id",
             "manifest_path": str(census.IMPL / census.v6.POLICY_MANIFEST)})
        duplicate_manifest["resolve"]["nodes"].append(
            {"id": "second-policy-id", "deps": []})
        duplicate_manifest["resolve"]["nodes"][0]["deps"].append(
            {"name": "second-policy", "pkg": "second-policy-id",
             "dep_kinds": [{"kind": None, "target": None}]})
        with self.assertRaisesRegex(ValueError, "duplicate local manifest package ID"):
            census.policy_direct_dependency_boundary("api", duplicate_manifest, expected)

        external = copy.deepcopy(metadata)
        external["packages"].append({"id": "external", "manifest_path": "/external/Cargo.toml"})
        external["resolve"]["nodes"].append(
            {"id": "external", "deps": [{"name": "auth-policy", "pkg": policy,
                                        "dep_kinds": [{"kind": None, "target": None}]}]})
        external["resolve"]["nodes"][0]["deps"].append(
            {"name": "external", "pkg": "external",
             "dep_kinds": [{"kind": None, "target": None}]})
        with self.assertRaisesRegex(ValueError, "escaped READY decision"):
            census.policy_direct_dependency_boundary("api", external, expected)

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="auth-v7-artifact-test-")
        self.addCleanup(self.temporary.cleanup)
        self.target_dir = Path(self.temporary.name)
        self.manifest = "authorization-ready-decision/Cargo.toml"
        self.source = census.IMPL / "authorization-ready-decision/src/lib.rs"
        self.expected = {self.manifest: {"package_id": "local-package-id",
                                         "target_name": "auth_foundation_authorization_ready_decision",
                                         "target_kind": ["lib"],
                                         "target_source": str(self.source),
                                         "features": [],
                                         "crate": "auth_foundation_authorization_ready_decision",
                                         "kind": "lib"}}
        deps = self.target_dir / "debug/deps"
        deps.mkdir(parents=True)
        stem = "auth_foundation_authorization_ready_decision-1234"
        (deps / f"{stem}.mir").write_text("fn authorize() {}\n")
        self.dep_path = deps / f"{stem}.d"
        self.dep_path.write_text(f"{self.dep_path}: {self.source}\n")
        self.row = {"reason": "compiler-artifact", "package_id": "local-package-id",
                    "manifest_path": str(census.IMPL / self.manifest),
                    "target": {"name": "auth_foundation_authorization_ready_decision",
                               "kind": ["lib"], "src_path": str(self.source)},
                    "features": [], "filenames": [str(deps / f"lib{stem}.rlib")]}

    def test_exact_local_artifact_binds_mir(self) -> None:
        mirrored, identities = census.bind_artifacts([self.row], self.expected, self.target_dir)
        self.assertEqual(set(mirrored), {self.manifest})
        self.assertEqual(identities[self.manifest]["features"], [])
        self.assertEqual(len(identities[self.manifest]["mir_sha256"]), 64)
        self.assertEqual(identities[self.manifest]["rust_source_count"], 1)
        self.assertEqual(identities[self.manifest]["unclassified_external_dependency_count"], 0)

    def test_unhashed_root_library_maps_to_one_hashed_mir(self) -> None:
        root = {**self.row, "filenames": [str(self.target_dir / "debug/libauth_foundation_authorization_ready_decision.rlib")]}
        mirrored, _ = census.bind_artifacts([root], self.expected, self.target_dir)
        self.assertEqual(set(mirrored), {self.manifest})
        (self.target_dir / "debug/deps/auth_foundation_authorization_ready_decision-5678.mir").write_text("fn other() {}\n")
        with self.assertRaisesRegex(ValueError, "root-library MIR ambiguous"):
            census.bind_artifacts([root], self.expected, self.target_dir)

    def test_missing_duplicate_and_wrong_feature_artifacts_fail(self) -> None:
        for rows in ([], [self.row, self.row],
                     [{**self.row, "features": ["root-only"]}],
                     [{**self.row, "package_id": "wrong"}],
                     [{**self.row, "target": {**self.row["target"], "src_path": "/wrong.rs"}}]):
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                census.bind_artifacts(rows, self.expected, self.target_dir)

    def test_missing_mir_and_unexpected_local_manifest_fail(self) -> None:
        (self.target_dir / "debug/deps/auth_foundation_authorization_ready_decision-1234.mir").unlink()
        with self.assertRaisesRegex(ValueError, "Cargo MIR missing"):
            census.bind_artifacts([self.row], self.expected, self.target_dir)
        changed = {**self.row, "manifest_path": str(census.IMPL / "authorization-api/Cargo.toml")}
        with self.assertRaisesRegex(ValueError, "unexpected local build artifact"):
            census.bind_artifacts([changed], self.expected, self.target_dir)

    def test_compiler_dep_info_rejects_cross_package_rust_source(self) -> None:
        outside = census.IMPL / "sqlite-provider/src/lib.rs"
        self.dep_path.write_text(f"{self.dep_path}: {self.source} {outside}\n")
        with self.assertRaisesRegex(ValueError, "unclassified cross-package compiler dependency"):
            census.bind_artifacts([self.row], self.expected, self.target_dir)
        self.dep_path.write_text(f"{self.dep_path}: {self.source} "
                                 f"{census.IMPL / 'sqlite-provider/src/hidden.inc'}\n")
        with self.assertRaisesRegex(ValueError, "unclassified cross-package compiler dependency"):
            census.bind_artifacts([self.row], self.expected, self.target_dir)
        self.dep_path.write_text(f"{self.dep_path}: {self.source} "
                                 f"{census.IMPL / 'authorization-schema/migrations/0001_auth_state.sql'}\n")
        _, identities = census.bind_artifacts([self.row], self.expected, self.target_dir)
        self.assertEqual(identities[self.manifest]["data_dependency_count"], 1)

    def test_root_relative_compiler_dep_info_uses_package_root(self) -> None:
        self.dep_path.write_text(f"{self.dep_path}: src/lib.rs\n")
        _, identities = census.bind_artifacts([self.row], self.expected, self.target_dir)
        self.assertEqual(identities[self.manifest]["rust_source_count"], 1)

    def test_approved_data_snapshot_binds_bytes_and_rejects_symlinks(self) -> None:
        data = self.target_dir / "approved.sql"
        data.write_bytes(b"SELECT 1;\n")
        with patch.object(census, "IMPL", self.target_dir), patch.object(
                census, "ALLOWED_EXTERNAL_DATA", {data}):
            first = census.external_data_snapshot()
            data.write_bytes(b"SELECT 2;\n")
            self.assertNotEqual(census.external_data_snapshot(), first)
            data.unlink()
            data.symlink_to(self.source)
            with self.assertRaisesRegex(ValueError, "missing or symlinked"):
                census.external_data_snapshot()

    def test_missing_or_malformed_compiler_dep_info_fails(self) -> None:
        self.dep_path.unlink()
        with self.assertRaisesRegex(ValueError, "compiler dep-info missing"):
            census.bind_artifacts([self.row], self.expected, self.target_dir)
        self.dep_path.write_text(f"{self.dep_path}: /wrong/source.rs\n")
        with self.assertRaisesRegex(ValueError, "missing or duplicated target source"):
            census.bind_artifacts([self.row], self.expected, self.target_dir)

    def test_generated_policy_extra_ingress_is_rejected_per_root(self) -> None:
        names = ("allow_iff", "authorization_admissible", "authorize",
                 "complete_active_roles", "default_deny", "exact_active_role_grant",
                 "session_current", "trusted_scope", "unique_resolved_session")
        mir = {census.v6.ALLOWED_CALLER:
               f"_1 = {census.v6.POLICY}(copy _2) -> [return: bb1, unwind continue];",
               "authorization-state-reader/Cargo.toml":
               f"fn hidden() {{ _3 = {census.v6.POLICY}(copy _4) -> [return: bb1]; }}",
               census.v6.POLICY_MANIFEST: "fn internal() {}"}
        with self.assertRaisesRegex(ValueError, "outside sole READY decision"):
            census.v6.compiled_policy_ingress(mir, names)
        mir["authorization-state-reader/Cargo.toml"] = (
            f"_3 = {census.v6.POLICY_CRATE}::allow_iff(copy _4) -> [return: bb1];"
        )
        with self.assertRaisesRegex(ValueError, "helper ingress outside sole READY decision"):
            census.v6.compiled_policy_ingress(mir, names)
        mir["authorization-state-reader/Cargo.toml"] = (
            f"_3 = {census.v6.POLICY_CRATE}::default_deny as fn(&EvaluationContext) -> bool;"
        )
        with self.assertRaisesRegex(ValueError, "function-pointer ingress"):
            census.v6.compiled_policy_ingress(mir, names)

    def test_native_decision_capability_partition_rejects_raw_dependency(self) -> None:
        ids = census.DOWNSTREAM_SELECTED | census.DOWNSTREAM_EXCLUDED | census.NOT_DOWNSTREAM
        rows = []
        expected = {}
        for endpoint_id in sorted(ids):
            manifest = ("raw/Cargo.toml" if endpoint_id in census.DOWNSTREAM_EXCLUDED else
                        f"{endpoint_id}/Cargo.toml")
            membership = [] if endpoint_id in census.DOWNSTREAM_EXCLUDED else ["api"]
            rows.append({"id": endpoint_id, "package_manifest": manifest,
                         "selected_root_cargo_membership": membership})
            if membership:
                expected[manifest] = {}
        inventory = {"known_entrypoints": rows}
        result = census.decision_capability_boundary("api", inventory, expected)
        self.assertEqual(result["selected_downstream_entrypoint_ids"],
                         sorted(census.DOWNSTREAM_SELECTED))
        self.assertEqual(result["excluded_raw_decision_manifests"], ["raw/Cargo.toml"])

        # A previously absent raw decision package is now a selected Cargo
        # dependency, even if the stale syntax inventory still says otherwise.
        with self.assertRaisesRegex(ValueError, "membership disagrees"):
            census.decision_capability_boundary("api", inventory,
                                                {**expected, "raw/Cargo.toml": {}})
        updated_rows = [{**row, "selected_root_cargo_membership": ["api"]}
                        if row["id"] in census.DOWNSTREAM_EXCLUDED else row for row in rows]
        with self.assertRaisesRegex(ValueError, "raw native decision capability"):
            census.decision_capability_boundary("api", {"known_entrypoints": updated_rows},
                                                {**expected, "raw/Cargo.toml": {}})
        injected = {"known_entrypoints": [*rows, {"id": "new-native-decision",
            "package_manifest": "new/Cargo.toml", "selected_root_cargo_membership": ["api"]}]}
        with self.assertRaisesRegex(ValueError, "classification changed"):
            census.decision_capability_boundary("api", injected, expected)
        for bad_membership in (["api", "api"], ["api", "invented"]):
            mutated = {"known_entrypoints": [
                {**row, "selected_root_cargo_membership": bad_membership}
                if row["id"] == "ready-decision" else row for row in rows]}
            with self.subTest(membership=bad_membership), self.assertRaisesRegex(
                    ValueError, "membership disagrees"):
                census.decision_capability_boundary("api", mutated, expected)


if __name__ == "__main__":
    unittest.main()
