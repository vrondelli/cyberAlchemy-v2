#!/usr/bin/env python3
"""Deterministically check the hosted bridge candidate without granting authority."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[6]
ONTOLOGY_ID = "CA2-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE"
CAPABILITY_ID = "CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE"
CAPABILITY_SHA256 = "600713ae7f95ed3c999cb6b97f492fc36e49dcf5e1c63496a711d7221e6c1de9"
CAPABILITY_CANDIDATE_SHA256 = "065c991bb167e5e8d57633a53d8e3866c65c2484c107ad0bed1b9f1bea2f06b8"
DEFINITION_SHA256 = "2ccf51e0dfd6d4456d0cbef9eb9969a46f1455d5ead726721960fbdd24a7638a"
DEFINITION_ACCEPTANCE_SHA256 = "e44fa53b2b87c035ac6f52a5fc6fd6dfbacda5f756a36a9db994b8ddfda1d25e"
CAPABILITY_ADOPTION_SHA256 = "cd3e3f41e95aac623bbaf29ef96af78c67e82db788c8af16db75a932756f82f7"
ONTOLOGY_ADMISSION_SHA256 = "409015aefa426abd0ceeb7438fa96b434a7e15e7d58c3feeb8209012ca2d6706"
ADMISSION_PATH = ROOT.parent / "decisions/ontology-admission-001.json"
MATERIAL_FILES = (
    "README.md",
    "nodes.json",
    "profile.json",
    "relations.json",
    "residue.json",
    "rules.json",
    "schema.json",
    "sources.json",
)
CONSTRUCTION_STATE = {
    "canonical_definitions": "accepted",
    "product_capability": "adopted",
    "business_ontology": "authored-candidate-awaiting-owner-admission",
    "domainspec_v2_source": "not_evaluable-predecessor-ontology-not-admitted",
    "compiled_graph_and_system_ontology": "not_evaluable-predecessor-domainspec-not-admitted",
    "implementation_binding": "not_evaluable-predecessor-system-ontology-not-admitted",
    "conformance_evidence": "not_evaluable-predecessor-implementation-binding-not-accepted",
    "vps_deployment": "not_authorized",
}


def load(name: str) -> dict:
    value = json.loads((ROOT / name).read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{name} must contain one object")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def material_digest() -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update((ROOT / relative).read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate() -> tuple[list[str], dict[str, int], str, str, str | None]:
    errors: list[str] = []
    profile = load("profile.json")
    sources = load("sources.json")
    nodes = load("nodes.json").get("nodes", [])
    relations = load("relations.json").get("relations", [])
    rules = load("rules.json").get("rules", [])
    residue = load("residue.json").get("items", [])
    receipts = load("receipts/index.json")
    candidate = load("candidate.json")

    if profile.get("ontology_id") != ONTOLOGY_ID:
        errors.append("ontology identity drift")
    if profile.get("ontology_type") != "business-system-bridge":
        errors.append("ontology type must remain business-system-bridge")
    if profile.get("branches") != ["business", "system"] or profile.get("bridge") != "business-system":
        errors.append("business-system branch closure drift")
    if profile.get("lifecycle_status") != "authored-candidate":
        errors.append("ontology may not self-admit")
    if profile.get("construction_state") != CONSTRUCTION_STATE:
        errors.append("D65 construction state does not stop at ontology admission")
    if any(profile.get(key) != "none" for key in ("authority_effect", "enforcement_effect", "external_effect")):
        errors.append("ontology exceeds its effect ceiling")

    source_ids: set[str] = set()
    for record in sources.get("sources", []):
        source_id = record.get("source_id")
        if not isinstance(source_id, str) or source_id in source_ids:
            errors.append(f"duplicate or missing source id: {source_id}")
            continue
        source_ids.add(source_id)
        path = REPO / str(record.get("path", ""))
        if not path.is_file():
            errors.append(f"missing source: {source_id}")
        elif record.get("sha256") != sha(path):
            errors.append(f"source digest drift: {source_id}")
    required_sources = {
        "SRC-KEP-HOST-DEFINITIONS",
        "SRC-KEP-HOST-DEFINITION-ACCEPTANCE",
        "SRC-KEP-HOST-CAPABILITY",
        "SRC-KEP-HOST-CAPABILITY-ADOPTION",
    }
    if not required_sources.issubset(source_ids):
        errors.append("hosted predecessor source closure is incomplete")
    selection_ids: set[str] = set()
    for selection in sources.get("selectors", []):
        selection_id = selection.get("selection_id")
        if not isinstance(selection_id, str) or selection_id in selection_ids:
            errors.append(f"duplicate or missing selection id: {selection_id}")
        selection_ids.add(str(selection_id))
        if selection.get("source_id") not in source_ids:
            errors.append(f"selector source is not closed: {selection_id}")

    definition_decision = json.loads((ROOT.parent / "decisions/definition-set-acceptance-001.json").read_text())
    if definition_decision.get("acceptance", {}).get("lifecycle_status") != "accepted":
        errors.append("hosted definitions are not accepted")
    if definition_decision.get("subject", {}).get("definition_source_sha256") != DEFINITION_SHA256:
        errors.append("definition acceptance targets other source bytes")
    adoption_decision = json.loads((ROOT.parent / "decisions/product-capability-adoption-001.json").read_text())
    if adoption_decision.get("adoption", {}).get("lifecycle_status") != "adopted":
        errors.append("hosted Product Capability is not adopted")
    if adoption_decision.get("subject", {}).get("capability_id") != CAPABILITY_ID:
        errors.append("capability adoption targets another capability")
    if adoption_decision.get("subject", {}).get("sha256") != CAPABILITY_SHA256:
        errors.append("capability adoption targets other capability bytes")
    envelope = adoption_decision.get("predecessors", {}).get("candidate_envelope", {})
    if envelope.get("sha256") != CAPABILITY_CANDIDATE_SHA256:
        errors.append("capability adoption targets other candidate bytes")

    node_ids: set[str] = set()
    branches = {"business", "system"}
    for node in nodes:
        node_id = node.get("node_id")
        if not isinstance(node_id, str) or node_id in node_ids:
            errors.append(f"duplicate or missing node id: {node_id}")
        node_ids.add(str(node_id))
        if node.get("branch") not in branches:
            errors.append(f"invalid node branch: {node_id}")
        if not node.get("definition_refs"):
            errors.append(f"node lacks definition binding: {node_id}")

    relation_ids: set[str] = set()
    bridge_count = 0
    for relation in relations:
        relation_id = relation.get("relation_id")
        if not isinstance(relation_id, str) or relation_id in relation_ids:
            errors.append(f"duplicate or missing relation id: {relation_id}")
        relation_ids.add(str(relation_id))
        if relation.get("source") not in node_ids or relation.get("target") not in node_ids:
            errors.append(f"relation endpoint is not closed: {relation_id}")
        if relation.get("branch") == "bridge":
            bridge_count += 1
            source = next((n for n in nodes if n.get("node_id") == relation.get("source")), {})
            target = next((n for n in nodes if n.get("node_id") == relation.get("target")), {})
            if source.get("branch") == target.get("branch"):
                errors.append(f"bridge does not cross branches: {relation_id}")
            if len(relation.get("evidence_refs", [])) < 2:
                errors.append(f"bridge lacks two-sided evidence: {relation_id}")
    if bridge_count < 7:
        errors.append("bridge coverage is incomplete")

    rule_ids = [item.get("rule_id") for item in rules]
    if len(rule_ids) != len(set(rule_ids)) or len(rule_ids) < 10:
        errors.append("rule identity or coverage drift")
    if not all(item.get("definition_refs") for item in rules):
        errors.append("every rule must bind definitions")
    residue_status = {item.get("residue_id"): item.get("status") for item in residue}
    if residue_status.get("KEP-HOST-RES-DEFINITIONS") != "resolved":
        errors.append("definition acceptance residue is unresolved")
    if residue_status.get("KEP-HOST-RES-CAPABILITY") != "resolved":
        errors.append("capability adoption residue is unresolved")
    for residue_id in (
        "KEP-HOST-RES-ONTOLOGY",
        "KEP-HOST-RES-DOMAINSPEC",
        "KEP-HOST-RES-CONFORMANCE",
        "KEP-HOST-RES-VPS",
        "KEP-HOST-RES-ARCHIVE",
        "KEP-HOST-RES-BROWSER-DEPENDENCY",
    ):
        if residue_status.get(residue_id) != "open":
            errors.append(f"successor residue must remain open: {residue_id}")
    if receipts.get("authority_effect") != "none":
        errors.append("receipt registry exceeds authority ceiling")

    actual_material_digest = material_digest()
    if candidate.get("ontology_id") != ONTOLOGY_ID or candidate.get("ontology_type") != "business-system-bridge":
        errors.append("candidate identity or type drift")
    if candidate.get("construction_state") != CONSTRUCTION_STATE:
        errors.append("candidate construction state drift")
    if candidate.get("admission_status") != "not-requested":
        errors.append("candidate may not self-admit")
    if candidate.get("material_digest_algorithm") != "sha256-path-null-bytes-null/v1":
        errors.append("candidate material digest algorithm drift")
    if candidate.get("material_digest") != actual_material_digest:
        errors.append("candidate material digest mismatch")
    declared_artifacts = {item.get("path"): item.get("sha256") for item in candidate.get("artifacts", [])}
    if set(declared_artifacts) != set(MATERIAL_FILES):
        errors.append("candidate material artifact closure drift")
    for relative in MATERIAL_FILES:
        if declared_artifacts.get(relative) != sha(ROOT / relative):
            errors.append(f"candidate artifact digest mismatch: {relative}")
    predecessor = candidate.get("capability_predecessor", {})
    if predecessor.get("sha256") != CAPABILITY_SHA256 or predecessor.get("candidate_sha256") != CAPABILITY_CANDIDATE_SHA256:
        errors.append("candidate capability predecessor drift")
    if predecessor.get("adoption_decision_sha256") != CAPABILITY_ADOPTION_SHA256:
        errors.append("candidate adoption-decision predecessor drift")
    definition = candidate.get("definition_predecessor", {})
    if definition.get("sha256") != DEFINITION_SHA256 or definition.get("acceptance_decision_sha256") != DEFINITION_ACCEPTANCE_SHA256:
        errors.append("candidate definition predecessor drift")

    counts = {
        "sources": len(sources.get("sources", [])),
        "selectors": len(sources.get("selectors", [])),
        "nodes": len(nodes),
        "relations": len(relations),
        "rules": len(rules),
        "residue": len(residue),
        "resolved_residue": sum(item.get("status") == "resolved" for item in residue),
        "open_residue": sum(item.get("status") == "open" for item in residue),
    }
    if candidate.get("counts") != counts:
        errors.append("candidate counts drift")

    admission_status = "not-requested"
    admission_decision_sha256: str | None = None
    if ADMISSION_PATH.is_file():
        admission_decision_sha256 = sha(ADMISSION_PATH)
        if admission_decision_sha256 != ONTOLOGY_ADMISSION_SHA256:
            errors.append("ontology admission decision digest drift")
        admission_decision = json.loads(ADMISSION_PATH.read_text(encoding="utf-8"))
        subject = admission_decision.get("subject", {})
        admission = admission_decision.get("admission", {})
        if subject.get("ontology_id") != ONTOLOGY_ID:
            errors.append("ontology admission targets another ontology")
        if subject.get("candidate_sha256") != sha(ROOT / "candidate.json"):
            errors.append("ontology admission targets other candidate bytes")
        if subject.get("material_digest") != actual_material_digest:
            errors.append("ontology admission targets other material bytes")
        admitted_material = admission_decision.get("admitted_material", {})
        if admitted_material.get("artifacts") != candidate.get("artifacts"):
            errors.append("admitted material artifact closure drift")
        if admitted_material.get("counts") != counts:
            errors.append("admitted material counts drift")
        predecessors = admission_decision.get("predecessors", {})
        if predecessors.get("definition_acceptance", {}).get("sha256") != DEFINITION_ACCEPTANCE_SHA256:
            errors.append("ontology admission definition predecessor drift")
        if predecessors.get("product_capability", {}).get("sha256") != CAPABILITY_SHA256:
            errors.append("ontology admission capability predecessor drift")
        if predecessors.get("product_capability_adoption", {}).get("sha256") != CAPABILITY_ADOPTION_SHA256:
            errors.append("ontology admission capability-adoption predecessor drift")
        admission_status = admission.get("lifecycle_status", "invalid")
        if admission_status != "admitted":
            errors.append("ontology admission decision is not admitted")
        if admission.get("admitted_candidate_sha256") != sha(ROOT / "candidate.json"):
            errors.append("admission result candidate digest drift")
        if admission.get("admitted_material_digest") != actual_material_digest:
            errors.append("admission result material digest drift")
    return errors, counts, actual_material_digest, admission_status, admission_decision_sha256


if __name__ == "__main__":
    failures, counts, digest, admission_status, admission_decision_sha256 = validate()
    result = {
        "result": "PASS" if not failures else "BLOCK",
        "ontology_id": ONTOLOGY_ID,
        "ontology_type": "business-system-bridge",
        "material_digest": digest,
        "candidate_sha256": sha(ROOT / "candidate.json"),
        "counts": counts,
        "admission_status": admission_status,
        "admission_decision_sha256": admission_decision_sha256,
        "authority_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "errors": failures,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if failures else 0)
