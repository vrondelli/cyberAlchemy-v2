# Author attempt ledger

- `author-attempt-001` is superseded. It selected `PRODUCT-CANDIDATE.json` as
  the tier subject without proving that the underlying EVF profiles bound that
  file. Its successful tier outputs must not be used as closure evidence.
- `author-attempt-002` repairs the defect by selecting the exact
  `INPUT-CANDIDATE.json` subject already bound by both EVF profiles and by
  checking those profile bindings before constructing provider receipts.

The independent reviewer must replay `author-attempt-002`.

## Open Questions

See [the plan](../PLAN.md#open-questions).
