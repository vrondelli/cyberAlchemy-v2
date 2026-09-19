#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DAG_PATH = ROOT / "EXECUTION-DAG.json"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL: {message}")


dag = json.loads(DAG_PATH.read_text(encoding="utf-8"))
require(dag.get("schema_version") == "domainspec.whole-application-execution-dag/v1-candidate", "schema version")
require(dag.get("authority_effect") == "none", "authority effect")
require(dag.get("languages") == ["typescript", "python", "rust"], "language denominator")

layers = dag.get("layers")
nodes = dag.get("nodes")
require(isinstance(layers, list) and [layer.get("id") for layer in layers] == ["L0", "L1", "L2", "L3", "L4"], "ordered layer set")
require(isinstance(nodes, list) and nodes, "non-empty node set")

by_id = {}
for node in nodes:
    node_id = node.get("id")
    require(isinstance(node_id, str) and node_id not in by_id, f"unique node id: {node_id}")
    by_id[node_id] = node
    require(node.get("layer") in {"L0", "L1", "L2", "L3", "L4"}, f"known layer: {node_id}")
    require(node_id.startswith(f"{node['layer']}-"), f"layer-prefixed id: {node_id}")
    for field in ("work_package", "kind", "title", "done_when"):
        require(isinstance(node.get(field), str) and node[field].strip(), f"{node_id} non-empty {field}")
    for field in ("depends_on", "outputs", "checks", "stop_conditions"):
        require(isinstance(node.get(field), list), f"{node_id} list {field}")
    require(node["outputs"] and node["checks"], f"{node_id} evidence contract")

for node in nodes:
    for dependency in node["depends_on"]:
        require(dependency in by_id, f"{node['id']} unknown dependency {dependency}")
        require(int(by_id[dependency]["layer"][1:]) <= int(node["layer"][1:]), f"{node['id']} backward layer dependency {dependency}")

indegree = {node_id: 0 for node_id in by_id}
children = {node_id: [] for node_id in by_id}
for node in nodes:
    for dependency in node["depends_on"]:
        indegree[node["id"]] += 1
        children[dependency].append(node["id"])

ready = sorted(node_id for node_id, degree in indegree.items() if degree == 0)
ordered = []
while ready:
    current = ready.pop(0)
    ordered.append(current)
    for child in sorted(children[current]):
        indegree[child] -= 1
        if indegree[child] == 0:
            ready.append(child)
            ready.sort()
require(len(ordered) == len(nodes), "acyclic graph")

terminals = []
for index, layer in enumerate(layers):
    terminal = layer.get("terminal")
    require(terminal in by_id and by_id[terminal]["layer"] == layer["id"], f"{layer['id']} terminal")
    require(isinstance(layer.get("decision_question"), str) and layer["decision_question"].startswith("After this layer, we know whether "), f"{layer['id']} decision question")
    require(isinstance(layer.get("deferred"), list) and layer["deferred"], f"{layer['id']} explicit deferral")
    terminals.append(terminal)
    if index:
        layer_roots = [node for node in nodes if node["layer"] == layer["id"] and all(by_id[dependency]["layer"] != layer["id"] for dependency in node["depends_on"])]
        require(len(layer_roots) == 1, f"{layer['id']} one cross-layer root")
        require(layer_roots[0]["depends_on"] == [terminals[index - 1]], f"{layer['id']} depends on prior terminal")

roots = [node_id for node_id, node in by_id.items() if not node["depends_on"]]
require(roots == ["L0-00"], "single DAG root")
require(not children["L4-EXIT"], "single final terminal")

reachable = set()
frontier = ["L0-00"]
while frontier:
    current = frontier.pop()
    if current in reachable:
        continue
    reachable.add(current)
    frontier.extend(children[current])
require(reachable == set(by_id), "every node reachable from root")

for forbidden in ("T" + "BD", "TO" + "DO", "Open " + "Questions", "Open " + "Decisions"):
    require(forbidden not in DAG_PATH.read_text(encoding="utf-8"), f"no unresolved placeholder: {forbidden}")

print(json.dumps({
    "schema_version": "domainspec.whole-application-execution-dag-validation/v1",
    "dag_id": dag["dag_id"],
    "layers": len(layers),
    "nodes": len(nodes),
    "root": roots[0],
    "terminal": "L4-EXIT",
    "result": "pass",
    "authority_effect": "none"
}, separators=(",", ":")))
