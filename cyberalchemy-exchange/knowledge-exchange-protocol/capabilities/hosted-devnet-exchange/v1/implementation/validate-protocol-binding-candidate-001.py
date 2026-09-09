#!/usr/bin/env python3
"""Validate the immutable protocol-only implementation-binding candidate."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
CANDIDATE = ROOT / "protocol-implementation-binding-candidate-001.json"
RECORD = ROOT / "protocol-implementation-binding-record-001.json"
AUTHOR = ROOT / "author_protocol_binding.py"
SYSTEM_ADMISSION = VERTICAL / "decisions/system-ontology-admission-001.json"
HISTORICAL_ACCEPTANCE = VERTICAL / "decisions/implementation-binding-acceptance-001.json"

CANDIDATE_SHA256 = "9f7085ce7147a92c67b8028f9f327fbe0852a76497e178290b8c073f0ce292c5"
RECORD_SHA256 = "6d1b19414e8a76ef9e1e1d95cea39abb80d84a232a5437c37fa13cc56c2e8dc0"
MATERIAL_SHA256 = "8bb300efd40fbaa4b839fa0a173ff4e8c6a109553bf13b475795993e16814375"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
HISTORICAL_ACCEPTANCE_SHA256 = "993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748"
EXPECTED_EXCLUDED_NODES = {"participant-workbench"}
EXPECTED_EXCLUDED_EDGES = {
    "workbench-calls-api",
    "workbench-seals-artifact",
    "workbench-submits-devnet-instruction",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def selectors(items: list[dict]) -> set[str]:
    return {item["selector"] for item in items}


def main() -> int:
    errors: list[str] = []
    candidate = json.loads(CANDIDATE.read_text())
    record = json.loads(RECORD.read_text())

    if sha(CANDIDATE) != CANDIDATE_SHA256:
        errors.append("candidate record digest drift")
    if sha(RECORD) != RECORD_SHA256:
        errors.append("immutable protocol binding record digest drift")
    if candidate.get("binding_record", {}).get("sha256") != RECORD_SHA256:
        errors.append("candidate binding-record reference mismatch")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate implementation-material reference mismatch")
    if record.get("implementation_material_sha256") != MATERIAL_SHA256:
        errors.append("binding-record implementation-material reference mismatch")
    if candidate.get("binding_scope") != "protocol-kernel-without-participant-ui":
        errors.append("candidate protocol-only scope missing")
    if record.get("binding_scope") != "protocol-kernel-without-participant-ui":
        errors.append("binding-record protocol-only scope missing")

    material = hashlib.sha256()
    record_paths: set[str] = set()
    for item in record.get("files", []):
        relative = item["path"]
        path = ROOT / relative
        record_paths.add(relative)
        if not path.is_file():
            errors.append(f"missing implementation file: {relative}")
            continue
        value = path.read_bytes()
        observed = hashlib.sha256(value).hexdigest()
        if observed != item["sha256"]:
            errors.append(f"implementation file digest drift: {relative}")
        material.update(relative.encode())
        material.update(b"\0")
        material.update(value)
        material.update(b"\0")
    observed_material = material.hexdigest()
    if observed_material != MATERIAL_SHA256:
        errors.append("protocol implementation material digest drift")

    forbidden = sorted(
        path
        for path in record_paths
        if path.startswith(("static/", "ui-src/"))
        or path in {"src/ui.rs", "tests/interface_assets.rs", "package.json", "package-lock.json"}
    )
    if forbidden:
        errors.append(f"UI material entered protocol binding: {forbidden}")
    if record.get("source_assets") != []:
        errors.append("protocol binding unexpectedly contains source assets")
    if record.get("default_build_features") != []:
        errors.append("protocol binding is not the no-default-feature build")

    graph = json.loads((VERTICAL / "domainspec/generated/compiled-graph.json").read_text())
    system = json.loads((VERTICAL / "domainspec/generated/system-ontology.json").read_text())
    bound_nodes = selectors(record["selector_bindings"]["graph_nodes"])
    bound_edges = selectors(record["selector_bindings"]["graph_edges"])
    bound_constraints = selectors(record["selector_bindings"]["runtime_constraints"])
    excluded_nodes = selectors(record["excluded_selectors"]["graph_nodes"])
    excluded_edges = selectors(record["excluded_selectors"]["graph_edges"])
    excluded_constraints = selectors(record["excluded_selectors"]["runtime_constraints"])
    actual_nodes = {item["node_id"] for item in graph["nodes"]}
    actual_edges = {item["edge_id"] for item in graph["edges"]}
    actual_constraints = set(system["runtime_constraints"])
    if excluded_nodes != EXPECTED_EXCLUDED_NODES:
        errors.append("excluded graph-node set is not exactly the UI node")
    if excluded_edges != EXPECTED_EXCLUDED_EDGES:
        errors.append("excluded graph-edge set is not exactly the three UI edges")
    if excluded_constraints:
        errors.append("runtime constraints may not be excluded")
    if bound_nodes | excluded_nodes != actual_nodes or bound_nodes & excluded_nodes:
        errors.append("graph-node selector partition is incomplete or overlapping")
    if bound_edges | excluded_edges != actual_edges or bound_edges & excluded_edges:
        errors.append("graph-edge selector partition is incomplete or overlapping")
    if bound_constraints != actual_constraints:
        errors.append("runtime-constraint binding is incomplete")
    for kind in ("graph_nodes", "graph_edges", "runtime_constraints"):
        for item in record["selector_bindings"][kind]:
            paths = item.get("implementation_paths", [])
            if not paths or not set(paths) <= record_paths:
                errors.append(f"selector path closure failed: {kind}/{item.get('selector')}")

    if sha(SYSTEM_ADMISSION) != SYSTEM_ADMISSION_SHA256:
        errors.append("system ontology admission decision digest drift")
    admission = json.loads(SYSTEM_ADMISSION.read_text())
    if admission.get("admission", {}).get("lifecycle_status") != "admitted":
        errors.append("system ontology predecessor is not admitted")
    if sha(HISTORICAL_ACCEPTANCE) != HISTORICAL_ACCEPTANCE_SHA256:
        errors.append("historical hosted acceptance decision digest drift")
    if candidate.get("historical_context", {}).get("hosted_binding_acceptance_decision_sha256") != HISTORICAL_ACCEPTANCE_SHA256:
        errors.append("historical acceptance reference mismatch")
    if candidate.get("acceptance_status") != "not-requested":
        errors.append("candidate improperly claims acceptance")
    if candidate.get("authority_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("candidate improperly claims authority or external effect")

    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    author_check = subprocess.run(
        ["python3", str(AUTHOR), "--check"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if author_check.returncode != 0:
        errors.append("protocol binding author check failed")

    result = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "binding_record_sha256": sha(RECORD),
        "implementation_material_sha256": observed_material,
        "binding_scope": candidate.get("binding_scope"),
        "counts": {
            "files": len(record.get("files", [])),
            "bound_graph_nodes": len(bound_nodes),
            "bound_graph_edges": len(bound_edges),
            "bound_runtime_constraints": len(bound_constraints),
            "excluded_ui_nodes": len(excluded_nodes),
            "excluded_ui_edges": len(excluded_edges),
        },
        "result": "PASS" if not errors else "BLOCK",
        "errors": errors,
        "acceptance_status": "not-requested",
        "protocol_conformance": "not_evaluable",
        "full_hosted_capability_conformance": "not_evaluable-outside-scope",
        "authority_effect": "none",
        "external_effect": "none",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
