#!/usr/bin/env python3
"""Deterministic check-only validator for the Language Runtime System Ontology."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


SCRIPT = Path(__file__).resolve()
REPO = SCRIPT.parents[5]
DEFAULT_PACKAGE = SCRIPT.parents[1]
MATERIAL_FILES = [
    "README.md",
    "nodes.json",
    "product-bridge.json",
    "profile.json",
    "relations.json",
    "residue.json",
    "reuse-map.json",
    "schemas/language-runtime-system-ontology.schema.json",
    "scripts/validate.py",
    "sources.json",
    "tests/test_negative_mutations.py",
    "views/core.json",
    "views/product-bridge.json",
]
SCHEMA_BINDINGS = {
    "profile.json": "profile",
    "sources.json": "sourceRegistry",
    "nodes.json": "nodeRegistry",
    "relations.json": "relationRegistry",
    "product-bridge.json": "productBridge",
    "reuse-map.json": "reuseMap",
    "residue.json": "residueRegistry",
    "views/core.json": "view",
    "views/product-bridge.json": "view",
}


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def material_digest(package: Path) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = package / relative
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


class Checks:
    def __init__(self) -> None:
        self.items: list[dict[str, str]] = []

    def pass_(self, check_id: str, detail: str) -> None:
        self.items.append({"check_id": check_id, "outcome": "PASS", "detail": detail})

    def block(self, check_id: str, detail: str) -> None:
        self.items.append({"check_id": check_id, "outcome": "BLOCK", "detail": detail})

    def require(self, condition: bool, check_id: str, detail: str, failure: str | None = None) -> None:
        if condition:
            self.pass_(check_id, detail)
        else:
            self.block(check_id, failure or detail)


def unique(values: list[str]) -> bool:
    return len(values) == len(set(values))


def resolve_source_path(raw: str) -> Path:
    path = Path(raw)
    return path if path.is_absolute() else REPO / path


def validate(package: Path, require_receipt: bool) -> tuple[dict[str, object], int]:
    checks = Checks()
    missing = [relative for relative in MATERIAL_FILES if not (package / relative).is_file()]
    checks.require(not missing, "closed-material-inventory", f"{len(MATERIAL_FILES)} declared material files", f"missing material files: {missing}")
    if missing:
        result = {
            "schema_version": "cav2.language-runtime.system-ontology.validation/v1",
            "ontology_id": "cav2.language-runtime.system.v1",
            "material_digest": "0" * 64,
            "overall": "BLOCK",
            "summary": {"sources": 0, "nodes": 0, "relations": 0, "bridge_mappings": 0, "reuse_candidates": 0, "residue": 0, "views": 0, "checks": len(checks.items), "passed": 0, "blocked": 1},
            "checks": checks.items,
            "claim_ceiling": "Validation failed before the package could be evaluated.",
            "authority_effect": "none",
        }
        return result, 1

    loaded = {relative: load_json(package / relative) for relative in SCHEMA_BINDINGS}
    schema = load_json(package / "schemas/language-runtime-system-ontology.schema.json")
    schema_meta_errors = sorted(Draft202012Validator.check_schema(schema) or [])
    checks.require(not schema_meta_errors, "owned-schema-valid", "owned JSON Schema is valid")

    for relative, definition in SCHEMA_BINDINGS.items():
        wrapper = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$defs": schema["$defs"],
            "$ref": f"#/$defs/{definition}",
        }
        errors = sorted(Draft202012Validator(wrapper).iter_errors(loaded[relative]), key=lambda e: list(e.absolute_path))
        detail = f"{relative} matches #/$defs/{definition}"
        failure = f"{relative}: " + "; ".join(error.message for error in errors[:5])
        checks.require(not errors, f"schema:{relative}", detail, failure)

    profile = loaded["profile.json"]
    sources = loaded["sources.json"]["sources"]
    nodes = loaded["nodes.json"]["nodes"]
    relations = loaded["relations.json"]["relations"]
    bridge = loaded["product-bridge.json"]
    reuse = loaded["reuse-map.json"]
    residue = loaded["residue.json"]["residue"]
    views = [loaded["views/core.json"], loaded["views/product-bridge.json"]]

    source_ids = [item["source_id"] for item in sources]
    checks.require(unique(source_ids), "source-id-uniqueness", f"{len(source_ids)} unique source identities")
    source_set = set(source_ids)
    for source in sources:
        path = resolve_source_path(source["path"])
        current = path.is_file() and sha256(path) == source["sha256"]
        checks.require(current, f"source-currency:{source['source_id']}", source["path"], f"missing or digest drift: {source['path']}")

    node_ids = [node["id"] for node in nodes]
    relation_ids = [relation["id"] for relation in relations]
    bridge_ids = [mapping["id"] for mapping in bridge["mappings"]]
    residue_ids = [entry["id"] for entry in residue]
    checks.require(unique(node_ids), "node-id-uniqueness", f"{len(node_ids)} unique system node identities")
    checks.require(unique(relation_ids), "relation-id-uniqueness", f"{len(relation_ids)} unique DS-D8 edge identities")
    checks.require(unique(bridge_ids), "bridge-id-uniqueness", f"{len(bridge_ids)} unique product bridge identities")
    checks.require(unique(residue_ids), "residue-id-uniqueness", f"{len(residue_ids)} unique residue identities")

    all_source_refs: list[str] = []
    for node in nodes:
        all_source_refs.extend(node["source_refs"])
    for relation in relations:
        all_source_refs.extend(relation["source_refs"])
    for mapping in bridge["mappings"]:
        all_source_refs.extend(mapping["source_refs"])
    for entry in residue:
        all_source_refs.extend(entry["source_refs"])
    checks.require(set(all_source_refs) <= source_set, "source-reference-closure", f"all {len(all_source_refs)} evidence references resolve", f"unknown source refs: {sorted(set(all_source_refs) - source_set)}")

    formation = load_json(REPO / "projects/domainspec-v2/definitions/minted-project/formation-projection.v1.json")
    formation_by_kind = {entry["kind"]: entry for entry in formation["kinds"]}
    node_by_id = {node["id"]: node for node in nodes}
    body_errors: list[str] = []
    for node in nodes:
        formation_entry = formation_by_kind.get(node["kind"])
        if not formation_entry:
            body_errors.append(f"{node['id']}: unsupported kind {node['kind']}")
            continue
        errors = list(Draft202012Validator(formation_entry["body_schema"]).iter_errors(node["body"]))
        body_errors.extend(f"{node['id']}: {error.message}" for error in errors)
    checks.require(not body_errors, "domainspec-formation-bodies", f"all {len(nodes)} nodes match exact candidate formation bodies", "; ".join(body_errors[:8]))

    relationship_registry = load_json(REPO / "projects/domainspec-v2/definitions/relationships/relationships.yml")
    signatures = {entry["id"]: entry for entry in relationship_registry["signatures"] if entry["status"] == "active"}
    edge_errors: list[str] = []
    for relation in relations:
        source = node_by_id.get(relation["from"])
        target = node_by_id.get(relation["to"])
        signature = signatures.get(relation["type"])
        if source is None or target is None:
            edge_errors.append(f"{relation['id']}: endpoint does not resolve")
            continue
        if signature is None:
            edge_errors.append(f"{relation['id']}: relation type is not active")
            continue
        source_types = set(signature.get("source_types", [signature.get("source_type")]))
        target_types = set(signature.get("target_types", [signature.get("target_type")]))
        if source["kind"] not in source_types or target["kind"] not in target_types:
            edge_errors.append(f"{relation['id']}: {source['kind']} --{relation['type']}--> {target['kind']} violates DS-D8")
        if relation["scope"] not in signature["feature_scope"]:
            edge_errors.append(f"{relation['id']}: scope {relation['scope']} is not admitted")
    checks.require(not edge_errors, "domainspec-ds-d8-signatures", f"all {len(relations)} edges match active DS-D8 endpoint and scope signatures", "; ".join(edge_errors[:8]))

    create_edges = [relation for relation in relations if relation["type"] == "creates"]
    create_sources = [relation["from"] for relation in create_edges]
    create_targets = [relation["to"] for relation in create_edges]
    checks.require(unique(create_sources) and unique(create_targets), "creates-one-to-one", f"{len(create_edges)} creates edges preserve one-to-one authorship")

    product_nodes = load_json(REPO / "cyberAlchemy-v2/language/runtime/ontology/nodes.json")["nodes"]
    product_node_ids = {node["id"] for node in product_nodes}
    product_definitions = load_json(REPO / "cyberAlchemy-v2/language/runtime/ontology/definitions.json")["definitions"]
    product_definition_subjects = {definition["subject_ref"] for definition in product_definitions}
    bridge_product_refs = {mapping["product_ref"] for mapping in bridge["mappings"]}
    bridge_system_refs = {ref for mapping in bridge["mappings"] for ref in mapping["system_refs"]}
    bridge_errors: list[str] = []
    for mapping in bridge["mappings"]:
        if mapping["product_ref"] not in product_node_ids:
            bridge_errors.append(f"{mapping['id']}: unknown product ref {mapping['product_ref']}")
        for ref in mapping["system_refs"]:
            if ref not in node_by_id:
                bridge_errors.append(f"{mapping['id']}: unknown system ref {ref}")
    checks.require(not bridge_errors, "product-bridge-endpoint-closure", f"all {len(bridge['mappings'])} product mappings resolve both sides", "; ".join(bridge_errors[:8]))
    checks.require(product_definition_subjects <= bridge_product_refs, "defined-subject-bridge-coverage", f"all {len(product_definition_subjects)} candidate definition subjects have explicit system mappings", f"unmapped defined subjects: {sorted(product_definition_subjects - bridge_product_refs)}")
    forbidden_bridge_types = {"realized_by", "implemented_by", "conforms_to", "equivalent_to"}
    actual_bridge_types = {mapping["type"] for mapping in bridge["mappings"]}
    checks.require(not (actual_bridge_types & forbidden_bridge_types), "non-inflating-product-bridge", "bridge uses candidate formalization/support verbs only")

    prior_nodes = load_json(REPO / "cyberAlchemy-v2/define/system-ontology/NODES.json")["nodes"]
    prior_node_ids = {node["node_id"] for node in prior_nodes}
    reuse_errors: list[str] = []
    reuse_local = set()
    for item in reuse["reuse_candidates"]:
        reuse_local.add(item["local_ref"])
        if item["local_ref"] not in node_by_id:
            reuse_errors.append(f"unknown local reuse ref {item['local_ref']}")
        if item["prior_ref"] not in prior_node_ids:
            reuse_errors.append(f"unknown prior reuse ref {item['prior_ref']}")
    new_refs = set(reuse["new_without_prior_exact_node"])
    if not new_refs <= set(node_ids):
        reuse_errors.append(f"unknown new refs: {sorted(new_refs - set(node_ids))}")
    if reuse_local & new_refs:
        reuse_errors.append(f"refs listed as both reuse and new: {sorted(reuse_local & new_refs)}")
    checks.require(not reuse_errors, "prior-system-reuse-closure", f"{len(reuse['reuse_candidates'])} reuse candidates and {len(new_refs)} new nodes remain non-equivalent", "; ".join(reuse_errors[:8]))

    core = views[0]
    product_view = views[1]
    checks.require(set(core["system_node_refs"]) == set(node_ids) and set(core["relation_refs"]) == set(relation_ids) and not core["bridge_mapping_refs"], "core-view-exact-coverage", "core view covers every system node and DS-D8 edge exactly")
    checks.require(set(product_view["system_node_refs"]) == bridge_system_refs and set(product_view["bridge_mapping_refs"]) == set(bridge_ids) and not product_view["relation_refs"], "product-bridge-view-exact-coverage", "product bridge view covers every mapped system node and mapping exactly", f"system missing={sorted(bridge_system_refs-set(product_view['system_node_refs']))}; extra={sorted(set(product_view['system_node_refs'])-bridge_system_refs)}")

    known_residue_subjects = set(node_ids) | product_node_ids | {profile["ontology_id"], bridge["product_ontology_ref"], bridge["system_ontology_ref"], reuse["prior_ontology_ref"]}
    unresolved_residue_refs = sorted({ref for entry in residue for ref in entry["subject_refs"] if ref not in known_residue_subjects})
    checks.require(not unresolved_residue_refs, "residue-subject-closure", f"all {len(residue)} residue records bind known product, system, or ontology subjects", f"unknown residue subjects: {unresolved_residue_refs}")

    command_node = node_by_id["language-session-kernel.LanguageSessionCommand"]
    command_identity = [field for field in command_node["body"]["fields"] if field["name"] == "command_id" and field["identity"] is True]
    checks.require(command_node["kind"] == "Entity" and len(command_identity) == 1, "identity-bearing-command", "Language Session Command has one designated command identity for exact retries")
    command_kind = node_by_id["language-session-kernel.LanguageCommandKind"]["body"]["values"]
    checks.require(command_kind == ["answer", "defer", "withdraw", "challenge", "review", "resume"], "candidate-command-kind-closure", "candidate command kinds preserve the exact six defined meanings")
    review_fields = {field["name"] for field in node_by_id["language-session-kernel.CandidateReviewBinding"]["body"]["fields"]}
    checks.require({"session_id", "revision", "state_digest", "preview_digest", "reviewer_ref"} == review_fields, "exact-review-binding", "review binding closes over session, revision, state, preview, and reviewer")
    interface_kinds = {node["body"]["interface_kind"] for node in nodes if node["kind"] == "Interface"}
    checks.require(interface_kinds == {"internal"}, "transport-not-selected", "both DomainSpec interfaces remain internal; CLI, chat, IPC, and network transports are unselected")
    fake_component = [node["id"] for node in nodes if node["kind"] in {"Component", "View Model", "Adapter"}]
    checks.require(not fake_component, "active-backend-types-only", "no candidate UI meta-type or invented Component is used in the system graph")

    checks.require(
        profile["owner_route"] == "CyberAlchemy v2 Language Project owner"
        and profile["system_design_owner"] == "unresolved; candidate route is CyberAlchemy v2 Language Runtime owner",
        "package-and-system-owner-separation",
        "the package owner is exact while system design and implementation ownership remains explicitly unresolved",
        "package ownership is unresolved or has been collapsed into unselected system ownership",
    )
    privacy_residue = [entry for entry in residue if entry["kind"] == "context-retention-and-privacy"]
    privacy_text = " ".join(
        f"{entry['statement']} {entry['next_action']}" for entry in privacy_residue
    ).lower()
    privacy_terms = {"retention", "redaction", "deletion", "provenance", "explicit", "inferred"}
    checks.require(
        len(privacy_residue) == 1
        and "product.residue" in privacy_residue[0]["source_refs"]
        and all(term in privacy_text for term in privacy_terms),
        "context-retention-privacy-residue",
        "system residue preserves retention, redaction, deletion, provenance, and explicit-versus-inferred context boundaries",
        "product context-retention and privacy residue is missing or incomplete",
    )

    authority_ok = profile["authority_effect"] == "none" and bridge["authority_effect"] == "none" and reuse["authority_effect"] == "none" and all(node["authority_effect"] == "none" for node in nodes) and all(relation["authority_effect"] == "none" for relation in relations) and all(entry["authority_effect"] == "none" for entry in residue)
    checks.require(authority_ok, "authority-ceiling", "all package records preserve authority effect none")
    checks.require(profile["implementation_state"] == "not-implemented" and profile["domainspec_binding"]["compiler_conformance"] == "not_evaluable" and profile["domainspec_binding"]["release_admission"] == "not-granted", "non-inflating-lifecycle-state", "candidate, not implemented, compiler not evaluable, release not granted")

    digest = material_digest(package)
    blocked = sum(1 for item in checks.items if item["outcome"] == "BLOCK")
    passed = len(checks.items) - blocked
    result: dict[str, object] = {
        "schema_version": "cav2.language-runtime.system-ontology.validation/v1",
        "ontology_id": profile["ontology_id"],
        "material_digest": digest,
        "overall": "PASS" if blocked == 0 else "BLOCK",
        "summary": {
            "sources": len(sources), "nodes": len(nodes), "relations": len(relations),
            "bridge_mappings": len(bridge["mappings"]), "reuse_candidates": len(reuse["reuse_candidates"]),
            "residue": len(residue), "views": len(views), "checks": len(checks.items),
            "passed": passed, "blocked": blocked,
        },
        "checks": checks.items,
        "claim_ceiling": "Private structurally typed candidate model and traceability projection only; no canonical definition, accepted Runtime Contract, DomainSpec compiler or runtime conformance, implementation, working persistence, restart evidence, CLI/chat synchronization, accepted Definition Pack, experiment result, execution, publication, release, deployment, or external effect.",
        "authority_effect": "none",
    }

    receipt_schema = {"$schema": "https://json-schema.org/draft/2020-12/schema", "$defs": schema["$defs"], "$ref": "#/$defs/receipt"}
    receipt_shape_errors = list(Draft202012Validator(receipt_schema).iter_errors(result))
    if receipt_shape_errors:
        result["overall"] = "BLOCK"
        result["checks"].append({"check_id": "result-schema", "outcome": "BLOCK", "detail": "; ".join(error.message for error in receipt_shape_errors[:5])})
        result["summary"]["checks"] += 1
        result["summary"]["blocked"] += 1

    if require_receipt:
        receipts = sorted((package / "receipts").glob("validation-*.json")) if (package / "receipts").is_dir() else []
        if not receipts:
            result["overall"] = "BLOCK"
            result["checks"].append({"check_id": "receipt-currency", "outcome": "BLOCK", "detail": "no append-only validation receipt exists"})
            result["summary"]["checks"] += 1
            result["summary"]["blocked"] += 1
        else:
            candidates = [load_json(path) for path in receipts]
            valid_candidates = [candidate for candidate in candidates if not list(Draft202012Validator(receipt_schema).iter_errors(candidate))]
            if result not in valid_candidates:
                result["overall"] = "BLOCK"
                result["checks"].append({"check_id": "receipt-currency", "outcome": "BLOCK", "detail": "no valid append-only receipt equals the current deterministic result"})
                result["summary"]["checks"] += 1
                result["summary"]["blocked"] += 1

    return result, 0 if result["overall"] == "PASS" else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", type=Path, default=DEFAULT_PACKAGE)
    parser.add_argument("--require-receipt", action="store_true")
    args = parser.parse_args()
    result, exit_code = validate(args.package.resolve(), args.require_receipt)
    print(json.dumps(result, indent=2, sort_keys=True, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
