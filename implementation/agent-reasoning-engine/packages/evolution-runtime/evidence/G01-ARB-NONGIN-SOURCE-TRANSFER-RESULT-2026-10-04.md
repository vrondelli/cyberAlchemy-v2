# G01 ARB non-Gin source-only transfer — terminal result

The [pre-evaluation freeze](G01-ARB-NONGIN-SOURCE-TRANSFER-FREEZE-2026-10-04.md)
was recorded before the non-Gin query projection. The exact frozen script
hashes matched immediately before export. The query-only projection, ARE
rankings, and ARB rankings were sealed before the evaluator opened non-Gin
gold. All **45/45** cases across six repositories produced complete all-files
ARE rankings; no case was dropped or scored as a coverage failure. There were
59 root-cause file entries. No GLM calls or VPS transfers occurred.

| Matched edge-failure input, all 45 cases | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARB BM25, pinned-function-parity replica | 0.18000 | 13/45 | 0.53704 |
| ARE Gin-developed trace-text candidate | 0.18003 | 12/45 | 0.51481 |

The primary paired MRR@8 difference is **+0.0000265**. The exact two-sided
six-repository sign-flip `p` is **1.0**; the predeclared 20,000-draw
repository-cluster bootstrap 95% percentile interval is **−0.0731 to
+0.1388**. Both inference gates fail. The full-query JSON ARB row is a
different, unmatched input diagnostic (MRR@8 0.10688) and must not be used
to manufacture a positive matched comparison.

Repository mean paired MRR@8 differences: Caddy +0.1190 (7 cases), Clap 0
(1), etcd +0.2000 (4), Click −0.0715 (26), pytest −0.5000 (1), and Tokio
+0.1210 (6). The 26 Click cases dominate the case-weighted total; the
one-case repositories are highly unstable. This mixed pattern rejects a
cross-repository source-only superiority claim for the frozen candidate.
The 45 non-Gin cases are now exposed and cannot be re-used as fresh
independent confirmation for a tuned successor.

An explicitly **post-confirmation exploratory** [diagnostic](../research/arb-trace2code-r1/diagnose-nongin-transfer-r1.py)
(script SHA-256 `037627ecaf19f9b025fac96186ff34c3238ab39a7f14e4e96d667e4c27f068fc`;
private audit SHA-256 `920a5355c0537d20fc67280555ddd8ad1000d47a91801a61d38eab2ead997e01`)
also scored the already sealed generic ARE BM25 arm. Its MRR@8 was
**0.17632**, versus **0.18003** for ARE trace-text and **0.18000** for ARB
BM25. The trace adjustment changed aggregate MRR@8 by only +0.00370 and
changed **none** of Click's, pytest's, Tokio's, etcd's, or Clap's mean MRR@8;
only Caddy moved (+0.02381). Thus the Click/pytest regression cannot be
attributed to the Go-specific trace bonus in this frozen candidate. The
underlying ARE file-level index/tokenization/ranking is the stronger next
diagnosis target. These post-hoc scores are development evidence only.

Private WSL receipt SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| Query projection seal | `b6a82800dbd12069918370af88c6dee80b2b1fd3dd745b3697f57cb17cf0e349` |
| ARE rankings seal | `99b05170a58d628ddfbd6610a63bdc0b6209783368c9210c58a047c41c82f116` |
| ARB rankings seal | `c2d6aa3d4f52ee5fd5e7bf5e411b2bd8fac43a2138ebb96e31c3a167e8fdd60a` |
| Evaluator audit | `bb91bc9fde0aaa4aca604b7153f7850d9a2e3bd6ea7ca7d2eb6822e9135a7be6` |

All receipts are under
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/` in the
`nongin-confirmation-queries-r1/`, `nongin-are-transfer-source-r1/`,
`nongin-arb-bm25-source-r1/`, and `nongin-transfer-eval-r1/` directories.
The source-only snapshots are projections, not exact pinned Git checkouts;
the ARE ranker was not wired into a live model episode; the comparator is not
the official package evaluator. No ContextBench or general ARE superiority
claim follows.

## Open Questions

- Which aspects of ARE's file-level indexing/tokenization/ranking cause the
  Click/pytest regression relative to chunk-level ARB BM25?
- What genuinely independent population can test a language-neutral successor
  after development on the now exposed ARB cases?
- Can a live exact-Git ARE episode preserve any source-only retrieval benefit
  under the original G01 scoring and cost contract?
