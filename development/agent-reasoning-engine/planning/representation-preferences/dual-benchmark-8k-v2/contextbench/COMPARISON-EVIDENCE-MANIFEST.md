# Twelve-outcome evidence manifest and reconciliation

Status: four offline integration tests pass. Independent review and production campaign wiring pending.

[comparison-evidence-manifest.mjs](comparison-evidence-manifest.mjs) creates a companion manifest containing the exact schedule digest, outcome-seal byte hash and twelve ordered file/transport-identity entries. Callers retain an external SHA256 of the manifest's canonical stable JSON. The manifest's exact shape reconstructs against the fixed schedule; no free-form run paths are accepted. Per-run paths are fixed to 00 through 11 under the canonical supplied runs root.

Reconciliation first verifies the existing outcome seal against its bound hash and reconstructs the twelve rows. For attempted outcomes with evidence, it rechecks public task bytes/identity/revision against the fixed task hash, loads the exact pinned run files through file-adapter R2, then checks ledger and request windows. A per-run reconciliation error remains a visible row with its original raw accounting. Missing attempted evidence and unstarted outcomes remain explicit; an unstarted outcome cannot carry purported run evidence. Global manifest/seal inconsistency rejects the comparison.

The companion manifest is an additional integrity binding, not a rewrite of the existing generation seal. The production supervisor must persist it and retain its canonical digest externally. The caller must derive transport identities from the frozen configured clients; a self-authored manifest is not independent proof of configuration authority. Manifest construction never reads credentials or calls providers.

## Verification

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-evidence-manifest.test.mjs

Four tests use the actual four-task schedule, cooperative queue, guarded outcome persistence and reference sealing with synthetic receipts and temporary per-run files. Full evidence reconciles twelve slots/1,440 synthetic tokens. Pre-aborted and interrupted campaigns retain twelve rows. Mutating one run produces eleven reconciled rows and one explicit failure. Tests also reject wrong pins, reordered slots, malformed file sets and substituted outcome seals, including recomputed outer manifest digests that cannot bypass inner bindings.

All-run reconciliation is not quality or process success. The report keeps accepted_savings null, benchmark_cleared false, outer_process_settlement_pending true and native_scoring_pending true.

## Open questions and construction frontier

Production wiring must collect file hashes and configured transport identity without losing failed-stage evidence, persist/pin the companion manifest, prove outer process settlement and run isolated native scoring. This component does not create a live supervisor or infer successful task completion from a ledger. File adapters assume a settled local tree; all twelve scheduled outcomes and failed costs remain required. Coordinator owns integration and independent review. Prospective experiment amendment, real request qualification and exact source freeze remain live prerequisites, with D:/WSL admission and C: exclusion. Broader confirmation and original quality/token goals remain open; publication/release remain deferred.
