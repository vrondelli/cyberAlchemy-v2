# Define Distill validation

- Mode: Standard role simulation; no additional subagents.
- Target: smallest coherent definition for the selected stable foundation.
- Verdict: pass.

## Proposer

Define the candidate as a project-root, read-only, compiled-JavaScript CLI that
owns only structural result contracts and exact evidence bindings.

## Balancer objections and reconciliation

| Category | Objection | Decision |
| --- | --- | --- |
| scope | The July product includes far more capabilities. | Retain the foundation as subordinate pre-production slice; do not redefine `0.1.0`. |
| authority | P2 and C2 could be restated as CLI-owned policy. | CLI consumes owner-ratified profile/conformance receipts and cannot issue them. |
| coherence | A feature-root shortlist cannot resolve project-level edges. | Replace it with the later accepted explicit project-root contract. |
| complexity | Compatibility, security, resources, and release mechanics could overload the first implementation unit. | Keep them in the definition but layer their implementation; L0 starts with a closed contract validator. |

## Closure and recomposition

The coherent unit is the two-command CLI contract plus its shared input/result
boundary. Splitting `lint` and `receipt` into unrelated products would duplicate
profile, source, exit, security, and compatibility ownership. Adding W3/W4,
factory, UI, hosted, public, or the full July product would exceed the selected
context. The unit recomposes into the July product only as one future validated
foundation.

## Evolution profile

Likely evolution is new schema versions, supported-profile successors, and
additional internal commands. The smallest extension boundary is versioned
decoders plus explicit command/profile registries; no plugin system or hosted
abstraction is justified now.

## Frame expiry

Re-run Define if the owner changes the project-root topology, command set,
distribution, data classification, supported environment, compatibility
promise, or the P2/C2 claim.

