# Fixed three-task context-window comparison

## Objective and preregistered sequence

Execute a fixed comparison on three previously unused Svelte tasks at 12K and 32K. Selection is frozen in [selection.json](selection.json): first three Svelte entries in the pinned dataset order, excluding the previously used task. No outcome-based substitutions. This is within-repository generalization, not cross-project generalization; model training exposure is unknown.

`freeze selection → acquire pinned images → prepare public issue probes → baseline/reference evaluator validity → parameterize and test harness → freeze entire matrix → six fresh model episodes → score all retained patches → reproduce passing patches → paired analysis and requirement audit`

| Order | Task | Window |
| --- | --- | --- |
| 1 | sveltejs__svelte-16309 | 12K |
| 2 | sveltejs__svelte-16309 | 32K |
| 3 | sveltejs__svelte-16542 | 32K |
| 4 | sveltejs__svelte-16542 | 12K |
| 5 | sveltejs__svelte-16417 | 12K |
| 6 | sveltejs__svelte-16417 | 32K |

Natural source-reading history only: no synthetic pressure padding. A run that does not reach a threshold is reported as unexercised, not proof of recovery. Each paired run starts with identical public task/probe evidence and no prior model outputs. Context thresholds are 12,000 and 32,000, with hard capacities 16,384 and 40,960; the hard capacities never admit requests beyond the lower recycle threshold. All other controls are identical across arms.

## Competing hypotheses

H1: context retention is a limiting factor; 32K reduces recycling and may preserve a fact needed for a correct repair. H2: causal diagnosis or exact edit construction is the limiting factor; 32K changes recovery frequency or cost without improving correctness. Compare retained facts, tool failures and candidate predictions after all six episodes. One observation per cell supports hypothesis generation, not a causal verdict. The machine research DAG is emitted into `research.json` at freeze.

## Frozen behavior and limits

Reuse the verified controller, hypotheses, exact source staging, finalization, schema validation, retained-reasoning accounting, projection and recovery modules. Adapt only task/image/probe plumbing and explicit context profiles before matrix freeze. A dedicated transport policy permits up to 262,144 request bytes in both arms so the larger token window is not accidentally constrained by the previous 131,072-byte harness limit. Response limit remains 262,144 bytes. All new boundaries are tested before provider calls. No production setting is changed.

Each episode: 24 model calls, 48 tokenizer calls, 2048 output tokens per call, two staged candidates, four public diagnostic requests, zero automatic retries, 120-second model deadline and 1800-second episode ceiling. Margin 512 plus exact retained reasoning reservations, recycle safety margin 1000. Strict stop on diagnostic infrastructure failure. Same model (`glm-5.3-flash`) and reasoning settings. One episode per cell; no restarts to replace model failures. Runtime/environment failures remain visible; pause the matrix rather than tune the treatment mid-comparison.

Reserve USD 0.20 per cell, USD 1.20 total. Official Z.AI pricing checked 2026-09-09: input USD 0.15/M, output USD 0.50/M ([pricing](https://docs.z.ai/guides/overview/pricing)). Conservative 32K upper estimate is 24 × (32000 × 0.15 + 2048 × 0.50) / 1e6 = USD 0.139776 per episode. Observed cost is reported separately from reserved budget; timed-out requests have unknown final usage.

## Evidence boundaries and controls

Public probes are operator-authored only from frozen public issue reproductions. The @const example is decoded from the issue's embedded playground payload. Compiler optimization assertions examine public generated code. Private benchmark test bodies and reference patches are confined to separate evaluator containers and are never model-visible. Base/reference preflights establish harness validity before model episodes. Do not inspect private candidate scores until all six model episodes are terminal. Retain no-patch, schema, timeout, public-red and private-red outcomes.

A submitted patch must pass its public probe. Scoring uses the existing strict all-full-name-matches normalization, with each task's own expected labels and zero missing labels; no reuse of the first task's 67/5120 counts. Repeat every all-pass candidate in a fresh evaluator. No patch means model failure, not missing data; invalid infrastructure remains a separate category.

## Analysis and completion

Report all six cells, paired correctness, public result, exact private label counts, context transitions, peak admitted bound, retained-reasoning accounting, invalid tool calls, elapsed model/episode/evaluator time, and observed cost. Audit exact patch attribution, source freezes, matched first prompts within pairs, budgets, cleanup and protocol conformance. Interpret with n=3 pairs: descriptive evidence only, not a statistically established window effect. A clear result may be failure or no observed difference; do not tune until the comparison is closed.

## Construction boundary

D65 frontier: isolated holdout harness and fixed comparison evidence under holdout-v1. Runnable work: preparation, preflights, task/context adapter tests, freeze, six model episodes and separate evaluations. No ontology record/selector dependencies. Existing success-v1 sources remain frozen. Operational owner: local operator for credentials, Docker/image/cache availability and disk capacity. Exact blockers: missing runtime, provenance/accounting/cleanup errors. Deferred residue: engine activation, publication, deployment and broad model qualification; not prerequisites for this evidence run.

## Open Questions

Does the verified behavior transfer to these three tasks? Does 32K improve correctness or merely increase cost? Are failures linked to recycling, schema use, or task reasoning? Can conclusions generalize beyond this repository or one sample per cell? Only the first three questions receive descriptive evidence here; broader generalization remains future work.
