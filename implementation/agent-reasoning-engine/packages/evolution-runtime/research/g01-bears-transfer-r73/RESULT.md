# G01 Bears Java transfer, r73–r77

Status: private, completed. **The r77 superiority gate failed.** This is a
new-language development/transfer result, not an ARE product or ContextBench
claim. No public publication, release, or deployment occurred.

The pinned official Bears repository (`f69ba79793e8dc05888e588660d8e3bb74538d79`)
has 251 original bug metadata records, but its current active list has 118
bugs across 39 repositories. The score-blind r73 overlap screen retained 37
repositories outside prior ARE benchmark occupancies. R74 exact buggy-commit
HEAD checks returned 200 for 34/37. R75 downloaded and audited exact failed-
side Java archives under fixed caps, admitting the first 24 in original
repository order after one unavailable-commit replacement (25 positions
considered). Separately frozen evaluator-only r76 found existing old-side
`.java` patch labels for **24/24**. No GLM call, ranking, or performance score
was used to select these cases. Selection was nevertheless conditioned on
active status, source availability and label shape, not random sampling.

R77 projected 24/24 failed-side Java source trees into isolated Git indexes,
sealed failure-detail queries (maximum 1,024 bytes), complete ARE rankings,
and GLM prompt packets. The VPS provider run had **24/24 tokenizer admissions
and 24/24 valid functionality summaries**, with 3,666 prompt and 941
completion tokens reported. All source-side ARE, raw BM25, two-channel A,
and three-channel treatment rankings were sealed before the evaluator opened
r76 gold paths. The same structured failure query went to both arms.

| Arm | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARE | 0.35208 | 0.41667 | 0.70833 |
| Raw full-source BM25 | 0.30635 | 0.37500 | 0.75000 |
| A: ARE + raw BM25 | 0.36389 | 0.45833 | 0.70833 |
| Functionality treatment | 0.36364 | 0.45833 | 0.70833 |

Treatment-minus-A MRR@8 was **−0.00025**, with paired 100,000-draw
repository-bootstrap 95% interval **[−0.0375, +0.0375]**. There were **2
wins, 18 ties, 4 losses**. The frozen gate required at least +0.05 MRR,
positive bootstrap lower bound, and 14 repository wins; all three failed.
Do not lower these thresholds or use this exposed cohort as confirmation of
a subsequently tuned method. The evidence contradicts a general
Python-to-Java superiority claim for this functionality-summary mechanism.

Private evidence root: `/home/vlad_/are-benchmark-archive/bears-metadata-preflight-r73-20261005/`.
Key SHA-256 receipts: r73 screen `f413b6de7f3ade534401dcc5a4384a082a86a8fe97c6ff4793f738147c428400`,
r74 HEAD `0c60be52c1e4197c8297cf467ab569be96812044b3224e7984032c3b9b2fc97a`,
r75 source `0ca3ae28df203a1fc271461876c5bc8c568ed84d874c7e6a6fbb68cddae99513`,
r76 evaluator `1ec15024bda4e39528c6e9971d6911569e4e38431f94ed700d0319032ef11460`,
r77 query seal `002a9536e8b68949a2472c474b29c274804e2c87b1258d78ed8f2d4e53eeb8f0`,
provider result `080e59bc10eb4e0fe1d71327b5d1c4a91f72cbaf905dc4c4f9c7dd7f58ee85f0`,
fusion seal `80b5e2e39b2dc68c27ff725f7eeb671f26580ccea8e6beaa8daded7d776aac3e`,
and evaluator result `44bfee25a52adce3df5dbd449f218eb404ff1a00cae3199bfe9628620070f642`.

Erratum to the frozen r73 screen protocol: it described the BugsInPy
r1/r2b exclusion union as 12 distinct projects. The two pinned manifests
actually contain **15** distinct project names. The r73 script used the
manifests directly, so the performed overlap screen was unaffected; the
frozen protocol text and its receipt are preserved rather than silently
rewritten. Bears' official active list is a reproducibility subset, but r77
did not rerun the Java tests; its labels and failure details are from the
published Bears metadata, with source SHA and old-side path checks.

## Open questions

- Why did the functionality summary rarely change early Java rank (18 ties),
  and can exposed-case diagnosis isolate a language or query representation
  issue without using r77 as confirmation?
- Which unopened and independently sourced population can test a separately
  fixed improvement against stronger comparators at matched context and cost?
- Does a broader ARE superiority claim have adequate independent evidence
  across G01, G02, and G03, or only bounded claims within particular tasks?
