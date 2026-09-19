# Receipt-budget R1 core review — rejected

Eleven existing tests pass, but two independent counterexamples fail the intended receipt-integrity contract:

- Detected prefix corruption is not sticky: restoring the original bytes allows another operation.
- A receipt appended between operations is not pinned before the next operation, which can rewrite it undetected.

Latch validation failures and compare an immutable complete pre-operation receipt snapshot through settlement. Initial externally pending operations also require an explicit settled-tree assumption or pending accounting; receipt counts alone do not prove settlement.

Native records and the narrow episode budget changes were inspected. No provider/evaluator calls or implementation edits occurred.

## Open Questions

See FRONTIER-RESOURCE-HYPOTHESES-R2.md. Correct receipt integrity before integration; perfectquality,15%total-token-savings and untouchedconfirmation remain unresolved.
