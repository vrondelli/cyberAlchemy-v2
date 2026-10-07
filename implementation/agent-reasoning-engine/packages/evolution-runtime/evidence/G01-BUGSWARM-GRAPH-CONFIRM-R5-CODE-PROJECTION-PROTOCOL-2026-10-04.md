# G01 reserved confirmation r5 — source-only code projection

Status: fixed before projection. Input is the 24/24 [r4 failed-source archive result](G01-BUGSWARM-GRAPH-CONFIRM-R4-SOURCE-RESULT-2026-10-04.md), SHA-256 `b23312e777f22ce98191463df25af5d9f1fcef65c863384cc00e521209d98326`, and the unchanged r2 final-slot result SHA-256 `a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c`. No labels, passing-commit source, GLM output, or scores are inputs.

For each slot, verify the pinned archive path is under its private r3/r4 source archive root, and match its bytes, SHA-256, failed commit, language, and canonical tar root to the r4 receipt. Extract only regular `.py` or `.java` files of the slot language, each at most 1 MiB, under a private slot root. Reject unsafe or duplicate relative paths; require extracted file count and bytes equal the r4 inspection. Preserve a deterministic sorted path-plus-content-SHA-256 tree hash, initialize a local Git index, and verify that all and only those paths are tracked. The whole projection gate requires 24/24 exact source-only roots and a receipt. There is no VPS full checkout, no ranking, no evaluator label, and no model call in this stage.

## Open Questions

- Will the unchanged ARE and graph-r2 rules rank these projections within the 8K candidate/packet budget?
- Which prospective raw-listwise GLM and matched comparator gate will be frozen before generation?
