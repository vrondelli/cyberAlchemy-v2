#!/usr/bin/env python3
"""Author the Essays agent-runtime DomainSpec v2 candidate source."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "authored"
FEATURE = "essays-agent-runtime"


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def primitive(name):
    return {"kind": "primitive", "name": name}


nodes = [
    {
        "node_id": "workspace",
        "kind": "Entity",
        "body": {
            "description": "One Essays workspace whose accepted state is separated from proposals, evidence, conflicts, questions, and residue.",
            "identity_field": "workspace-id",
            "fields": [
                {"field_id": "workspace-id", "type_ref": primitive("uuid"), "required": True},
                {"field_id": "work-owner", "type_ref": primitive("string"), "required": True},
                {"field_id": "accepted-revision", "type_ref": primitive("integer"), "required": True},
                {"field_id": "event-cursor", "type_ref": primitive("integer"), "required": True},
            ],
        },
    },
    {
        "node_id": "workspace-snapshot",
        "kind": "Entity",
        "body": {
            "description": "A freshness-qualified projection separating accepted content, proposals, evidence, conflicts, questions, and residue.",
            "identity_field": "snapshot-id",
            "fields": [
                {"field_id": "snapshot-id", "type_ref": primitive("uuid"), "required": True},
                {"field_id": "workspace-id", "type_ref": primitive("uuid"), "required": True},
                {"field_id": "accepted-revision", "type_ref": primitive("integer"), "required": True},
                {"field_id": "event-cursor", "type_ref": primitive("integer"), "required": True},
            ],
        },
    },
    {
        "node_id": "authenticated-principal",
        "kind": "Rule",
        "body": {
            "description": "Mutation authority is derived from a transport-verified principal and never from an actor string inside a command payload.",
            "predicate": "principal.verified && principal.subject == workspace.work-owner",
        },
    },
    {
        "node_id": "expected-revision-current",
        "kind": "Rule",
        "body": {
            "description": "Every accepted-state mutation matches the current accepted revision.",
            "predicate": "command.expected-revision == workspace.accepted-revision",
        },
    },
    {
        "node_id": "work-owner-authorized",
        "kind": "Rule",
        "body": {
            "description": "Only a verified Work Owner principal may dispose a proposal or authorize an external effect.",
            "predicate": "authenticated-principal && grant.current",
        },
    },
    {
        "node_id": "request-idempotent",
        "kind": "Rule",
        "body": {
            "description": "A request identity is permanently bound to one canonical command digest and one committed outcome.",
            "predicate": "request-id is absent || stored.command-digest == incoming.command-digest",
        },
    },
    {
        "node_id": "context-sufficient",
        "kind": "Rule",
        "body": {
            "description": "Context is classified sufficient, insufficient, or indeterminate for the exact operation and preserves inference controls.",
            "predicate": "context.sufficiency == sufficient && context.provenance && context.authority-ceiling",
        },
    },
    {
        "node_id": "effect-envelope-current",
        "kind": "Rule",
        "body": {
            "description": "An external-effect envelope binds verified owner, actor, target, scope, expiry, revocation, deadline, replay posture, and evidence expectation.",
            "predicate": "grant.current && deadline.current && retry != implicit",
        },
    },
    {
        "node_id": "record-proposal",
        "kind": "Operation",
        "body": {
            "description": "Durably record a provenance-complete non-mutating proposal.",
            "reads": ["workspace", "context-policy", "authenticated-principal"],
            "writes": ["proposal-ledger", "event-ledger"],
            "effects": ["proposal-recorded"],
            "guard": "request-idempotent+context-sufficient",
            "failure_continuation": "return bounded rejection without accepted-state mutation",
        },
    },
    {
        "node_id": "accept-proposal",
        "kind": "Operation",
        "body": {
            "description": "The verified Work Owner accepts one exact current proposal and advances accepted revision.",
            "reads": ["workspace", "proposal-ledger", "authenticated-principal"],
            "writes": ["accepted-state", "proposal-ledger", "event-ledger"],
            "effects": ["proposal-accepted"],
            "guard": "expected-revision-current+work-owner-authorized+request-idempotent",
            "failure_continuation": "return typed conflict or denial",
        },
    },
    {
        "node_id": "reject-proposal",
        "kind": "Operation",
        "body": {
            "description": "The verified Work Owner rejects one exact current proposal without mutating accepted prose.",
            "reads": ["workspace", "proposal-ledger", "authenticated-principal"],
            "writes": ["proposal-ledger", "event-ledger"],
            "effects": ["proposal-rejected"],
            "guard": "expected-revision-current+work-owner-authorized+request-idempotent",
            "failure_continuation": "return typed conflict or denial",
        },
    },
    {
        "node_id": "dispatch-browser-effect",
        "kind": "Operation",
        "body": {
            "description": "Dispatch one supervised browser action inside a verified current scoped effect envelope.",
            "reads": ["workspace", "effect-envelope", "credential-handle", "authenticated-principal"],
            "writes": ["effect-ledger", "evidence-ledger"],
            "effects": ["browser-effect-recorded"],
            "guard": "work-owner-authorized+request-idempotent+effect-envelope-current",
            "failure_continuation": "record failed or uncertain outcome; never retry implicitly",
        },
    },
    {
        "node_id": "reconcile-uncertain-effect",
        "kind": "Operation",
        "body": {
            "description": "Resolve an uncertain external effect through owner-visible evidence without implicit replay.",
            "reads": ["effect-ledger", "browser-evidence", "authenticated-principal"],
            "writes": ["effect-ledger", "event-ledger"],
            "effects": ["effect-reconciled"],
            "guard": "work-owner-authorized+request-idempotent",
            "failure_continuation": "preserve uncertainty and block dependent work",
        },
    },
]


def event(node_id, description, payload):
    return {
        "node_id": node_id,
        "kind": "Event",
        "body": {
            "description": description,
            "event_type": node_id,
            "version": "1",
            "occurrence_id": {"field_id": "occurrence-id", "type_ref": primitive("uuid"), "required": True},
            "occurred_at_policy": "required",
            "payload": [
                {"field_id": field, "type_ref": primitive(kind), "required": True}
                for field, kind in payload
            ],
        },
    }


nodes.extend(
    [
        event("proposal-recorded", "A provenance-complete non-mutating proposal was durably recorded.", [("workspace-id", "uuid"), ("proposal-id", "uuid"), ("event-cursor", "integer")]),
        event("proposal-accepted", "The Work Owner accepted one proposal and advanced accepted revision.", [("workspace-id", "uuid"), ("proposal-id", "uuid"), ("revision-id", "integer")]),
        event("proposal-rejected", "The Work Owner rejected one proposal without changing accepted prose.", [("workspace-id", "uuid"), ("proposal-id", "uuid"), ("revision-id", "integer")]),
        event("browser-effect-recorded", "A supervised browser effect produced a certain, failed, cancelled, or uncertain receipt.", [("workspace-id", "uuid"), ("effect-id", "uuid"), ("outcome", "string")]),
        event("effect-reconciled", "An uncertain effect received an explicit owner-qualified reconciliation.", [("effect-id", "uuid"), ("outcome", "string")]),
    ]
)

edges = []


def edge(edge_id, relationship, source, target):
    edges.append(
        {
            "schema_version": "domainspec.edge/v1",
            "edge_id": edge_id,
            "feature_id": FEATURE,
            "relationship": relationship,
            "source_node_id": source,
            "target_node_id": target,
            "scope": "feature",
        }
    )


operations = {
    "record-proposal": "proposal-recorded",
    "accept-proposal": "proposal-accepted",
    "reject-proposal": "proposal-rejected",
    "dispatch-browser-effect": "browser-effect-recorded",
    "reconcile-uncertain-effect": "effect-reconciled",
}
guards = {
    "record-proposal": ["request-idempotent", "context-sufficient"],
    "accept-proposal": ["expected-revision-current", "work-owner-authorized", "request-idempotent", "authenticated-principal"],
    "reject-proposal": ["expected-revision-current", "work-owner-authorized", "request-idempotent", "authenticated-principal"],
    "dispatch-browser-effect": ["work-owner-authorized", "request-idempotent", "authenticated-principal", "effect-envelope-current"],
    "reconcile-uncertain-effect": ["work-owner-authorized", "request-idempotent", "authenticated-principal"],
}
for operation, produced_event in operations.items():
    edge(f"workspace-performs-{operation}", "performs", "workspace", operation)
    edge(f"{operation}-reads-workspace", "reads", operation, "workspace")
    edge(f"{operation}-produces-{produced_event}", "produces", operation, produced_event)
    edge(f"workspace-emits-{produced_event}", "emits", "workspace", produced_event)
    for rule in guards[operation]:
        edge(f"{rule}-enforces-{operation}", "enforces", rule, operation)
edge("workspace-owns-workspace-snapshot", "owns", "workspace", "workspace-snapshot")

write(
    SRC / "project.json",
    {
        "schema_version": "domainspec.project/v1",
        "project_id": "essays-agent-runtime",
        "features": [FEATURE],
        "cross_feature_edges": [],
    },
)
write(
    SRC / f"specs/{FEATURE}/feature.json",
    {
        "schema_version": "domainspec.feature/v1",
        "feature_id": FEATURE,
        "nodes": sorted(node["node_id"] for node in nodes),
        "edges": sorted(item["edge_id"] for item in edges),
    },
)
for node in nodes:
    write(
        SRC / f"specs/{FEATURE}/nodes/{node['node_id']}.json",
        {
            "schema_version": "domainspec.node/v1",
            "node_id": node["node_id"],
            "feature_id": FEATURE,
            "kind": node["kind"],
            "body": node["body"],
        },
    )
for item in edges:
    write(SRC / f"specs/{FEATURE}/edges/{item['edge_id']}.json", item)

print(f"authored {len(nodes)} nodes and {len(edges)} edges")
