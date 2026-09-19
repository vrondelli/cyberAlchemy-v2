# Saved comparison-run file reconciliation

Status: five offline tests pass; independent review and campaign integration pending.

[comparison-run-files.mjs](comparison-run-files.mjs) loads the exact started/result/completed/journal/transport-ledger files, plus candidate driver-binding metadata. Every expected file hash must be supplied externally. The fixed filename set excludes caller-controlled traversal paths. Canonical roots, symlink rejection, regular-file checks, bounded descriptor reads and a combined 128MiB input cap apply. State traversal is bounded to 4,096 entries and rejects writer.lock at any depth before and after verification.

The saved starting cell and task hash must match caller inputs. Saved result must equal the supplied outcome result, and completed status/digest must bind the saved result bytes. The journal is parsed under a 100,000-event cap. Parsed evidence then passes ledger R2 and measured-window reconstruction, using the cell's tokenizer margin/output cap and externally supplied transport identity. No model/source code executes.

## Evidence

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-run-files.test.mjs

Five filesystem tests cover all three arms; altered result bytes, substituted outcomes and omitted hashes; nested writer locks; symlinks and extra traversal-shaped references; independently mismatched completion digests; and oversized sparse input rejection before body allocation. The initial fixture incorrectly hashed Buffer serialization instead of file bytes; corrected fixture hashing produced passing exact-byte tests.

## Limits and open questions

This adapter verifies caller-pinned per-run evidence, not a whole campaign. The caller must bind these file hashes and external transport identity into the generation seal, verify the public task against its expected source hash, and retain all twelve scheduled outcomes. Failed/unstarted outcomes remain visible through raw accounting; they cannot be omitted merely because success reconciliation rejects.

Writer-lock absence is not proof of process exit. Outer process settlement remains explicitly pending, as does campaign-seal binding. Checks assume a settled local evidence tree, not a hostile concurrent filesystem mutation model. Local hashes are integrity evidence, not provider signatures. File memory is bounded by input bytes plus parsing overhead; no whole-system memory bound is claimed.

Next: independently review this adapter, integrate exact file references into sealed outcomes, reconcile the fixed campaign and connect isolated native scoring. Coordinator owns integration; exact freeze, prospective experiment amendment and D:/WSL admission remain live prerequisites. C: is excluded; release/deployment remain deferred. Broader confirmation and quality/token goals remain open.
