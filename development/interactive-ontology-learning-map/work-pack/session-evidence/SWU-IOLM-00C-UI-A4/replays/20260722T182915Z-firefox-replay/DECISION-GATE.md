# Decision Gate — DomainSpec fixture drift before A4 replay

## Status

- Target: `SWU-IOLM-00C-UI-A4` replay dependency chain
- Result: `BLOCK`
- Decision: unresolved
- Consequential work blocked: server bind, Firefox launch, and `PW-BB-01`–`PW-BB-10`
- Source: live `BIND_GRAPH_HASH_MISMATCH` plus coordinated changes to all three pinned fixture outputs

## Decision question

Should IOLM adopt the current regenerated DomainSpec Key & Door fixture, or
should the DomainSpec owner restore the earlier pinned fixture bytes?

## Option 1 — Rebind to current DomainSpec fixture (recommended)

- Benefit: preserves the live DomainSpec-v2 outputs and current supported profile/relationship digests; no user work is discarded.
- Cost/risk: reopens the A1 boundary and requires a sequential A1 rebind, A2 snapshot regeneration, A3 validation, and only then a new A4 replay.
- Choose when: the current `minted-project-tools/v1` output and new digests are intentional.
- Downstream impact: a bounded Invoke Refresh must plan the A1→A3 revalidation chain; the existing UI meaning and 4/3 topology can remain, but every receipt/hash must be fresh.

## Option 2 — Restore the prior pinned fixture through the DomainSpec owner

- Benefit: returns the existing A1/A2/A3 chain to its exact pinned source bytes and makes A4 replay immediately eligible.
- Cost/risk: discards coordinated uncommitted DomainSpec output changes and may contradict current profile/project inputs and generator version.
- Choose when: the regeneration was accidental or explicitly rejected by the DomainSpec owner.
- Downstream impact: restoration must be performed outside A4, then the pre-bind check must prove all three original hashes before replay.

## Explain / more context

This does not select an option. Ask for this when you want the exact digest and
receipt propagation through A1, A2, and A3 before deciding.

## Evidence

- Graph: expected `66a63b…`, actual `a9993e…`.
- Source manifest: expected `3d5db5…`, actual `543a876…`.
- Build receipt: expected `1a5be1…`, actual `134692…`.
- The build receipt changed generator version from `fixture-generator/v1` to `minted-project-tools/v1`.
- New profile and relationship digests are also present in current DomainSpec supported-profile and project inputs.

## Record

- Selected option: `pending`
- Rationale: pending operator decision
- Remaining blocker: `B-IOLM-A1-PINNED-FIXTURE-DRIFT`
- Timestamp: `2026-07-22`
