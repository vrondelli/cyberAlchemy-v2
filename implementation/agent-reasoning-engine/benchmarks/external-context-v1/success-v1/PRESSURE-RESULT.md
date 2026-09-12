# Fresh pressure repair: verified result with a protocol deviation

A fresh GLM episode produced a new patch after measured context pressure and revised a public-failing candidate. The final patch passed both public checks in DOM and hydrate, then **67/67 repair labels and 5120/5120 regression labels in two fresh evaluators**, with zero missing or failed expected labels. The winning M1 patch was not supplied to the model.

This establishes the observed technical result for M2, but **does not close a clean small-window chapter**: the runner continued after a public-probe infrastructure timeout despite the earlier plan's stop rule. Repair correctness and protocol compliance are reported separately.

[Manifest](verified-pressure-example.json) · [transition evidence](pressure-transition.json) · [audit](assessment-pressure-1.json) · [first evaluation](evidence/pressure-1/evaluation/report.json) · [fresh reproduction](evidence/pressure-1/reproduction/report.json) · [exact model patch](evidence/pressure-1/prediction.patch).

## Observed pressure and repair

After the first successful source read, 4,000 labelled padding repetitions created a generation-zero projected bound of **22,648**: 19,718 tokenizer tokens + 370 retained-reasoning reservation + 512 margin + 2048 output reservation. The padded prompt was 98,207 bytes, within the transport limit. It was measured but not dispatched to the model. The next model request advanced to generation one with projected bound **6,470**, below 12,000. Across the full episode, seven recycles occurred and every admitted bound remained below 12,000 (maximum **11,988**).

The model staged candidate one at turn 14. Its first probe hit an execution deadline, with verified cleanup. A later model-requested probe passed async and failed sync. After receiving that concrete test feedback, the model staged a distinct second candidate at turn 20; both controls passed, and it submitted at turn 22. No invalid or placeholder edits occurred. The final source-only patch preserves synchronous snippet declarations and places async snippets within the async body.

Totals: 22 model calls, 29 tokenizer calls, two candidates, three paired-probe requests; no automatic provider retries. The first request stopped after its async execution error, so five component checks actually ran. Episode duration: 950 seconds. Model-call list-price estimate: USD 0.02617855 under retained assumptions. Accounting/projection replay, candidate identity, artifact export and cleanup passed. Host load was high during the first slow probe; this is a possible contributing factor, not an established cause.

## Protocol deviation and fix

The [original plan](../success-plan-v1/PLAN.md) requires infrastructure failures to stop model dispatch. The frozen runner instead caught the probe exception and exposed it as recoverable tool feedback. The next probe was requested by GLM and remained within the four-request cap, but that does not satisfy the stop rule. The timeout and every subsequent event are preserved; no failure was overwritten or relabelled as a test pass. See [deviation record](pressure-protocol-deviation.json).

The separate [strict probe wrapper](strict-probe.mjs) now classifies execution/cleanup failures as terminal infrastructure errors, while ordinary candidate test failures remain revisable. Two tests passed, including asserting that no subsequent dispatch executes after such an error. The [future strict runner](run-pressure-strict.mjs) integrates this behavior and requires its own new freeze; it cannot reuse this episode's freeze or output directory. It has not had a live validation run. Existing frozen sources remain unchanged.

## Scope and Open Questions

Both evaluations use the existing strict full-name normalization protocol, not an official leaderboard score. The raw exact-name upstream field remains false; all normalized expected labels pass, including every match for 37 ambiguous labels among 6,346 parsed test names. No private test bodies or reference patch were supplied to the model.

Next: freeze and run the strict infrastructure-stop variant once in a stable environment, preserving this successful artifact and deviation. That is needed for a clean protocol-conforming pressure closeout. These two development examples do not establish general model reliability, behavior at all context sizes, or every provider-side compaction behavior.
