# Factory Material-Lock Decision

- Decision: `FMP2-FACTORY-MATERIAL-LOCK-001`
- Candidate: `WP-FMP-002-candidate@2`
- Primary owner: Rondelli
- Primary response: **accept** (`A`)
- Second approver: Victor Boscaro — pending
- Gate result: `BLOCK` until the distinct second approval exists
- Authority effect: primary-owner direction only

## Accepted contract

Rondelli accepts the exact factory material-lock contract requested by `OWNER-PREREQUISITE-REQUEST.json` and bound to candidate manifest SHA `18d7a6a2739ddfbb7102d4bce90966160d271b574587ff2cb570e80b9d94463d` with content digest `dfaf820a6771f93c0d7416087b346c6b17b975f090cdd5e01374057f1270e77a`.

The contract keeps executable tools and non-executable artifacts distinct, binds sorted artifact identities and the effective timeout, requires direct/replay identity parity, and preserves the existing 70-second/no-required-artifact behavior for historical providers.

## Rationale

The contract leaves generic execution identity and replay with the architecture-conformance factory while FMP owns only TLA/TLC-specific semantics and corpora. This matches the previously selected factory-below-EVF architecture and does not create a parallel lifecycle.

## Remaining boundary

Victor Boscaro must independently approve the same exact candidate and requested contract. Until that response is joined, `FACTORY-MATERIAL-LOCK-OWNER-RECEIPT.json` must remain absent, the material-lock gate remains blocked, the separate Plan-acceptance gate remains unresolved, and no SWU may be selected or executed.
