# Source and Interface Contracts — @2 Refresh Successor

Status: candidate Design contracts; unimplemented and unadmitted

## 1. `FormalClaimSourcePayload/v1`

Owner: `formal-claims-owner`

Required field classes:

| Field | Meaning |
| --- | --- |
| claim/version/digest/owner/currentness/supersession | exact immutable semantic identity |
| `source_meaning_ref` and accepted `formalizes` ref | exact BusinessMeaning correspondence inputs |
| `logic_family_ref` and `logic_semantics_profile_ref` plus digests | selected interpretation contract; not necessarily FOL |
| statement AST and digest | exact structured formal statement |
| profile-specific signature | sorts, symbols, variables, operators, arities, and types |
| theory and semantic assumptions | exact interpretation environment |
| claim ceiling | meaning only; no capability, evidence, proof, or discharge |

Forbidden fields include `executable_profile`, decidability class, capability
classification, projection admission, provider admission, solver/proof result,
evidence handle, discharge, promotion, publication, or release state.

The FOL profile selected by this candidate supports standard many-sorted FOL
with equality, including typed variables, constants, total functions,
predicates, Boolean connectives, and arbitrarily nested first-order quantifiers.
Its assumptions must explicitly state theories, equality, nonempty sorts,
domain closure, finiteness, and unique names where used.

Higher-order quantification, temporal/modal operators, fixed points, and native
transitive closure are outside this profile. A claim using those semantics must
select another separately governed logic profile; it must not disguise them as
ordinary FOL predicate names.

## 2. `FormalClaimCapabilityAssessment/v1`

Owner: `validation-governance-owner`

Required fields:

- assessment id/version/digest and independent lifecycle;
- exact claim ref and payload digest;
- assessment policy/profile refs and digests;
- total primary classification: `executable-bounded`, `solver-admissible`,
  `proof-provider-required`, `unsupported`, or `indeterminate`;
- independent executable-projection, solver-profile, and theorem-provider
  states;
- `executable_profile` and optional projection ref;
- `needs_formal` and nonempty typed reasons when true;
- currentness, supersession, narrow ceiling, and authority effect none.

TDE performs deterministic classification for its executable slice under the
exact validation policy. Validation governance owns policy and assessment. EVF
owns evidence routing. No assessment change mutates source meaning.

## 3. Canonical relation contracts

### `formalizes`

- canonical direction: `FormalClaim -> BusinessMeaning`;
- assertion owner: formal-claims owner;
- requires exact endpoint versions/digests, scope, declared loss, currentness,
  and separately current formal-owner and business-fidelity acceptances;
- generated inverse `is_formalized_by` is navigation only;
- ceiling: correspondence only, not truth, proof, or discharge.

### `derived_from`

- canonical direction: `ProofObligation -> FormalClaim`;
- assertion owner: validation governance;
- requires exact obligation/claim versions and digests, accepted formalization,
  owner receipts, derivation-context ref/digest, currentness, and ceiling;
- generated inverse `derives` is navigation only;
- ceiling: exact lineage only, not meaning, evaluator pass, proof, or discharge.

Any reversed authored edge, authored inverse, endpoint mismatch, stale relation,
or missing derivation context blocks.

## 4. `ExecutableProjectionBinding/v1`

Owner: validation governance

Required fields bind projection identity/version/digest, exact source, purpose,
executable profile, projection AST, preservation kind/direction, exact domain,
assumptions, declared loss, provenance, evidence kind/ref/digest, producer,
independent validator, currentness, supersession, and ceiling.

| Preservation kind | Required direction | Ceiling |
| --- | --- | --- |
| exact-equivalent-under-declared-domain | bidirectional within exact domain/assumptions | equivalent only there |
| counterexample-preserving | projected counterexample implies source counterexample | mapped counterexample only |
| witness-preserving | projected witness implies source witness | mapped witness only |
| implication-only | exact named implication direction | no converse |

Evidence is either syntactic-by-construction under an admitted exact rule or a
separately owned certificate bound to every relevant input. Without admissible
evidence, no projection is emitted and `needs_formal` remains true. This is not
a general full-FOL equivalence decision contract.

## 5. `DS-SFOLFormalClaimProjection/v1` — proposed migration

Owners: formal-claims, validation-governance, DS-SFOL, node-schema, and migration
owners on their separate surfaces

Required fields:

- one exact FormalClaim ref/version/payload digest;
- one logic-semantics profile ref/digest;
- canonical node, graph, manifest, build receipt, profile, and source-set refs
  and digests;
- projected `body.logic`/NodeLogicEnvelope ref and digest;
- DS-SFOL executable profile ref/digest;
- projection purpose, preservation kind/direction, finite universe, assumptions,
  declared loss, evidence, currentness, and ceiling;
- `source_authority_count: 1` invariant.

Migration rule: after a separately accepted migration, DS-SFOL `body.logic` is
only a projection/transport representation. It may not be independently
authored or supersede the FormalClaim statement. Missing, competing, stale,
non-bijective, or digest-mismatched authority blocks.

Prerequisites before any apply are exact preimage/target inventory, postimages,
mapping and compatibility schemas, positive/negative fixtures, source and
migration owner receipts, rollback or immutable supersession, and separate
implementation authorization. None exists from this candidate.

## 6. `EVFFormalValidationRequest/v1` — planned

Owner: EVF obligation/evaluator contract owner

Required bindings:

- exact ProofObligation and `derived_from` relation;
- exact FormalClaim, logic semantics, theories, assumptions, and ceiling;
- exact assessment and optional executable projection or provider translation;
- requested evidence kind (`counterexample`, `witness`, or exact theorem route);
- provider/factory capability selector constraints, resources, expected result
  vocabulary, request identity/digest, currentness, and authority none.

The request does not admit a provider, invent an expected value, or change
meaning.

## 7. `FactoryObligationBinding/v1` — planned

Owner: adapter under jointly accepted EVF/factory boundary

It deterministically binds adapter version, EVF request identity/digest,
declared provider id/version/profile, derived factory request identity/digest,
and ceilings. Ambient discovery or “latest” is forbidden. The adapter owns
translation only, not factory execution or provider semantics.

## 8. `FormalProviderResult/v1` — planned family

Owner: provider owner

Required fields bind provider kind/id/version, exact runtime and executable
digest, query/translation/profile/theory/options/resource digests, run/attempt,
exit/timeout/output bounds, raw output, native total result, model or proof
artifact where applicable, residue, currentness, authority none, and ceiling.

For SMT, total result includes `sat`, `unsat`, `unknown`, `timeout`,
`unsupported`, `malformed`, and `error`.

The current `GraphLawProviderReceipt/v1` is not this contract. It admits only
`datalog` and `alloy`, with graph/bounded-model result shapes.

## 9. `VerifiedFactoryEvidenceBinding/v1` — planned

Owner: factory for lifecycle evidence; adapter for exact join validation

The binding joins EVF/factory request, lock, snapshot, provider and profile,
run/attempt, semantic receipt, replay/reproduction, accounting,
verification/currentness, and every ceiling. A receipt from another request,
lock, run, node, provider, version, or adapter is foreign evidence.

## 10. `EVFFormalEvidenceHandle/v1` — planned

Owner: EVF evidence owner

The handle is immutable and binds:

- exact FormalClaim and formalization relation;
- exact ProofObligation, derived-from relation, and derivation context;
- exact assessment and projection/translation provenance;
- exact request, adapter, factory lock/run/currentness, provider result;
- normalized EVF outcome, residue, source/result digests, and narrowest ceiling.

Interpretation ceilings:

| Native/result state | EVF ceiling |
| --- | --- |
| `sat` | candidate witness or counterexample under the exact encoded query/profile |
| `unsat` | no model, witness, or counterexample under the exact encoded query/profile |
| exact checked theorem proof | proposition under exact axioms/kernel boundary only |
| unsupported/unknown/timeout/malformed/error/stale/incomplete/mismatch | unresolved non-pass; no property claim |

No outcome automatically becomes source meaning, owner acceptance, obligation
discharge, runtime conformance, promotion, publication, or release.

## 11. Separate theorem-provider contracts — planned

`TheoremProofRequest/v1` and `TheoremProofReceipt/v1` bind one obligation, claim,
logic semantics, axioms/theories, translation, provider/kernel, proof object or
checked result, run/currentness, and ceiling. They are not SMT result contracts.
A proof does not establish implementation conformance without separate exact
runtime binding and evidence, and it never self-discharges.

## Current capability compatibility

- Candidate-local QF_LIA permits closed scalar Bool/Int, quantifier-free linear
  integer constraints, and witness/counterexample queries.
- It excludes full FOL, quantifiers, uninterpreted functions, nonlinear
  arithmetic, collections, implementation oracles, runtime conformance, and
  release/production admission.
- Z3 5.0.0 has exact candidate-local runtime and synthetic process-smoke
  evidence only; its ceiling grants no query result.
- EVF currently lacks an SMT provider kind, translation receipt, evaluator
  binding, factory registration for this seam, and end-to-end evidence handle.

All contracts above are Design artifacts and remain unimplemented, unexecuted,
unadmitted, and authority-free.
