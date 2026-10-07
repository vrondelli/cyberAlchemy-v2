# G01 Java failure-source anchors, r112–r115 — exposed development

Status, 2026-10-05: **candidate reach passed both frozen screens; selective matched ranking failed both quality gates**. This is private post-hoc development, not independent superiority. The 24-case GitBug confirmation block remains unopened.

The [r112 source-only screen](../research/g01-gitbug-java-r78/screen_failure_source_anchors_r112.py) used only the first 3,000 failure-text characters and the exact buggy Java projection. It matched exact quoted literals, Java qualified type paths, and rare identifier tokens to production files, using a fixed source-document-frequency cutoff and at most 20 candidates. It did not read fix source, gold labels, provider responses, or fresh confirmation. Source-seal SHA-256s: GitBug `875bc3e1fb94e6819bc538a50c8f0d4431f2bb70db0eb8d8ef6eefc65340ae0d`; Bears `a2f21a1368844ae2abf5a0144c1239c7fa931ec227273ca5406ee773dab1e0a8`.

The separate [r113 evaluator](../research/g01-gitbug-java-r78/audit_failure_source_anchors_r113.py) found gold in the anchor top ten for **6/12 GitBug** and **9/24 Bears** cases. More importantly, **three GitBug and three Bears cases** were new top-ten gold hits beyond the r101 class-usage top ten, passing the frozen minimums of one and two. This is a union candidate ceiling, not a selected-rank gain. Audit SHA-256s: GitBug `912f47b6585d790ba9c7c5e736163302ea1d34d8921154892dab810ad19bcefa`; Bears `0539b9e57e01ebcef1f3bf3b01b521f0118eca79a8bbae5ee0126ec808d432e7`.

The [r114 source-only matched ranker](../research/g01-gitbug-java-r78/rank_failure_source_anchors_r114.py) applied the same selective rule to strong raw+symbol+structure and ARE-safe arms: choose the first qualified anchor-top-ten file already within that arm's production ranks 2–16, require an exact qualified type or literal hit or at least two identifier hits, then move only that file to second production rank. It preserved each arm's all-file and first-production heads and full file universe. It changed 4/12 strong and 5/12 ARE GitBug rankings, and 5/24 in each Bears arm. Source-seal SHA-256s: GitBug `4182cd900045ade0771e98ae69c4598f3b77d483f3d52aa52ce6afea6325b02b`; Bears `ca7efa8854eea5cbd4e5a4e629b73ee632ddddb36b9938d56327efa431ef0b89`.

The separate [r115 evaluator](../research/g01-gitbug-java-r78/audit_failure_source_anchors_r115.py) found **no ARE MRR@8 change** in either population: GitBug remained **0.70000** versus strong matched **0.63056**; Bears remained **0.58829** versus strong matched **0.54415**. The prior-vs-new ARE difference was exactly zero in every case, so both frozen quality gates failed. In the six r113 newly reachable cases, r114 selected a different file or abstained; it selected none of the newly reachable gold paths. Audit SHA-256s: GitBug `a4e3037f28ad1b870b34e8d6d63b9774e4385f56f850a0e8a6f06834c99f841e`; Bears `7559cd00e58f2d682c18de8c0ff8d8f8a78e37e207a7fc9dc60d6331cb439cf2`.

No GLM/tokenizer call, fresh confirmation, publication, or superiority claim occurred. The failure-text relation is a useful candidate source; its simple exact-match score is not a causal selector. A next selector should compare bounded source evidence against the failure for both anchor candidates and the current production head, with a frozen abstention rule, cost ceiling, and matched comparator before any fresh cohort.

## Open Questions

- Can a source-grounded selector distinguish the newly reachable gold files from higher-scoring but incidental failure-text matches?
- Can it improve early-rank quality over both prior ARE and the matched strong arm on GitBug and Bears, under a fixed token/time budget?
- Only after exposed cross-population qualification, does the frozen rule transfer to the untouched GitBug confirmation block?
