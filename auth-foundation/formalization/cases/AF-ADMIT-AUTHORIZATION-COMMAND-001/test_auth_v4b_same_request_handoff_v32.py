#!/usr/bin/env python3
"""Fast argument-join controls; V32 CLI compiles all four selected roots."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("auth-v4b-same-request-handoff-v32.py")
SPEC = importlib.util.spec_from_file_location("auth_v32_same_request", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
v32 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v32)

API = (
    "        _3 = move (_1.1: auth_foundation_authorization_state_model::InboundAuthorizationRequest);\n"
    "        _4 = auth_foundation_authorization_ready_decision::authorize as fn();\n"
    "        _2 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>"
    "(copy _8, move _3, move _4) -> [return: bb1, unwind continue];\n"
)
BRIDGE = (
    "        _4 = InboundAuthorizationRequest { request_id: move _5, "
    "authentication_evidence_ref: move _14, route_id: move _16 };\n"
    "        _26 = auth_foundation_authorization_ready_decision::authorize as fn();\n"
    "        _25 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>"
    "(copy _32, copy _4, move _26) -> [return: bb10, unwind continue];\n"
)


class SameRequestHandoffTests(unittest.TestCase):
    def test_root_argument_shapes(self) -> None:
        api = v32.root_argument_join("api", API, API, "_4")
        self.assertEqual(api["request_origin"], "captured-inbound-request")
        self.assertEqual(api["request_local"], "_3")
        bridge = v32.root_argument_join("tenant", BRIDGE, BRIDGE, "_26")
        self.assertEqual(bridge["request_origin"], "constructed-bridge-request")
        self.assertEqual(bridge["request_local"], "_4")

    def test_wrong_request_or_callback_actual_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "request local rebound"):
            v32.root_argument_join("api", API.replace("move _3, move _4)",
                                                      "move _9, move _4)"),
                                   API.replace("move _3, move _4)",
                                               "move _9, move _4)"), "_4")
        with self.assertRaisesRegex(ValueError, "call actuals changed"):
            v32.root_argument_join("tenant", BRIDGE.replace("copy _4, move _26)",
                                                         "copy _4, move _27)"),
                                   BRIDGE.replace("copy _4, move _26)",
                                                  "copy _4, move _27)"), "_26")

    def test_rebound_or_duplicate_request_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "request local rebound"):
            v32.root_argument_join("api", API + "        _3 = move _9;\n", API, "_4")
        with self.assertRaisesRegex(ValueError, "call actuals changed"):
            v32.root_argument_join("api", API + API, API + API, "_4")
        intervening = API.replace("        _4 =", "        _9 = &mut _3;\n        _4 =")
        with self.assertRaisesRegex(ValueError, "changed before handoff"):
            v32.root_argument_join("api", intervening, intervening, "_4")

    def test_incomplete_bridge_construction_fails(self) -> None:
        changed = BRIDGE.replace("route_id: move _16", "other: move _16")
        with self.assertRaisesRegex(ValueError, "constructed inbound request source changed"):
            v32.root_argument_join("tenant", changed, changed, "_26")


if __name__ == "__main__":
    unittest.main()
