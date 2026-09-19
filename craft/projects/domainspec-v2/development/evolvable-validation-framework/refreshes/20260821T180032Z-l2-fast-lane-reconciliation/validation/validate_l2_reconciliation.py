#!/usr/bin/env python3
"""Validate the exact EVF L2 fast-lane reconciliation postimages."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import yaml


TARGET_BASELINES = {
    "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md":
        ("e9bd903b9f4dbec61f013bbe3a412af282cd54b49a9383cd5496cf80c7ad65fa", 4367),
    "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md":
        ("d6608b675fb02f29db078415997da273e8472f270479846602669a976ead29a5", 8271),
    "projects/domainspec-v2/development/evolvable-validation-framework/IMPLEMENTATION-LAYERING.md":
        ("edc2d4458ef4b296764277823ad0c78f52d9a148c6040d20fc2758a76b269a6b", 3269),
    "projects/domainspec-v2/development/evolvable-validation-framework/EXECUTION-PACK.md":
        ("9345adbd143c2bfde6534e7ad7179e769ad15e2a14fce1f63200eaab9a66580a", 1449),
    "projects/domainspec-v2/.craft/ledger.yml":
        ("eb45345811cb4c0c5eee530340266d57fa7907fb29915a43521236aa5b0e298f", 197262),
    "projects/domainspec-v2/CRAFT.md":
        ("7a7075b6e71bcc8e40190f3b8347272f0a5fd70b81dc211fcea90a7899585887", 22307),
}

EVF_ROOT = Path(
    "projects/domainspec-v2/development/evolvable-validation-framework"
)
CLOSURE = EVF_ROOT / (
    "development/refinement-runs/20260821T044428Z-evf-l2-one-shot-work-pack/"
    "closure-runs/attempt-001/INDEPENDENT-CLOSURE-RECEIPT.json"
)
L2_INVENTORY = EVF_ROOT / (
    "development/refinement-runs/20260821T044428Z-evf-l2-one-shot-work-pack/"
    "plan-candidate/work-pack/target-inventory.l2.json"
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact_ref_errors(repo: Path, value: Any) -> tuple[int, list[str]]:
    checked = 0
    errors: list[str] = []

    def visit(node: Any) -> None:
        nonlocal checked
        if isinstance(node, dict):
            if set(("path", "sha256", "size_bytes")).issubset(node):
                path = node["path"]
                if isinstance(path, str):
                    checked += 1
                    target = repo / path
                    if not target.is_file():
                        errors.append(f"EXACT_REF_MISSING:{path}")
                    else:
                        content = target.read_bytes()
                        if digest(content) != node["sha256"]:
                            errors.append(f"EXACT_REF_DIGEST_MISMATCH:{path}")
                        if len(content) != node["size_bytes"]:
                            errors.append(f"EXACT_REF_SIZE_MISMATCH:{path}")
            for child in node.values():
                visit(child)
        elif isinstance(node, list):
            for child in node:
                visit(child)

    visit(value)
    return checked, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--material-root", required=True)
    parser.add_argument("--phase", choices=("staged", "postapply"), required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    repo = Path(args.repo_root).resolve()
    material = Path(args.material_root).resolve()
    errors: list[str] = []
    checks: list[dict[str, Any]] = []

    def record(check_id: str, local_errors: list[str]) -> None:
        errors.extend(local_errors)
        checks.append({
            "check_id": check_id,
            "status": "pass" if not local_errors else "fail",
            "reasons": local_errors,
        })

    baseline_errors: list[str] = []
    for path, (expected_hash, expected_size) in TARGET_BASELINES.items():
        target = repo / path
        if args.phase == "staged":
            if not target.is_file():
                baseline_errors.append(f"LIVE_BASELINE_MISSING:{path}")
                continue
            content = target.read_bytes()
            if (digest(content), len(content)) != (expected_hash, expected_size):
                baseline_errors.append(f"LIVE_BASELINE_DRIFT:{path}")
    record("live-baseline", baseline_errors)

    postimage_errors: list[str] = []
    postimages: dict[str, bytes] = {}
    for path in TARGET_BASELINES:
        staged = material / "outputs" / path
        if not staged.is_file():
            postimage_errors.append(f"POSTIMAGE_MISSING:{path}")
            continue
        content = staged.read_bytes()
        postimages[path] = content
        if not content:
            postimage_errors.append(f"POSTIMAGE_EMPTY:{path}")
        if args.phase == "postapply":
            live = repo / path
            if not live.is_file() or live.read_bytes() != content:
                postimage_errors.append(f"POSTAPPLY_PARITY_MISMATCH:{path}")
    record("postimage-parity", postimage_errors)

    hygiene_errors: list[str] = []
    for path, content in postimages.items():
        if content.startswith(b"\xef\xbb\xbf"):
            hygiene_errors.append(f"BOM:{path}")
        if b"\r\n" in content:
            hygiene_errors.append(f"CRLF:{path}")
        for line_number, line in enumerate(content.splitlines(), 1):
            if line.rstrip(b" \t") != line:
                hygiene_errors.append(f"TRAILING_WHITESPACE:{path}:{line_number}")
    record("postimage-hygiene", hygiene_errors)

    closure_path = repo / CLOSURE
    closure = json.loads(closure_path.read_text(encoding="utf-8"))
    closure_errors: list[str] = []
    if closure.get("status") != "flag" or closure.get("blockers") != []:
        closure_errors.append("CLOSURE_TOPOLOGY_MISMATCH")
    if len(closure.get("flags", [])) != 3:
        closure_errors.append("CLOSURE_FLAG_COUNT_MISMATCH")
    if closure.get("claim_ceiling") != (
        "property-specific-consistency-over-one-exact-shared-fact-snapshot-only"
    ):
        closure_errors.append("CLAIM_CEILING_MISMATCH")
    if closure.get("authority_effect") != "none":
        closure_errors.append("AUTHORITY_EFFECT_MISMATCH")
    if closure.get("release_admission") != "not-granted":
        closure_errors.append("RELEASE_ADMISSION_MISMATCH")
    exact_ref_count, exact_errors = exact_ref_errors(repo, closure)
    closure_errors.extend(exact_errors)
    if exact_ref_count != 35:
        closure_errors.append(f"EXACT_REF_DENOMINATOR:{exact_ref_count}:expected-35")
    record("independent-closure", closure_errors)

    inventory = json.loads((repo / L2_INVENTORY).read_text(encoding="utf-8"))
    deferred = inventory.get("deferred_governed_closeout_targets", {}).get(
        "create_targets", []
    )
    deferred_errors: list[str] = []
    if len(deferred) != 12:
        deferred_errors.append(f"DEFERRED_RECEIPT_DENOMINATOR:{len(deferred)}:expected-12")
    for path in deferred:
        if (repo / path).exists():
            deferred_errors.append(f"DEFERRED_RECEIPT_UNEXPECTEDLY_PRESENT:{path}")
    record("deferred-governed-receipts", deferred_errors)

    state_root = material / "outputs" if args.phase == "staged" else repo
    ledger_path = state_root / "projects/domainspec-v2/.craft/ledger.yml"
    ledger = yaml.safe_load(ledger_path.read_text(encoding="utf-8"))
    craft_errors: list[str] = []
    context = next(
        item for item in ledger["contexts"] if item["context_id"] == "CTX-DSV2-EVF"
    )
    indexed_move = next(
        item for item in ledger["indexes"]["next_moves"]
        if item["context_id"] == "CTX-DSV2-EVF"
    )
    if (context.get("stage"), context.get("gate")) != ("validated", "flag"):
        craft_errors.append("EVF_CONTEXT_STATE_MISMATCH")
    if context.get("next_move") != indexed_move.get("next_move"):
        craft_errors.append("EVF_NEXT_MOVE_PROJECTION_MISMATCH")
    for artifact_id, index in (
        ("ART-DSV2-EVF-L2-PROTOTYPE", 104),
        ("ART-DSV2-EVF-L2-CLOSURE", 105),
    ):
        pointer = ledger["indexes"]["by_id"].get(artifact_id)
        if pointer != f"artifacts[{index}]":
            craft_errors.append(f"ARTIFACT_POINTER_MISMATCH:{artifact_id}")
        elif ledger["artifacts"][index].get("artifact_id") != artifact_id:
            craft_errors.append(f"ARTIFACT_INDEX_MISMATCH:{artifact_id}")
        if artifact_id not in context.get("owned_artifacts", []):
            craft_errors.append(f"OWNED_ARTIFACT_MISSING:{artifact_id}")
    craft_text = (
        state_root / "projects/domainspec-v2/CRAFT.md"
    ).read_text(encoding="utf-8")
    for phrase in (
        "validated / flag",
        "one exact reachability property",
        "17-signature L3 denominator",
        "no L3 execution or release admission",
    ):
        if phrase not in craft_text:
            craft_errors.append(f"CRAFT_PROJECTION_MISSING:{phrase}")
    record("craft-projection", craft_errors)

    lifecycle_errors: list[str] = []
    docs = {
        path: content.decode("utf-8")
        for path, content in postimages.items()
        if path.endswith(".md")
    }
    combined = "\n".join(docs.values())
    for phrase in (
        "candidate-local-l2-reachability-validated-with-flags",
        "cycle and closure",
        "17-signature",
        "no L3 execution",
    ):
        if phrase not in combined:
            lifecycle_errors.append(f"LIFECYCLE_PROJECTION_MISSING:{phrase}")
    if "release_admission: granted" in combined or "production-ready" in combined:
        lifecycle_errors.append("CLAIM_INFLATION")
    record("projected-postapply-lifecycle", lifecycle_errors)

    result = {
        "schema_version": "evf-l2-reconciliation-validation/v1",
        "phase": args.phase,
        "status": "pass" if not errors else "block",
        "target_count": len(TARGET_BASELINES),
        "exact_refs_checked": exact_ref_count,
        "deferred_receipts_checked_absent": len(deferred),
        "checks": checks,
        "blockers": sorted(set(errors)),
        "claim_ceiling": (
            "property-specific-consistency-over-one-exact-shared-fact-snapshot-only"
        ),
        "authority_effect": "none",
        "release_admission": "not-granted",
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
