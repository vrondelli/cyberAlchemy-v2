"""Behavior and boundary tests. Open questions: ../OPEN-QUESTIONS.md."""
import copy
import json
import math
import tempfile
import unittest
from pathlib import Path

import jsonschema
from prototype import (PACKAGE, World, Catalog, canonical, decay, digest, steering,
                       verify_history, run_market, run_world)
from run import Rwo, validate_dags, run


class WorldTests(unittest.TestCase):
    def test_world_constructs_independently_and_conserves_resources(self):
        with tempfile.TemporaryDirectory() as directory:
            report = run_world(Path(directory))
            self.assertGreater(report["built"], 0)
            self.assertFalse((Path(directory) / "marketplace").exists())
            state = json.loads((Path(directory) / "world/state.json").read_text())
            total = state["resource"] + state["stock"] + 6*state["built"]
            total += sum(a["cargo"] for a in state["robots"].values())
            self.assertEqual(total, 80)
            self.assertTrue(all(a["energy"] >= 0 for a in state["robots"].values()))

    def test_wrong_owner_world_stale_and_invalid_move_have_no_effect(self):
        world = World()
        original = canonical(world.state)
        intent = world.policy("explorer")
        cases = [("mallory", intent), ("alice", {**intent, "world_id": "elsewhere"}),
                 ("alice", {**intent, "expected_revision": 99}),
                 ("alice", {**intent, "target": [5.0, 5.0]})]
        for caller, command in cases:
            with self.assertRaises(ValueError):
                world.apply(caller, command)
            self.assertEqual(canonical(world.state), original)
            self.assertEqual(world.events, [])

    def test_duplicate_is_idempotent_and_conflict_rejected(self):
        world = World()
        intent = world.policy("explorer")
        receipt = world.apply("alice", intent)
        state = canonical(world.state)
        self.assertEqual(world.apply("alice", intent), receipt)
        self.assertEqual(canonical(world.state), state)
        with self.assertRaisesRegex(ValueError, "REQUEST_ID_CONFLICT"):
            world.apply("alice", {**intent, "expected_revision": 1})
        with self.assertRaisesRegex(ValueError, "OWNER_MISMATCH"):
            world.apply("bob", intent)

    def test_world_history_replays_and_tampering_is_rejected(self):
        world = World()
        initial = copy.deepcopy(world.state)
        for _ in range(5):
            world.step()
        self.assertEqual(verify_history(world.events, initial), world.state)
        corrupt = copy.deepcopy(world.events)
        corrupt[2]["state"]["stock"] = 999
        with self.assertRaisesRegex(ValueError, "WORLD_HISTORY_INVALID"):
            verify_history(corrupt, initial)

    def test_world_is_reproducible(self):
        a, b = World(), World()
        for _ in range(8):
            a.step(); b.step()
        self.assertEqual(a.events, b.events)

    def test_malformed_action_and_nonfinite_position_rejected(self):
        world = World()
        intent = world.policy("explorer")
        for mutation in ({"target": [float("nan"), 0]}, {"target": [0]},
                         {"expected_revision": True}, {"unrecognized": "payload"}):
            with self.assertRaises((ValueError, jsonschema.ValidationError)):
                world.apply("alice", {**intent, **mutation})
        self.assertEqual(world.state["revision"], 0)


class InteractionTests(unittest.TestCase):
    def test_n_dimensions_and_empty_neighbors(self):
        for dimension in (1, 2, 4, 100):
            result = steering([0.0]*dimension, [0.0]*dimension, [([1.0]*dimension, [0.0]*dimension)])
            self.assertEqual(len(result), dimension)
            self.assertTrue(all(math.isfinite(x) and x > 0 for x in result))
            self.assertEqual(steering([0.0]*dimension, [0.0]*dimension, []), [0.0]*dimension)
        with self.assertRaises(ValueError):
            steering([0.0], [0.0], [([0.0, 1.0], [0.0])])

    def test_component_decay_and_semigroup(self):
        first = decay([1.0, 1.0], [0.01, 0.5], 2)
        self.assertGreater(first[0], first[1])
        twice = decay(first, [0.01, 0.5], 3)
        direct = decay([1.0, 1.0], [0.01, 0.5], 5)
        for a, b in zip(twice, direct):
            self.assertAlmostEqual(a, b)
        with self.assertRaises(ValueError):
            decay([1], [-1], 2)


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.catalog = Catalog(Path(self.temp.name))
        self.offer = self.catalog.add("fixture.query", b'{"value":1}\n{"value":2}\n', kind="tool",
                                      artifact_type="dataset", domain="research", consumers=["alice"],
                                      contributors=["fixture"])
        self.query = {"schema_version": "robot-world.query/v1-prototype", "request_id": "query-1",
                      "world_id": "workshop-001", "consumer": "alice", "capability_id": "fixture.query",
                      "version": self.offer["version"], "limit": 1}

    def test_independent_query_binds_version_consumer_and_result(self):
        result = self.catalog.query("alice", self.query)
        self.assertEqual(result["rows"], [{"value": 1}])
        self.assertEqual(result["receipt"]["result_sha256"], digest(canonical(result["rows"])))
        self.assertEqual(result, self.catalog.query("alice", self.query))
        with self.assertRaisesRegex(ValueError, "REQUEST_ID_CONFLICT"):
            self.catalog.query("alice", {**self.query, "limit": 2})

    def test_unauthorized_missing_version_and_oversized_query_rejected(self):
        with self.assertRaisesRegex(ValueError, "CONSUMER_MISMATCH"):
            self.catalog.query("bob", self.query)
        with self.assertRaisesRegex(ValueError, "ACCESS_DENIED"):
            self.catalog.query("bob", {**self.query, "consumer": "bob"})
        with self.assertRaisesRegex(ValueError, "EXACT_VERSION_NOT_FOUND"):
            self.catalog.query("alice", {**self.query, "version": "0"*64})
        with self.assertRaises(jsonschema.ValidationError):
            self.catalog.query("alice", {**self.query, "limit": 100})

    def test_tampered_blob_and_conflicting_manifest_rejected(self):
        (self.catalog.root / "blobs" / self.offer["version"]).write_bytes(b"tampered")
        with self.assertRaisesRegex(ValueError, "ARTIFACT_TAMPERED"):
            self.catalog.query("alice", self.query)
        with self.assertRaisesRegex(ValueError, "MANIFEST_CONFLICT"):
            self.catalog.add("fixture.query", b'{"value":1}\n{"value":2}\n', kind="tool",
                             artifact_type="dataset", domain="research", consumers=["bob"], contributors=["fixture"])

    def test_valid_materialization_independent_of_world(self):
        with tempfile.TemporaryDirectory() as directory:
            result = run_market(Path(directory))
            self.assertEqual(result["status"], "PASS")
            self.assertFalse(result["world_required"])
            self.assertFalse((Path(directory) / "world").exists())

    def test_invalid_dataset_is_quarantined_without_offer(self):
        with tempfile.TemporaryDirectory() as directory:
            result = run_market(Path(directory), "invalid")
            self.assertEqual(result["status"], "QUARANTINED")
            self.assertEqual(result["offer_count"], 0)
            self.assertFalse((Path(directory) / "marketplace").exists())


class RwoTests(unittest.TestCase):
    def setUp(self):
        self.host = Rwo()
        self.addCleanup(self.host.close)
        self.definition = json.loads((PACKAGE / "dag/epoch-001.json").read_text())

    def test_both_graphs_validate(self):
        self.assertEqual([r["status"] for r in validate_dags()], ["PASS", "PASS"])

    def test_parallel_roots_then_join_and_wrong_command_rejected(self):
        result = self.host.request({"operation": "start", "definition": self.definition})
        commands = {c["node_id"]: c for c in result["commands"]}
        self.assertEqual(set(commands), {"W0", "M0"})
        for number, node in enumerate(("W0", "M0")):
            event = {"operation": "complete", "event_id": node, "node_id": node,
                     "command_id": commands[node]["command_id"], "success": True, "output": {"fixture": node}}
            if number == 0:
                with self.assertRaises(ValueError):
                    self.host.request({**event, "command_id": "wrong"})
            result = self.host.request(event)
            self.assertEqual([c["node_id"] for c in result["commands"]], [] if number == 0 else ["J0"])

    def test_cycle_rejected(self):
        self.definition["nodes"][0]["depends_on"] = ["J0"]
        self.definition["nodes"][0]["release"] = {"mode": "all"}
        with self.assertRaisesRegex(ValueError, "DAG_CYCLE_DETECTED"):
            self.host.request({"operation": "validate", "definition": self.definition})

    def test_real_host_runs_parallel_branches_and_exchanges_results(self):
        (PACKAGE / "runs").mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="local-test-", dir=PACKAGE / "runs") as directory:
            root = Path(directory) / "epoch"
            report = run(root)
            self.assertEqual(report["status"], "PASS", report["errors"])
            self.assertEqual(report["node_status"], {"W0": "succeeded", "M0": "succeeded", "J0": "succeeded"})
            journal = json.loads((root / "rwo-journal.json").read_text())
            outputs = {item["request"]["node_id"]: item["request"]["output"]
                       for item in journal if "request" in item}
            self.assertLess(max(outputs[n]["started_monotonic"] for n in ("W0", "M0")),
                            min(outputs[n]["finished_monotonic"] for n in ("W0", "M0")))
            self.assertGreaterEqual(outputs["J0"]["started_monotonic"],
                                    max(outputs[n]["finished_monotonic"] for n in ("W0", "M0")))
            exchange = json.loads((root / "bridge/exchange.json").read_text())
            self.assertEqual(exchange["receipt"]["result_sha256"], digest(canonical(exchange["rows"])))
            events = json.loads((root / "bridge/world-events.json").read_text())
            state = json.loads((root / "bridge/world-state.json").read_text())
            self.assertEqual(verify_history(events, World().state), state)


if __name__ == "__main__":
    unittest.main(verbosity=2)
