#!/usr/bin/env python3
"""Collect-all validation for candidate-013 semantic obligation coverage."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[10]
CLAIMS = ROOT / "claims.json"
RECEIPT = ROOT / "generated/provider-receipt.json"
PROVIDER_RECEIPTS = ROOT / "generated/provider-receipts"
REFINEMENT = ROOT / "refinement/generated/refinement-receipt.json"
EXPLORATION = ROOT / "exploration/generated/exploration-receipt.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    evf_root = REPO / "cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/residuality-specialization-candidate-v1"
    evf_replay = subprocess.run(
        [sys.executable, str(evf_root / "adapters/candidate_013.py"), "--check"],
        cwd=REPO,
        text=True,
        capture_output=True,
        timeout=60,
        check=False,
    )
    if evf_replay.returncode != 0:
        errors.append("evf-native-replay: " + (evf_replay.stdout + evf_replay.stderr).strip())
    try:
        evf_receipt = json.loads((evf_root / "generated/candidate-013-residual-path-receipt.json").read_text())
        if evf_receipt.get("aggregate_readiness") != "BLOCK":
            errors.append("EVF-native readiness gate did not remain BLOCK")
        evf_coverage = evf_receipt.get("coverage", {})
        if evf_coverage.get("specification_closed_paths") != 15:
            errors.append("EVF-native path specification closure drift")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"EVF-native receipt unreadable: {exc}")
    adversarial = subprocess.run(
        [sys.executable, str(ROOT / "enumerate_paths.py"), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=60,
        check=False,
    )
    if adversarial.returncode != 0:
        errors.append("adversarial-coverage-check: " + (adversarial.stdout + adversarial.stderr).strip())
    checked = subprocess.run(
        [sys.executable, str(ROOT / "author.py"), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=600,
        check=False,
    )
    if checked.returncode != 0:
        errors.append("author-check: " + (checked.stdout + checked.stderr).strip())
    refinement_validation = subprocess.run(
        [sys.executable, str(ROOT / "refinement/validate.py")],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=1200,
        check=False,
    )
    if refinement_validation.returncode != 0:
        errors.append("rust-refinement: " + (refinement_validation.stdout + refinement_validation.stderr).strip())
    exploration_validation = subprocess.run(
        [sys.executable, str(ROOT / "exploration/validate.py")],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=60,
        check=False,
    )
    if exploration_validation.returncode != 0:
        errors.append("bounded-exploration: " + (exploration_validation.stdout + exploration_validation.stderr).strip())

    try:
        claims = json.loads(CLAIMS.read_text())
        receipt = json.loads(RECEIPT.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"result": "BLOCK", "errors": [str(exc)], "authority_effect": "none"}, indent=2))
        return 1

    if receipt.get("claims_sha256") != digest(CLAIMS):
        errors.append("claims digest drift")
    coverage = receipt.get("formal_obligation_coverage", {})
    required_obligations = claims["required_obligations"]
    required_ids = [item["obligation_id"] for item in required_obligations]
    if coverage.get("required_obligation_count") != len(required_ids):
        errors.append("required obligation count drift")
    if coverage.get("discharged_obligation_count") != len(required_ids):
        errors.append("one or more semantic obligations are not discharged")
    if coverage.get("undischarged_obligations"):
        errors.append("undischarged obligations: " + ",".join(coverage["undischarged_obligations"]))
    if coverage.get("status") != "PASS_BOUNDED" or coverage.get("complete") is not True:
        errors.append("formal obligation coverage is incomplete")

    provider_results: dict[str, object] = {}
    selected_providers = receipt.get("provider_selection", {}).get("selected", [])
    for provider in selected_providers:
        path = PROVIDER_RECEIPTS / f"{provider}.json"
        if not path.is_file():
            errors.append(f"missing selected projection receipt: {provider}")
            continue
        provider_receipt = json.loads(path.read_text())
        provider_results[provider] = {
            "status": provider_receipt.get("status"),
            "two_run_determinism": provider_receipt.get("two_run_determinism"),
            "pinned_projection": provider_receipt.get("pinned_projection"),
            "execution_count": provider_receipt.get("execution_count"),
            "receipt_sha256": digest(path),
        }
        if provider_receipt.get("status") != "PASS_BOUNDED":
            errors.append(f"selected projection did not pass: {provider}")
        if provider_receipt.get("two_run_determinism") is not True:
            errors.append(f"selected projection was not deterministic: {provider}")
        if provider_receipt.get("pinned_projection") is not True:
            errors.append(f"selected projection drifted: {provider}")
        if provider_receipt.get("execution_count") != 2:
            errors.append(f"selected projection execution count drift: {provider}")
        if provider_receipt.get("authority_effect") != "none":
            errors.append(f"provider authority inflation: {provider}")

    residue_by_id = {item["residue_id"]: item for item in receipt.get("residues", [])}
    required_residues = {"rust-model-preservation", "finalized-devnet-observation"}
    if set(residue_by_id) != required_residues:
        errors.append("aggregate residue set drift")
    for residue_id in sorted(required_residues):
        if residue_by_id.get(residue_id, {}).get("status") != "not_evaluable":
            errors.append(f"residue status inflated: {residue_id}")
    if receipt.get("status") != "not_evaluable":
        errors.append("aggregate status must remain not_evaluable")
    if receipt.get("authority_effect") != claims.get("authority_effect") or receipt.get("authority_effect") != "none":
        errors.append("authority inflation")

    refinement_receipt: dict[str, object] = {}
    try:
        refinement_receipt = json.loads(REFINEMENT.read_text())
        if refinement_receipt.get("status") != "PASS_BOUNDED":
            errors.append("Rust refinement receipt is not PASS_BOUNDED")
        if refinement_receipt.get("coverage", {}).get("preserved_obligations") != len(required_ids):
            errors.append("Rust refinement does not preserve every formal obligation")
        if refinement_receipt.get("baseline", {}).get("claims_sha256") != receipt.get("claims_sha256"):
            errors.append("Rust refinement claims baseline drift")
        if refinement_receipt.get("baseline", {}).get("formal_receipt_sha256") != digest(RECEIPT):
            errors.append("Rust refinement formal receipt baseline drift")
        if refinement_receipt.get("authority_effect") != "none" or refinement_receipt.get("external_effect") != "none":
            errors.append("Rust refinement authority inflation")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"Rust refinement receipt unreadable: {exc}")

    exploration_receipt: dict[str, object] = {}
    try:
        exploration_receipt = json.loads(EXPLORATION.read_text())
        if exploration_receipt.get("status") != "PASS_BOUNDED":
            errors.append("bounded exploration receipt is not PASS_BOUNDED")
        if exploration_receipt.get("finite_universe", {}).get("enumerated_states") != 120:
            errors.append("bounded exploration universe drift")
        if exploration_receipt.get("authority_effect") != "none" or exploration_receipt.get("external_effect") != "none":
            errors.append("bounded exploration authority inflation")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"bounded exploration receipt unreadable: {exc}")

    reported_residues = []
    for residue_id in sorted(residue_by_id):
        item = dict(residue_by_id[residue_id])
        if residue_id == "rust-model-preservation" and not any(error.startswith("rust-refinement:") or error.startswith("Rust refinement") for error in errors):
            item["status"] = "PASS_BOUNDED"
            item["causal_blocker"] = "Closed by the exact local trace and focused-test refinement receipt; its bounded claim ceiling remains in force."
            item["receipt_sha256"] = digest(REFINEMENT)
        reported_residues.append(item)

    result = {
        "result": "BLOCK" if errors else "not_evaluable",
        "product_candidate_readiness": evf_receipt.get("aggregate_readiness", "unknown") if "evf_receipt" in locals() else "unknown",
        "evf_native_coverage": evf_coverage if "evf_coverage" in locals() else {},
        "adversarial_path_coverage": "PASS_SPEC_CLOSURE" if adversarial.returncode == 0 else "BLOCK",
        "formal_obligation_coverage": coverage.get("status"),
        "rust_refinement": refinement_receipt.get("status", "unknown"),
        "rust_refinement_receipt_sha256": digest(REFINEMENT) if REFINEMENT.is_file() else None,
        "bounded_exploration": exploration_receipt.get("status", "unknown"),
        "bounded_exploration_receipt_sha256": digest(EXPLORATION) if EXPLORATION.is_file() else None,
        "obligations_required": len(required_ids),
        "obligations_discharged": coverage.get("discharged_obligation_count"),
        "undischarged_obligations": coverage.get("undischarged_obligations", []),
        "selected_provider_results": provider_results,
        "residues": reported_residues,
        "claims_sha256": receipt.get("claims_sha256"),
        "aggregate_receipt_sha256": digest(RECEIPT),
        "binding_material_digest": receipt.get("binding_material_digest"),
        "continuation_packet_digest": receipt.get("continuation_packet_digest"),
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(result, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
