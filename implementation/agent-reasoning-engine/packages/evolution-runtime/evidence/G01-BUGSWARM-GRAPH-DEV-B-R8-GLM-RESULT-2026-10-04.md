# G01 BugSwarm cohort B r8 — stratified candidates and guarded GLM selector

Status, 2026-10-04: **completed private, score-exposed development run; frozen advancement gate failed on unresolved source/label provenance.** This is not ContextBench, a live ARE workflow, untouched confirmation, or product superiority.

The [prospective r8 protocol](G01-BUGSWARM-GRAPH-DEV-B-R8-GLM-PROTOCOL-2026-10-04.md) bound the r7 source-only candidates before provider access. All 24 packets passed the same-account tokenizer with at most **5,555 prompt tokens** per case plus the 512-token output reserve, and **83,662** tokenizer prompt tokens in total. The source-only VPS run made 24 one-shot listwise calls and 38 swapped-order pairwise calls, with **24/24 valid listwise**, **38/38 valid pairwise**, no transport failure, and no retry. Generation usage was **102,576 prompt + 1,901 completion tokens**, with **153,929 ms** summed model-call elapsed time. The 119-file VPS receipt bundle and private WSL cold copy have the same sorted file-hash inventory digest `c9e293998a9b9dc3e72f2475088141a77e07de42e898cdd89a658336cc30426d`. No evaluator labels were transferred to the VPS.

Complete source-only predictions were sealed before gold access at `PREDICTIONS-B-R8.jsonl` SHA-256 `d8582ac65fd1fb08efc6baf82f85b01057dbcf764a245061459c0d066be5b0df` and `PREDICTION-SEAL-B-R8.json` SHA-256 `198094643e918e298c704aef9e0d5dc8b9ec4d3a8bf77a688809fed0d61cd1e2`. The evaluator-only result SHA-256 is `010efa6fcf0b5fb4219342cc6564ad7d1fd5bdaeb0142d24b63e82c5b6768307`.

| Exposed 24-repository cohort B | ARE file ranker | Graph r2 | Raw r8 listwise | Guarded r8 |
| --- | ---: | ---: | ---: | ---: |
| MRR@8 | 0.15764 | 0.41667 | **0.62326** | 0.60243 |
| Hit@3 | 6/24 | 12/24 | 16/24 | 16/24 |
| Top-30 gold reach | 13/24 | 18/24 | 19/24 | 19/24 |

The source-only r7 candidate pool reached **22/24** gold files within its 80-file cap. Guarded r8 improved over ARE by **+0.44479 MRR@8**, with a 20,000-draw paired repository bootstrap 95% interval **[+0.28819, +0.60486]**, 16 wins, eight ties, and zero losses. Versus graph r2, guarded r8 improved **+0.18576**, but its paired interval **[−0.01736, +0.38715]** crosses zero. Raw listwise improved over graph r2 by **+0.20660**, interval **[+0.00347, +0.40972]**; this is diagnostic on an exposed development cohort, not a post-hoc promotion of raw selection.

The pairwise guard did **not** protect the three correct graph-r2 rank-1 files that raw listwise demoted (ordinals 13, 18, 19). It rejected one correct raw rank-1 rescue (ordinal 5), reducing MRR@8 by 0.02083 overall; no other case's MRR@8 changed. Thus the additional 38 pairwise calls showed no benefit on this cohort. Future comparison of raw selection must be frozen prospectively on a distinct population, not selected after observing these scores.

The frozen r8 numerical and validity conditions all passed: 24/24 valid listwise, no transport failure, at least 22/24 candidate reach, guarded MRR@8 above 0.41667, at least 16 ARE wins, and a positive paired lower bound. The **whole advancement gate failed** because the original BugSwarm logs and patch-diff labels were obtained over unauthenticated HTTP and remain transport-provisional. The evaluator receipt also contains an auxiliary `are.rank1=0` field produced from a baseline that omitted rank-1 data; do not use that auxiliary field. Primary MRR@8, Hit@3, reach, paired scores, and raw/guarded rank-1 comparisons against graph r2 do not depend on it.

Next: seek independently authenticated original logs/labels or reproducible failing-commit evidence; then freeze an untouched, repository-disjoint confirmation campaign with comparator parity and complete quality/cost accounting. The reserved confirmation partition has not been opened. Structured code-field retrieval and query-quality-aware reformulation are candidate future acquisition mechanisms, not part of this sealed r8 result.

Subsequent [provenance audit](G01-BUGSWARM-GRAPH-DEV-B-R8-PROVENANCE-AUDIT-2026-10-04.md): exact GitHub HTTPS trees independently corroborated the patch-file label set on **24/24** cases. BugSwarm HTTPS byte-matched **15/24** original logs; nine large transfers closed early. This strengthens label evidence but does not retroactively pass the frozen r8 gate or supply untouched confirmation.

## Open Questions

- Can original BugSwarm logs and diff labels be authenticated or independently reproduced without leaking passing-commit information into source-side ranking?
- Does raw listwise retain its apparent advantage over the pairwise guard on a fresh, predeclared population?
- Can source-only structured retrieval reach the two files absent from r7's bounded candidate pools while keeping the 8K and cost limits?
