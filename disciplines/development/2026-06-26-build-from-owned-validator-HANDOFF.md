# Handoff: Build-From-Owned Validation Gate (precedent-sweep, deterministic)

- **Observed capability:** invoke (handoff mode) — authoring only; does not own the target lifecycle
- **Target artifact:** a **build-from-owned validation gate** — a pre-authoring check that, before any net-new definition/authority is created, searches the existing corpus for an owner the candidate coincides-with or specializes; owner route: definitions-governance + promotion-policy (the rule) + sigil-development/tools (the build); **gated by OQ-1**, **shares the SMT adapter** with the non-collapse + closure validators
- **Source session:** this session (2026-06-26) — the authority-lifecycle / cav2-schema / context-direction thread
- **Split reason:** **new lifecycle idea** (deterministic build-from-owned gate) + **research direction** rider (the context-consolidation hypothesis, below)
- **Context selection:** obligation-linked excerpts below (NOT the whole transcript)

## New-thread objective (the prompt)

Develop a way to **validate "build-from-owned" before authoring** — a gate that catches
when a candidate definition/authority **already has an owner** in the corpus, so we
**build from it (reference / generalize / instantiate) instead of creating net-new**.
Resolve its relationship to the non-collapse validator (answered below: **dual, shared
core**), then decide whether all three checks (non-collapse, closure, build-from-owned)
share one adapter.

## Why now (trigger — an honest process failure this session)

The precedent-sweep rule ("before any KILL/net-new verdict, sweep for an owner; a found
owner is **build-from-owned**, never a kill / never net-new") existed as a **habit/memory**,
not a **gate** — and it failed in real time **this session**:

- We began designing a **net-new** `context-invariant authority` definition (and earlier an
  "import-direction" concept) for the upward, cross-context promotion of domain authority to
  the apex.
- Only on a later sweep did we find the mechanism is **already owned**: `CAV2-D43` Pattern
  Promotion Lifecycle (its path literally walks `hypothesis → domain exercise → evidence →
  generalized abstraction → cross-context exercise → owner promotion → authority → invariant/
  constitution pressure`) and `CAV2-D48` Authority Promotion Lifecycle (the generalization of
  `D43`/`D46`).
- The correct verdict was **build-from-owned** (generalize D43 / extend D48 + name the gate
  property), not net-new.

A habit that only fires "sometimes, on a later sweep" is the gap. This gate makes the sweep
**mandatory and (in its core) deterministic**, run **before** definitions-governance authors a
new `CAV2-D#` or promotion-policy promotes.

## Core finding: build-from-owned is the DUAL of non-collapse (shared SMT core)

| | Non-collapse (`CAV2-D29` / sibling handoff) | **Build-from-owned (this gate)** |
|---|---|---|
| Input | TWO declared objects A, B | ONE candidate X **+ the whole corpus** |
| Query | prove **distinct**: `∃ axis. A.axis ≠ B.axis` | search for an **owner**: `∃ Y∈Corpus. ¬∃ axis(X.axis≠Y.axis)` (coincidence) **or** `Y` subsumes `X` (X adds only a narrower value on one axis) |
| Polarity | prove distinctness | search for coincidence / subsumption |
| Pass means | A,B are genuinely distinct | **no owner → genuinely net-new (author allowed)** |
| Fail means | A,B collapse (counter-witness = the pair) | **owner found → build-from (relation: duplicate \| specialization \| generalization-target)** |
| Guards against | over-splitting / false distinctness / scope trespass | redundant net-new / reinventing / under-referencing precedent |

Both reduce to **SMT queries over schema-typed records** (equality/disequality, `∃` over a
finite set; decidable EPR / finite-domain fragment). They are **two polarities of one engine** →
they **should share one adapter**, and **closure (`CAV2-D49`/`C16`) joins** as a third sibling.
This **answers** the sibling handoff's open question ("should non-collapse + closure share one
adapter?") — **yes, three siblings, one adapter.**

### Hybrid boundary (what the SMT core does NOT decide → stays review)

Same relative/absolute split as the non-collapse validator:

- **Which axes encode the candidate** = modeling judgment (owner/review). SMT decides
  coincidence *given* the encoding.
- **Semantic coincidence under different vocabulary** — "is D43's `pattern` the same kind as my
  `authority`?" — is the **semantic precedent-sweep**; stays review (embedding-assisted at best).
  SMT gives the *structural* coincidence; the *semantic* "is this really the same owner" call
  stays human/owner. (This is the build-from-owned analogue of *absolute* non-thinness.)
- **Corpus completeness** — the gate is only as good as the indexed corpus; an un-indexed owner
  is a false "net-new." Log corpus coverage; never claim "no owner" silently.

## Dependency (same as the sibling validators)

Needs the corpus **indexed as schema-typed records** — the kind-declaration `instantiates`
field + typed fields (**schema proposal `G2`**) supply the FOL vocabulary. This is **OQ-1**
("build deterministic checks only after the authority object schema stabilizes"). Build-from-owned,
non-collapse, and closure all wait on the same gate.

## Context to carry (obligation-linked)

- **Precedent-sweep rule (the law this gate enforces):** a found owner is build-from-owned,
  never a kill / never net-new. Sweep before any net-new or KILL verdict.
- **The owned precedents for the triggering case:** `CAV2-D43` (pattern promotion lifecycle,
  cross-context path), `CAV2-D48` (authority promotion lifecycle, generalizes D43/D46),
  `CAV2-D23` (authority lifecycle axis — the hypothesis→axiom strength dimension:
  maturity/evidence/commitment, "no axis silently stands in for another").
- **Sibling validator:** `disciplines/development/2026-06-23-non-collapsing-discipline-validator-HANDOFF.md`
  (the SMT/FOL approach, the relative/absolute boundary, OQ-1/`G2` gate). Reuse its encoding.
- **Schema dependency:** `ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md`
  (gaps G1–G9; `instantiates`/`G2` is the keystone).
- **Lifecycle placement:** the gate runs **inside** definitions-governance (before authoring a
  new term) and promotion-policy (before a promotion) — a pre-check, not a post-hoc audit.

## Sequenced roadmap (preserve — user's order: "after it we need to think about…")

1. **(this handoff)** Build-from-owned gate — design the deterministic precedent-search check
   (shared adapter with non-collapse + closure). → definitions-governance + sigil-development/tools.
2. **THEN — the framing/consolidation thread (research direction, do NOT pre-empt):**
   - **Epistemic-strength ladder preferred:** the user prefers framing the organizing concept as
     the **epistemic strength ladder** (the `CAV2-D23` hypothesis→…→axiom axis) rather than
     "context-invariant authority." Re-anchor the upward-promotion concept on D23's strength axis.
   - **"Context controls everything" hypothesis:** maybe `context` is the **master primitive** —
     strength (D23), import-direction (apex rule: import-up / reference-down, CAV2 = highest
     context), promotion (D43/D48), and scope (cross-context invariance) may **all reduce to
     context-relations**. Worth testing as a unifying frame.
   - **Consolidation question:** can D23 + D43/D48 + the context-import-direction principle +
     the apex model be **consolidated** under one context-centric definition, rather than kept as
     separate terms? (This is itself a build-from-owned / non-collapse exercise on our own corpus —
     dogfood the gate once it exists.)
   - **Pending input:** `CAV2-D48` body has **not been read** yet this session; reading it is the
     first step of this thread (it may already encode the cross-context-upward part — then the
     only net-new is the strength-ladder gate property + the term).

## Owner routes (so the next thread does not trespass)

| Step | Owner |
|---|---|
| build-from-owned gate rule (lifecycle placement) | definitions-governance + promotion-policy |
| the deterministic check / shared SMT adapter | sigil-development / tools (OQ-1-gated) |
| any term/definition the gate forces (e.g. the strength-ladder property) | definitions-governance |
| consolidation decision (collapse several terms into one) | definitions-governance + decision-gate |
| schema `G2` stabilization (the precondition) | ontology (NODE-MODEL amendment) + decision-gate |

## Open questions the next thread inherits (residue)

- **~~Is build-from-owned a new validator or the non-collapse test?~~ ANSWERED:** the **dual**,
  sharing the SMT coincidence core; three siblings (non-collapse, closure, build-from-owned) share
  one adapter. What stays review: semantic coincidence + corpus completeness + the encoding choice.
- Should the gate's verdict carry the **relation type** (duplicate | specialization | generalization-
  target) so the author knows *how* to build-from (reference vs generalize vs instantiate)?
- Does "context controls everything" hold up — is `context` the primitive D23/D43/D48/import-direction
  all reduce to? If yes, **consolidate**; if no, keep them orthogonal (and that orthogonality is itself
  a non-collapse claim to validate).
- Is the **epistemic-strength ladder** (D23) the right top-level frame for upward promotion, demoting
  "context-invariant authority" to a derived property on that ladder?

## Dispatch technique trace

- `frame_handoff` — frames this session's precedent-sweep failure as the next thread's input (the core).
- `owner_boundary_check` — routes each step to its owner; invoke does not own the gate/validator/consolidation lifecycles.
- `residue_ledger` — carries the epistemic-ladder preference + context-consolidation hypothesis + the unread-D48 input forward.
- `handle_handoff` — names native owner-route handles (definitions-governance, promotion-policy, sigil-development, decision-gate).
- `concrete_path_evidence` — cites the sibling handoff + schema proposal + D23/D43/D48 by path/ID.
- Full dispatch JSON: **not needed** (single capability, no subagents, no protected context).

## Distill

**Skipped** — handoff packet is narrow and locally bounded (one gate + a named residue thread);
no broad/overbuilt output to reduce.

## Recommended next route

`definitions-governance` (to place the build-from-owned gate in the define/promote lifecycle and
decide the relation-type verdict), **then** `sigil-development`/tools for the shared-adapter build
(OQ-1-gated). The framing/consolidation thread (step 2) starts by **reading `CAV2-D48`**.
