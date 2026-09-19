# EVF Production-Stability Implementation Decisions

- Gate status: `PASS`
- Decision effect: `none`
- Consequential work blocked: `EVF-PS-05` and every implementation successor
- Source: `PRODUCTION-STABILITY-PLAN.md`, `production-stability-dag.v1-candidate.json`
- User instruction: implement until the last node completed

The user subsequently selected `1B, 2A, 3C`. These choices authorize the
bounded implementation path only. No product approval, adoption, enforcement,
publication, release, deployment, or external-effect decision is inferred.

## EVF-DEC-001 — Receipt evolution

Status: resolved as `EVF-DEC-001-B` by explicit user selection.

- `EVF-DEC-001-A` — add generic v2 contracts and retain v1 through a
  compatibility adapter. Best preservation of historical receipts; adds an
  adapter and dual-version test burden. Recommended.
- `EVF-DEC-001-B` — replace v1 in place. Smaller apparent surface; risks breaking
  historical fixtures and consumers and blurring old evidence semantics.
- `EVF-DEC-001-C` — defer. Preserves current candidate-local EVF and stops the
  production-stability implementation.

## EVF-DEC-002 — Production kernel boundary

Status: resolved as `EVF-DEC-002-A` by explicit user selection.

- `EVF-DEC-002-A` — Rust kernel with compatibility adapters. Strong static and
  deployment boundary; largest implementation and migration cost.
- `EVF-DEC-002-B` — hardened TypeScript core with a language-neutral CLI. Reuses
  the most current EVF core; local Node absence and existing subprocess limits
  must be repaired before product tests.
- `EVF-DEC-002-C` — language-neutral protocol first with a standard-library
  reference kernel. Fastest way to prove contracts, append-only persistence,
  independent verification, and provider isolation without foreclosing a later
  Rust or TypeScript production kernel. Recommended for the prototype epoch.
- `EVF-DEC-002-D` — defer. Stops implementation before generic schemas and code.

## EVF-DEC-003 — First complete vertical

Status: resolved as `EVF-DEC-003-C` by explicit user selection.

- `EVF-DEC-003-A` — generic key-and-door plus an independently executable
  reference consumer. Narrowest complete source-to-consumer path and strongest
  current fixture base. Recommended.
- `EVF-DEC-003-B` — meta-type theorem first. Proves the theorem-provider boundary
  early but has a narrower runtime-correspondence claim.
- `EVF-DEC-003-C` — multi-provider reachability first. Exercises composition
  early but adds provider/runtime complexity to the first vertical.
- `EVF-DEC-003-D` — defer. Retains local seam evidence and stops the complete
  vertical.

## Current Resolution

- Selected options: `EVF-DEC-001-B`, `EVF-DEC-002-A`, `EVF-DEC-003-C`
- Selection source: user message `1b, 2A, 3C`
- Selection timestamp: `2026-09-03`
- Rationale: owner-selected; no additional rationale supplied
- Remaining blockers: none at `EVF-PS-04`
- Deferred decisions: none
- Assumptions: preserve the exact v1 preimage in a legacy archive before its
  canonical path is replaced; this does not create a compatibility adapter
- Override: not requested
- Next action: proceed from `EVF-PS-05` through the Rust-kernel and
  multi-provider-reachability construction path; no Task Session or Invoke
  mechanism is involved.
