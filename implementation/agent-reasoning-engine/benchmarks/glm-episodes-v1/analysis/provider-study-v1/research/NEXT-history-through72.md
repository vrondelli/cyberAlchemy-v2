# Historical frontier updates through request 72

These are preserved snapshots. Session IDs described as active below may be terminal. Use [NEXT.md](NEXT.md) for current state. Open questions are owned there.

# Next research frontier

The original opt-in small-window profile already passed its [36/36 final gate](../../../evidence/complete-transport-qualification-2026-09-09/README.md), as recorded by the [single GLM finish tracker](../../../../../GLM-FINISH-PLAN.md). H12–H15 are successor first-proposal and dense-context research. Their new pager and prompt candidates are not covered by the original qualification; their failures do not revoke that historical result. The active research goal is to identify and test a defensible engine improvement, not repeatedly reopen M1.

[H12](../pressure-v5/verification.json) repaired the dense fixture across three real recycles with confirmed recovery while the original pager blocked on identical inputs. H14 establishes measured admission/recovery across its 24 rows but does not support the general review prompt. H15 is the current mechanism test.

## Current continuation

H13 replication stopped on a 10K schema/semantic failure after successful recycling. [H14 is complete](../contract-window-v1/review-final/report.json): review qualifies 7/12 versus baseline 6/12, net +1 rather than the required +3. Its [receipt audit](../contract-window-v1/verification.json) confirms actual recycling and archive recovery for all 24 rows. The [complete raw-source audit](../contract-window-v1/cause-summary.json) finds 9/12 semantic passes for review versus 10/12 for baseline, seven schema failures and four unchanged-source proposals (overlapping once). Do not restart H14 or promote its review card.

[H15 completed](../source-instruction-v1/review-final/report.json): clarified instruction 4/4 versus baseline 2/4 in its narrow pilot. [H16 completed](../source-replication-v1/review-final/report.json): baseline 8/8 versus clarified instruction 7/8 in the missing conditions, with raw semantic success 8/8 in both arms. H16 has no baseline no-ops, so its mechanism result is inconclusive and its improvement screen is not met. All 16 recovery gates passed. Actual H16 calls were 208 model / 248 tokenizer with no retries; exec session `82515` exited successfully.

The [57-record/77-edge DAG](dag-frontier-63-final.json) preserves both observations. Its [H2 frontier decision](metadata-frontier-63.json) selects the already-frozen metadata/host-envelope comparison, rather than another instruction tweak. The [output-budget audit](h14-output-budget-audit.json) shows H14's seven metadata omissions ended normally at 438–680 output tokens under the 2,048 cap; it does not support increasing that limit as a remedy. The [fact-probe design](FACT-PROBE-DESIGN.md) remains a separate M2 construction task with tested loopback capture but no versioned-fact live result.

## Product construction

The original H2/H3 controller is now running in exec session `28058`, request `glm-contract-resume-64`, from the existing 20-row prefix. [Resume binding](resume-64.json) fixes the remaining 100-row allowance at 1,280 model / 2,560 tokenizer attempts within the original full-study caps. Do not redispatch while this process is active. [Latest resumed snapshot](resume-64-snapshot-2/report.json) contains 41 completed rows; live completion may be further ahead.

Runnable work: monitor that exact process, retain every failure, and finish the original schedule before final screening. Owner: ARE implementer/evaluator. Keep the original candidate, calibrated cards, host-envelope contract and no-retry controller; the byte pager and clarified sentence must not be substituted. Review partial observations without changing the 24-pair comparison rule. H16 justifies resolving the still-open contract question; it is not evidence of an H2 treatment effect.

Retained candidate evidence: byte-bounded paging has measured admission/recovery evidence across the pressure chain and H14–H16. The clarified sentence remains an experimental candidate with mixed, separately reported evidence. Neither is activated by these records.

Use actual `completionBudget` limits at each window: 16 model / 32 tokenizer attempts at 8K, 12 / 24 at 10K and 12K. Do not add provider retries or replace failures. Declare the exact total cap before dispatch. Exposure calibration must not spend hidden model attempts; distinguish scripted setup, tokenizer-only measurement and live model evidence.

Acceptance requires canonical output validity, hidden semantic checks, all required delivered bytes, actual recycling when testing continuity, meaningful archive recovery, no unknown delivery, and every measured dispatch under its selected threshold. Delayed and revised-fact checks remain necessary to move beyond the current minimal archive-recovery metric. Two known task families do not establish unseen-family generalization.

## Existing study

The fixed H2/H3 study resumed from 20/120 rows, 14 initial passes and 80 model/80 tokenizer calls. Its latest resumed snapshot records 41/120 rows, 29 initial passes and zero recycled trials. Supplemental source audits cover all 41, with 32 raw semantic passes and no unassignable sources. The legacy partial comparison does not include these supplemental semantics; final screening does. Continue only in its existing `live-run` directory and frozen order. Its candidate is unchanged. Never substitute the new pager into that cohort. Current net wins: metadata versus baseline +1, host-envelope 0, boundary versus neutral +1; no screening winner. Old retained invalid outcomes must remain failures.

## Operational lane and blockers

User owns later candidate selection and operational adoption. H15 and H16 have completed; their directories and reservations remain immutable. No credential or container blocker is known; the existing bridge and pinned validator worked. Exact admission of the new pager, serving activation, publication and commits remain separate. ARE learning records grant none of those effects.

The canonical ImprovementRetention constructor currently requires latency-shaped comparison fields. Do not invent latency savings or misuse that record for this correctness result; the candidate manifest and verification preserve exact implementation/evidence identity meanwhile.

## Open Questions

Does byte-bounded paging retain its benefit across windows and natural Unicode-heavy tasks? Can delayed and revised facts survive observed recycling, beyond retrieving one archive page? Does metadata guidance combine safely with the paging change? These questions require separately bound successor experiments; the current candidates cannot inherit the original profile’s qualification. Stronger continuity and larger-window work belongs to M2 of the single finish tracker, not a newly imposed M1 exit rule.

## Final H2/H3 audit commands

After the exact controller has exited and all 120 rows are complete, use paths under `provider-study-v1`:

1. `node research/verify-complete.mjs frozen live-run research/final-integrity.json`
2. `node research/finalize.mjs frozen live-run research/raw-audits-v1 research/final-contract-study`

The finalizer binds [screen-binding-64-r2.json](screen-binding-64-r2.json), applies the unchanged frozen thresholds, and preserves counterevidence precedence in canonical learning decisions. [Final-screen tests](final-screen.test.mjs) pass, including the retained schema-rejected baseline whose raw source is better than host-envelope output. [Raw-source audits](raw-audits-v1/) are supplemental and never replace original outcomes. If the controller stops early, preserve its terminal evidence and report incomplete pairs; do not call final screening or restart uncertain reservations.

## Request 65: confirmed local context gap

The [new fact probe](fact-probe-v1/RESULT.md) supersedes the earlier statement that versioned-fact construction is still untested. H17 was inconclusive because its unpressured controls failed too. Prospectively revised H18 confirms that ordinary observation masking can remove the decisive Markdown fact before submission without recycling: 9/9 immediate controls correct, 0/9 delayed unpressured and 0/9 delayed pressured answers, with all 27 generic gates passing. These are scripted context-only outcomes, not GLM accuracy. Independent receipt/source audit and two adversarial verifier tests pass; no provider calls or serving changes were added.

The current completed research history is [dag-fact-65-final.json](dag-fact-65-final.json), 66 records and 94 edges. Product frontier: freeze and test a general bounded evidence-recovery phase before submission. It must permit recovery after masking even without a recycle, and must not inject oracle answers or task-specific fields. Exact unresolved design choices are in [the result's Open Questions](fact-probe-v1/RESULT.md#open-questions).

Original H2/H3 controller remains active in session `28058` under request 64. [Request-65 snapshot](resume-65-snapshot/report.json) has 67/120 rows, 49 initial passes, zero recycled trials. This is incomplete and the old partial analyzer does not include supplemental raw-source semantics. Keep the frozen order and every failure. The retained b3 host-envelope semantic regression still matters for final screening. No new controller was started.

At full original completion run the two final audit commands above, then `node research/assemble-contract-final.mjs research/dag-contract-final.json`. The assembler includes the request-65 fact branch so the final comparison does not discard that history. Operational adoption and larger live cohorts remain separately bounded; original M1 qualification remains historical evidence.

## Request 66: tested recovery affordance

[H19's isolated candidate](../recovery-phase-v1/RESULT.md) keeps bounded archive reads available alongside submission after required inspection, reserving the existing final turn. Its 90 scripted cases pass the prospective screen: both arms 9/9 immediate controls; candidate 27/27 delayed valid repairs versus baseline 0/27; candidate 9/9 invalid archive references blocked without proposals. Wire/source audits and two adversarial tests passed. No provider calls or serving changes.

Three additional irrelevant-recovery cases preserve the exact final-turn budget but still propose UNKNOWN. This is retained as an inconclusive limitation, not a repaired semantic failure or proof of autonomous model recovery. The [74-record/112-edge DAG](dag-recovery-66-final.json) now includes prospective H20: does GLM select decisive archived evidence when recovery remains available? [Live design](../recovery-phase-v1/LIVE-DESIGN.md) is unbound and unexecuted; exact fixtures, schedule, source/semantic evaluator and physical-call caps must precede dispatch.

The original comparison is still active in session 28058. [Request-66 snapshot](resume-66-snapshot/report.json) records 79/120 rows, 56 initial passes and zero recycled trials. Do not treat partial gated semantics as supplemental raw-source semantics, and do not select a winner before the original full screen. The final assembler now starts from dag-recovery-66-final.json to preserve this research branch.

## Requests 67–68: live pipeline active

H20 preparation is now concrete in [live-recovery-v1](../live-recovery-v1/README.md): 24 fixed rows, 12 pairs, 320 model/640 tokenizer maximum attempts, one worker, no retries. Three preflight tests passed, including positive and negative pinned-sandbox checks for all 12 fixtures. Twelve loopback cases passed against the actual frozen documents. [Readiness](../live-recovery-v1/readiness.json) pins those checks. The first oracle preparation was rejected before provider use for missing validator result wrappers; [preflight revision](../live-recovery-v1/preflight-revision.json) preserves it separately. No task API or expected semantic answer changed.

Original session 28058 exited at 95/120 after b18-host-envelope's final model request timed out after 60 seconds. Its dispatched request and unknown response remain a failed row. [Resume audit](resume-68.json) verifies all 95 completed bindings and exactly 25 unstarted rows; no ambiguous unfinished reservation exists. The remaining original reservation is 300 model/600 tokenizer attempts within its initial 1600/3200 caps. No failed trial is retried or replaced.

**Active unified exec session: 64969.** It runs [pipeline.mjs](../live-recovery-v1/pipeline.mjs) under request glm-original-remainder-68 and [execution-binding.json](../live-recovery-v1/execution-binding.json). It first executes only those 25 unstarted rows, then requires all 120 completed and runs original integrity, supplemental raw-source final screening and DAG assembly. Only after those succeed does it start the separate fixed H20 cohort, final review and final research DAG. The stages do not overlap. Any further infrastructure stop or audit failure halts the sequence; inspect the exact handle and retained row before further action. Do not launch a second controller or rerun finalizers while this process is active.

The current prepared DAG is [dag-live-67-prepared.json](dag-live-67-prepared.json), 75 records/113 edges. Original final assembly uses it, then H20 final assembly extends that result. The user goal remains active: the live model-selection result, original final screen and their interpretation are still pending. Serving activation and publication remain separate.

## Request 70: second terminal timeout retained

Pipeline 64969 terminated after the original controller reached 108/120. b21-neutral-card's final model request exceeded its unchanged 60-second deadline; its unknown response remains a failure alongside b18-host-envelope. H20 still had zero provider trials. [Resume-70 audit](resume-70.json) verifies all 108 completed row bindings and exactly 12 unstarted rows, with no unfinished reservation. Their remaining allowance is 144 model/288 tokenizer attempts within the original total cap.

**Current active unified exec session: 9377**, replacing terminal 64969. Same pipeline sequence, now under request glm-original-remainder-70: only the 12 unstarted original rows, full original audits, then the unchanged 24-row H20 cohort. Prior pipeline source and execution binding are preserved as pipeline-68.mjs and execution-binding-68.json. Current execution-binding.json pins the new remaining-row allowance and effect. Do not repeat either failed model request or start another controller. Inspect session 9377; a timeout observing that handle does not mean its process stopped.

## Original comparison completed; H20 running

Session 9377 has completed all 120 original rows, final integrity, supplemental semantic screening and the original research DAG. [Contract result](CONTRACT-RESULT.md): metadata reminder supports its pilot screen (17/24 versus 14/24, three wins/no losses/no semantic regressions); host envelope and boundary guidance fail their fixed screens. All 480 model/480 tokenizer attempts are accounted for, including two retained deadline failures with unknown usage. No retries, source effects or unsafe dispatches; zero recycling exposure.

**Session 9377 is now running the fixed 24-row H20 live recovery study.** Do not rerun original audits or start another controller. Its later pipeline stages will review H20 and create dag-live-67-final.json. The current completed DAG is dag-contract-final.json (82 records, 128 edges). H20 has no final result yet, and no source or scoring changes are allowed during the cohort.

## Requests 71–72: H20 second repetition active; H21 local result retained

Pipeline9377 is terminal. H20 stopped after 12/24 completed rows when b5-baseline's final model request hit its 60-second deadline. Its original live/stop.json remains unchanged. First repetition: baseline and recovery each pass 3/3 visible controls; candidate delayed passes 1/3, baseline 0/3. Candidate failures are an explicit abstention after repeated recovery and an archive-reference validation failure (the model referenced a prior archive call rather than an original file-read call). The 5/6 delayed success floor is now unattainable, but the unchanged fixed cohort is still being completed. No failed row is retried or replaced.

**Current active unified exec session: 49395.** It runs live-recovery-v1/resume-pipeline-72.mjs under request glm-h20-remainder-72. [Resume audit](../live-recovery-v1/resume-audit-72.json) and [execution binding](../live-recovery-v1/resume-execution-binding-72.json) verify the complete prefix and retain the stop marker. Only the 12 unstarted rows may run, reserving 160 model/320 tokenizer attempts within the original H20 320/640 cap. The reviewed resumer is a separate file; frozen run.mjs, candidates, fixtures and scorers are unchanged. A further stop is retained separately as stop-resume72.json and halts the sequence. On all 24 completions, the pipeline runs the frozen final review, final H20 DAG and a separate join with H21 local evidence.

[H21 local result](../admission-before-masking-v1/RESULT.md): try complete inspected history before masking, under the existing admission check. Both arms pass nine immediate controls; candidate passes 9/9 unpressured delayed cases versus baseline 0/9 with no extra model calls. All 18 pressured cases still fail semantically under the existing fallback. All 54 scripted receipt/source/admission checks pass; 342 scripted model/378 tokenizer calls, zero provider calls. This is not a live GLM or pressured-continuity qualification. H20 remains unchanged. A distinct live H21 freeze is a possible next step only after H20 review.

The current joined local DAG is [dag-admission-71-local.json](dag-admission-71-local.json), 89 records/141 edges. The completed original contract result is [CONTRACT-RESULT.md](CONTRACT-RESULT.md). The exploratory repeated-recovery anomaly is preserved separately in recovery-anomaly-70.json; its first visible pair used 12 versus 4 calls. Do not change current H20 scoring to absorb those process observations.
