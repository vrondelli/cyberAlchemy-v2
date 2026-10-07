# Interaction learning prototype validation

The approved objective-cycle definition is in
[`CYCLE-DEFINITION.md`](CYCLE-DEFINITION.md). The bounded ingestion and baseline
construction plan is in [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md).
The executed baseline, four-hypothesis evolution, accepted bounded candidate,
and claim limits are in [`RESULTS.md`](RESULTS.md).

There are now two evidence lanes:

- the original 48-episode synthetic lifecycle fixture described below; and
- the real Codex-history lane, which streams the selected 73 Windows plus 2 WSL
  sessions through the evolution runtime without copying raw logs or persisting
  message text, tool payloads, environment values, encrypted reasoning, or
  credentials.

The real lane uses `packages/evolution-runtime/bin/interaction-learning.mjs`.
`scan` emits privacy-safe evaluator tasks; `baseline` accepts independent labels
and freezes the chronological objective-grouped baseline. Later operations
freeze hypotheses, offline screens, independent live verdicts, and versioned
learning packages. `close` binds an owner-approved supported package and records
objective closure without activation. It intentionally does not infer final
episode boundaries or causal labels from keywords alone.

Run `node runner.mjs --mode mock`, `--mode local-benchmark`, or `--mode live-canary`
from this directory with Node v26.8.1. No package installation is needed.

The frozen corpus contains 48 synthetic three-turn episodes in eight families,
24 development / 12 regression / 12 holdout, four variants and two replays.
V0 has no retained interaction lessons; V1 uses a generic retained summary;
V2 projects explicit preferences; V3 projects explicit and inferred scoped lessons.
The historical objective/intent implementation remains available in all variants.
The local ablation exercises the new lifecycle, with scripted output, and is not a
comparison of actual baseline model responses. Judge labels are loaded only after
all treatment outputs are computed. The synthetic split is not an independently
authored or external holdout. No empirical model-quality gain is claimed.

The mock mode additionally exercises a single joined correction-to-application-to-
research-to-comparison cycle, negative/no-gain branches, restart, and revocation.
Mock comparisons use labeled fixture measurements. Passing them never approves a
variant. The live mode checks the current binary against the frozen wrapper
binding before dispatch; incompatible versions produce NOT_RUN with zero model
calls. A compatible run uses the configured model, read-only ephemeral scratch
threads, up to 24 turns, no provider or judge calls, and a 30-minute dispatch limit.
Live PASS means the smoke-test requests completed, not that model quality improved.

Production hosts must attest the feedback source, prior completed episode, target,
retention scope, correction class, and finite literal output checks. The prototype
does not claim to infer those meanings reliably from arbitrary language.

## Open Questions

The real-cycle open questions are owned by
[`CYCLE-DEFINITION.md`](CYCLE-DEFINITION.md#open-questions).
