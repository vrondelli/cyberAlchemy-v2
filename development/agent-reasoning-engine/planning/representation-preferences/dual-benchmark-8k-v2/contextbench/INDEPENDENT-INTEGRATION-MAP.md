# Independent investigation integration map

Candidate implementation notes; no runtime or provider admission. Open questions: [INDEPENDENT-INVESTIGATION-CONTRACT.md](INDEPENDENT-INVESTIGATION-CONTRACT.md).

## Reuse and required changes

- Source preparation and snapshots: `discovery-v1/orchestrate-recovery-v2.mjs` creates one base/work pair and receipt-bound source snapshots. The alternative must reuse one prepared source pair across all phases. Calling the whole orchestrator three times would duplicate checkouts and split accounting; do not use that integration.
- Provider transport: `packet-diversity-v1/transport-bounded-v3.mjs` owns one durable attempt ledger, receipts, retries and request reservations. Bind one arm ledger, not one ledger per investigation. New stage supervision must retain the previously reviewed provider-health correction.
- Existing cumulative admission: `implementation/agent-reasoning-engine/benchmarks/contextbench-v1/token-budget.mjs` exports `assessTokenBudget`. Reuse it over the entire arm receipt list and the exact current phase receipt suffix. Do not reset shared consumed tokens at branch boundaries. Unknown model usage blocks further dispatch.
- Existing episode: `discovery-v1/episode-recovery-v2.mjs` uses global `client.receipts` in delivery bindings, continuation integrity and budgets. A client proxy that filters receipts per phase would change receipt indexes and break evidence identity. Keep global receipt indexes; phase accounting should operate separately at admission.
- Existing episode terminal: `runEpisode` currently ends with full-task context selection and builds its terminal packet from local captures. Three calls to this unmodified function would force three premature terminal selections and would not join evidence. An additive phase loop must distinguish investigator findings from final submission and merge receipt-bound captures for the final packet.
- Final join: reuse `buildTerminalEvidenceFromCaptures`, `exportTerminalEvidenceSelection` and native scoring. Model-generated investigator claims must reference actual branch-delivered evidence. Preserve branch identity and global receipt identity when merging; do not fabricate delivery acknowledgements or relabel source observations as model findings.
- Context: each investigation starts a new protocol-valid history, with original objective and one planner question. Reuse native measured request admission and retained-reasoning rules. Do not slice a tool exchange or assume serialized bytes equal provider tokens.

## First runtime tests

Before provider qualification: reject malformed/extra planner fields; reject cross-branch evidence IDs and missing receipts; deny next phase after unknown usage; show cumulative cost persists across phases; enforce the fixed phase/arm call limits; preserve pending tool exchanges; exercise final evidence reconstruction across at least two independent synthetic branches. A synthetic success is contract evidence, not benchmark quality.

## Construction frontier

Native candidate records and work tasks exist. Planner/branch/join runtime, minimal-history baseline and end-to-end integration remain unimplemented. These are runnable construction tasks under the current bounded candidate, not a request for another broad research plan. Freeze and independent review follow working tests. All failed benchmark costs and original objective remain retained.

## Branch identity hazard found during phase implementation

The native `delivery.mjs` binder keys observations by `tool_call_id` across all supplied captures. Independent model conversations can reuse the same tool-call ID. Concatenating captures can therefore trigger `read-visible-version-changed` or conflate identical-looking observations from different branches. Do not alter captured request bytes or pretend renamed IDs were delivered. The join adapter must bind each branch against its actual receipt subset, retain an explicit mapping back to global receipt indexes and original native IDs, and introduce separately typed branch-scoped identities for any cross-branch index. Final source projection and selection export must explicitly support and verify that mapping. Test collisions across two real-format synthetic branch captures before connecting generation.

The additive phase component now preserves the shared receipt array and cumulative budgets. It does not solve this evidence join or implement independent histories. Those remain the next construction frontier, with full native export compatibility required before live admission.
