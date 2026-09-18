# Independent completion audit of the parallel pilot

Reviewer: `/root/pilot_selectivity`. Authority effect: none. Date: 2026-09-18.
Scope: [original plan](../PLAN.md), actual branch artifacts, native observations,
current synthesis and research-work projections. No model calls or source changes.
This reviewer previously authored branch C preparation and performed blinded audits;
this is independent of the coordinator's completion decision, not a claim of total
independence from the research implementation.

## Verdict at this snapshot

The execution has produced clear results across the full planned three-branch scope:
C has a fully measured successor result, A has a reviewed amended result with a real
completion failure, and B has measured admission blockers and no quality score.
The plan explicitly allows completed, valid-failed, inconclusive or blocked branch
outcomes at the join. Therefore a new PersonaMem experiment is not required merely
to force a positive or scored outcome before closing this bounded pilot.

However, **final goal completion is not yet proven at this audit snapshot**. The
finite closure tasks below remain: integrate the final A observation/decision into
the current D07/D08 successor; reconcile current status links; publish the requested
category/paired counts and named C metric denominators. These require evidence
integration/reporting, not more generation. Once verified, this pilot can close with
negative/inconclusive/blocked results without redefining its scope around A/C alone.
This would not finish GLM qualification, the separate ContextBench frontier, all
PersonaMem research, a clean original A run, or a demonstrated ARE improvement.

## Requirement-by-requirement audit

| Plan requirement | Verified disposition | Evidence and limit |
| --- | --- | --- |
| Objective hierarchy and research method | Preserved in versioned protocols and reviews | [A protocol](longmemeval-sequential-v2/PROTOCOL.md), [C protocol](selectivity-v2/RUN-PROTOCOL.md); no serving or release claim. |
| S provider/model, equal arms, isolation, token accounting | Implemented and exercised, with disclosed earlier failures | [shared provider](shared/provider.mjs), [successor provider](selectivity-v2/provider.mjs), [A runner](longmemeval-sequential-v2/runner.mjs), actual receipts and reviewed protocol; initial disabled-thinking calls retain unknown usage. |
| S 8K admission and per-branch budgets | Measured and enforced for admitted runs | [A preflight](longmemeval-sequential-v2/preflight-compact-notes/result.json), [B admission](personamem/context-admission.json), [C preflight](selectivity-v2/preflight/result.json). Exact historical C episode usage is unknown; its conservative reservation is not exact spend. |
| A1 four development oracle tasks, isolated gold, actual ARE state | Fulfilled by explicitly different sequential successor; original overlength disposition preserved | [A prepare](longmemeval-sequential-v2/prepare.mjs), [ledger](longmemeval-sequential-v2/ledger.mjs), [inputs](longmemeval/inputs.json), [gold](longmemeval/gold.json). Actual source events and unverified note claims, not fabricated preference lessons. |
| A2 native scoring/calibration/accounting | Fulfilled for adapted protocol | [rubric](longmemeval/native-rubric.py), [calibration](longmemeval-sequential-v2/scorer-calibration.json), [final review](longmemeval-sequential-v2/FINAL-REVIEW.md), blind reviews; six synthetic checks do not establish population evaluator accuracy. |
| A3 hypotheses, reviewed admission and freeze | Fulfilled in versioned successors/amendments | [A freeze](longmemeval-sequential-v2/freeze.json), [recovery review](longmemeval-sequential-v2/recovery-v1/FINAL-REVIEW.md), [tail review](longmemeval-sequential-v2/finish-independent-control/FINAL-REVIEW.md). |
| A4 sixteen scheduled answer slots | Accounted with valid failure, not sixteen completed answers | [final result](longmemeval-sequential-v2/finish-independent-control/RESULTS.json): 15 completed, one failed; 61 successful generations, one failed, two blocked. Post-stop changes are disclosed descriptive amendments. |
| A5 scores, categories, pairs, tokens, reviewed decision | Scores/usage/decision present; requested explicit category and pair summary pending at this snapshot | [result](longmemeval-sequential-v2/finish-independent-control/RESULTS.json), [D02/D04](longmemeval-sequential-v2/finish-independent-control/observations.json), per-answer reviews. |
| B1 eight source-pinned disjoint personas and attribution | Fulfilled | [selection](personamem/selection.json), [README](personamem/README.md), source/visible/evaluator isolation. Four strata per split; forgetting stratum honestly marked derived, not native. |
| B2 full histories and context admission | Fulfilled as blocked admission outcome | [admission](personamem/context-admission.json): 31629–32127 input tokens, zero generations, oracle system removed. |
| B3/B4 calibration, freeze, live quality run | Blocked and unexecuted, not passed or scored zero | [README](personamem/README.md), [observations](personamem/observations.json), [successor research](personamem/SUCCESSOR-RESEARCH.md). Full-exposure source-volume estimate exceeds branch budget; proposed alternate exposure would be another study. |
| C1 original four development/four reserved families | Fulfilled | [episodes](selectivity/episodes.json), [gold](selectivity/gold.json), authorship statement in [README](selectivity/README.md); no restricted rows copied. |
| C2 actual recurrence/offer/consent/scope/override/revoke lifecycle | Fulfilled | [adapter](selectivity/adapter.mjs), [tests](selectivity/offline.test.mjs), reviewed source projections and restart evidence. |
| C3/C4 structural/semantic checks, freeze and paired run | Fulfilled successor, inconclusive benefit | [result](selectivity-v2/RESULTS.json), [blind review](selectivity-v2/blind-review.json), [observations](selectivity-v2/observations.json). Explicit AAR/MR-inspired presentation still needs completion below. |
| Reserve isolation and no favorable-outcome looping | Preserved in schedules and reviews | Only four development tasks per executed branch; reserved fixtures are prepared evidence, not scored runs. Failures retained and hypotheses/protocols versioned before successors. |
| Storage policy | Current package below cap; disk guards implemented | Execution directory measured about 13 MiB in this audit; hydration/launchers enforce two-GiB floor. No claim about every unrelated workspace cache. |
| D02/D04 observations and decisions | Fulfilled for all three branches | Native verifyEvolutionRecord returned ok for all six records in [A](longmemeval-sequential-v2/finish-independent-control/observations.json), [B](personamem/observations.json), [C](selectivity-v2/observations.json). No D05 improvement retention is asserted. |
| J synthesis and D07/D08 integration | Synthesis present; final current-graph integration pending verification | [RESULTS.md](RESULTS.md), [historical tracking](work-tracking/README.md), [D07-v1](work-tracking/D07-SUCCESSOR.md). Historical A-v2 snapshot still says seven answers; do not overwrite it or present it as current. |

## Remaining finite closure work

1. Add a current additive D07/D08 version linking final A D02/D04 and amended fixed-slot
   outcomes, retaining B blocked and C inconclusive. Verify native graph/replay and
   source bindings. Preserve historical snapshots and identify the current entrypoint.
2. Publish A's requested category and pair counts without rewriting frozen raw outputs.
   From the reviewed rows, control/treatment successes per two planned slots are:
   preference 2/1, update 2/1, multi-session 0/0, abstention 2/1 (including failed slot).
   Eight paired outcomes: both pass 3, control only 3, treatment only 0, both fail 2.
   These are amended descriptive counts, not significance estimates.
3. Publish C's AAR-inspired appropriate application 4/4 per arm (apply/change), and
   blind MR-inspired 1/4 per arm over suppress/override opportunities, with override
   subgroup 1/2 per arm. Parsed-only automated misapplication counts are incomplete;
   keep them separate from blind classification and strict combined primary score.
4. Reconcile the synthesis's remaining-work sentence and current evidence links after
   the new graph/summary artifacts pass checks. Then run the coordinator's final
   raw-receipt/accounting audit and verify no required launch/process remains live.

## What is already clear

C shows tied semantic quality with higher treatment token use; its extra strict pass
occurs without state exposure. A's adapted result shows 6/8 control versus 3/8 treatment
task success and worse treatment completion, at higher treatment tokens. B shows only
that this fixed protocol cannot admit its selected histories. No configuration earns
retention as a demonstrated quality improvement, and the reserve gate is not met.
These are useful negative results; successful improvement was not the pilot's stated
completion criterion. A future recovery/retrieval hypothesis or larger-budget B run
belongs to a reviewed successor, not an obligation to retune this pilot until it wins.

## Open Questions

Coordinator owns the current D07/D08 closure and raw-evidence completion audit. Which
facts were lost in bounded notes, and does query-time exact evidence recovery improve
quality per token? Should PersonaMem receive a larger full-exposure budget or a
separately named equal-source-availability retrieval study? Those scientific questions
remain open after bounded-pilot closure and are not silently marked solved.
