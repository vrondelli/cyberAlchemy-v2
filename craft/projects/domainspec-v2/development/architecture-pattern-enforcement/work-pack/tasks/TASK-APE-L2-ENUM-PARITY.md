# TASK-APE-L2-ENUM-PARITY — Prove independent language realizations

Layer: L2. Waves: W2-W3. Status: planned and owner/tool-gated.

## Objective

Implement independent Python and Rust Enum observation lanes against the
TypeScript-frozen contract, compare exact portable obligations, and issue a
bounded deterministic Enum completion receipt.

## Package homes

- Python candidate: `projects/domainspec-v2/impl/architecture-conformance/python/`.
- Rust candidate: `projects/domainspec-v2/impl/architecture-conformance/rust/`.

Each lane owns its manifest, lockfile, adapter, fixtures, and receipts inside
its path. Exact interpreter/compiler/tool versions and commands are selected by
that lane and bound before mutation. Neither lane may edit shared contracts.

## Smallest Working Units

### SWU-APE-ENUM-PY-001 — Python Enum lane

- Primary behavior: emit and validate Python Enum observations for the frozen
  portable obligations.
- Dependencies: TS-004 freeze and explicit fan-out confirmation.
- Write scope: Python candidate package home and Python instance receipts only.
- Done: CPython AST/import plus selected native corroboration covers positive,
  exact negatives, and unsupported constructs with raw evidence.
- Split analysis: package setup, adapter, and fixtures are mutually required for
  one runnable native lane and have no independent acceptance claim.
- Acceptance evidence: pinned environment, source/tool/profile digests,
  normalized receipt, and exact mutant matrix.
- Verification: lane-owned test/type command plus normalized replay.
- Owner: subagent after governed confirmation; local fallback uses same contract.

### SWU-APE-ENUM-RS-001 — Rust Enum lane

- Primary behavior: emit and validate Rust Enum observations for the frozen
  portable obligations.
- Dependencies: TS-004 freeze and explicit fan-out confirmation.
- Write scope: Rust candidate package home and Rust instance receipts only.
- Done: macro-bounded module/source analysis plus rustc evidence covers
  positive, exact negatives, and typed unsupported cases.
- Split analysis: crate setup, adapter, and fixtures form one runnable native
  lane; Cargo package metadata alone is explicitly insufficient.
- Acceptance evidence: pinned toolchain/lockfile, raw compiler evidence,
  normalized receipt, and exact mutant matrix.
- Verification: lane-owned Cargo commands plus normalized replay.
- Owner: subagent after governed confirmation; local fallback uses same contract.

### SWU-APE-ENUM-PARITY-001 — Exact semantic parity

- Primary behavior: compare the three language receipts by exact portable
  obligation IDs and applicability outcomes.
- Dependencies: Python and Rust agents joined/closed with current receipts.
- Write scope: `architecture-pattern-enforcement/instances/enum/parity/**` only.
- Done: same design/profile/frozen-contract digests; no missing/extra/duplicate
  obligation; no required unsupported; native differences retained.
- Split analysis: per-language validation is complete upstream; parity is one
  pure recomposition behavior.
- Acceptance evidence: parity receipt plus disagreement negatives.
- Verification: deterministic parity command twice.
- Owner: Task Session or local read-only verifier.

### SWU-APE-ENUM-CLOSE-001 — Bounded Enum closeout

- Primary behavior: independently reproduce all applicable Enum evidence and
  issue the bounded completion receipt.
- Dependencies: PARITY-001 and explicit runtime-plane N/A decision.
- Write scope: `architecture-pattern-enforcement/instances/enum/closeout/**` only.
- Done: all raw evidence reachable, lane lifecycle terminal, replay deterministic,
  claim ceiling exact, residue owned.
- Split analysis: closure is an allowed audit/closeout boundary and does not
  introduce implementation behavior.
- Acceptance evidence: final verification result and input/output manifest.
- Verification: declared read-only closeout command.
- Owner: independent closeout verifier.

## Fan-out gate

Python and Rust are the only planned parallel units. The dispatch must be
validated, the user must approve the shown exact roles/scopes after TS-004,
agents must be registered when required, and both lanes must reach terminal
join and close states before parity.

## Failure modes

Shared-contract mutation, unpinned tools, language-to-language dependency,
Cargo-metadata substitution, dynamic/unknown pass, missing raw evidence,
unjoined lane, majority vote, or syntax comparison blocks.
