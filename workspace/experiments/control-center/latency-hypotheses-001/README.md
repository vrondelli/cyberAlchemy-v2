# Workspace latency hypotheses

WLH-001 completes only `latency.hypothesize`: four source-grounded alternatives,
their mechanisms, controlled changes, predictions, falsifiers and missing spans.
They are untested hypotheses, not explanations established by the failed CC006 run.

## Construction plan and current boundary

1. Reuse the owned ontology's Research Hypothesis and Research Experiment meanings
   (ARE-RL-D01/D03), plus Research Work Plan (D08), as prototype scaffolds.
2. Declare alternatives in `hypotheses.json`; validate all seven inspected boundaries.
3. Use the owned runtime to create content-addressed hypothesis records, derive a
   separate prospective dependency view, and verify the task completion evidence.
4. Bind this successor's exact source and output bytes in `candidate.json`; run
   positive and adversarial tests and save the test receipt in `EVIDENCE.json`.

Product construction advances from `latency.hypothesize` to `experiment.register`.
Runnable next work is to select one comparison, define phase instrumentation and
freeze exact baseline/treatment, fixture, effect-size criteria and semantic checks.
The `unbound-design:` references are intentionally not executable candidate IDs.
No Research Experiment, observation, learning decision or retention is fabricated.

Operational support: the Workspace test operator owns `host.qualify`, affecting
the future product-test campaign only. It does not block experiment design.
Native runs depend on exact comparison registration and qualified host receipts.
Tauri integration, product approval, lab reconciliation and publication are deferred
residue, not implicit effects of this prototype.

## Alternatives

| Alternative | Controlled distinction | Needed evidence |
| --- | --- | --- |
| Frame wait | Status IPC versus post-response scheduling | Separate frontend spans |
| Startup phases | Prewarm overlap versus initialization duration | Native and Node phase spans |
| Ready replay | Upstream readiness versus buffered delivery | Correlated ready event and buffer residence |
| Projection/scroll | Delivery versus batching, DOM and scroll work | Frontend process-local spans |

This list is not a causal ranking. Start with phase instrumentation because the
existing measurements cannot distinguish the alternatives. Instrumentation must
be identical in both comparison arms and its overhead assessed before inference.
Keep existing metrics and budget bytes unchanged; add companion spans only.
The protocol still requires 40 qualified cold desktop sessions per arm, at most
60 attempts, host-load rejection and nearest-rank p95 of session maxima. Fresh
processes do not imply flushed OS caches. Never subtract independent monotonic
clock origins or treat a frame callback as proof of presented pixels.

## Verification and view

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-hypotheses-001/hypothesize.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-hypotheses-001/hypothesize.mjs --check-saved
```

`bundle.json` contains the typed hypotheses and comparison requirements.
`progress.json` and `view.html` derive the task state and prospective alternatives.
The historical six-node research DAG remains unchanged; its registration shape
requires observations, which these prospective hypotheses do not have.
The HTML is a standalone read-only artifact, not a tested Tauri integration.

The selected WRL-OWNED-001 candidate and timing-report digests are pinned in the
builder. That candidate verifies its owned runtime, ontology and archived inputs;
timing inspection rechecks its six source files and exact selectors. No ambient
ontology runtime is used as an admission gate. Selected dependency drift fails
closed. The successor manifest covers every local file except itself and the
test receipt; it is not a transitive production build attestation.

Research-evidence-harness is used in validate mode: positive and negative fixture
tests check hypothesis evidence mechanics. Run-row schemas, JSONL ingestion and
metric calculators are deferred to experiment registration because this task
does not collect runs. Tests prove mechanics, not semantic truth or repair benefit.

## Open questions

- Which alternative should the first exact comparison isolate?
- What minimum effect and equivalence tolerances will be preregistered?
- What additive instrumentation supplies cross-process correlation without
  exposing chat content or changing the existing metric contract?
- Is presented-pixel evidence needed beyond the existing frame-callback budget?
