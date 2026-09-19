# Full-window GLM comparison — round 73

All eight assigned runs settled; all paid usage reconciled; three valid selections
scored with unchanged native ContextBench metrics. This is a completed exploratory
comparison, not a cleared benchmark or proof of ARE superiority.

## What changed

Both harnesses used GLM-5.3-Flash with a 1,000,000-token context capacity, replacing
the previous 8K restriction. [Z.AI documents 1M context](https://docs.z.ai/guides/vlm/glm-5.3-flash).
The same four exposed tasks, model endpoint, low reasoning,2,048 output cap,
96-call ceiling and 4M cumulative-token ceiling applied to both arms. Two VPS workers;
no retries of paid runs. Model capacity is distinct from total tokens across calls.

Official DSH 0.1.5-rc.2 used the existing pi-ai provider plugin and matched repository
tools. The proxy now forwards complete unsuccessful model responses unchanged,
including `length`, while charging their usage. DSH used native pruning and ordinary
90% compaction threshold; earlier dictionary rendering and 350-word guidance were
removed. ARE used its existing native runner with 990K recycle threshold. Internal
prompts, memory and completion policies differ: this compares complete harness
configurations, not a single-feature ablation.

## Results

| Task / arm | Calls | Total model tokens | Span-F1 | File-F1 | Outcome |
|---|---:|---:|---:|---:|---|
| 1-dsh | 14 | 209,572 | 2.68% | 28.57% | valid selection |
| 1-are | 61 | 228,315 | 0.00% | 0.00% | valid selection |
| 2-are | 14 | 50,419 | — | — | invalid tool-call response |
| 2-dsh | 9 | 46,452 | — | — | output cap: 2,048 tokens |
| 3-dsh | 8 | 49,482 | — | — | output cap: 2,048 tokens |
| 3-are | 44 | 130,415 | 48.86% | 85.71% | valid selection |
| 4-are | 58 | 181,240 | — | — | invalid tool-call response |
| 4-dsh | 19 | 301,032 | — | — | output cap: 2,048 tokens |

Tasks 1–4 are zstd, simdjson, cli and svelte. A valid selection satisfies the source
and delivery checks; it can still score zero. F1 measures overlap with reference
source context, not whether a patch is correct. Both arms changed source on task 1;
those patches were not tested for correctness. ARE's task 3 is a useful individual
result:48.86% Span-F1 and 85.71% File-F1 at 130,415 tokens. Its control did not complete.

ARE:2/4 valid selections,177 calls,590,389 tokens. DSH:1/4 valid selection,50 calls,
606,538 tokens. Unknown usage:zero in both arms. ARE used 2.66% fewer aggregate tokens,
below the 15% target; differing failure counts prevent interpreting this alone as
quality-preserving efficiency. Valid-only means use different task cohorts and
must not be compared as a treatment gain.

Only task 1 has two valid scored selections. DSH used 8.21% fewer tokens than ARE
and scored 2.68% Span-F1 versus 0%. Both scores are poor. This is a real comparison,
but one exposed task does not establish general harness superiority.

## What the evidence supports

H1 — removing artificial 8K pressure permits useful DSH completion: consistent with
one valid completion. Context, total budget, profile and proxy behavior changed
between historical runs, so their individual causal contributions are not isolated.

H2 — failures can arise independently of context capacity: supported here. DSH's
three failed runs ended with paid `length` responses at 2,048 output tokens. The
proxy remained unpoisoned and all costs are known. ARE's two failed runs ended with
`glm.tool-calls-invalid`, whose check requires a nonempty tool-call array of at most
eight entries. The retained receipt does not establish which array condition failed;
that distinction needs raw-response diagnostics, not an invented explanation.

H3 — ARE improves quality per token with large context: not established. Total-token
savings fall below 15%, only one task has paired valid scores, and that task favors
DSH on the measured quality and cost. Do not substitute successful-only averages
or treat inexpensive failed runs as efficiency.

No ARE context recycles and no DSH summary calls occurred. Maximum observed input:
9,099 tokens for ARE and 25,405 for DSH. Maximum admitted reservation:11,659 and 27,967
respectively. No DSH window denial occurred. This is full-window configuration,
not a demonstrated near 1M retention or boundary-capacity test.

## Next experiment, not dispatched

Keep 1M context and the fixed tasks. Test a matched 8,192-token output allowance
against this 2,048-token baseline. Falsifier: longer responses still fail to produce
valid selections, or added tokens do not improve completion/quality. Keep ARE's
response-handling policy fixed for that test so two changes are not mixed.

Separately audit `tool-calls-invalid`: retain bounded raw-response evidence and
produce complete shape diagnostics before choosing a recovery policy. Hypothesis:
valid diagnostic feedback can recover malformed model responses without inventing
or executing partial tool calls. Test that policy in a separate versioned comparison.
The initial objective remains reusable reasoning quality and continuity with at
least 15% token savings, followed by untouched confirmation; this pilot clears none
of those broader gates.

## Verification and artifacts

89 relevant offline tests passed. The actual DSH composed profile and four ARE
cells were checked without network access before dispatch. Native hypothesis and
experiment records precede paid execution. The prospective execution DAG has eight
tasks; completed research projection follows the observed results, never fabricated
future observations.

- [Prospective plan](PLAN.md), [native records](NATIVE-RESEARCH.json), [source freeze](evidence/FREEZE.json).
- [Completed observations and research DAG](RESEARCH-RESULT.json): 11 verified records, 6 projected nodes and 5 edges.
- [Complete results](RESULTS.json), [accounting verification](evidence/ACCOUNTING-VERIFICATION.json).
- [Scorer freeze](SCORER-FREEZE.json), [scoring recovery](SCORING-RECOVERY.json).
- [Evidence index](evidence/EVIDENCE-INDEX.json): full source clones and session stores remain on VPS.

The automatic finisher initially stopped before scoring because its new guard
incorrectly assumed evaluator files were included in the generation source closure.
Evaluator files intentionally stay outside model containers. A separate, explicit
post-generation scorer freeze corrected that guard. Original logs and freezes
remain intact; no model call or native scoring invocation was repeated.

## Open questions

Does a larger output allowance remove DSH's observed failures? What exact tool-call
array shape caused the ARE failures? Do valid source-selection scores predict useful
patches? Do differences survive unseen tasks and replications? Does the API admit
near 1M requests, and how accurately do both harnesses retain evidence there?
