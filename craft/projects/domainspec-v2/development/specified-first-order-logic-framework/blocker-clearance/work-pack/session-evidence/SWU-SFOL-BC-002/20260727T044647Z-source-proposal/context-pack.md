# BC-002 Task Context

This session proposes exactly two experimental clauses:

- C3: the player share is `0.5` at or above NL100 and `0.4` below it;
- P4: when payout is positive and no same-date PAYOUT exists, the real use
  case performs one PAYOUT write followed by one PayoutCreated call carrying
  the same amount and date.

The proposal is not finance-core/backend-core approval. Zero-payout and
duplicate-payout behavior are P4 converses and remain residue; R5 owns
duplicate suppression.

Strict coverage: pass.
