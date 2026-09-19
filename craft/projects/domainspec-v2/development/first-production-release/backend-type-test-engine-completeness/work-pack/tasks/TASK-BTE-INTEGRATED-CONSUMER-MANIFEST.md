> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for the L7A/L7B/L8 replacement route.

# TASK-BTE-INTEGRATED-CONSUMER-MANIFEST — BTE, IOLM, Body War, Craft

## Objective

Bind the backend engine receipt and both downstream read-only consumer receipts
into one exact, digest-bound, fail-closed evidence manifest.

## Entry sequence and ownership

1. SWU-BTE-008 emits a green `verify:bte:core` receipt.
2. The independently governed IOLM owner runs `SWU-IOLM-DSC-B` against the exact green BTE core handle and returns a fresh breadth receipt matching the versioned YAML contract and JSON Schema.
3. The independently governed Body War owner runs its admitted consumer gate and returns a fresh receipt handle.
4. SWU-BTE-010 consumes the three handles and compares the manifest through `verify:bte:consumers`.

This task consumes receipt handles only. It never runs either consumer and never authors, repairs, or substitutes IOLM or Body War evidence.

The IOLM handoff is controlled by
`cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml`
and `receipt.schema.json`. Only a fresh `SWU-IOLM-DSC-B` receipt with
`stage=bte-core`, 13 backend node kinds, and 16 backend signatures is eligible.
The earlier `SWU-IOLM-DSC-A` EVF receipt proves a different, narrow claim and
must be rejected from this slot.

## Required handoffs

1. BTE core run/freshness identity, source/profile/schema/registry/graph/generated-root raw digests plus
   exact profile, obligation, test, result, mutation, and receipt identities.
2. IOLM `SWU-IOLM-DSC-B` run/freshness identity, contract/version/digest,
   `stage=bte-core`, imported graph identity, 13/13 kind and 16/16 signature
   counts, profile/obligation/test/result IDs, raw semantic/projection hashes,
   parity result, deterministic rebuild, negative results, posture, explicit
   non-admission, and `G-DSV2-SG` state.
3. Body War run/freshness identity, fixture/adapter identity, profile/obligation/test/result IDs, raw digests, private read-only posture, exact redacted
   field allowlist result, negative results, and explicit non-admission.
4. Craft continuation pointer and accountable role IDs.

## Fail-closed rules

Reject missing, extra, duplicate, stale, skipped, unrunnable, wrong-root,
wrong-scope, unknown-ID, redaction, semantic-mutating-overlay, or surviving-
mutant evidence. Any source, rule, profile, consumer posture, manifest, or
receipt-input change revokes the affected package until `O_spec` is regenerated,
the run is repeated, negatives are replayed, and a reviewed receipt is issued.
Receipt schemas, example receipts, and fixtures test validator behavior only and must never substitute for either fresh consumer run.
An EVF-stage `SWU-IOLM-DSC-A` receipt is wrong-stage evidence for this task even
when its contract and schema are otherwise valid.

## Commands

- SWU-BTE-010: `npm --prefix projects/domainspec-v2/impl run verify:bte:consumers`
- Terminal composition: `npm --prefix projects/domainspec-v2/impl run verify:bte`, defined as `verify:bte:core + verify:bte:consumers`

## Claim boundary

The manifest may support only the conservative FPR-02B exact-profile claim:
13/13 backend node kinds, 16/16 backend signatures, YAML formation, resolution,
deterministic compilation, bounded traversal, causal composition/removal,
provenance, fail-closed negatives, and integrated consumer-proof comparison.
It must exclude semantic satisfiability, business correctness, UI/full-language
completeness, production readiness, public release, hosted callbacks, and any
claim that a consumer proves upstream authority by itself.

## Done criteria

- Machine-readable manifest validates and lists all required inputs/outputs.
- `O_spec = O_gen = T_gen = E_run` is exact.
- Fresh BTE, `SWU-IOLM-DSC-B`, Body War, and Craft handles compare deterministically with exact run/profile/obligation/test/result identities, raw digests, posture, and non-admission.
- Fixture-only, schema-only, stale, or BTE-authored consumer evidence fails.
- A narrow `SWU-IOLM-DSC-A` receipt fails the IOLM breadth slot.
- Production remains false and no UI/backend join is inferred.
