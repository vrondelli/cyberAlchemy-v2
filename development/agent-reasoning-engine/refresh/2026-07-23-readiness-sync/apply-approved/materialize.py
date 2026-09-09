#!/usr/bin/env python3
"""Materialize exact readiness-sync outputs and owner-scoped package manifests."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[2]
OUTPUTS = RUN / "staging" / "outputs"

BASELINES = {
    "planning/WORK-PACK.md": "07f3b194e1c8fa96b591a4bb735b615f46a52ffdc008faa067bd2636bf6cda8d",
    "planning/work-pack/tasks/TASK-ARE-READINESS-001.md": "66f1dd94931be2359d062469d610a6f1913e01863338e632f0c339a932989bd2",
    ".craft/ledger.yml": "83711be112ec6742db1e412b8523afd888cf929b3130c5d390e3d3724b70ea20",
    ".craft/index.json": "46648429e99797ae97ad86f3c224e117105b319276cad0d99f5e35bb7ee6db3c",
    "CRAFT.md": "774230e97795db4cd4d8a8e985adb785e4a8debbf37513533e3ed3ea0ff83162",
}

NEXT_MOVE = (
    "Apply and validate the readiness synchronization through Invoke refresh "
    "and Craft; then request separate authorization for SWU-ARE-001 or the "
    "work-pack Goal frontier."
)


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def exact_ref(relative_path: str) -> dict[str, object]:
    content = (ROOT / relative_path).read_bytes()
    return {
        "path": relative_path,
        "sha256": sha256_bytes(content),
        "size_bytes": len(content),
    }


def output_ref(relative_path: str) -> dict[str, object]:
    staged_path = (
        Path("refresh/2026-07-23-readiness-sync/apply-approved/staging/outputs")
        / relative_path
    ).as_posix()
    return exact_ref(staged_path)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise ValueError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def verify_baselines() -> None:
    for relative_path, expected in BASELINES.items():
        actual = sha256_bytes((ROOT / relative_path).read_bytes())
        if actual != expected:
            raise ValueError(
                f"baseline drift: {relative_path}: expected {expected}, got {actual}"
            )


def materialize_work_pack() -> str:
    text = (ROOT / "planning/WORK-PACK.md").read_text(encoding="utf-8")
    text = replace_once(
        text,
        "status: planned-blocked-before-implementation",
        "status: planned-policy-ready-awaiting-explicit-implementation-authorization",
        "work-pack status",
    )
    text = replace_once(
        text,
        "| TASK-ARE-READINESS-001 | pre-L0 | blocked-owner-decisions | none |",
        "| TASK-ARE-READINESS-001 | pre-L0 | completed | none |",
        "readiness task row",
    )
    text = replace_once(
        text,
        "| TASK-ARE-EVALUATOR-001 | L0 | selected-blocked | TASK-ARE-READINESS-001 |",
        "| TASK-ARE-EVALUATOR-001 | L0 | selected-ready-awaiting-explicit-authorization | TASK-ARE-READINESS-001 |",
        "evaluator task row",
    )
    text = replace_once(
        text,
        "| `SWU-ARE-001` | TASK-ARE-EVALUATOR-001 | Deterministically reduce one frozen request to one typed outcome and prove the gate/effect boundary with test doubles. | selected, blocked |",
        "| `SWU-ARE-001` | TASK-ARE-EVALUATOR-001 | Deterministically reduce one frozen request to one typed outcome and prove the gate/effect boundary with test doubles. | selected, ready-awaiting-explicit-authorization |",
        "SWU-ARE-001 row",
    )
    gate_marker = (
        "| G-ARE-PROMOTION | A separate definitions/claim owner admits any "
        "broader label. | retain local candidate wording |\n"
    )
    gate_evidence = (
        gate_marker
        + "\nCurrent `G-ARE-POLICY` evidence: `TASK-ARE-READINESS-001` passed "
        "through\n"
        + "[`../decisions/implementation-readiness/session-evidence/"
        + "TASK-ARE-READINESS-001-RECEIPT.json`](../decisions/"
        + "implementation-readiness/session-evidence/"
        + "TASK-ARE-READINESS-001-RECEIPT.json); its claim ceiling is policy "
        + "readiness only.\n"
    )
    text = replace_once(text, gate_marker, gate_evidence, "policy gate evidence")
    text = replace_once(
        text,
        "| BLK-ARE-APP-001 | implementation blocker | authority-model owner | finite applicability/precedence/exception/conflict/staleness policy |",
        "| BLK-ARE-APP-001 | resolved implementation blocker | authority-model owner | [`APPLICABILITY-POLICY-v1.md`](../decisions/implementation-readiness/APPLICABILITY-POLICY-v1.md) plus the terminal readiness receipt |",
        "applicability blocker",
    )
    text = replace_once(
        text,
        "| BLK-ARE-CHAL-001 | implementation blocker | challenge-contract owner | finite timeout and late-material-defeat closure policy |",
        "| BLK-ARE-CHAL-001 | resolved implementation blocker | challenge-contract owner | [`CHALLENGE-CLOSURE-POLICY-v1.md`](../decisions/implementation-readiness/CHALLENGE-CLOSURE-POLICY-v1.md) plus the terminal readiness receipt |",
        "challenge blocker",
    )
    text = replace_once(
        text,
        "| BLK-ARE-EFFECT-001 | implementation blocker | effect-gate owner | fixed test-only effect envelope, gate fixtures, and idempotency semantics |",
        "| BLK-ARE-EFFECT-001 | resolved implementation blocker | effect-gate owner | [`TEST-EFFECT-POLICY-v1.md`](../decisions/implementation-readiness/TEST-EFFECT-POLICY-v1.md) plus the terminal readiness receipt |",
        "effect blocker",
    )
    text = replace_once(
        text,
        "Planning status is **pass**; mutation readiness is **block**. "
        "`SWU-ARE-001` is\nselected but not handed off. The current dispatch "
        "stops after Craft refresh.\nFuture execution begins only after "
        "G-ARE-POLICY and an explicit Task Session or\ngoal authorization.\n",
        "Planning status is **pass**; policy readiness is **pass**; "
        "implementation\nauthorization remains **not granted**. `SWU-ARE-001` "
        "is selected and ready\nfor a separately authorized execution route, "
        "but it is not handed off or\nexecuting. The next move is to apply and "
        "validate this synchronization through\nthe owning Invoke and Craft "
        "lifecycles. Only then may a separately approved Task\nSession or Goal "
        "route execute the selected frontier.\n",
        "current state",
    )
    if "implementation_authorized: false" not in text:
        raise ValueError("implementation authorization invariant lost")
    return text


def materialize_task() -> str:
    text = (
        ROOT / "planning/work-pack/tasks/TASK-ARE-READINESS-001.md"
    ).read_text(encoding="utf-8")
    text = replace_once(text, "Status: **blocking**.", "Status: **completed**.", "task status")
    text += (
        "\n## Completion evidence\n\n"
        "- Terminal receipt: [`../../../decisions/implementation-readiness/"
        "session-evidence/TASK-ARE-READINESS-001-RECEIPT.json`](../../../"
        "decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json)\n"
        "- Boundary review: [`../../../decisions/implementation-readiness/"
        "session-evidence/TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md`](../../../"
        "decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md)\n"
        "- Gate result: `G-ARE-POLICY: pass`.\n"
        "- Claim ceiling: policy readiness only.\n"
        "- No evaluator code or implementation evidence was created by this task.\n"
    )
    return text


def materialize_ledger() -> str:
    text = (ROOT / ".craft/ledger.yml").read_text(encoding="utf-8")
    text = replace_once(
        text,
        "    ART-ARE-CRAFT-REFRESH-RECEIPT: artifacts[8]\n",
        "    ART-ARE-CRAFT-REFRESH-RECEIPT: artifacts[8]\n"
        "    ART-ARE-READINESS-RECEIPT: artifacts[9]\n",
        "ledger by_id",
    )
    text = replace_once(
        text,
        "  active_blockers:\n"
        "    - BLK-ARE-APP-001\n"
        "    - BLK-ARE-CHAL-001\n"
        "    - BLK-ARE-EFFECT-001\n",
        "  active_blockers: []\n",
        "active blockers index",
    )
    old_next = (
        "Obtain manual readiness decisions from the three named owners before "
        "authorizing any Task Session for SWU-ARE-001."
    )
    if text.count(old_next) != 2:
        raise ValueError("expected two stale next-move values")
    text = text.replace(old_next, NEXT_MOVE)
    text = replace_once(
        text,
        "    .craft/artifacts/receipts/craft-refresh.json: ART-ARE-CRAFT-REFRESH-RECEIPT\n",
        "    .craft/artifacts/receipts/craft-refresh.json: ART-ARE-CRAFT-REFRESH-RECEIPT\n"
        "    decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json: ART-ARE-READINESS-RECEIPT\n",
        "artifact path index",
    )
    text = replace_once(
        text, "    stage: plan\n    gate: block\n", "    stage: plan\n    gate: pass\n", "context gate"
    )
    text = replace_once(
        text,
        "      - ART-ARE-CRAFT-REFRESH-RECEIPT\n",
        "      - ART-ARE-CRAFT-REFRESH-RECEIPT\n"
        "      - ART-ARE-READINESS-RECEIPT\n",
        "owned artifacts",
    )
    text = replace_once(
        text,
        "      - label: Plan receipt\n"
        "        target: ART-ARE-ENGINE-PLAN-RECEIPT\n"
        "        kind: artifact-id\n",
        "      - label: Plan receipt\n"
        "        target: ART-ARE-ENGINE-PLAN-RECEIPT\n"
        "        kind: artifact-id\n"
        "      - label: Readiness receipt\n"
        "        target: ART-ARE-READINESS-RECEIPT\n"
        "        kind: artifact-id\n",
        "context receipt link",
    )
    text = replace_once(
        text,
        "      Run-02 was admitted at g6 under Option A and run-01 remains invalid. Stages s7,\n"
        "      s8, and s9 are complete. The plan passes structurally, but implementation is\n"
        "      blocked; SWU-ARE-001 is selected and explicitly not authorized for execution.\n",
        "      Run-02 was admitted at g6 under Option A and run-01 remains invalid. "
        "Stages s7,\n"
        "      s8, and s9 are complete. G-ARE-POLICY passes and the three policy blockers\n"
        "      are resolved. SWU-ARE-001 is ready but remains explicitly unauthorized;\n"
        "      semantic-witness and downstream gaps remain active.\n",
        "context notes",
    )
    artifact_marker = (
        "  - artifact_id: ART-ARE-CRAFT-REFRESH-RECEIPT\n"
        "    owner_context_id: CTX-ARE-ROOT\n"
        "    path: .craft/artifacts/receipts/craft-refresh.json\n"
        "    artifact_type: craft-refresh-receipt\n"
        "    status: pass\n"
        "    notes: Terminal receipt for the s10 Craft refresh.\n"
    )
    artifact_addition = artifact_marker + (
        "  - artifact_id: ART-ARE-READINESS-RECEIPT\n"
        "    owner_context_id: CTX-ARE-ROOT\n"
        "    path: decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json\n"
        "    artifact_type: execution-receipt\n"
        "    status: pass\n"
        "    notes: >-\n"
        "      Terminal Task Session receipt closing the three policy-readiness blockers\n"
        "      without authorizing implementation or claiming an evaluator witness.\n"
    )
    text = replace_once(text, artifact_marker, artifact_addition, "readiness artifact")
    text = replace_once(
        text,
        "      The private definition, design, and high-complexity plan are complete. "
        "Run-02 is\n"
        "      the admitted Option A evidence basis and run-01 is invalid. The plan "
        "selects\n"
        "      SWU-ARE-001, but no implementation Task Session is authorized until all "
        "three\n"
        "      owner-policy blockers close.\n"
        "    status: active\n"
        "    evidence: ART-ARE-ENGINE-PLAN-RECEIPT\n",
        "      The private definition, design, and high-complexity plan are complete. "
        "Run-02 is\n"
        "      the admitted Option A evidence basis and run-01 is invalid. G-ARE-POLICY\n"
        "      passes and the three owner-policy blockers are resolved. SWU-ARE-001 is\n"
        "      ready, but implementation still requires the separately authorized Task "
        "Session.\n"
        "    status: active\n"
        "    evidence: ART-ARE-READINESS-RECEIPT\n",
        "active description",
    )
    blocker_replacements = {
        "BLK-ARE-APP-001": (
            "The authority-model application policy record required by the plan is missing.",
            "The authority-model application policy exists and passed the readiness boundary review.",
        ),
        "BLK-ARE-CHAL-001": (
            "The challenge-contract policy record required by the plan is missing.",
            "The challenge-closure policy exists and passed the readiness boundary review.",
        ),
        "BLK-ARE-EFFECT-001": (
            "The effect-gate policy record required by the plan is missing.",
            "The test-only exact-effect policy exists and passed the readiness boundary review.",
        ),
    }
    for blocker_id, (old_summary, new_summary) in blocker_replacements.items():
        text = replace_once(text, f"    summary: {old_summary}", f"    summary: {new_summary}", f"{blocker_id} summary")
    if text.count("    refinement_status: refined\n    requires_human: true\n    status: active\n") != 3:
        raise ValueError("expected three active refined policy blockers")
    text = text.replace(
        "    refinement_status: refined\n"
        "    requires_human: true\n"
        "    status: active\n",
        "    refinement_status: resolved\n"
        "    requires_human: false\n"
        "    status: resolved\n",
    )
    if text.count("    evidence: ART-ARE-ENGINE-PLAN-RECEIPT\n") < 3:
        raise ValueError("policy blocker evidence anchors missing")
    typed_items_at = text.index("typed_items:\n")
    decisions_at = text.index("decisions:\n", typed_items_at)
    typed_items = text[typed_items_at:decisions_at]
    if typed_items.count("    evidence: ART-ARE-ENGINE-PLAN-RECEIPT\n") != 3:
        raise ValueError("expected exactly three policy blocker evidence fields")
    typed_items = typed_items.replace(
        "    evidence: ART-ARE-ENGINE-PLAN-RECEIPT\n",
        "    evidence: ART-ARE-READINESS-RECEIPT\n",
    )
    text = text[:typed_items_at] + typed_items + text[decisions_at:]
    yaml.safe_load(text)
    return text


CRAFT_VIEW = f"""# Agent reasoning engine — Craft view

> Derived human view. Authority remains in [`.craft/ledger.yml`](.craft/ledger.yml).
> This scoped ledger does not validate or repair the parent `cyberAlchemy-v2` ledger.

## Quick links

- Next move: [apply synchronization, then authorize the selected frontier](#next-move)
- Active blockers: none
- Blocking decisions: none; [DEC-ARE-G6-SCHEMA-SELECTION](#dec-are-g6-schema-selection) is closed
- Active gaps: [semantic witness and downstream residue](#active-gaps-and-residue)
- Terminal artifacts: [run-02](receipts/intent-schema-live-run.json), [plan](receipts/engine-plan.json), [readiness](decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json), [Craft refresh](.craft/artifacts/receipts/craft-refresh.json)

## Context CTX-ARE-ROOT

- **Stage / gate:** `plan` / `pass`
- **Purpose:** Coordinate an evidence-informed private definition, design, and plan for a governed agent reasoning engine whose first executable witness will be `semantic-judgment evaluator@1`.
- **Stage state:** g6 admitted run-02 under Option A; run-01 remains invalid; s7, s8, and s9 are complete.
- **Readiness verdict:** `G-ARE-POLICY` passes; the three policy blockers are resolved.
- **Selected work:** `SWU-ARE-001` is ready but remains unauthorized until a separate Task Session begins.

## DEC-ARE-G6-SCHEMA-SELECTION

- **Question:** Which bounded intent-schema evidence should be admitted for definition and design reconciliation?
- **Selected option:** Option A
- **Status / blocking:** `closed` / formerly blocking
- **Rationale:** Admit run-02 as bounded and revisable evidence while preserving its flags and excluding invalid run-01.
- **Impact:** Local authoring evidence only; no schema promotion, implementation authorization, or efficacy claim.
- **Evidence:** [`receipts/intent-schema-live-run.json`](receipts/intent-schema-live-run.json), [Craft refresh receipt](.craft/artifacts/receipts/craft-refresh.json)

## Resolved readiness blockers

- **BLK-ARE-APP-001:** resolved by the versioned applicability policy and the terminal readiness receipt.
- **BLK-ARE-CHAL-001:** resolved by the versioned challenge-closure policy and the terminal readiness receipt.
- **BLK-ARE-EFFECT-001:** resolved by the versioned test-only exact-effect policy and the terminal readiness receipt.

These rows remain in the ledger as resolved history. Their closure proves policy
readiness only; it does not prove evaluator behavior.

## Active gaps and residue

- **GAP-ARE-SEMANTIC-WITNESS:** no executable evaluator behavior has been witnessed.
- **GAP-ARE-ARTIFACT-DURABILITY:** artifact durability/admission remains an L2 owner decision.
- **GAP-ARE-INCIDENT-READINESS:** incident behavior and operational response remain downstream residue.
- **GAP-ARE-ROLLOUT-READINESS:** rollout/promotion remains downstream; the general reasoning-engine label is unsupported.
- **GAP-ARE-INTENT-EVIDENCE:** revision-history and inter-rater evidence remain outside the first witness.
- **GAP-ARE-ANTI-BIAS-EFFICACY:** anti-bias efficacy remains explicitly excluded.

`GAP-ARE-INTENT-SCHEMA-EVIDENCE` is closed by the bounded run-02 plus Option A admission. This does not erase the listed intent-evidence residue.

## Artifacts

| ID | Native status | Path / meaning |
|---|---|---|
| ART-ARE-DISPATCH | pass | [`DISPATCH.json`](DISPATCH.json) |
| ART-ARE-LEDGER | active | [`.craft/ledger.yml`](.craft/ledger.yml) |
| ART-ARE-INDEX | active | [`.craft/index.json`](.craft/index.json) |
| ART-ARE-VIEW | active | [`CRAFT.md`](CRAFT.md) |
| ART-ARE-CRAFT-START-RECEIPT | pass | [`receipts/craft-context.json`](receipts/craft-context.json) |
| ART-ARE-RESEARCH-FINDINGS | pass | accepted read-only findings outside this write scope |
| ART-ARE-INTENT-LIVE-RECEIPT | flag | [run-02 terminal receipt](receipts/intent-schema-live-run.json); g6 admitted Option A, run-01 invalid |
| ART-ARE-ENGINE-PLAN-RECEIPT | block | historical [plan receipt](receipts/engine-plan.json); structure passed while policy readiness was then blocked |
| ART-ARE-CRAFT-REFRESH-RECEIPT | pass | [s10 refresh receipt](.craft/artifacts/receipts/craft-refresh.json) |
| ART-ARE-READINESS-RECEIPT | pass | [readiness receipt](decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json); closes policy blockers only |

## Candidate definitions

- **DEF-ARE-INTENT-RECORD:** local candidate intent projection; not canonical or promoted.
- **DEF-ARE-SEMANTIC-EVALUATOR:** finite, non-authorizing first-witness contract; not implemented.

## Next move

{NEXT_MOVE}
"""


def materialize_index(ledger_text: str) -> str:
    ledger = yaml.safe_load(ledger_text)
    index = json.loads((ROOT / ".craft/index.json").read_text(encoding="utf-8"))
    ledger_digest = sha256_bytes(ledger_text.encode("utf-8"))
    index["metadata"].update(
        {
            "ledger_sha256": ledger_digest,
            "generated_at": "2026-07-23T00:30:00-03:00",
            "generator_version": "manual-craft-refresh/2",
        }
    )
    index["by_id"]["ART-ARE-READINESS-RECEIPT"] = "artifacts[9]"
    index["by_family"]["artifacts"].append("ART-ARE-READINESS-RECEIPT")
    index["row_selectors"]["ART-ARE-READINESS-RECEIPT"] = {
        "family": "artifacts",
        "row_id": "ART-ARE-READINESS-RECEIPT",
        "path": ".craft/ledger.yml",
        "index": 9,
    }
    index["active_blockers"] = []
    index["next_moves"] = [{"context_id": "CTX-ARE-ROOT", "next_move": NEXT_MOVE}]
    index["pending_by_node"] = [
        {
            "context_id": "CTX-ARE-ROOT",
            "status": "flag",
            "blockers": [],
            "blocking_decisions": [],
            "open_decisions": [],
            "gaps": ledger["indexes"]["active_gaps"],
            "pending_artifacts": [],
            "next_move": NEXT_MOVE,
        }
    ]
    receipt_path = (
        "decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json"
    )
    index["artifacts_by_path"][receipt_path] = "ART-ARE-READINESS-RECEIPT"
    index["reverse_links"]["CTX-ARE-ROOT"].append("ART-ARE-READINESS-RECEIPT")
    index["reverse_links"]["ART-ARE-ENGINE-PLAN-RECEIPT"] = [
        item
        for item in index["reverse_links"]["ART-ARE-ENGINE-PLAN-RECEIPT"]
        if item
        not in {
            "DESC-ARE-POST-PLAN",
            "BLK-ARE-APP-001",
            "BLK-ARE-CHAL-001",
            "BLK-ARE-EFFECT-001",
        }
    ]
    index["reverse_links"]["ART-ARE-READINESS-RECEIPT"] = [
        "DESC-ARE-POST-PLAN",
        "BLK-ARE-APP-001",
        "BLK-ARE-CHAL-001",
        "BLK-ARE-EFFECT-001",
    ]
    index["references"]["CTX-ARE-ROOT"].append("ART-ARE-READINESS-RECEIPT")
    index["evidence_refs"]["ART-ARE-ENGINE-PLAN-RECEIPT"] = [
        item
        for item in index["evidence_refs"]["ART-ARE-ENGINE-PLAN-RECEIPT"]
        if item
        not in {
            "DESC-ARE-POST-PLAN",
            "BLK-ARE-APP-001",
            "BLK-ARE-CHAL-001",
            "BLK-ARE-EFFECT-001",
        }
    ]
    index["evidence_refs"]["ART-ARE-READINESS-RECEIPT"] = [
        "DESC-ARE-POST-PLAN",
        "BLK-ARE-APP-001",
        "BLK-ARE-CHAL-001",
        "BLK-ARE-EFFECT-001",
    ]
    index["stale_status"] = "fresh"
    if index["by_id"] != ledger["indexes"]["by_id"]:
        raise ValueError("generated by_id differs from ledger embedded by_id")
    if index["active_blockers"] != ledger["indexes"]["active_blockers"]:
        raise ValueError("generated active blockers differ from ledger")
    return json.dumps(index, indent=2, ensure_ascii=False) + "\n"


def write_output(relative_path: str, text: str) -> None:
    target = OUTPUTS / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def package(
    package_id: str,
    lifecycle_owner: str,
    target_paths: list[str],
    source_paths: list[str],
) -> dict[str, object]:
    dependencies = []
    inventory = []
    changes = []
    for index, target_path in enumerate(target_paths, 1):
        dependency_id = f"baseline-{index}"
        dependencies.append(
            {
                "dependency_id": dependency_id,
                "artifact_ref": exact_ref(target_path),
            }
        )
        inventory.append(
            {
                "target_path": target_path,
                "lifecycle_owner": lifecycle_owner,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": [dependency_id],
            }
        )
        changes.append(
            {
                "target_path": target_path,
                "operation": "update",
                "output_ref": output_ref(target_path),
            }
        )
    return {
        "schema_version": "1.0.0",
        "package_id": package_id,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": lifecycle_owner,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**exact_ref(path), "authority_class": "private"} for path in source_paths
        ],
        "changes": changes,
        "target_inventory": inventory,
        "dependencies": dependencies,
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": lifecycle_owner,
            "scope_paths": target_paths,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": [
            "python3 refresh/2026-07-23-readiness-sync/apply-approved/validate_sync.py --surface target"
        ],
    }


def main() -> None:
    verify_baselines()
    work_pack = materialize_work_pack()
    task = materialize_task()
    ledger = materialize_ledger()
    index = materialize_index(ledger)
    write_output("planning/WORK-PACK.md", work_pack)
    write_output(
        "planning/work-pack/tasks/TASK-ARE-READINESS-001.md",
        task,
    )
    write_output(".craft/ledger.yml", ledger)
    write_output(".craft/index.json", index)
    write_output("CRAFT.md", CRAFT_VIEW)

    source_paths = [
        "decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json",
        "refresh/2026-07-23-readiness-sync/REFRESH-PATCH-PROPOSAL.md",
        "refresh/2026-07-23-readiness-sync/apply-approved/AUTHORIZATION.md",
    ]
    invoke_package = package(
        "ARE-READINESS-INVOKE-APPLY-20260723",
        "invoke",
        [
            "planning/WORK-PACK.md",
            "planning/work-pack/tasks/TASK-ARE-READINESS-001.md",
        ],
        source_paths,
    )
    craft_package = package(
        "ARE-READINESS-CRAFT-APPLY-20260723",
        "craft",
        [".craft/ledger.yml", ".craft/index.json", "CRAFT.md"],
        source_paths,
    )
    (RUN / "invoke-material-package.json").write_text(
        json.dumps(invoke_package, indent=2) + "\n", encoding="utf-8"
    )
    (RUN / "craft-material-package.json").write_text(
        json.dumps(craft_package, indent=2) + "\n", encoding="utf-8"
    )
    print("MATERIALIZATION=pass")


if __name__ == "__main__":
    main()
