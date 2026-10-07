# G03 after r6 — source exhaustion and independent-population research

Status: **source-only research, not a new frozen campaign or publication decision**. Checked against the private r6 selection receipt and the official benchmark sources on 2026-09-29. The [r6 result](G03-R6-RESULT-NOTE.md) remains a valid bounded five-type LongMemEval-S accuracy result; it is not enlarged by this note.

## Untouched LongMemEval-S supply

The exact r6 selection receipt `/opt/are/evolution-runtime/g03-product-replication-r6/SELECTION.json` reports the untouched pool before r6 and its fixed eight-per-type allocation. Subtracting those sealed r6 IDs leaves:

| Source question type | Untouched after r6 |
| --- | ---: |
| Knowledge update | 11 |
| Multi-session | 57 |
| Single-session assistant | **0** |
| Single-session user | 7 |
| Temporal reasoning | 61 |
| Single-session preference | **0 before r6** |

Thus the current cleaned LongMemEval-S revision cannot supply another independently selected five- or six-type cohort under the existing no-reuse exposure rule. A four-type residual campaign is possible but would **narrow**, not generalize, the r6 claim. Do not reuse an exposed question, relabel a different haystack for that question as an independent question, or pool a four-type successor with r6. The official [LongMemEval repository](https://github.com/xiaowu0162/LongMemEval) describes S, M, and oracle as variants of question instances with different history lengths and provides a custom-history compiler. It does not itself establish a fresh unexposed question set for this project; any proposed M/oracle/custom-history successor needs an exact question-ID intersection audit before it could claim independence.

Storage is not the immediate G03 blocker: the private r6 cohort, generation, and scoring roots occupy about 20 MiB, 57 MiB, and 2.3 MiB respectively, while the VPS had 4.9 GiB free at this check. The blocker is **independent source population and an admitted new protocol**, not disk capacity. This does not affect the separate G01 r4 storage gate.

## Candidate independent populations

The official [LoCoMo release](https://github.com/snap-research/locomo) provides ten annotated long conversations with question-answer evidence. Its questions are separate from the LongMemEval source, so it is a plausible external-validity study, but ten conversations mean questions within one conversation are correlated. A credible claim would use conversation-level sampling/uncertainty, not treat every question as independent, and must audit text-only versus image-derived evidence and the judge contract before dispatch.

The official [MemoryAgentBench repository](https://github.com/HUST-AI-HYZ/MemoryAgentBench) and [dataset card](https://huggingface.co/datasets/ai-hyz/MemoryAgentBench) describe incremental chunk ingestion and separately constructed EventQA and FactConsolidation tasks. EventQA tests temporal event chains; FactConsolidation tests conflict resolution. These are more diverse than a second LongMemEval-S draw, but they are **new benchmark objectives**, not a drop-in r7 or evidence that ARE wins. The release also includes adapted LongMemEval data, which must be excluded from any independent-population claim. The authors' metric map uses exact/substring matching for several tasks and an LLM judge for LongMemEval; an ARE study must predeclare its own task-appropriate scorer, cluster unit, comparator, failure accounting, and claim ceiling.

The [follow-up published-data feasibility audit](G03-EXTERNAL-POPULATION-FEASIBILITY-AUDIT.md) supersedes that initial preference: MemoryAgentBench's EventQA/FactConsolidation rows collapse to only five and four base-context families respectively. The audited BEAM release offers 20 unique-seed `100K` conversations with 400 probes across ten abilities, and 75 distinct seed groups across its three published splits. BEAM is now the better candidate for a separately named external-validity study, subject to source/reference separation, scorer validation, clustered analysis, and an exact owner-approved definition before model dispatch. This research does not change the r6 claim or authorize provider spend.

## Open Questions

- Does either newly constructed MemoryAgentBench subset provide enough independent clusters and source-only eligibility for an exact paired ARE/control study at the 8K GLM setting?
- What ingestion adapter and baseline would preserve the current G03 treatment/control distinction without changing the question or scoring task?
- Which exact scorer and reliability rule will be frozen before seeing outputs, especially for open-ended and conflict-resolution answers?
- Would the owner approve a new named G03 external-validity campaign after its source and feasibility audit? No approval is inferred here.
