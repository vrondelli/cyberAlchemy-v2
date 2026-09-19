---
module: ui-meta-type-formalization
feature_code: UIF
version: current
status: candidate
updatedAt: 2026-07-11
docType: specification
authored_by: invoke (define mode)
authority_boundary: development evidence only; no DS-D1 promotion
---

# Specification: UI Meta-Type Formalization

## What This Package Owns

This development package owns the evidence route for deciding whether each of
the 11 UI labels can become a checkable DS-D1 meta-type. It defines candidate
formation contracts, experiments, architecture, and an execution plan without
promoting definitions or treating DS-D8 endpoint use as formation authority.

The package is parallel to the DS-D1 improvement work-pack. Its results can
inform a later `add-ui` decision, but they do not change the current
formation-deferred status of any UI label.

## Objective

For each UI label, determine whether a bounded structural criterion can:

1. accept valid specimens;
2. reject malformed specimens;
3. reject or reroute nearest-neighbor specimens;
4. remain useful across more than one UI framework style;
5. coexist with active DS-D8 endpoint signatures without borrowing their
   authority; and
6. support a human card, machine schema, correction contract, fixtures, tests,
   and generated-instance validation.

## Candidate Set

| ID | Label | Current status | Primary formation question |
| --- | --- | --- | --- |
| DS-D1.15 | Page | formation-deferred | Does routability plus owned primary content separate Page from Component and Layout? |
| DS-D1.16 | Layout | formation-deferred | Do named slots and shell ownership separate Layout from Page and Component? |
| DS-D1.17 | Component | formation-deferred | Can Component be narrower than an umbrella term for every UI construct? |
| DS-D1.18 | View Model | formation-deferred | Can display shaping separate it from Value Object, Query projection, and adapter output? |
| DS-D1.19 | Hook | formation-deferred | Can a framework-neutral reactive contract replace a React-specific label? |
| DS-D1.20 | Form | formation-deferred | Does the field-validation-submission contract earn a distinct type from Component? |
| DS-D1.21 | Action | formation-deferred | Can user intent, trigger, target, and outcome separate Action from event handlers and Operations? |
| DS-D1.22 | Guard | formation-deferred | Can a non-authoritative UI gate separate from Rule while retaining a source rule or permission? |
| DS-D1.23 | Binding | formation-deferred | Is Binding a durable node record or only a DS-D8/data-flow relation? |
| DS-D1.24 | Adapter | formation-deferred | Does UI-boundary shaping differ structurally from Mapping? |
| DS-D1.25 | State Indicator | formation-deferred | Is it domain-state visualization, async UI state, a Component role, or multiple concepts? |

## Artifact Contract

Every type that reaches `candidate-schema-ready` must have:

- a candidate human card;
- a candidate `.schema.yml` using bounded structural predicates;
- at least one positive fixture;
- one malformed negative fixture;
- one nearest-neighbor or collapse fixture;
- a correction contract that says how to repair or reroute a rejected specimen;
- an automated black-box validator test;
- a generated example instance and mutated-instance rejection test;
- a portability result from at least two framework styles or one explicitly
  framework-neutral corpus; and
- an owner-reviewed promotion packet.

## Experiment Outcomes

Experiments classify each label into exactly one provisional outcome:

| Outcome | Meaning | Next route |
| --- | --- | --- |
| `candidate-schema-ready` | Structural and non-collapse evidence survives. | Draft candidate card/schema and promotion packet. |
| `merge-candidate` | A current DS-D1 type already covers the label without loss. | Record merge target and correction route. |
| `relation-not-node` | The useful distinction is connective behavior, not node formation. | Route a DS-D8 proposal; do not mutate relationships here. |
| `framework-vocabulary` | The term is useful but tied to a framework idiom. | Keep as implementation vocabulary or rename neutrally. |
| `split-candidate` | One label conflates more than one formation law. | Return to design with named candidate splits. |
| `defer-evidence-gap` | No bounded structural criterion currently survives. | Preserve residue and define the evidence needed to retry. |

No experiment outcome is `active` or `promoted`.

## Formation Rules

1. Criteria use structural `.schema.yml` predicates and a decidable table walk.
2. Criteria must not require semantic inference, application execution, or
   private derivation rules.
3. A self-declared tag alone does not prove non-collapse.
4. A DS-D8 edge may support an exercised separating witness, but raw endpoint
   participation or edge-set inequality is not formation authority.
5. A separating witness must accept the candidate and reject or reroute its
   named neighbor under the same validator surface.
6. Unsupported semantic distinctions become explicit owner-owned exceptions or
   deferred residue; they are not disguised as structural proof.
7. Framework-specific syntax may appear in fixtures, but the formation law must
   either generalize or be classified as framework vocabulary.

## Capabilities

| Capability | What it produces | Key artifacts |
| --- | --- | --- |
| Candidate Modeling | Per-label hypotheses, neighbors, and correction routes | `SPEC.md`, `GLOSSARY.md` |
| Experimental Adjudication | Repeatable constructibility, discrimination, portability, and graph-coherence evidence | `EXPERIMENTS.md`, future run records |
| Candidate Schema Authoring | Human/machine twins only for surviving labels | future candidate cards and schemas |
| Promotion Handoff | Owner-review packet without authority mutation | future verdict and promotion packet |

## Source Contracts

- [UI11 accepted findings](../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md)
- [UI11 attack evidence](../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md)
- [Existing formalization design](../meta-type-formalization/DESIGN.md)
- [Formalism findings](../meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md)
- [Node non-collapse findings](../meta-type-formalization/research/2026-07-07-node-noncollapse-gate-redteam/findings.md)
- [UI candidate list](../meta-type-definitions/CANDIDATES.md)
- [DS-D8 relationship authority](../../definitions/relationships/relationships.yml)
- [DS-D1 registry read model](../../definitions/meta-types/meta-types.yml)

## Non-Goals

- Promoting any UI label into canonical DS-D1 authority.
- Changing DS-D8 relationship signatures.
- Making all 11 labels survive.
- Encoding framework APIs as universal formation laws.
- Adding a general criterion DSL, solver, SMT model, or Lean proof.
- Importing private derivation behavior into public validators.

## Success Condition

The package succeeds when every UI label has a reproducible experimental
verdict, surviving labels have complete candidate evidence, rejected or merged
labels have explicit correction routes, and definitions-governance can decide
promotion without reopening basic discovery.

## Change History

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-11 | Initial parallel candidate formalization specification. | invoke |
