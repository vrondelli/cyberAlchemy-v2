# First real benchmark run

**Completed: two live GLM-5.3-Flash development episodes on the real SWE-bench-Live task `sveltejs__svelte-16666`. Neither produced an accepted patch.** This is an observed failure result, not GLM qualification or an official leaderboard score.

The task is a Svelte compiler bug: an awaited variable rendered inside a snippet becomes undefined. Its original issue statement is preserved in [task.json](prepared/task.json), from the pinned [SWE-bench-Live MultiLang dataset](https://huggingface.co/datasets/SWE-bench-Live/MultiLang). Dataset revision, repository commit and image identity are bound in [source.json](prepared/source.json) and [image.json](prepared/image.json).

## Actual outcomes

| Measure | Baseline envelope | H23 payload projection |
|---|---:|---:|
| Model attempts | 12 | 12 |
| Tokenizer attempts | 13 | 13 |
| Provider failures / automatic retries | 0 / 0 | 0 / 0 |
| Local recycling events | 1 | 1 |
| First dispatch after recycling | 9 | 5 |
| Archive reads after recycling | 3 | 7 |
| Distinct returned archive pages | 1 | 1 |
| Accepted patch | None | None |
| Terminal guard | Uninspected mutation rejected | Uninspected mutation rejected |
| Model input tokens | 55,669 | 38,237 |
| Model output tokens | 1,374 | 1,741 |

All 24 dispatched model requests were reconstructed from their captured inputs and matched to their transport receipts. No dispatched input plus reserved output exceeded the local 12,000-token threshold. Source-preserving projection replay passed. Task containers were removed and their absence verified. The estimated model charge at list prices is USD 0.01564; this is a usage estimate, not a billing receipt.

There was no valid prediction diff to submit to the hidden-test evaluator. Therefore the two task attempts are unresolved, while the semantic correctness of rejected proposal code remains unknown. Do not describe these as two patches that failed the tests. The payload response proposed a placeholder path that had never been inspected, and the guard prevented its application. The baseline's rejected final response was not retained by v2; its guard outcome and request receipts are retained, but its contents cannot be reconstructed.

The trajectories differ. The treatment's lower total token use and earlier recycling do not establish an H23 efficiency improvement or regression. This is one development task, with a common adapted executor and a declared controller revision, not a held-out or unchanged-code qualification pair.

Machine evidence: [assessment](assessment.json), [baseline result](evidence/live-v2-baseline/result.json), [payload result](evidence/live-v3-payload/result.json), [payload responses](evidence/live-v3-payload/responses.json), and [research records](research-result.json).

## Concrete diagnosis

After recycling, the adapter advertises a newly generated full-history archive digest on every turn. Both episodes repeatedly requested offset zero of the newly advertised archive. Each call succeeded but returned the same initial 1,024 characters within its episode. Neither episode advanced through the archive before final submission.

This behavior is directly established by tool arguments, returned ranges, page hashes and dispatched prompts in [diagnosis.json](diagnosis.json). It identifies a defect in the new external-task recovery interface: changing handles and raw-history paging consume the remaining turn budget without recovering additional evidence. It does not prove that every existing ARE profile has this behavior, or that GLM's native context capacity is inadequate.

H23 removes envelope overhead while preserving payload. It does not fix this archive interaction. The next candidate hypothesis is to keep the active recovery reference stable and make cursor/file-span progress explicit. That hypothesis is sealed in [next-hypothesis.json](next-hypothesis.json), linked to the preceding research record. Its improvement remains untested.

## Evaluator qualification

Before any model call, the task's original code and reference patch were evaluated in separate clean containers:

| Expected checks | Original code | Reference patch |
|---|---:|---:|
| FAIL_TO_PASS labels | 65 / 67 pass | 67 / 67 pass |
| PASS_TO_PASS labels | 5,120 / 5,120 pass | 5,120 / 5,120 pass |
| Missing expected labels | 0 | 0 |

The original code fails the two relevant snippet checks; the reference passes all 5,187 expected labels. See [normalized base preflight](evidence/preflight-base-normalized/report.json) and [reference preflight](evidence/preflight-gold/report.json).

Two benchmark/harness defects were made explicit rather than hidden. The published test command did not produce complete verbose output, and the initial process limit prevented Chromium startup. The corrected invocation uses complete verbose reporting, two test workers, a 30-second per-test timeout and a larger process allowance. Also, expected test names omit prefixes emitted in verbose output. Conservative suffix matching requires every matching full test to pass; missing labels fail, and ambiguous matches cannot hide a failure. The raw upstream predicate is retained separately and reports false even for the gold patch due to the name mismatch.

These resource and identification adaptations mean the result uses upstream task assertions through a custom harness. It is not an official SWE-bench-Live submission. The initial [failed preflight](evidence/preflight-base/report.json), complete v2 test output and normalized re-scoring evidence remain retained.

## Implementation and revisions

The isolated package implements pinned task preparation, closed task/tool schemas, bounded repository tools, a GLM transport/recycler composition, H23 projection, isolated patch evaluation, conservative test identification, capture reconstruction and ontology-linked research records. It does not change the default ARE runtime or serving configuration. Native ContextBench integration remains a later part of the plan.

A v1 startup error tried to read a checkpoint before creation. It consumed zero model/tokenizer calls and is preserved in [its result](evidence/live-baseline/result.json). The corrected ledger binding passed an offline test before v2 ran. The baseline then reached a valid guarded task failure; a reviewed prelaunch condition permitted the remaining payload episode, with no change to model-visible instructions, tools, context policy or output limits. That revision also added final-response capture. [Controller review](evidence/controller-review.json) and [exact diff](evidence/controller-review.diff) expose this change.

The complete request used 24 model and 26 tokenizer calls, within the original two-episode ceilings. No provider attempt was retried, no model failure was replaced, and the original startup failure remains counted separately. The completed evidence does not authorize another live cohort implicitly.

Validation includes four task/tool/projection tests, one real transport/recycler ledger initialization test, four scorer identity tests, real-container read/traversal/commit checks, full base/reference preflights and replay/accounting checks of both live episodes. Durable source and run bindings are in the prepared manifests. No commit, publication or default activation was performed.

## Next construction frontier

Implement a separately frozen recovery candidate that keeps one active archive handle stable, exposes useful file/span references and preserves retrieval progress across turns. Add a deterministic test for repeated offset-zero requests and preserve the inspected-file scope guard. Then use a newly declared development comparison to test whether useful evidence is recovered within the same resource envelope. Do not repeat the current unchanged cohort hoping for a favorable score.

## Open Questions

- Does a stable archive handle alone change GLM's paging behavior, or is an indexed retrieval interface required?
- How much task evidence survives the transition when source ranges are indexed explicitly?
- Is the common external agent's 12-turn/2,048-output-token envelope sufficient for this task family?
- Can the next candidate produce a valid patch while retaining all scope and provenance checks?
- Does any improvement generalize beyond this development issue? The larger external benchmark plan and full GLM finish plan remain open.
