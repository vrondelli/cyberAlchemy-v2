#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]
DOCUMENT = ROOT / "EVF.md"
MANIFEST = ROOT / "source-manifest.json"
GUIDE = REPO / "cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/COMPLETE-GUIDE.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_heading_order(text: str, expected: list[str], label: str, errors: list[str]) -> None:
    positions = {heading: text.find(f"## {heading}\n") for heading in expected}
    missing = [heading for heading, position in positions.items() if position < 0]
    if missing:
        errors.append(f"{label} ordered sections missing: {', '.join(missing)}")
        return
    actual_positions = [positions[heading] for heading in expected]
    if actual_positions != sorted(actual_positions):
        errors.append(f"{label} explanation order is not EVF meaning -> lifecycle -> tools -> TDE -> example")


def main() -> int:
    errors: list[str] = []
    manifest = json.loads(MANIFEST.read_text())
    document = DOCUMENT.read_text()
    guide = GUIDE.read_text()
    normalized_document = " ".join(document.split())

    for source in manifest["sources"]:
        path = REPO / source["path"]
        if not path.is_file():
            errors.append(f"missing source: {source['path']}")
        elif sha256(path) != source["sha256"]:
            errors.append(f"source drift: {source['path']}")

    required_sections = {
        "Authority Posture", "EVF in One Minute", "Who Does What",
        "How EVF Works: Complete Lifecycle", "Selected Tools and Current Status",
        "How TDE and EVF Work Together", "Obligation-to-Tool Contract",
        "Concrete Obligation Consumption",
        "Normative Definition", "Formal Interpretation", "Residuality Specialization",
        "Evidence Kinds and Claim Limits", "How a Tool Result Enters EVF",
        "Tool and Provider Neutrality", "Reference Clarity",
        "Non-Inflating Join", "Digests, Epochs, and Receipts",
        "Readiness and Authority Boundary", "Plain-Language Intuition",
        "Domain-Context Voice", "Boundary and Non-Goals", "Open Questions",
    }
    headings = set(re.findall(r"^## (.+)$", document, re.MULTILINE))
    for section in sorted(required_sections - headings):
        errors.append(f"missing definition voice or contract section: {section}")
    check_heading_order(document, [
        "Authority Posture",
        "EVF in One Minute",
        "Normative Definition",
        "Plain-Language Intuition",
        "Domain-Context Voice",
        "Boundary and Non-Goals",
        "How EVF Works: Complete Lifecycle",
        "Formal Interpretation",
        "Minimum EVF Flow",
        "Residuality Specialization",
        "Evidence Kinds and Claim Limits",
        "How a Tool Result Enters EVF",
        "Tool and Provider Neutrality",
        "Reference Clarity",
        "Non-Inflating Join",
        "Digests, Epochs, and Receipts",
        "Readiness and Authority Boundary",
        "Who Does What",
        "Selected Tools and Current Status",
        "How TDE and EVF Work Together",
        "Obligation-to-Tool Contract",
        "Concrete Obligation Consumption",
        "Worked Example: Safe Solana Deployment Continuation",
        "Promotion Requirements",
        "Open Questions",
    ], "EVF candidate", errors)
    check_heading_order(guide, [
        "What EVF Does",
        "How EVF Works",
        "Residuality Specialization",
        "Evidence Does Not Collapse",
        "How Tool Output Becomes EVF Evidence",
        "Results",
        "Selected EVF Tools and Current Status",
        "How TDE Participates in EVF",
        "Obligation-to-Tool Binding",
        "Concrete Obligation Consumed by Rust",
        "Current Worked Example: Safe Solana Deployment Continuation",
        "Implementation Surfaces",
        "Open Questions",
    ], "consumer guide", errors)
    if "Status: canonical-documentation candidate; not promoted" not in document:
        errors.append("candidate posture missing or inflated")
    if "Authority effect: none" not in document:
        errors.append("authority ceiling missing")
    if re.search(r"^Status: canonical\s*$", document, re.MULTILINE):
        errors.append("document falsely claims canonical status")
    selected_tool_markers = {
        "TDE": "Implemented in the historical DomainSpec v9 candidate, but no TDE obligation artifact is bound",
        "Specification closure": "EVF residual evaluator plus deterministic structure and schema checks",
        "Formal proof": "Lean proof assistant",
        "Implementation test": "Rust Cargo test runner",
        "Bounded exploration": "Custom finite-state explorer",
        "Alloy posture": "Proposed only; sketches are unvalidated and Alloy is not used",
        "TLA posture": "Proposed only; sketches are unvalidated and TLA+/TLC is not used",
        "Runtime observation": "Observe assembled runtime behavior | No tool currently bound",
        "Operational control": "Exercise operational controls | No tool currently bound",
        "Finalized external observation": "Observe finalized external effects | No tool currently bound",
    }
    for tool_role, marker in selected_tool_markers.items():
        if marker not in normalized_document:
            errors.append(f"missing selected-tool status: {tool_role}")
    if "does not mean universally mandatory" not in normalized_document:
        errors.append("selected-tool scope is not clearly bounded")
    if "EVF does not automatically run every evidence tool." not in document:
        errors.append("tool execution boundary missing")
    tde_evf_markers = {
        "TDE expansion": "Test Derivation Engine (TDE)",
        "TDE ownership": "TDE owns derivation",
        "EVF ownership": "EVF owns routing and joining",
        "provider ownership": "The selected provider owns execution",
        "neutral obligation": "TDE must not emit a Lean-, Alloy-, TLA+-, Rust-, or Python-shaped obligation",
        "theorem separation": "An ordinary TDE obligation set is not required for that theorem route",
        "exact invocation": "exact invocation or API call",
        "Alloy status": "Proposed only; sketches are unvalidated and Alloy is not used by the current example",
        "TLA status": "Proposed only; sketches are unvalidated and TLA+/TLC is not used by the current example",
        "current integration ceiling": "does not yet prove the complete TDE-to-EVF flow",
        "neutral provider field": "`provider: null` is intentional",
        "concrete Rust obligation": "test-duplicate-effect-rejection",
        "exact Cargo invocation": "cargo test --manifest-path cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/trial-cli/Cargo.toml --locked --offline",
        "concrete Lean input": "DeploymentContinuation.lean",
        "concrete Lean observation": "EVF-OBS-013-LEAN-AMBIGUITY-STOPS",
        "missing TDE artifact": "does not bind an actual TDE-generated neutral-obligation artifact",
    }
    for contract_part, marker in tde_evf_markers.items():
        if marker not in normalized_document:
            errors.append(f"missing TDE-EVF contract detail: {contract_part}")
    if "must not use a project-local ID as if the ID explains the thing" not in normalized_document:
        errors.append("reader-facing reference clarity rule missing")
    current_provider_markers = {
        "Lean, a proof assistant": "1 supported observation",
        "Focused Rust tests for the command-line deployment prototype": "1 supported observation",
        "custom program that checks every combination": "5 supported observations",
        "Runtime observation | None": "No bound observation",
        "Operational control | None": "No bound observation",
        "Finalized external observation | None": "No bound observation",
    }
    for provider_marker, status_marker in current_provider_markers.items():
        if provider_marker not in document or status_marker not in document:
            errors.append(f"current worked-example tool status missing: {provider_marker}")
    explanation_markers = {
        "Knowledge Exchange Protocol": "giving an additional person co-ownership",
        "Solana deployment example": "safely continuing deployment of the Solana program",
        "Candidate 013 internal label": 'internally labels this development snapshot "Knowledge Exchange Protocol Candidate 013."',
    }
    for subject, explanation in explanation_markers.items():
        if explanation not in normalized_document:
            errors.append(f"worked-example reference lacks plain explanation: {subject}")
    forbidden_unexplained_labels = {
        "## Candidate 013 Evidence Example",
        "KEP Candidate 013 Cartesian explorer",
        "Focused Rust trial-CLI tests",
    }
    for label in sorted(forbidden_unexplained_labels):
        if label in document or label in guide:
            errors.append(f"unexplained project-local label remains: {label}")
    if "candidate; not canonical" not in guide or "Normative source candidate" not in guide:
        errors.append("consumer guide does not preserve candidate authority posture")

    receipt_path = next(REPO / item["path"] for item in manifest["sources"] if item["role"] == "current worked-example evidence snapshot")
    receipt = json.loads(receipt_path.read_text())
    expected = {
        "declared_paths": 15,
        "specification_closed_paths": 15,
        "reachable_safety_paths": 10,
        "evidence_supported_paths": 2,
    }
    if receipt.get("coverage") != expected or receipt.get("aggregate_readiness") != "BLOCK":
        errors.append("candidate-013 example values drift from bound receipt")
    if receipt.get("authority_effect") != "none":
        errors.append("worked example authority inflation")

    result = {
        "result": "PASS" if not errors else "BLOCK",
        "candidate_id": "CAV2-EVF-CANONICAL-DOC-CANDIDATE-V1",
        "definition_voices_complete": not any("voice" in error for error in errors),
        "source_count": len(manifest["sources"]),
        "worked_example_readiness": receipt.get("aggregate_readiness"),
        "promotion_decision": manifest["promotion_decision"],
        "authority_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
