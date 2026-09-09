#!/usr/bin/env python3
"""Validate the candidate Solana co-ownership definition set without effects."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any


DEFINITION_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[7]
MANIFEST_PATH = DEFINITION_ROOT / "definition-set.json"
DEFINITIONS_PATH = DEFINITION_ROOT / "DEFINITIONS.md"
INDEX_PATH = DEFINITION_ROOT / "DEFINITIONS-INDEX.md"
DRIFT_PATH = DEFINITION_ROOT / "DEFINITION-DRIFT-AUDIT.md"

EXPECTED_SET_ID = "KEP-SOL-DEFINITION-SET-001"
EXPECTED_IDS = tuple(f"KEP-SOL-D{index}" for index in range(1, 11))
EXPECTED_BASE_IDS = tuple(f"KEP-D{index}" for index in range(1, 13))
EXPECTED_BASE_DEFINITION_DIGEST = "e67deba09ec6df02a4a8542fbf8fbbcb68d27ca87839c5fffe2c1db708df7701"
EXPECTED_BASE_ADMISSION_DIGEST = "4840f01a0b6b1d55e27f788e687ce0fd8c0e26abc147843773e0f22909927269"
EXPECTED_RUST_ADMISSION_DIGEST = "331513e285a7ca8aef80ea36e0b2934d432b63ce969c132c2df5ff66bf995b5d"
EXPECTED_CONSTRUCTION_STATE = {
    "canonical_definitions": "candidate-awaiting-owner-acceptance",
    "product_capability": "not_evaluable",
    "business_ontology": "not_evaluable",
    "domainspec_v2_source": "not_evaluable",
    "compiled_graph_and_system_ontology": "not_evaluable",
    "implementation_binding": "not_evaluable",
    "conformance_evidence": "not_evaluable",
    "runtime_evidence": "not_evaluable",
}
REQUIRED_VOICES = (
    "### Normative Definition",
    "### Formal Model",
    "### Operational Interpretation",
    "### Plain-Language Intuition",
    "### Domain-Context Voice",
    "### Boundary",
    "### Primary Consumers",
)
REQUIRED_DISTINCTIONS = {
    "KEP-SOL-D1": "the public key is not the Knowledge Identity",
    "KEP-SOL-D2": "rather than assuming one indefinitely growing account",
    "KEP-SOL-D3": "O' = O union {recipient}",
    "KEP-SOL-D4": "without placing the plaintext content key",
    "KEP-SOL-D5": "is not a Co-Ownership Grant merely because it was submitted",
    "KEP-SOL-D6": "Failure(S)",
    "KEP-SOL-D7": "domain_separator",
    "KEP-SOL-D8": "Never label local simulation as mainnet evidence",
    "KEP-SOL-D9": "Network transaction fees, account rent, or refundable rent reserves",
    "KEP-SOL-D10": "upgrade_authority_posture",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stable_digest(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_json(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path.name}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path.name} must contain one object")
        return {}
    return value


def resolve_repository_path(relative: object, errors: list[str], label: str) -> Path | None:
    if not isinstance(relative, str) or not relative or relative.startswith("/") or ".." in Path(relative).parts:
        errors.append(f"{label} must be a safe repository-relative path")
        return None
    path = (REPOSITORY_ROOT / relative).resolve()
    try:
        path.relative_to(REPOSITORY_ROOT)
    except ValueError:
        errors.append(f"{label} escapes repository root")
        return None
    if not path.is_file():
        errors.append(f"{label} is missing: {relative}")
        return None
    return path


def definition_sections(text: str) -> list[tuple[str, str, str]]:
    matches = list(re.finditer(r"^## (KEP-SOL-D\d+): (.+)$", text, flags=re.MULTILINE))
    sections: list[tuple[str, str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else text.find("\n## Candidate Claim Ceiling", match.end())
        if end < 0:
            end = len(text)
        sections.append((match.group(1), match.group(2), text[match.start():end]))
    return sections


def validate() -> dict[str, Any]:
    errors: list[str] = []
    manifest = load_json(MANIFEST_PATH, errors)
    material_paths = (DEFINITIONS_PATH, INDEX_PATH, DRIFT_PATH, MANIFEST_PATH)
    for path in material_paths:
        if not path.is_file():
            errors.append(f"missing candidate material: {path.name}")

    definitions = DEFINITIONS_PATH.read_text(encoding="utf-8") if DEFINITIONS_PATH.is_file() else ""
    index = INDEX_PATH.read_text(encoding="utf-8") if INDEX_PATH.is_file() else ""
    drift = DRIFT_PATH.read_text(encoding="utf-8") if DRIFT_PATH.is_file() else ""

    if manifest.get("definition_set_id") != EXPECTED_SET_ID:
        errors.append("definition set identity drift")
    if manifest.get("status") != "candidate" or manifest.get("route_id") != "CA2-ROUTE-DEFINITIONS":
        errors.append("definition set must remain a Definitions-route candidate")
    if manifest.get("successor_authorization") != "none" or manifest.get("authority_effect") != "none" or manifest.get("external_effect") != "none":
        errors.append("candidate definition set exceeds its authority ceiling")
    if manifest.get("construction_state") != EXPECTED_CONSTRUCTION_STATE:
        errors.append("D65 construction state must stop at candidate definitions")

    base = manifest.get("base_definition_source", {})
    base_path = resolve_repository_path(base.get("path"), errors, "base definition source")
    if base.get("sha256") != EXPECTED_BASE_DEFINITION_DIGEST:
        errors.append("manifest base definition digest drift")
    if tuple(base.get("selected_ids", [])) != EXPECTED_BASE_IDS:
        errors.append("base definition selection must remain KEP-D1 through KEP-D12")
    if base_path and sha256(base_path) != EXPECTED_BASE_DEFINITION_DIGEST:
        errors.append("admitted base definition bytes drift")

    base_admission = manifest.get("base_admission", {})
    base_admission_path = resolve_repository_path(base_admission.get("path"), errors, "base admission")
    if base_admission.get("decision_id") != "CA2-DECISION-KEP-ONTOLOGY-ADMISSION-001":
        errors.append("base admission decision identity drift")
    if base_admission.get("sha256") != EXPECTED_BASE_ADMISSION_DIGEST:
        errors.append("manifest base admission digest drift")
    if base_admission_path and sha256(base_admission_path) != EXPECTED_BASE_ADMISSION_DIGEST:
        errors.append("base admission bytes drift")

    motivation = manifest.get("motivation_evidence", {})
    motivation_path = resolve_repository_path(motivation.get("path"), errors, "motivation evidence")
    if motivation.get("decision_id") != "CA2-DECISION-KEP-RUST-IMPLEMENTATION-ADMISSION-001":
        errors.append("motivation evidence identity drift")
    if motivation.get("sha256") != EXPECTED_RUST_ADMISSION_DIGEST:
        errors.append("manifest Rust admission digest drift")
    if motivation_path and sha256(motivation_path) != EXPECTED_RUST_ADMISSION_DIGEST:
        errors.append("Rust admission evidence bytes drift")

    candidate = manifest.get("candidate_definition_source", {})
    if tuple(candidate.get("definition_ids", [])) != EXPECTED_IDS:
        errors.append("candidate definition IDs must be KEP-SOL-D1 through KEP-SOL-D10")
    if DEFINITIONS_PATH.is_file() and candidate.get("sha256") != sha256(DEFINITIONS_PATH):
        errors.append("candidate definition source digest drift")

    if "Status: candidate capability-local source" not in definitions:
        errors.append("definition source must remain candidate")
    if "terms are candidate-only until the product owner accepts\none exact digest" not in definitions:
        errors.append("candidate authority boundary is missing")

    sections = definition_sections(definitions)
    ids = tuple(item[0] for item in sections)
    if ids != EXPECTED_IDS:
        errors.append(f"definition heading closure mismatch: {ids}")
    for definition_id, title, section in sections:
        if "Status: candidate" not in section:
            errors.append(f"{definition_id} must remain candidate")
        for voice in REQUIRED_VOICES:
            if voice not in section:
                errors.append(f"{definition_id} missing definition voice: {voice}")
        distinction = REQUIRED_DISTINCTIONS[definition_id]
        normalized_section = " ".join(section.split())
        if " ".join(distinction.split()) not in normalized_section:
            errors.append(f"{definition_id} missing critical distinction: {distinction}")
        term_match = re.search(r"^Term: (.+)$", section, flags=re.MULTILINE)
        alias_match = re.search(r"^Aliases: (.+)$", section, flags=re.MULTILINE)
        if not term_match or not alias_match:
            errors.append(f"{definition_id} missing term or aliases")
            continue
        lookup_terms = [term_match.group(1), *(part.strip() for part in alias_match.group(1).split(","))]
        for lookup_term in lookup_terms:
            if f"| {lookup_term} | {definition_id} |" not in index:
                errors.append(f"index missing {lookup_term} -> {definition_id}")
        if title.lower() != term_match.group(1).lower():
            errors.append(f"{definition_id} title and canonical term drift")

    required_drift_markers = (
        "wallet or public key as the Knowledge Identity",
        "one account as the Knowledge Artifact",
        "instruction submission as a successful grant",
        "network fees, rent, and refundable reserves",
        "local program-test evidence a deployment or mainnet proof",
        "Product Capability is authored",
    )
    for marker in required_drift_markers:
        if marker not in drift:
            errors.append(f"drift audit missing marker: {marker}")

    material = {
        path.name: sha256(path) if path.is_file() else "missing"
        for path in material_paths
    }
    return {
        "schema_version": "cav2-kep-solana-definition-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "definition_set_id": manifest.get("definition_set_id"),
        "definition_status": manifest.get("status"),
        "definition_ids": list(ids),
        "definition_count": len(ids),
        "definition_source_digest": sha256(DEFINITIONS_PATH) if DEFINITIONS_PATH.is_file() else None,
        "material_digest": stable_digest(material),
        "d65_last_evaluable_stage": "candidate Solana realization definitions",
        "authority_effect": "none",
        "claim_ceiling": "Validated candidate definitions only; no definition acceptance, Product Capability adoption, ontology or DomainSpec admission, implementation, Solana execution, payment, publication, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
