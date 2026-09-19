# Advocate Brief — The DomainSpec Language Is Load-Bearing For The Categorical Verification Pipeline

Role: `language-fit-advocate` (Arcanum refine dialectic, s3-interrogation).
Stance: argue the STRONGEST honest case that the DomainSpec LANGUAGE is
load-bearing for the categorical verification pipeline. Read-only. Evidence-bound
— every claim cites a source; no overclaiming (Craft honesty boundary).

Sources read:

- `research/DESIGN-PACKAGE.md` (the language: 5 doc kinds, 9-field envelope,
  contract↔schema refs, obligations w/ `obligation_id`, anti-collapse invariants,
  iteration, lifecycle, validation authority).
- `development/refinement-runs/2026-06-08-lean-functor-validation/RESULT.md` (the
  σ-quiver / fdm pipeline state: Stage A ~80% built, P3/P4 stubs, residue governs
  nothing yet, B-1 shared precondition).
- `.../s5-distill/CATEGORICAL-MODEL-DECISION.md` (DEC-CAT-01: `presheaf-lan` target,
  `fdm` core).
- `.../s6-invoke-design/DESIGN.md` (the pipeline diagram and residue model).
- `arcanum/.agents/skills/craft/CRAFT-INITIAL-DEFINITION.md` (schema/data/functor
  frame — the language is the "schema" side).

---

## Argument 1 — The functor needs a TARGET, and the language IS it

Craft's spine is `Intent → chosen schema → functor-like translator → data → residue`
(CRAFT-INITIAL-DEFINITION §"Initial Formal Model": `C = (I, S, F, E, D, R, G, V)`,
where `S` is "the chosen schema" and `F` "maps schema to data while attempting to
preserve structure"). The verification pipeline is the Craft functor run **in
validation direction**: LLM codegen is the lossy schema→data step (DESIGN.md
"LLM codegen (PCRA, lossy — Craft schema→data)"), and the validator's job is `V`:
"compare data back to schema and measure residue" (CRAFT §"Validate").

A functor `F: C → S` is meaningless without its codomain `S`. In the pipeline, the
recovered Spec is graded **against the σ-quiver schema category** — "the spec
σ-quiver as the schema category; the deterministic translator's output as the
instance" (CATEGORICAL-MODEL-DECISION). But that σ-quiver is not self-justifying:
its objects are `Meta` and its arrows `EdgeRow` typed by `sigmaValid`, and per
DESIGN.md Stage B those metas/edges come from "identity rename of `TAXONOMY.md` /
`RELATIONSHIPS.md` labels" and "composability rules used only as the `sigmaValid`
admissibility filter." Concepts, relations, and composability rules are exactly
what the DomainSpec language exists to author and govern (DESIGN-PACKAGE §2 `schema`
kind = "fields/types/enums/refs"; §4 contract↔schema). **Strip the language and
there is no principled source for the target category — only a hand-built σ-table.**
The language is the schema side `S` of Craft's frame; without it, `F` has no
codomain to validate code against.

## Argument 2 — The CONTRACT layer is what lifts P3 from stub to real

The pipeline's most-cited gap is obligation validation. RESULT.md (core finding 1)
records "P3/P4 are stubs"; DESIGN.md confirms "P3/P4 are pass-stubs and excluded
from the floor." RESULT.md B-1 states the shared precondition exactly:

> "contract obligations need `obligation_id`s before P3 (per-meta obligations) can
> be real. Shared precondition."

That `obligation_id` is **a DomainSpec language construct**, not a Lean construct.
DESIGN-PACKAGE §3 makes `contract.obligations[]` "each with an `obligation_id`" a
per-kind required field; §4 specifies the symmetric reference
`schema.satisfies: [obligation_id]` and the anti-collapse invariant "every
block-level schema rule must trace to a contract `obligation_id` and vice versa";
B-1 there is identical to RESULT.md's B-1 ("contract invariants are unlabeled prose;
they must become addressable `obligation_id`s"). So the obligation table the σ-model
needs to make P3 a real per-meta check is **precisely the table the language's
contract layer supplies.** The language is not decoration around the validator —
it is the artifact that produces the predicate set P3 grades over.

## Argument 3 — Iteration + lifecycle supply the governed residue Stage B needs

Craft's discipline is "acceptable, named, governed residue" (CRAFT Loop 2
correction; §"Honesty Boundary": every run must answer "What residue remained? What
validation showed it? What route follows?"). The pipeline's load-bearing honesty
result is that today residue "governs nothing" — "P4 is a `.pass` stub; provenance
is hardcoded `.declared`" (RESULT.md core finding 4; DESIGN.md residue model point 2).
Making residue **govern** requires a place to record it as named, version-pinned,
owner-routed state across runs. That recording surface is the language's iteration +
lifecycle layer: DESIGN-PACKAGE §5 `iteration` carries `changed_artifact`,
`prev_state`, `next_state`, `validations_run` (receipt-shaped: producer / status /
validation_result / residue), `blockers_delta`; §8.4 makes "gaps/blockers/decisions
typed rows whose status mechanically drives the state machine (an open `block` ⟹
`blocked`)." This is exactly the PCRA "decision: absorb, split, route, or promote"
step (CRAFT §"Initial Formal Model") expressed as governed, replayable artifacts —
the missing home for the residue sidecars Wave A must populate (RESULT.md work pack).

## Argument 4 — Generality (`use_case`) is what makes ONE validator serve many routes

A validator bound to one hand-written σ-table validates one spec. The language's
`use_case` kind (DESIGN-PACKAGE §2: "Binding from a generic contract to a concrete
project/route/sigil"; §3 fields `binds_contract` / `binds_schemas[]` /
`project/route/sigil`) is the mechanism that "keeps the language generic while
letting Craft bind in." The boundary section (§1) is explicit: "The same language
must serve dispatch-spec routes, invoke handoffs, refine seeds, task-session work
packs, sigil/spell contracts." The pipeline already demonstrates this in miniature:
the smallest validateable surface "runs unchanged against both a Craft example and
the dispatch JSON-Schema" (DESIGN-PACKAGE §7, satisfying the handoff's Craft +
non-Craft fixture requirement). So the same categorical machinery (`gradeFor` over a
σ-quiver) can target any contract/schema pair the language emits — the language is
what makes the verification pipeline a **reusable** instrument rather than a
one-spec demo.

## Argument 5 — Strongest single argument + the one decisive piece of evidence

**Strongest argument: the obligation table (Argument 2).** It is the place where
"language is load-bearing" stops being analogy and becomes a falsifiable
dependency. The whole verification ambition is to check semantic obligations, not
just graph shape — and the pipeline's own design says P3 cannot become real until
addressable `obligation_id`s exist.

**The single most decisive evidence: RESULT.md B-1** —

> "contract obligations need `obligation_id`s before P3 (per-meta obligations) can
> be real. Shared precondition."

The verification team's own refine run names a **language artifact** (`obligation_id`,
defined in DESIGN-PACKAGE §3/§4) as the **blocking precondition** for the
validator's per-meta obligation check. That is the verification pipeline citing the
language as load-bearing in its own words — not the advocate's framing.

---

## The bridge (the ONE condition that must hold for this case to be true)

**The language's obligations must be authored as addressable, machine-resolvable
predicates that the σ-model can index per `Meta`/`EdgeType`, AND the σ-table the
validator grades over must actually be *derived from* DomainSpec
contract/schema/taxonomy artifacts (not hand-maintained in parallel).** If
obligations stay prose (DESIGN-PACKAGE R-1: "`validation_rules` are natural-language
prose, not executable predicates") or if the σ-table and the language documents
drift apart, the language degrades from load-bearing to merely adjacent
documentation. Load-bearing holds **only on the build path where the language is the
source the translator reads from.**

## Honest concession (what is NOT yet in place)

- **The `obligation_id` layer does not exist yet.** B-1 is an *open* blocker in both
  DESIGN-PACKAGE (§10 B-1) and RESULT.md. Today obligations are "unlabeled prose."
  So at this instant the language is load-bearing **by design and by stated
  dependency, not yet by running wire.**
- **The translator T that would read language artifacts is net-new.** RESULT.md core
  finding 3: "No code→Spec translator exists in this tree." The current σ-table is
  hand-built; the language→σ derivation is designed, not implemented.
- **No semantic (Layer B) obligation validation is mechanized.** R-1 / DESIGN.md
  "Decidability line": P3 is a pass-stub; commutativity is "undecidable in general"
  and "there are no path equations in the `Spec` record today." The language *can*
  supply the obligation table, but the validator cannot yet *execute* it.
- **Syntax strategy is unratified** (DESIGN-PACKAGE OD-1, provisional Option D), so
  even the language's surface form is not frozen.

I do not claim the language is currently wired into a running functor check. I claim
it is the designated and dependency-named target/obligation source, and that the
verification pipeline's own blocker B-1 makes that dependency explicit and
falsifiable.
