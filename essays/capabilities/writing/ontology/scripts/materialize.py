#!/usr/bin/env python3
"""Deterministically materialize and validate the Essays writing capability ontology."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent.parent
REPO = PACKAGE.parents[4]

SOURCE_SPECS = [
    ("SRC-ESSAYS-ONTOLOGY-FAMILY", "cyberAlchemy-v2/goals/projects/essays/plans/agent-runtime-ontology-plan/ONTOLOGY-FAMILY.json", "9e2d39d01b65ef21385c3c13f67776ea6c6ad59643ccc72ed70baab449f1cc0c", ["cav2.essays.writing-capability.business-domain.v1", "intent-to-plan", "audience-export"]),
    ("SRC-ESSAYS-PRODUCT-ONTOLOGY-DECISION", "cyberAlchemy-v2/goals/projects/essays/decisions/essays-product-ontology/selection.json", "b9a63c98ff0f1afa2bd95e19e3f42b6d52ddffcccf27c5c3372221f2d14474cf", ["OPT-ESSAYS-PRODUCT-ONTOLOGY-ADOPT-EXACT-CURRENT", "b04b7c1e48295d200796d20731caa5f3e920d0e768dd0d9c0b4335a752807837"]),
    ("SRC-ESSAYS-CAPABILITY-VIEW", "cyberAlchemy-v2/essays/capability-ontology.json", "3fbc9314cb25e7afd1d141bd41c049021da08fe230bdf408390e010909f58085", ["CA2-CAP-DEVELOP-GOVERNED-ESSAY", "ESSAYS-REL-020"]),
    ("SRC-ESSAYS-NODE-REGISTRY", "cyberAlchemy-v2/essays/nodes.json", "661c0c61a6ea7a3bdd516ad824cbb1433dc44e840cb5b52a7f7c083cb1ca2bcc", ["ESSAYS-ARTIFACT-TEXT-INTENT", "ESSAYS-ARTIFACT-EXPORT"]),
    ("SRC-ESSAYS-RELATION-REGISTRY", "cyberAlchemy-v2/essays/relations.json", "c5c0dc9028523f063112e0dffc5c0c3e22dbba84f8eb9b8c161b7154951cd810", ["ESSAYS-REL-008", "ESSAYS-REL-020"]),
    ("SRC-ARCANUM-WHISPER", "arcanum/spells/whisper/README.md", "c0aa00200ce950cf4eecdc240056c5cd60cd64a50c2e114c44d2add171000d84", ["## Purpose", "## Artifact Lifecycle Contract", "## Review HTML Contract", "## Execution Phases"]),
    ("SRC-ESSAYS-PRODUCT-THESIS", "cyberAlchemy-v2/essays/PRODUCT-THESIS.md", "6b2e8a91e754343a39e43836fdf772e2d53a98ab2935a3135ee2f1dc49f6dc21", ["## First user journey", "## Claim ceiling"]),
]

NODE_IDS = {
    "CA2-PRODUCT-ESSAYS",
    "CA2-CAP-DEVELOP-GOVERNED-ESSAY",
    "CA2-REF-ARC-WHISPER",
    "ESSAYS-PARTICIPANT-WRITER",
    "ESSAYS-OUTCOME-REVIEWABLE-ESSAY",
    "ESSAYS-ARTIFACT-TEXT-INTENT",
    "ESSAYS-ARTIFACT-COMPOSITION-PLAN",
    "ESSAYS-ARTIFACT-DRAFT",
    "ESSAYS-ARTIFACT-REVIEW",
    "ESSAYS-ARTIFACT-REVISION-DECISION",
    "ESSAYS-ARTIFACT-VALIDATION",
    "ESSAYS-ARTIFACT-LEARNING-RESIDUE",
    "ESSAYS-ARTIFACT-EXPORT",
    "ESSAYS-UPSTREAM-WRITING-SUBSTRATE",
}

SOURCE_RELATION_IDS = {f"ESSAYS-REL-{number:03d}" for number in range(8, 21)}
LOCAL_RELATIONS = [
    {
        "id": "ESSAYS-WRITING-REL-001",
        "type": "resolved_by",
        "source": "ESSAYS-ARTIFACT-REVIEW",
        "target": "ESSAYS-ARTIFACT-REVISION-DECISION",
        "meaning": "Addressable review items receive an explicit author disposition: accepted, rejected, deferred, or requiring alternatives.",
        "source_refs": ["ESSAYS-SEL-WHISPER-LIFECYCLE"],
        "owner_route": "Essay author",
        "authority_effect": "none",
        "forbidden_collapse": "A recorded disposition is not a prose mutation, editorial approval, or permission to publish.",
    },
    {
        "id": "ESSAYS-WRITING-REL-002",
        "type": "qualifies_revision_of",
        "source": "ESSAYS-ARTIFACT-REVISION-DECISION",
        "target": "ESSAYS-ARTIFACT-DRAFT",
        "meaning": "The revision decision is bound to the exact reviewed draft and constrains a later revision proposal.",
        "source_refs": ["ESSAYS-SEL-WHISPER-LIFECYCLE"],
        "owner_route": "Essay author",
        "authority_effect": "none",
        "forbidden_collapse": "A revision decision does not itself create a new draft or authorize an agent to edit one.",
    },
]
RELATION_IDS = SOURCE_RELATION_IDS | {row["id"] for row in LOCAL_RELATIONS}

VIEW_SPECS = {
    "intent-to-plan": {
        "node_ids": ["ESSAYS-PARTICIPANT-WRITER", "CA2-CAP-DEVELOP-GOVERNED-ESSAY", "ESSAYS-ARTIFACT-TEXT-INTENT", "ESSAYS-ARTIFACT-COMPOSITION-PLAN"],
        "relation_ids": ["ESSAYS-REL-011", "ESSAYS-REL-012"],
    },
    "plan-to-draft": {
        "node_ids": ["CA2-CAP-DEVELOP-GOVERNED-ESSAY", "ESSAYS-ARTIFACT-COMPOSITION-PLAN", "ESSAYS-ARTIFACT-DRAFT"],
        "relation_ids": ["ESSAYS-REL-012", "ESSAYS-REL-013"],
    },
    "review-to-revision": {
        "node_ids": ["CA2-CAP-DEVELOP-GOVERNED-ESSAY", "ESSAYS-ARTIFACT-DRAFT", "ESSAYS-ARTIFACT-REVIEW", "ESSAYS-ARTIFACT-REVISION-DECISION", "ESSAYS-ARTIFACT-VALIDATION"],
        "relation_ids": ["ESSAYS-REL-014", "ESSAYS-REL-015", "ESSAYS-REL-016", "ESSAYS-WRITING-REL-001", "ESSAYS-WRITING-REL-002"],
    },
    "validation-and-residue": {
        "node_ids": ["CA2-CAP-DEVELOP-GOVERNED-ESSAY", "ESSAYS-ARTIFACT-DRAFT", "ESSAYS-ARTIFACT-VALIDATION", "ESSAYS-ARTIFACT-LEARNING-RESIDUE"],
        "relation_ids": ["ESSAYS-REL-016", "ESSAYS-REL-017"],
    },
    "audience-export": {
        "node_ids": ["CA2-CAP-DEVELOP-GOVERNED-ESSAY", "ESSAYS-ARTIFACT-DRAFT", "ESSAYS-ARTIFACT-EXPORT"],
        "relation_ids": ["ESSAYS-REL-013", "ESSAYS-REL-018", "ESSAYS-REL-019"],
    },
}

STATIC_FILES = [
    "PROFILE.json",
    "TYPE-SELECTION.json",
    "MATERIALIZATION-DECISION.json",
    "SCHEMA-BINDINGS.json",
    "README.md",
    "schemas/writing-capability-ontology.schema.json",
    "scripts/materialize.py",
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encoded(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def build() -> dict[str, bytes]:
    errors: list[str] = []
    sources = []
    for source_id, relative, expected, selectors in SOURCE_SPECS:
        path = REPO / relative
        actual = sha(path) if path.is_file() else None
        if actual != expected:
            errors.append(f"{source_id}: expected {expected}, got {actual}")
        text = path.read_text(encoding="utf-8") if path.is_file() else ""
        missing = [selector for selector in selectors if selector not in text]
        if missing:
            errors.append(f"{source_id}: missing selectors {missing}")
        sources.append({"source_id": source_id, "path": relative, "sha256": expected, "selectors": selectors, "owner_route": "source owner", "posture": "exact-selected-source"})
    if errors:
        raise SystemExit("\n".join(errors))

    node_rows = json.loads((REPO / "cyberAlchemy-v2/essays/nodes.json").read_text())["nodes"]
    relation_rows = json.loads((REPO / "cyberAlchemy-v2/essays/relations.json").read_text())["relations"]
    nodes = [row for row in node_rows if row["id"] in NODE_IDS]
    nodes.append({
        "id": "ESSAYS-ARTIFACT-REVISION-DECISION",
        "label": "Revision Decision",
        "role": "artifact",
        "branch": "capability",
        "meaning": "An author-owned disposition of addressable review items, bound to the reviewed draft and carrying the rationale that constrains a later revision proposal.",
        "source_refs": ["ESSAYS-SEL-WHISPER-LIFECYCLE"],
        "owner_route": "Essay author",
        "status": "candidate",
        "authority_effect": "none",
        "forbidden_collapse": "A revision decision is not revised prose, automated acceptance, editorial approval, or permission to publish.",
    })
    relations = [row for row in relation_rows if row["id"] in SOURCE_RELATION_IDS]
    relations.extend(LOCAL_RELATIONS)
    if {row["id"] for row in nodes} != NODE_IDS:
        raise SystemExit("selected node closure failed")
    if {row["id"] for row in relations} != RELATION_IDS:
        raise SystemExit("selected relation closure failed")
    if any(row["source"] not in NODE_IDS or row["target"] not in NODE_IDS for row in relations):
        raise SystemExit("relation endpoint closure failed")

    views = []
    for view_id, spec in VIEW_SPECS.items():
        views.append({
            "view_id": view_id,
            "branch": "business",
            "node_ids": spec["node_ids"],
            "relation_ids": spec["relation_ids"],
            "claim_limit": "Source-preserving capability view only; absent transitions remain residue and no runtime realization is implied.",
        })

    residue = [
        {
            "residue_id": "RES-ESSAYS-WRITING-001",
            "kind": "revision-decision-conformance-gap",
            "status": "open",
            "statement": "The candidate ontology now defines the revision-decision artifact and disposition relations, but no runtime evidence proves that a realization preserves their identity, rationale, and draft binding.",
            "subject_refs": ["ESSAYS-ARTIFACT-REVIEW", "ESSAYS-ARTIFACT-REVISION-DECISION", "ESSAYS-ARTIFACT-DRAFT"],
            "owner_route": "Essays Project owner plus independent conformance owner",
            "next_gate": "Bind an accepted realization to the exact revision-decision contract and produce independent conformance evidence before claiming lifecycle execution.",
            "authority_effect": "none",
        },
        {
            "residue_id": "RES-ESSAYS-WRITING-002",
            "kind": "partial-realization-gap",
            "status": "open",
            "statement": "Whisper remains a source-owned candidate partial realization; no binding or conformance decision proves it realizes the Essays writing capability.",
            "subject_refs": ["CA2-CAP-DEVELOP-GOVERNED-ESSAY", "CA2-REF-ARC-WHISPER"],
            "owner_route": "Essays Product Capability owner plus Arcanum Whisper spell owner",
            "next_gate": "Keep realization and conformance separate from capability meaning and later system construction.",
            "authority_effect": "none",
        },
        {
            "residue_id": "RES-ESSAYS-WRITING-003",
            "kind": "pre-merge-owner-approval",
            "status": "open",
            "statement": "No owner approval is attached because approval is required only after an exact merge candidate, changed-byte inventory, and validation envelope are frozen.",
            "subject_refs": ["CA2-CAP-DEVELOP-GOVERNED-ESSAY"],
            "owner_route": "Essays Project owner",
            "next_gate": "At pre-merge, freeze the complete merge candidate and obtain Essays Project owner approval bound to those exact bytes and their validation evidence.",
            "authority_effect": "none",
        },
    ]

    return {
        "SOURCES.json": encoded({"schema_version": "cav2.essays.writing-capability.business-domain.sources/v1", "digest_algorithm": "sha256-file-bytes/v1", "sources": sources, "authority_effect": "none"}),
        "NODES.json": encoded({"schema_version": "cav2.essays.writing-capability.business-domain.nodes/v1", "nodes": nodes, "authority_effect": "none"}),
        "RELATIONS.json": encoded({"schema_version": "cav2.essays.writing-capability.business-domain.relations/v1", "relations": relations, "authority_effect": "none"}),
        "VIEWS.json": encoded({"schema_version": "cav2.essays.writing-capability.business-domain.views/v1", "views": views, "authority_effect": "none"}),
        "RESIDUE.json": encoded({"schema_version": "cav2.essays.writing-capability.business-domain.residue/v1", "residue": residue, "authority_effect": "none"}),
    }


def result_for(outputs: dict[str, bytes]) -> dict[str, object]:
    errors = [relative for relative, data in outputs.items() if not (PACKAGE / relative).is_file() or (PACKAGE / relative).read_bytes() != data]
    material = hashlib.sha256()
    for relative in sorted([*STATIC_FILES, *outputs]):
        material.update(relative.encode())
        material.update(b"\0")
        material.update((PACKAGE / relative).read_bytes())
        material.update(b"\0")
    view_data = json.loads(outputs["VIEWS.json"])["views"]
    covered_nodes = {node for view in view_data for node in view["node_ids"]}
    covered_relations = {relation for view in view_data for relation in view["relation_ids"]}
    expected_view_relations = set().union(*(set(spec["relation_ids"]) for spec in VIEW_SPECS.values()))
    if covered_relations != expected_view_relations:
        errors.append("required view relation coverage")
    if not covered_nodes <= NODE_IDS:
        errors.append("required view node closure")
    return {
        "schema_version": "cav2.essays.writing-capability.business-domain.validation/v1",
        "ontology_id": "cav2.essays.writing-capability.business-domain.v1",
        "overall": "BLOCK" if errors else "PASS",
        "material_digest": material.hexdigest(),
        "counts": {"sources": len(SOURCE_SPECS), "nodes": len(NODE_IDS), "relations": len(RELATION_IDS), "views": len(VIEW_SPECS), "residue": 3},
        "errors": errors,
        "owner_review": "not-required-before-exact-pre-merge-candidate",
        "traceability_gap": None,
        "claim_ceiling": "Structurally closed private source-preserving candidate only; no complete Whisper realization, lifecycle completeness, ontology admission, implementation, publication, release, deployment, or external effect.",
        "authority_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    if sum([args.write, args.check, args.write_receipt]) != 1:
        parser.error("select exactly one of --write, --check, or --write-receipt")
    outputs = build()
    if args.write:
        for relative, data in outputs.items():
            (PACKAGE / relative).write_bytes(data)
    result = result_for(outputs)
    if args.write_receipt:
        if result["overall"] != "PASS":
            print(json.dumps(result, indent=2, sort_keys=True))
            return 1
        receipt = dict(result)
        receipt["validated_at"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        receipts = PACKAGE / "receipts"
        receipts.mkdir(exist_ok=True)
        path = receipts / f"validation-{str(result['material_digest'])[:16]}.json"
        if path.exists() and json.loads(path.read_text()).get("material_digest") != result["material_digest"]:
            raise SystemExit(f"refusing to overwrite mismatched receipt {path}")
        if not path.exists():
            path.write_bytes(encoded(receipt))
        result["receipt_path"] = str(path.relative_to(REPO))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 1 if result["overall"] == "BLOCK" else 0


if __name__ == "__main__":
    raise SystemExit(main())
