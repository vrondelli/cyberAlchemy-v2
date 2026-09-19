# Durable outcome store and reference seal

Status: implemented; seven offline test groups pass across the six-group suite and added omitted-outcome regression. Independent review pending. Tests use the actual guarded filesystem writer and fixed public schedule, with synthetic executors. No provider/evaluator calls or source clones.

[comparison-outcome-store.mjs](comparison-outcome-store.mjs) requires a fresh canonical root and the existing guarded synchronous writer. It persists the exact schedule, exclusive per-slot start records, full raw outcomes, and final queue metadata. All twelve identities remain bound to the schedule. When the settled queue contains unstarted slots, sealing writes their explicit attempted=false/null-result records. An attempted slot missing its already-persisted outcome cannot be synthesized during sealing.

The store reuses the existing reference-seal implementation. GENERATION-SEAL.json binds twelve distinct outcome files, their paths/digests, schedule, terminal metadata and start-record digests. The full raw outcomes remain in separate files, so the final artifact does not duplicate them. Reading a seal requires an independently retained expected hash of the seal file and reconstructs its summary from the current source files. Source changes, symlink aliases, wrong file hashes or mismatched metadata reject.

The filename follows the existing output guard's final-artifact allowlist. Only the seal uses final-reserve admission, after ordinary writers have settled. Plan/start/outcome/terminal records are ordinary writes; they must fit the guard's ordinary budget before sealing. The implementation was corrected after the first integration test exposed that arbitrary final-artifact names and final writes inside outcome subdirectories are not admitted by the existing guard. No frozen guard changes were made.

A sealed generation evidence set can still represent an incomplete campaign with failed or unstarted slots. The summary explicitly leaves durable provider reconciliation pending, accepted savings null and benchmark_cleared false. Hash binding detects drift; it does not authenticate provider reports, make files physically immutable or establish quality.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-outcome-store.test.mjs
```

Tests cover full twelve-outcome hydration; all-unstarted evidence; retained partial costs in failed campaigns; sealing rejection after outcome-write failure; changed outcomes/metadata, wrong external hash and symlink rejection; accounting overflow preserving all raw files while producing no seal; and a caller-omitted attempted outcome being rejected rather than reconstructed as if persisted.

## Product frontier and open questions

Coordinator owns production campaign composition with source admission, then reconciliation against actual transport ledgers, index-tokenizer events and request captures before scoring. A filesystem failure may leave partial files; the store marks the operation failed and does not grant a seal or implicit retry. In-memory exception evidence and durable transport receipts remain necessary for a separately bounded post-failure audit. A process crash before the final seal is incomplete evidence, not a resumable successful run.

The final campaign still needs exact reviewed freeze, real tokenizer qualification, native research continuity, outer process settlement and D:/WSL admission. C: is excluded. Perfect native quality, at least 15% savings against both comparators and untouched confirmation remain unproved. Release/deployment remain deferred residue.
