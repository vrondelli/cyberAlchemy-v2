---
node_type: development-package
docType: spec
module: architecture-pattern-enforcement
feature_code: APE
status: candidate
updatedAt: 2026-08-04
vocabulary: DS-D1 and DS-D8 references plus package-local implementation-conformance concepts
semanticAuthority: none
---

# Architecture-Pattern Enforcement

## Intent

APE makes implementation architecture inspectable and enforceable by resolving
typed properties from a candidate architecture-property ontology, observing
real source and native-tool evidence, and evaluating those observations against
an explicitly selected implementation profile.

The ontology describes architecture meaning. Invoke derives work from missing
ontology coverage. Work-pack state is not stored in the ontology.

## Problem

The older APE plan proved useful node and edge validators, but it did not model
the complete implementation properties of each backend meta-type. The broader
BTE plan consequently had to invent scenario semantics at fixture time. Its
independent validation-owner attempt found that recomposition overlap,
expectation rewriting, and frozen-case/result joins were not causally
representable by the published contracts.

The replacement boundary is:

```text
canonical DS-D1 / DS-D8 meaning
  -> candidate implementation realization ontology
  -> selected portable and language profiles
  -> real observation projections
  -> deterministic findings and causal proof evidence
  -> separate owner decision
```

## Authority and ownership rules

1. DS-D1 owns what a meta-type means and how it forms.
2. DS-D8 owns canonical relationship signatures.
3. The implementation-conformance ontology owns no canonical semantic fact.
4. APE owns candidate architecture design, evidence preparation, plan
   sequencing, and owner routing—not promotion decisions.
5. MTCI remains the reusable lifecycle for a genuinely new meta-type. An
   already-active type uses the realization cycle below and skips new-type
   admission unless execution exposes a real semantic gap.
6. BTE owns generic proof mechanics only. It may consume ontology and design
   identifiers; it may not select properties or expected semantic obligations.
7. Language adapters report observed or unsupported facts. They do not create
   portable meaning.
8. Generated projections, findings, receipts, and passing tests are evidence,
   never authority.

## Candidate capabilities

| ID | Capability | Output | Current state |
| --- | --- | --- | --- |
| APE.C-A | semantic formation consumption | digest-bound DS-D1 definition and criterion references | active source exists |
| APE.C-B | semantic relationship consumption | digest-bound DS-D8 signature references | active source exists |
| APE.C-H | architecture-property modeling | implementation realization types, typed properties, allowed relations, applicability, owner routes | candidate; 5/13 backend realization types represented |
| APE.C-I | architecture-profile resolution | portable constraints plus TypeScript/Python/Rust realizations | candidate; incomplete |
| APE.C-J | observation projection | observed, derived, owner-resolved, and unsupported facts with provenance | example JSON only; native adapters absent |
| APE.C-K | deterministic evaluation | explainable property/relation findings with exact expectations and evidence refs | bounded prototype |
| APE.C-L | causal proof integration | scenario identity, mutation and expectation lineage, recomposition scope, case/result joins, replay | contract gap; BTE L0B blocked |
| APE.C-M | per-meta-type completion | one type's portable obligations evidenced across three language profiles, plus separate runtime evidence when applicable | not executed |
| APE.C-N | ontology-guided progression | exact active-type coverage and evidence-burden selection of the next type | planned |

Earlier APE capabilities for cards, CI, inheritance, drift, and
unconstructibility remain preserved in the historical evidence map. They are
not deleted, but they no longer determine the first active implementation
slice.

## Candidate concept registry

These are package-local implementation-conformance concepts. Their loose DS-D1
classification is explanatory and does not admit new DS-D1 members.

| ID | Concept | Loose type | Responsibility |
| --- | --- | --- | --- |
| APE.CanonicalMetaTypeRef | Canonical Meta-Type Reference | Value Object | exact DS-D1 ID, source path, selector, version, and digest |
| APE.ImplementationRealizationType | Implementation Realization Type | Value Object | candidate architecture type corresponding to one active DS-D1 member |
| APE.ImplementationProperty | Implementation Property | Value Object | typed value domain, valid subjects, observation stage, owner, forbidden inference |
| APE.ArchitectureProfile | Architecture Profile | Value Object | portable or language-local constraints over properties and relations |
| APE.ImplementationBinding | Implementation Binding | Mapping | exact canonical concept to source/symbol/profile binding |
| APE.ObservationProjection | Observation Projection | Mapping | normalized observed, derived, owner-resolved, or unsupported facts with provenance |
| APE.EvaluationScenario | Evaluation Scenario | Value Object | base/mutant inputs, immutable expectations, recomposition scope, and result joins |
| APE.ConstraintFinding | Constraint Finding | Entity | expected/observed result, origin profile, evidence ref, diagnostic, and owner route |
| APE.ProofEngineProvider | Proof Engine Provider | Interface | BTE-compatible scenario execution, mutation, receipts, and replay |
| APE.MetaTypeRealizationCycle | Meta-Type Realization Cycle | Workflow | ontology-first route for one already-active meta-type |
| APE.TypeCompletionReceipt | Type Completion Receipt | Event | bounded evidence that all applicable obligations closed for selected profiles |

## Portable invariants

- Canonical semantic identity is referenced by stable ID and digest; it is not
  inferred from filenames, folders, ontology positions, or graph counts.
- Every required property has a typed value domain, applicable subject,
  observation stage, owner route, and forbidden inference.
- Portable properties are separate from language and project conventions.
- Missing and unsupported are distinct; unsupported required evidence blocks.
- Observed, derived, and owner-resolved facts use distinct provenance carriers.
- Profile conflicts block deterministically; file order cannot resolve them.
- A finding retains subject, property or relation, expected value, observed
  value, originating profile, raw evidence reference, and owner route.
- Static structure never proves runtime behavior, effect delivery, persistence,
  or lifecycle correctness.
- Three-language parity compares obligation IDs and applicability outcomes,
  never syntax, AST shape, or majority vote.
- A receipt cannot admit a profile, accept an exception, promote authority, or
  release software.

## Profile-local conventions

Folder names, filename case, one-file policies, export visibility, direct-leaf
imports, and callable form belong to an admitted architecture profile. In
particular, arrow-functions-only may be a TypeScript profile constraint but is
not a portable truth about Rule or any other DS-D1 type.

Enum representation is likewise profile-owned. TypeScript `enum`, string
literal unions, and `as const` objects are not equivalent merely because they
enumerate names. Python and Rust representations require their own owner-selected
contracts and native evidence.

Composition is represented separately from portable Enum meaning. A composed
implementation uses non-canonical representation-unit nodes and directed
`architecture.composed_from` evidence edges. Leaf member records retain
code-facing keys and canonical candidate values; composite values are derived
from exact leaf fact IDs. Cycles, diamonds with repeated contributions,
unresolved components, duplicate keys, and duplicate values block. Source
order does not become Enum meaning.

The first TypeScript candidate protocol is an owned runtime const-object
surface with exact `defineEnum`, `composeEnum`, and `EnumValue` symbol
identity. It requires runtime freezing, string-only members, named composition
arguments, stable member origins, and exact provider path/digest binding before
profile activation. Native `enum`, standalone literal unions, bare `as
const` objects, arbitrary factories, raw spreads, computed members, and helper
name impersonation remain typed unsupported unless a later owner decision
expands the profile.

## Existing meta-type realization cycle

For one active DS-D1 member:

1. Bind the active canonical definition and criterion digests.
2. Add or repair its candidate implementation realization type.
3. Define portable properties, allowed relations, applicability, unsupported
   cases, and non-collapse boundaries.
4. Define portable and language profiles.
5. Freeze provenance, composition-graph, conflict, scenario, lineage, and
   observation contracts.
6. Select a language protocol, implement its exact provider, and bind the
   provider digest into the language profile.
7. Prove TypeScript with real source, exact-cause negatives, and raw native
   evidence; then freeze the shared observation contract.
8. Run Python and Rust independently against that frozen contract.
9. Recompose exact semantic-obligation parity and separate runtime evidence
   when required.
10. Emit a bounded completion receipt and derive the next type from remaining
   ontology/evidence burden.

If a required implementation property would change canonical DS-D1 meaning,
stop and route the semantic delta to definitions-governance. Do not let an
architecture profile redefine the type.

## First cycle: Enum

The first active target is `DS-D1.3 Enum`: a closed finite set of named values,
with no typed fields, designated identity, or transitions. Initial discriminator
requirements include:

- a positive closed, nonempty, unique named-value set;
- missing, extra, duplicate, empty, and dynamically unresolved values;
- a typed-field shape rejected as Value Object-like rather than Enum;
- transitions rejected as State Machine-like rather than Enum;
- profile-form violations classified as architecture-profile findings, not
  canonical Enum formation failures.

Enum is the first target because it has narrow structural semantics. That is a
planning hypothesis to be verified, not evidence that Enum implementation is
already complete.

## Acceptance

The APE plan is ready for a later Task Session when:

- the six-view Design and deterministic Design selection pass;
- the L0-L3 split Work Pack, task details, atomic SWUs, closeout contracts, and
  dispatch validate;
- the Work Pack names exactly one receipt-backed nearest candidate and leaves
  it unselected;
- completed historical evidence is preserved without being relabeled;
- ontology, BTE, DS-D1, implementation, promotion, release, and deployment
  work remain unexecuted by Invoke.

## Non-goals and claim ceiling

This definition does not mutate the ontology, DS-D1, DS-D8, BTE, language
source, CI, releases, deployments, or public Arcanum. It does not establish
Enum conformance, all-type completeness, cross-language universality,
performance, production readiness, or authority promotion.
