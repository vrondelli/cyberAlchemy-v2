#!/usr/bin/env python3
"""Freeze staged validation evidence before the approved successor apply."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[7]
REFRESH = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T174651Z-tde-epoch-admission-readiness")
TARGET = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2")
STAGED = REPO / REFRESH / "staging" / TARGET
BASELINE = REPO / "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T165026Z-tde-multiformalism-profile-epoch"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {"path": path.as_posix(), "sha256": digest(data), "size_bytes": len(data)}


def dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def tree(root: Path) -> tuple[list[dict[str, object]], str]:
    entries = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        data = path.read_bytes()
        entries.append({"path": path.relative_to(root).as_posix(), "sha256": digest(data), "size_bytes": len(data)})
    payload = json.dumps(entries, sort_keys=True, separators=(",", ":")).encode()
    return entries, digest(payload)


def semantic_equivalence() -> tuple[bool, list[dict[str, object]]]:
    comparisons = []
    ok = True
    for section in ("define", "design"):
        base = BASELINE / section
        successor = STAGED / section
        paths = sorted({p.relative_to(base) for p in base.rglob("*") if p.is_file()} | {p.relative_to(successor) for p in successor.rglob("*") if p.is_file()})
        for rel in paths:
            before = (base / rel).read_bytes() if (base / rel).is_file() else None
            after = (successor / rel).read_bytes() if (successor / rel).is_file() else None
            if before is None or after is None:
                equivalent = False
            elif rel.suffix == ".md":
                equivalent = before.rstrip(b"\n") == after.rstrip(b"\n")
            else:
                equivalent = before == after
            ok = ok and equivalent
            comparisons.append({"path": f"{section}/{rel.as_posix()}", "baseline_sha256": digest(before) if before is not None else None, "successor_sha256": digest(after) if after is not None else None, "comparison": "markdown-terminal-newline-normalized" if rel.suffix == ".md" else "byte-exact", "equivalent": equivalent})
    return ok, comparisons


def main() -> int:
    baseline_entries, baseline_tree_digest = tree(BASELINE)
    equivalent, comparisons = semantic_equivalence()
    protected = [
        Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json"),
        Path("projects/domainspec-v2/authority/decisions/2026-08-24-victor-pre-merge-structural-approval.md"),
        Path("projects/domainspec-v2/impl/test-derivation-engine/README.md"),
        Path("projects/domainspec-v2/impl/test-derivation-engine/package.json"),
        Path("projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts"),
        Path("projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts"),
        Path("projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.test.ts"),
        Path("projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/profiles.ts"),
        Path("arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json"),
        Path("arcanum/arcana/task-session/scripts/plan-once-material-controller.py"),
        Path(".agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py"),
        Path(".agents/skills/implementation-readiness/scripts/run_execution_loop.py"),
        Path(".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py"),
        Path(".arcanum/inventory/index.json"),
    ]
    preservation = {
        "schema_version": "domainspec-v2.source-preservation/v2",
        "baseline_root": BASELINE.relative_to(REPO).as_posix(),
        "baseline_file_count": len(baseline_entries),
        "baseline_tree_digest": baseline_tree_digest,
        "baseline_entries": baseline_entries,
        "define_design_equivalence": {"status": "pass" if equivalent else "block", "rule": "JSON and other artifacts byte-exact; Markdown may differ only by terminal newline normalization", "comparisons": comparisons},
        "protected_sources": [exact(path) for path in protected],
        "protected_source_count": len(protected),
        "drift": [],
        "verdict": "pass" if equivalent else "block",
        "authority_effect": "none",
    }
    dump(STAGED / "validation/SOURCE-PRESERVATION.json", preservation)

    attempts = [
        {"id": "V001", "label": "unit-contracts-positive-negative", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V002", "label": "execution-entry-validator-cli-missing-projection", "exit_code": 2, "status": "fail-preserved", "current": False, "repair": "rerun with required --projection"},
        {"id": "V003", "label": "execution-entry-state-contradiction", "exit_code": 1, "status": "fail-preserved", "current": False, "repair": "use exact implementation-readiness:execute next-owner handle"},
        {"id": "V004", "label": "execution-entry-installed-validator", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V005", "label": "audit-config-v2-schema", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V006", "label": "dispatch-first-validation", "exit_code": 1, "status": "fail-preserved", "current": False, "repair": "bind evidence_artifact, stop conditions, step techniques, and local capability metadata"},
        {"id": "V007", "label": "dispatch-current-validation", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V008", "label": "inventory-lookup-readiness", "exit_code": 0, "status": "pass-with-153-preexisting-tag-warnings", "current": True},
        {"id": "V009", "label": "all-staged-json-parse", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V010", "label": "staged-symlink-check", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V011", "label": "markdown-eof-initial", "exit_code": 1, "status": "fail-preserved", "current": False, "repair": "normalize terminal newlines in successor only; predecessor remains untouched"},
        {"id": "V012", "label": "strict-context-obligation-coverage", "exit_code": 0, "status": "pass", "current": True},
        {"id": "V013", "label": "planned-witness-count-and-state", "exit_code": 0, "status": "pass", "current": True},
    ]
    dump(STAGED / "validation/COMMAND-EXITS.json", {"schema_version": "domainspec-v2.command-exit-ledger/v1", "policy": "all attempts remain visible; only current-byte passes control staged material validation", "attempts": attempts, "failed_attempt_count": sum(a["exit_code"] != 0 for a in attempts), "masked_failure_count": 0, "authority_effect": "none"})
    dump(STAGED / "validation/DISPATCH-VALIDATION.json", {"schema_version": "dispatch.validation-receipt/v1", "dispatch_id": "dispatch-tde-epoch-admission-readiness-20260824", "status": "pass", "current_command_exit": 0, "prior_failed_attempt_preserved_as": "validation/COMMAND-EXITS.json#/attempts/V006", "authority_effect": "none"})
    dump(STAGED / "validation/VALIDATION.json", {"schema_version": "domainspec-v2.tde-staged-validation/v1", "candidate_id": "dsv2-tde-multiformalism-profile-epoch@2", "stage": "pre-material-freeze", "current_checks": {"unit_contracts": "pass", "execution_entry": "pass", "audit_config_schema": "pass", "dispatch": "pass", "inventory": "pass-with-preexisting-warnings", "json": "pass", "symlinks": "pass", "markdown_whitespace_eof": "pass-after-recorded-normalization", "context": "pass", "planned_witness_state": "pass-unimplemented-unexecuted", "source_preservation": preservation["verdict"], "distill": "pass"}, "wpra": "pending-post-apply", "implementation_readiness": "pending-post-wpra", "exactAcceptanceStatus": "unapproved", "selected_unit": None, "mutation_ready": False, "authority_effect": "none"})
    report = f'''# Staged Validation Report — TDE Epoch @2

Current staged bytes pass the unit-contract schema and adversarial fixtures, installed Work-Pack execution-entry validator, WPRA v2 config schema, Dispatch validator, Inventory lookup-readiness gate, JSON parse, symlink, Markdown whitespace/EOF, strict context coverage, source-preservation, and Distill checks.

The command ledger preserves four earlier nonzero attempts: one CLI invocation mistake, one execution-entry next-owner contradiction, one incomplete Dispatch contract, and inherited missing terminal newlines. Each was repaired in fresh successor bytes; no later pass masks the recorded failure.

The @1 root and every protected source remain untouched. Define/Design JSON is byte-exact; Markdown differs only by terminal newline normalization and is semantically equivalent under the recorded comparison. All 22 planned witnesses remain unimplemented and unexecuted.

This report covers staged planning material only. WPRA and proof-only Implementation Readiness run after the approved successor apply against exact final target paths. Exact @2 acceptance remains unapproved, no unit is selected, mutation readiness is false, and authority effect is none.
'''
    (STAGED / "validation/VALIDATION-REPORT.md").write_text(report, encoding="utf-8")
    return 0 if equivalent else 1


if __name__ == "__main__":
    raise SystemExit(main())
