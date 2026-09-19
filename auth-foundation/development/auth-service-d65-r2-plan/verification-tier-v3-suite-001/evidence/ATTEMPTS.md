# Author attempt ledger

- `author-attempt-001` failed closed before receipt construction because the
  runner inspected only Lean stderr while Lean 4.33.1 emitted rejected proof
  goals on stdout.
- `author-attempt-002` inspects the combined Lean output and binds the nonempty
  mutation stdout as the route-mutation evidence. It is superseded because a
  denominator audit found profile metadata declaring nine rather than eight
  Lean theorems and four rather than five Souffle fixture roles.
- `author-attempt-003` corrects both declared denominators and adds a regression
  that derives them from the theorem and model sources. It is superseded
  because receipts bind outputs and profiles but do not directly bind each
  canonical model/source input and mutation input.
- `author-attempt-004` adds exact `input_refs` and exact mutation `input_ref`
  bindings to the closed provider receipt. It is superseded because Alloy was
  invoked through an undeclared wrapper and the Souffle wrapper digest was
  labeled as the engine digest.
- `author-attempt-005` invokes Alloy through the bound Java executable and
  Alloy jar, and declares separate bound identities for the Souffle wrapper
  and engine.

Only a completed attempt with a verified manifest can support closure.

## Open Questions

See [the plan](../PLAN.md#open-questions).
