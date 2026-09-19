# TASK TDE-EPOCH-001 — Profile contracts and registry

## Outcome

Implement the narrowest reversible trust slice: immutable profile/renderer/runtime/receipt schemas plus an explicit fail-closed registry with no renderer execution.

## Preconditions and dependencies

W0 admission/Refresh/readiness receipts. No SWU dependencies.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/contracts/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/registry/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/registry/**

Exact create/modify files and dirty-worktree overlap must be frozen by post-admission Refresh before Task Session admission.

## Forbidden

No source-meaning mutation, renderer, provider execution, profile admission, EVF change, or legacy evaluator rewrite.

## Steps

Define descriptor/registry contracts; implement immutable resolution; add exact positive and unknown/latest/duplicate-axis/stale/missing-provider/unadmitted negatives; prove deterministic registry digest and no ambient discovery.

## Acceptance and planned validation

Schema/meta checks, unit fixtures, typecheck, exact package tests, scoped whitespace, changed inventory, and source preservation all pass under commands pinned by Refresh. Earlier failed commands remain failures.

## Closeout

Return one registry trust receipt binding schema, validator, fixture, and output digests. Next route: TDE-EPOCH-002.
