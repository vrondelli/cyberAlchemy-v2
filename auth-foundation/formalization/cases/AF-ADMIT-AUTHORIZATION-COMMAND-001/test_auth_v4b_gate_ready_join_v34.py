#!/usr/bin/env python3
"""Fast join controls; V34 CLI performs the four selected-root builds."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("auth-v4b-gate-ready-join-v34.py")
SPEC = importlib.util.spec_from_file_location("auth_v34_gate_ready_join", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
v34 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v34)

SOURCE = {"authority": v34.v30.AUTHORITY_SHA, "gate": v34.v30.GATE_SHA}
MODEL = {"source_model_gate_deny_unreachable": True,
         "authority_source_sha256": v34.v30.AUTHORITY_SHA,
         "gate_source_sha256": v34.v30.GATE_SHA}
HANDOFF = {
    "root_id": "api", "cross_body_execution_proven": False,
    "normal_mir_argument_join": [
        {"edge": "root-to-admission", "callee_request_parameter": "_2"},
        {"edge": "admission-to-authority", "request_actual": "_42 <- &_2",
         "authority_formals": ["_2", "_3", "_4", "_5"]},
        {"edge": "authority-to-ready-decision", "callback_parameter": "_5"},
    ],
    "selected_mir_sha256": {name: "compiled-identity" for name in
                            ("root", "admission", "authority", "decision")},
}


class GateReadyJoinTests(unittest.TestCase):
    def test_exact_join(self) -> None:
        result = v34.join("api", HANDOFF, MODEL, SOURCE, SOURCE)
        self.assertTrue(result["source_model_gate_context_uses_authority_request"])
        self.assertTrue(result["normal_mir_root_request_joins_authority_formal"])
        self.assertFalse(result["cross_crate_execution_proven"])

    def test_source_drift_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "source changed"):
            v34.join("api", HANDOFF, MODEL, SOURCE,
                     {**SOURCE, "authority": "changed"})

    def test_handoff_position_drift_fails(self) -> None:
        changed = {**HANDOFF, "normal_mir_argument_join": [
            HANDOFF["normal_mir_argument_join"][0],
            {**HANDOFF["normal_mir_argument_join"][1],
             "request_actual": "_42 <- &_99"},
            HANDOFF["normal_mir_argument_join"][2],
        ]}
        with self.assertRaisesRegex(ValueError, "join positions changed"):
            v34.join("api", changed, MODEL, SOURCE, SOURCE)


if __name__ == "__main__":
    unittest.main()
