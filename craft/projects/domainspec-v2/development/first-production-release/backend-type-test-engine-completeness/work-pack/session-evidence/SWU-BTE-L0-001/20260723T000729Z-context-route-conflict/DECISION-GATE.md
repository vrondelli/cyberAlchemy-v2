# Decision Gate — L0 Manifest Bootstrap

Status: `PASS`; Option 1 selected.

## Blocker Question

How should L0 break the circular dependency in which the red-fixture manifest
must be frozen and validated before Task Session, while that same L0 Task
Session is responsible for creating `red-fixture-manifest.v1.schema.json` and
its semantic validator?

## Option 1 — Split L0 Into Contract And Execution SWUs (Recommended)

- Benefit: one implementation-owned contract authority; the validation owner
  freezes independent cases only after the machine contract exists.
- Cost/risk: requires an Invoke refresh and an extra bounded handoff.
- Choose when: fail-closed dependency order matters more than minimizing the
  number of SWUs.
- Downstream impact: `L0A` emits shapes/diagnostic registry only and grants no
  validation result; the owner freezes the red manifest; `L0B` implements the
  validators, runs every case, and emits the non-admitting ValidationReceipt.

## Option 2 — Freeze Bytes Before Schema Validation

- Benefit: preserves one implementation SWU and is the shortest route to code.
- Cost/risk: the pre-entry receipt can prove only bytes, identity, provenance,
  and digest; it cannot prove manifest shape or semantics. The current wording
  that both inputs “validate before Task Session” must be weakened.
- Choose when: a failed L0 run on a malformed but independently frozen manifest
  is acceptable.
- Downstream impact: the validation owner freezes opaque JSON bytes first; L0
  creates the schema/validator and either accepts or rejects those unchanged
  bytes. A new freeze is required after rejection.

## Option 3 — Make The Bootstrap Manifest Schema Validation-Owned

- Benefit: the manifest can be fully validated before implementation starts.
- Cost/risk: moves one proof contract outside the implementation contract home
  and introduces a second authority boundary that must not drift from the L0
  runtime reader.
- Choose when: pre-execution oracle independence is more important than keeping
  all proof shapes under `impl/test-derivation-engine/src/bte/contracts/`.
- Downstream impact: a canonical machine schema and freeze validator must exist
  under the validation-owned package before L0; implementation consumes that
  schema by exact digest instead of re-authoring it.

## Explain / More Context

This is not a decision answer. Request it to expand reversibility, failure
modes, exact file movement, and the Invoke refresh each option would require.

## Recommendation

Choose Option 1. It preserves one contract authority and honest validation
ordering without weakening the independent-oracle gate. The extra SWU is a
real dependency boundary, not bookkeeping.

## Decision

Option 1 is selected. L0 will be reconciled into:

1. a contract-publication SWU that emits the machine shapes and closed
   diagnostic registry but grants no validation result;
2. an independent validation-owner manifest freeze against those published
   contracts;
3. a post-freeze execution SWU that implements validators, executes the frozen
   cases, and emits the non-admitting ValidationReceipt.

The selection resolves the architecture question only. It authorizes no
Work-Pack rewrite inside Decision Gate or Task Session; `invoke:refresh` owns
that reconciliation.

## Record

- Selected option: Option 1 — split L0 into contract and execution SWUs.
- Rationale: preserve one implementation-owned contract authority and make the
  independent freeze an executable dependency boundary.
- Source of decision: user reply `1`.
- Timestamp: `2026-07-23T00:19:58Z`.
- Resolved at: `2026-07-23T00:29:35Z`.
- Remaining Decision Gate blockers: 0.
- Deferred decisions: none.
- Assumptions: none.
- Next owner route: `invoke:refresh:proposal-only` for the BTE package.
