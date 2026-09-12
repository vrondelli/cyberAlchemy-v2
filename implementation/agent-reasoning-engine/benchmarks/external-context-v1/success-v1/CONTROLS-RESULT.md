# First verified model repair example

**M1 is achieved:** the fresh GLM-generated patch for `sveltejs__svelte-16666` passes the public asynchronous and synchronous checks in DOM and hydrate modes, then passes **67/67 repair labels and 5120/5120 regression labels in two fresh evaluators**. Both evaluations report zero missing and zero failed expected labels. The small-window chapter and pressure milestone are not yet complete.

[Verified artifact manifest](verified-example.json) · [first evaluation](evidence/controls-1/evaluation/report.json) · [fresh reproduction](evidence/controls-1/reproduction/report.json) · [independent audit](assessment-controls-1.json) · [exact model patch](evidence/controls-1/prediction.patch).

## What changed

The public probe now combines the original async reproducer with an operator-authored synchronous snippet control. The control passes on original source and fails on the previous model candidate, which omitted synchronous snippet declarations. These [baseline](evidence/sync-baseline/report.json) and [prior-candidate](evidence/sync-prior-candidate/report.json) checks ran before the fresh episode. No private test body or reference patch was used to author the control; it follows public snippet semantics and inspection of the previous candidate branch change.

Each new candidate must pass both controls before submission. Three deterministic tests verify combined success/failure classification, candidate identity and cleanup checks, and the combined tool identity. The runner passed its syntax check. Previous frozen implementations and evidence remain unchanged. No production policy was promoted.

GLM independently produced a source-only change in `transform-client.js`: synchronous components retain their snippet declarations; components with top-level await declare snippets inside the async body. No prior model patch was supplied in the fresh episode. The exact candidate was exported against the initial image filesystem, avoiding unrelated dependency edits, and reused without alteration for both private evaluations.

## Observed run

The episode used 13 model calls and 15 tokenizer calls, completed in 256 seconds, staged one candidate, and passed its first combined public probe. There were no rejected or placeholder edits. Two context recycles occurred; the maximum admitted input-plus-output bound was 11,809, below the local 12,000 threshold. Accounting, exact request projection, patch identity and cleanup audits passed. Model-call list-price estimate: USD 0.0138218 under retained pricing assumptions.

The [comparison](controls-comparison.json) and [research observation/decision](controls-research-result.json) retain the earlier 12-regression result beside this all-pass example. This single adapted development episode does not establish a causal treatment effect, a general model success rate, or live revision-after-failure behavior: the first candidate passed.

## Scoring boundary

These are results under the frozen custom evaluator with `all-matching-full-test-names-must-pass/v1`. Published short labels are matched to verbose full test names; every match must pass. There are 37 ambiguous labels among 6,346 parsed full test names. The raw exact-name `upstream_resolved` field remains false because that check does not normalize names; both strict normalized evaluations pass. This is not an official leaderboard submission or score. The model loop never received private evaluator tests or the reference repair.

Patch SHA-256: `854c999cc92f9f837ec8b9d4e2ea6c8a36ea80a89d02dbf19a4548c36bb46a79`.

## Open Questions

Next is M2: freeze a fresh pressure episode with the same public checks, without supplying this winning patch, demonstrate an observed 12K pressure transition, and require two all-pass evaluations again. The two natural recycles here are useful accounting evidence but do not replace that separately specified pressure test. Broader model qualification remains later work.
