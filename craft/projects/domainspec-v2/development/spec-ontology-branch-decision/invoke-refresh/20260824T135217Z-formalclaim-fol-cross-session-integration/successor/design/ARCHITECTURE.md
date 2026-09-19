---
candidate_id: dsv2-formalclaim-fol-profile-extension@2
status: refresh-successor-candidate-design
evidence_state: authored-complete
authority_effect: none
updatedAt: 2026-08-24
docType: architecture-bundle
---

# Architecture — FormalClaim Logic-Semantics, Projection, and Evidence Seam

## Design intent

Keep one exact semantic source while allowing multiple logic profiles and
multiple downstream evidence methods. Every transition is versioned,
digest-bound, owner-scoped, and ceiling-preserving. Nothing in this design is an
implementation or admission claim.

## 1. Context view

```text
BusinessMeaning
      ^ formalizes
      |
FormalClaimSourcePayload/v1           formal-claims owner
      ^
      | derived_from
ProofObligation                       validation governance
      |
      +--> capability assessment --> admitted DS-SFOL/TDE projection
      |
      +--> EVF request --> adapter --> factory --> SMT/bounded provider
      |                                   |             |
      |                                   +<-- verified evidence
      |                                           |
      |                                    EVF evidence handle
      |
      +--> separate theorem-provider request --> proof receipt
```

The arrow labels are canonical authored directions:

```text
ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning
```

Generated inverses may aid navigation but cannot be authored as competing
relations.

## 2. High-level structure view

| Plane | Owns | Must not own |
| --- | --- | --- |
| formal-claims source | exact statement, selected logic-semantics profile, signature, theories, assumptions, owner/version/currentness | executable profile, tool support, result, evidence, proof, discharge |
| proof bridge | ProofObligation proposition, derivation context, `derived_from` relation | FormalClaim meaning, provider outcome, self-discharge |
| validation assessment | `executable_profile`, total classification, typed `needs_formal`, projection/profile admissions | source semantics, provider execution |
| TDE/DS-SFOL | deterministic classification and bounded execution over an admitted projection | full-FOL authority, solver operation, second semantic source |
| EVF | formal-validation request, evidence routing, bounded consumer verdict and handle | provider lifecycle, source meaning, promotion |
| adapter | deterministic identity/taxonomy translation and exact join | obligation invention, raw solver interpretation, lifecycle repair |
| factory | registry selection, lock, run, replay, verification, currentness, evidence publication | EVF obligation meaning or provider semantics |
| provider | native query/model interpretation and total native result | EVF claim widening, owner acceptance |
| theorem provider | exact proof attempt and proof evidence | SMT/TDE substitution, discharge, runtime conformance |

### Capability-state table

| Surface | Current evidence | Validated design | Planned contract | Absent implementation/admission |
| --- | --- | --- | --- | --- |
| EVF | bounded L0/L1 and selected L2 reachability receipts | evidence chain and evaluator-family boundaries | generic formal-validation request and immutable handle extension | general full-logic evidence orchestration |
| EVF-to-factory adapter | none | candidate owner-gated obligation/evidence identity, currentness, and ceiling design | exact binding schemas and negative fixtures | admitted adapter implementation |
| architecture-conformance factory | lifecycle exists outside this candidate | reusable provider lifecycle seam | registration and binding for an SMT provider | this exact EVF/SMT integration |
| SMT | candidate-local Z3 5.0.0 runtime, QF_LIA profile, synthetic sat/unsat smoke | @2 seam and result ceilings | request/result/receipt family, translation, factory registration, replay/currentness join | current EVF SMT provider kind and end-to-end handle |
| theorem provider | none in selected current evidence | separate route and ownership boundary | request/proof/currentness/ceiling schemas | admitted provider, executed proof, discharge |
| DS-SFOL | planned architecture and staged first denominator unit; canonical engine files absent | bounded deterministic language/evaluator architecture | FormalClaim single-authority projection migration | applied schema migration, node adapter, complete runtime |
| EVF evidence handle for this seam | none | immutable narrowest-ceiling join | exact schema, fixtures, and currentness validator | issued handle or consumer evidence |

“Designed” and “planned” never mean implemented, admitted, registered, run, or
proved.

## 3. Low-level component view

### `FormalClaimSourcePayload/v1`

Four blocks remain source authority:

1. identity and lifecycle: claim id/version/digest, owner, currentness,
   supersession, business-meaning and formalization refs, claim ceiling;
2. semantics selection: logic-family and semantics-profile refs/digests;
3. exact statement: typed AST/digest and profile-specific signature;
4. interpretation environment: theory, equality, domain, closure, finiteness,
   unique-name, and other exact profile assumptions.

The current FOL profile is standard many-sorted FOL with equality. A different
logic profile can use the same FormalClaim envelope without pretending its
operators are FOL. `executable_profile` is structurally forbidden here.

### `FormalClaimCapabilityAssessment/v1`

This immutable validation record binds the exact claim and owns:

- policy/profile identity and currentness;
- independent executable, solver, and theorem-provider states;
- total primary classification;
- `executable_profile` and optional projection ref;
- `needs_formal` and typed reasons;
- ceiling and authority effect none.

Derived decidability and evidence never flow back into the source payload.

### `ExecutableProjectionBinding/v1`

Required bindings are source and projection refs/digests, purpose, executable
profile, preservation kind/direction, exact domain, assumptions, provenance,
construction rule or independently owned certificate, currentness, producer,
validator, and ceiling.

No general FOL equivalence procedure is assumed. Missing preservation evidence
emits no projection. A bounded result remains bounded.

### `DS-SFOLFormalClaimProjection/v1` — planned migration contract

The future projection joins:

- one FormalClaim version and source digest;
- one logic-semantics profile and digest;
- the canonical graph/manifest/build and node identity;
- the DS-SFOL language profile;
- projected `body.logic`/NodeLogicEnvelope bytes and digest;
- declared loss, purpose, preservation direction, finite universe, assumptions,
  construction/certificate evidence, currentness, and ceiling.

Exactly one source must be authoritative. A node-authored formula that differs
from its bound FormalClaim, two source claims for one projection, stale graph or
claim bytes, or missing bijection blocks. This component is only designed; no
migration has occurred.

### EVF/factory/provider components — planned

1. `EVFFormalValidationRequest/v1`: exact obligation, claim, assessment,
   projection/translation, expected evidence kind, ceiling, and provider
   selector constraints.
2. `FactoryObligationBinding/v1`: deterministic adapter version plus exact EVF
   request to factory request identity/digest mapping.
3. `FormalProviderResult/v1`: provider-owned total result with query, encoding,
   theory/profile, runtime/options/resources, native output, and ceiling.
4. `VerifiedFactoryEvidenceBinding/v1`: exact request/lock/run/provider/semantic
   receipt/replay/currentness/accounting join.
5. `EVFFormalEvidenceHandle/v1`: immutable EVF result over exact source,
   obligation, translation/projection, verified evidence, currentness, and the
   narrowest input ceiling.

The current graph-law provider receipt cannot be reused as an SMT receipt: its
provider enum is `datalog|alloy` and its result families are graph/bounded-model
specific. SMT needs a separately admitted family.

### Theorem-provider components — separate planned lane

`TheoremProofRequest/v1` and `TheoremProofReceipt/v1` bind the obligation,
FormalClaim, selected logic semantics, axioms/theories, translation, kernel or
provider identity, proof object/check result, currentness, and ceiling. They do
not reuse SMT result semantics or imply runtime conformance or discharge.

## 4. Workflow process view

```text
1. Formal-claims owner authors one exact FormalClaim source.
2. Formal and business owners separately admit formalizes bytes in a future route.
3. Validation governance derives a ProofObligation and authored derived_from edge.
4. Assessment classifies the exact claim against exact current profiles.
5a. If a preservation-backed bounded projection exists, DS-SFOL/TDE may consume it.
5b. If an evidence profile exists, EVF emits an exact formal-validation request.
5c. If a theorem is required, a separate proof request is emitted.
6. The adapter derives one exact factory request; it invents no expectation.
7. The factory resolves only an admitted registered provider and locks exact inputs.
8. The provider executes under its own pinned semantics and returns a total result.
9. The factory replays, verifies, checks currentness/accounting, and publishes evidence.
10. The evidence adapter joins every identity, version, digest, result, and ceiling.
11. EVF emits a bounded immutable handle or typed non-pass residue.
12. A separate lifecycle owner may later decide obligation posture.
```

No stage can skip source admission, select ambient “latest”, repair a mismatch,
reinterpret a non-pass, widen a ceiling, or mutate source meaning.

## 5. Decision-flow view

```text
Exact current FormalClaim and canonical relations?
  no -> block: source/lineage invalid
  yes -> selected logic semantics valid?
    no -> reject or route to another exact logic profile
    yes -> capability evidence complete and current?
      no -> indeterminate + needs_formal
      yes -> preservation-backed executable projection?
        yes -> bounded TDE/DS-SFOL lane may proceed
        no -> keep needs_formal
      exact admitted SMT/bounded evidence profile and provider seam?
        yes -> EVF/factory route may proceed
        no -> unsupported/not-admitted; no execution
      exact admitted theorem-provider route required?
        yes -> separate theorem lane
        no matching admitted lane -> unsupported

Provider/factory result arrives:
  identity/currentness/ceiling join exact?
    no -> non-pass
  result sat?
    yes -> candidate witness/counterexample under exact encoding only
  result unsat?
    yes -> no model/counterexample under exact encoding only
  result unsupported/unknown/timeout/malformed/error/stale/incomplete?
    yes -> unresolved non-pass
```

## 6. Dependency and interface view

| Producer | Contract | Consumer | Allowed result | Forbidden inference |
| --- | --- | --- | --- | --- |
| formal-claims owner | source payload | proof bridge/assessment | exact meaning | executable support or proof |
| proof bridge | canonical `derived_from` relation | EVF/proof lane | exact lineage | meaning or discharge |
| validation governance | assessment/projection | TDE/EVF | exact capability route | source mutation or provider admission |
| FormalClaim projection migration | DS-SFOL projection | DS-SFOL | bounded executable semantics | second authority or global equivalence |
| EVF | formal-validation request | adapter | exact requested evidence meaning | provider selection by implication |
| adapter | factory request binding | factory | deterministic identity translation | invented expectation or lifecycle execution |
| factory | verified/current evidence binding | evidence adapter | exact lifecycle evidence | provider semantics or EVF verdict widening |
| provider | native result | factory/adapter | native bounded result | source truth, discharge, promotion |
| evidence adapter | immutable EVF handle | EVF consumer | narrowest bounded result | wider claim or release |
| theorem provider | proof receipt | proof bridge/lifecycle owner | exact proof evidence | runtime conformance or self-discharge |

### Identity/currentness join

Every accepted handle must join the same claim version/digest, formalization and
derived-from relation versions/digests, obligation/derivation context, assessment
policy, projection/translation, request, adapter, factory request and lock,
provider/runtime/options, run/attempt, semantic result, replay/currentness
receipt, and claim ceiling. Any mismatch is foreign evidence.

### Result ceilings

- `sat`: model exists for the exact encoded query/profile; at most candidate
  witness or counterexample evidence.
- `unsat`: no model exists for that exact encoded query/profile; at most
  no-witness/no-counterexample evidence there.
- theorem proof: only the exact proposition under exact axioms and checker
  boundary; not implementation/runtime conformance.
- unknown, timeout, malformed, unsupported, error, stale, incomplete, or
  mismatched: non-pass with no property claim.

## Significant behavior scenario

For `forall s. admitted(s) -> gross(s)=net(s)+fee(s)`, an admitted finite
universe `{S1,S2,S3}` may produce a counterexample-search projection. If the
exact provider returns `unsat`, the EVF handle may say only that no
counterexample exists inside that finite universe, theory, encoding, runtime,
and options. It cannot report the unbounded source formula proved.

## Distill rationale

Distill is skipped because this Refresh is a bounded delta to the already
distilled @1 coherent unit. The unit remains one source/assessment/projection
design; the additions close only three interfaces: canonical relation direction,
DS-SFOL single-authority migration, and downstream EVF evidence routing. A
further split would separate the source contract from the exact non-inflating
consumer boundaries it must constrain.

## Completion ceiling

The six views may reach local `design-validator-pass` after fresh extraction and
fixed-point selection. The domain gate remains blocked pending exact owner and
verifier admission and future Plan/implementation evidence.
