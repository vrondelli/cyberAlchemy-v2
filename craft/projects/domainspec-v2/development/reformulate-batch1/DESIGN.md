---
node_type: design
is_session: false
status: candidate
created: 2026-07-01
authored_by: invoke (mode: design)
work_pack: ./WORK-PACK.md
layering: ./implementation-layering.md
target_artifact: projects/domainspec-v2/impl/spec (6 Batch-1 REFORMULATE docs)
before_state_read: impl/spec/{AXIOMS,CONSTITUTION,DRIFT-CONVERGENCE,TAXONOMY,RELATIONSHIPS,TEST-PIPELINE}.md (verbatim v1)
governance_model: authority/AUTHORITY-MODEL.md (validation / layering / drift + μF/νF chain)
---

# Reformulate Batch-1 Spec Docs — Design

The **what-it-becomes** upstream of [WORK-PACK.md](./WORK-PACK.md). The work-pack says *how to execute +
validate*; this says *what the reformulated docs must BE* — so acceptance is "matches the target-result
below", not just "validator green" (which only proves well-formedness).

## 0. The core shift (why this is reformulation, not a path fix)

The v1 docs are organized around a **signal-emission + observer + Saturn-L-system** governance model:
AXIOMS A3–A6 (computable governance, observer independence, shift-left, feedback budget) and CONSTITUTION
C3/C4/C8/C9/C10/C11 (signal schema, dual observer, deterministic detectors, telemetry bundles, pruning,
M-001..M-006). v2 re-organizes **the same underlying material** around the **three ratified governances**
(`validation` / `layering` / `drift`) + the credibility meta + the μF/νF chain, with the engine as the
validation *method* and its δ-rules private.

So each doc is **re-homed to a governance owner**, de-duplicated against the credibility constitution, and
boundary-corrected — not rewritten from scratch. Nothing invents new domain content; the reformulation
moves existing content under the correct owner and makes the governance method runnable.

## 0.5 Spec-homing decision — `DEC-DSV2-SPEC-HOMING` (2026-07-06 dialectic synthesis)

A proposal to *"remove all `impl/spec/*.md` and consume everything from root"* was stress-tested by dialectic
and **refined, not adopted literally**. Investigation: only 2 of the 6 top-level docs (TAXONOMY,
RELATIONSHIPS) are machine-consumed (by `validate-code-tags`); the engine reads none of them; AXIOMS / DRIFT
/ TEST-PIPELINE have no root home and no consumer.

**The invariant (what actually governs):**

> Root `definitions/` is the sole **authored** authority. There are **no hand-authored projections** — any
> `impl/spec` view is **generated from root and CI-verified, or it does not exist**. Governance prose routes
> to its **owner surface**, not to "root."

This removes the projection-drift failure mode that caused the R3A orphan (a hand-authored, unverified
projection) **without** collapsing the two-plane boundary (`DEF-DSV2-TWO-PLANE`) or category-erroring prose
into `definitions/` (a proposition is not a term — orthogonality `domainspec-v2-D3` / CAV2-D22).

**Per-doc verdict (re-scopes the SWUs below):**

| Doc | SWU | Verdict | Home |
| --- | --- | --- | --- |
| RELATIONSHIPS.md | R0/R3 | **Delete projection; consume root** | `definitions/relationships/relationships.yml` (exists) |
| TAXONOMY.md | R2 | **Migrate UI-11 → root, then delete/generate** | `definitions/meta-types/meta-types.yml` (backend today) |
| CONSTITUTION.md | R6a/R6b | **Route to owner** | `authority/constitutions/` (already the plan) |
| AXIOMS.md | R1 | **Route to owner (basis), NOT `definitions/`** | `authority/` |
| DRIFT-CONVERGENCE.md | R5 | **Route to owner** | drift-governance home (generated view optional) |
| TEST-PIPELINE.md | R4 | **STAYS contract-plane** | near `impl/` — two-plane rule protects it |

The un-regretted first move under every branch is **RELATIONSHIPS** (delete + consume root = R0). See
`refreshes/2026-07-06-spec-homing-synthesis/`.

## 1. Architecture — target spec surface + governance binding

**Re-homing map (the spine):**

| Doc | v1 frame | v2 owner | Becomes |
| --- | --- | --- | --- |
| `TAXONOMY.md` | 25 meta-concepts + layer appendix | **layering** | The concept-type set + **layer-membership** feeding the layer-law; the type set `validate-code-tags` checks |
| `RELATIONSHIPS.md` | 29 allowed typed edges + registry | **layering** (law) + **validation** (check via C11) | The **edge-law**: allowed edges *plus the forbidden set made unconstructible* + endpoint signatures |
| `AXIOMS.md` | A1–A6 (signal/observer epistemics) | base + **layering** (A2) | A1→validation(derivation), A2→layering(adapter line), A3→"methods must be runnable", A4/A5/A6→drift |
| `TEST-PIPELINE.md` | doc-section→test-type rules | **validation** | The deterministic **derivation contract** (spec→obligations); the engine realizes it — **contract only, δ-rules private** |
| `DRIFT-CONVERGENCE.md` | 5 surfaces + Saturn | **drift** | The 5 drift surfaces + convergence-as-trend (C7) + Saturn-as-actuator; reconciled with the AUTHORITY-MODEL surfaces |
| `CONSTITUTION.md` | C1–C11 signal/observer rules | distributed | Each v1 C-rule → validation/layering/drift **or DROP**; this is the OQ-2 crosswalk |

**Composition (target v2 validation surface):** AXIOMS (foundation) → TAXONOMY+RELATIONSHIPS (layering:
what exists + what may connect) → TEST-PIPELINE (validation: what obligations derive) + DRIFT (drift: how
divergence is observed over time) → CONSTITUTION (the rules, distributed to the 3 governances). The engine
consumes TAXONOMY/RELATIONSHIPS + the feature packs; the validators (`validate-code-tags`,
`validate-relationships`, engine `lint`) enforce the layering + validation surfaces at build time.

**v1→v2 shift per governance:**
- **Layering** absorbs TAXONOMY + RELATIONSHIPS + A2. New: the **forbidden-edge law** (v1 only enumerates
  allowed edges; C6 requires forbidden edges to be *unconstructible*).
- **Validation** absorbs TEST-PIPELINE + A1. Boundary: documents the derivation *contract*, never the
  `src/rules` δ-algorithm (moat). The LLM test-generator is DROPPED (manifest).
- **Drift** absorbs DRIFT-CONVERGENCE + A4/A5/A6. Saturn = actuator, not authority (already v1-aligned).

## 2. Definitions ledger (what we reformulate) → `definitions-governance`

Load-bearing term sets each doc owns, tagged by reformulation action:

| Term set | Home doc | Action | Note |
| --- | --- | --- | --- |
| 25 meta-concepts (14 backend + 11 UI) | TAXONOMY | **reused** (verify each has a tracked ID) | UI-11 scope is a decision (§4-D2) |
| 29 typed edges (15+8+6) | RELATIONSHIPS | **reused + extended** | add forbidden-edge law + endpoint types |
| layer set + layer-dependency rule | TAXONOMY appendix | **reframed** → the layer-law (C6) | promote appendix rule to normative |
| A1–A6 axioms | AXIOMS | **reframed** → governance-bound | re-map "Governs: C*" to v2 owners |
| 5 drift surfaces + convergence | DRIFT | **reframed + reconciled** | reconcile with AUTHORITY-MODEL 5 (§4-D1) |
| v1 C1–C11 governance rules | CONSTITUTION | **crosswalked / dropped** | signal/observer rules → drift or DROP |
| obligation classes (transition/rule/calc/…) | TEST-PIPELINE | **reused** (contract only) | names, not the δ-algorithm |

Every term that survives must resolve to a tracked definition ID (credibility C(meta-4)); terms first cited
without one become `candidate` definitions via `definitions-governance`.

## 3. Per-doc target-result (before → after + semantic acceptance)

> **State update 2026-07-06 (post-R3A re-triage).** R3 is done + green; **R1 and R2 substantially match
> their target-results on disk** (verify-and-close, not author); **R7 is substantially delivered** via the
> `meta-type-definitions` cycle (DS-D1/DS-D2/DS-D8 in root `definitions/`). R4/R5/R6a remain genuine v1→v2
> reformulation. A repair pre-req (R0) precedes them — see `refreshes/2026-07-06-batch1-post-r3a-retriage/`.

**R1 · AXIOMS** — *before:* A1–A6 each "Governs: C{n} in CONSTITUTION" (v1 signal/observer rules).
*after:* each axiom re-maps its "Governs" to a v2 governance owner (A1→validation, A2→layering/C6,
A3→runnable-method principle, A4/A5/A6→drift); the namespace note is folded in. *Semantic acceptance:* no
axiom points at a dropped v1 rule; A2 explicitly names the adapter-line = layering C6.

**R2 · TAXONOMY** — *before:* 25 concepts + a "Functional Style" layer appendix (non-normative).
*after:* concept-type set bound to layering; the **Layer Dependency Rule** promoted from appendix to the
normative layer-law; each concept carries its layer. *Semantic acceptance:* every concept type is one
`validate-code-tags` accepts; layer assignment ≠ dependency verdict (C6 wording preserved).

**R3 · RELATIONSHIPS** — *before:* 29 **allowed** edges + registry format. *after:* root relationship
authority lives in `definitions/relationships/relationships.yml` (machine) with
`definitions/relationships/relationships.md` (human); `impl/spec/RELATIONSHIPS.md` is an implementation
projection only. The authority states endpoint type signatures, generated views, deprecated aliases, and
deferred candidates. *Semantic acceptance:* `validate-relationships` reads the root authority by default and
passes at the reconciled active signature count (`canonicalSignatures=31`); a forbidden endpoint pair in a
fixture is rejected as *unconstructible*, not merely flagged (C6); C11 named as the check side. Catalog
coverage is handled by widening `queries` to `Behavioral -> Entity` and keeping `produces-for` for
`Operation -> Entity`; `Operation -> ValueObject` returns and the Event payload+publisher composite remain
deferred candidates rather than active canonical relationships.

**R3 edge-law admissibility (build-from-owned — CAV2-D22 / D29 / D16).** An edge type is admissible only
if it adds a distinction *not silently redundant* with an existing axis (**CAV2-D22 orthogonal
classification**); the concept-type / relation-kind / composition-shape / feature-boundary axes stay
independent unless an explicit typed coupling relates them (**CAV2-D29 axis orthogonality** →
**CAV2-D16 typed coupling**). Operational test: **an edge earns its own type iff it composes into
different code.** Rulings: (a) `enforces` vs `applies` — **keep** (guard-vs-select is different code);
(b) `enforces-cross` — **collapse/deprecate** into `enforces` plus cross-feature metadata (same code path,
D16); (c) `queries` for `Calculation→Policy` — **reject** (redundant with `applies`; D22/D29); (d)
`applies : Policy → {Operation, Calculation}` — **widen** (endpoint generalization, no new label); (e)
`owned-by` — generated inverse view for `owns`, not an authored canonical edge. Scope:
governance/classification orthogonality only — **not** Lean/Hilbert projector orthogonality (excluded from
cav2 authority). Recorded: `DEC-DSV2-EDGE-ADMISSIBILITY` in the v2 Craft ledger.

**R4 · TEST-PIPELINE** — *before:* doc-section→test-type rules + a payment example + `@source` traceability.
*after:* the deterministic **derivation contract** (which obligation classes derive from which spec
constructs) bound to validation (C5 from-spec, C10 completeness). *Semantic acceptance:* a reader can
predict the engine's obligation **classes** from the doc **without** seeing `src/rules`; **no δ-algorithm
detail present** (moat); the DROPPED LLM generator is not referenced as live.

**R5 · DRIFT-CONVERGENCE** — *before:* 5 surfaces (build-time / runtime / governance / tuning / closure)
citing v1 files (OBSERVABILITY, GOVERNANCE-SIGNALS, TUNING-LOOP, ADLC-ALIGNMENT, SATURN-L-SYSTEM).
*after:* 5 surfaces **reconciled** with the AUTHORITY-MODEL's (semantic / contract / runtime / governance /
coordination), bound to drift (C7), convergence = evidence-backed trend, write-authority proviso stated,
Saturn = actuator. *Semantic acceptance:* the surface set matches the AUTHORITY-MODEL (or the mismatch is
explicitly resolved per §4-D1); every cited doc resolves in v2 or is marked Batch-3/dropped.

**R6a · CONSTITUTION** — *before:* C1–C11 (signal/observer/pruning rules) mapped A{n}→C{n}→L6 gate.
*after:* a **v1→v2 crosswalk table**: each v1 C-rule → a v2 governance rule (validation/layering/drift) or
**DROP** with reason (e.g. C3/C8 signal-schema, C9 telemetry, C11 M-metrics likely → drift or DROP; C1→
validation; C2/C7→layering). *Semantic acceptance:* every v1 rule accounted for; no rule silently lost; no
overlap with the credibility constitution's rules; OQ-2 crosswalk closed. *(R6b then executes the
credibility-constitution per-governance split.)*

**R7 · DEFINITIONS (net-new — the migration's omission).** *before:* v1 had **no**
root v2 domain-vocabulary read model — the domain vocabulary lived under
`research/projects/domainspec/definitions/`, and the 6-doc Batch-1 set copied none of it (a real gap:
TAXONOMY/RELATIONSHIPS *use* meta-types + verbs with no definitions home). *after:* root
`definitions/DEFINITIONS.md` and `definitions/DEFINITIONS-INDEX.md` aggregate **DS-D1 meta-types**
(the 25 TAXONOMY types, from R2), **DS-D2 edge verbs** (the RELATIONSHIPS edges, from R3), and **DS-D8
relationship signatures** into typed definitions with stable IDs, and serve as the
**concept-registry-aggregation** home
(`definitions-governance` M2-C1). *Semantic acceptance:* every meta-type/verb TAXONOMY/RELATIONSHIPS use
resolves to a `DS-D*` definition (3-voice: formal + plain + domain-context); the concept-registry
aggregation can read it. **Owner:** `definitions-governance` — distinct from the governance/synthesis vocabulary
`domainspec-v2-D*` already stood up in `definitions/DEFINITIONS.md`. **Depends:** R2 + R3.

## 4. Design decisions surfaced (NOT decided here)

- **D1 — Drift-surface reconciliation.** DRIFT-CONVERGENCE.md's 5 surfaces (build-time/runtime/governance/
  tuning/closure) ≠ AUTHORITY-MODEL's 5 (semantic/contract/runtime/governance/coordination). Which is
  canonical? *Recommend:* AUTHORITY-MODEL is canonical (it's the ratified model); map the doc's surfaces
  onto it. **Owner decision.**
- **D2 — UI scope.** Keep the full 25 meta-concepts (incl. UI-11) as the v2 governance surface now, or
  scope the initial reformulation to backend-14 and defer UI? *Recommend:* keep 25 (they're already there +
  validated), but only backend needs the engine derivation. **Owner decision.**
- **D3 — v1-only file references.** DRIFT/CONSTITUTION cite OBSERVABILITY.md, GOVERNANCE-SIGNALS.md,
  TUNING-LOOP.md, SATURN-L-SYSTEM.md, ADLC-ALIGNMENT.md — none imported to v2 yet (ADLC is Batch-3; others
  may be drop/stub). *Recommend:* repoint to Batch-3 targets or mark "planned", don't leave dangling links
  (C9 link integrity would block).
- **D4 — Forbidden-edge law form.** **Resolved by R3A.** The root relationship authority is a typed
  endpoint-signature set with generated/deprecated/deferred sections; `validate-relationships` computes
  admissibility from that authority and reports nonmatching endpoint pairs as `unconstructible-edge`.
  **Consequence (2026-07-06):** the authority now has **two readers** — `validate-relationships` reads the
  root machine file (green); the Batch-2 code-tag composability validator still reads
  `impl/spec/RELATIONSHIPS.md` and must be repointed at the root authority (**R0** /
  `GAP-DSV2-COMPOSABILITY-ENFORCE`) before `tags:test` is green again.

## 5. Design → plan handoff

Each work-pack SWU's acceptance gains a **"matches §3 target-result"** gate on top of its validator. The 4
decisions above are **pre-execution blockers for their specific SWU** while open (D1→R5, D2→R2,
D3→R5/R6a; D4 is closed by R3A). Distill verdict for the design: **flag** (usable; open decisions named
with owners + recommendations; D4 closed).
