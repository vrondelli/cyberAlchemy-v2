from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

PROPERTY_ID = "evf.l2.financial-settlement.rule-to-payout-event-reachability"
PROPERTY_VERSION = "1"
REQUIRED_SOURCES = (
    "financial-settlement.NoDuplicateMakeupRule",
    "financial-settlement.PayoutEligibilityRule",
)
TARGET = "financial-settlement.PayoutCreatedEvent"
SELECTED_PREDICATES = ("enforces", "produces")

FORBIDDEN_PROVIDER_KEYS = {
    "adapter",
    "command",
    "evaluator",
    "executable",
    "provider",
    "runtime",
    "solver",
    "souffle",
}


def canonical_bytes(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def digest_value(value: object) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def exact_ref(repo: Path, relative: str) -> dict[str, object]:
    path = repo / relative
    data = path.read_bytes()
    return {"path": relative, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


def assert_provider_neutral(value: object) -> None:
    if isinstance(value, list):
        for item in value:
            assert_provider_neutral(item)
        return
    if not isinstance(value, dict):
        return
    for key, item in value.items():
        lowered = key.lower().replace("_", "-")
        if any(token in lowered.split("-") for token in FORBIDDEN_PROVIDER_KEYS):
            raise ValueError(f"provider-specific key in neutral obligation: {key}")
        assert_provider_neutral(item)


def derive(
    repo: Path,
    profile: dict[str, Any],
    node_overrides: dict[str, dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    subject = profile["selected_subject"]
    project = json.loads((repo / subject["project"]).read_text())
    if project.get("schema_version") != "minted-project/v1" or project.get("project_id") != "financial-settlement":
        raise ValueError("selected project identity drift")
    source_refs = [exact_ref(repo, subject["project"])]
    source_nodes: list[dict[str, Any]] = []
    overrides = node_overrides or {}
    for relative in subject["node_sources"]:
        node = overrides.get(relative) or json.loads((repo / relative).read_text())
        if (
            node.get("schema_version") != "minted-node/v1"
            or node.get("feature_id") != project["project_id"]
        ):
            raise ValueError(f"selected node identity drift: {relative}")
        source_nodes.append(node)
        if relative in overrides:
            override_bytes = canonical_bytes(node)
            source_refs.append({
                "path": f"{relative}#synthetic-negative-control",
                "sha256": hashlib.sha256(override_bytes).hexdigest(),
                "size_bytes": len(override_bytes),
            })
        else:
            source_refs.append(exact_ref(repo, relative))
    source_set_digest = digest_value(source_refs)

    nodes = sorted(
        ({"node_id": item["node_id"], "feature_id": item["feature_id"], "kind": item["kind"]} for item in source_nodes),
        key=lambda item: (item["node_id"], item["feature_id"], item["kind"]),
    )
    node_ids = [item["node_id"] for item in nodes]
    if len(node_ids) != len(set(node_ids)):
        raise ValueError("duplicate graph node identity")
    universe = set(node_ids)
    selected_edges = sorted(
        (
            {"edge_id": edge["edge_id"], "predicate": edge["type"], "from": node["node_id"], "to": edge["to"]}
            for node in source_nodes
            for edge in node.get("connections", [])
            if edge["type"] in SELECTED_PREDICATES
        ),
        key=lambda item: (item["edge_id"], item["predicate"], item["from"], item["to"]),
    )
    edge_ids = [item["edge_id"] for item in selected_edges]
    if len(edge_ids) != len(set(edge_ids)):
        raise ValueError("duplicate selected edge identity")
    if any(edge["from"] not in universe or edge["to"] not in universe for edge in selected_edges):
        raise ValueError("selected edge endpoint is missing")
    if any(item not in universe for item in (*REQUIRED_SOURCES, TARGET)):
        raise ValueError("required source or target is outside the graph universe")

    fact_payload = {
        "nodes": nodes,
        "selected_edges": selected_edges,
        "selection": {"predicates": list(SELECTED_PREDICATES), "directed": True},
    }
    fact_manifest = {
        "schema_version": "tde.neutral-graph-fact-manifest/v1",
        "project_id": project["project_id"],
        "source_set_digest": source_set_digest,
        "selected_source_refs": source_refs,
        "facts": fact_payload,
        "facts_digest": digest_value(fact_payload),
        "authority_effect": "none",
    }
    property_source = profile["selected_property"]["definition_source"]
    payload = {
        "schema_version": "tde.neutral-graph-obligation/v1",
        "obligation_kind": "closed-world-reachability",
        "property_id": PROPERTY_ID,
        "property_version": PROPERTY_VERSION,
        "property_definition_ref": exact_ref(repo, property_source),
        "fact_manifest_digest": digest_value(fact_manifest),
        "subject": {
            "project_id": project["project_id"],
            "required_sources": list(REQUIRED_SOURCES),
            "target": TARGET,
            "selected_predicates": list(SELECTED_PREDICATES),
            "closure": "non-reflexive-transitive-one-or-more",
            "directed": True,
        },
        "oracle": {
            "relation": "every required source reaches the target",
            "violation": "a required source has no non-empty selected-edge path to the target",
        },
        "capability_classification": "solver-admissible",
        "residue": [],
        "authority_effect": "none",
        "claim_ceiling": "Neutral request only; no execution or evaluation claim.",
    }
    obligation = {**payload, "obligation_id": f"tde.obligation.{digest_value(payload)}"}
    assert_provider_neutral(obligation)
    return obligation, fact_manifest
