# Additive research-work reconciliation

Status: source-bound audit snapshot. Authority effect none. Parent plans, state,
research records and frozen execution files were not edited.

Run `node development/agent-reasoning-engine/planning/representation-preferences/benchmark-pilot-v2/execution/work-tracking/reconcile.mjs --check`
to replay and verify this snapshot against its bound evidence. Omitting `--check`
refreshes only this directory's snapshot and process observation. A historical
running/stopped snapshot is not proof of current liveness.

## Native D08 state

`parent-evidence-state.json` is an additive replay of the original parent plan.
Only B1 is completed there: its criterion verifier checks eight source-pinned rows,
distinct personas, four strata per split, all retained history/visible hashes and
attribution. Other parent tasks remain unchanged because their shared freeze and
original-implementation criteria cannot be honestly completed by a different
transport or sequential-memory successor.

`successor-work-plan.json` and `successor-work-state.json` use actual
`materializeResearchPlan`, `transitionResearchWork` and `replayResearchWork` APIs.
Each completion is bound to its task, criterion, validator, plan digest and artifact
hash. Validators inspect actual record contents; file existence alone cannot pass.

| Task | Native state | Meaning |
| --- | --- | --- |
| A-ADMISSION | Completed | Four original tokenizer receipts verified; one task exceeds context |
| A-V1-STOP | Completed | Stopped run evidence verified; zero answers and 5,301 known tokens |
| A-V2-RUN | Blocked | Terminal run snapshot: 28 completed calls, seven answers, 65,762 known tokens; tokenizer failure before next model call |
| B-PREP | Completed | Eight selected source rows and disjoint personas verified |
| B-ADMISSION | Completed | Four overlength tokenizer receipts verified; zero model calls |
| C-V2-REVIEW | Completed | Sixteen result rows and blind reviews reconciled; native inconclusive decision verified |

Completing an admission audit does not complete the blocked experiment. Completing
C's reviewed result does not establish a quality improvement. Source-state and
claims stay separate. A2's continuation requires a separately reviewed recovery
amendment; this snapshot does not grant retries or mark unexecuted suffix calls done.

## Research ontology audit gap

`research-evidence-map.json` binds existing native observation and learning-decision
records for PersonaMem, selectivity-v2 and sequential-v1. Each passes native record
verification. The D08 successor attaches to the original open research question.

The original D07 graph includes only the predecessor local-contract registration.
The new D02/D04 records have not been wrapped into a supported registration envelope
and projected into a new D07 DAG. This is an explicit integration gap. This audit
maps their actual records and evidence without inventing registration authority,
changing frozen history, or implying historical preregistration. The coordinator
should close that gap through a source-bound successor registration adapter after
external result review, including stopped and inconclusive outcomes.

## Open Questions

Will the reviewed sequential-v2 suffix recovery complete the remaining external
answers without repeating prior generations? Which supported registration envelope
should carry these non-requirement benchmark observations into D07? Can PersonaMem
obtain an authorized full-exposure budget or separately frozen retrieval protocol?
These remain owned by the coordinator. Neither local tests nor selectivity results
close the external-memory research objective.
