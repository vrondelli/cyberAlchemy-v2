# EVF 0.4 filesystem containment candidate

## Product construction

The testable product is a new portable Linux archive. Version 0.3 remains
immutable. The frozen Rust core is inherited without source or binary changes.

1. Define containment: persistent writes only in an explicitly selected audit
   workspace; kit and selected runtime paths read-only; other host files hidden.
2. Implement a mandatory Bubblewrap launch boundary around the existing CLI,
   including tool-version probes, compilation, audit providers, and verification.
3. Exercise forbidden file access with real subprocesses and run the existing
   positive/negative audits. Missing isolation must block, never fall back.
4. Build one exact archive and test its extracted contents. Record its hash,
   passing and failing checks, platform limits, and unresolved findings.

Current frontier: one extracted archive has passed all 104 tests and a fresh
five-provider audit plus verification. Its SHA-256 is
`748b1afcd27ae52b9c1f105a97314cf05a6582aaed4048b6a4a48a28fe4fca08`.
Archive-bound results are in [VALIDATION.json](VALIDATION.json). No remaining
implementation task is required for this bounded containment candidate. Product
owner review is next; no product approval, hostile-tool evidence authentication,
or general security theorem is claimed. Prototype navigation records are in
CONSTRUCTION.json; they are not
registered or admitted system ontology records. No ontology-runtime dependency
or ambient epoch is used to authorize this construction.

## Operational support

- Local runtime check: assistant; complete for the recorded WSL2 host and exact
  native tools. A recipient's host remains untested and must pass `./evf doctor`.
- Archive assembly and checksum: assistant; complete for the exact candidate,
  with fresh-extraction validation. This did not publish the archive.
- Product review/approval: product owner; exact archive and test evidence are
  available, but approval has not been requested or recorded.
- Commit, push, recipient delivery, and licence decisions: user/rights holder;
  deferred, no authority inferred from this implementation request.

No operational item is being used to block runnable construction. The previous
intermittent TLC failure remains visible follow-up work with an unknown cause;
it limits reliability claims but did not prevent the containment tests or fresh
five-tool example run. Native log retention is available for a recurrence.

## Boundaries

Only this portable-audit-v4 directory and synthetic temporary test directories
are writable by this work. Earlier packages, frozen EVF source, CRABS, public
Arcanum, unrelated worktree changes, and owner decisions are not changed.

The audit workspace is intentionally writable by its providers. This boundary
protects files outside it; it does not make a malicious provider's claims honest
or protect audit inputs/receipts from a provider allowed inside that workspace.
Trusted OS, system runtime, kit, and explicitly selected tool installations are
assumptions. Quiescent selected trees are required during validation and launch.
Kernel exploits, resource exhaustion, and distribution portability are not
proved away. The earlier intermittent TLC issue remains open.
