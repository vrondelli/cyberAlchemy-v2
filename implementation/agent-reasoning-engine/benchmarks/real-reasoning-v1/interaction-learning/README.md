# Interaction learning prototype validation

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
