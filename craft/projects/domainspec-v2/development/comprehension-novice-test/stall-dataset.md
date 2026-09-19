---
node_type: reference
is_session: false
status: candidate
created: 2026-07-02
authored_by: task-session (SWU-A3, blind novice subagent) + parent P8 verification
arm: BASELINE (current surface)
promotion_boundary: local development. See caveats — this is a STRUCTURAL PRE-TEST, not human-comprehension proof.
---

# Stall dataset — BASELINE arm (CampusRead task)

> **Historical baseline notice (2026-07-11):** Saga observations in this
> dataset describe the pre-collapse surface. They remain evidence, not current
> authority or a future hardening route.

## ⚠️ Caveats (read before using these numbers)
1. **Agent ≠ human.** The novice was a fresh LLM agent (blind to research/findings, verified). It surfaces
   where the *surface* is structurally under-specified even for a capable reader. It is **not** evidence
   about human cognition — that is the deferred human arm (layering L2). Do not report these as "users find…".
2. **Instrument leak (self-inflicted, now fixed).** `task.md` originally carried a reviewer-only "coverage
   this task forces" block *inside the file the novice reads*. It telegraphed the Workflow-vs-Saga contrast
   and partly drove **S6**. The block has been moved to `task-coverage-audit.md`; **treatment re-runs use
   the cleaned `task.md`**. Because both arms use a byte-identical task.md, a constant leak cancels in the
   *delta*; but the absolute baseline S6 is flagged contaminated.
3. **Blindness attested clean** — the novice opened only TAXONOMY, RELATIONSHIPS, meta-types/**,
   __fixtures__/mt/**, and task.md; no research/answer files (self-reported + consistent with its trace).

## Headline (this partly FALSIFIES the model's targeting — the test did its job)
The model (M1–M4) predicted comprehension is blocked by **type discrimination** (which of 25, the 5 weak
pairs). **It is not.** The novice typed Patron/Copy/Loan/LateFee/Rule/Policy/Event/State-Machine **cleanly
from the brief signals** — no stall. The **two blockers are the EDGE MODEL**, which M1–M4 do not touch:
- **S3** — no Entity→Entity association edge exists (foreign keys unmodelable). *[P8-VERIFIED on disk]*
- **S5** — Saga participates in zero of the 29 edges (orphaned). *[P8-VERIFIED on disk]*
- **S4** — the per-type card `edge_participation` contradicts RELATIONSHIPS.md (a real data bug). *[P8-VERIFIED]*

⇒ **Reroute:** the dominant comprehension blockers belong to **R3 edge-law formalization**
(`development/reformulate-batch1/` — the other open work), NOT the comprehension model. Within the model's
own scope, **M4 (target-state) is validated as the top stall; M3 (upgrade 5 weak fixtures) drops in
priority** (the novice did not stall on those types).

## Ranked stalls (severity → then edge/theme cluster), with verified verdict + route
| rank | id | class | sev | verified? | what the SURFACE lacks | route |
| --- | --- | --- | --- | --- | --- |
| 1 | **S3** | edge | blocker | ✅ disk | no Entity→Entity association/reference edge (only performs/contains/emits leave an Entity) | **R3** (add association edge-law) |
| 2 | **S5** | edge | blocker | ✅ disk | Saga is neither source nor target of any of the 29 edges | **R3** (Saga edge signature) |
| 3 | **S4** | edge | friction | ✅ disk | Operation card `source_of:[performs,emits,produces-for]` contradicts the edge table (performs/emits are Entity-sourced; `produces` omitted) | **R3 + M2 prerequisite** (reconcile cards ↔ RELATIONSHIPS before surfacing cards) |
| 4 | **S8** | target-state | friction | ✅ (no target-state type/template exists) | "target-state" has no meta-type, template, or definition anywhere | **M4** ✓ validated |
| 5 | **S6** | vocabulary | friction | ⚠ partial (leak) | "feature"/"bounded context" (the Workflow↔Saga axis) is never defined | **M1** (define the term) |
| 6 | **S1** | selection | friction | plausible | no concept-individuation rule (where one concept ends / operation granularity) | **M1** (new sub-item) |
| 7 | **S2** | discrimination | friction | plausible (see S10) | Entity-vs-VO criterion is structural; presupposes the business identity fact already decided | **M2** (bounded by S10) |
| 8 | **S10** | discrimination(meta) | friction | ✅ (surface says "validates shape, not meaning") | discriminators are declared attributes; the surface can't tell you which side a business fact falls on | **LIMIT on M2/M3** (not fixable by them) |
| 9 | **S7** | edge | cosmetic | plausible | `produces`(Op→Event) vs `emits`(Entity→Event) both fit "notify"; no rule to choose the source | **R3** |
| 10 | **S9** | selection | cosmetic | plausible | option-lists → Enum is clean, but elevating them to concepts was the novice's call | **M1** (minor) |

`stalls: 10 (blocker=2, friction=6, cosmetic=2)` · edge-cluster=4, model-scope=6.

## Stall → work map (the prioritization output — Package B L0 / SWU-B0 consumes this)
| Theme | Stalls | Owner | Priority signal |
| --- | --- | --- | --- |
| **Edge model** (associations, Saga, card↔RELATIONSHIPS consistency) | S3, S5, S4, S7 | **R3 edge-law** (outside this model) | **HIGHEST** — both blockers live here |
| **Target-state** | S8 | **M4** | HIGH — top in-scope stall; M4 confirmed needed |
| **Vocabulary / individuation** | S6, S1, S9 | **M1** | MEDIUM — add "feature/bounded-context" def + individuation guidance |
| **Type discrimination** | S2, S10 | **M2** (M3 de-prioritized) | LOW — novice rarely stalled here; S10 caps the payoff |

## Consequence for Package B move order (feeds SWU-B0)
1. **M4 first** (target-state) — the highest in-scope stall.
2. **M1 next**, expanded: it must also **define "feature/bounded context"** (S6) and give an **individuation
   cue** (S1), not only tier the 25.
3. **M2** — reconcile the card `edge_participation` with RELATIONSHIPS.md (S4) BEFORE surfacing cards, else
   we teach wrong edges; then surface the crossed pairs. Value is **capped by S10** (examples show the axis,
   not which side a business concept lands on).
4. **M3** — **de-prioritized**: the novice did not stall on the 5 weak types' discrimination.
5. **Reroute the two blockers to R3** — the largest comprehension win is the edge model, not this model.

## P8 verification log
- S3: `RELATIONSHIPS.md` canonical table (lines 13–27) — only Entity-sourced edges are performs/contains/emits; no Entity→Entity. **CONFIRMED.**
- S5: `grep -i saga RELATIONSHIPS.md` → empty. **CONFIRMED.**
- S4: `operation.schema.yml:22` `source_of:[performs,emits,produces-for]` vs `RELATIONSHIPS.md:13,27` (performs/emits Entity-sourced) + `produces` omitted. **CONFIRMED — real inconsistency.**
- S8: no target-state meta-type in `TAXONOMY.md`; no template in surface. **CONFIRMED.**
- S6: partial — the leak in task.md contributed; kept with caveat.
