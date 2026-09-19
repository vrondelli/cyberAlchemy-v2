#!/usr/bin/env python3
"""Validate the DS-SFOL Financial Settlement blocker-clearance plan."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SWUS = [f"SWU-SFOL-BC-{index:03d}" for index in range(1, 6)]
FILES = [
    "README.md",
    "CONTEXT-PACK.md",
    "context-pack.json",
    "plan-contract.json",
    "IMPLEMENTATION-LAYERING.md",
    "EXECUTION-PACK.md",
    "WORK-PACK.md",
    "DISPATCH-TRACE.md",
    "execution.dispatch.json",
    "DISTILL-VALIDATION.md",
    "INVOKE-RESULT.md",
    "tasks/TASK-SFOL-LOGIC-PROFILE.md",
    "tasks/TASK-SFOL-SOURCE-ADMISSION.md",
    "tasks/TASK-SFOL-EFFECT-PROOF.md",
    "tasks/TASK-SFOL-FS-BUILD.md",
    "tasks/TASK-SFOL-FS-ADOPTION.md",
]


def main() -> int:
    errors: list[str] = []
    for relative in FILES:
        path = ROOT / relative
        if not path.is_file() or not path.read_text(encoding="utf-8").strip():
            errors.append(f"missing or empty: {relative}")

    work_pack = (ROOT / "WORK-PACK.md").read_text(encoding="utf-8")
    for control in (
        "| complexity | medium |",
        "| outputMode | split |",
        "| swuAtomicityStatus | pass |",
        "| firstUnitNarrownessStatus | pass |",
        "| closeoutSyncStatus | pass |",
    ):
        if control not in work_pack:
            errors.append(f"missing control: {control}")
    if "selected:SWU-SFOL-BC-001" not in work_pack:
        errors.append("first selected SWU is not BC-001")

    task_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted((ROOT / "tasks").glob("TASK-*.md"))
    )
    required = (
        "Primary behavior:",
        "Split analysis:",
        "Write scope:",
        "Done criteria:",
        "Acceptance evidence:",
        "Validation surface:",
        "Execution owner:",
        "Handoff:",
    )
    for swu in SWUS:
        if task_text.count(f"## {swu}") != 1:
            errors.append(f"{swu} must have one task contract")
        if swu not in work_pack:
            errors.append(f"{swu} missing from work pack")
    for path in sorted((ROOT / "tasks").glob("TASK-*.md")):
        text = path.read_text(encoding="utf-8")
        for token in required:
            if token not in text:
                errors.append(f"{path.name} lacks {token}")

    context = json.loads((ROOT / "context-pack.json").read_text(encoding="utf-8"))
    if context.get("coverage", {}).get("status") != "pass":
        errors.append("context coverage is not pass")
    for raw in context.get("selected_sources", []):
        if not (ROOT / raw).resolve().is_file():
            errors.append(f"selected context source does not exist: {raw}")
    swu010_receipt_path = (
        ROOT / "../closeouts/SWU-SFOL-010/INVOKE-REFRESH-RECEIPT.json"
    ).resolve()
    if swu010_receipt_path.is_file():
        swu010_receipt = json.loads(
            swu010_receipt_path.read_text(encoding="utf-8")
        )
        if (
            swu010_receipt.get("result") != "pass"
            or swu010_receipt.get("stateTransition", {}).get("completedSwu")
            != "SWU-SFOL-010"
        ):
            errors.append("selected BC-001 dependency receipt is not passing SWU-SFOL-010")
    else:
        errors.append("selected BC-001 dependency receipt is missing")

    plan = json.loads((ROOT / "plan-contract.json").read_text(encoding="utf-8"))
    if plan.get("status") != "pass":
        errors.append("plan contract status is not pass")
    ordered = plan.get("execution_policy_order")
    if ordered != SWUS:
        errors.append("execution policy order is not the exact five-SWU set")
    swu_by_id = {entry.get("id"): entry for entry in plan.get("swus", [])}
    if list(swu_by_id) != SWUS:
        errors.append("plan SWU registry is not ordered and exact")
    expected_dependencies = {
        "SWU-SFOL-BC-001": ["SWU-SFOL-010"],
        "SWU-SFOL-BC-002": [],
        "SWU-SFOL-BC-003": [
            "SWU-SFOL-008",
            "SWU-SFOL-009",
            "SWU-SFOL-010",
        ],
        "SWU-SFOL-BC-004": ["SWU-SFOL-BC-001", "SWU-SFOL-BC-002"],
        "SWU-SFOL-BC-005": ["SWU-SFOL-BC-003", "SWU-SFOL-BC-004"],
    }
    for swu, dependencies in expected_dependencies.items():
        if swu_by_id.get(swu, {}).get("dependencies") != dependencies:
            errors.append(f"dependency mismatch: {swu}")
    gates = {entry.get("id"): entry for entry in plan.get("gates", [])}
    formal = gates.get("G-SFOL-01", {})
    experimental = gates.get("G-SFOL-01-EXP", {})
    if formal.get("status") != "open" or formal.get("owner") != [
        "finance-core",
        "backend-core",
    ]:
        errors.append("formal G-SFOL-01 owner/open boundary is invalid")
    if (
        experimental.get("authority_effect") != "none"
        or experimental.get("scope") != "experimental-test-lane"
    ):
        errors.append("experimental source gate can affect formal authority")
    if plan.get("release_admission") != "not-granted":
        errors.append("release admission must remain not-granted")

    distill = (ROOT / "DISTILL-VALIDATION.md").read_text(encoding="utf-8")
    invoke = (ROOT / "INVOKE-RESULT.md").read_text(encoding="utf-8")
    if "Final verdict: pass" not in distill:
        errors.append("Distill final verdict is not pass")
    if "- Phase status: pass" not in invoke:
        errors.append("Invoke phase status is not pass")
    if "| workPackGateStatus | pass |" not in work_pack:
        errors.append("work-pack gate is not pass")
    if "| distillValidationStatus | pass |" not in work_pack:
        errors.append("work-pack Distill status is not pass")

    all_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in ROOT.rglob("*")
        if path.is_file() and path.suffix in {".md", ".json"}
    )
    if "logic bytes" in all_text:
        errors.append("stale logic-byte preservation claim remains")
    build_task = (
        ROOT / "tasks/TASK-SFOL-FS-BUILD.md"
    ).read_text(encoding="utf-8")
    if "G-SFOL-01/G-SFOL-06" in build_task:
        errors.append("BC-004 still claims formal gate closure")
    effect_task = (
        ROOT / "tasks/TASK-SFOL-EFFECT-PROOF.md"
    ).read_text(encoding="utf-8")
    for token in (
        "EffectContractAdmission",
        "unadmitted trace contract",
        "contract/source digest mismatch",
        "proof context",
    ):
        if token not in effect_task:
            errors.append(f"effect contract source binding lacks: {token}")
    adoption_task = (
        ROOT / "tasks/TASK-SFOL-FS-ADOPTION.md"
    ).read_text(encoding="utf-8")
    for token in (
        "adoption-report.schema.json",
        "validate-financial-settlement-sfol.ts",
        "schema digest",
        "validator/tool",
        "no added, removed, or changed paths",
        "impl/test-derivation-engine/src/sfol/**",
    ):
        if token not in adoption_task:
            errors.append(f"adoption contract lacks: {token}")

    dispatch = json.loads((ROOT / "execution.dispatch.json").read_text(encoding="utf-8"))
    if dispatch.get("subagent_strategy", {}).get("status") != "none":
        errors.append("unexpected subagent strategy")
    repository_root = ROOT.parents[4]
    dispatch_validator = (
        repository_root
        / "arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py"
    )
    dispatch_result = subprocess.run(
        [
            sys.executable,
            str(dispatch_validator),
            str(ROOT / "execution.dispatch.json"),
        ],
        cwd=repository_root,
        text=True,
        capture_output=True,
        check=False,
    )
    if dispatch_result.returncode != 0:
        errors.append(
            "canonical dispatch validation failed: "
            + (dispatch_result.stdout + dispatch_result.stderr).strip()
        )

    link = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
    for path in ROOT.rglob("*.md"):
        for raw in link.findall(path.read_text(encoding="utf-8")):
            target = raw.split("#", 1)[0]
            if not target or "://" in target:
                continue
            resolved = (path.parent / target).resolve()
            if not resolved.exists():
                errors.append(f"broken link in {path.relative_to(ROOT)}: {raw}")

    if errors:
        print("DS-SFOL blocker-clearance plan: BLOCK")
        for error in errors:
            print(f"- {error}")
        return 1
    print("DS-SFOL blocker-clearance plan: PASS (5 ordered SWUs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
