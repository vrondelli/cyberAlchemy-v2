# TASK-SFOL-SOURCE-ADMISSION

## Objective

Create a finite experimental proposal for the exact Financial Settlement
clauses and fixtures used by adoption without impersonating the declared
finance-core/backend-core source owner.

## Dependencies

None; this unit may be prepared independently but is sequenced after BC-001 for
one-at-a-time closeout.

## SWU-SFOL-BC-002

- Primary behavior: propose exactly C3 and P4 with explicit source handles,
  normalized semantic/AST digests, fixtures, residue, and non-release
  boundaries.
- Inputs: Financial Settlement operations document, deal service, settlement
  service, GenerateSettlement use case, direct user authorization for the
  experimental test lane.
- Outputs: source-proposal JSON and validation receipt; formal owner approval
  remains absent.
- Algorithm:
  1. Bind each clause to document, backend source, normalized semantic, and
     proposed AST digests.
  2. Define the finite fixture universe without implementation expected values.
  3. Bind the eligible P4 observation contract to the proposal: one actual
     PAYOUT repository write followed by one actual `PayoutCreated` event,
     with record payloads carrying the same amount/date. The adapter is not an
     authority for this contract.
  4. List every non-admitted clause and converse as residue.
  5. Mark authority effect proposal-only/experimental and release admission
     not-granted.
  6. Validate exact IDs, unique fixtures, existing source handles, clause
     digests, and observation-contract digests.
- Edge cases: stale sources, semantic/AST drift, duplicate fixtures, unlisted
  clauses, widened authority, or a production claim fail.
- Failure modes: treating current generated tests as semantic authority or
  hiding unsupported Financial Settlement behavior.
- Split analysis: clause admission and fixture admission are one authority
  decision because neither is meaningful without the other.
- Write scope: Financial Settlement proposal/fixture artifacts and BC-002
  session evidence only.
- Done criteria: C3/P4 are exact and traceable; P4 is explicitly the eligible
  implication and binds the real use-case write/event sources; all converse and
  other clauses are explicit residue; schema and digest audit pass.
- Acceptance evidence: proposal artifact, audit output, execution receipt.
- Validation surface: source-proposal validator and `git diff --check`.
- Execution owner: local-fallback under direct-user experimental test-lane
  authorization.
- Handoff: refresh closes G-SFOL-01-EXP only, leaves formal G-SFOL-01 open, and
  returns SWU-SFOL-BC-003 by execution policy.
