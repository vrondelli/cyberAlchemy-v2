#!/usr/bin/env python3
"""Deterministically materialize and validate the Essays Product Ontology."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent.parent
REPO = PACKAGE.parents[3]

SOURCE_SPECS = [
    ("SRC-ESSAYS-PRODUCT-THESIS", "cyberAlchemy-v2/essays/PRODUCT-THESIS.md", "6b2e8a91e754343a39e43836fdf772e2d53a98ab2935a3135ee2f1dc49f6dc21"),
    ("SRC-ESSAYS-PROJECT", "cyberAlchemy-v2/goals/projects/essays/project.json", "8019b4c83b8c769cf5d4583df833f7c42a44dfdfaa93e22a5e941d86fc77531f"),
    ("SRC-ESSAYS-GOAL", "cyberAlchemy-v2/goals/projects/essays/goals/essays-first-runtime.goal.json", "d31380ed1ed73d15bff8c4f84a797065c688314a00e308c50f7f108451ec8742"),
    ("SRC-ESSAYS-PRODUCT-VIEW", "cyberAlchemy-v2/essays/product-ontology.json", "47716c722293e2b69e8c1376941b9d0a434715033f95ce13a4f8fe98f6ed595f"),
    ("SRC-ESSAYS-NODE-REGISTRY", "cyberAlchemy-v2/essays/nodes.json", "661c0c61a6ea7a3bdd516ad824cbb1433dc44e840cb5b52a7f7c083cb1ca2bcc"),
    ("SRC-ESSAYS-RELATION-REGISTRY", "cyberAlchemy-v2/essays/relations.json", "c5c0dc9028523f063112e0dffc5c0c3e22dbba84f8eb9b8c161b7154951cd810"),
    ("SRC-ESSAYS-THESIS-DECISION", "cyberAlchemy-v2/goals/projects/essays/decisions/essays-product-thesis/selection.json", "12b2592c7fb986f6a173ad68f4b81890a7112ef689143180dd934416caab930e")
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encoded(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def build() -> dict[str, bytes]:
    errors = []
    sources = []
    for source_id, relative, expected in SOURCE_SPECS:
        path = REPO / relative
        actual = sha(path) if path.is_file() else None
        if actual != expected:
            errors.append(f"{source_id}: expected {expected}, got {actual}")
        sources.append({"source_id":source_id,"path":relative,"sha256":expected,"owner_route":"source owner","posture":"exact-selected-source"})
    if errors:
        raise SystemExit("\n".join(errors))
    view = json.loads((REPO / "cyberAlchemy-v2/essays/product-ontology.json").read_text())
    node_rows = json.loads((REPO / "cyberAlchemy-v2/essays/nodes.json").read_text())["nodes"]
    relation_rows = json.loads((REPO / "cyberAlchemy-v2/essays/relations.json").read_text())["relations"]
    node_ids = set(view["node_refs"])
    relation_ids = set(view["relation_refs"])
    nodes = [row for row in node_rows if row["id"] in node_ids]
    relations = [row for row in relation_rows if row["id"] in relation_ids]
    if {row["id"] for row in nodes} != node_ids or {row["id"] for row in relations} != relation_ids:
        raise SystemExit("selected node or relation closure failed")
    if any(row.get("source") not in node_ids or row.get("target") not in node_ids for row in relations):
        raise SystemExit("relation endpoint closure failed")
    views = [{"view_id":name,"branch":"business","node_ids":sorted(node_ids),"relation_ids":sorted(relation_ids),"claim_limit":view["claim_ceiling"]} for name in ["product-identity","first-user-journey","artifact-lifecycle","review-and-revision","value-and-evidence"]]
    residue = {"residue":[
        {"residue_id":"RES-ESSAYS-PRODUCT-001","kind":"product-evidence-gap","status":"open","statement":"No direct product evidence yet proves reduced reconstruction burden, improved writer control, or preference for the focused environment.","owner_route":"Essays product-evidence owner","next_gate":"Run bounded product experiments only after a realization candidate exists.","authority_effect":"none"},
        {"residue_id":"RES-ESSAYS-PRODUCT-002","kind":"owner-review","status":"open","statement":"This newly materialized ontology package has no exact package-level owner decision.","owner_route":"Essays Project owner plus CyberAlchemy v2 product owner","next_gate":"Review and decide the exact package material digest without changing its bytes.","authority_effect":"none"}
    ]}
    return {
        "SOURCES.json": encoded({"schema_version":"cav2.essays.product.business-domain.sources/v1","digest_algorithm":"sha256-file-bytes/v1","sources":sources,"authority_effect":"none"}),
        "NODES.json": encoded({"schema_version":"cav2.essays.product.business-domain.nodes/v1","nodes":nodes,"authority_effect":"none"}),
        "RELATIONS.json": encoded({"schema_version":"cav2.essays.product.business-domain.relations/v1","relations":relations,"authority_effect":"none"}),
        "VIEWS.json": encoded({"schema_version":"cav2.essays.product.business-domain.views/v1","views":views,"authority_effect":"none"}),
        "RESIDUE.json": encoded({"schema_version":"cav2.essays.product.business-domain.residue/v1",**residue,"authority_effect":"none"})
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("select exactly one of --write or --check")
    outputs = build()
    if args.write:
        for relative, data in outputs.items():
            (PACKAGE / relative).write_bytes(data)
    errors = [relative for relative, data in outputs.items() if not (PACKAGE / relative).is_file() or (PACKAGE / relative).read_bytes() != data]
    material = hashlib.sha256()
    for relative in sorted(["PROFILE.json","TYPE-SELECTION.json","MATERIALIZATION-DECISION.json","SCHEMA-BINDINGS.json","README.md","schemas/product-ontology.schema.json",*outputs]):
        material.update(relative.encode()); material.update(b"\0"); material.update((PACKAGE / relative).read_bytes()); material.update(b"\0")
    result = {"schema_version":"cav2.essays.product.business-domain.validation/v1","ontology_id":"cav2.essays.product.business-domain.v1","overall":"BLOCK" if errors else "PASS","material_digest":material.hexdigest(),"counts":{"sources":len(SOURCE_SPECS),"nodes":len(json.loads(outputs["NODES.json"])["nodes"]),"relations":len(json.loads(outputs["RELATIONS.json"])["relations"]),"views":5,"residue":2},"errors":errors,"owner_review":"pending","claim_ceiling":"Structurally closed private candidate only; no product value, ontology admission, implementation, publication, release, deployment, or external effect.","authority_effect":"none"}
    print(json.dumps(result, indent=2, sort_keys=True))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
