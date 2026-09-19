---
candidate_id: dsv2-formalclaim-fol-profile-extension@2
status: refresh-successor-candidate
authority_effect: none
predecessor_candidate: dsv2-formalclaim-fol-profile-extension@1
predecessor_effect: exact-source-reference-only-no-mutation-no-acceptance-reuse
updatedAt: 2026-08-24
docType: domainspec-define-refresh-successor
---

# FormalClaim Logic-Semantics and FOL Profile Extension

## Outcome

`FormalClaim` is the canonical home of one exact formal statement and the
logic-semantics profile that gives that statement meaning. The first profile
specified here is standard many-sorted first-order logic with equality.

This does **not** say that every formal logic is FOL. Temporal, fixed-point,
transitive-closure, higher-order, and other logics require their own separately
owned semantics profiles. It also does not make source meaning executable.

## Practical model

Think of a FormalClaim as an exact legal clause and its capability assessment as
a separately issued tool card:

- the clause says what is meant;
- the card says what an admitted tool can soundly do with those exact bytes;
- provider and factory receipts say what happened in one exact run;
- lifecycle owners separately decide whether evidence affects an obligation.

Changing the card or a provider cannot change the clause.

## Canonical ontology chain

The only canonical authored relation direction is:

```text
ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning
```

`FormalClaim` belongs to the formal-claims/specification branch.
`ProofObligation` belongs to the proof-bridge branch. Provider and execution
receipts belong to system evidence. Generated inverses and integrated views are
read models, not second authored relations or semantic authority.

## Contract 1 — authored source meaning

`FormalClaimSourcePayload/v1` is owned by the formal-claims owner and contains:

- stable claim identity, version, owner, currentness, supersession, and digest;
- the exact business-meaning and accepted-formalization references;
- a selected `logic_semantics_profile_ref` and digest;
- the exact structured statement AST and digest;
- the signature, theory requirements, domain assumptions, and claim ceiling
  required by that selected profile.

It never contains `executable_profile`, derived decidability, capability
classification, provider admission, solver output, proof output, evidence,
discharge, promotion, or publication state.

### FOL semantics profile

The profile specified by this candidate is standard many-sorted FOL with
equality. It supports declared sorts and variables, constants, typed total
function symbols, typed predicates, same-sort equality, Boolean connectives,
and arbitrarily nested first-order `forall` and `exists`.

It requires exact theory, equality, nonempty-sort, domain-closure, finite-domain,
and unique-name assumptions where applicable. Distinct names are not unequal by
default, and named constants do not close a domain by default.

This FOL profile excludes quantification over predicates or functions,
temporal/modal operators, least/greatest fixed points, and native transitive
closure. It provides no general validity, satisfiability, or equivalence
termination promise.

## Contract 2 — downstream capability assessment

`FormalClaimCapabilityAssessment/v1` is an immutable validation-governance
record bound to the exact source payload digest. It owns:

- `executable_profile` and executable-projection state;
- solver-profile and theorem-provider states;
- the total primary classification `executable-bounded`, `solver-admissible`,
  `proof-provider-required`, `unsupported`, or `indeterminate`;
- `needs_formal` and its typed reasons;
- policy, profile, currentness, supersession, ceiling, and authority bindings.

TDE performs deterministic decidability/profile classification only for its
executable slice under validation-governance policy. EVF owns evidence routing.
Providers own execution semantics. None owns source meaning.

Typed `needs_formal` reasons remain:

- `missing-formal-statement`;
- `outside-executable-profile`;
- `implementation-oracle-dependence`;
- `unsupported-theory`;
- `indeterminate-classification`.

Valid but unmatched language/theory is `unsupported`. `proof-provider-required`
requires an exact admitted proof route. Missing, stale, contradictory, or
inconclusive classification evidence is `indeterminate`.

## Contract 3 — projection and DS-SFOL single authority

An `ExecutableProjectionBinding/v1` may exist only when it binds the exact
FormalClaim source digest, purpose, executable profile, projection bytes,
preservation kind and direction, domain, assumptions, currentness, and
admissible preservation evidence.

Allowed preservation claims remain exact-equivalent-under-declared-domain,
counterexample-preserving, witness-preserving, or one explicitly named
implication direction. A bounded or narrowed projection proves only its declared
boundary. No admissible preservation evidence means no projection and
`needs_formal` stays true. No general full-FOL equivalence checker is claimed.

DS-SFOL currently designs `body.logic` as node-owned input, while its canonical
engine files and node adapter remain absent. Before a future integration:

1. exactly one FormalClaim source becomes semantic authority;
2. DS-SFOL `body.logic` becomes a digest-bound projection or transport view of
   that source, never an independently authored formula;
3. the projection binds claim, profile, graph/build context, domain,
   assumptions, preservation evidence, and currentness;
4. any competing, missing, stale, or non-bijective authority binding blocks;
5. migration requires separately accepted schema, mapping, fixtures,
   postimages, rollback/supersession, owner receipts, and implementation
   authorization.

This is a proposed migration contract only. No DS-SFOL byte or state changes.

## Contract 4 — EVF, factory, provider, and evidence handle seam

The planned downstream chain is:

```text
ProofObligation + FormalClaim + assessment/projection
  -> EVF formal-validation request
  -> versioned obligation adapter
  -> architecture-conformance factory request
  -> exact registered provider
  -> provider result
  -> factory verification/replay/currentness receipt
  -> evidence adapter identity/currentness/ceiling join
  -> immutable EVF evidence handle
```

EVF owns the obligation and bounded consumer-facing evidence meaning. The
adapter maps exact identities and vocabularies. The factory owns locking,
execution, replay, verification, currentness, and evidence publication. The
provider owns solver-specific interpretation. No layer may repair foreign
inputs, select ambient “latest” versions, widen a ceiling, self-discharge, or
promote.

Current evidence is narrower than this design:

- EVF has bounded L0/L1 and selected L2 reachability evidence;
- Z3 5.0.0 and QF_LIA are candidate-local runtime/profile admissions with
  synthetic smoke evidence and no query-result or release admission;
- the current graph-law provider receipt admits `datalog` and `alloy`, not SMT;
- the EVF-to-factory adapter is candidate owner-gated and absent;
- no admitted SMT request/result/receipt family, factory registration, theorem
  provider, or end-to-end EVF evidence handle exists for this seam.

## Separate theorem-provider lane

A theorem provider consumes an exact ProofObligation plus exact FormalClaim,
assumption, theory, translation, provider, and currentness bindings. Its proof
receipt is separate from TDE, SMT, bounded-model evidence, runtime conformance,
owner acceptance, obligation discharge, and promotion. Absence of an admitted
theorem route never becomes an SMT or TDE pass.

## Plain-language examples

- `price >= 0` over `Int` is valid source FOL and a current QF_LIA candidate.
  That candidate assessment is not part of its meaning.
- `forall account exists owner` is valid source FOL but outside current QF_LIA
  and bounded TDE unless a separate exact projection is admitted.
- `every request eventually completes` is temporal, not this FOL profile.
- unbounded graph acyclicity needs closure/fixed-point semantics or an explicit
  finite encoding; the finite result proves only that bound.
- a finite settlement grounding may search for a counterexample. `unsat` means
  only no model/counterexample under that exact encoding and profile, not a
  theorem about the unbounded source claim.

## Invariants

1. One FormalClaim version has one exact semantic source payload.
2. Logic semantics and executable capability remain separate contracts.
3. Relation direction and endpoint owner identity are exact and digest-bound.
4. Every projection records provenance and a non-inflating preservation ceiling.
5. Every evidence join binds source, obligation, projection, request, provider,
   run, currentness, result, and ceiling identities.
6. `unsupported`, `unknown`, timeout, malformed, stale, incomplete,
   identity-mismatched, or wider-than-source evidence never passes.
7. `sat` is only a candidate witness/counterexample under the exact encoding;
   `unsat` is only absence of a model/counterexample there.
8. The theorem-provider lane remains independently owned.
9. @1 and frozen @4 acceptance cannot cover @2 bytes.

## Completion ceiling

This Refresh successor may establish a run-local authored/applied candidate and
local `design-validator-pass`. It is not owner- or verifier-admitted, canonical,
implemented, migrated, registered, executed, proved, discharged, promoted,
published, released, deployed, or production-ready.
