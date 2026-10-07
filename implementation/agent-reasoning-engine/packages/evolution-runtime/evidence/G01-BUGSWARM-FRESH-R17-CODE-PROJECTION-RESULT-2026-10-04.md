# G01 fresh r17 — code-only projection result

Status, 2026-10-04: **24/24 exact failed-commit code-only roots materialized in private WSL storage.** The [prospective r17 protocol](G01-BUGSWARM-FRESH-R17-CODE-PROJECTION-PROTOCOL-2026-10-04.md) was byte-pinned before execution. The [materializer](../research/arb-trace2code-r1/materialize-bugswarm-fresh-r17-code.py) rechecked the r14 source/log result (`2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1`), r16 source result (`aca7cb5b46e166612c851dc536a962fa648a2a1ad2f3f59419cf2650a09db654`), and each archive's size and SHA-256. It matched all 24 identities and r16's per-case projected file/byte counts, extracted only bounded regular `.py` or `.java` members, and checked each isolated Git index against the projected path set.

The private `fresh-r11/code-only-r17/RESULT.json` SHA-256 is `6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992`; its `FREEZE.json` SHA-256 is `f7e3fbe7e350ab202292d28b35985c6604a5490f871e0b0be1374cd3f8acbabb`. It records **14,838** tracked code files and **94,510,201** projected bytes across **12 Python and 12 Java** repositories. The output directory is private mode `0700` and receipts mode `0600`. No evaluator labels, passing source, GLM calls, or VPS transfer entered r17.

This is source projection only, not a ranking, label-survival, benchmark score, or superiority result. Next, seal source-only failure queries, baseline/graph rankings, candidate lists and GLM packets without reading evaluator gold; then independently check authenticated direct-Git-tree gold-path survival and run the frozen matched 8K campaign if all 24 pass. External-research techniques remain separate future hypotheses and must not be silently inserted into this frozen transfer.

## Open Questions

- Will all evaluator-only gold paths survive these 24 code-only projections?
- Does the unchanged r10 mechanism meet the fresh cohort's predeclared gate with complete cost and validity receipts?
