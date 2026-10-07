# G01 Defects4J 32-case r2 result

Status: substantial prospective MRR gain, but the frozen superiority gate
**failed** on the absolute Hit@3 requirement. No threshold was relaxed.
Protocol: [frozen r2](G01-DEFECTS4J-32-R2-PROTOCOL.md).
Prior diagnostic: [r1 result](G01-DEFECTS4J-32-R1-RESULT.md).

The next two source-order cases from each of the same 16 Git projects were
used, with zero case overlap with r1. This is a case holdout, not unseen-project
transfer. All exact buggy sources, Java candidate counts, and source projections
were checked before generation. All 32 VPS GLM-5.3-flash requests passed the
decoder frozen before this run. Predictions were sealed before opening gold;
all human-fix modified-class labels mapped to buggy-source paths.

| Arm | MRR@8 | Hit@3 | Gold-file Recall@8 |
| --- | ---: | ---: | ---: |
| Java adaptation of ARE rank_sources | 0.26749 | 13/32 | 0.47917 |
| Pinned official RepoMap code, adapted Java projection | 0.17969 | 8/32 | 0.22917 |
| Stack-frame locator | 0.20313 | 7/32 | 0.18750 |
| Rank fusion | 0.32656 | 12/32 | 0.55208 |
| GLM reranking | **0.59375** | **20/32** | **0.58333** |

GLM gained +0.26719 MRR over fusion (exact two-sided project sign-flip
p=0.00097656), +0.41406 over RepoMap (p=0.00006104), and at least +0.10
over every comparator. Against fusion, 11 projects improved, none worsened,
and five tied. The eight additional Hit@3 successes versus the strongest
comparator cleared the relative requirement. However, **20/32 is below the
frozen 24/32 absolute requirement**, so the composite gate remains failed.
The result must not be labeled a passed preregistered superiority campaign.

There were 32 tokenizer calls and 32 generation calls, zero generation
retries, 78,129 generation prompt tokens and 1,214 completion tokens.
Source acquisition and candidate indexing were performed in WSL; only bounded
packets and receipts were staged on the VPS. This establishes no cost advantage
over model-free comparators. The local archive contains each response's elapsed
time rather than treating asynchronous preparation as generation time.

## Failure attribution and next hypothesis

Follow-up: [production-source development screen](G01-DEFECTS4J-PRODUCTION-REACH-2026-10-06.md)
now reaches 27/32 cases, seven more with no losses. That is candidate reach,
not GLM accuracy; the frozen r2 score and failed gate remain unchanged.

A separate [post-score diagnostic](../research/arb-trace2code-r1/diagnose-defects4j-candidate-reach-r1.py)
found that **only 20/32 candidate unions contained any gold file**. GLM put a
gold file in its top three on all 20 reachable cases. Every one of the 12 misses
was therefore candidate retrieval, not a reranking miss under this file proxy.
Even the union of the original two retrieval arms' top-20 lists reaches only
23/32 cases, below the gate. Additional GLM retries cannot repair absent files.

Next: screen a general production-source candidate selection policy against
the now-exposed development cases, preserving test sources as caller evidence
while preventing them from exhausting the production-file shortlist. Consider
test-to-production source references if filtering alone does not fix reach.
Freeze any improved policy before testing untouched cases; do not convert this
post-gold development work into r2 confirmation. A full live ARE episode,
stronger symbol-bearing RepoMap projection, other populations/languages, and
the other benchmark campaigns still require separate evidence.

## Evidence receipts

Private WSL root: `/home/vlad_/are-benchmark-archive/defects4j-rerank-r2/`.
VPS root: `/opt/are-benchmark-runs/g01-defects4j-rerank-r2/`.
The archived generation result matches the VPS SHA-256.

- `PACKETS.jsonl`: `0534479f06f4a6c3b4855cf083f193114ae607e5c9eeaa1d7de458506a54a68a`.
- `GENERATION-RESULT.json`: `51eebe009d4909a05845b75dfba0553e8d79e6f046242de183aad7fa0a8f534e`.
- `PREDICTION-SEAL.json`: `0c1ad56bc878a6621e928c825a3574ce0aea9898e768d4b2a39c34eb9749dc4d`.
- `SCORE.json`: `5c7beea98fc8f64e5988d2c78c600fb8078bb3cc444d4965f68314ed870449d7`.
- `CANDIDATE-REACH-DIAGNOSTIC.json`: numeric attribution with source bindings.

Scoring: [r2 scorer](../research/arb-trace2code-r1/score-defects4j-rerank-r2.py).
Public-source pretraining exposure and trace-path cues remain possible.
Modified files are a human-fix proxy, not proof of semantic root cause.
The RepoMap comparison uses pinned official code with an adapted file-text
projection, not its published leaderboard or a symbol-bearing implementation.

## Open Questions

- Can a bounded general source-retrieval policy reach enough production files?
- Will its gain survive untouched cases without further policy changes?
- Does a live ARE episode retain the gain at matched all-in cost?
- How does a stronger symbol-bearing baseline affect the result?
