# G02 cross-repository holdout r1 — pre-dispatch plan

## Objective and candidate

Test whether the stable, untrimmed G02 cross-layer source selector improves native localization quality and efficiency beyond the adaptive development tasks. Use the same ARE/DSH matched driver, pinned source-only task projection, GLM model, native scorer, and own-property ranker crash guard. Do not include the rejected 100-line packet, broad/selective history projection, or exposed named-type closure. The base candidate ranker SHA-256 is `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`; the own-property guard is independently frozen in each task root.

These three task IDs were selected from source-only problem statements before any holdout prediction or gold read, in this order:

1. NodeBB maintenance-mode access: `SWE-Bench-Pro__javascript__maintenance__bugfix__0155d9d9`
2. Flipt metadata/version-check configuration: `SWE-Bench-Pro__go__maintenance__bugfix__997c7afd`
3. NodeBB socket-to-Write-API migration: `SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c`

No task may be replaced because of its result. The driver preflights source binding; a pre-model ineligible task is reported as ineligible, not silently substituted. A transport or invalid-arm failure remains in the audit and makes the three-task aggregate inconclusive unless both arms on all three tasks are valid and sealed before native scoring.

## Decision

Primary descriptive holdout gate: ARE must exceed DSH on the unweighted mean native Span-F1 and mean native File-F1, and use fewer summed known model tokens and summed arm seconds across all three valid tasks. Per-task strict four-gate decisions and absolute score levels are reported separately; no p-value or full-ContextBench claim is implied by three tasks. Exposed development tasks and ARE-only diagnostics are excluded.

## Open Questions

- Will all three pairs settle with complete cost receipts?
- Does the candidate's mean quality and total efficiency advantage persist across NodeBB and Flipt?
