# ARE vs DSH on large-window source localization — candidate evidence card

Status: **draft for Vlad and Dave**, 2026-09-27. Not approved or published. No ARE-superiority headline is supported.

In a frozen 24-task SWE-Bench-Pro cohort (six tasks each from qutebrowser, openlibrary, navidrome, and element-web), 23 tasks produced paired native scores. One DSH run exited before final-context export and is retained as an unscored operational failure; no task was replaced. Both arms used the fixed large-window GLM protocol. The candidate overlay was uniform across all 24 r2 tasks.

Among the **23 valid pairs only**, ARE minus DSH mean Span-F1 was **−0.0006** (paired stratified 95% bootstrap interval **[−0.0373, 0.0373]**) and mean File-F1 was **−0.0742** (**[−0.1174, −0.0323]**). ARE/DSH known-model-token ratio was **0.4476** (**[0.3577, 0.5837]**); summed arm-time ratio was **0.6881** (**[0.6083, 0.7874]**). Lower ratios indicate fewer known tokens and less summed arm time, but File-F1 was worse and Span-F1 was unresolved. These valid-pair estimates do not represent a completed 24-task effect.

The cohort, native score files, pre-score seals, failed-attempt lineage, and deterministic interval method are bound in the [cohort](../g02-product-replication-r1/COHORT.json), [r2 execution plan](EXECUTION-PLAN.json), [hash audit](HASH-AUDIT.json), [paired analysis](PRODUCT-ANALYSIS.json), and [result note](RESULT-NOTE.md). The precise bootstrap implementation was bound after some G01/G02 scores were visible; this timing is disclosed in the [campaign plan](../PRODUCT-PAGE-REPLICATION-PLAN.md). Raw receipts remain in a verified [private archive](ARCHIVE-MANIFEST.json), not on the public page.

Suggested public wording, if reviewers approve: “On 23 scored pairs from a frozen 24-task large-window source-localization replication, ARE used fewer known GLM tokens and less summed arm time than DSH, while File-F1 was lower and Span-F1 showed no clear difference. One DSH run was unscored.” Do not shorten this to an unqualified efficiency or quality win.

## Open Questions

- Do Vlad and Dave accept this balanced card and its exact denominator, caveats, and disclosure timing?
- Should a future quality-preserving candidate be tested in a separately frozen evolution cycle rather than altering this replication?
