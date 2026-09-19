---
module: language-type-enforcement-parser-experiment
status: planned
updatedAt: 2026-07-17
docType: cross-task-gaps
---

# Cross-Task Gaps And Residue

| ID | State | Blocking now? | Owner | Re-entry trigger |
| --- | --- | --- | --- | --- |
| LTE-G1 profile/schema admission | deferred | no | FPR-02/profile owner | resolved Decision Gate and approved profile contract |
| LTE-G2 durable manifest | deferred | no | parser/observability owners | L0 evidence shows operational reuse need |
| LTE-G3 formal/runtime projection | deferred | no | formalization/definitions owners | approved L3 preservation design |
| LTE-G4 source overlap | execution preflight | only if overlap appears | Task Session coordinator | planned file is dirty or parser surface changed |
| LTE-G5 third consumer/syntax drift | frame-expiry condition | no current evidence | design owner | third consumer or grammar change appears |
| LTE-G6 retired-orchestration guard baseline | current `tools:test` is 99/101 due four unclassified files under `development/first-production-release/backend-type-test-engine-completeness/` | no for SWU-LTE-001; yes for final L0 close | FPR backend-completeness / retired-orchestration guard owner | separate owner classifies or adjudicates the four files and restores the suite |

No deferred gap may be silently implemented as part of an L0 SWU.
