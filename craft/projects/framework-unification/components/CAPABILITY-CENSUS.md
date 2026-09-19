---
tags: [framework-unification, capability-census, sigils, two-axis, reuse-map, knowledge-craft-governance]
node_type: reference
is_session: false
layer: architecture
nature: explanatory
status: draft
version: 0.1.0
last_updated: 2026-06-18
created_by: rondellivladimir@gmail.com
---

# Framework Unification — Capability Census

> **What this node is.** A census of the **operating capabilities** (sigils / skills) the repo
> already ships, **mapped onto the two axes that [CONCEPT-MAP.md](../CONCEPT-MAP.md) already owns**
> (the pipeline × the three mechanisms). CONCEPT-MAP maps *stages and artifacts*; this node maps the
> *capabilities that produce and govern them*. It **cites** CONCEPT-MAP and does not restate the
> two-axis model, the node envelope, or the invariants.
>
> **Bar = utility, not novelty** ([SCOPE.md §1](../SCOPE.md)). This is a **reuse map**: a 3-skeptic
> pass (precedent / non-vacuity / definitional) confirmed the organizing model is *build-from-owned*
> (CONCEPT-MAP, locked 2026-06-16), not a discovery. The full dispatch evidence lives in
> [research/cyber-alchemy-space/capability-taxonomy/](../../../research/cyber-alchemy-space/capability-taxonomy/findings.md)
> (dispatch `2026-06-18-cyberalchemy-capability-taxonomy`).
>
> Honesty tags: **BUILT** (on disk) / **OWNED** (a skill/doc claims it) / **PROPOSED** (synthesis) /
> **OPEN** (owner must decide). Claim ≤ proof.

---

## Why a census (the hole it fills)

CONCEPT-MAP's Axis-1 table lists pipeline **stages** and the **artifact** each emits; ARTIFACTS.md
lists the artifact tiers. Neither lists the **operating capabilities** — the verbs with shipped
owners — or where each one sits on the two axes. That census is what makes "what can this system
already *do*, and what can't it?" answerable. The answer, in one line: the shipped set is a
**knowledge-governance + verification machine, not a generation machine** — `validate / distill /
ontologize / govern / route` ≈ 70% of the catalog. **BUILT** (explorer E1 verb-count).

---

## The census — capability (verb) → owners → axis position

De-duplicated: path count over-counts true capabilities ~30–40% via mirrors, aliases, and
compositions (E1). The "governed multi-agent dispatch" is **one** capability fragmented across ~7
files (`dispatch-spec` + `subagents-strategy` + `register-dispatch` + `check-tension` +
`research`/`review`/`experiment`), not seven. **BUILT.**

| Capability (verb) | Owners (BUILT/OWNED) | Axis position (per [CONCEPT-MAP §two-axes](../CONCEPT-MAP.md)) | Altitude / invariant |
|---|---|---|---|
| **Orient / interview** | scope-interview, interrogation (= structured-interview-kits), domainspec-interview-scope/kits | Axis-1 stage 0 (define entry) | — |
| **Discover / research** | research-tower, robot-talks, research(dispatch), publication-research-pipeline | Axis-1 stages 1–2 | gather the "actual" pole |
| **Define / ontologize** | ontology-vault, definitions-governance, feature-glossary, ontology-view, inventory, necronomicon | Axis-1 stages 3/5 **+** representation mechanism | I5 single-owner |
| **Design** | invoke(design), system-view, engineer-view, architecture-pattern-inventory, residuality-spec, spellcraft | Axis-1 stage 5 (+ ownership-layer, see OQ-1) | view-triad |
| **Plan / layer** | implementation-layering, invoke(plan), implementation-readiness | Axis-1 stage 4 | — |
| **Execute** | task-session, domainspec-implement (spec-bound) | Axis-1 stage 8 | — |
| **Distill** | distill, x-ray, skill-decomposer, test-derivation | Axis-1 (cross-stage) | I9 altitude-shift |
| **Reflect / evolve** | workflow-reflect, refine, sigil-development | **consumer of Observe → driver of Govern** (one loop, not a clean stage) | I9 |
| **Route / dispatch** | dispatch-spec, orchestrate, codex-goal-profile, (subagents-strategy+register-dispatch+check-tension+research/review/experiment = 1 capability) | **Axis-2 mechanism** (representation/typing routing) | router→type→form recursion |
| **Critique / tension** | check-tension, anti-bias-vector-composition, robot-talks, review, residuality-spec | **Axis-2** (epistemology mechanism) | I4 claim≤proof |
| **Validate / gate** | decision-gate, audit-alignment, experiment-harness, ux-evidence-validator, readiness (heaviest family, 12+) | **Axis-2** (epistemology mechanism) | I3/I4 gate |
| **Trace / provenance** | register-dispatch, close-session, craft, vault `## Connections` | **Axis-2** (communication mechanism) | I8 append-only |
| **Observe** | signal-observer, observability-setup, observed-invocation-loop, domainspec-emit-signals | **Axis-2** (communication mechanism) | per-run→cross-run |
| **Govern / promote** | constitution-governance, decision-gate, definitions-governance, the I-invariant set | **Axis-2** (epistemology mechanism, promotion face) — **not a peer bucket** | I5; "govern the governor" |
| **Author (text/visual)** | whisper (text), x-ray (HTML) | **second producer lifecycle** — NOT the spec/build pipeline (see OQ-1) | parallel pipeline |
| **Bridge / translate** | partial: @biz/@sys anchors, paired-views, domainspec-brownfield-translation | **Axis-2**, but **no continuous comparator** (see [CONCEPT-MAP OQ-H](../CONCEPT-MAP.md#open-questions)) | gap-detector at @biz↔@sys |

---

## How the seed "Knowledge / Craft / Governance" resolves

The user's seed buckets do **not** survive as three sibling peers — confirmed by counterexample
(define / test-catalogue / single-owner-invariant each straddle or cut across all three), and they
**collapse** onto models the repo already owns:

- **Knowledge ↔ Craft** = the producer/product split of the **one** Axis-1 pipeline (≈ BUSINESS-ONTOLOGY
  intent vs realization). Knowledge-flavored stages (Discover, Define, Distill) and Craft-flavored
  stages (Design, Plan, Execute) **alternate on one axis** — not two buckets. **OWNED.**
- **Governance** = the **promotion face of the epistemology mechanism** (Axis-2). It is a vertical that
  cuts through every artifact, **not a third peer**. **OWNED** (CONCEPT-MAP Axis-2; E4 counterexamples).
- **Emergent types** the seed couldn't place are all already owned and all map to an Axis-2 mechanism:
  interviewer→Orient stage; router→Route; observer→Observe; validator→Validate; bridge→Bridge(partial). **OWNED.**

---

## Scope note (what is excluded, and why)

- **Out of scope, no new verbs:** ~70 `gsd-*` (vendored project-management OS) and ~45 `domainspec-*`
  (DomainSpec-product-bound pipeline). **BUILT, out-of-scope.**
- **Out of scope but carry NEW verbs** (flagged so they aren't silently dropped):
  `domainspec-lean-formalization/` ships a **formal-proof + machine-verify** family — notably
  `verifying-lean-build`, a **machine-checkable** gate distinct from the assertion-level Validate
  family (and a partial owner for the [CONCEPT-MAP OQ-H](../CONCEPT-MAP.md#open-questions) comparator
  gap); `validation/poker-team/` ships a `mars-research-*` **empirical-analysis-pipeline**. If either
  is brought in scope, the census gains machine-gating / empirical-analysis verbs. **BUILT, out-of-scope.**

---

## Open Questions

Per [SCOPE.md §3](../SCOPE.md). The three *capability gaps* are promoted to CONCEPT-MAP's spine
(OQ-F/G/H); the questions below are **census-level refinements to the two-axis model itself** that
the owner should rule on.

### OQ-1. The "one pipeline" claim omits a second producer lifecycle.
**Context:** CONCEPT-MAP Axis-1 is the spec/build pipeline (`define→…→emit-signals`). But `whisper`
(text) and `x-ray` (HTML) **produce end-product artifacts** that are not pipeline intermediates — a
non-vacuity skeptic named `whisper` as the single member no Axis-1 stage nor Axis-2 mechanism can
place. **Recommendation:** decide whether to admit a **parallel end-product producer lifecycle**
alongside the spec/build pipeline, or rule end-products out of the engine's scope. **Status:** OPEN.

### OQ-2. The view-triad is an ownership-layer dimension, not pipeline stage 3b.
**Context:** CONCEPT-MAP lists `paired-views` as Axis-1 stage **3b**. The census finds ontology/
system/engineer-view are three **ownership layers** of one Define+Design+Validate act (terms /
shape+stances / verdicts), with no single Axis-1 coordinate. **Recommendation:** model an
**ownership-layer dimension** orthogonal to the pipeline (relates to [CONCEPT-MAP OQ-C](../CONCEPT-MAP.md#open-questions)
single-owner home). **Status:** OPEN.

### OQ-3. No owner arbitrates entry-point selection across overlapping front-doors.
**Context:** four vague-intent front-doors (`invoke` / `refine` / `implementation-layering` /
`distill`) and two "registry" concepts (Arcanum tool-index vs domainspec concept-index) have no
arbiter; AUTHORITY-MAP resolves which *file* wins, not which *skill* owns a mutation or which
*entry-point* to pick. **Recommendation:** assign a single owner to entry-point selection (a Route
sub-decision). **Status:** OPEN.

### OQ-4. Should "the one recurring capability" be named and owned?
**Context:** a recurrence *preserve-both-poles-and-route-the-gap-to-a-single-owner* underlies drift-
detection, claim≤proof, single-owner, and the dispatch router (= I5 + I9 + the residue thesis fused).
A definitional skeptic flagged the bare formulation as **tautological** (true of any governed
two-representation system). **Recommendation:** either reframe as a **discriminating predicate**
(e.g. "emits a residue-ledger entry" — some capabilities fail it) or leave it implicit and just cite
I5 + I9. Do **not** ship it as a discovered first principle. **Status:** OPEN.

---

## Connections

| Document | Type | Description |
|---|---|---|
| [../CONCEPT-MAP.md](../CONCEPT-MAP.md) | `derives-from` | The OWNED two-axis model + invariants this census maps capabilities onto; OQ-F/G/H hold the capability gaps. |
| [../SCOPE.md](../SCOPE.md) | `relates-to` | §1 utility-not-novelty bar; §3 the Open-Questions discipline this node obeys. |
| [ARTIFACTS.md](ARTIFACTS.md) | `relates-to` | The artifact tiers this census's capabilities produce. |
| [../../../research/cyber-alchemy-space/capability-taxonomy/findings.md](../../../research/cyber-alchemy-space/capability-taxonomy/findings.md) | `derives-from` | The cited synthesis (dispatch 2026-06-18) this census distills. |
| [../../../research/cyber-alchemy-space/capability-taxonomy/research.md](../../../research/cyber-alchemy-space/capability-taxonomy/research.md) | `cites` | Verbatim explorer + skeptic returns. |
