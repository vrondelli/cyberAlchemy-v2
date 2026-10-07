# G02 r11 active-verification source screen — exposed r1

Status, 2026-10-05: **source opportunity only; no quality result or superiority claim**. The fresh G02 cohort and evaluator gold remain closed.

After the baseline-aware chooser abstained on 11/12 exposed cases, the [bounded screen](../research/g02-product-r4/screen-g02-r11-active-verification-r1.py) checked whether an issue-shaped anchor appears in a pinned candidate's full buggy-base source but not in the card excerpt shown to that chooser. It used the sealed 12×24 candidate packets at SHA-256 `050acc7b183a8f6db8cdc4f7bab8561b1c381e9a3ce59c01d1928930947357a7`, fixed per-issue anchor patterns, and only the pinned base source. It read no reference patch, native score, DSH output, evaluator gold, provider response, or fresh case.

The write-once private `SCREEN.json` at `/home/vlad_/are-benchmark-archive/g02-r11-active-verification-source-screen-r1-20261005/` has SHA-256 `0edf95c4a9a72e28dc2ff7f4609cdaa771b8c9158b2f9bab74096f097087588e`. **9/12** cases across all four repositories have at least one candidate with an issue-anchor line absent from its original excerpt; the source-opportunity gate of four cases across two repositories passed. For example, the `--skip-checks` issue has a `skip_checks` occurrence in `tests/admin_scripts/tests.py` that the card did not show. This demonstrates an avoidable observation gap, not that the file belongs in the patch.

The screen is deliberately permissive. Some anchors are generic (`requires_system_checks`, `Min`, `Max`, `SELinux`) and can produce false leads. Case 9's issue title is empty in this packet, and cases 4 and 8 had no hidden match. No candidate was selected, no source read was added to a benchmark run, and no cost or File-/Span-F1 improvement has been measured. Any later model experiment must constrain the verification question and observation budget, bind an exact selection/abstention policy before calls, and pass an exposed quality/cost gate before any fresh matched cohort. Do not convert this 9/12 opportunity count into a success rate.

## Evaluator-only coverage audit

After the source screen was sealed, the separate [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-active-verification-r1.py) opened labels for these **already-exposed** 12 tasks. Its write-once private `COVERAGE-AUDIT.json` is SHA-256 `94955c477c75f6d2e3c42d4f1095486f5e46979998460b968d320fb48cb02f8e`. Only **3 of 78** hidden-anchor candidate placements are gold files outside the ARE final selected set, across two repositories: task 1's filter documentation, task 5's executor module, and task 7's dense arithmetic module. A read-only comparison with the previously sealed delivered-path lists found none of these three had already been read. The all-candidate reach ceiling meets the three-hit/two-repository threshold **exactly**, with no margin for a selector miss. The denominator of 23 gold occurrences outside final selected files is not the same as the earlier 22 undelivered-gold occurrences; do not compare those rates directly.

This is a ceiling, not a successful selection policy. Achieving the minimum hit count would require choosing all three relevant paths from 78 placements, while a one-addition-per-task precision gate would tolerate few false additions. The anchor rule is thus too weak to justify 12 more GLM calls as the next high-value G02 step. No GLM request, native read, native score, fresh case, or superiority claim follows from this audit. A successor should change acquisition/discrimination substantially, not just add these snippets to the failed one-shot prompt.

## Open Questions

- Can a different source-grounded mechanism improve the three-hit/78-placement ceiling and concentrate true candidates before an 8K GLM call?
- Can a separately frozen second-observation policy improve File-/Span-F1 without increasing total tokens/time?
- What matched DSH denominator and frozen threshold would justify opening fresh G02 cases?
