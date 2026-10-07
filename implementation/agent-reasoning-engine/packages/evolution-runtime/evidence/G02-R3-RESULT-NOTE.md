# G02 r3 — fresh ARE versus DSH large-window replication

Status: **terminal, privately scored, independently receipt-audited, and archived, 2026-09-28**. This is a new 12-task cohort, not a rerun or extension of G02 r2. The fixed source-only draw selected three previously unexposed SWE-Bench-Pro tasks each from qutebrowser, openlibrary, navidrome, and element-web. Both arms used GLM-5.3-flash and the frozen 1,000,000-token large-window protocol; ARE's per-task token cap was 650,000 and DSH's was 1,000,000. The comparator and ranker were unchanged from r2. The campaign used two pair workers and no score-adaptive replacement.

The frozen [cohort and execution plan](BENCHMARK-CAMPAIGNS-LIVE-2026-09-28.md) are on the private VPS under `/opt/are/evolution-runtime/g02-product-replication-r3/`; the plan SHA-256 is `0ccc9f027000682bbe950e8d8561ff150714aeb9610608149b0c26e4d41da53a`. Twelve pair attempts reached terminal dispatch, nine with both native scores and three invalid because DSH exhausted its fixed request budget. The invalid tasks remain in the denominator and operational audit. Their known DSH tokens before the undispatched failing request were 956,036 and 984,863 on navidrome and 970,790 on openlibrary; all three ARE arms completed. No retry, top-up, or task substitution occurred.

| Valid-pair descriptive measure | ARE relative to DSH | Paired 95% interval |
| --- | ---: | ---: |
| Native Span-F1 difference | −0.03655 | [−0.06689, −0.00529] |
| Native File-F1 difference | −0.03159 | [−0.08714, +0.02397] |
| Known model-token ratio | 0.37784 | [0.31192, 0.50219] |
| Summed arm-time ratio | 0.82672 | [0.74727, 0.92805] |

Intervals use 20,000 deterministic paired bootstrap resamples within repository strata over the nine valid pairs. These efficiency ratios do not describe the three invalid DSH arms or total campaign expenditure. The Span-F1 interval is wholly below zero; the quality and completeness gates do **not** support an ARE-superiority headline. A balanced product-page card may report the efficiency and quality tradeoff only after Vlad and Dave review the exact sanitized card and its receipt manifest. No publication is authorized by this note.

The private `/opt/are/evolution-runtime/g02-product-replication-r3/PRODUCT-ANALYSIS.json` binds each row to the frozen plan and terminal driver receipt. An independent `/opt/are/evolution-runtime/g02-product-replication-r3/HASH-AUDIT.json` (SHA-256 `82bdf82aa7af9c70732a8075ad4243dd75a2441c1a361fc7d5b84aa74744dddc`) verified all 12 task bindings, the nine pre-score prediction seals and native score hashes with recomputed F1, and the three cost-complete DSH budget failures. The private pair-root archive is `/opt/are/evolution-runtime/archives/g02-product-replication-r3-305838d4a842d8590aecee7ec6fbb25a8f8adb0c4d6b915931a7d3bca81cd76b.tar.zst` (10,283,234,182 bytes); the compact manifest/analysis/audit archive is `g02-product-replication-r3-manifest-4ebc035683edd6bf8f238a0bf0d31b3f6efa44fc3aaa9083559b22284938daba.tar.zst`. Both passed full `tar -tf` readability checks. Source roots were retained; no raw files were deleted.

## Open Questions

- Do Vlad and Dave want a balanced r3 product-page evidence card, explicitly showing 9/12 validity and the negative Span-F1 result?
- Should a separately named future G02 protocol test a higher DSH budget for these repository types? It must not be represented as an r3 repair or merged with r3 scores.
- What retention and private restore budget applies to the raw r3 pair roots after verified archival?
