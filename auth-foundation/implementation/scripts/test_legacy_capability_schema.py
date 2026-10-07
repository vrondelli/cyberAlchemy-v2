#!/usr/bin/env python3
"""Negative controls for exact historical Auth capability compatibility."""

import json
import unittest
from pathlib import Path

from legacy_capability_schema import LEGACY_RECORDS, inspect_legacy_bytes, inspect_legacy_capability


IMPLEMENTATION = Path(__file__).resolve().parents[1]
SCHEMA = IMPLEMENTATION.parents[1] / "capability/schemas/capability.schema.json"


class LegacyCapabilityCompatibility(unittest.TestCase):
    def test_only_three_pinned_records_are_structurally_compatible(self):
        for name in LEGACY_RECORDS:
            with self.subTest(name=name):
                result = inspect_legacy_capability(IMPLEMENTATION / name, SCHEMA)
                self.assertEqual(result, {
                    "legacy_structural_compatibility": True,
                    "current_schema_conformance": False,
                })

    def test_record_hashes_remain_bound_by_d65_construction(self):
        bindings = {
            "product-capability.json": "construction-binding.json",
            "command-boundary-product-capability.json": "command-boundary-construction-binding.json",
            "trusted-input-product-capability.json": "trusted-input-construction-binding.json",
        }
        for name, binding_name in bindings.items():
            with self.subTest(name=name):
                binding = json.loads((IMPLEMENTATION / binding_name).read_text())
                record = binding["predecessors"]["product_capability"]
                self.assertEqual(record["path"], f"implementation/{name}")
                self.assertEqual(record["sha256"], LEGACY_RECORDS[name][1])
        admission = json.loads((IMPLEMENTATION / "decisions/command-boundary-product-ontology-admission-001.json").read_text())
        self.assertEqual(admission["admitted_artifacts"]["product_capability"]["sha256"],
                         LEGACY_RECORDS["command-boundary-product-capability.json"][1])

    def test_changed_bytes_and_schema_fail_closed(self):
        name = "product-capability.json"
        original = (IMPLEMENTATION / name).read_bytes()
        schema = SCHEMA.read_bytes()
        self.assertFalse(inspect_legacy_bytes(name, original + b" ", schema)["legacy_structural_compatibility"])
        self.assertFalse(inspect_legacy_bytes(name, original, schema + b" ")["legacy_structural_compatibility"])
        self.assertFalse(inspect_legacy_bytes("unknown.json", original, schema)["legacy_structural_compatibility"])

    def test_role_and_extra_field_changes_cannot_become_compatible(self):
        name = "command-boundary-product-capability.json"
        original = json.loads((IMPLEMENTATION / name).read_bytes())
        schema = SCHEMA.read_bytes()
        for mutation in ("duplicate", "missing", "modern", "extra"):
            value = json.loads(json.dumps(original))
            if mutation == "duplicate":
                value["owner_routes"][3]["responsibility"] = "runtime-contract"
            elif mutation == "missing":
                value["owner_routes"].pop()
            elif mutation == "modern":
                value["owner_routes"][3]["responsibility"] = "runtime-realization"
            else:
                value["unexpected"] = True
            with self.subTest(mutation=mutation):
                self.assertFalse(inspect_legacy_bytes(name, json.dumps(value).encode(), schema)["legacy_structural_compatibility"])


if __name__ == "__main__":
    unittest.main()
