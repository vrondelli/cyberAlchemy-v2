# G03 BEAM 500K cross-encoder r4 — exposed development protocol

Status: **private, source-only development result; not an independent
campaign or superiority claim**. The protocol above was written while the
30-conversation source-only selection run was in progress, before its
evaluator citation audit. The 60
500K information-extraction questions are already exposed development data;
the 16 reserved 100K conversations remain outside this protocol.

## Objective and fixed comparison

Test whether a fast cross-encoder can improve source-turn citation reach over
the unchanged BM25 control on the 30 disjoint-seed 500K development
conversations. The treatment uses the same source-only histories and questions,
the same at-most-2,500-UTF-16-character fragments, and the same at-most-5,000-
UTF-16-character JSON evidence projection as the sealed BM25 comparator. The
control bindings are copied from the sealed r1 source-only selections at
SHA-256 `fa82830ff3e6d3e9eb386404901c76a3d610768324aa326d7ac9ee4925c0e2f0`.
The [r4 selector](../research/g03-beam-r1/plan-beam-500k-dev-ie-cross-r4.py)
is fixed at source SHA-256
`e5f03d34e9106bd61cd531d9a82e127fc1efb6df1b2bc27c5e9e02d8dd2d3a59`.

For each question, r4 obtains the top **100** fragments using the pinned BM25
ranking, scores each question–fragment pair with the pinned quantized
`cross-encoder/ms-marco-MiniLM-L6-v2` model, then greedily packs fragments by
descending logit until the identical 5K projection cap is reached. The pair
tokenizer truncates to **256** tokens; batch size is **8**. No evaluator
answer, rubric, or citation ID enters selection. The model is an
[Apache-2.0 release](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2)
at Git revision `233902d25c440f23af6f7d6e94d2946bac0bee0a`;
the exact `model_quint8_avx2.onnx` SHA-256 is
`c80a8b34256ea453093d612e3ac48d3d965a0c0a48c7906709af8b8e28461bf9`
and tokenizer SHA-256 is
`d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66`.
The isolated development environment uses Python 3.14, ONNX Runtime 1.30.0,
tokenizers 0.22.1, and NumPy 2.3.3. The private model and environment live
under `/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/`, outside the
repository.

## Assessment and limits

The exact one-conversation source-only throughput preflight sealed two
selections in **14.227 seconds**, scoring 200 pairs and 45,662
post-truncation tokens; its private SHA-256 is
`5561f6052499e6ec3ee45d6e539172f8cafaee83c7187a130cc08c9c3510be86`.
This one-conversation preflight established resource feasibility, not retrieval
quality. The subsequent 60-selection evaluator-only audit computed paired
cited-turn hit-any, hit-all, and total reach against the unchanged BM25
control. Any gain remains **development citation reach only**. A credible next gate also
requires source/label integrity, answer-bearing excerpt review, exact 8K
GLM wire admission, matched paired GLM answer quality, index/retrieval cost,
and a separately frozen independent cohort before a superiority claim.

The completed 30-conversation source-only selection sealed **60/60** probes
and scored **6,000** question–fragment pairs (1,237,982 pair tokens after the
256-token cap) in **600.753 seconds** on WSL. The private selection SHA-256 is
`21563d67cd378171d9e21e3778ee92a4a56dfd0dfe2566e3ce810d58341e8f02`;
an independent JSON comparison confirmed all 60 BM25 control bindings equal
the earlier seal. The receipt's `truncated_pairs` count of 4,159 means pairs
*at* the 256-token cap; it cannot distinguish exact-cap inputs from ones
actually truncated.

The [evaluator-only r4 citation audit](../research/g03-beam-r1/audit-beam-500k-dev-ie-cross-r4.py)
(script SHA-256 `18b3d93260066d6427f030b35ead06f27d0613242408444b9b43a0b5cca50d53`;
private receipt SHA-256
`4ae69ed08a8e21c500e7eda23ddd84bc768921e4cfb6ce85d3aaeb53aa234c6f`)
found r4 **36/60** hit-all, **37/60** hit-any, and **39/74** cited turns
reached, versus unchanged BM25 **31/60**, **31/60**, and **33/74**. Cited-turn
counts yielded **seven r4 wins, one BM25 win, and 52 ties**. This is an
exposed-development retrieval gain of five hit-all questions and six cited
turns. It is not evidence of answer correctness, a native BEAM score, a cost-
adjusted win, or an independent superiority claim; a prior BEAM excerpt
mechanism improved citation reach without improving answer quality.

The source-only E5-small-v2 top-300 preliminary alternative was not promoted:
its one-conversation selection required **148.635 seconds** for 552 passage
embeddings and two queries, and a sealed evaluator-only triage found **0/2**
hit-all versus BM25 **1/2**. The exact E5 selection and audit SHA-256 values
are `48928a774a9c3e87d68bf322bd8e6f173d8a41201ad19d17bed402d60d5f7a86`
and `337b93bb78b2a81e9bdaaa3932612f8bca9173239f38b57dea6294290f981418`.
Two exposed questions cannot rule out E5 generally; the result only makes a
full 30-conversation CPU run a lower-priority next spend.

## Open Questions

- Does the frozen r4 treatment beat BM25 on development citation reach, and
  how much of any difference is attributable to the top-100 pool ceiling?
- Do r4's 256-token truncation and selected full fragments preserve the
  answer-bearing details, not just a cited turn ID?
- Can the all-in reranking CPU cost be deployed on the VPS and offset by a
  meaningful paired GLM answer-quality gain without using reserved labels?
