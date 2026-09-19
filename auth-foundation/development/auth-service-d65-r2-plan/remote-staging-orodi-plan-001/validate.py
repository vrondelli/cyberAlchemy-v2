#!/usr/bin/env python3
import json
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ALLOWED_STATES = {"passed", "failed", "missing", "invalid", "inconclusive", "stale", "not-run"}


def load(name):
    return json.loads((ROOT / name).read_text())


def validate_dag(dag):
    errors = []
    nodes = dag.get("nodes", [])
    ids = [node.get("id") for node in nodes]
    if len(ids) != len(set(ids)):
        errors.append("DAG node IDs must be unique")
    known = set(ids)
    for node in nodes:
        for field in ("id", "lane", "kind", "owner", "outputs", "pass_condition", "failure_state"):
            if field not in node:
                errors.append(f"{node.get('id')}: missing {field}")
        if node.get("lane") not in {"product-construction", "operational-support"}:
            errors.append(f"{node.get('id')}: invalid lane")
        if node.get("failure_state") not in ALLOWED_STATES:
            errors.append(f"{node.get('id')}: invalid failure state")
        unknown = set(node.get("depends_on", [])) - known
        if unknown:
            errors.append(f"{node.get('id')}: unknown dependencies {sorted(unknown)}")

    graph = {node["id"]: node.get("depends_on", []) for node in nodes if "id" in node}
    visiting, visited = set(), set()

    def visit(node_id):
        if node_id in visiting:
            errors.append(f"cycle at {node_id}")
            return
        if node_id in visited:
            return
        visiting.add(node_id)
        for dep in graph.get(node_id, []):
            visit(dep)
        visiting.remove(node_id)
        visited.add(node_id)

    for node_id in graph:
        visit(node_id)
    if dag.get("authority_effect") != "none":
        errors.append("DAG authority_effect must be none")
    return errors


def validate_binding(binding):
    errors = []
    if set(binding.get("evidence_states", [])) != ALLOWED_STATES:
        errors.append("binding must declare exactly seven disjoint ORODI evidence states")
    controls = binding.get("control_denominator", [])
    hostile = binding.get("hostile_denominator", [])
    pipeline = binding.get("evidence_pipeline_hostile_controls", [])
    if [x.get("id") for x in controls] != [f"C{i:02d}" for i in range(1, 21)]:
        errors.append("control denominator must be complete and ordered C01-C20")
    if [x.get("id") for x in hostile] != [f"M{i:02d}" for i in range(1, 18)]:
        errors.append("hostile denominator must be complete and ordered M01-M17")
    if [x.get("id") for x in pipeline] != [f"P{i:02d}" for i in range(1, 7)]:
        errors.append("pipeline hostile controls must be complete and ordered P01-P06")
    for member in controls + hostile + pipeline:
        if member.get("state") not in ALLOWED_STATES:
            errors.append(f"{member.get('id')}: invalid evidence state")
    if binding.get("state") != "not-run":
        errors.append("candidate binding must remain not-run")
    if binding.get("authority_effect") != "none":
        errors.append("binding authority_effect must be none")
    return errors


def validate_predecessors(predecessors):
    errors = []
    seen = set()
    for source in predecessors.get("sources", []):
        source_id = source.get("id")
        if source_id in seen:
            errors.append(f"duplicate predecessor id: {source_id}")
        seen.add(source_id)
        path = Path(source.get("path", ""))
        if not path.is_file():
            errors.append(f"missing predecessor: {source_id}")
            continue
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != source.get("sha256"):
            errors.append(f"stale predecessor: {source_id}")
    if not predecessors.get("known_counterevidence"):
        errors.append("known counterevidence must remain visible")
    if predecessors.get("authority_effect") != "none":
        errors.append("predecessor authority_effect must be none")
    return errors


def main():
    errors = validate_dag(load("DAG.json")) + validate_binding(load("EVALUATION-BINDING.v1-candidate.json")) + validate_predecessors(load("PREDECESSORS.json"))
    required = {"README.md", "PLAN.md", "DAG.md", "DAG.json", "EVIDENCE-CLASSIFICATION.md", "EVALUATION-BINDING.v1-candidate.json", "PREDECESSORS.json", "ORODI-PREFLIGHT-DIAGNOSTIC.json"}
    missing = sorted(name for name in required if not (ROOT / name).is_file())
    errors.extend(f"missing artifact: {name}" for name in missing)
    if errors:
        print(json.dumps({"status": "fail", "errors": errors}, indent=2))
        raise SystemExit(1)
    print(json.dumps({"status": "pass", "nodes": len(load('DAG.json')['nodes']), "controls": 20, "hostile_controls": 17, "pipeline_hostile_controls": 6, "authority_effect": "none"}, indent=2))


if __name__ == "__main__":
    main()
