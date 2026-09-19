#!/usr/bin/env python3
"""Validate the authoring-to-runtime planning DAG without mutating it."""

from __future__ import annotations

import json
from collections import defaultdict, deque
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DAG_PATH = ROOT / "EXECUTION-DAG.json"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    dag = json.loads(DAG_PATH.read_text(encoding="utf-8"))
    require(dag.get("authority_effect") == "none", "authority effect must remain none")
    require(dag.get("status") == "planning-candidate", "status must remain planning-candidate")

    layers = dag.get("layers", [])
    require([layer.get("id") for layer in layers] == ["L0", "L1", "L2", "L3", "L4"], "expected exactly L0 through L4")

    nodes = dag.get("nodes", [])
    ids = [node.get("id") for node in nodes]
    require(all(isinstance(node_id, str) and node_id for node_id in ids), "every node needs an id")
    require(len(ids) == len(set(ids)), "node ids must be unique")
    by_id = {node["id"]: node for node in nodes}

    required_fields = {"id", "layer", "lane", "depends_on", "work", "done_when", "evidence", "hard_stops"}
    for node in nodes:
        require(required_fields <= node.keys(), f"{node['id']} lacks required fields")
        require(node["lane"] in {"product-construction", "operational-support"}, f"{node['id']} has unknown lane")
        require(node["layer"] in {"baseline", "L0", "L1", "L2", "L3", "L4"}, f"{node['id']} has unknown layer")
        require(node["work"] and node["done_when"], f"{node['id']} lacks a decision-bearing work boundary")
        require(node["evidence"], f"{node['id']} lacks exit evidence")
        require(node["hard_stops"], f"{node['id']} lacks hard stops")
        for dependency in node["depends_on"]:
            require(dependency in by_id, f"{node['id']} depends on missing {dependency}")

    root = dag.get("root")
    terminal = dag.get("terminal")
    require(root in by_id and terminal in by_id, "declared root and terminal must exist")
    roots = [node["id"] for node in nodes if not node["depends_on"]]
    require(roots == [root], f"expected one root {root}, found {roots}")

    children: dict[str, list[str]] = defaultdict(list)
    indegree = {node_id: 0 for node_id in ids}
    for node in nodes:
        for dependency in node["depends_on"]:
            children[dependency].append(node["id"])
            indegree[node["id"]] += 1

    queue = deque(node_id for node_id, degree in indegree.items() if degree == 0)
    ordered: list[str] = []
    while queue:
        current = queue.popleft()
        ordered.append(current)
        for child in children[current]:
            indegree[child] -= 1
            if indegree[child] == 0:
                queue.append(child)
    require(len(ordered) == len(nodes), "dependency graph must be acyclic")

    reachable = {root}
    frontier = [root]
    while frontier:
        current = frontier.pop()
        for child in children[current]:
            if child not in reachable:
                reachable.add(child)
                frontier.append(child)
    require(reachable == set(ids), "every node must be reachable from the root")
    leaves = sorted(node_id for node_id in ids if not children[node_id])
    require(leaves == [terminal], f"expected one terminal {terminal}, found {leaves}")

    exits = {layer["id"]: layer["exit"] for layer in layers}
    for layer_id, exit_id in exits.items():
        require(exit_id in by_id, f"{layer_id} exit missing")
        require(by_id[exit_id]["layer"] == layer_id, f"{exit_id} assigned to wrong layer")

    expected_chain = [("L0X", "I01"), ("L1X", "C01"), ("L2X", "E01"), ("L3X", "P01")]
    for predecessor, successor in expected_chain:
        require(predecessor in by_id[successor]["depends_on"], f"missing layer promotion {predecessor} -> {successor}")

    operational = [node for node in nodes if node["lane"] == "operational-support"]
    require([node["id"] for node in operational] == ["O01"], "only the declared harness repair belongs to the operational lane")
    require("O01" not in by_id["P01"]["depends_on"], "operational harness work must not block product packaging design")
    require("O01" in by_id["P02"]["depends_on"], "installed qualification must require the portable harness")

    result = {
        "schema_version": "domainspec.authoring-to-runtime-dag-validation/v1-candidate",
        "dag_id": dag["dag_id"],
        "layers": len(layers),
        "nodes": len(nodes),
        "product_construction_nodes": sum(node["lane"] == "product-construction" for node in nodes),
        "operational_support_nodes": len(operational),
        "root": root,
        "terminal": terminal,
        "result": "pass",
        "authority_effect": "none",
    }
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()

