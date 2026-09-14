#!/usr/bin/env python3
"""Validate the Craft-owned ORODI Product Capability candidate package."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


PACKAGE_ROOT = Path(__file__).resolve().parents[1]


def find_workspace_layout(start: Path) -> tuple[Path, Path, Path]:
    """Return display root, CyberAlchemy root, and DomainSpec umbrella root.

    ORODI supports both its historical ``domainspec-core/cyberAlchemy-v2``
    placement and the extracted sibling checkouts used by current workspaces.
    Source registry paths keep their historical ``cyberAlchemy-v2/`` and
    ``projects/`` prefixes; ``repo_path`` resolves them without changing bytes.
    """
    cav2_root = next(
        (
            candidate
            for candidate in (start, *start.parents)
            if candidate.name == "cyberAlchemy-v2"
            and (candidate / "product").is_dir()
            and (candidate / "goals").is_dir()
        ),
        None,
    )
    if cav2_root is None:
        raise RuntimeError("CyberAlchemy repository root not found")

    historical_root = cav2_root.parent
    if (historical_root / "projects").is_dir():
        domain_root = historical_root
    else:
        sibling_root = historical_root / "domainspec-core"
        if not (sibling_root / "projects").is_dir():
            raise RuntimeError("DomainSpec projects root not found")
        domain_root = sibling_root

    display_root = Path(os.path.commonpath((str(cav2_root), str(domain_root))))
    return display_root, cav2_root, domain_root


REPO_ROOT, CAV2_ROOT, DOMAIN_ROOT = find_workspace_layout(PACKAGE_ROOT)


def repo_path(ref: str) -> Path:
    if ref == "cyberAlchemy-v2":
        return CAV2_ROOT
    if ref.startswith("cyberAlchemy-v2/"):
        return CAV2_ROOT / ref.removeprefix("cyberAlchemy-v2/")
    return DOMAIN_ROOT / ref


ONTOLOGY_ROOT = repo_path(
    "projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/ontology"
)
SHARED_CAPABILITY_SCHEMA = repo_path("cyberAlchemy-v2/capability/schemas/capability.schema.json")
GOAL_SCHEMA = repo_path("cyberAlchemy-v2/goals/schemas/goal-package.schema.json")
EXPECTED_CAPABILITIES = {
    "CA2-CAP-ORODI-EVALUATE-OFFLINE-EVIDENCE",
    "CA2-CAP-ORODI-PROJECT-DENIED-RUNTIME-EVIDENCE",
    "CA2-CAP-ORODI-EVALUATE-CANARY",
    "CA2-CAP-ORODI-VERIFY-ROLLBACK",
    "CA2-CAP-ORODI-MATERIALIZE-RUN-READY-LAB",
    "CA2-CAP-ORODI-COMMISSION-LOCAL-LAB",
}
EXPECTED_PENDING_DECISION_OWNERS = {
    "business-ontology-admission": "CA2-OWNER-CRAFT-ORODI-BUSINESS-ONTOLOGY",
    "domainspec-profile-admission": "CA2-OWNER-DOMAINSPEC-LANGUAGE-PROFILE",
}
EXPECTED_RESOLVED_DECISION_OWNER = "CA2-OWNER-CRAFT-PRODUCT"


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path.relative_to(REPO_ROOT)}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path.relative_to(REPO_ROOT)} must contain one JSON object")
        return {}
    return value


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def digest_file(path: Path) -> str:
    return digest_bytes(path.read_bytes())


def canonical_record_digest(record: dict[str, Any]) -> str:
    value = json.dumps(
        record, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return digest_bytes(value)


def unique(values: list[str], label: str, errors: list[str]) -> None:
    duplicates = sorted({value for value in values if values.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def validate_definition(
    instance: Any,
    schema: dict[str, Any],
    definition: str,
    label: str,
    errors: list[str],
) -> None:
    wrapper = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": schema.get("$defs", {}),
        "$ref": f"#/$defs/{definition}",
    }
    try:
        Draft202012Validator.check_schema(wrapper)
    except SchemaError as exc:
        errors.append(f"{label} schema is invalid: {exc.message}")
        return
    validator = Draft202012Validator(wrapper, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def markdown_heading(path: Path, heading: str) -> bytes:
    lines = path.read_bytes().splitlines(keepends=True)
    marker = heading.encode("utf-8")
    starts = [index for index, line in enumerate(lines) if line.rstrip(b"\r\n") == marker]
    if len(starts) != 1:
        raise ValueError(f"heading {heading!r} must match exactly once, found {len(starts)}")
    start = starts[0]
    end = next(
        (index for index in range(start + 1, len(lines)) if lines[index].startswith(b"## ")),
        len(lines),
    )
    return b"".join(lines[start:end])


def check_exact_ref(ref: Any, label: str, errors: list[str]) -> None:
    if not isinstance(ref, dict) or set(ref) != {"ref", "digest"}:
        errors.append(f"{label}: invalid exact-ref shape")
        return
    path = repo_path(str(ref["ref"]))
    if not path.is_file():
        errors.append(f"{label}: missing {ref['ref']}")
        return
    actual = digest_file(path)
    if actual != ref["digest"]:
        errors.append(f"{label}: digest drift {ref['digest']} != {actual}")


def package_digest() -> str:
    inputs = sorted(
        path
        for path in PACKAGE_ROOT.rglob("*")
        if path.is_file()
        and "receipts" not in path.parts
        and "__pycache__" not in path.parts
        and path.suffix != ".pyc"
    )
    digest = hashlib.sha256()
    for path in inputs:
        digest.update(str(path.relative_to(PACKAGE_ROOT)).encode("utf-8"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(digest_file(path)))
        digest.update(b"\0")
    return digest.hexdigest()


def validate(write_receipt: bool) -> tuple[list[str], dict[str, Any]]:
    errors: list[str] = []
    checks: list[dict[str, Any]] = []
    schema = load(PACKAGE_ROOT / "schemas/orodi-capability-package.schema.json", errors)
    profile = load(PACKAGE_ROOT / "profile.json", errors)
    sources_doc = load(PACKAGE_ROOT / "sources.json", errors)
    capabilities_doc = load(PACKAGE_ROOT / "product-capabilities.json", errors)
    immutable_doc = load(PACKAGE_ROOT / "immutable-records.json", errors)
    support = load(PACKAGE_ROOT / "support.json", errors)
    owners_doc = load(PACKAGE_ROOT / "admission-owners.json", errors)
    decisions_doc = load(PACKAGE_ROOT / "admission-decisions.json", errors)

    for instance, definition, label in (
        (profile, "profile", "profile"),
        (sources_doc, "sourceRegistry", "source registry"),
        (immutable_doc, "immutableRegistry", "immutable registry"),
        (owners_doc, "admissionOwners", "admission owners"),
        (decisions_doc, "admissionDecisions", "admission decisions"),
    ):
        validate_definition(instance, schema, definition, label, errors)
    checks.append({"check": "package-local-schema", "documents": 5})

    shared_schema = load(SHARED_CAPABILITY_SCHEMA, errors)
    localized = copy.deepcopy(shared_schema)
    try:
        localized["$defs"]["productCapability"]["properties"]["schema_ref"]["const"] = (
            "../../../../capability/schemas/capability.schema.json#/$defs/productCapability"
        )
    except (KeyError, TypeError):
        errors.append("shared capability schema is missing its schema_ref contract")
    records = capabilities_doc.get("records", [])
    for index, record in enumerate(records):
        validate_definition(record, localized, "productCapability", f"Product Capability[{index}]", errors)
    capability_ids = [str(record.get("capability_id", "")) for record in records if isinstance(record, dict)]
    unique(capability_ids, "Product Capability IDs", errors)
    if set(capability_ids) != EXPECTED_CAPABILITIES or len(capability_ids) != 6:
        errors.append("Product Capability registry must contain exactly the six declared ORODI identities")
    if capabilities_doc.get("product_ref") != "CA2-PRODUCT-CRAFT":
        errors.append("Product Capability registry is not owned by CA2-PRODUCT-CRAFT")
    if capabilities_doc.get("project_ref") != "CA2-PROJECT-CRAFT":
        errors.append("Product Capability registry is not coordinated by CA2-PROJECT-CRAFT")
    checks.append({"check": "shared-product-capability-schema", "records": len(records)})

    registry_ref = immutable_doc.get("registry_ref")
    check_exact_ref(registry_ref, "immutable registry_ref", errors)
    immutable_by_id = {
        str(item.get("capability_id")): item
        for item in immutable_doc.get("records", [])
        if isinstance(item, dict)
    }
    if set(immutable_by_id) != EXPECTED_CAPABILITIES:
        errors.append("immutable manifest capability coverage mismatch")
    for record in records:
        if not isinstance(record, dict):
            continue
        capability_id = str(record.get("capability_id", ""))
        expected = immutable_by_id.get(capability_id, {}).get("record_digest")
        actual = canonical_record_digest(record)
        if expected != actual:
            errors.append(f"{capability_id}: immutable record digest mismatch {expected} != {actual}")
    checks.append({"check": "canonical-immutable-record-digests", "records": len(immutable_by_id)})

    source_by_id: dict[str, dict[str, Any]] = {}
    for source in sources_doc.get("sources", []):
        if not isinstance(source, dict):
            continue
        source_id = str(source.get("source_id", ""))
        source_by_id[source_id] = source
        path = repo_path(str(source.get("path", "")))
        if not path.is_file():
            errors.append(f"{source_id}: source missing")
            continue
        actual = digest_file(path)
        if actual != source.get("sha256"):
            errors.append(f"{source_id}: whole-file digest drift {source.get('sha256')} != {actual}")
    unique(list(source_by_id), "source IDs", errors)

    selection_ids: list[str] = []
    for selection in sources_doc.get("selections", []):
        if not isinstance(selection, dict):
            continue
        selection_id = str(selection.get("selection_id", ""))
        selection_ids.append(selection_id)
        source = source_by_id.get(str(selection.get("source_id", "")))
        if source is None:
            errors.append(f"{selection_id}: unknown source")
            continue
        path = repo_path(str(source["path"]))
        try:
            selected = (
                path.read_bytes()
                if selection.get("selector_kind") == "whole-file"
                else markdown_heading(path, str(selection.get("selector", "")))
            )
        except (OSError, ValueError) as exc:
            errors.append(f"{selection_id}: cannot select bytes: {exc}")
            continue
        actual = digest_bytes(selected)
        if actual != selection.get("selection_sha256"):
            errors.append(f"{selection_id}: selection digest drift {selection.get('selection_sha256')} != {actual}")
    unique(selection_ids, "selection IDs", errors)
    selection_id_set = set(selection_ids)
    checks.append({"check": "exact-source-and-selection-digests", "sources": len(source_by_id), "selections": len(selection_ids)})

    actors = {str(item.get("actor_id")) for item in support.get("actors", []) if isinstance(item, dict)}
    contracts = {
        str(item.get("contract_id")): str(item.get("direction"))
        for item in support.get("contracts", [])
        if isinstance(item, dict)
    }
    policies = {str(item.get("policy_id")) for item in support.get("context_policies", []) if isinstance(item, dict)}
    bindings = {
        str(item.get("binding_id")): item
        for item in support.get("realization_bindings", [])
        if isinstance(item, dict)
    }
    obligations = {
        str(item.get("registry_id")): item
        for item in support.get("obligation_registries", [])
        if isinstance(item, dict)
    }
    residue_ids = {str(item.get("residue_id")) for item in support.get("residue", []) if isinstance(item, dict)}
    for record in records:
        capability_id = str(record.get("capability_id", ""))
        if set(record.get("participant_refs", [])) - actors:
            errors.append(f"{capability_id}: unknown participant refs")
        if set(record.get("consumer_refs", [])) - actors:
            errors.append(f"{capability_id}: unknown consumer refs")
        if any(contracts.get(ref) != "input" for ref in record.get("input_contract_refs", [])):
            errors.append(f"{capability_id}: invalid input contract refs")
        if any(contracts.get(ref) != "output" for ref in record.get("output_contract_refs", [])):
            errors.append(f"{capability_id}: invalid output contract refs")
        if set(record.get("context_policy_refs", [])) - policies:
            errors.append(f"{capability_id}: unknown context policy refs")
        if set(record.get("realization_binding_refs", [])) - set(bindings):
            errors.append(f"{capability_id}: unknown realization binding refs")
        obligation_ref = str(record.get("obligation_registry_ref", ""))
        if obligation_ref not in obligations or obligations[obligation_ref].get("capability_ref") != capability_id:
            errors.append(f"{capability_id}: invalid obligation registry")
        if set(record.get("evidence_refs", [])) - selection_id_set:
            errors.append(f"{capability_id}: unknown evidence refs")
        if set(record.get("lifecycle_posture", {}).get("residue_refs", [])) - residue_ids:
            errors.append(f"{capability_id}: unknown residue refs")
        for owner in record.get("owner_routes", []):
            if set(owner.get("source_refs", [])) - selection_id_set:
                errors.append(f"{capability_id}: owner route has unknown source refs")
    if {str(item.get("capability_ref")) for item in bindings.values()} != EXPECTED_CAPABILITIES:
        errors.append("realization binding capability coverage mismatch")
    if {str(item.get("capability_ref")) for item in obligations.values()} != EXPECTED_CAPABILITIES:
        errors.append("obligation registry capability coverage mismatch")
    checks.append({"check": "capability-support-closure", "actors": len(actors), "bindings": len(bindings), "obligations": len(obligations)})

    goal_schema = load(GOAL_SCHEMA, errors)
    project_path = repo_path("cyberAlchemy-v2/goals/projects/craft/project.json")
    goal_path = repo_path("cyberAlchemy-v2/goals/projects/craft/goals/craft-orodi-integration.goal.json")
    project = load(project_path, errors)
    goal = load(goal_path, errors)
    validate_definition(project, goal_schema, "project", "Craft Project", errors)
    validate_definition(goal, goal_schema, "goal", "ORODI Goal", errors)
    if project.get("project_id") != "CA2-PROJECT-CRAFT":
        errors.append("unexpected owning Project")
    if "CA2-GOAL-CRAFT-ORODI-INTEGRATION" not in project.get("goal_refs", []):
        errors.append("Craft Project does not reference the ORODI Goal")
    if goal.get("project_ref") != "CA2-PROJECT-CRAFT":
        errors.append("ORODI Goal does not resolve to the Craft Project")

    construction_doc = load(ONTOLOGY_ROOT / "construction-bindings.json", errors)
    construction_by_id = {
        str(item.get("construction_id")): item
        for item in construction_doc.get("records", [])
        if isinstance(item, dict)
    }
    expected_construction_ids = {str(item.get("construction_ref")) for item in bindings.values()}
    if set(construction_by_id) != expected_construction_ids:
        errors.append("D65 construction coverage does not match Product Capability realizations")
    if not expected_construction_ids.issubset(set(project.get("construction_binding_refs", []))):
        errors.append("Craft Project does not reference all six ORODI ConstructionBindings")
    for binding in bindings.values():
        construction = construction_by_id.get(str(binding.get("construction_ref")), {})
        if construction.get("project_ref") != "CA2-PROJECT-CRAFT":
            errors.append(f"{binding.get('binding_id')}: ConstructionBinding has wrong Project")
        if construction.get("subject_ref") != binding.get("ontology_capability_ref"):
            errors.append(f"{binding.get('binding_id')}: ontology capability bridge mismatch")
    checks.append({"check": "craft-project-goal-and-d65-closure", "construction_bindings": len(construction_by_id)})

    owner_ids = {str(item.get("owner_id")) for item in owners_doc.get("owners", []) if isinstance(item, dict)}
    required_decision_owners = set(EXPECTED_PENDING_DECISION_OWNERS.values()) | {
        EXPECTED_RESOLVED_DECISION_OWNER,
        "CA2-OWNER-DOMAINSPEC-ORODI-SYSTEM-ONTOLOGY",
    }
    if required_decision_owners - owner_ids:
        errors.append("admission owner registry is missing a required decision owner")
    project_binding = decisions_doc.get("project_binding", {})
    if project_binding.get("state") != "established" or project_binding.get("owner_ref") != "CA2-OWNER-CRAFT-PROJECT":
        errors.append("Project binding is not established by the Craft Project owner")
    check_exact_ref(project_binding.get("project_ref"), "Project binding project_ref", errors)
    check_exact_ref(project_binding.get("goal_ref"), "Project binding goal_ref", errors)
    decision_kinds: list[str] = []
    for decision in decisions_doc.get("pending_decisions", []):
        if not isinstance(decision, dict):
            continue
        kind = str(decision.get("decision_kind", ""))
        decision_kinds.append(kind)
        if decision.get("owner_ref") != EXPECTED_PENDING_DECISION_OWNERS.get(kind):
            errors.append(f"{kind}: wrong admission owner")
        if decision.get("decision_state") != "awaiting-owner-decision":
            errors.append(f"{kind}: decision must remain owner-pending")
        check_exact_ref(decision.get("candidate_ref"), f"{kind} candidate_ref", errors)
        if decision.get("authority_effect") != "none":
            errors.append(f"{kind}: authority effect must remain none")
    resolved_decisions = decisions_doc.get("resolved_decisions", [])
    resolved_by_kind = {
        str(item.get("decision_kind")): item
        for item in resolved_decisions
        if isinstance(item, dict)
    }
    resolved_decision = resolved_by_kind.get("product-capability-adoption", {})
    if not resolved_decision:
        errors.append("resolved decision set must contain the exact Product Capability adoption")
    if resolved_decision.get("decision_id") != "CA2-DECISION-CRAFT-ORODI-CAPABILITY-ADOPTION-001":
        errors.append("unexpected resolved Product Capability decision ID")
    if resolved_decision.get("successor_decision_id") != "ORODI-DECISION-PRODUCT-CAPABILITIES-002":
        errors.append("resolved Product Capability decision does not bind the successor gate")
    if resolved_decision.get("owner_ref") != EXPECTED_RESOLVED_DECISION_OWNER:
        errors.append("resolved Product Capability decision has the wrong owner")
    if resolved_decision.get("decision") != "adopt" or resolved_decision.get("selected_option") != "PC-ADOPT-PRESERVE":
        errors.append("resolved Product Capability decision does not preserve the selected option")
    if resolved_decision.get("decision_state") != "adopted":
        errors.append("resolved Product Capability decision is not adopted")
    if resolved_decision.get("identity_effect") != "preserve-all-six-product-capability-identities":
        errors.append("resolved Product Capability decision changes immutable identities")
    if resolved_decision.get("authority_effect") != "exact-product-capability-manifest-adoption-only":
        errors.append("resolved Product Capability authority effect is not bounded")
    check_exact_ref(resolved_decision.get("candidate_ref"), "resolved Product Capability candidate_ref", errors)
    check_exact_ref(resolved_decision.get("decision_record_ref"), "resolved Product Capability decision record", errors)
    check_exact_ref(resolved_decision.get("admissibility_request_ref"), "resolved decision admissibility request", errors)
    check_exact_ref(resolved_decision.get("admissibility_receipt_ref"), "resolved decision admissibility receipt", errors)

    decision_record_ref = resolved_decision.get("decision_record_ref", {})
    request_ref = resolved_decision.get("admissibility_request_ref", {})
    receipt_ref = resolved_decision.get("admissibility_receipt_ref", {})
    decision_record = load(repo_path(str(decision_record_ref.get("ref", ""))), errors)
    request_doc = load(repo_path(str(request_ref.get("ref", ""))), errors)
    receipt_doc = load(repo_path(str(receipt_ref.get("ref", ""))), errors)
    if decision_record.get("decision_id") != resolved_decision.get("successor_decision_id"):
        errors.append("immutable Product Capability decision ID mismatch")
    if decision_record.get("owner_ref") != resolved_decision.get("owner_ref"):
        errors.append("immutable Product Capability decision owner mismatch")
    if decision_record.get("decision_state") != "adopted" or decision_record.get("chosen_option") != resolved_decision.get("selected_option"):
        errors.append("immutable Product Capability decision outcome mismatch")
    decision_subject = decision_record.get("subject", {})
    candidate_ref = resolved_decision.get("candidate_ref", {})
    if decision_subject.get("ref") != candidate_ref.get("ref") or decision_subject.get("sha256") != candidate_ref.get("digest"):
        errors.append("immutable Product Capability decision subject mismatch")
    request_digest = canonical_record_digest(request_doc)
    if receipt_doc.get("requestDigest") != request_digest:
        errors.append("admissibility receipt request digest mismatch")
    if decision_record.get("admissibility", {}).get("canonical_request_digest") != request_digest:
        errors.append("immutable Product Capability decision request digest mismatch")
    if resolved_decision.get("selected_option") not in receipt_doc.get("admissibleOptionIds", []):
        errors.append("selected Product Capability option was not admissible")
    request_options = {
        str(item.get("optionId")): item
        for item in request_doc.get("candidates", [])
        if isinstance(item, dict)
    }
    selected = request_options.get(str(resolved_decision.get("selected_option")), {})
    if selected.get("ownerGate") != EXPECTED_RESOLVED_DECISION_OWNER:
        errors.append("selected Product Capability option has the wrong owner gate")
    if selected.get("structuralStatus") != "admissible":
        errors.append("selected Product Capability option was structurally inadmissible")

    expected_admissions = {
        "business-ontology-admission": ("CA2-OWNER-CRAFT-ORODI-BUSINESS-ONTOLOGY", "admitted"),
        "domainspec-profile-and-source-admission": ("CA2-OWNER-DOMAINSPEC-LANGUAGE-PROFILE", "admitted"),
        "system-ontology-admission": ("CA2-OWNER-DOMAINSPEC-ORODI-SYSTEM-ONTOLOGY", "admitted"),
    }
    if resolved_by_kind.keys() >= ({"product-capability-adoption"} | set(expected_admissions)):
        if decision_kinds:
            errors.append("pending decisions remain after successor admissions")
        for kind, (owner, state) in expected_admissions.items():
            decision = resolved_by_kind.get(kind, {})
            if decision.get("owner_ref") != owner or decision.get("decision_state") != state or decision.get("decision") != "admit":
                errors.append(f"{kind}: invalid resolved admission")
            check_exact_ref(decision.get("candidate_ref"), f"{kind} candidate_ref", errors)
            check_exact_ref(decision.get("decision_record_ref"), f"{kind} decision_record_ref", errors)
    elif set(decision_kinds) != set(EXPECTED_PENDING_DECISION_OWNERS) or len(decision_kinds) != 2:
        errors.append("pending decision set mismatch")

    successor_admitted = "business-ontology-admission" in resolved_by_kind
    business_candidate = load(ONTOLOGY_ROOT / ("admission/business-ontology-successor.json" if successor_admitted else "admission/business-ontology-candidate.json"), errors)
    profile_candidate = load(ONTOLOGY_ROOT / ("admission/domainspec-profile-successor.json" if successor_admitted else "admission/domainspec-profile-candidate.json"), errors)
    check_exact_ref(
        business_candidate.get("product_capability_manifest_ref"),
        "business ontology Product Capability predecessor",
        errors,
    )
    for index, ref in enumerate(business_candidate.get("candidate_refs", [])):
        check_exact_ref(ref, f"business ontology candidate[{index}]", errors)
    check_exact_ref(
        profile_candidate.get("business_ontology_ref") if successor_admitted else profile_candidate.get("business_ontology_candidate_ref"),
        "DomainSpec profile business-ontology predecessor",
        errors,
    )
    for field in (
        "profile_ref", "domainspec_project_ref", "domainspec_feature_ref", "compiled_graph_ref",
        "system_ontology_ref", "determinism_receipt_ref",
    ):
        check_exact_ref(profile_candidate.get(field), f"DomainSpec profile candidate {field}", errors)
    if business_candidate.get("admission_owner_ref") != "CA2-OWNER-CRAFT-ORODI-BUSINESS-ONTOLOGY":
        errors.append("business ontology candidate has wrong admission owner")
    if profile_candidate.get("admission_owner_ref") != "CA2-OWNER-DOMAINSPEC-LANGUAGE-PROFILE":
        errors.append("DomainSpec profile candidate has wrong admission owner")
    if not successor_admitted and profile_candidate.get("release_admission") != "not-granted":
        errors.append("DomainSpec profile candidate must not grant release admission")
    checks.append({
        "check": "digest-bound-owner-gates",
        "resolved_decisions": len(resolved_decisions),
        "pending_decisions": len(decision_kinds),
    })

    declared_files = (
        "README.md", "profile.json", "sources.json", "product-capabilities.json",
        "immutable-records.json", "support.json", "admission-owners.json",
        "admission-decisions.json", "schemas/orodi-capability-package.schema.json",
        "scripts/validate.py",
    )
    for relative in declared_files:
        if not (PACKAGE_ROOT / relative).is_file():
            errors.append(f"missing package file: {relative}")

    for document_name, document in (
        ("profile", profile), ("sources", sources_doc), ("capabilities", capabilities_doc),
        ("immutable records", immutable_doc), ("support", support), ("owners", owners_doc),
    ):
        if document.get("authority_effect") != "none":
            errors.append(f"{document_name}: authority_effect must be none")
    expected_business_effect = "business-ontology-admission" if successor_admitted else "none"
    expected_profile_effect = "domainspec-profile-and-source-admission" if successor_admitted else "none"
    if business_candidate.get("authority_effect") != expected_business_effect:
        errors.append("business ontology authority effect does not match its admission epoch")
    if profile_candidate.get("authority_effect") != expected_profile_effect:
        errors.append("DomainSpec profile authority effect does not match its admission epoch")

    digest = package_digest()
    receipt = {
        "schema_version": "cav2-craft-orodi-capability-validation-receipt/v1",
        "package_id": profile.get("package_id"),
        "status": "pass" if not errors else "fail",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "package_digest": digest,
        "counts": {
            "product_capabilities": len(records),
            "immutable_records": len(immutable_by_id),
            "admission_owners": len(owner_ids),
            "resolved_owner_decisions": len(resolved_decisions),
            "pending_owner_decisions": len(decision_kinds),
            "construction_bindings": len(construction_by_id),
        },
        "checks": checks,
        "errors": errors,
        "authority_effect": "validates-recorded-owner-decisions-only",
        "claim_ceiling": "Validation confirms the exact Product Capability adoption and any recorded business ontology, DomainSpec profile/source, and system ontology admissions. It does not establish implementation conformance, runtime truth, commissioning, publication, release, deployment, or external effect.",
    }
    if write_receipt:
        output = PACKAGE_ROOT / "receipts" / f"validation-{digest[:16]}.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists():
            prior = load(output, errors)
            if prior.get("package_digest") != digest or prior.get("status") != receipt["status"]:
                errors.append(f"existing append-only receipt conflicts: {output.relative_to(REPO_ROOT)}")
        else:
            output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        receipt["receipt_path"] = str(output.relative_to(REPO_ROOT))
    return errors, receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    errors, receipt = validate(args.write_receipt)
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
