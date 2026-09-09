"""Local World and Catalog reducers. Open questions: ../OPEN-QUESTIONS.md.

Identities below are fixture bindings, not network authentication. Files are local.
"""
from __future__ import annotations

import copy
import contextlib
import hashlib
import http.server
import importlib.util
import json
import math
import sys
import threading
import urllib.parse
from pathlib import Path

import jsonschema

PACKAGE = Path(__file__).resolve().parents[1]
CA2 = PACKAGE.parents[1]
SCHEMA = json.loads((PACKAGE / "contracts/bridge.schema.json").read_text())


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                      allow_nan=False).encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical(value) + b"\n")


def validate(kind, value):
    schema = {"$schema": SCHEMA["$schema"], "$defs": SCHEMA["$defs"],
              "$ref": f"#/$defs/{kind}"}
    jsonschema.Draft202012Validator(schema).validate(value)
    canonical(value)  # Reject NaN and infinity, which Python's parser otherwise accepts.


def norm(vector):
    return math.sqrt(sum(x * x for x in vector))


def steering(position, velocity, neighbors, scales=None):
    """N-dimensional boids heuristic, with explicit per-axis units/scales."""
    n = len(position)
    scales = [1.0] * n if scales is None else scales
    if n < 1 or len(velocity) != n or len(scales) != n or any(s <= 0 for s in scales):
        raise ValueError("VECTOR_DIMENSION_OR_SCALE")
    values = list(position) + list(velocity) + list(scales)
    for p, v in neighbors:
        if len(p) != n or len(v) != n:
            raise ValueError("VECTOR_DIMENSION")
        values.extend(p); values.extend(v)
    if not all(math.isfinite(x) for x in values):
        raise ValueError("VECTOR_NONFINITE")
    if not neighbors:
        return [0.0] * n
    force = [0.0] * n
    for p, v in neighbors:
        delta = [(position[k] - p[k]) / scales[k] for k in range(n)]
        distance = norm(delta)
        for k in range(n):
            separation = delta[k] / max(distance * distance, 0.01) if distance < 0.5 else 0.0
            force[k] += (0.05 * separation + 0.1 * (v[k] - velocity[k])
                         + 0.08 * (p[k] - position[k])) / len(neighbors)
    magnitude = norm(force)
    return [v * min(1.0, 0.15 / max(magnitude, 1e-12)) for v in force]


def decay(vector, rates, dt):
    if len(vector) != len(rates) or dt < 0 or any(r < 0 for r in rates):
        raise ValueError("DECAY_ARGUMENT")
    if not all(math.isfinite(v) for v in [*vector, *rates, dt]):
        raise ValueError("DECAY_NONFINITE")
    return [v * math.exp(-r * dt) for v, r in zip(vector, rates)]


class World:
    def __init__(self, world_id="workshop-001"):
        self.state = {"world_id": world_id, "revision": 0, "tick": 0, "stock": 0,
                      "built": 0, "resource": 80, "knowledge": [], "robots": {
            "explorer": {"owner": "alice", "position": [-1.0, 1.0], "cargo": 0,
                         "energy": 100, "prior": [0.85, 0.25, 0.65, 0.4], "memory": [0.0]*4},
            "builder": {"owner": "bob", "position": [1.0, 1.0], "cargo": 0,
                        "energy": 100, "prior": [0.4, 0.95, 0.7, 0.5], "memory": [0.0]*4}}}
        self.events = []
        self.requests = {}
        self.frames = [copy.deepcopy(self.state)]

    def _commit(self, intent, next_state):
        next_state["revision"] = self.state["revision"] + 1
        base = {"revision": next_state["revision"], "intent": intent,
                "previous_hash": self.events[-1]["event_hash"] if self.events else "0"*64,
                "before_sha256": digest(canonical(self.state)), "state": next_state}
        event = {**base, "event_hash": digest(canonical(base))}
        self.events.append(copy.deepcopy(event))
        self.state = next_state
        return {"world_id": next_state["world_id"], "revision": next_state["revision"],
                "event_hash": event["event_hash"], "status": "accepted"}

    def apply(self, caller, intent):
        validate("ActionIntent", intent)
        if intent["world_id"] != self.state["world_id"]:
            raise ValueError("WORLD_MISMATCH")
        robot = self.state["robots"].get(intent["agent_id"])
        if robot is None or robot["owner"] != caller:
            raise ValueError("OWNER_MISMATCH")
        key = (caller, intent["request_id"])
        encoded = canonical(intent)
        if key in self.requests:
            old, receipt = self.requests[key]
            if old != encoded:
                raise ValueError("REQUEST_ID_CONFLICT")
            return copy.deepcopy(receipt)
        if intent["expected_revision"] != self.state["revision"]:
            raise ValueError("STALE_REVISION")
        state = copy.deepcopy(self.state)
        actor = state["robots"][intent["agent_id"]]
        op = intent["action"]
        at = lambda p: norm([actor["position"][i] - p[i] for i in range(2)]) < 0.2
        if op == "move":
            target = intent["target"]
            distance = norm([target[i] - actor["position"][i] for i in range(2)])
            if distance > 0.800001 or actor["energy"] < 1:
                raise ValueError("MOVEMENT_BUDGET")
            actor["position"] = target
            actor["energy"] -= 1
        elif op == "gather":
            if not at([-3.0, 0.0]) or actor["cargo"] >= 3 or state["resource"] < 1:
                raise ValueError("GATHER_PRECONDITION")
            actor["cargo"] += 1; state["resource"] -= 1
            actor["memory"][0] += 0.1
        elif op == "deposit":
            if not at([3.0, 0.0]) or actor["cargo"] < 1:
                raise ValueError("DEPOSIT_PRECONDITION")
            state["stock"] += actor["cargo"]; actor["cargo"] = 0
            actor["memory"][2] += 0.3
        elif op == "build":
            if not at([3.0, 0.0]) or state["stock"] < 6:
                raise ValueError("BUILD_PRECONDITION")
            state["stock"] -= 6; state["built"] += 1
            actor["memory"][1] += 0.5
        elif op != "wait":
            raise ValueError("UNKNOWN_ACTION")
        receipt = self._commit(intent, state)
        self.requests[key] = (encoded, copy.deepcopy(receipt))
        return receipt

    def context(self, agent_id):
        agent = self.state["robots"][agent_id]
        return {"world_id": self.state["world_id"], "revision": self.state["revision"],
                "agent_id": agent_id, "agent": copy.deepcopy(agent),
                "workshop_stock": self.state["stock"], "knowledge": self.state["knowledge"][-8:],
                "edges": [{"subject": agent["owner"], "predicate": "owns", "object": agent_id}]}

    def policy(self, agent_id):
        actor = self.state["robots"][agent_id]
        semantic = [p+m for p, m in zip(actor["prior"], actor["memory"])]
        neighbors = [([p+m for p, m in zip(other["prior"], other["memory"])], [0.0]*4)
                     for key, other in self.state["robots"].items() if key != agent_id]
        force = steering(semantic, [0.0]*4, neighbors)
        build_score = semantic[1] + force[1]
        explore_score = semantic[0] + force[0]
        target = [3.0, 0.0] if actor["cargo"] >= 3 else [-3.0, 0.0]
        if actor["cargo"] == 0 and self.state["stock"] >= 6 and build_score > explore_score:
            target = [3.0, 0.0]
        distance = norm([target[i]-actor["position"][i] for i in range(2)])
        intent = {"schema_version": "robot-world.action/v1-prototype", "world_id": self.state["world_id"],
                  "agent_id": agent_id, "request_id": f"{agent_id}-{self.state['tick']}",
                  "expected_revision": self.state["revision"], "action": "wait"}
        if distance > 0.19 and actor["energy"] > 0:
            intent.update(action="move", target=[round(actor["position"][i] +
                          (target[i]-actor["position"][i])*min(0.8/distance, 1), 6) for i in range(2)])
        elif distance <= 0.19:
            if target[0] < 0 and self.state["resource"] > 0:
                intent["action"] = "gather"
            elif target[0] > 0:
                intent["action"] = "deposit" if actor["cargo"] else "build"
        return intent

    def step(self):
        for agent_id in sorted(self.state["robots"]):
            self.apply(self.state["robots"][agent_id]["owner"], self.policy(agent_id))
        state = copy.deepcopy(self.state)
        state["tick"] += 1
        for actor in state["robots"].values():
            actor["memory"] = decay(actor["memory"], [0.08, 0.02, 0.04, 0.1], 1.0)
        self._commit({"action": "advance-clock", "host": "local-fixture"}, state)
        self.frames.append(copy.deepcopy(state))

    def learn(self, receipt):
        """Called only by the local bridge after validating the immutable result."""
        validate("ExchangeReceipt", receipt)
        if receipt["world_id"] != self.state["world_id"] or receipt["consumer"] != "alice":
            raise ValueError("KNOWLEDGE_BINDING")
        state = copy.deepcopy(self.state)
        if receipt["result_sha256"] not in state["knowledge"]:
            state["knowledge"].append(receipt["result_sha256"])
            self._commit({"action": "consume-knowledge", "receipt": receipt}, state)
            self.frames.append(copy.deepcopy(state))


class Catalog:
    def __init__(self, root):
        self.root = Path(root)
        self.offers = {}
        self.requests = {}

    def add(self, capability_id, data, *, kind, artifact_type, domain, consumers, contributors):
        version = digest(data)
        manifest = {"schema_version": "robot-world.artifact/v1-prototype", "capability_id": capability_id,
                    "version": version, "kind": kind, "artifact_type": artifact_type, "domain": domain,
                    "effect": "read-only" if artifact_type == "dataset" else "simulation-only",
                    "consumers": sorted(set(consumers)), "contributors": sorted(set(contributors)),
                    "byte_count": len(data)}
        validate("ArtifactManifest", manifest)
        key = (capability_id, version)
        if key in self.offers and self.offers[key] != manifest:
            raise ValueError("MANIFEST_CONFLICT")
        path = self.root / "blobs" / version
        if path.exists() and path.read_bytes() != data:
            raise ValueError("ARTIFACT_TAMPERED")
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_bytes(data)
        self.offers[key] = manifest
        return copy.deepcopy(manifest)

    def query(self, caller, request):
        validate("QueryIntent", request)
        if caller != request["consumer"]:
            raise ValueError("CONSUMER_MISMATCH")
        key = (request["capability_id"], request["version"])
        if key not in self.offers:
            raise ValueError("EXACT_VERSION_NOT_FOUND")
        manifest = self.offers[key]
        if caller not in manifest["consumers"]:
            raise ValueError("ACCESS_DENIED")
        if manifest["artifact_type"] != "dataset":
            raise ValueError("CAPABILITY_NOT_QUERYABLE")
        data = (self.root / "blobs" / request["version"]).read_bytes()
        if digest(data) != manifest["version"] or len(data) != manifest["byte_count"]:
            raise ValueError("ARTIFACT_TAMPERED")
        request_key = (caller, request["request_id"])
        encoded = canonical(request)
        if request_key in self.requests:
            old, result = self.requests[request_key]
            if old != encoded:
                raise ValueError("REQUEST_ID_CONFLICT")
            return copy.deepcopy(result)
        rows = [json.loads(line) for line in data.splitlines()][:request["limit"]]
        receipt = {"schema_version": "robot-world.exchange/v1-prototype", "request_id": request["request_id"],
                   "world_id": request["world_id"], "consumer": caller, "capability_id": key[0],
                   "version": key[1], "result_sha256": digest(canonical(rows)), "row_count": len(rows),
                   "mode": "local-contract-fixture"}
        validate("ExchangeReceipt", receipt)
        result = {"rows": rows, "receipt": receipt}
        self.requests[request_key] = (encoded, copy.deepcopy(result))
        return result


def verify_history(events, initial):
    state, previous = initial, "0"*64
    for sequence, event in enumerate(events, 1):
        base = {k: v for k, v in event.items() if k != "event_hash"}
        if (event["revision"] != sequence or event["previous_hash"] != previous or
            event["before_sha256"] != digest(canonical(state)) or digest(canonical(base)) != event["event_hash"]):
            raise ValueError("WORLD_HISTORY_INVALID")
        state, previous = event["state"], event["event_hash"]
    return copy.deepcopy(state)


def run_world(root):
    root = Path(root)
    world = World()
    for _ in range(80):
        world.step()
    if world.state["built"] < 1:
        raise ValueError("CONSTRUCTION_NOT_DEMONSTRATED")
    save(root / "world/state.json", world.state)
    save(root / "world/replay.json", {"mode": "recorded-scripted-policy", "frames": world.frames})
    save(root / "world/events.json", world.events)
    save(root / "world/context.json", world.context("explorer"))
    recipe = (PACKAGE / "model/world.domain.json").read_bytes()
    (root / "world/recipe.json").write_bytes(recipe)
    return {"status": "PASS", "built": world.state["built"], "ticks": world.state["tick"],
            "event_count": len(world.events), "recipe_sha256": digest(recipe),
            "event_head": world.events[-1]["event_hash"], "marketplace_required": False}


def run_market(root, fixture="valid"):
    root = Path(root)
    source = CA2 / "trusted-dataset-materialization/runtime/pipeline.py"
    sys.path.insert(0, str(source.parent))
    spec = importlib.util.spec_from_file_location("robot_world_dataset_pipeline", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ADAPTER = PACKAGE / "runtime/target/debug/cav2-trusted-dataset-rwo-adapter"
    with dataset_fixture_server(fixture) as url:
        result = module.Pipeline(root / "materialization", url, "dataset-001", backend="local").run_to_terminal()
    if result["status"] != "PASS":
        return {"status": "QUARANTINED", "materialization": result, "offer_count": 0}
    files = list((root / "materialization/warehouse").glob("*.jsonl"))
    if len(files) != 1:
        raise ValueError("DATASET_VERSION_AMBIGUOUS")
    catalog = Catalog(root / "marketplace")
    offer = catalog.add("fixture.indicators.query", files[0].read_bytes(), kind="tool",
                        artifact_type="dataset", domain="research", consumers=["alice", "bob"],
                        contributors=["trusted-dataset-fixture"])
    save(root / "marketplace/catalog.json", list(catalog.offers.values()))
    return {"status": "PASS", "offer": offer, "materialization": result, "world_required": False}


@contextlib.contextmanager
def dataset_fixture_server(fixture):
    """Use the existing fixture bytes; close the socket as well as its worker."""
    if fixture not in ("valid", "invalid"):
        raise ValueError("UNKNOWN_DATASET_FIXTURE")
    source = CA2 / "trusted-dataset-materialization/fixtures/http"

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            page = query.get("page", ["1"])[0]
            if page not in ("1", "2"):
                self.send_error(404); return
            data = (source / f"{fixture}-page-{page}.json").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers(); self.wfile.write(data)

        def log_message(self, *_):
            pass

    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}/indicators"
        finally:
            server.shutdown(); thread.join()


def run_bridge(root):
    root = Path(root)
    state = json.loads((root / "world/state.json").read_text())
    events = json.loads((root / "world/events.json").read_text())
    world = World(state["world_id"])
    if verify_history(events, world.state) != state:
        raise ValueError("WORLD_PROJECTION_MISMATCH")
    world.state, world.events = state, events
    world.frames = json.loads((root / "world/replay.json").read_text())["frames"]
    catalog = Catalog(root / "marketplace")
    offers = json.loads((root / "marketplace/catalog.json").read_text())
    for offer in offers:
        validate("ArtifactManifest", offer)
        catalog.offers[(offer["capability_id"], offer["version"])] = offer
    recipe = (root / "world/recipe.json").read_bytes()
    report = json.loads((root / "world/result.json").read_text())
    if digest(recipe) != report["recipe_sha256"]:
        raise ValueError("WORLD_ARTIFACT_TAMPERED")
    catalog.add("world.resource-workshop.recipe", recipe, kind="workflow", artifact_type="recipe",
                domain="construction", consumers=["alice", "bob"], contributors=["alice", "bob"])
    request = {"schema_version": "robot-world.query/v1-prototype", "request_id": "world-query-001",
               "world_id": state["world_id"], "consumer": "alice", "capability_id": offers[0]["capability_id"],
               "version": offers[0]["version"], "limit": 3}
    exchange = catalog.query("alice", request)
    if digest(canonical(exchange["rows"])) != exchange["receipt"]["result_sha256"]:
        raise ValueError("RESULT_TAMPERED")
    world.learn(exchange["receipt"])
    save(root / "bridge/exchange.json", exchange)
    save(root / "bridge/catalog.json", list(catalog.offers.values()))
    save(root / "bridge/world-state.json", world.state)
    save(root / "bridge/world-events.json", world.events)
    save(root / "bridge/replay.json", {"mode": "recorded-scripted-policy", "frames": world.frames})
    return {"status": "PASS", "catalog_offers": len(catalog.offers), "consumed_rows": len(exchange["rows"]),
            "knowledge_entries": len(world.state["knowledge"]), "kep_mode": "local-contract-fixture",
            "world_event_head": world.events[-1]["event_hash"]}
