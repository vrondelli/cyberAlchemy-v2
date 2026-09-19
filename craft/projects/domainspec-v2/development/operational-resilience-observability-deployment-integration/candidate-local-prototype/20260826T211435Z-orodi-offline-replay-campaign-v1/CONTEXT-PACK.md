# Context Pack: ORODI WP7 Offline Replay Campaign Planning

Mode: standard, strict, planning-only. This is not an execution-time handoff pack.

## Obligations

| ID | Planning obligation | Coverage |
| --- | --- | --- |
| O1 | Consume exact WP6 replay inputs/results without changing WP6. | covered |
| O2 | Compose multiple items deterministically and atomically. | covered |
| O3 | Preserve eligibility and derived evidence without authority escalation. | covered |
| O4 | Respect distinct bindings and invalidation domains. | covered |
| O5 | Define exact finite write scope, SWUs, tests, and stop conditions. | covered |
| O6 | Keep live tools, infrastructure, deployment, runtime admission, and lifecycle work deferred. | covered |

## Selected evidence

| Source | Selectors | Obligations | Why selected |
| --- | --- | --- | --- |
| WP6 `WORK-PACK.md` | Objective; Delivery boundary; Ordered replay algorithm; Completion contract | O1, O3, O6 | authoritative prior-lane behavior and ceiling |
| `contracts/tool-evidence-profile-replay.ts` | `ToolEvidenceProfileReplayInputs`; `ToolEvidenceProfileReplayResult` | O1, O2 | exact campaign item types |
| `contracts/tool-evidence-profile-replay-result.schema.json` | root properties and composed/rejected conditionals | O1, O5 | existing closed result surface |
| `contracts/evidence-eligibility.ts` | `ToolProfileEvidenceEligibilityResult`; receipt/context types | O3, O4 | replay-only and per-binding evidence shape |
| `src/replay-tool-evidence-profile.ts` | `replayToolEvidenceProfile` | O1, O2 | sole pure recomputation entry point |
| `src/evaluate-evidence-eligibility.ts` | `evaluateToolProfileEvidenceEligibility` return assembly | O3, O4 | proves eligibility is item/binding scoped |
| WP6 `golden/cases.json` | seven case IDs/families/context IDs | O2, O5 | exact finite family denominator |
| WP6 `evaluation-context.json` | seven binding IDs and invalidation keys | O4 | proves contexts cannot be merged into one bundle |
| WP6 replay tests | registry denominator; deterministic replay; hostile parity | O2, O5 | local proof conventions |
| operational-resilience `README.md` | Offline tool-profile replay section | O3, O6 | current operator-visible claim ceiling |

## Excluded candidates

- Legacy-v1 fixtures and adapters: WP7 consumes the profile-replay lane, not legacy source shapes.
- Infrastructure-plan and compatibility profile families: explicitly deferred and unadmitted by WP5.
- Craft ledger and lifecycle artifacts: reconciliation remains deferred and the planning lane has no authority to update them.
- External research: no obligation gap remains after local evidence selection.

## Resolved planning inference

The selected contexts have different binding IDs and invalidation-key digests. Because one `OperationalEvaluationBundle` owns one binding, the coherent WP7 abstraction is a campaign containing per-binding partitions. It is not one merged evaluation bundle.

Strict obligation coverage: pass, 6/6. Blockers: none for authoring; exact acceptance remains required before implementation.
