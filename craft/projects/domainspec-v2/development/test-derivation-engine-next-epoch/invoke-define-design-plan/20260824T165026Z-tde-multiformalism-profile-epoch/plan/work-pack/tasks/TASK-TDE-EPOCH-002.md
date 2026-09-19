# TASK TDE-EPOCH-002 — FormalClaim intake and typed disposition

## Outcome

Implement exact current FormalClaim, assessment, and optional preservation-backed projection intake without owning source meaning or capability policy.

## Preconditions and dependencies

Passing immutable TDE-EPOCH-001 receipt plus current @3 admission and projection-policy evidence.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/intake/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/intake/**

## Forbidden

No FormalClaim, ontology, assessment-policy, projection, EVF, or provider source mutation. No FOL/SMT/Lean execution.

## Steps

Validate source_authority_count; join exact identities/currentness; interpret the total classification; validate projection purpose, preservation kind/direction, assumptions/domain/bound, certificate, profile, and ceiling; return executable intake or typed needs_formal residue.

## Acceptance and planned validation

Positive current intake passes. Zero/multiple authority, missing statement, unsupported, indeterminate, outside-profile, oracle dependence, stale identity, missing certificate, and globalized bounded projection fail with exact typed reasons.

## Closeout

Return intake contract/fixture hashes and a total disposition matrix. Next route: TDE-EPOCH-003 and separately TDE-EPOCH-008.
