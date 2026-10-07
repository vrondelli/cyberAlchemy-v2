#!/usr/bin/env python3
"""Controls for the read-only Auth evidence freshness inspection."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("inspect-evidence-freshness.py")
SPEC = importlib.util.spec_from_file_location("inspect_evidence_freshness", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class EvidenceFreshnessTests(unittest.TestCase):
    def test_exact_bytes_are_current_and_mutation_is_stale(self) -> None:
        with tempfile.TemporaryDirectory(dir=MODULE.ROOT) as directory:
            path = Path(directory) / "record.json"
            path.write_text("one", encoding="utf-8")
            record = {"sha256": MODULE.sha256(path)}
            self.assertEqual(MODULE.check_reference(record, path)["status"], "current")
            path.write_text("two", encoding="utf-8")
            self.assertEqual(MODULE.check_reference(record, path)["status"], "stale")

    def test_missing_target_is_stale(self) -> None:
        with tempfile.TemporaryDirectory(dir=MODULE.ROOT) as directory:
            path = Path(directory) / "absent.json"
            self.assertEqual(MODULE.check_reference({"sha256": "0" * 64}, path)["status"], "stale")

    def test_escaping_target_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.check_reference({"sha256": "0" * 64}, MODULE.ROOT.parent / "outside.json")

    def test_current_selected_links_and_exact_stale_inputs(self) -> None:
        result = MODULE.inspect()
        self.assertEqual(result["status"], "stale")
        self.assertEqual(result["authority_effect"], "none")
        self.assertEqual(
            {name for name, row in result["sources"].items() if row["status"] != "current"},
            {"runtime_evidence.adapter_source"},
        )
        self.assertEqual(
            {name for name, row in result["references"].items() if row["status"] != "current"},
            {"service_binding.selected_admission_service"},
        )
        admission = result["references"]["service_binding.selected_admission_service"]
        self.assertNotEqual(admission["expected_sha256"], admission["actual_sha256"])
        for name in (
            "provider_binding.generated_query",
            "provider_binding.generated_integration",
            "provider_binding.source",
            "service_binding.source",
            "service_binding.tests",
            "service_binding.selected_admission_service.tests",
            "service_binding.selected_ready_authority.tests",
            "service_binding.selected_ready_decision.tests",
        ):
            self.assertEqual(result["sources"][name]["status"], "current")
        for name in (
            "service_binding.legacy_trusted_input_provider_predecessor",
            "service_binding.legacy_trusted_boundary_predecessor",
            "service_binding.selected_transaction_reader",
            "service_binding.selected_public_api",
            "service_binding.selected_public_api.manifest",
            "service_binding.selected_admission_service.manifest",
            "service_binding.selected_ready_authority",
            "service_binding.selected_ready_authority.manifest",
            "service_binding.selected_admission_kernel",
            "service_binding.selected_admission_kernel.manifest",
            "service_binding.selected_ready_decision",
            "service_binding.selected_ready_decision.manifest",
            "service_binding.selected_generated_policy",
            "service_binding.selected_generated_policy.manifest",
            "service_binding.selected_authorization_state_reader",
            "service_binding.selected_authorization_metadata_reader",
            "service_binding.accepted_command_boundary_meaning",
            "service_binding.accepted_meaning_owner_decision",
            "service_binding.owner_downstream_endpoint_scope",
            "service_binding.historical_sfol_claim",
            "service_binding.historical_sfol_admission",
            "d65_chain.accepted_command_boundary_meaning",
            "d65_chain.accepted_meaning_owner_decision",
            "d65_chain.owner_downstream_endpoint_scope",
            "d65_chain.historical_sfol_claim",
            "d65_chain.historical_sfol_admission",
        ):
            self.assertEqual(result["references"][name]["status"], "current")


if __name__ == "__main__":
    unittest.main()
