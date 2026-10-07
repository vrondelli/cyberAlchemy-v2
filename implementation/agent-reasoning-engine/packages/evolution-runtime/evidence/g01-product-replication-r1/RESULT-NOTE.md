# G01 8K source-localization replication — first fixed cohort

Status: completed and audited for campaign completeness, 2026-09-27; **no product-page superiority claim**.

The [definition](DEFINITION.json) fixed 24 source-only Multi-SWE-Bench tasks across zstd (3), cli (7), svelte (7), and clap (7), comparing the retained ARE shortlist with native intent-anchor control under the same 8K GLM setting. The VPS campaign receipt is `/opt/are/evolution-runtime/g01-product-replication-r1/CAMPAIGN-RESULT.json`; compact copies are [campaign result](CAMPAIGN-RESULT.json) and [paired analysis](PRODUCT-ANALYSIS.json).

Only **15/24 pairs** produced native scores. Eight were unscored and one failed native scoring after both arms selected contexts. The unscored cases include three `source-index.failed` arm errors, three cases with `receipt-budget.unsettled-receipt`, one paired transport/probe failure, and one `frontier.source-digest` failure. The [evaluator-only post-seal audit](GOLD-ELIGIBILITY-AUDIT.json) with the pinned `GoldLoader` confirmed that the failing clap task is the sole selected task with empty/missing native gold files (1/24). This label-integrity case requires independent review. All 24 tasks remain in the audit; no invalid task was replaced.

Among the 15 valid pairs only, ARE minus control averaged +0.1163 Span-F1 and +0.0878 File-F1. Known-token ratio was 0.6004 and summed-arm-time ratio 0.7940. The stratified paired 95% bootstrap intervals were Span-F1 difference [0.0466, 0.1923], File-F1 difference [-0.0400, 0.2033], token ratio [0.5381, 0.6667], and time ratio [0.6819, 0.9228]. These are **incomplete-cohort descriptive estimates**, not the prespecified 24-pair effect; the File-F1 interval also crosses zero. The [analysis script](../analyze-product-paired-cohort.mjs) records the deterministic bootstrap method and its late-binding timing disclosure.

The campaign's own `campaign_pass` gate is false. A new independent G01 replication would need source-only index/transport eligibility checks and evaluator-only gold-label validity screening *before* a new freeze, then a fresh unexposed cohort and a uniform code version. The current 24 tasks are exposed and cannot be silently recycled as independent holdouts.

The full private raw receipts were packaged into a verified, content-addressed archive; see the [archive manifest](ARCHIVE-MANIFEST.json). The source directory is still retained on the VPS. Neither the raw archive nor model traces are public artifacts.

## Open Questions

- Which untouched source-only tasks remain after excluding this cohort, and can a new distribution include C without changing the claim population?
- Which index and transport failures are deterministic harness defects versus transient GLM/VPS failures?
- Can the clap empty gold-context record be reconciled with the pinned native scorer and source dataset?
