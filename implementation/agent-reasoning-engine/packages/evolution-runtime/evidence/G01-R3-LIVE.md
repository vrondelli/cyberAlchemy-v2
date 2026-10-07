# G01 r3 — prospective 8K ContextBench confirmation

Status: historical live handoff; the runner and finalizer are now terminal. See the [terminal result note](G01-R3-RESULT-NOTE.md) for 21/24 scored pairs, three unscored Svelte controls, valid-pair estimates, independent audit, and the failed completeness gate. This was a new 24-pair cohort, not a repair, top-up, or rescore of G01 r2.

The cohort uses three previously unexposed jq C tasks and seven each from cli Go, Svelte JavaScript, and clap Rust. The source-only selector excluded prior G01 exposures and used the fixed per-repository hash order. Source indexing passed 24/24 with zero model calls; evaluator-only native-gold existence passed 24/24 without exporting paths or values; a two-request no-generation tokenizer transport probe passed. The changed protocol enables a symmetric `non_tool_terminal_after_convergence` policy in both control and ARE arms: after receipt-backed convergence and a model prose stop with no tool call, the harness may proceed to its existing receipt-backed terminal selection. Before convergence, ordinary evidence requirements remain. This policy addresses the G01 r2 control-arm non-tool correction failure; it does not change r2.

All 24 pair plans, both arm freezes, and both arm configs were checked for the policy. The campaign uses the frozen 8K GLM-5.3-flash comparison and two workers. The run process was launched as VPS PID `302715`; it must be polled as a live handle, not restarted on an observation timeout. The exact private paths and SHA-256 bindings are:

| Artifact | VPS path | SHA-256 |
| --- | --- | --- |
| Source-index preflight | `/opt/are/evolution-runtime/g01-product-replication-preflight-r3/SOURCE-INDEX-PREFLIGHT.json` | `d2fd7e9a8c169163d4e21cdee0a49d9cf807fff77e3af1a337ccfd906c3d62e9` |
| Gold-eligibility preflight | `/opt/are/evolution-runtime/g01-product-replication-preflight-r3/GOLD-ELIGIBILITY-PREFLIGHT.json` | `d29b5cd66682874c6feaf3d78b2aed93b9ae3bcc0b68a8b5855361435569a404` |
| Transport preflight | `/opt/are/evolution-runtime/g01-product-replication-preflight-r3/TRANSPORT-PREFLIGHT.json` | `ee2a5a55125df88f13b39131c6f40a53e962440eb1e935b588c0b377ef4b250e` |
| Definition | `/opt/are/evolution-runtime/g01-product-replication-input-r5/DEFINITION.json` | `b5a29ece7386c037a9b2e5e36410179f93d80c52e42b20a6e75caa743a74e2bd` |
| Campaign freeze | `/opt/are/evolution-runtime/g01-product-replication-r3/CAMPAIGN-FREEZE.json` | `7ddf069e96cb6cf1610da5f21efaf747de152cb1aa597286e5f3b4666555b4bb` |

The private run log is `/opt/are/evolution-runtime/g01-product-replication-r3/RUN-LOG.jsonl`. The source-only and gold-bit preflights reused r2 validators, but the new source-index receipt is explicitly r3 and the r3 definition binds all three exact receipts. A separate, newly copied r3 source root preserves r2's frozen code. The Node executable extracted from the already-present `node:26.8.1-bookworm-slim` image is `/opt/are/evolution-runtime/g01-toolchain-r3/node`, SHA-256 `19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3`.

A waiting analysis/audit finalizer is live as VPS PID `497162`, bound to the exact runner PID and campaign freeze. It will use the existing generic paired analyzer (SHA-256 `459b848d91c5ac3fcb3837bc9da043ed2cefc16e90e6207a641e8f0cd14e6ef3`) and a separate r3 receipt/policy auditor (SHA-256 `231848719ea4abf2683e3de373569d1cc6b8fa14c50ad942cad68b34e8d69b1f`). The finalizer script SHA-256 is `eb9f9ad5f1dd99d86a45ee00f4a11c7afda60445497d53888f9c4c6d3afd2194`; its log is `FINALIZE-LOG.jsonl` under the private campaign root. It does not archive or publish. The independent auditor was added after dispatch and cannot change the frozen arms, cohort, scorer, or analysis rule.

The frozen r3 gate requires 24/24 native-scored pairs with valid accounting. The analysis must report paired repository-stratified 95% intervals for Span-F1, File-F1, known model-token ratio, and summed arm-time ratio. A failed or incomplete gate stays failed; no task replacement, r2/r3 pooling, or retrospective policy change is allowed. Independent receipt audit and Vlad/Dave review of any exact sanitized card remain separate from this private run.

## Open Questions

Terminal analysis, failure mechanisms, and remaining untouched supply are owned by the [result note](G01-R3-RESULT-NOTE.md). The failed gate cannot be repaired by replacing or merging tasks.
