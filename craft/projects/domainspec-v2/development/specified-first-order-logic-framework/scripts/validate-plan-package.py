#!/usr/bin/env python3
"""Validate the DS-SFOL Invoke Define/Design/Plan package."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SWUS = [f"SWU-SFOL-{index:03d}" for index in range(1, 13)]
REQUIRED_FILES = [
    "README.md",
    "DISCOVERY-BASELINE.md",
    "INTENT-RECORD.md",
    "TEMPLATE-SELECTION.md",
    "SPEC.md",
    "GLOSSARY.md",
    "operations.md",
    "interfaces.md",
    "mappings.md",
    "states.md",
    "DESIGN.md",
    "GLOSSARY-CONSISTENCY.md",
    "DISPATCH-TRACE.md",
    "DISTILL-VALIDATION.md",
    "IMPLEMENTATION-LAYERING.md",
    "WORK-PACK.md",
    "EXECUTION-PACK.md",
    "INVOKE-EVIDENCE.json",
    "INVOKE-RESULT.md",
    "work-pack/shared/context.md",
    "work-pack/shared/cross-task-gaps.md",
    "work-pack/shared/cross-task-decisions.md",
    "work-pack/shared/traceability.md",
    "work-pack/waves/W0.md",
    "work-pack/waves/W1.md",
    "work-pack/waves/W2.md",
    "work-pack/waves/W3.md",
    "work-pack/tasks/TASK-SFOL-DENOMINATOR.md",
    "work-pack/tasks/TASK-SFOL-LANGUAGE.md",
    "work-pack/tasks/TASK-SFOL-PURE.md",
    "work-pack/tasks/TASK-SFOL-EFFECTS.md",
    "work-pack/tasks/TASK-SFOL-NODE-ADAPTER.md",
    "work-pack/tasks/TASK-SFOL-ADOPTION.md",
    "work-pack/tasks/TASK-SFOL-VERIFY.md",
]
TASK_FILES = [
    "work-pack/tasks/TASK-SFOL-DENOMINATOR.md",
    "work-pack/tasks/TASK-SFOL-LANGUAGE.md",
    "work-pack/tasks/TASK-SFOL-PURE.md",
    "work-pack/tasks/TASK-SFOL-EFFECTS.md",
    "work-pack/tasks/TASK-SFOL-NODE-ADAPTER.md",
    "work-pack/tasks/TASK-SFOL-ADOPTION.md",
]


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        path = ROOT / relative
        if not path.is_file() or path.stat().st_size == 0:
            fail(errors, f"missing or empty required file: {relative}")

    evidence_path = ROOT / "INVOKE-EVIDENCE.json"
    if evidence_path.is_file():
        try:
            evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            fail(errors, f"invalid INVOKE-EVIDENCE.json: {exc}")
            evidence = {}
        if evidence.get("schema_version") != "invoke-active-modes-evidence/v1":
            fail(errors, "unexpected evidence schema_version")
        for phase in ("define", "design", "plan"):
            if evidence.get(phase, {}).get("result") != "pass":
                fail(errors, f"{phase} result is not pass")
        manifest = evidence.get("plan", {}).get("swu_manifest")
        if manifest != EXPECTED_SWUS:
            fail(errors, "SWU manifest is not the ordered exact 001-012 set")
        if evidence.get("plan", {}).get("selected_swu") != "SWU-SFOL-001":
            fail(errors, "selected SWU is not SWU-SFOL-001")
        closeout = evidence.get("task_session_closeout", {})
        if closeout.get("status") != "pass":
            fail(errors, "closeout sync status is not pass")
        expected_chain = EXPECTED_SWUS + ["TASK-SFOL-VERIFY"]
        if closeout.get("successor_chain") != expected_chain:
            fail(errors, "closeout successor chain is incomplete or unordered")

    work_pack_path = ROOT / "WORK-PACK.md"
    if work_pack_path.is_file():
        work_pack = work_pack_path.read_text(encoding="utf-8")
        controls = [
            "| workPackGateStatus | pass |",
            "| complexity | medium |",
            "| outputMode | split |",
            "| distillValidationStatus | pass |",
            "| swuAtomicityStatus | pass |",
            "| firstUnitNarrownessStatus | pass |",
            "| closeoutSyncStatus | pass |",
        ]
        for control in controls:
            if control not in work_pack:
                fail(errors, f"missing work-pack control: {control}")
        for swu in EXPECTED_SWUS:
            if swu not in work_pack:
                fail(errors, f"work pack does not reference {swu}")
            receipt = f"closeouts/{swu}/INVOKE-REFRESH-RECEIPT.json"
            if receipt not in work_pack:
                fail(errors, f"work pack lacks exact closeout receipt for {swu}")

    task_text = ""
    for relative in TASK_FILES:
        path = ROOT / relative
        if path.is_file():
            text = path.read_text(encoding="utf-8")
            task_text += "\n" + text
            required_sections = [
                "## Objective",
                "## Source Contracts",
                "## Dependencies",
                "Split analysis:",
                "Write scope:",
                "Done criteria:",
                "Acceptance evidence:",
                "Validation surface:",
                "Execution owner:",
                "Handoff:",
            ]
            for section in required_sections:
                if section not in text:
                    fail(errors, f"{relative} lacks task contract field: {section}")

    for swu in EXPECTED_SWUS:
        if task_text.count(f"## {swu}") != 1:
            fail(errors, f"{swu} must have exactly one task-local contract")

    verify_path = ROOT / "work-pack/tasks/TASK-SFOL-VERIFY.md"
    if verify_path.is_file():
        verify = verify_path.read_text(encoding="utf-8")
        if "swuExemption: closure-only" not in verify:
            fail(errors, "verification task lacks closure-only SWU exemption")

    design_path = ROOT / "DESIGN.md"
    if design_path.is_file():
        design = design_path.read_text(encoding="utf-8")
        for view in range(1, 7):
            if f"## View {view}:" not in design:
                fail(errors, f"DESIGN.md lacks View {view}")

    canonical_source_checks = {
        "SPEC.md": [
            "## Node Authoring Contract",
            "canonical graph, source manifest, and build receipt",
        ],
        "DESIGN.md": [
            "Node-logic adapter",
            "D-SFOL-09",
        ],
        "WORK-PACK.md": [
            "TASK-SFOL-NODE-ADAPTER",
            "compatible node proof context",
        ],
    }
    for relative, required_tokens in canonical_source_checks.items():
        path = ROOT / relative
        if path.is_file():
            text = path.read_text(encoding="utf-8")
            for token in required_tokens:
                if token not in text:
                    fail(errors, f"{relative} lacks canonical-node token: {token}")

    forbidden_authority_patterns = {
        "TASK-SFOL-AUTHORING.md": "legacy Markdown-authoring task still present",
        "src/sfol/source/": "legacy direct-source implementation path still planned",
        "C_parsed": "legacy parser-stage exact-set member still active",
    }
    active_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix in {".md", ".json"}
        and "work-pack/session-evidence" not in path.as_posix()
    )
    for pattern, message in forbidden_authority_patterns.items():
        if pattern in active_text:
            fail(errors, message)

    markdown_link = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
    for markdown_path in ROOT.rglob("*.md"):
        if "/material/staged/" in markdown_path.as_posix():
            continue
        text = markdown_path.read_text(encoding="utf-8")
        for raw_target in markdown_link.findall(text):
            target = raw_target.strip().split("#", 1)[0]
            if not target or "://" in target or target.startswith("mailto:"):
                continue
            resolved = (markdown_path.parent / target).resolve()
            try:
                resolved.relative_to(ROOT)
            except ValueError:
                continue
            if not resolved.exists():
                relative = markdown_path.relative_to(ROOT)
                fail(errors, f"broken local link in {relative}: {raw_target}")

    forbidden_placeholders = re.compile(r"\{(?:module-name|date|path|name)\}")
    for path in ROOT.rglob("*"):
        if path.is_file() and path.suffix in {".md", ".json"}:
            if forbidden_placeholders.search(path.read_text(encoding="utf-8")):
                fail(errors, f"unresolved template placeholder in {path.relative_to(ROOT)}")

    if errors:
        print("DS-SFOL plan package: BLOCK")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "DS-SFOL plan package: PASS "
        f"({len(REQUIRED_FILES)} files, {len(EXPECTED_SWUS)} mutation SWUs, "
        "1 closure exemption)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
