#!/usr/bin/env python3
"""Actual-read negative controls for the v3 Auth technical evidence verifier."""

from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v3.py")
SPEC = importlib.util.spec_from_file_location("current_auth_evidence_v3", SCRIPT)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class PreimageControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads((module.PREIMAGES / "manifest.json").read_bytes())
        cls.archived = module.PREIMAGES / cls.manifest["entries"][0]["archived_relative_path"]

    def test_baseline_reads_actual_archive_and_git(self) -> None:
        self.assertEqual(len(module.archive_preimages()), 9)

    def test_deleted_archive_rejected(self) -> None:
        original = Path.is_file

        def missing(path: Path) -> bool:
            return False if path == self.archived else original(path)

        with patch.object(Path, "is_file", missing), self.assertRaisesRegex(ValueError, "missing or symlinked"):
            module.archive_preimages()

    def test_mutated_archive_bytes_rejected(self) -> None:
        original = Path.read_bytes

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value + b" " if path == self.archived else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "preimage missing or modified"):
            module.archive_preimages()

    def test_archive_file_substitution_rejected(self) -> None:
        original = Path.read_bytes
        replacement = self.manifest["entries"][1]["archived_relative_path"]

        def substituted(path: Path) -> bytes:
            return original(module.PREIMAGES / replacement) if path == self.archived else original(path)

        with patch.object(Path, "read_bytes", substituted), self.assertRaisesRegex(ValueError, "preimage missing or modified"):
            module.archive_preimages()

    def test_v2_binding_substitution_rejected_independently_of_manifest(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "current-evidence-successor-v2/binding.json"

        def substituted(path: Path) -> bytes:
            value = original(path)
            return value + b"\n" if path == target else value

        with patch.object(Path, "read_bytes", substituted), self.assertRaisesRegex(ValueError, "v2 binding substituted"):
            module.archive_preimages()

    def test_claim_forgery_rejected(self) -> None:
        baseline = {"runtime_guarantees_observed": False}
        with self.assertRaises(ValueError):
            module.verify({"runtime_guarantees_observed": True}, baseline)


class SelectedSourceControls(unittest.TestCase):
    def test_owner_scope_is_pinned_and_current_in_both_d65_links(self) -> None:
        crates, _ = module.cargo_graph()
        sources = module.source_inventory(crates)
        self.assertIn(module.OWNER_SCOPE_PATH, sources)
        lineage = module.owner_scope_lineage()
        self.assertEqual(lineage["sha256"], sources[module.OWNER_SCOPE_PATH])
        self.assertEqual(lineage["status"], "current")

    def test_owner_scope_mutation_rejected_without_reissuing_d65_links(self) -> None:
        original = Path.read_bytes
        target = module.AUTH / module.OWNER_SCOPE_PATH

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value + b"\nchanged owner endpoint scope\n" if path == target else value

        with patch.object(Path, "read_bytes", mutated):
            with self.assertRaisesRegex(ValueError, "authorization service owner-scope lineage changed"):
                module.owner_scope_lineage()

    def test_d65_owner_scope_stage_substitution_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "d65-chain.json"

        def mutated(path: Path) -> bytes:
            value = original(path)
            if path == target:
                chain = json.loads(value)
                row = next(row for row in chain["stages"] if row["stage"] == "owner_downstream_endpoint_scope")
                row["sha256"] = "0" * 64
                return json.dumps(chain).encode()
            return value

        with patch.object(Path, "read_bytes", mutated):
            with self.assertRaisesRegex(ValueError, "D65 owner-scope lineage changed"):
                module.owner_scope_lineage()

    def test_stale_v4b_predecessor_is_pinned_but_not_currently_executed(self) -> None:
        crates, _ = module.cargo_graph()
        original_inventory = module.source_inventory(crates)
        self.assertEqual(module.v4b_predecessor()["status"], "stale-predecessor")
        self.assertFalse(module.v4b_predecessor()["executed_as_current_verifier"])
        original_read = Path.read_bytes
        target = module.AUTH / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-call-certificate.mjs"

        def substituted(path: Path) -> bytes:
            value = original_read(path)
            return value + b"\n// substituted verifier\n" if path == target else value

        with patch.object(Path, "read_bytes", substituted):
            self.assertNotEqual(module.source_inventory(crates), original_inventory)

    def test_selected_closure_and_edge_baseline(self) -> None:
        crates, edges = module.cargo_graph()
        self.assertEqual(len(crates), 10)
        self.assertEqual(set(edges), set(crates))
        self.assertIn("authorization-ready-authority", crates)
        self.assertIn("authorization-ready-decision", crates)
        self.assertNotIn("runtime-adapter", crates)
        self.assertNotIn("trusted-boundary-v2", crates)
        self.assertNotIn("trusted-input-provider", crates)
        self.assertNotIn("trusted-boundary", crates)
        self.assertNotIn("sqlite-provider", crates)
        api_crates = module.public_api_closure()
        self.assertEqual(len(api_crates), 11)
        self.assertNotIn("trusted-boundary", api_crates)
        self.assertNotIn("sqlite-provider", api_crates)

    def test_selected_bridges_are_pinned_and_replayed_separately(self) -> None:
        crates, _ = module.cargo_graph()
        sources = module.source_inventory(crates)
        for name in ("tenant-bridge", "authentication-prototype/bridge", "authentication-https/bridge"):
            for leaf in ("Cargo.toml", "Cargo.lock", "src/main.rs"):
                self.assertIn(f"implementation/{name}/{leaf}", sources)
        self.assertIn("implementation/scripts/validate-bridge-decision-isolation.py", sources)
        self.assertIn("implementation/scripts/test-bridge-decision-isolation.py", sources)
        report = module.bridge_decision_isolation()
        self.assertEqual(report["status"], "pass")
        self.assertFalse(report["legacy_decision_crates_reachable"])

    def test_bridge_verifier_failure_rejected(self) -> None:
        with patch.object(module, "run", return_value=json.dumps({
            "status": "pass", "runtime_guarantees_observed": False,
            "bridges": [{"bridge": "tenant-bridge", "legacy_decision_crates_reachable": True}],
        })), self.assertRaisesRegex(ValueError, "selected bridge decision isolation changed"):
            module.bridge_decision_isolation()

    def test_bridge_source_digest_substitution_rejected(self) -> None:
        rows = [{"bridge": name, "source_sha256": "0" * 64,
                 "legacy_decision_crates_reachable": False} for name in (
                     "tenant-bridge", "authentication-prototype/bridge", "authentication-https/bridge")]
        with patch.object(module, "run", return_value=json.dumps({
            "status": "pass", "runtime_guarantees_observed": False, "bridges": rows,
        })), self.assertRaisesRegex(ValueError, "selected bridge source digest changed"):
            module.bridge_decision_isolation()

    def test_unexpected_local_edge_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-service/Cargo.toml"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(
                b"rusqlite = { version",
                b'auth-foundation-trusted-input-provider = { path = "../trusted-input-provider" }\nrusqlite = { version',
            ) if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "direct local Cargo edges differ"):
            module.cargo_graph()

    def test_inactive_optional_local_edge_cannot_escape_inventory(self) -> None:
        original_read = Path.read_bytes
        original_run = module.run
        manifest = module.IMPL / "authorization-service/Cargo.toml"

        def amended_read(path: Path) -> bytes:
            value = original_read(path)
            if path == manifest:
                return value.replace(
                    b"rusqlite = { version",
                    b'auth-foundation-trusted-input-provider = { path = "../trusted-input-provider", optional = true }\nrusqlite = { version',
                )
            return value

        def amended_run(command: list[str], cwd: Path, *, timeout: int = 240) -> str:
            value = original_run(command, cwd, timeout=timeout)
            if "metadata" not in command:
                return value
            metadata = json.loads(value)
            service = next(package for package in metadata["packages"]
                           if package["name"] == "auth-foundation-authorization-service")
            service["dependencies"].append({
                "name": "auth-foundation-trusted-input-provider", "rename": None,
                "path": str(module.IMPL / "trusted-input-provider"),
            })
            return json.dumps(metadata)

        with patch.object(Path, "read_bytes", amended_read), patch.object(module, "run", amended_run):
            with self.assertRaisesRegex(ValueError, "uninventoried declared local Cargo target"):
                module.cargo_graph()

    def test_selected_decision_call_redirection_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-service/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"authorize_ready_decision(ready)", b"authorize_legacy(ready)") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "selected service READY continuation changed"):
            module.source_path_checks()

    def test_release_only_admission_bypass_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-service/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"authorize_ready_decision(ready)",
                                 b"if cfg!(debug_assertions) { authorize_ready_decision(ready)") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "configuration-dependent path"):
            module.source_path_checks()

    def test_ready_gate_bypass_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-ready-authority/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"gate::admit_authorization_command(&context)",
                                 b"gate::bypass_authorization_command(&context)") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "READY authority gate/continuation changed"):
            module.source_path_checks()

    def test_ready_decision_kernel_redirection_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-ready-decision/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"kernel::authorize(&context)", b"kernel::authorize_bypass(&context)") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "READY decision bridge changed"):
            module.source_path_checks()

    def test_public_api_engine_substitution_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-api/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"SqliteAuthService::open_with_epoch_allocator(",
                                 b"InjectedAuthService::open_with_epoch_allocator(") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "public API production engine construction changed"):
            module.source_path_checks()

    def test_public_api_worker_bypass_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-api/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"engine.authorize(request)", b"engine.authorize_without_gate(request)") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "public API worker delegation changed"):
            module.source_path_checks()

    def test_service_epoch_bypass_rejected(self) -> None:
        original = Path.read_bytes
        target = module.IMPL / "authorization-service/src/lib.rs"

        def mutated(path: Path) -> bytes:
            value = original(path)
            return value.replace(b"authorize_in_epoch(&epoch, request)",
                                 b"authorize_without_epoch(&epoch, request)") if path == target else value

        with patch.object(Path, "read_bytes", mutated), self.assertRaisesRegex(ValueError, "selected service epoch delegation changed"):
            module.source_path_checks()

    def test_duplicate_inventory_name_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "duplicate"):
            module.inventory("same: test\nsame: test\n")


if __name__ == "__main__":
    unittest.main()
