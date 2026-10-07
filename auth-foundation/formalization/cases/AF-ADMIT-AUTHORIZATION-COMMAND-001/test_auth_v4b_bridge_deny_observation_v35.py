#!/usr/bin/env python3
"""Fast V35 parser and mutation controls; V35 CLI compiles the mirrors."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("auth-v4b-bridge-deny-observation-v35.py")
SPEC = importlib.util.spec_from_file_location("auth_v35_bridge_deny", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
v35 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v35)


def trace(kinds: tuple[str, ...], *, request: str = "verified-request",
          epoch: int = 1) -> str:
    body = ", ".join(
        f'Event {{ root: PrototypeBridge, invocation_id: 7, request_id: "{request}", '
        f'epoch_id: Some({epoch}), kind: {kind} }}' for kind in kinds
    )
    return (f'AUTH_AUTHORIZATION_TRACE Trace {{ root: PrototypeBridge, '
            f'invocation_id: 7, request_id: "verified-request", events: [{body}] }}')


class BridgeDenyObservationTests(unittest.TestCase):
    def test_trace_is_complete_and_correlated(self) -> None:
        result = v35.parse_trace(trace(("EpochOpened", "GateDenied")), "prototype")
        self.assertEqual(result["event_kinds"], ("EpochOpened", "GateDenied"))
        for stderr in (
            trace(("EpochOpened",), request="other"),
            trace(("EpochOpened",), epoch=2),
            trace(("EpochOpened",)) + "\n" + trace(("GateDenied",)),
            trace(("EpochOpened",)).replace("kind: EpochOpened", "kind: Broken, extra: 1"),
            trace(("EpochOpened",)).replace("events: [", "events: [junk, "),
            trace(("EpochOpened",)).replace("kind: EpochOpened }]", "kind: EpochOpened }, junk]"),
        ):
            with self.subTest(stderr=stderr[:85]):
                with self.assertRaises(ValueError):
                    v35.parse_trace(stderr, "prototype")

    def test_mutation_anchor_must_be_unique(self) -> None:
        self.assertEqual(v35.mutate_once("a MARK z", "MARK", "NEW"), "a NEW z")
        for source in ("a", "MARK MARK"):
            with self.assertRaisesRegex(ValueError, "anchor changed"):
                v35.mutate_once(source, "MARK", "NEW")

    def test_fixture_is_valid_for_each_root(self) -> None:
        for root in v35.ROOTS:
            with self.subTest(root=root):
                input_value, policy = v35.fixture(root)
                self.assertEqual(policy["revision"], 1)
                identity = input_value["identity"] if root == "tenant" else input_value
                self.assertGreater(identity["expires_at"], 0)


if __name__ == "__main__":
    unittest.main()
