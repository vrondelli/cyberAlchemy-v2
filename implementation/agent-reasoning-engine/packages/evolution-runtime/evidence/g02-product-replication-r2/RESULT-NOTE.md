# G02 large-window ARE vs DSH replication — uniform r2 cohort

Status: completed, 2026-09-27; **no product-page superiority claim**. Vlad and Dave have not yet reviewed a public evidence card.

The [r2 execution plan](EXECUTION-PLAN.json) preserved the [source-only 24-task cohort](../g02-product-replication-r1/COHORT.json): six SWE-Bench-Pro tasks each from qutebrowser, openlibrary, navidrome, and element-web. The retained ranker and arm model stayed fixed. The r2 code version added generic regular-file and bounded-primer guards after an r1 pre-model Go index failure; all 24 r2 freezes contain the same candidate overlay SHA-256 `1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89`. The failed r1 attempts and first same-task Git-trust repair remain separate operational evidence, not part of the r2 score.

Of 24 r2 tasks, **23** have both native scores and pre-score seals; one navidrome DSH container exited 1 without a final context, after ARE completed. The [dispatcher receipt](DRIVER-RESULT.json) records that unscored task and all terminal outcomes. A [post-run hash audit](HASH-AUDIT.json) matched each of the 23 native score files and pre-score seals to its pair decision. Twenty-two scored pairs failed the strict four-gate per-task rule; one passed.

For the 23 valid pairs only, the [receipt-bound paired analysis](PRODUCT-ANALYSIS.json) found ARE minus DSH mean native Span-F1 difference **−0.0006** (stratified paired 95% bootstrap interval [−0.0373, 0.0373]) and File-F1 difference **−0.0742** ([−0.1174, −0.0323]). ARE/DSH known-token ratio was **0.4476** ([0.3577, 0.5837]); summed-arm-time ratio was **0.6881** ([0.6083, 0.7874]). The paired quality evidence does **not** support superiority: File-F1 is worse, Span-F1 is unresolved, and the cohort is incomplete. The efficiency estimates can only be described alongside those quality and validity limits.

The bootstrap family and directional rule were fixed before dispatch; the precise seed/implementation was bound after some G01/G02 scores were visible and is disclosed in the [execution plan](../PRODUCT-PAGE-REPLICATION-PLAN.md). No task was replaced or selected by outcome. The private full receipts are at `/opt/are-benchmark-runs/g02-cross-layer-pr2-*` and the VPS driver receipt at `/opt/are/evolution-runtime/g02-product-replication-driver-r2.json`.

All 24 raw pair roots are also preserved in a verified, content-addressed private archive; see the [archive manifest](ARCHIVE-MANIFEST.json). The source roots remain intact. The archive and model traces are not public artifacts.

## Open Questions

- Why did the one DSH container exit before final-context export, and does its failure alter any population-level interpretation beyond the declared incomplete-cohort limit?
- Is a quality-preserving efficiency claim worth a new predeclared hypothesis/candidate cycle, given the observed File-F1 loss?
- Which sanitized per-task fields should appear on a public evidence card after Vlad/Dave review?
