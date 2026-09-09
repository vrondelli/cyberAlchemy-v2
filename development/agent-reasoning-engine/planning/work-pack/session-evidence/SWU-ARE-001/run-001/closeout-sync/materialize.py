#!/usr/bin/env python3
"""Materialize the exact Invoke/Craft closeout for SWU-ARE-001."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[5]
OUTPUTS = RUN / "staging" / "outputs"
OPEN_QUESTIONS = "spec/SPEC.md#open-blockers--owner-decisions"
NEXT_MOVE = (
    "Run the explicit G-ARE-L0 evidence/owner promotion gate; do not select or "
    "authorize a downstream SWU until that gate returns a terminal receipt."
)
EVIDENCE_PATH = (
    "[repo-root]/cyberAlchemy-v2/implementation/agent-reasoning-engine/"
    "generated/runs/evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json"
)

BASELINES = {
    "planning/WORK-PACK.md": "b3c01e40cdd9913120a1b0d3fa719f9219db1d0268b991d5a89dde6da1bd3999",
    "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md": "74b94dd8c141fd9e137649e79f2f4c7128bbc85205e40f5fc9931dfcd35e5c15",
    "planning/work-pack/waves/W0-L0.md": "ad83225bcfd48c753d019e373efa4a66efa75f4355c66f45b476748f5da38100",
    ".craft/ledger.yml": "c019b88c4b73b572e79a8aad41d51d66e6780a9e1f7f2979d29c97a03944f3a8",
    ".craft/index.json": "e79b459199f5f48d66f8a8fa34e249e3ad6fc5890b2236696204964b6da77da5",
    "CRAFT.md": "e7a3b5bd93e30c93fcb20253e0838f8e8b5cc76b2be68f8ecad4a467a532f149",
}


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def ref(relative_path: str) -> dict[str, object]:
    content = (ROOT / relative_path).read_bytes()
    return {
        "path": relative_path,
        "sha256": digest(content),
        "size_bytes": len(content),
    }


def output_ref(relative_path: str) -> dict[str, object]:
    path = (
        Path(
            "planning/work-pack/session-evidence/SWU-ARE-001/run-001/"
            "closeout-sync/staging/outputs"
        )
        / relative_path
    ).as_posix()
    return ref(path)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise ValueError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def verify_baselines() -> None:
    for path, expected in BASELINES.items():
        actual = digest((ROOT / path).read_bytes())
        if actual != expected:
            raise ValueError(
                f"baseline drift: {path}: expected {expected}, got {actual}"
            )


def materialize_work_pack() -> str:
    text = (ROOT / "planning/WORK-PACK.md").read_text(encoding="utf-8")
    text = replace_once(
        text,
        "status: planned-policy-ready-awaiting-explicit-implementation-authorization",
        "status: l0-witness-complete-awaiting-explicit-promotion",
        "work-pack status",
    )
    text = replace_once(
        text,
        "selected_swu: SWU-ARE-001\nimplementation_authorized: false",
        "selected_swu: none\nimplementation_authorized: false\n"
        "last_completed_swu: SWU-ARE-001",
        "selected SWU",
    )
    text = replace_once(
        text,
        "This work-pack excludes implementation during the current dispatch, real\n"
        "external effects, generalized `AntiBiasVector`, canonical/public mutation, and\n"
        "reasoning-engine admission claims.",
        "This work-pack excludes further implementation without a newly selected and\n"
        "authorized SWU, real external effects, generalized `AntiBiasVector`,\n"
        "canonical/public mutation, and reasoning-engine admission claims.",
        "delivery boundary",
    )
    text = replace_once(
        text,
        "| TASK-ARE-EVALUATOR-001 | L0 | selected-ready-awaiting-explicit-authorization | TASK-ARE-READINESS-001 |",
        "| TASK-ARE-EVALUATOR-001 | L0 | completed | TASK-ARE-READINESS-001 |",
        "evaluator task row",
    )
    text = replace_once(
        text,
        "| `SWU-ARE-001` | TASK-ARE-EVALUATOR-001 | Deterministically reduce one frozen request to one typed outcome and prove the gate/effect boundary with test doubles. | selected, ready-awaiting-explicit-authorization |",
        "| `SWU-ARE-001` | TASK-ARE-EVALUATOR-001 | Deterministically reduce one frozen request to one typed outcome and prove the gate/effect boundary with test doubles. | completed; G-ARE-L0 promotion pending |",
        "SWU row",
    )
    policy_evidence = (
        "Current `G-ARE-POLICY` evidence: `TASK-ARE-READINESS-001` passed "
        "through\n"
        "[`../decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json`](../decisions/"
        "implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json); its claim ceiling is policy "
        "readiness only.\n"
    )
    l0_evidence = policy_evidence + (
        "\nCurrent `G-ARE-L0` evidence condition: **pass, promotion pending**. "
        "The\n"
        "[terminal SWU receipt](../../implementation/agent-reasoning-engine/"
        "generated/runs/evaluator-v1-20260723T-session-001/"
        "TERMINAL-RECEIPT.json) records passing counterfactual, two-family, "
        "replay,\nordering, and exact-effect-test-double invariants. This "
        "evidence does not\npromote L0 or authorize a successor.\n"
    )
    text = replace_once(
        text, policy_evidence, l0_evidence, "L0 evidence condition"
    )
    old_state = (
        "Planning status is **pass**; policy readiness is **pass**; implementation\n"
        "authorization remains **not granted**. `SWU-ARE-001` is selected and ready\n"
        "for a separately authorized execution route, but it is not handed off or\n"
        "executing. The next move is to apply and validate this synchronization through\n"
        "the owning Invoke and Craft lifecycles. Only then may a separately approved Task\n"
        "Session or Goal route execute the selected frontier.\n"
    )
    new_state = (
        "Planning and policy readiness remain **pass**. `SWU-ARE-001` is "
        "**completed**\n"
        "with a passing private L0 witness receipt. No further SWU is selected and\n"
        "`implementation_authorized` remains false for downstream work. The next move "
        "is\nthe explicit `G-ARE-L0` evidence/owner promotion gate. Until that gate "
        "returns\na terminal receipt, L1 dependencies remain closed.\n"
    )
    return replace_once(text, old_state, new_state, "current state")


def materialize_task() -> str:
    path = "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md"
    text = (ROOT / path).read_text(encoding="utf-8")
    text = replace_once(
        text,
        "Layer: L0. Status: **selected, ready; execution authorized by the current Task Session**.",
        "Layer: L0. Status: **completed; G-ARE-L0 promotion pending**.",
        "task status",
    )
    return text + (
        "\n## Completion evidence\n\n"
        "- Task Session receipt: [`../session-evidence/SWU-ARE-001/run-001/"
        "execution-receipt.json`](../session-evidence/SWU-ARE-001/run-001/"
        "execution-receipt.json)\n"
        "- Witness receipt: [`../../../../../implementation/agent-reasoning-engine/"
        "generated/runs/evaluator-v1-20260723T-session-001/"
        "TERMINAL-RECEIPT.json`](../../../../../implementation/"
        "agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json)\n"
        "- Verification: 16 tests passed, 0 failed.\n"
        "- Claim ceiling: private finite semantic witness only.\n"
        "- Promotion: not performed; route to `G-ARE-L0` owner evaluation.\n"
        "\n## Open Questions\n\n"
        "See [`../../../spec/SPEC.md#open-blockers--owner-decisions`](../../../"
        "spec/SPEC.md#open-blockers--owner-decisions).\n"
    )


def materialize_wave() -> str:
    path = "planning/work-pack/waves/W0-L0.md"
    text = (ROOT / path).read_text(encoding="utf-8")
    return text + (
        "\n## Current evidence state\n\n"
        "`SWU-ARE-001` completed with a passing terminal receipt at\n"
        "[`../../../../../implementation/agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json`](../../../../../"
        "implementation/agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json). The "
        "`G-ARE-L0`\ncondition is evidenced but not promoted. Stop at the explicit "
        "owner gate.\n"
        "\n## Open Questions\n\n"
        "Whether to promote L0 is the remaining wave question. Engine-level owner\n"
        "decisions remain in [`../../../spec/SPEC.md#open-blockers--owner-decisions`]"
        "(../../../spec/SPEC.md#open-blockers--owner-decisions).\n"
    )


def materialize_ledger() -> str:
    text = (ROOT / ".craft/ledger.yml").read_text(encoding="utf-8")
    text = replace_once(
        text,
        "    ART-ARE-READINESS-RECEIPT: artifacts[9]\n",
        "    ART-ARE-READINESS-RECEIPT: artifacts[9]\n"
        "    ART-ARE-L0-WITNESS-RECEIPT: artifacts[10]\n",
        "by-id artifact",
    )
    text = replace_once(
        text,
        "    - GAP-ARE-SEMANTIC-WITNESS\n",
        "",
        "active semantic gap",
    )
    old_next = (
        "Apply and validate the readiness synchronization through Invoke refresh "
        "and Craft; then request separate authorization for SWU-ARE-001 or the "
        "work-pack Goal frontier."
    )
    if text.count(old_next) != 2:
        raise ValueError("expected two prior next moves")
    text = text.replace(old_next, NEXT_MOVE)
    text = replace_once(
        text,
        "    decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json: ART-ARE-READINESS-RECEIPT\n",
        "    decisions/implementation-readiness/session-evidence/"
        "TASK-ARE-READINESS-001-RECEIPT.json: ART-ARE-READINESS-RECEIPT\n"
        f'    "{EVIDENCE_PATH}": ART-ARE-L0-WITNESS-RECEIPT\n',
        "artifact path",
    )
    text = replace_once(
        text, "    stage: plan\n", "    stage: implementation-l0\n", "stage"
    )
    text = replace_once(
        text,
        "      - ART-ARE-READINESS-RECEIPT\n",
        "      - ART-ARE-READINESS-RECEIPT\n"
        "      - ART-ARE-L0-WITNESS-RECEIPT\n",
        "owned artifact",
    )
    text = replace_once(
        text,
        "      - label: Readiness receipt\n"
        "        target: ART-ARE-READINESS-RECEIPT\n"
        "        kind: artifact-id\n",
        "      - label: Readiness receipt\n"
        "        target: ART-ARE-READINESS-RECEIPT\n"
        "        kind: artifact-id\n"
        "      - label: L0 witness receipt\n"
        "        target: ART-ARE-L0-WITNESS-RECEIPT\n"
        "        kind: artifact-id\n",
        "context receipt link",
    )
    text = replace_once(
        text,
        "      Run-02 was admitted at g6 under Option A and run-01 remains invalid. Stages s7,\n"
        "      s8, and s9 are complete. G-ARE-POLICY passes and the three policy blockers\n"
        "      are resolved. SWU-ARE-001 is ready but remains explicitly unauthorized;\n"
        "      semantic-witness and downstream gaps remain active.\n",
        "      Run-02 remains the admitted intent evidence. G-ARE-POLICY passes and\n"
        "      SWU-ARE-001 completed with a passing private L0 witness. The semantic-witness\n"
        "      gap is closed, but G-ARE-L0 promotion and all downstream gaps remain open.\n",
        "context note",
    )
    artifact_marker = (
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
    addition = artifact_marker + (
        "  - artifact_id: ART-ARE-L0-WITNESS-RECEIPT\n"
        "    owner_context_id: CTX-ARE-ROOT\n"
        f'    path: "{EVIDENCE_PATH}"\n'
        "    artifact_type: execution-receipt\n"
        "    status: pass\n"
        "    notes: >-\n"
        "      Terminal SWU-ARE-001 receipt witnessing one private finite semantic relation.\n"
        "      It does not promote G-ARE-L0 or admit a broader reasoning-engine claim.\n"
    )
    text = replace_once(text, artifact_marker, addition, "L0 artifact")
    text = replace_once(
        text,
        "      The private definition, design, and high-complexity plan are complete. Run-02 is\n"
        "      the admitted Option A evidence basis and run-01 is invalid. G-ARE-POLICY\n"
        "      passes and the three owner-policy blockers are resolved. SWU-ARE-001 is\n"
        "      ready, but implementation still requires the separately authorized Task Session.\n"
        "    status: active\n"
        "    evidence: ART-ARE-READINESS-RECEIPT\n",
        "      The private definition, design, and high-complexity plan are complete. Run-02\n"
        "      remains the admitted intent evidence. G-ARE-POLICY passes and SWU-ARE-001\n"
        "      now witnesses one finite semantic relation; G-ARE-L0 promotion remains pending.\n"
        "    status: active\n"
        "    evidence: ART-ARE-L0-WITNESS-RECEIPT\n",
        "active description",
    )
    text = replace_once(
        text,
        "      The planned finite first witness that accepts a bounded evaluation request and\n"
        "      produces a typed semantic judgment plus reasoning receipt, without authorizing or\n"
        "      performing the proposed effect.\n"
        "    status: candidate\n"
        "    evidence: ART-ARE-RESEARCH-FINDINGS\n",
        "      An implemented finite private L0 witness that accepts a frozen bounded request,\n"
        "      produces one typed semantic judgment plus reasoning receipt, and neither\n"
        "      authorizes nor performs a real effect.\n"
        "    status: candidate-witnessed\n"
        "    evidence: ART-ARE-L0-WITNESS-RECEIPT\n",
        "evaluator definition",
    )
    old_gap = (
        "  - gap_id: GAP-ARE-SEMANTIC-WITNESS\n"
        "    scope_id: CTX-ARE-ROOT\n"
        "    summary: >-\n"
        "      semantic-judgment evaluator@1 has accepted contract research but no executable\n"
        "      implementation or witnessed behavior.\n"
        "    severity: flag\n"
        "    treatment: plan\n"
        "    owner: invoke plan then future task-session\n"
        "    status: active\n"
        "    evidence: ART-ARE-RESEARCH-FINDINGS\n"
        "    links:\n"
        "      - label: Accepted findings\n"
        "        target: ART-ARE-RESEARCH-FINDINGS\n"
        "        kind: artifact-id\n"
    )
    new_gap = (
        "  - gap_id: GAP-ARE-SEMANTIC-WITNESS\n"
        "    scope_id: CTX-ARE-ROOT\n"
        "    summary: >-\n"
        "      semantic-judgment evaluator@1 now has executable, two-family, replayable,\n"
        "      exact-effect-test-double witness evidence within its L0 claim ceiling.\n"
        "    severity: flag\n"
        "    treatment: completed-bounded-l0-witness\n"
        "    owner: task-session\n"
        "    status: closed\n"
        "    evidence: ART-ARE-L0-WITNESS-RECEIPT\n"
        "    links:\n"
        "      - label: Terminal L0 witness receipt\n"
        "        target: ART-ARE-L0-WITNESS-RECEIPT\n"
        "        kind: artifact-id\n"
    )
    text = replace_once(text, old_gap, new_gap, "semantic gap")
    text = replace_once(
        text,
        "    reason: The root context must preserve the lack of an executable witness through planning.\n"
        "    evidence: ART-ARE-RESEARCH-FINDINGS\n",
        "    reason: The root context preserves the bounded L0 witness and its unpromoted claim ceiling.\n"
        "    evidence: ART-ARE-L0-WITNESS-RECEIPT\n",
        "gap relation",
    )
    yaml.safe_load(text)
    return text


CRAFT_VIEW = f"""# Agent reasoning engine — Craft view

> Derived human view. Authority remains in [`.craft/ledger.yml`](.craft/ledger.yml).
> This scoped ledger does not validate or repair the parent `cyberAlchemy-v2` ledger.

## Quick links

- Next move: [run the G-ARE-L0 owner gate](#next-move)
- Active blockers: none
- Blocking decisions: none
- Active gaps: [downstream residue](#active-gaps-and-residue)
- Terminal artifacts: [readiness](decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json), [L0 witness]({EVIDENCE_PATH.replace("[repo-root]/cyberAlchemy-v2/development/agent-reasoning-engine/", "")})

## Context CTX-ARE-ROOT

- **Stage / gate:** `implementation-l0` / `pass`
- **Readiness:** `G-ARE-POLICY` passes.
- **L0 execution:** `SWU-ARE-001` completed; its 16-test suite and materialized witness receipt pass.
- **Promotion:** `G-ARE-L0` evidence condition passes, but promotion remains pending.
- **Selected work:** none. No downstream SWU is authorized.

## Closed semantic-witness gap

`GAP-ARE-SEMANTIC-WITNESS` is closed by the terminal L0 receipt. The evidence
covers two separately owned rule families, all typed outcomes and negative
counterfactuals, canonical reasoning receipts, byte-identical replay, persisted
ordering, zero-call closures, and a fixed idempotent effect test double.

This closes only the lack-of-witness gap. It does not establish a general
reasoning engine, real effects, actor runtime, anti-bias efficacy, or promotion.

## Active gaps and residue

- **GAP-ARE-ARTIFACT-DURABILITY:** artifact admission and production durability remain L2 work.
- **GAP-ARE-INCIDENT-READINESS:** incident behavior and operational response remain downstream.
- **GAP-ARE-ROLLOUT-READINESS:** private rollout and the general-engine label remain unsupported.
- **GAP-ARE-INTENT-EVIDENCE:** revision-history and inter-rater evidence remain outside L0.
- **GAP-ARE-ANTI-BIAS-EFFICACY:** anti-bias efficacy remains explicitly excluded.

## Artifacts

| ID | Status | Meaning |
|---|---|---|
| ART-ARE-READINESS-RECEIPT | pass | Policy-readiness receipt; no implementation claim |
| ART-ARE-L0-WITNESS-RECEIPT | pass | Private finite semantic witness; no promotion claim |
| ART-ARE-LEDGER | active | Machine source of truth |
| ART-ARE-INDEX | active | Rebuildable lookup projection |

## Candidate definitions

- **DEF-ARE-INTENT-RECORD:** local candidate intent projection; not canonical.
- **DEF-ARE-SEMANTIC-EVALUATOR:** implemented and witnessed at L0; still a local
  candidate and non-authorizing.

## Next move

{NEXT_MOVE}

## Open Questions

See [`spec/SPEC.md#open-blockers--owner-decisions`](spec/SPEC.md#open-blockers--owner-decisions).
"""


def materialize_index(ledger_text: str) -> str:
    ledger = yaml.safe_load(ledger_text)
    index = json.loads((ROOT / ".craft/index.json").read_text(encoding="utf-8"))
    index["metadata"].update(
        {
            "ledger_sha256": digest(ledger_text.encode("utf-8")),
            "generated_at": "2026-07-23T01:05:00-03:00",
            "generator_version": "task-session-closeout/1",
        }
    )
    artifact_id = "ART-ARE-L0-WITNESS-RECEIPT"
    index["by_id"][artifact_id] = "artifacts[10]"
    index["by_family"]["artifacts"].append(artifact_id)
    index["row_selectors"][artifact_id] = {
        "family": "artifacts",
        "row_id": artifact_id,
        "path": ".craft/ledger.yml",
        "index": 10,
    }
    index["active_gaps"] = ledger["indexes"]["active_gaps"]
    index["next_moves"] = [
        {"context_id": "CTX-ARE-ROOT", "next_move": NEXT_MOVE}
    ]
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
    index["artifacts_by_path"][EVIDENCE_PATH] = artifact_id
    index["reverse_links"]["CTX-ARE-ROOT"].append(artifact_id)
    index["reverse_links"]["ART-ARE-READINESS-RECEIPT"].remove(
        "DESC-ARE-POST-PLAN"
    )
    index["reverse_links"][artifact_id] = [
        "DESC-ARE-POST-PLAN",
        "DEF-ARE-SEMANTIC-EVALUATOR",
        "GAP-ARE-SEMANTIC-WITNESS",
        "REL-ARE-ROOT-CONTAINS-WITNESS-GAP",
    ]
    index["references"]["CTX-ARE-ROOT"].append(artifact_id)
    for row_id in [
        "DEF-ARE-SEMANTIC-EVALUATOR",
        "GAP-ARE-SEMANTIC-WITNESS",
        "REL-ARE-ROOT-CONTAINS-WITNESS-GAP",
    ]:
        index["evidence_refs"]["ART-ARE-RESEARCH-FINDINGS"].remove(row_id)
    index["evidence_refs"][artifact_id] = [
        "DESC-ARE-POST-PLAN",
        "DEF-ARE-SEMANTIC-EVALUATOR",
        "GAP-ARE-SEMANTIC-WITNESS",
        "REL-ARE-ROOT-CONTAINS-WITNESS-GAP",
    ]
    index["stale_status"] = "fresh"
    if index["by_id"] != ledger["indexes"]["by_id"]:
        raise ValueError("index by_id differs from ledger")
    if index["active_gaps"] != ledger["indexes"]["active_gaps"]:
        raise ValueError("active gap projection differs from ledger")
    return json.dumps(index, indent=2, ensure_ascii=False) + "\n"


def write_output(path: str, text: str) -> None:
    target = OUTPUTS / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def package(
    package_id: str,
    owner: str,
    targets: list[str],
) -> dict[str, object]:
    dependencies = []
    inventory = []
    changes = []
    for number, target in enumerate(targets, 1):
        dependency_id = f"baseline-{number}"
        dependencies.append(
            {"dependency_id": dependency_id, "artifact_ref": ref(target)}
        )
        inventory.append(
            {
                "target_path": target,
                "lifecycle_owner": owner,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": [dependency_id],
            }
        )
        changes.append(
            {
                "target_path": target,
                "operation": "update",
                "output_ref": output_ref(target),
            }
        )
    source_paths = [
        "planning/work-pack/session-evidence/SWU-ARE-001/run-001/"
        "execution-receipt.json",
        "planning/work-pack/session-evidence/SWU-ARE-001/run-001/"
        "CONTINUATION.json",
        "planning/work-pack/session-evidence/SWU-ARE-001/run-001/"
        "closeout-sync/AUTHORIZATION.md",
    ]
    return {
        "schema_version": "1.0.0",
        "package_id": package_id,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": owner,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**ref(path), "authority_class": "private"}
            for path in source_paths
        ],
        "changes": changes,
        "target_inventory": inventory,
        "dependencies": dependencies,
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": owner,
            "scope_paths": targets,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": [
            "node --test ../../implementation/agent-reasoning-engine/packages/"
            "semantic-judgment-evaluator/test/*.test.mjs",
            "python3 planning/work-pack/session-evidence/SWU-ARE-001/run-001/"
            "closeout-sync/validate_sync.py --surface target",
        ],
    }


def main() -> None:
    verify_baselines()
    work_pack = materialize_work_pack()
    task = materialize_task()
    wave = materialize_wave()
    ledger = materialize_ledger()
    index = materialize_index(ledger)
    write_output("planning/WORK-PACK.md", work_pack)
    write_output(
        "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md", task
    )
    write_output("planning/work-pack/waves/W0-L0.md", wave)
    write_output(".craft/ledger.yml", ledger)
    write_output(".craft/index.json", index)
    write_output("CRAFT.md", CRAFT_VIEW)
    invoke = package(
        "ARE-SWU-001-INVOKE-CLOSEOUT-20260723",
        "invoke",
        [
            "planning/WORK-PACK.md",
            "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md",
            "planning/work-pack/waves/W0-L0.md",
        ],
    )
    craft = package(
        "ARE-SWU-001-CRAFT-CLOSEOUT-20260723",
        "craft",
        [".craft/ledger.yml", ".craft/index.json", "CRAFT.md"],
    )
    (RUN / "invoke-material-package.json").write_text(
        json.dumps(invoke, indent=2) + "\n", encoding="utf-8"
    )
    (RUN / "craft-material-package.json").write_text(
        json.dumps(craft, indent=2) + "\n", encoding="utf-8"
    )
    print("MATERIALIZATION=pass")


if __name__ == "__main__":
    main()
