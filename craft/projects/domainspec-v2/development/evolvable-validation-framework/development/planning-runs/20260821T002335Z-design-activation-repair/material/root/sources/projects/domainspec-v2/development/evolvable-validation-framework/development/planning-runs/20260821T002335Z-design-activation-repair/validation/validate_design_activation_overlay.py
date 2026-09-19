#!/usr/bin/env python3
"""Fail closed when a selected Design pass coexists with stale Plan blocker text."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


EXPECTED_FILES = {
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN.md": "87634374e9316ea4a8aebbc8fa35cfa1ee53d46025241832f3c263e390733464",
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-SCOPE-MANIFEST.json": "bc57ed4b15af3e67ba7699a3c518ee3561d9c4fc170366f64ec30989edb4e0cb",
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-DENOMINATOR-RECEIPT.replay.json": "17496baae45d48049b34554f247ab2758dc4eea808b0df2253fcdf666a96f38d",
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-AUTHORED-CONCERNS.json": "42f024f0dc3df4228446b02702b5550f88e89bb0b29669370fa845b8fb0c8ff1",
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-PLANNED-WITNESSES.json": "897f0be6891e6af63e8aacf15333f33cb8160e70081b5c78898e938e7fa443ab",
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-SELECTION-RESULT.json": "33820927aed1a3636fa0cefcac3370e201ae6acc5640e34bfc19ee116c451d13",
    "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-SELECTION-RESULT.replay.json": "33820927aed1a3636fa0cefcac3370e201ae6acc5640e34bfc19ee116c451d13",
    "projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260820T173249Z-post-l0-l1-plan/POSTIMAGE-INVENTORY.json": "0c25e4777f84186bfe2383313d24cca033e42163da0bea39cc8ed3a2ce9fb045",
    "projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260820T173249Z-post-l0-l1-plan/reviews/PLAN-INDEPENDENT-REVIEW-003.json": "89068b678d4cfd5566a6b02c68e461ee01c61f0f8cab18dd043d7dd38c70eed4",
}

BASE_INVENTORY = "projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260820T173249Z-post-l0-l1-plan/POSTIMAGE-INVENTORY.json"
OVERLAY_INVENTORY = "projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260821T002335Z-design-activation-repair/OVERLAY-INVENTORY.json"
CONTEXT_INDEX = "projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260821T002335Z-design-activation-repair/context-builder/context-index.json"

STALE_PATTERNS = (
    r"proposal-blocked-on-design-validation",
    r"no\s+`DesignSelectionResult`\s+or\s+`design-validator-pass`\s+exists",
    r"No\s+validator-owned\s+`design-validator-pass`\s+or\s+selected\s+Design\s+binding\s+exists",
    r"current\s+Design\s+is\s+authored\s+candidate\s+material\s+without",
    r"Design\s+validator/selection\s+absent",
    r"Design\s+validation/selection,\s+independent\s+review",
    r"normal\s+Plan\s+handoff\s+remains\s+blocked\s+on\s+a\s+validator-owned\s+Design\s+pass",
    r"obtain\s+a\s+validator-owned\s+`design-validator-pass`",
    r"authored-design-awaiting-validator-pass-and-selection",
)


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest_file(path: Path) -> str:
    return digest_bytes(path.read_bytes())


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def canonical_digest(value: object) -> str:
    return digest_bytes(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(args.repo_root).resolve()
    failures: list[str] = []
    checks: list[dict] = []

    for rel, expected in EXPECTED_FILES.items():
        path = root / rel
        actual = digest_file(path) if path.is_file() else "missing"
        if actual != expected:
            failures.append(f"STALE_OR_MISSING_INPUT:{rel}:{expected}:{actual}")
    checks.append({"check": "exact-input-bindings", "status": "pass" if not failures else "fail", "count": len(EXPECTED_FILES)})

    manifest = load(root / "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-SCOPE-MANIFEST.json")
    denominator = load(root / "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-DENOMINATOR-RECEIPT.replay.json")
    selection_path = root / "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-SELECTION-RESULT.json"
    selection = load(selection_path)
    selection_replay = root / "projects/domainspec-v2/development/evolvable-validation-framework/DESIGN-SELECTION-RESULT.replay.json"
    selection_errors = []
    if selection.get("verdict") != "pass" or selection.get("evidence_state") != "design-validator-pass" or selection.get("fixed_point") is not True:
        selection_errors.append("DESIGN_SELECTION_NOT_PASS")
    if selection.get("pass_1_digest") != selection.get("pass_2_digest"):
        selection_errors.append("DESIGN_SELECTION_NOT_FIXED_POINT")
    if selection.get("manifest_input_digest") != manifest.get("input_digest"):
        selection_errors.append("MANIFEST_DIGEST_MISMATCH")
    if selection.get("denominator_receipt_digest") != denominator.get("receipt_digest"):
        selection_errors.append("DENOMINATOR_DIGEST_MISMATCH")
    computed_result = canonical_digest({k: v for k, v in selection.items() if k != "result_digest"})
    if computed_result != selection.get("result_digest"):
        selection_errors.append("SELECTION_RESULT_DIGEST_MISMATCH")
    if selection_path.read_bytes() != selection_replay.read_bytes():
        selection_errors.append("SELECTION_REPLAY_MISMATCH")
    failures.extend(selection_errors)
    checks.append({"check": "design-selection", "status": "pass" if not selection_errors else "fail", "result_digest": selection.get("result_digest")})

    base = load(root / BASE_INVENTORY)
    overlay = load(root / OVERLAY_INVENTORY)
    override_rows = {row["canonical_path"]: row for row in overlay["overrides"]}
    if set(override_rows) != {
        "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md",
        "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md",
        "projects/domainspec-v2/development/evolvable-validation-framework/work-pack/target-inventory.l1.json",
        "projects/domainspec-v2/development/evolvable-validation-framework/work-pack/shared/GAPS.md",
        "projects/domainspec-v2/development/evolvable-validation-framework/work-pack/shared/CROSS-TASK-GAPS.md",
    }:
        failures.append("OVERLAY_TARGET_SET_MISMATCH")
    if overlay.get("overlay_target_count") != len(override_rows) or overlay.get("reused_base_target_count") != 20 - len(override_rows):
        failures.append("OVERLAY_COUNT_MISMATCH")
    overlay_state_ok = (
        overlay.get("validation_state") == "pass-local-overlay-validation-awaiting-independent-review"
        and overlay.get("independent_review") == "required-renewed-review"
        and overlay.get("owner_acceptance") == "required-after-renewed-review"
        and overlay.get("canonical_apply") == "not-authorized"
        and overlay.get("mutation_ready") is False
        and overlay.get("old_package_reusable") is False
    )
    if not overlay_state_ok:
        failures.append("OVERLAY_LIFECYCLE_STATE_MISMATCH")
    checks.append({"check": "overlay-lifecycle-state", "status": "pass" if overlay_state_ok else "fail"})

    complete_rows = []
    resolved_paths: list[Path] = []
    baseline_errors = []
    for target in base["targets"]:
        canonical = root / target["canonical_path"]
        baseline = target["baseline"]
        if baseline["state"] == "present":
            actual = digest_file(canonical) if canonical.is_file() else "missing"
            if actual != baseline["sha256"]:
                baseline_errors.append(f"BASELINE_MISMATCH:{target['canonical_path']}")
        elif canonical.exists():
            baseline_errors.append(f"EXPECTED_ABSENT_BASELINE:{target['canonical_path']}")
        base_postimage = root / target["postimage"]["path"]
        if digest_file(base_postimage) != target["postimage"]["sha256"] or base_postimage.stat().st_size != target["postimage"]["size_bytes"]:
            baseline_errors.append(f"BASE_POSTIMAGE_MISMATCH:{target['canonical_path']}")
        override = override_rows.get(target["canonical_path"])
        if override:
            repaired = root / override["repaired_postimage"]["path"]
            expected_sha = override["repaired_postimage"]["sha256"]
            expected_size = override["repaired_postimage"]["size_bytes"]
            if digest_file(repaired) != expected_sha or repaired.stat().st_size != expected_size:
                baseline_errors.append(f"REPAIRED_POSTIMAGE_MISMATCH:{target['canonical_path']}")
        else:
            repaired = base_postimage
            expected_sha = target["postimage"]["sha256"]
            expected_size = target["postimage"]["size_bytes"]
        resolved_paths.append(repaired)
        complete_rows.append({"canonical_path": target["canonical_path"], "postimage_sha256": expected_sha, "postimage_size_bytes": expected_size})
    failures.extend(baseline_errors)
    package_digest = canonical_digest(complete_rows)
    if package_digest != overlay.get("package_digest") or len(complete_rows) != 20:
        failures.append("RECOMPOSED_PACKAGE_DIGEST_MISMATCH")
    checks.append({"check": "overlay-and-baselines", "status": "pass" if not baseline_errors and package_digest == overlay.get("package_digest") and overlay.get("overlay_target_count") == len(override_rows) and overlay.get("reused_base_target_count") == 20 - len(override_rows) else "fail", "package_digest": package_digest, "target_count": len(complete_rows), "overlay_target_count": len(override_rows)})

    repaired_inventory_path = root / override_rows["projects/domainspec-v2/development/evolvable-validation-framework/work-pack/target-inventory.l1.json"]["repaired_postimage"]["path"]
    repaired_inventory = load(repaired_inventory_path)
    immutable_by_path = {row["path"]: row for row in repaired_inventory.get("immutable_inputs", [])}
    design_inventory_errors = []
    for rel, expected in list(EXPECTED_FILES.items())[:7]:
        row = immutable_by_path.get(rel)
        if row is None or row.get("sha256") != expected:
            design_inventory_errors.append(rel)
    design_row = immutable_by_path.get("projects/domainspec-v2/development/evolvable-validation-framework/DESIGN.md", {})
    if design_row.get("role") != "unchanged-selected-design":
        design_inventory_errors.append("DESIGN_ROLE")
    if design_inventory_errors:
        failures.append("DESIGN_EVIDENCE_INVENTORY_MISMATCH")
    checks.append({"check": "design-evidence-inventory", "status": "pass" if not design_inventory_errors else "fail", "failures": design_inventory_errors})

    stale_hits = []
    hygiene_errors = []
    for path in resolved_paths:
        data = path.read_bytes()
        text = data.decode("utf-8")
        if data.startswith(b"\xef\xbb\xbf") or not data.endswith(b"\n") or any(line.endswith((" ", "\t")) for line in text.splitlines()):
            hygiene_errors.append(str(path.relative_to(root)))
        for pattern in STALE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
                stale_hits.append({"path": str(path.relative_to(root)), "pattern": pattern})
    if stale_hits:
        failures.append("STALE_DESIGN_ACTIVATION_WORDING")
    if hygiene_errors:
        failures.append("TEXT_HYGIENE_FAILURE")
    checks.append({"check": "design-state-regression", "status": "pass" if not stale_hits else "fail", "stale_hits": stale_hits})
    checks.append({"check": "text-hygiene", "status": "pass" if not hygiene_errors else "fail", "failures": hygiene_errors})

    context = load(root / CONTEXT_INDEX)
    obligation = {row["id"]: row["status"] for row in context.get("obligations", [])}
    state = context.get("output_state", {})
    context_ok = (
        obligation.get("O0-design-activation") == "covered"
        and obligation.get("O9-renewed-plan-review") == "blocked"
        and state.get("design_evidence_state") == "design-validator-pass"
        and state.get("independent_review") == "pending-renewed-review"
        and state.get("canonical_apply") == "not-authorized"
        and state.get("mutation_ready") is False
    )
    if not context_ok:
        failures.append("CONTEXT_STATE_MISMATCH")
    checks.append({"check": "superseding-context-state", "status": "pass" if context_ok else "fail"})

    result = {
        "schema_version": "evf.design-activation-overlay-validation/v1",
        "run_id": "20260821T002335Z-design-activation-repair",
        "verdict": "pass" if not failures else "fail",
        "checks": checks,
        "failures": failures,
        "claim_ceiling": "Proposal-only staged repair validation; no independent review, owner acceptance, canonical apply, readiness, implementation, release, or production claim."
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
