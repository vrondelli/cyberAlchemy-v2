---
candidate_id: dsv2-formalclaim-fol-profile-extension@1
status: stable-for-this-request-design-authoring-only
authority_effect: none
predecessor_context: dsv2-spec-ontology-contract-hardening@4
predecessor_effect: reference-only-no-supersession-no-acceptance-reuse
updatedAt: 2026-08-24
docType: domainspec-define-candidate
---

# FormalClaim Expressive FOL Profile Extension

## What This Addition Owns

This addition lets an owner state the exact meaning of a `FormalClaim` in
standard many-sorted first-order logic with equality. It also defines a separate
way for validation governance to say what downstream tools can soundly do with
that exact claim.

It does not make full FOL decidable. It does not make TDE a theorem prover, put
SMT inside deterministic derivation, or turn a solver result into meaning,
proof, discharge, or authority.

## Practical Model

Think of the source claim as a complete legal sentence and the capability
assessment as a certified translation card. The sentence belongs to its author.
The card may say “TDE can execute this bounded projection,” “the current SMT
profile can search for a witness,” or “a proof provider is required.” Changing
the card cannot change the sentence.

```text
BusinessMeaning
      ^
      | formalizes
FormalClaimSourcePayload/v1        formal-claims-owner
      |
      | exact claim ref + digest
      v
FormalClaimCapabilityAssessment/v1 validation-governance-owner
      |                 |                  |
      v                 v                  v
TDE projection       EVF evidence       proof-provider route
                        |
                        v
                  SMT provider execution
```

## Capability 1 — Author Expressive FOL Meaning

`FormalClaimSourcePayload/v1` is the semantic payload of a `FormalClaim`. Its
logic family is standard many-sorted FOL with equality:

- declared sorts and variables;
- constants;
- total function symbols with typed argument and result sorts;
- predicate symbols with typed arguments;
- equality between terms of the same sort;
- `not`, `and`, `or`, implication, and equivalence;
- arbitrary first-order nesting of `forall` and `exists` over declared sorts;
- an immutable typed formula AST and digest;
- exact theory requirements and domain assumptions;
- explicit equality, domain-closure, nonempty-sort, and unique-name policies;
- source-meaning binding, owner, version, currentness, supersession, and claim ceiling.

The source semantics profile does not include higher-order quantification,
temporal operators, least or greatest fixed points, or native transitive
closure. Distinct constant names are not assumed unequal unless the author
declares a unique-name assumption. A domain is not assumed to contain only named
constants unless domain closure is declared.

## Capability 2 — Assess Downstream Capability Without Rewriting Meaning

`FormalClaimCapabilityAssessment/v1` is immutable, digest-bound, and owned by
validation governance. It records:

- the exact source claim reference and digest;
- assessment policy and profile versions;
- a total primary classification: `executable-bounded`, `solver-admissible`,
  `proof-provider-required`, `unsupported`, or `indeterminate`;
- independent executable-projection, solver-profile, and proof-provider states;
- an optional exact executable projection with a preservation obligation;
- the existing `needs_formal` boolean plus typed reasons;
- currentness, supersession, claim ceiling, and authority effect.

Derived `decidability_class`, solver output, proof output, and discharge posture
are not fields of the authored source payload.

### Typed `needs_formal` reasons

| Reason | Plain meaning | Example |
| --- | --- | --- |
| `missing-formal-statement` | No structured claim meaning exists yet. | prose says “use the makeup policy” but gives no formula |
| `outside-executable-profile` | A formal statement exists, but TDE has no admitted executable projection for it. | `forall account exists owner` under the current QF profile |
| `implementation-oracle-dependence` | Expected truth would come from running the implementation itself. | expected value is defined as `callProductionPolicy(x)` |
| `unsupported-theory` | The claim requires a theory or logic feature the selected profile does not admit. | nonlinear integers under QF_LIA |
| `indeterminate-classification` | The classifier cannot soundly decide a profile. | a stale or incomplete theory binding |

`needs_formal` remains true whenever TDE lacks a sound executable projection,
even if another route can ask a solver for evidence or require a proof provider.
TDE executes the deterministic decidability/profile classification for its
executable slice under the exact validation-governance policy and returns the
typed assessment inputs. This preserves TDE ownership of the decidability map
without giving TDE solver-operation or semantic-owner authority.

`unsupported` is the total, evidence-backed result when the source is valid but
no exact admitted executable, solver, or proof profile matches its language or
theory. `proof-provider-required` is used only when a separately admitted proof
route is actually required. `indeterminate` is reserved for missing, stale,
contradictory, or inconclusive classification evidence; it is not a synonym for
unsupported.

## Examples

### `price >= 0`

With `price: Int`, this is a quantifier-free linear integer formula. It is a
candidate for the current QF_LIA SMT profile and may also have a bounded TDE
projection. That candidacy is an assessment, not part of the claim's meaning.

### `forall account exists owner`

`forall account: Account. exists owner: Owner. owns(account, owner)` is valid
source FOL. It is not admitted by the current QF_LIA profile because it uses
quantifiers, predicates, and multiple sorts. It therefore remains
`needs_formal: true` for TDE with reason `outside-executable-profile` unless a
future exact executable profile is separately admitted.

### `every request eventually completes`

“Eventually” is temporal. This is not a FOL formula in this profile. It needs a
separately specified temporal logic contract and evaluator; spelling it with a
FOL predicate would lose the intended time semantics.

### graph acyclicity

Uniform acyclicity of an unbounded graph requires reachability or transitive
closure, which plain FOL does not express. It needs a separately specified
closure/fixed-point logic, such as a Datalog-style route, or an explicitly
bounded finite encoding. A bounded encoding proves only that bound.

## Domain Concepts

| Concept | Type | Owner | Key constraint |
| --- | --- | --- | --- |
| `FormalClaimSourcePayload/v1` | semantic payload | formal-claims-owner | exact authored meaning only |
| `FormalClaimCapabilityAssessment/v1` | immutable assessment | validation-governance-owner, with TDE producing its deterministic executable-slice classification under policy | cannot rewrite or widen source meaning |
| `ExecutableProjectionBinding/v1` | assessment component | validation-governance-owner | exact, digest-bound, preservation obligation |
| `SolverProfileAdmissionRef/v1` | assessment reference | validation-governance-owner | provider execution remains separate |
| `needs_formal` reason | typed routing result | validation-governance-owner | never guessed away |
| provider execution receipt | evidence | SMT-provider owner | unsupported/unknown/timeout never pass |

## Invariants

1. Source expressiveness never implies TDE executability or SMT admission.
2. A downstream projection must bind the exact source digest, purpose,
   preservation kind/direction, domain, assumptions, and preservation evidence.
   A bounded projection proves only its declared bound and must never be
   reported as the global source claim. No admissible evidence means no
   projection and `needs_formal` remains true.
3. Assessment changes create new assessment versions, not source mutations.
4. Solver evidence is stored in the system-evidence branch under its producer,
   never inside authored claim meaning.
5. `unsupported`, `unknown`, `timeout`, incomplete, stale, digest-mismatched, or
   wider-than-source results never count as pass, proof, discharge, or meaning.
6. Only the formal-claims owner can author or semantically supersede the source
   payload. Validation governance owns classification and projection admission.
7. Frozen @4 bytes and acceptance remain exact and cannot cover this candidate.

## Existing Ontology Connections

| From | Edge | To | Meaning |
| --- | --- | --- | --- |
| `FormalClaim` | `formalizes` | `BusinessMeaning` | exact accepted correspondence, not proof |
| `ProofObligation` | `derived_from` | `FormalClaim` | exact lineage, not meaning or discharge |
| `FormalClaimCapabilityAssessment` | `assesses` candidate relation | exact `FormalClaim` version | validation-owned capability statement, pending relationship admission |
| `ExecutableProjectionBinding` | `projects` candidate relation | assessment/source pair | downstream executable representation, pending relationship admission |

The last two relation labels are design candidates only. They do not alter the
existing ontology relationship authority.

## Consumers

| Consumer | Consumes | Must not infer |
| --- | --- | --- |
| TDE | admitted executable projection plus typed reasons | full source executability or proof |
| EVF | exact assessment, claim, profile, and evidence requests | source meaning or discharge |
| SMT provider | one pinned admitted query profile | general FOL support or pass from unknown/timeout |
| proof provider | exact proof obligation and source bindings | owner acceptance or publication |
| ontology projection | owner-local records and typed references | authority from generated integration |

## Completion Ceiling

This Define is stable only as input to this request's Design authoring. It is not
owner-admitted, verifier-admitted, canonical, implemented, migrated, executable,
promoted, published, released, deployed, or production-ready.
