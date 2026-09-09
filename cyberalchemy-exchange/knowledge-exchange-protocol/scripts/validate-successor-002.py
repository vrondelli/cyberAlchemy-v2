#!/usr/bin/env python3
"""Validate the immutable KEP DomainSpec successor-002 candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = PACKAGE_ROOT / "domainspec/successors/002"
GENERATED = PROJECT_ROOT / "generated"
PRIOR = {
    "graph": ("domainspec/generated/graph.json", "dd906d1a2fbd63b8f4e8b0c5d54b65b16a0b49086d0beeef356aa7d87fc22fb6"),
    "system_ontology": ("domainspec/generated/system-ontology.json", "2ebaca2810a938fb2e7026784d8be4fb139526bb0a57282dee9ed61e10db3b69"),
    "admission_decision": ("decisions/system-ontology-admission.json", "921da626a01b9dc06922970395db01e93df8dae5134a97c58a4986e0fe134da9"),
}
DECISION_PATH = PACKAGE_ROOT / "decisions/system-ontology-admission-002.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"load:{path.relative_to(PACKAGE_ROOT)}:{exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"object-required:{path.relative_to(PACKAGE_ROOT)}")
        return {}
    return value


def stable_digest(value: Any) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def validate(require_decision: bool = False) -> dict[str, Any]:
    errors: list[str] = []
    checks: list[dict[str, str]] = []

    def check(check_id: str, condition: bool, detail: str) -> None:
        checks.append({"check_id": check_id, "status": "PASS" if condition else "FAIL"})
        if not condition:
            errors.append(f"{check_id}:{detail}")

    paths = {
        "graph": GENERATED / "graph.json",
        "source_manifest": GENERATED / "source-manifest.json",
        "spec": GENERATED / "SPEC.md",
        "markdown_view": GENERATED / "markdown-view.json",
        "build_receipt": GENERATED / "build-receipt.json",
        "system_ontology": GENERATED / "system-ontology.json",
        "projection_receipt": GENERATED / "system-ontology-receipt.json",
        "candidate": GENERATED / "system-ontology-admission-candidate.json",
        "construction_binding": PROJECT_ROOT / "construction-binding.json",
        "development_profile": PROJECT_ROOT / "development-profile.json",
    }
    actual = {name: digest(path) if path.is_file() else "missing" for name, path in paths.items()}
    graph = load(paths["graph"], errors)
    manifest = load(paths["source_manifest"], errors)
    markdown_view = load(paths["markdown_view"], errors)
    build = load(paths["build_receipt"], errors)
    system = load(paths["system_ontology"], errors)
    receipt = load(paths["projection_receipt"], errors)
    candidate = load(paths["candidate"], errors)
    binding = load(paths["construction_binding"], errors)

    check("candidate-id", candidate.get("candidate_id") == "CA2-CANDIDATE-KEP-SYSTEM-ONTOLOGY-002", "unexpected candidate")
    check("candidate-graph-binding", candidate.get("source_graph_digest") == actual["graph"], "graph digest drift")
    check("candidate-system-binding", candidate.get("system_ontology_digest") == actual["system_ontology"], "system ontology digest drift")
    check("candidate-construction-binding", candidate.get("construction_binding_digest") == actual["construction_binding"], "construction digest drift")
    check("candidate-corrections", candidate.get("correction_definition_ids") == ["KEP-D4", "KEP-D6", "KEP-D11", "KEP-D12"], "correction set changed")
    check("candidate-effect-ceiling", candidate.get("requested_successor_authorization") == "none" and candidate.get("authority_effect") == "none", "candidate claims authority")

    check("receipt-graph-binding", receipt.get("source_graph_digest") == actual["graph"], "receipt graph drift")
    check("receipt-system-binding", receipt.get("system_ontology_digest") == actual["system_ontology"], "receipt system drift")
    check("receipt-construction-binding", receipt.get("construction_binding_digest") == actual["construction_binding"], "receipt construction drift")
    check("two-run-determinism", receipt.get("deterministic_runs") == 2 and receipt.get("equal_graph_bytes") is True and receipt.get("equal_system_ontology_bytes") is True, "determinism receipt incomplete")
    check("definition-closure-receipt", receipt.get("semantic_coverage") == "closed" and receipt.get("field_level_definition_closure") == "closed", "definition closure not proven")

    check("build-status", build.get("status") == "pass", "DomainSpec build did not pass")
    check("build-graph-binding", build.get("artifacts", {}).get("graph_digest") == actual["graph"], "build graph drift")
    check("build-manifest-binding", build.get("artifacts", {}).get("source_manifest_digest") == actual["source_manifest"], "build manifest drift")
    check("build-markdown-binding", build.get("artifacts", {}).get("markdown_view_digest") == actual["markdown_view"] and build.get("artifacts", {}).get("markdown_content_digest") == actual["spec"], "build view drift")
    check("source-set-binding", graph.get("source_set_digest") == manifest.get("source_set_digest") == build.get("source_set_digest"), "source-set digests differ")
    check("profile-binding", graph.get("language", {}).get("profile_digest") == actual["development_profile"] == build.get("language", {}).get("profile_digest"), "development profile drift")

    input_current = True
    for item in manifest.get("inputs", []):
        source = PROJECT_ROOT / item.get("path", "")
        if not source.is_file() or digest(source) != item.get("digest"):
            input_current = False
    check("source-manifest-current", input_current and len(manifest.get("inputs", [])) == 12, "authored source drift or unexpected source count")

    check("system-id", system.get("ontology_id") == "knowledge-exchange.system.encrypted-coownership", "ontology identity changed")
    check("system-lifecycle", system.get("lifecycle_status") == "successor-candidate", "unexpected lifecycle")
    check("system-effect-ceiling", system.get("authority_effect") == "none" and system.get("enforcement_effect") == "none", "system claims authority")
    check("system-graph-binding", system.get("source_graph_digest") == actual["graph"], "system graph drift")
    check("system-definition-closure", system.get("semantic_coverage", {}).get("status") == "closed" and system.get("semantic_coverage", {}).get("field_level_definition_closure") == "closed", "system definition closure open")
    check("system-implementation-blocked", system.get("implementation_contract", {}).get("implementation_binding_status") == "blocked-pending-successor-system-ontology-admission", "implementation was authorized")

    mechanisms = set(system.get("implementation_contract", {}).get("required_runtime_mechanisms", []))
    required_mechanisms = {
        "binding-validity-window-evaluation", "binding-challenge-commitment",
        "exact-state-revision-binding", "consumed-command-replay-protection",
        "consumed-challenge-replay-protection", "ciphertext-bound-acknowledgement",
        "same-epoch-single-envelope-reissue", "complete-owner-envelope-epoch-rotation",
    }
    check("runtime-mechanism-closure", mechanisms == required_mechanisms, "runtime mechanism contract drift")

    node_fields = {
        node.get("node_id"): {field.get("name") for field in node.get("body", {}).get("fields", [])}
        for node in graph.get("nodes", [])
    }
    required_fields = {
        "encrypted-knowledge-coownership.KnowledgeIdentity": {"encryption_binding_id", "encryption_key_valid_from", "encryption_key_valid_until", "encryption_key_challenge_digest"},
        "encrypted-knowledge-coownership.EncryptedCoownershipState": {"state_revision", "consumed_command_digests", "consumed_challenge_digests"},
        "encrypted-knowledge-coownership.CoownershipGrant": {"expected_state_revision", "evaluation_time", "recipient_key_binding_id", "recipient_key_binding_version"},
        "encrypted-knowledge-coownership.KeyReissueRequest": {"expected_state_revision", "previous_key_binding_id", "previous_key_binding_version", "replacement_key_binding_id", "replacement_key_binding_version"},
        "encrypted-knowledge-coownership.KeyReissue": {"issuer_id", "protected_state_before_digest", "protected_state_after_digest", "unaffected_envelopes_before_digest", "unaffected_envelopes_after_digest"},
        "encrypted-knowledge-coownership.DecryptionAcknowledgement": {"expected_state_revision", "ciphertext_digest", "challenge_digest"},
    }
    for node_id, required in required_fields.items():
        check(f"field-closure-{node_id.rsplit('.', 1)[-1]}", required.issubset(node_fields.get(node_id, set())), f"missing {sorted(required - node_fields.get(node_id, set()))}")

    for name, (relative, expected) in PRIOR.items():
        current = digest(PACKAGE_ROOT / relative) if (PACKAGE_ROOT / relative).is_file() else "missing"
        check(f"prior-preserved-{name}", current == expected, f"expected {expected} got {current}")
    prior_binding = binding.get("predecessors", {}).get("superseded_system_ontology", {})
    check("supersession-binding", system.get("supersedes") == prior_binding and candidate.get("supersedes_decision_id") == "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-001", "supersession identity drift")

    material = {
        name: actual[name]
        for name in ("graph", "system_ontology", "projection_receipt", "candidate", "construction_binding")
    }
    material_digest = stable_digest(material)

    if require_decision:
        decision = load(DECISION_PATH, errors)
        admitted = decision.get("admitted_artifacts", {})
        supersedes = decision.get("supersedes", {})
        check("decision-id", decision.get("decision_id") == "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-002", "unexpected decision id")
        check("decision-source", decision.get("source", {}).get("exact_user_decision") == "Admit 32a354721df128dd3ba8b11e8f1a435914a8718952c93b5a7e69f12edae60a60", "decision source is not exact")
        check("decision-candidate", decision.get("candidate", {}).get("candidate_id") == candidate.get("candidate_id") and decision.get("candidate", {}).get("sha256") == actual["candidate"], "decision does not bind candidate")
        for name in ("graph", "system_ontology", "projection_receipt", "construction_binding"):
            check(f"decision-binds-{name}", admitted.get(name, {}).get("sha256") == actual[name], f"decision {name} digest drift")
        check("decision-preacceptance", decision.get("preacceptance", {}).get("material_digest") == material_digest and decision.get("preacceptance", {}).get("outputs_identical") is True and decision.get("preacceptance", {}).get("checks_passed") == 35, "preacceptance binding mismatch")
        check("decision-admission", decision.get("admission", {}).get("lifecycle_status") == "admitted" and decision.get("admission", {}).get("system_ontology_digest") == actual["system_ontology"], "successor system ontology not admitted exactly")
        check("decision-supersedes-prior", supersedes.get("decision_id") == "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-001" and supersedes.get("sha256") == PRIOR["admission_decision"][1] and supersedes.get("system_ontology_digest") == PRIOR["system_ontology"][1], "prior admission not bound exactly")
        check("decision-successor-ceiling", decision.get("successor_authorization") == "none" and decision.get("enforcement_effect") == "none" and decision.get("external_effect") == "none", "decision grants successor effect")

    return {
        "schema_version": "knowledge-exchange-protocol-successor-validation/v2",
        "mode": "admitted" if require_decision else "preacceptance",
        "status": "PASS" if not errors else "FAIL",
        "candidate_id": candidate.get("candidate_id"),
        "source_graph_digest": actual["graph"],
        "system_ontology_digest": actual["system_ontology"],
        "candidate_digest": actual["candidate"],
        "material_digest": material_digest,
        "checks": checks,
        "errors": errors,
        "authority_effect": "none",
        "claim_ceiling": "Successor-candidate validation only; no admission, implementation binding, conformance, Solana realization, publication, release, deployment, or external effect.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--admitted", action="store_true", help="Require and validate the immutable successor admission decision")
    args = parser.parse_args()
    report = validate(args.admitted)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
