from __future__ import annotations

import copy
import json
import unittest

from auth_tier_bridge.bridge import BRIDGE_ROOT, CONTROL_MAP, KERNEL, UMBRELLA_ROOT, _controls, _exact_ref, _validate_profile_subject_binding


class BridgeTests(unittest.TestCase):
    def test_control_mapping_closes_every_v2_class(self) -> None:
        epoch = BRIDGE_ROOT.parent / "repair-assurance-transfer-epoch-001"
        controls, _ = _controls(json.loads((epoch / "HOSTILE-CONTROLS.json").read_text()), json.loads((epoch / "MUTATION-RESULT.json").read_text()))
        self.assertEqual({"subject", "oracle", "denominator", "evidence", "execution"}, {item["class"] for item in controls})
        self.assertTrue(all(item["detected"] for item in controls))

    def test_declared_hostile_observations_exist(self) -> None:
        epoch = BRIDGE_ROOT.parent / "repair-assurance-transfer-epoch-001"
        ids = {item["id"] for item in json.loads((epoch / "HOSTILE-CONTROLS.json").read_text())["observations"]}
        self.assertTrue(set(CONTROL_MAP.values()) <= ids)

    def test_kernel_rejects_missing_v2_control_without_downgrade(self) -> None:
        evidence = BRIDGE_ROOT / "evidence/author-attempt-002/V2-INVOCATION.json"
        if not evidence.exists():
            self.skipTest("author evidence has not been generated")
        invocation = json.loads(evidence.read_text())
        invocation["controls"] = invocation["controls"][:-1]
        result = KERNEL.evaluate(UMBRELLA_ROOT, KERNEL.CANONICAL_ROOT, invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertEqual("V1", result["available_lower_tier"])
        self.assertIsNone(result["verified_tier"])

    def test_kernel_rejects_provider_disagreement(self) -> None:
        evidence = BRIDGE_ROOT / "evidence/author-attempt-002/V1-INVOCATION.json"
        if not evidence.exists():
            self.skipTest("author evidence has not been generated")
        invocation = json.loads(evidence.read_text())
        invocation["providers"][1]["normalized_outcome"] = "counterexample"
        invocation["providers"][1]["payload_digest"] = KERNEL.digest_value({k: v for k, v in invocation["providers"][1].items() if k != "payload_digest"})
        result = KERNEL.evaluate(UMBRELLA_ROOT, KERNEL.CANONICAL_ROOT, invocation)
        self.assertEqual("conflicting_evidence", result["contract_state"])
        self.assertIsNone(result["verified_tier"])

    def test_property_definition_is_exact_current(self) -> None:
        relative = str((BRIDGE_ROOT / "property.json").relative_to(UMBRELLA_ROOT))
        ref = _exact_ref(BRIDGE_ROOT / "property.json", relative)
        self.assertEqual(64, len(ref["sha256"]))

    def test_both_evf_profiles_bind_the_exact_tier_subject(self) -> None:
        bindings = json.loads((BRIDGE_ROOT / "source-bindings.json").read_text())
        for name in ("executable_evidence", "theorem_evidence"):
            evidence = json.loads((UMBRELLA_ROOT / bindings["refs"][name]["path"]).read_text())
            _validate_profile_subject_binding(evidence, bindings["refs"]["subject"])


if __name__ == "__main__":
    unittest.main()
