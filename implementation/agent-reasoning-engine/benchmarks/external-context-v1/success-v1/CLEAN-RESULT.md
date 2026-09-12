# Clean first-benchmark result

**The first-benchmark goal is complete.** A fresh GLM episode on `sveltejs__svelte-16666` generated its own source patch after controlled context pressure, passed all four public checks, and passed **67/67 repair labels plus 5120/5120 regression labels in two fresh evaluators**. No infrastructure failure or protocol deviation occurred in this run. Previous failures and the earlier timeout deviation remain unchanged in their original evidence directories.

[Requirement audit and artifact manifest](clean-closeout.json) · [source freeze](freeze-pressure-strict-1.json) · [accounting/provenance audit](assessment-pressure-strict-1.json) · [pressure measurement](clean-pressure-transition.json) · [exact patch](evidence/pressure-strict-1/prediction.patch).

## Requirement evidence

| Requirement | Verified evidence |
| --- | --- |
| Same real task, image and dataset; immutable sources | [Consolidated manifest](manifest.json) and [98-source freeze](freeze-pressure-strict-1.json); all prior and current source hashes verified |
| Fresh model-generated source-only patch | [Tool events](evidence/pressure-strict-1/events.json), [model responses](evidence/pressure-strict-1/responses.json), candidate before/after file hashes linked in [closeout](clean-closeout.json); exact stage-to-submit-to-export attribution |
| Intended public baseline failure and final async/sync passes | [Fresh baseline preflight](evidence/strict-preflight/report.json); both final component reports and all four mode assertions linked in [closeout](clean-closeout.json), with unchanged fixture hashes |
| Measured pressure and context accounting | [Transition audit](clean-pressure-transition.json), [full accounting/projection replay](assessment-pressure-strict-1.json); every admitted bound below 12,000 |
| First full evaluation all-pass | [Score](evidence/pressure-strict-1/evaluation/report.json), [patch/evaluator invocation receipt](evidence/pressure-strict-1/evaluation/invocation.json) |
| Same exact patch passes again in fresh environment | [Repeat score](evidence/pressure-strict-1/reproduction/report.json), [separate invocation receipt](evidence/pressure-strict-1/reproduction/invocation.json) |
| Complete trace, budgets and cleanup; stop-rule conformance | [Closeout audit](clean-closeout.json) matches every model tool call to an event, checks all provider receipts and component probes, and verifies all cleanup receipts |
| Strict infrastructure-stop implementation tested | [Strict wrapper](strict-probe.mjs), [strict runner](run-pressure-strict.mjs), [stop tests](strict-probe.test.mjs); two stop tests and two pressure-boundary tests passed before this run |

## What the run demonstrated

The labelled padded request was 88,937 bytes. Tokenizer input 17,549 + retained reasoning 213 + margin 512 + output reservation 2048 produced a projected bound of **20,322**. The engine recycled before model dispatch; the next request advanced to generation one at **6,473**. Six recycles occurred across the episode, with maximum admitted bound **11,806**.

The model used **24 model calls and 30 tokenizer calls**, staged one candidate, ran one paired public probe, and finished in **330 seconds**. There were two schema rejections: an oversized read range and incorrectly typed hypothesis evidence references. Both were rejected before tool effects and corrected within budget; the closeout audit independently reproduced those validation decisions. There were no tool execution failures, provider failures, diagnostic infrastructure errors, automatic retries or cleanup failures. List-price estimate: USD 0.0267922 under retained assumptions.

The patch retains snippet declarations for synchronous components and places async component snippets inside the async body. The earlier winning patch and private reference repair were not supplied to this model episode. The exact exported patch hash is `a6f775721d6a6c3797b676068ff50aaf63dbc1c4d3182af1da9713d044e658e1`.

The prior pressure run proved repair correctness but continued after a probe timeout. The strict wrapper now propagates diagnostic infrastructure failures to the runner's terminal error boundary. The new frozen run observed no such failure, and deterministic tests verify that injected infrastructure failures prevent subsequent dispatch. This closes the specific protocol gap without altering the earlier evidence.

## Reproduce the artifact

From the checkout root, with the existing Docker image and evaluator cache available, select a new output directory and run:

```sh
node implementation/agent-reasoning-engine/benchmarks/external-context-v1/success-v1/reproduce-pressure-strict.mjs pressure-strict-1 /tmp/are-clean-reproduction-new
```

This validates frozen inputs, applies the saved model patch in a fresh evaluator, runs the full suite and writes patch/report binding receipts. It does not call a model. The output directory must not already exist.

## Scope and Open Questions

These results use the frozen `all-matching-full-test-names-must-pass/v1` scoring protocol. Both reports have zero missing and zero failed expected labels; every full-name match for 37 ambiguous labels passes among 6,346 parsed full test names. The raw exact-name `upstream_resolved` field is false because it does not normalize names. This is not an official leaderboard score.

M1 and a clean pressure-qualified first-task example are now verified. This completes the requested first-benchmark milestone, not all GLM qualification. Generalization across tasks, models and context sizes remains future work. The observed local recycle/admission evidence does not prove every provider-side compaction behavior.
