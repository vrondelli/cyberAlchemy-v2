# G03 LongMemEval-V2 question-only query planner r30–r32, 2026-10-06

Status: **exposed-development retrieval study; query syntax passed, candidate relevance did not; no reader/judge campaign or superiority claim**. This follows the [r22–r29 source-reach diagnostics](G03-LME-V2-SOURCE-REACH-AND-MENU-R22-R29-2026-10-06.md). The 140-question confirmation partition remains closed.

## Frozen query generation

The [r30 wire builder](../research/g03-beam-r1/build-lme-v2-query-plan-r30.py) projected only the question text and optional question image from each of the 26 already exposed second-development cases. It omitted answer, evaluator, question-type metadata, and all confirmation questions. Private `QUERY-PLAN-WIRES-R30.json` SHA-256: `f57e18ac2354bd6e346d7e39bfb41eea162da1784864495692253c6a7d20407d`.

The [r30 zero-retry GLM runner](../research/g03-beam-r1/run-lme-v2-query-plan-r30.mjs) requested 1–4 target UI-surface queries, an optional before/after event query, an optional procedure/premise-note query, and an answer-operation hint. All **26/26** 8K tokenizer admissions and **26/26** provider responses were valid. Private cold-copy `g03-lme-v2-query-plan-run-r30/RESULT.json` SHA-256: `1b85a95e003095edb519999421ebe57e2b24e29f0483375a8a9d82c1a97bf28c`.

The [r31 receipt and strict-JSON audit](../research/g03-beam-r1/audit-lme-v2-query-plan-r31.py) admitted **26/26** objects with the frozen schema and no automatic retry. Private `AUDIT-R31.json` SHA-256: `2858847de885f823518f0f5d0b04c72926f36b0ca0d4d0279ab0549491caa8bd`. This proves only syntactic fitness. Some generated note queries contain **speculative conclusions** not warranted by question text alone. They are untrusted search hints, never answer evidence or facts to show the reader. The audit's literal answer-text filter did not catch every speculative note; do not treat its 26/26 admission as a semantic safety or correctness certification.

## Source-only retrieval screen

The [r32 screen](../research/g03-beam-r1/screen-lme-v2-query-retrieval-r32.py) applied raw-state and event-query hints to the pinned 200-trajectory, site-scoped state index, keeping each question's small-tier haystack. It read no gold or evaluator fields. Private `QUERY-RETRIEVAL-SCREEN-R32.json` SHA-256: `deaafa991998be12d6eec3536361c0eda2f6a20c14c4cddea8f317e740bf95eb`. All 26 questions gained at least one top-five state not selected by r18; there were 256 distinct new top-state placements in total. **Novelty is not answer reach or precision.** Many FTS searches reached their 1,500-candidate cap.

The relevance screen failed on known source-witness cases. For the Loaner Laptop question, the first raw-state query still ranked another product's Order Status page first, despite the correct entity→Order Status continuation being present in trajectory `013696c4` states 44→45. For the forum sort-dropdown question, the first raw-state and event queries ranked a `Create new forum` page ahead of observed expanded sort-menu states. The query planner names reasonable targets, but the reused single-state OR-term ranker cannot enforce an entity/page/action **relation** or preserve a complete control region. The exact r30/r32 candidate therefore does **not** advance to reader or judge calls.

## Next gate

Implement a source-only relation-aware selector on exposed questions: bind named entities to the same trajectory as their asked destination; bind action labels to observed pre/post states; require the target page or expanded control, not merely shared keywords; render its whole bounded UI region; and keep raw query text out of reader evidence. Define source-relevance checks and a budget before model spend. If this yields broad answer-bearing reach rather than one-item repairs, freeze the complete reader candidate and evaluate on a **new** independent reserve cohort. The failed r18 14/26 threshold remains failed; do not open the 140-question confirmation partition to rescue it.

## Open Questions

- How often can an entity/page/action relation be resolved in the text trajectories without screenshots?
- Which question types need generated memory notes, and how can those notes be tied to exact source states rather than model speculation?
- What source-relevance threshold on the exposed 54 questions would justify another matched-GLM reader campaign and then a fresh holdout?
