#!/usr/bin/env python3
"""Validate the candidate Solana completion definition successor without effects."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any


DEFINITION_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[9]
MANIFEST_PATH = DEFINITION_ROOT / "definition-set.json"
DEFINITIONS_PATH = DEFINITION_ROOT / "DEFINITIONS.md"
INDEX_PATH = DEFINITION_ROOT / "DEFINITIONS-INDEX.md"
DRIFT_PATH = DEFINITION_ROOT / "DEFINITION-DRIFT-AUDIT.md"
PACK_PATH = DEFINITION_ROOT / "definition-pack-candidate.json"

EXPECTED_SET_ID = "KEP-SOL-DEFINITION-SET-002"
EXPECTED_IDS = tuple(f"KEP-SOL-D{index}" for index in range(11, 18))
EXPECTED_PREDECESSOR_IDS = tuple(f"KEP-SOL-D{index}" for index in range(1, 11))
EXPECTED_DURABLE_IDS = tuple(f"KEP-DST-D{index}" for index in range(1, 16))
EXPECTED_PREDECESSOR_DIGEST = "4bd06cf89baf081cbd404c1bad55378c47a14cdeb2029b0cf41d4ad49e133365"
EXPECTED_PREDECESSOR_ACCEPTANCE_DIGEST = "a23797721d0522944188daf9c3a00f0a3e8540edc17d65839c254b862d382885"
EXPECTED_DURABLE_DIGEST = "4edb03caab66af2eedf79ad31a47d09b19aec0d975deccfd217195046258c4df"
EXPECTED_DURABLE_ACCEPTANCE_DIGEST = "e8ba35fb8912a426def05f4a449e07ac49578afd0f8633e75350309735209206"
EXPECTED_CONSTRUCTION_STATE = {
    "canonical_definitions": "candidate-successor-awaiting-owner-acceptance",
    "product_capability_successor": "not_evaluable",
    "business_ontology_successor": "not_evaluable",
    "domainspec_v2_successor": "not_evaluable",
    "compiled_graph_and_system_ontology": "not_evaluable",
    "implementation_binding": "not_evaluable",
    "conformance_evidence": "not_evaluable",
    "devnet_runtime_evidence": "not_evaluable",
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
    "KEP-SOL-D11": "naming an algorithm proves secure use",
    "KEP-SOL-D12": "PostgreSQL is not part of this definition",
    "KEP-SOL-D13": "records intent only",
    "KEP-SOL-D14": "only that recipient's active envelope commitment",
    "KEP-SOL-D15": "never invent atomicity between Solana and external storage",
    "KEP-SOL-D16": "not Mainnet evidence",
    "KEP-SOL-D17": "missing dependent evidence as `not_evaluable`",
}
EXPECTED_CONCEPT_IDS = (
    "kep-solana.solana-coownership-cryptographic-profile",
    "kep-solana.solana-coownership-durable-storage-instantiation",
    "kep-solana.solana-key-reissue-request",
    "kep-solana.solana-key-reissue-fulfillment",
    "kep-solana.solana-finalized-delivery-activation",
    "kep-solana.solana-devnet-protocol-trial",
    "kep-solana.solana-end-to-end-protocol-evidence-bundle",
)
ALLOWED_DISPOSITIONS = {"reuse", "specialize", "propose", "open"}


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


def validate_bound_file(
    record: dict[str, Any],
    expected_digest: str,
    errors: list[str],
    label: str,
) -> Path | None:
    path = resolve_repository_path(record.get("path"), errors, label)
    if record.get("sha256") != expected_digest:
        errors.append(f"manifest {label} digest drift")
    if path and sha256(path) != expected_digest:
        errors.append(f"bound {label} bytes drift")
    return path


def validate() -> dict[str, Any]:
    errors: list[str] = []
    material_paths = (DEFINITIONS_PATH, INDEX_PATH, DRIFT_PATH, MANIFEST_PATH, PACK_PATH)
    for path in material_paths:
        if not path.is_file():
            errors.append(f"missing candidate material: {path.name}")

    manifest = load_json(MANIFEST_PATH, errors)
    pack = load_json(PACK_PATH, errors)
    definitions = DEFINITIONS_PATH.read_text(encoding="utf-8") if DEFINITIONS_PATH.is_file() else ""
    index = INDEX_PATH.read_text(encoding="utf-8") if INDEX_PATH.is_file() else ""
    drift = DRIFT_PATH.read_text(encoding="utf-8") if DRIFT_PATH.is_file() else ""

    if manifest.get("definition_set_id") != EXPECTED_SET_ID:
        errors.append("definition set identity drift")
    if manifest.get("status") != "candidate" or manifest.get("route_id") != "CA2-ROUTE-DEFINE":
        errors.append("definition successor must remain a Define-route candidate")
    if any(manifest.get(field) != "none" for field in ("successor_authorization", "authority_effect", "external_effect")):
        errors.append("candidate definition successor exceeds its authority ceiling")
    if manifest.get("construction_state") != EXPECTED_CONSTRUCTION_STATE:
        errors.append("D65 construction state must stop at candidate successor definitions")

    predecessor = manifest.get("predecessor_definition_set", {})
    validate_bound_file(predecessor, EXPECTED_PREDECESSOR_DIGEST, errors, "predecessor definition source")
    if predecessor.get("definition_set_id") != "KEP-SOL-DEFINITION-SET-001":
        errors.append("predecessor definition set identity drift")
    if tuple(predecessor.get("selected_ids", [])) != EXPECTED_PREDECESSOR_IDS:
        errors.append("predecessor definition selection must remain KEP-SOL-D1 through KEP-SOL-D10")

    predecessor_acceptance = manifest.get("predecessor_acceptance", {})
    validate_bound_file(predecessor_acceptance, EXPECTED_PREDECESSOR_ACCEPTANCE_DIGEST, errors, "predecessor acceptance")
    if predecessor_acceptance.get("decision_id") != "CA2-DECISION-KEP-SOLANA-DEFINITION-ACCEPTANCE-001":
        errors.append("predecessor acceptance identity drift")

    durable = manifest.get("durable_storage_dependency", {})
    validate_bound_file(durable, EXPECTED_DURABLE_DIGEST, errors, "Durable Storage definition source")
    if durable.get("definition_set_id") != "KEP-DST-DEFINITION-SET-001":
        errors.append("Durable Storage definition set identity drift")
    if tuple(durable.get("selected_ids", [])) != EXPECTED_DURABLE_IDS:
        errors.append("Durable Storage selection must remain KEP-DST-D1 through KEP-DST-D15")

    durable_acceptance = manifest.get("durable_storage_acceptance", {})
    validate_bound_file(durable_acceptance, EXPECTED_DURABLE_ACCEPTANCE_DIGEST, errors, "Durable Storage acceptance")
    if durable_acceptance.get("decision_id") != "CA2-DECISION-KEP-DURABLE-STORAGE-DEFINITION-ACCEPTANCE-001":
        errors.append("Durable Storage acceptance identity drift")

    candidate = manifest.get("candidate_extension_source", {})
    if tuple(candidate.get("definition_ids", [])) != EXPECTED_IDS:
        errors.append("candidate definition IDs must be KEP-SOL-D11 through KEP-SOL-D17")
    if DEFINITIONS_PATH.is_file() and candidate.get("sha256") != sha256(DEFINITIONS_PATH):
        errors.append("candidate definition extension digest drift")

    complete_ids = tuple(manifest.get("successor_composition", {}).get("complete_definition_ids", []))
    if complete_ids != EXPECTED_PREDECESSOR_IDS + EXPECTED_IDS:
        errors.append("successor composition must close KEP-SOL-D1 through KEP-SOL-D17")

    if "Status: candidate capability-local successor source" not in definitions:
        errors.append("definition source must remain a candidate successor")
    if "does not alter or\nreplace the accepted `KEP-SOL-D1` through `KEP-SOL-D10` bytes" not in definitions:
        errors.append("accepted predecessor preservation boundary is missing")

    sections = definition_sections(definitions)
    section_ids = tuple(item[0] for item in sections)
    if section_ids != EXPECTED_IDS:
        errors.append(f"definition heading closure mismatch: {section_ids}")
    for definition_id, title, section in sections:
        if "Status: candidate" not in section:
            errors.append(f"{definition_id} must remain candidate")
        for voice in REQUIRED_VOICES:
            if voice not in section:
                errors.append(f"{definition_id} missing definition voice: {voice}")
        normalized_section = " ".join(section.split())
        distinction = " ".join(REQUIRED_DISTINCTIONS[definition_id].split())
        if distinction not in normalized_section:
            errors.append(f"{definition_id} missing critical distinction: {REQUIRED_DISTINCTIONS[definition_id]}")
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
        "Editing the accepted `4bd06c...` definition bytes",
        "named algorithm suite as proof of secure cryptography",
        "Rewriting generic storage inside the Solana capability",
        "Treating one successful write as storage readiness",
        "Treating B's reissue request as an envelope change",
        "Claiming cross-system atomicity",
        "Calling a Devnet run Mainnet or production evidence",
        "Recording keys, credentials, or plaintext inside evidence",
    )
    for marker in required_drift_markers:
        if marker not in drift:
            errors.append(f"drift audit missing marker: {marker}")

    if pack.get("pack_id") != "DEFINE-PACK-KEP-SOLANA-COMPLETION-002" or pack.get("status") != "candidate":
        errors.append("Definition Pack identity or status drift")
    if pack.get("authority_effect") != "none" or pack.get("external_effect") != "none":
        errors.append("Definition Pack exceeds candidate authority")
    pack_source = pack.get("candidate_definition_source", {})
    if pack_source.get("definition_set_id") != EXPECTED_SET_ID:
        errors.append("Definition Pack candidate set identity drift")
    if DEFINITIONS_PATH.is_file() and pack_source.get("sha256") != sha256(DEFINITIONS_PATH):
        errors.append("Definition Pack source digest drift")
    if INDEX_PATH.is_file() and pack_source.get("index_sha256") != sha256(INDEX_PATH):
        errors.append("Definition Pack index digest drift")

    required_concepts = tuple(pack.get("required_concept_ids", []))
    concepts = pack.get("concepts", [])
    if required_concepts != EXPECTED_CONCEPT_IDS:
        errors.append("Definition Pack required concept closure drift")
    if not isinstance(concepts, list) or len(concepts) != len(EXPECTED_CONCEPT_IDS):
        errors.append("Definition Pack must contain exactly seven concepts")
        concepts = []
    concept_ids: list[str] = []
    definition_refs: list[str] = []
    for concept in concepts:
        if not isinstance(concept, dict):
            errors.append("Definition Pack concepts must be objects")
            continue
        concept_ids.append(str(concept.get("concept_id")))
        definition_refs.append(str(concept.get("source_definition_ref")))
        disposition = concept.get("current_disposition")
        if not isinstance(disposition, str) or disposition not in ALLOWED_DISPOSITIONS:
            errors.append(f"concept {concept.get('concept_id')} must have one valid disposition")
        if disposition == "specialize" and not concept.get("parent_definition_refs"):
            errors.append(f"specialized concept {concept.get('concept_id')} must name its parent definitions")
    if tuple(concept_ids) != EXPECTED_CONCEPT_IDS:
        errors.append("Definition Pack concept order or identity drift")
    if tuple(definition_refs) != EXPECTED_IDS:
        errors.append("Definition Pack definition reference closure drift")

    material = {path.name: sha256(path) if path.is_file() else "missing" for path in material_paths}
    return {
        "schema_version": "cav2-kep-solana-definition-validation/v2",
        "status": "PASS" if not errors else "BLOCK",
        "definition_set_id": manifest.get("definition_set_id"),
        "definition_status": manifest.get("status"),
        "definition_ids": list(section_ids),
        "definition_count": len(section_ids),
        "definition_source_digest": sha256(DEFINITIONS_PATH) if DEFINITIONS_PATH.is_file() else None,
        "material_digest": stable_digest(material),
        "d65_last_evaluable_stage": "candidate Solana completion definitions",
        "authority_effect": "none",
        "claim_ceiling": "Validated candidate successor definitions only; no acceptance, Product Capability, ontology, DomainSpec, implementation, cryptographic selection, Solana transaction, publication, release, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
