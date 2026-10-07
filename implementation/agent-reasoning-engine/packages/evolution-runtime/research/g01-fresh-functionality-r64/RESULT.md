# G01 fresh functionality-transfer admission, r64–r71

Status: admission work complete through r71 and a separately frozen r72
mixed-input quality run complete. **The r72 superiority gate failed.** This is
private BugSwarm Python evidence, not ContextBench or an ARE product result.

- R64 source preflight: 28/30 exact failed commits returned over GitHub
  HTTPS. Its first evaluator compare run is terminal invalid: it required a
  `head_commit` field absent from GitHub's response, so its 0/28 labels are
  a parser failure, not evidence of zero eligible cases. Preserve
  `evaluator-only-label-preflight/LABEL-RESULT.json` (SHA-256
  `51590d4224a09c1edb281a0765acd415877cc32b3f19a2cb53f41ea32897b6d3`).
- R65 separately screened the 28 source-available cases through exact
  GitHub web diffs and old-side path checks: 26 provisional old-side cases;
  two added-source cases excluded. R65 is not final gold.
- R66 downloaded and checked 26 failed/passing exact-commit tarball pairs.
  Its frozen web-diff/direct-tree equality gate failed at **22/26**. Four
  web diffs listed extra paths not changed between the exact blob trees.
  R66 receipt SHA-256:
  `ec41ccd36f719d642e5e57c8d762d4281d32e1ab525a087492ab1ea786082bac`.
- R67 was separately frozen before ranking or model calls. An independent
  reread of all 52 pinned archives recomputed direct Git blob changes and
  admitted **26/26** under the direct-tree rule; the first **24** in original
  source order were frozen. Four web-diff disagreements remain explicit.
  Evaluator receipt SHA-256:
  `91c2c3665f1e94ef9e3106d9ece699f313a92eb6ba145b27572ff33989caba27`;
  gold-free source cohort SHA-256:
  `4e779481382a57b99e0075bdad801fb15bf122275f20a409bac2264d48c528be`.
  Selection was conditioned on old-side label shape before any performance
  outcome; it is not an unselected random sample.
- R68 authenticated BugSwarm HTTPS page/job identity and byte-complete raw
  logs for **19/24**; five within-cap logs stopped at 32,577 bytes despite
  larger HEAD lengths. R69's one-shot HTTP/1.1 alternate client admitted
  **0/5**. R70's separate VPS HTTPS route admitted **1/5**; the other four
  stopped early there too. R68 and r69 remain failed, and r70 cannot repair
  them. R68 receipt SHA-256:
  `ca6a78626cef456243b46b4b57a5e3a30737a14ccd8b60f1a9f0ce75a4940441`;
  r69: `3561b1cb3370958aa23dbc5311b535c7e911b5754e4aa90b49336a65c1c79a9c`;
  r70: `98e7a4a45364769193e6592510e5579d3aa660c2d9cebf4aa4291329164c21ef`.
- R71 replayed all 204 historical exclusions used by the pinned r32 queue,
  then the already used queue, r34, and r64 entries. It found **zero**
  additional metadata-eligible Python repositories in the BugSwarm 1.3.1
  source order under the current disjointness and eligibility rules. This
  is a supply result, not an impossibility result for other datasets,
  languages, eligibility definitions, or releases.

No GLM request, source ranking, score, or target path export to the VPS
occurred in r64–r71. R72 was frozen separately before ranking or model calls:
20 complete HTTPS logs and four failure-side metadata-only queries (ordinals
1, 12, 22, 23). Both arms received the same query. Truncated log bytes were
not used, and no gold path or passing source went to the VPS. This is not an
unchanged-log replication of r62.

R72 sealed 24/24 failed-commit Python source projections, complete ARE
rankings, and fixed r61/r62 retrieval/fusion rankings before evaluator labels
were opened. The private VPS GLM run had **24/24 tokenizer admissions and
24/24 valid summaries**, with 8,349 prompt and 848 completion tokens reported.
The paired direct-tree evaluation found:

| Metric | Baseline ARE + raw BM25 | Functionality treatment |
| --- | ---: | ---: |
| MRR@8 | 0.25278 | 0.38715 |
| Hit@3 | 0.375 | 0.500 |
| Recall@20 | 0.625 | 0.750 |

MRR@8 uplift is **+0.13438**, with a paired 100,000-draw repository-bootstrap
95% interval of **[+0.03194, +0.24271]**. The complete-log stratum MRR@8 was
0.29333 → 0.41458 (20 cases); metadata-only was 0.05 → 0.25 (four cases).
There were **10 wins, 13 ties, and one loss**. The prospectively frozen r72
gate required at least 14 repository wins; therefore it **did not pass** even
though the other six quantitative/validity conditions passed. Do not lower the
win threshold after observing this result or present it as a superiority
claim. This cohort is now exposed. A new population and strong matched
comparators are needed for a broader claim.

R72 receipt SHA-256 values: query seal `c57b549f81087609c2bb45b1f2e99d8b5c783f289ad33c01b5fa54d92198a71e`;
provider result `3a0a11d83731abe5af21be8717beea7f69e360340c1ff5ea94369cd06e57b9dd`;
evaluator result `97fe983b9adb27ff64224f143397de2f7412a94b5ccb087c043039388102bb93`;
query
JSONL `854906f04f70a67b1387fe03e44173caac39108e0e1c2ace60420a0187ea891a`;
source projection `8eb68c605ef20e2c7be0d873f62c218c088e6c974c8bca83f179ff38f0517023`;
fusion rankings `405c45f6368d2d679934cc46829060ec79a98b0126a21e699bdc0d71a573a69a`.
The canonical private receipts are under the path below; do not rely on this
summary as a substitute for rehashing them.

Private receipts: `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-functionality-r64/`.

## Open questions

- Which independent, repository-disjoint and mixed-input-tolerant cohort can
  test the now-exposed r72 mechanism without reusing outcomes for tuning?
- Is a direct authenticated log source available for the four incomplete
  cases, without replaying partial logs or inventing missing text?
- Which external, repository-disjoint population and comparator are needed
  beyond this bounded transfer for an ARE product superiority headline?
