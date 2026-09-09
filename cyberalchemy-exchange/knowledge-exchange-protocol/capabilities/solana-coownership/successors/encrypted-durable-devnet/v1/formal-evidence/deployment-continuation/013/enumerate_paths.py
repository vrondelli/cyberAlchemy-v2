#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL = ROOT / "adversarial-model.json"
RECEIPT = ROOT / "generated/adversarial-coverage-receipt.json"


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def evaluate(model: dict[str, object]) -> dict[str, object]:
    paths = sorted(model["paths"], key=lambda item: item["path_id"])
    issues: list[str] = []
    ids = [item["path_id"] for item in paths]
    if len(ids) != len(set(ids)) or len(ids) != model["finite_universe"]["path_count"]:
        issues.append("path-inventory-cardinality-or-identity-drift")
    matrix = []
    for path in paths:
        local: list[str] = []
        if path["applicability"] == "reachable" and path["safety_relevant"]:
            if not path.get("residue_owner") or not path.get("desired_residue"):
                local.append("reachable-safety-path-without-owned-residue")
            if not path.get("obligations"):
                local.append("reachable-safety-path-without-obligation")
            if not path.get("evidence_kinds"):
                local.append("reachable-safety-path-without-evidence-kind")
        if path["applicability"] == "excluded" and not path.get("exclusion_rationale"):
            local.append("excluded-path-without-rationale")
        issues.extend(f"{path['path_id']}:{issue}" for issue in local)
        matrix.append({
            "path_id": path["path_id"],
            "applicability": path["applicability"],
            "attractor": path["attractor"],
            "residue_owner": path.get("residue_owner"),
            "desired_residue": path.get("desired_residue"),
            "obligations": path.get("obligations", []),
            "evidence_kinds": path.get("evidence_kinds", []),
            "status": "CLOSED_BY_SPEC" if not local else "UNCOVERED"
        })
    reachable = [item for item in matrix if item["applicability"] == "reachable"]
    excluded = [item for item in matrix if item["applicability"] == "excluded"]
    return {
        "schema_version": "cav2-kep-adversarial-path-coverage-receipt/v1",
        "model_id": model["model_id"],
        "model_sha256": sha(MODEL),
        "baseline": model["baseline"],
        "path_inventory": ids,
        "path_residue_obligation_matrix": matrix,
        "coverage": {
            "declared_paths": len(paths),
            "reachable_paths": len(reachable),
            "excluded_paths": len(excluded),
            "closed_by_spec_paths": sum(item["status"] == "CLOSED_BY_SPEC" for item in matrix),
            "uncovered_paths": [item["path_id"] for item in matrix if item["status"] == "UNCOVERED"],
            "completeness_scope": "exact declared fifteen-path equivalence-class universe only"
        },
        "provider_adequacy": {
            "policy": model["provider_policy"]["rule"],
            "existing_selected_provider": model["provider_policy"]["existing_selected_provider"],
            "named_provider_mandates_added": [],
            "unproven_evidence_kinds_remain_residue": True
        },
        "aggregate_readiness": "BLOCK" if issues else "NOT_EVALUABLE",
        "aggregate_residues": [
            {"residue_id":"path-evidence-execution","status":"not_evaluable","causal_blocker":"The path matrix specifies obligations but this run does not execute the required implementation tests, bounded exploration, runtime observations, or operational controls."},
            {"residue_id":"rust-model-preservation","status":"not_evaluable","causal_blocker":"The unchanged v3 baseline has no exact evidence that candidate 013 Rust preserves the bounded formal obligations."},
            {"residue_id":"finalized-devnet-observation","status":"not_evaluable","causal_blocker":"No credential, RPC, signing, submission, or deployment effect is authorized or executed."}
        ],
        "issues": issues,
        "authority_effect": "none",
        "claim_ceiling": "Complete specification closure for the exact declared path universe only; no claim that required evidence ran, no runtime completeness, product approval, acceptance, admission, or operational authority."
    }


def build() -> bytes:
    model = json.loads(MODEL.read_text())
    baseline = model["baseline"]
    if sha(ROOT / baseline["claims_path"]) != baseline["claims_sha256"]:
        raise ValueError("stale v3 claims baseline")
    if sha(ROOT / baseline["aggregate_receipt_path"]) != baseline["aggregate_receipt_sha256"]:
        raise ValueError("stale v3 aggregate receipt baseline")
    repo = ROOT.parents[10]
    specialization = model["specialization"]
    if sha(repo / specialization["path"]) != specialization["sha256"]:
        raise ValueError("stale EVF Residuality specialization")
    return canonical(evaluate(model))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        data = build()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"BLOCK: {exc}")
        return 1
    if args.check:
        if not RECEIPT.is_file() or RECEIPT.read_bytes() != data:
            print("BLOCK: adversarial coverage receipt drift")
            return 1
    else:
        RECEIPT.parent.mkdir(parents=True, exist_ok=True)
        RECEIPT.write_bytes(data)
    receipt = json.loads(data)
    print(f"{receipt['aggregate_readiness']}: {receipt['coverage']['closed_by_spec_paths']}/{receipt['coverage']['declared_paths']} declared paths closed by specification")
    return 1 if receipt["issues"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
