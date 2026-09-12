# Archive recovery fix: implemented, live effectiveness unresolved

The bounded [plan](PLAN.md) is implemented in [recovery.mjs](recovery.mjs) and integrated into the isolated [runner](run.mjs). The controller fixes the adapter defect diagnosed in the [previous episodes](../diagnosis.json): it anchors a history digest once per recovery generation, retains a validated next-unread cursor, and returns an explicit correction instead of redelivering an old page. A bounded index of successful source reads allows direct source navigation after recycling. Existing proposal scope guards remain in force. No serving default was activated.

## Verification

All 14 checks passed: five recovery regressions, four existing schema/projection checks, one transport-ledger check, and four evaluator-scoring checks. The recovery suite tests the historical three- and seven-request repeated-first-page patterns, stale handles, skipped offsets, invalid backend pages, EOF, generation changes, and bounded source indexing. Its integration test uses the actual recycler and persisted archive: current-history hashes change while the anchored archive and cursor remain valid. See [test source](recovery.test.mjs) and [check record](evidence/offline-checks.json).

The [freeze](freeze.json) pins 65 source/evidence files. Previous v2/v3 freezes were verified before dispatch and remain unchanged. The [experiment](research.json) was sealed before the live run. The subsequent [audit](assess.mjs) verifies source hashes, reconstructs all 12 dispatch bodies, replays the H23 projection, and checks context admission, budgets and cleanup. It is a post-run diagnostic audit, not a preregistered statistical evaluator.

## One real-task development episode

Task: `SWE-bench-Live/MultiLang`, `sveltejs__svelte-16666`, using the unchanged [public task projection](../prepared/task.json), [dataset provenance](../prepared/source.json), and [pinned image](../prepared/image.json). The model received no reference patch or hidden evaluator metadata.

| Measure | Observed result |
| --- | --- |
| Model attempts | 12; 11 successful responses, final request timed out |
| Tokenizer attempts | 12 |
| Automatic retries | 0 |
| Successful source reads | 6, across 5 source files |
| Largest admitted input/output bound | 11,864 tokens, below the 12,000 local threshold |
| Recycling / archive reads | 0 / 0 |
| Accepted patch | None |
| Hidden task evaluation | Not run: no proposal to evaluate |
| Episode duration | 169.849 seconds |
| Container cleanup | Verified |

GLM inspected await transformation, async runtime, fragment, snippet and await-block source. The final request returned no response bytes and hit its configured 60-second deadline after 60.143 seconds. This was a per-request timeout, not the 720-second episode deadline. There is no final patch content to assess. The observed 49,882 input and 1,303 output tokens cover received model usage; the USD0.008134 list-price estimate excludes unknown server-side usage for the timed-out request and is not a billing total.

Evidence: [assessment](assessment.json), [provider receipts and run result](evidence/live/result.json), [full received responses](evidence/live/responses.json), [tool events](evidence/live/events.json), [recovery state](evidence/live/recovery.json), and [research observation and decision DAG](research-result.json).

## Interpretation and next bounded work

The deterministic interface defect is fixed. Live recovery effectiveness is still untested because this episode never crossed the threshold; zero duplicate pages is therefore not live evidence of improvement. The trajectory is stochastic and the treatment notice was never active, so useful source inspection cannot be attributed to the recovery fix. This is one previously seen development task with a custom bounded executor, not an official benchmark score or GLM qualification.

The next useful experiment is a frozen, controlled pressure condition on a real task that necessarily exercises a recovery transition, with the same evidence-access boundaries. Separately investigate final-submission latency using the retained request/timeout evidence before selecting a timeout policy. Do not quietly enlarge this completed experiment's limits or rerun it as though the failure did not happen. Any accepted future patch must use the existing isolated task evaluator; the unchanged base/reference preflights remain linked in the parent report.

## Open Questions

Does GLM follow the recovery cursor under controlled pressure? Does the inspected-source index preserve useful navigation? Was final-response latency transient or systematic? What timeout policy supports reliable final submissions? Broader model qualification and deployment remain outside this candidate; [PLAN.md](PLAN.md) owns the outstanding recovery questions.
