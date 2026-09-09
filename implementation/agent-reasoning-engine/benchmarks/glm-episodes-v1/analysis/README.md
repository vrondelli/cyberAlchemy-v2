# Analyze retained GLM behavior

This offline tool converts exported benchmark results into a per-trial and per-physical-call dataset. It separates first-proposal behavior, schema diagnostics, semantic checks, corrections, delivery, recycling and transport. It makes no provider calls and never executes proposed patches.

```sh
python3 implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/analyze.py \
  --output /tmp/glm-analysis-new
```

`--evidence` defaults to the sibling `evidence/` directory. `--node` selects the local Node executable used for the canonical schema diagnostic helper. Output must be a new directory, preserving previous snapshots. Python uses only the standard library; Node uses existing repository code.

Outputs are `REPORT.md`, a pending `FINDINGS.md` review stub, `summary.json`, `trials.jsonl`, `calls.jsonl` and `inputs.json`. The [retained snapshot](snapshots/2026-09-09-final/REPORT.md), [interpretation](snapshots/2026-09-09-final/FINDINGS.md), and [GCF review](GCF-REVIEW.md) form the current analysis package.

The next research stage is the [competing hypothesis study and prospective DAG](hypothesis-study-v1/README.md), including [ZTH component reuse decisions](hypothesis-study-v1/ZTH-REUSE.md). The completed analysis remains unchanged.

The [completed offline request/scorer audit](offline-audit-v1/README.md) checks the first hypothesis and records the remaining request-body evidence gap.

The [offline exact-request capture probe](capture-probe-v1/README.md) verifies the current renderer and transport on synthetic baseline/recycling cases. Historical wire bodies remain unavailable.

The [controlled H2/H3 study preparation](controlled-study-v1/README.md) defines five arms, held-out variants, paired order and fixed budgets. Live runner integration is the next frontier.

The [isolated study runner](study-runner-v1/README.md) connects treatments to rendering, token measurement and native response parsing, with synthetic integration evidence.

The [calibrated provider study](provider-study-v1/README.md) records six real tokenizer calls, a frozen 120-trial controller, and container/restart checks. The [live research loop](provider-study-v1/research/README.md) now records actual model trials and successor hypotheses.

## Method

- Discover `are.glm-episodes-result/v1` exports and validate each manifest's canonical-JSON hash using the existing sorted-key convention. Record raw input-file hashes separately.
- Normalize each arm once by its original run directory and agent-result identity. Identical model answers from different runs are distinct trials. Copied exports of one arm are excluded and reported.
- Join feedback only to the matching initial directory, trial ID and episode. Retained replays and unmatched historical feedback remain a separate inventory; they cannot replace an initial trial's outcome.
- Keep completed 36-trial qualification campaigns, incomplete qualification campaigns and earlier development experiments separate. Completed campaigns must reconcile all trial identities, initial/final scores and physical model/tokenizer totals with their aggregate.
- Preserve historical validation. Independently reanalyze complete hash-bound final proposal text with the current canonical full-schema diagnostic function. Its schema and implementation hashes are recorded. Unknown/truncated output is not inferred to be valid.
- Count physical receipts, including failed attempts and retries. Unknown token usage stays unknown; known token totals are not billed usage. Latency uses the nearest-rank quantile, across recorded attempts including failures.
- Label independently observed failure types without forcing a single causal diagnosis. Continuity is assessed only when recycling actually occurred. A failed final check remains failed even if its public precheck passed.
- Compare reads by complete tool name and arguments, including page offsets. Different pages are not duplicate reads. Duplicate attempts are descriptive and may be intentional.

`inputs.json` binds every read file and analysis implementation. A live campaign can advance during collection: the report isolates incomplete campaigns and records changes to already-read files. This is a file-by-file snapshot, not a transaction over the active runner. Historical sources and repair oracles are not rerun. No provider reasoning, full proposed code, or credentials are exported by the analyzer.

## Validation

```sh
python3 -m unittest discover \
  -s implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis \
  -p 'test_*.py'
```

Tests cover canonical manifest binding, corrupted evidence, duplicate exports versus independent repeats, pagination, incomplete campaigns, overlapping failure labels, correction timeouts, full-schema diagnostics and replay exclusion. The live-data pass also reconciles completed qualification aggregates.

## Construction boundary

CAV2-D65 frontier: explain the retained GLM behavior with a reproducible analysis package. Runnable work is normalization, diagnosis, tests, and a source-linked decision note. The implementer owns these files; the evaluator owns classification and count integrity; the user owns any later runtime candidate and live operating envelope. Missing or inconsistent evidence blocks a claim, not unrelated offline analysis. Live experiments, runtime redesign, dependency adoption and activation are deferred. No ontology runtime record or selector is required.

## Open Questions

Do the observed failure mechanisms recur on new repository tasks? Does a minimal model-facing contract reduce schema errors without increasing semantic errors? Does GCF help after holding summaries and output contracts constant? These questions are owned by the [decision note](snapshots/2026-09-09-final/FINDINGS.md) and [GCF review](GCF-REVIEW.md#open-questions).
