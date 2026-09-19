# Refine Seed Proposal — Lean Functor Validation For DomainSpec

- Run id: `2026-06-08-lean-functor-validation`
- Owner: refine
- Preset: `deep`
- Research mode: `bounded-research` (operator requested online research)
- Status: seed (pre-permission)

## Target

The DomainSpec Language design (`projects/domainspec-language/`, with its prior
research package `research/DESIGN-PACKAGE.md`) **connected to** the existing
machine-checked validator at
`implementation/domainspec/internal_tools/lean-code-validator/`.

This run does not treat the two as separate projects. The refinement target is
the _bridge_: making the DomainSpec language the thing a Lean validator can
mathematically reason about, in two stages.

## Operator Intent (raw)

> The intent of the language is to create lean validators so we can
> mathematically (using category theory) prove that first the spec is correct,
> and then the code produced by the LLM as a functor (per
> `CRAFT-INITIAL-DEFINITION.md`), using a deterministic translator for produced
> code (architecture patterns, tags, composability rules, and other data)
> translated to DomainSpec language, then validate it using Lean.
> `LeanCodeValidator.lean` likely already has some of this logic. Research other
> files inside `implementation/domainspec/`. Do online research. Use all
> subagent strategies.

## Refinement Objective

Produce a **refined, non-executed design + MVP-ready plan** for a two-stage
categorical verification pipeline:

- **Stage A — Spec correctness.** Prove a DomainSpec spec is _well-formed and
  internally correct_ in Lean. Evidence shows this partly exists: the validator
  encodes a σ-signature `sigmaValid : Profile → EdgeType → Meta → Meta → Bool`
  (Sigma.lean), makes σ-typing free-by-construction via `EdgeRow.wellTyped`
  (Theorem 1, `all_edges_well_typed`), and grades P1 closure / P5 acyclicity as
  real, with P3/P4 stubbed (Report.lean, README, PLAN.md).
- **Stage B — Code as functor.** Treat LLM-produced code as the _data_ side of
  Craft's schema→data translation, i.e. a functor-like map from the spec
  category to the implementation. A **deterministic translator** lifts produced
  code — using architecture patterns (`ARCHITECTURE-PATTERN-LIBRARY.md`),
  DomainSpec source tags (`domainspec-tag-code`), composability/relationship
  rules (`RELATIONSHIPS.md`, `TAXONOMY.md`), and graph data (GitNexus) — back
  into the DomainSpec language, where Lean checks structure-preservation
  (functoriality) and surfaces residue, honoring Craft's PCRA "acceptable,
  named, governed residue" boundary rather than claiming full faithfulness.

The deliverable is the refined design, the categorical model decision, the
translator design, the validation strategy, open decisions/blockers, and **one
implementation work pack** — no parser/prover code written in this run.

## Source Context (evidence baseline)

Local-canonical:

- `projects/domainspec-language/research/DESIGN-PACKAGE.md` + `research/lanes/*`
  (prior contract/schema/iteration language design).
- `implementation/domainspec/internal_tools/lean-code-validator/` —
  `README.md`, `PLAN.md`, `spec/SPEC.md`, `LeanCodeValidator/{Sigma,Profiles,Richness,Report}.lean`,
  `examples/{ZagrMarketplace,ZagrMarketplaceGen,FaultInject}.lean`,
  `spec/{domain,rules,operations,queries,mappings,interfaces,events,workflows}.md`,
  `research/`, `discovery/`.
- `arcanum/.agents/skills/craft/CRAFT-INITIAL-DEFINITION.md` — schema/data/functor/
  residue/PCRA model and its external grounding (Spivak, Lawvere, Bedau).
- `implementation/domainspec/{AXIOMS.md,CONSTITUTION.md,TAXONOMY.md,RELATIONSHIPS.md,ARCHITECTURE-PATTERN-LIBRARY.md}`.
- `implementation/domainspec/.claude/skills/custom/` + `domainspec-tag-code`,
  GitNexus code-intelligence (semantics of produced code).

External (bounded, non-canonical, analogy-only per Craft honesty boundary):

- Spivak — Functorial Data Migration (schema = category, instance = Set-functor).
- Lawvere — Functorial Semantics of Algebraic Theories.
- Adjacent: categorical semantics of programs, refinement/abstraction functors,
  Kan extensions (`Lan`) referenced in the validator's categorical roadmap.

## Write Scope

This run writes only inside its run folder
(`development/refinement-runs/2026-06-08-lean-functor-validation/`) plus,
on confirmation, design artifacts under `projects/domainspec-language/research/`.
It must **not** mutate the Lean validator, Craft artifacts, or
`implementation/domainspec` source (Craft non-goal; DomainSpec impact-analysis
rules).

## Done Criteria

A refined design package that:

1. states the two-stage categorical model (Stage A spec correctness, Stage B
   code-as-functor) in terms the existing Lean validator can extend;
2. records a **categorical formalization decision** (which functor/semantics
   framing, validated against the validator's existing σ-model);
3. designs the **deterministic translator** (code → DomainSpec language) and the
   inputs it consumes (patterns, tags, composability, graph data);
4. defines the **residue / honesty boundary** (what Lean proves vs what stays
   governed residue — PCRA);
5. names validation authority, lifecycle, blockers, open decisions;
6. produces **one implementation work pack** (smallest provable surface);
7. carries auditable stage receipts and subagent receipts.

## Validation Surface

- Dispatch route validates against `formulae/dispatch-spec/dispatch.schema.yml`.
- Each canonical stage records a native receipt or a blocked reason.
- The categorical decision is gated (decision gate) before Plan.
- Toy-game falsification uses the existing `FaultInject.lean` adversarial harness
  as a controlled failure reference.
- Final synthesis is built from stage artifacts, not from this proposal.

## Planned Stage Configuration

Canonical ten-stage refine loop (presets tune depth, not stage set):
Context Builder → Invoke Define → Interrogation(refine-review) → Research
Decision (bounded) → Distill → Invoke Redefine/Design → Interrogation
(refine-design-review) → Distill Repair → Invoke Plan → Final Interrogation +
Refine synthesis. Subagent fan-out/dialectic/tournament is layered onto the
research, distill, design, and repair stages (see REFINE-DISPATCH.json).
