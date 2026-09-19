# TASK-R3C-CORPUS: Second Corpus Evidence

Layer: L1.
Slice: S-R3C-002.
Wave: [W1](../waves/W1.md).
Status: completed 2026-07-12.

## Objective

Exercise R3A edge-law validation beyond the financial-settlement pack, or record that no owned second corpus is
currently suitable.

## Source Contracts

- `projects/domainspec-v2/impl/spec/features/financial-settlement/`
- `projects/domainspec-v2/research/spec-ontology-unification/`
- `projects/domainspec-v2/development/comprehension-novice-test/`
- `projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md`

## Dependencies

SWU-R3C-001 should pass before validating code-tag composability over a second corpus.

## Implementation Detail

Selection rules:

1. Prefer an owned corpus already in the repo.
2. Prefer a corpus with additional relationship signatures, especially cross-feature or Entity-to-Entity edges.
3. If no corpus is suitable, create a minimal second feature pack only when the source evidence already exists.
4. Do not invent business semantics just to increase edge counts.

## Smallest Working Units

### SWU-R3C-004

- Goal: add/select the second corpus and run validation.
- Dependencies: SWU-R3C-001.
- Write scope: selected/new `impl/spec/features/<second-pack>/` plus tests only if needed.
- Done criteria: second pack validates or a no-suitable-owned-corpus finding is recorded with exact reasons.
- Acceptance evidence: valid pack passes; seeded invalid edge fails.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate:content`; `validate:rels`; `tags:composability` if code tags exist.
- Execution owner: subagent.
- Handoff note: start by inventorying existing repo-owned candidate corpora; do not author a fake pack if evidence is absent.

## Synchronization

If a second corpus lands, update Craft `GAP-DSV2-EXERCISE` status. If not, leave it active with a sharper repair path.

## Completion

- Governed selection dispatch: `2026-07-12-r3c-second-corpus-selection`,
  closed `resolved` after auditor ACCEPT.
- Selected source: Agent Execution Orchestrator fixture.
- Materialized pack: `impl/spec/features/agent-execution-orchestrator/SPEC.md`.
- Evidence: [SWU-R3C-004 receipt](../../task-sessions/2026-07-12-swu-r3c-004/TASK-SESSION-RESULT.md).
- Result: positive node/edge validation PASS; seeded State Machine→Operation
  `enforces` edge rejected; aggregate regression suite PASS.
