# G01 r2 — fresh 8K ContextBench replication with jq

Status: **terminal, privately analyzed, independently receipt-audited, and archived, 2026-09-28**. This is a new fixed 24-pair cohort, not a repair or extension of G01 r1. Its C repository is jqlang/jq instead of the exhausted zstd pool: three jq C tasks and seven each from cli Go, Svelte JavaScript, and clap Rust. Both arms used the frozen 8K protocol and GLM-5.3-flash; the comparison is ARE context selection against the native intent-anchor control.

All 24 attempts reached terminal receipts. Twenty-three have paired native scores. The remaining Svelte task, `javascript-svelte-1ad00901-21`, is unscored because the **control** exhausted non-tool corrections (`intent-anchor-episode.non-tool-corrections-exhausted`); the ARE candidate produced a final context. It remains in the 24-pair denominator. There was no task replacement, retry, or retrospective rule change.

| Valid-pair descriptive measure | ARE relative to control | Paired 95% interval |
| --- | ---: | ---: |
| Native Span-F1 difference | +0.26926 | [+0.20134, +0.33901] |
| Native File-F1 difference | +0.27702 | [+0.17619, +0.38344] |
| Known model-token ratio | 0.60788 | [0.53655, 0.69679] |
| Summed arm-time ratio | 0.84325 | [0.77559, 0.92390] |

Intervals use 20,000 deterministic paired bootstrap resamples within repository strata over the **23 valid pairs**, not all 24 attempted pairs. The analyzer records that bootstrap implementation details were bound after some native scores opened; the interval family and directional rule were frozen before dispatch. The campaign validity gate requires 24/24 native-scored pairs and therefore **failed**. These favorable valid-pair estimates do not authorize a directional product-page superiority headline or a complete ContextBench claim. A balanced evidence card, if wanted, requires Vlad and Dave to review its exact wording and denominator; this note authorizes no publication.

The frozen definition is `/opt/are/evolution-runtime/g01-product-replication-input-r4/DEFINITION.json` (SHA-256 `bb5cb1fb1414b694f966d0df3f0cdcae7f64f4e4316801cad0962f9b5c08574e`), and the freeze receipt is `/opt/are/evolution-runtime/g01-product-replication-r2/CAMPAIGN-FREEZE.json` (SHA-256 `b43f572ddd4a4d91e6315ed48f694ddc24a5f8a9e8da9266e2d39976fac181b6`). The private `PRODUCT-ANALYSIS.json` links all 24 attempted rows. The independent `HASH-AUDIT.json` (SHA-256 `d90f1f17df1a5893c633329c926644eb93d035dae02644404496dc5d08b00824`) passed receipt, prediction-seal, and native-score integrity checks across 23 scored and one invalid pair; its claim ceiling is integrity only, not superiority.

The content-addressed private archive is `/opt/are/evolution-runtime/archives/g01-product-replication-r2-9c032894c54ca5ce3e1b399bb58cbe605a772d219c42e75be388074cf0f90862.tar.zst` (6,056,098,698 bytes). The archiver verified full tar readability; source files were retained and none were deleted.

## Open Questions

- Should Vlad and Dave review a balanced 23/24-valid evidence card that explicitly disclaims a complete-cohort superiority headline?
- Should a separately named future G01 study target control-arm correction exhaustion? It must not be represented as an r2 repair or merged into r2 scores.
- What retention and private restore budget applies to the large raw r2 root after verified archival?
