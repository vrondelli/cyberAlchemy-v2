# G01 r6 — frozen GLM 8K context-selection replication

Status: **terminal, 24/24 native-scored, independently receipt-audited, privately archived; product superiority claim not yet admitted**, 2026-09-29. This is the fresh nine-repository, four-language cohort frozen in [the r6 protocol](G01-R6-PROTOCOL-CANDIDATE.md), not a top-up of r5 or another earlier run. Both arms used GLM-5.3-flash at an 8K request window. No task was replaced. This note authorizes no publication.

The private VPS campaign root is `/opt/are/evolution-runtime/g01-product-replication-r6`. The [frozen definition](G01-R6-SOURCE-ONLY-CANDIDATE.md) has SHA-256 `b8f43652066e037441f9dee0ddcdf1acbed849f63746c31595b07f1ea022a427`; `CAMPAIGN-FREEZE.json` has SHA-256 `ca6369131496e64ef670c4cd01feada4f00538a283d452b0c4f2b2e2b0e849e6`. `PRODUCT-ANALYSIS.json` has SHA-256 `b928ac86ed80d274fb683854ba5ec861fdfdc675b23b44719fb4ed503051fa6e`, and the independent `HASH-AUDIT.json` has SHA-256 `df222a7731d0ca98d1bc1a31f3c44d45702f5c253f73f7f87cc28c891457f2fb`; it verifies 24 scored pairs, zero invalid pairs, and intact receipts, prediction seals, source/score hashes, and native metric recomputation.

| Frozen paired measure | ARE versus control | Repository-stratified paired 95% interval |
| --- | ---: | ---: |
| Native Span-F1 difference | +0.19080 | [+0.12080, +0.26755] |
| Native File-F1 difference | +0.14567 | [+0.08919, +0.20205] |
| Known model-token ratio | 0.61836 | [0.55635, 0.69105] |
| Summed arm-time ratio | 0.72713 | [0.66302, 0.80076] |

All four *numerical* directional conditions and the 24/24 completeness condition pass. The fixed analysis uses 20,000 paired resamples within repository strata; its precise bootstrap implementation was bound after some earlier G01/G02 scores had opened, as disclosed in the [replication plan](PRODUCT-PAGE-REPLICATION-PLAN.md). These are cohort estimates, not whole-ContextBench or product-wide results. Summed arm time is not campaign wall time.

An evaluator-only [gold-label lineage audit](../research/g01-fast-live-v1/audit-gold-lineage-r6.py) (script SHA-256 `6152c39116ad07298217a5a62551d9308baca647e66fac336ccb3b3fa23c6016`, result SHA-256 `ccade593a5dbe8c4676ff339469d2c9b64626c9e24c23de995ed10be6ec3f5a0`) compared all 202 annotations with the pinned base checkouts. Its initial conservative parse flagged 108 annotations. A separately versioned [semantic refinement](../research/g01-fast-live-v1/audit-gold-lineage-r6-r2.py) (script SHA-256 `caa860a231d8211018b0e7f99fd2e63394197799c47a2d1b72b9053d8cfdfd91`, result SHA-256 `f95a765b1c1539fbcfa9d0cf4f19effe214139a04afb067de044a96577f4bd76`) found 51 scorer-clamped EOF sentinel ranges and 28 raw source excerpts that match the base. **Twenty-nine annotation discrepancies across 11 tasks remain unresolved:** three ranges beyond base, 15 raw-content mismatches, and 11 labeled reproduction files absent from base. An exact-path search did not find those absent files in the dataset's patch/test-patch fields; this does not prove why they are absent. Neither audit changed the cohort, prediction, native score, or frozen gate.

A third versioned, evaluator-only refinement, [r3](../research/g01-fast-live-v1/audit-gold-lineage-r6-r3.py), has script SHA-256 `f155588493f7e129c704ae6105aab271f65997374b5696bde1d115df9a6f6884` and private result SHA-256 `1695aec39efbc3b1731b5254d271ff7586e8187f0b61bcf80bcc0aedbfa29fe6`. It verifies that **13 of the 15 raw-content mismatches** were excerpts omitting a terminal blank source line. This leaves **16 unresolved annotations in six tasks**: three ranges beyond base, two other raw-content mismatches, and 11 reproduction-file annotations absent from base. A read-only source check found the three out-of-base Go excerpts nine lines earlier in the pinned base file; their recorded coordinates remain wrong for native scoring. In the pinned native scorer, absent files remain in `gold.files()` for File-F1 but yield no byte span from `gold.byte_spans()`; thus the 11 absent-file annotations are not merely a cosmetic text discrepancy. Those missing annotations represent four distinct gold files across three tasks. If predictions can only name files in base, the *maximum possible* File-F1 on the affected Go gRPC, Go, and Svelte tasks is respectively 0.8889, 0.9412, and 0.5000, irrespective of model quality. These are read-only label diagnostics, not corrected scores. The original and r2 results remain immutable, and r3 does not change any prediction or score.

A fourth evaluator-only [residual adjudication](../research/g01-fast-live-v1/audit-r6-residual-labels-r4.py) (script SHA-256 `1cb97c965eb31ebbc52e512af9fea8e5d78b42b24c2e0f888284b63fbd2c2d20`) sealed `/opt/are/evolution-runtime/g01-r6-residual-label-adjudication-r4/RESULT.json` (SHA-256 `d37158c251d25d75c525e40bcc28b835cc490d1f4d6b8235fa7f3579d53010c3`; an independent WSL cold copy at `/home/vlad_/are-benchmark-archive/g01-r6-label-adjudication-r4/RESULT.json` matches that hash). It rechecked all **five** surviving coordinate/content discrepancies against unique locations in identical pinned control/candidate base files: the three numbered Go excerpts begin at actual lines 471, 474, and 476 rather than recorded 480, 483, and 485; the two Serverless excerpts match at 1495–1500 instead of 1494–1499, and 16–35 instead of 16–33. The Go match strips embedded line-number labels and indentation and omits a numeric EOF sentinel; the Serverless matches use exact split lines. The other **11** annotations, covering **four** distinct reproduction files, are absent from both base checkouts. This is a mechanical, post-score explanation, **not** corrected gold or a native rescore. It leaves the frozen label-integrity gate false; the prospective screened successor remains the claim path.

Because the prospectively frozen headline rule also requires **no unresolved label-integrity issue**, the favorable numerical gate is **not sufficient to admit a public superiority headline**. A descriptive, explicitly qualified result may be reviewed; no post-hoc deletion of affected tasks, label rewriting, or pooling with another campaign is permitted. The next independent G01 protocol should prospectively screen label-to-base lineage as evaluator-only eligibility before freezing a new source-only selected cohort, disclose the population change, and preserve r6 intact.

A further read-only lineage check reported all 11 absent-from-base
annotations in the native loader's `init` group. **Correction, 2026-10-02:**
that group assignment is not evidence of the original annotation phase. The
pinned Parquet `GoldLoader` at
`/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/contextbench/parsers/gold.py`
maps each flat `gold_context` list to `Gold.init` and leaves `Gold.add` empty;
the [dataset card](https://huggingface.co/datasets/Contextbench/ContextBench/blob/main/README.md)
describes the Parquet field as a flat list of spans, not phase-labeled
`init_ctx`/`add_ctx`. The exact VPS parser SHA-256 is
`3eee61cfe239590d069f03fdbf38a70a74efc6d170b37ca17e39ba7f9742e1a7`.
The four distinct reproduction files remain absent from both pinned base
checkouts, and the five coordinate discrepancies remain. The frozen scores,
failed label-integrity headline gate, and original audit receipts are
unchanged; only the prior inference from the `init` label is withdrawn.

An explicitly **post-hoc sensitivity**, not a revised cohort or claim gate, used the fixed [r6 label audit](../research/g01-fast-live-v1/audit-gold-lineage-r6-r3.py) to identify six tasks with unresolved annotations, then re-ran the exact repository-stratified 20,000-resample bootstrap on the other 18 original score rows. The [evaluator-only script](../research/g01-fast-live-v1/audit-r6-label-sensitivity-r1.mjs) (SHA-256 `82e6e468b77a6322435283088499a394ed4afda188805ac11ce44d05dfa1cfda`) first reproduced **all four frozen 24-pair intervals exactly** from the hash-bound original analysis. Its private `/opt/are/evolution-runtime/g01-r6-label-sensitivity-r1/RESULT.json` has SHA-256 `9383d24e18a3eeada46413f5b87a253bd05fb4e32e24fef04e5d33fc22fb39a2`.

| Post-hoc 18-task sensitivity only | Point | Repository-stratified paired 95% interval |
| --- | ---: | ---: |
| Native Span-F1 difference | +0.19415 | [+0.10608, +0.28535] |
| Native File-F1 difference | +0.16512 | [+0.10370, +0.22654] |
| Known model-token ratio | 0.61144 | [0.55585, 0.68415] |
| Summed arm-time ratio | 0.70858 | [0.63300, 0.80133] |

The six disputed tasks also had positive mean quality differences (+0.18074 Span-F1, +0.08730 File-F1), so they are **not the sole source** of the original favorable result. But removing them after observing label defects cannot retroactively repair the frozen 24-task campaign or license a superiority headline. This sensitivity is descriptive robustness evidence for designing an independent, prospectively label-screened successor.

The full private root was archived with SHA-256 `0751d7a5339d7b1c2409da16eaf017b9ef5e33854c51d172a8e4f8edafb418e6` (470,754,985 bytes); a full compressed-tar listing passed and no source files were deleted. The first two label-audit results and exact scripts were preserved in a separate private addendum archive, SHA-256 `ce2d0c4b3707b66d12a5826ad9986f0d9e72de68e640334c98642fa3a88076d4` (8,945 bytes). The r3 script and result are preserved in another private addendum archive, SHA-256 `830766cfd6999479b9083cd058dad3d1de1b21959188dcd0fad9308510f6b2fc`; both addenda passed full compressed-tar listings. All live source files remain intact. Vlad and Dave have not reviewed an exact sanitized card. Publication remains separately gated.

## Open Questions

- Why does the native gold include four reproduction files absent from both pinned base checkouts, and what dataset-author interpretation—if any—explains the five verified coordinate discrepancies? The frozen native scores must remain unchanged.
- Can a prospectively frozen independent cohort with evaluator-only label-to-base eligibility and enough repository/language diversity reproduce both quality and cost gains?
- What sanitized exact card, if any, should Vlad and Dave review once label integrity is resolved?
