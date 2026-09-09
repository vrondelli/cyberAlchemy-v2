#!/usr/bin/env python3
"""Validate the accepted Solana definitions and authored capability candidate."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


EXPECTED_DEFINITION_DIGEST = "4bd06cf89baf081cbd404c1bad55378c47a14cdeb2029b0cf41d4ad49e133365"
EXPECTED_DEFINITION_MATERIAL_DIGEST = "513dfb04ba7dcc4859f6f4368d9bff473056ae45971a0931bb8295e33a09cde3"
EXPECTED_IDS = tuple(f"KEP-SOL-D{index}" for index in range(1, 11))
EXPECTED_USER_DECISION = (
    "Accept Solana definition set `4bd06cf89baf081cbd404c1bad55378c47a14cdeb2029b0cf41d4ad49e133365` "
    "and author the no-price Solana Product Capability."
)
EXPECTED_CONSTRUCTION_STATE = {
    "canonical_definitions": "accepted",
    "product_capability": "authored-candidate-awaiting-owner-adoption",
    "business_ontology": "not_evaluable",
    "domainspec_v2_source": "not_evaluable",
    "compiled_graph_and_system_ontology": "not_evaluable",
    "implementation_binding": "not_evaluable",
    "conformance_evidence": "not_evaluable",
    "runtime_evidence": "not_evaluable",
}
EXPECTED_EVIDENCE_REFS = {
    "CAP-SEL-KEP-SOL-DEFINITIONS",
    "CAP-SEL-KEP-SOL-DEFINITION-ACCEPTANCE",
    "CAP-SEL-KEP-SOL-BASE-CAPABILITY",
}


def configure(package_root: Path, product_root: Path | None = None) -> None:
    global PACKAGE_ROOT, PRODUCT_ROOT, REPOSITORY_ROOT, CAPABILITY_SCHEMA
    global DEFINITION_ROOT, DEFINITION_PATH, INDEX_PATH, DRIFT_PATH, DEFINITION_SET_PATH
    global DECISION_PATH, CAPABILITY_PATH, CANDIDATE_PATH, BASE_CAPABILITY_PATH, BASE_ADMISSION_PATH

    PACKAGE_ROOT = package_root.resolve()
    PRODUCT_ROOT = (product_root or PACKAGE_ROOT.parents[1]).resolve()
    REPOSITORY_ROOT = Path(__file__).resolve().parents[5]
    CAPABILITY_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
    DEFINITION_ROOT = PACKAGE_ROOT / "authority/definitions"
    DEFINITION_PATH = DEFINITION_ROOT / "DEFINITIONS.md"
    INDEX_PATH = DEFINITION_ROOT / "DEFINITIONS-INDEX.md"
    DRIFT_PATH = DEFINITION_ROOT / "DEFINITION-DRIFT-AUDIT.md"
    DEFINITION_SET_PATH = DEFINITION_ROOT / "definition-set.json"
    DECISION_PATH = PACKAGE_ROOT / "decisions/definition-set-acceptance-001.json"
    CAPABILITY_PATH = PRODUCT_ROOT / "realize-no-price-solana-coownership.product-capability.json"
    CANDIDATE_PATH = PACKAGE_ROOT / "product-capability-candidate.json"
    BASE_CAPABILITY_PATH = PRODUCT_ROOT / "grant-encrypted-knowledge-coownership.product-capability.json"
    BASE_ADMISSION_PATH = PRODUCT_ROOT / "decisions/ontology-admission.json"


configure(Path(__file__).resolve().parent)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} must contain one object")
        return {}
    return value


def validate_instance(instance: Any, schema: dict[str, Any], errors: list[str]) -> None:
    selected = dict(schema)
    selected.pop("$id", None)
    selected["$ref"] = "#/$defs/productCapability"
    try:
        Draft202012Validator.check_schema(selected)
    except SchemaError as exc:
        errors.append(f"Product Capability schema invalid: {exc.message}")
        return
    validator = Draft202012Validator(selected, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"Product Capability schema violation at {location}: {error.message}")


def validate_path_digest(record: Any, path: Path, expected_relative: str, label: str, errors: list[str]) -> None:
    if not isinstance(record, dict):
        errors.append(f"{label} must be an object")
        return
    if record.get("path") != expected_relative:
        errors.append(f"{label} path drift")
    if not path.is_file():
        errors.append(f"{label} is missing")
    elif record.get("sha256") != sha256(path):
        errors.append(f"{label} digest drift")


def material_digest(paths: list[tuple[str, Path]], errors: list[str]) -> str:
    digest = hashlib.sha256()
    for label, path in sorted(paths):
        if not path.is_file():
            errors.append(f"missing material file: {label}")
            continue
        digest.update(label.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate() -> dict[str, Any]:
    errors: list[str] = []
    decision = load(DECISION_PATH, errors)
    capability = load(CAPABILITY_PATH, errors)
    candidate = load(CANDIDATE_PATH, errors)
    definition_set = load(DEFINITION_SET_PATH, errors)
    capability_schema = load(CAPABILITY_SCHEMA, errors)

    if capability_schema:
        validate_instance(capability, capability_schema, errors)

    definition_text = DEFINITION_PATH.read_text(encoding="utf-8") if DEFINITION_PATH.is_file() else ""
    if not DEFINITION_PATH.is_file() or sha256(DEFINITION_PATH) != EXPECTED_DEFINITION_DIGEST:
        errors.append("accepted definition source digest drift")
    heading_ids = tuple(re.findall(r"^## (KEP-SOL-D\d+):", definition_text, flags=re.MULTILINE))
    if heading_ids != EXPECTED_IDS:
        errors.append("accepted definition ID closure drift")
    if tuple(definition_set.get("candidate_definition_source", {}).get("definition_ids", [])) != EXPECTED_IDS:
        errors.append("definition-set selected IDs drift")
    if definition_set.get("candidate_definition_source", {}).get("sha256") != EXPECTED_DEFINITION_DIGEST:
        errors.append("definition-set source digest drift")

    if decision.get("schema_version") != "cav2-kep-solana-definition-acceptance/v1":
        errors.append("definition acceptance schema identity drift")
    if decision.get("decision_id") != "CA2-DECISION-KEP-SOLANA-DEFINITION-ACCEPTANCE-001":
        errors.append("definition acceptance decision identity drift")
    if decision.get("route_id") != "CA2-ROUTE-IMPLEMENT":
        errors.append("definition acceptance route drift")
    if decision.get("source", {}).get("exact_user_decision") != EXPECTED_USER_DECISION:
        errors.append("definition acceptance does not preserve the exact owner decision")
    subject = decision.get("subject", {})
    if subject.get("definition_set_id") != "KEP-SOL-DEFINITION-SET-001":
        errors.append("accepted definition-set identity drift")
    if subject.get("definition_source_sha256") != EXPECTED_DEFINITION_DIGEST:
        errors.append("accepted decision definition digest drift")
    if tuple(subject.get("definition_ids", [])) != EXPECTED_IDS:
        errors.append("accepted decision definition selection drift")
    acceptance = decision.get("acceptance", {})
    if acceptance.get("lifecycle_status") != "accepted":
        errors.append("definition set is not owner-accepted")
    if acceptance.get("accepted_definition_source_sha256") != EXPECTED_DEFINITION_DIGEST:
        errors.append("acceptance postimage digest drift")
    if tuple(acceptance.get("accepted_definition_ids", [])) != EXPECTED_IDS:
        errors.append("acceptance postimage selection drift")
    preacceptance = decision.get("preacceptance", {})
    if preacceptance.get("runs") != 2 or preacceptance.get("outputs_identical") is not True:
        errors.append("definition preacceptance must bind two identical runs")
    if preacceptance.get("status") != "PASS" or preacceptance.get("material_digest") != EXPECTED_DEFINITION_MATERIAL_DIGEST:
        errors.append("definition preacceptance evidence drift")
    if preacceptance.get("authority_effect") != "none":
        errors.append("definition preacceptance must remain non-authoritative")
    successor = decision.get("successor_authorization", {})
    if successor.get("product_capability_authorship") != "authorized-candidate-only":
        errors.append("Product Capability authorship authorization drift")
    for forbidden in ("product_capability_adoption", "business_ontology", "domainspec_v2", "implementation"):
        if successor.get(forbidden) != "not-authorized":
            errors.append(f"definition decision over-authorizes {forbidden}")
    if decision.get("enforcement_effect") != "none" or decision.get("external_effect") != "none":
        errors.append("definition acceptance must remain non-enforcing and non-external")

    supporting = decision.get("supporting_material", {})
    validate_path_digest(
        supporting.get("definition_index"),
        INDEX_PATH,
        "capabilities/solana-coownership/authority/definitions/DEFINITIONS-INDEX.md",
        "definition index",
        errors,
    )
    validate_path_digest(
        supporting.get("definition_drift_audit"),
        DRIFT_PATH,
        "capabilities/solana-coownership/authority/definitions/DEFINITION-DRIFT-AUDIT.md",
        "definition drift audit",
        errors,
    )
    validate_path_digest(
        supporting.get("definition_set_envelope"),
        DEFINITION_SET_PATH,
        "capabilities/solana-coownership/authority/definitions/definition-set.json",
        "definition-set envelope",
        errors,
    )

    if capability.get("capability_id") != "CA2-CAP-REALIZE-NO-PRICE-SOLANA-COOWNERSHIP":
        errors.append("Product Capability identity drift")
    if capability.get("product_ref") != "CA2-PRODUCT-KNOWLEDGE-EXCHANGE-PROTOCOL":
        errors.append("Product Capability product binding drift")
    if capability.get("business_ontology_ref") != "CA2-ONTOLOGY-KEP-SOLANA-COOWNERSHIP":
        errors.append("future business ontology identity drift")
    lifecycle = capability.get("lifecycle_posture", {})
    if lifecycle.get("status", {}).get("value") != "authored-candidate":
        errors.append("Product Capability must remain an authored candidate")
    if lifecycle.get("commitment", {}).get("value") != "not-adopted":
        errors.append("Product Capability must remain not adopted")
    if lifecycle.get("evidence", {}).get("vocabulary_ref") != "capabilities/solana-coownership/decisions/definition-set-acceptance-001.json":
        errors.append("Product Capability acceptance evidence binding drift")
    if set(capability.get("evidence_refs", [])) != EXPECTED_EVIDENCE_REFS:
        errors.append("Product Capability evidence selection drift")
    if "owner set is {A}" not in capability.get("outcome", "") or "owner set {A, B}" not in capability.get("outcome", ""):
        errors.append("Product Capability does not preserve A-to-A-and-B outcome")
    required_exclusions = {
        "knowledge price, escrow, seller payout, royalty, treasury consideration, or token transfer",
        "hiding network transaction fees, account rent, or refundable rent reserves",
        "placing plaintext, a content-encryption key, recipient private keys, or the encrypted artifact on chain",
    }
    if not required_exclusions <= set(capability.get("exclusions", [])):
        errors.append("Product Capability no-price or secret-custody exclusions drift")
    if capability.get("authority_effect") != "none":
        errors.append("Product Capability candidate claims authority")

    if candidate.get("schema_version") != "cav2-kep-solana-product-capability-candidate/v1":
        errors.append("candidate envelope schema identity drift")
    if candidate.get("candidate_id") != "CA2-CANDIDATE-KEP-SOLANA-NO-PRICE-CAPABILITY-001":
        errors.append("candidate envelope identity drift")
    validate_path_digest(
        candidate.get("capability"),
        CAPABILITY_PATH,
        "realize-no-price-solana-coownership.product-capability.json",
        "candidate Product Capability",
        errors,
    )
    predecessors = candidate.get("predecessors", {})
    canonical = predecessors.get("canonical_definitions", {})
    if canonical.get("sha256") != EXPECTED_DEFINITION_DIGEST or tuple(canonical.get("selected_ids", [])) != EXPECTED_IDS:
        errors.append("candidate canonical-definition predecessor drift")
    if canonical.get("lifecycle_status") != "accepted":
        errors.append("candidate definitions predecessor is not accepted")
    validate_path_digest(
        predecessors.get("definition_acceptance"),
        DECISION_PATH,
        "capabilities/solana-coownership/decisions/definition-set-acceptance-001.json",
        "definition acceptance predecessor",
        errors,
    )
    validate_path_digest(
        predecessors.get("base_product_capability"),
        BASE_CAPABILITY_PATH,
        "grant-encrypted-knowledge-coownership.product-capability.json",
        "base Product Capability predecessor",
        errors,
    )
    validate_path_digest(
        predecessors.get("base_business_ontology_admission"),
        BASE_ADMISSION_PATH,
        "decisions/ontology-admission.json",
        "base business-ontology admission predecessor",
        errors,
    )
    if tuple(candidate.get("required_definition_bindings", [])) != EXPECTED_IDS:
        errors.append("candidate required definition-binding closure drift")
    if candidate.get("construction_state") != EXPECTED_CONSTRUCTION_STATE:
        errors.append("D65 construction state must stop at the authored Product Capability candidate")
    if candidate.get("adoption_status") != "not-requested":
        errors.append("Product Capability adoption was not authorized")
    if candidate.get("successor_authorization") != "none":
        errors.append("Product Capability candidate authorizes a successor")
    if candidate.get("enforcement_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("Product Capability candidate exceeds its effect ceiling")

    digest = material_digest(
        [
            ("README.md", PACKAGE_ROOT / "README.md"),
            ("definition source", DEFINITION_PATH),
            ("definition index", INDEX_PATH),
            ("definition drift audit", DRIFT_PATH),
            ("definition-set envelope", DEFINITION_SET_PATH),
            ("definition acceptance", DECISION_PATH),
            ("Product Capability", CAPABILITY_PATH),
            ("candidate envelope", CANDIDATE_PATH),
        ],
        errors,
    )
    return {
        "schema_version": "cav2-kep-solana-capability-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "definition_set_id": "KEP-SOL-DEFINITION-SET-001",
        "definition_source_digest": EXPECTED_DEFINITION_DIGEST,
        "definition_status": "accepted",
        "definition_count": len(EXPECTED_IDS),
        "capability_id": "CA2-CAP-REALIZE-NO-PRICE-SOLANA-COOWNERSHIP",
        "capability_status": "authored-candidate",
        "material_digest": digest,
        "d65_last_evaluable_stage": "authored no-price Solana Product Capability candidate",
        "authority_effect": "exact Solana definition acceptance only",
        "claim_ceiling": "Accepted definitions and authored Product Capability candidate only; no capability adoption, ontology or DomainSpec admission, implementation, Solana execution, payment, publication, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
