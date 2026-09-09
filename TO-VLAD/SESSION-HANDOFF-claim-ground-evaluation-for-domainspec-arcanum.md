# Session Handoff: design a claim/ground/evaluation spine for DomainSpec and a public epistemic ledger for Arcanum

## Identity

- Source session reference: `domainspec-lean-formalization / claim-evidence-proof-model research + 2026-08-24 Robot-Talks synthesis`
- Destination label: `claim-ground-evaluation-domainspec-arcanum`
- Handoff type: `new-lifecycle-thread` with a bounded `research-direction` evidence packet
- Target project or lifecycle: private `cyberAlchemy-v2` design first; public Arcanum extraction only through a later public/private gate
- Created for: Vladimir, to decide whether DomainSpec/Arcanum should deliberately adopt an explicit claim/ground/evaluation representation and a public epistemic ledger even though the research did not establish implementation necessity.

## New Session Prompt

```text
Review the proposed claim/ground/evaluation spine and decide whether to authorize a bounded
Invoke Design cycle. The proposed direction is to model immutable ClaimVersion records,
provenance-bearing Ground records, explicit force-bearing relations or inference applications,
and attributed Evaluation records; keep governance disposition and operational authorization
separate; and expose an append-only, public Arcanum epistemic-ledger contract that transports
only public, independently re-authored records and stable references.

This is a deliberate strategic proposal from the owner, not a finding that the current system is
broken and not evidence that a v0.1 schema is already earned. Preserve the research NO-GO on
implementation until the design supplies concrete fixtures, negative controls, consumer queries,
privacy boundaries, and kill criteria. Decide whether the expected architectural leverage is worth
running that bounded design experiment.
```

## Executive Handoff

The research found a useful semantic spine:

```text
ClaimVersion -> Ground -> force-bearing relation/inference -> Evaluation
                                                    |          |
                                                    |          +-> policy-selected current projection
                                                    +------------> governance disposition (separate)
                                                                 operational authorization (separate)
```

Its central value is not another status enum. It is preventing five different questions from silently answering one another:

1. What exactly is being asserted, under which scope and assumptions?
2. What artifacts, observations, receipts, proofs, or sources exist?
3. How does each ground bear on the exact claim?
4. Who evaluated that claim, under which rule and evidence snapshot?
5. Who may promote, publish, or act on the result?

DomainSpec and Arcanum already preserve much of this separation in their authority, lifecycle, receipt, promotion, and approval contracts. The proposal is therefore not a repair of a generally collapsed system. It is a proposal to make the separation portable, queryable, and auditable across tools, handoffs, disagreement, revocation, and time.

## The Strategic Recommendation

Proceed to a **bounded design proposal** for the following candidate model, despite the current lack of a demonstrated schema consumer:

### 1. `ClaimVersion`

An immutable, identified truth-conditional assertion. A new version is required when statement, quantification, scope, assumptions, or formalization referent materially changes. Lineage or equivalence between versions is explicit and does not silently assert semantic identity.

Candidate fields to test, not audited universal requirements:

- stable ID;
- content or content reference plus digest;
- scope and assumptions;
- authored/source provenance;
- explicit lineage/equivalence assertions when applicable.

It must not contain current standing, owner permission, or an implied equivalence to another wording.

### 2. `Ground`

An immutable or versioned record for a raw source, artifact, observation, proof receipt, validation result, experiment output, counterexample, or execution event.

Candidate fields to test, with environment, time, and duplicated scope retained only when a named profile or consumer needs them:

- stable ID and `kind`;
- artifact/source reference plus digest where available;
- producer and provenance;
- production time and environment/profile references when relevant;
- declared scope only where it differs from or constrains the target claim.

`kind` selects validation/profile behavior; it must not imply that the ground proves, supports, refutes, authorizes, or promotes anything.

### 3. Force-bearing relation or inference application

The edge names how a ground or premise bears on an exact `ClaimVersion`. Candidate relations include `supports`, `refutes`, `verifies`, `reproduces`, and explicit inference applications. When required by the relation or a named consumer, it carries enough scope, predicate, rule, and assumption-transport information to prevent generic transitive `supports` from becoming accidental proof.

### 4. `Evaluation`

An attributed assertion produced by an evaluator or authority route applying a named policy, method, or profile to a declared target and input snapshot.

Candidate fields to test, with rationale, time, and lifecycle links retained only when a named profile or consumer requires them:

- stable ID;
- evaluator and authority route;
- target `ClaimVersion`;
- exact grounds/relations or snapshot reference;
- policy/method/profile ID and version;
- verdict or standing value in that profile;
- rationale, time, supersession, correction, and invalidation references.

Disagreement is parallel evaluation, not destructive overwrite. Changed evidence, policy, or judgment creates another evaluation or invalidation event; it does not mutate the claim.

### 5. Separate governance and action records

Governance disposition and operational authorization remain different objects or resolvable records:

- governance answers whether the project accepts, defers, promotes, publishes, or retires something;
- authorization answers whether an exact actor may perform an exact action in an exact scope;
- neither creates epistemic force merely by existing.

### 6. A public Arcanum epistemic ledger

Recommend an append-only public Arcanum contract that can transport the generic records above, corrections, invalidations, and policy-selected projections. The ledger should make evidence and evaluation portable across dispatches and handoffs without turning every runtime receipt into a full epistemic object.

The public ledger is a **new design direction**, not a request to copy the private cyberAlchemy-v2 ontology into Arcanum. Its public contract must be independently re-authored from generic requirements and must support opaque or redacted references so private DomainSpec claims, vocabulary, paths, and prose do not leak.

The ledger should initially be treated as an event log plus deterministic projections, not as a universal truth engine. “Current standing” is a projection under a named policy, never an intrinsic mutable property of a claim.

## Why This Could Help DomainSpec

- It gives `evidence_confidence` and `policy_disposition` a place to declare whether they are merely presentation projections or attributed evaluations with governing force.
- It prevents owner decision, maturity, validation, and evidence strength from becoming substitutable dimensions inside support packages.
- It gives premise-to-axiom and later correction flows an audit shape: the claim may stay stable while evaluation and governance posture change.
- It permits disagreement and revocation without rewriting history.
- It gives cross-project knowledge a stable identity and source trail without treating repository ownership as truth.
- It offers a reusable negative-control harness for future ontology and authority changes.

## Why This Could Help Arcanum

- A receipt or gate `pass` can remain compact operational evidence while a ledger entry names the exact proposition or predicate it bears on.
- Detached handoffs can preserve what a validation established instead of relying on local namespace knowledge.
- Observability can distinguish immutable run evidence, an observer's later evaluation, and a subsequent correction.
- Approval tokens remain scoped action authority, while evaluations remain epistemic judgments.
- Cross-capability dispatches can transport bounded public conclusions, grounds, exclusions, and authority level through stable handles.
- The ledger can become the generic evidence-accounting substrate used by research, review, promotion, and lifecycle tools without forcing those tools into one standing vocabulary.

## Current Tensions Vladimir Should Decide

### T1 — Projection or epistemic evaluation?

Are OEW `policy_disposition` and OCGP `evidence_confidence` presentation-only projections, or do they govern epistemic standing? If they govern, evaluator, rule/profile, version, and input snapshot must remain resolvable. If they are presentation-only, the ledger should not retroactively inflate them.

### T2 — What does D38 bound?

Is `strength(P(c))` intentionally a non-compositional upper bound across heterogeneous inputs? Evidence should limit epistemic force; owner decision should limit authority/promotion. The proposed design must not let either bootstrap the other.

### T3 — What may validation change?

A D40 validation edge or Arcanum gate pass establishes a named predicate under a declared procedure. It becomes ground. Any change to support or confidence requires a separate named evaluation/policy rule.

### T4 — How portable must receipts be?

Test whether an Arcanum receipt detached across a handoff can still resolve the predicate it validated through existing step, capability, dispatch, and artifact handles. A failing test justifies a ledger handle or bounded claim reference; it does not justify expanding every receipt by default.

## Gate 0 — Vladimir's Decision

Before any design work begins, Vladimir decides one of:

- `GO`: authorize the two bounded, independently gated design slices below;
- `DEFER`: retain the semantic spine and watch-conditions without opening design;
- `KILL`: reject the shared representation/ledger direction while preserving the already-deployed separation invariants.

Only `GO` routes to `invoke design`. This handoff recommends `GO`; it does not record that decision on Vladimir's behalf.

## Design Fixtures and Negative Controls

If Gate 0 returns `GO`, split the design into two independently gated slices.

### Slice A — private semantic fixture

The first slice remains inside private `cyberAlchemy-v2` and contains only:

1. one `ClaimVersion` fixture;
2. two grounds bearing on it through different relations;
3. two parallel evaluations or one evaluation plus a later invalidation;
4. one governance disposition;
5. one operational authorization scoped to an action.

### Slice B — public synthetic transport fixture

Only after an Arcanum owner/consumer is named and the public/private decision gate passes, create a separate public-only fixture using entirely synthetic public claims and grounds. It tests an append-only ledger projection, opaque-reference behavior, corrections, and detached-handoff portability. It is boundary-feasibility evidence only: it does not extract private data, approve a public contract, or authorize publication.

Pre-register queries and negative controls:

- changing only an evaluation must not change `ClaimVersion` identity;
- changing a material assumption must create a new `ClaimVersion`;
- changing `Ground.kind` must not manufacture force;
- two evaluators may disagree without either record being overwritten;
- owner approval must not raise epistemic strength;
- a validation pass must not prove a broader, unnamed predicate;
- removal or invalidation of a ground must change the policy projection without deleting history;
- a public projection must contain no private DomainSpec prose or resolvable private payload;
- a detached receipt must either resolve its exact predicate through existing handles or fail the portability test explicitly.

## Kill Criteria

Stop or radically reduce the design if any of these holds:

- existing DomainSpec and Arcanum handles answer every registered query without adding a shared record or ledger;
- the public ledger cannot provide utility without leaking private semantics or duplicating existing observability/inventory contracts;
- `ClaimVersion`, `Ground`, or `Evaluation` adds no independently validated distinction for the fixtures;
- the design requires a universal evidence hierarchy or universal standing vocabulary to function;
- the event/projection model cannot preserve disagreement, correction, and revocation without destructive mutation;
- the first bounded design cannot identify an owner for its public contract and private binding separately.

## Evidence Ceiling and Honest Disagreement

The audited research concluded:

> GO for the semantic boundary and future build-from-owned integration; NO-GO for a v0.1 schema, metamodel mutation, or implementation.

The Robot-Talks relevance review further found no inspected consumer that currently requires persisted `ClaimVersion`, `Ground`, or `Evaluation` entities, and it recommended awareness plus watch-conditions.

The human owner explicitly overrode that routing recommendation: **suggest the types and public ledger anyway.** This handoff therefore carries a strategic bet, not a stronger research conclusion. Vladimir is being asked whether the expected future leverage justifies a bounded design experiment whose first job is to try to kill itself.

## Route Rationale

- Recommended next route: Vladimir owner decision (`GO | DEFER | KILL`) → conditional `invoke design` for the two independently gated slices above.
- Rationale: the semantic boundaries are supported, but persistence shape and public contract are not. Design can test the strategic hypothesis without claiming implementation readiness.
- Lifecycle owners:
  - private semantics and ontology binding: `cyberAlchemy-v2` authority/ontology owners;
  - public generic ledger contract: Arcanum owner after independent re-authoring;
  - public/private extraction: `decision-gate`;
  - implementation: deferred until design validators and owner gates pass.

## Context Builder Selection

| Obligation | Coverage | Selected Source | Why It Matters |
| --- | --- | --- | --- |
| O1 state the researched minimum semantic roles | `covered` | `findings.md` §§ Formal boundary, Minimum semantic roles, Relations | Establishes the supported distinctions and their limits. |
| O2 identify concrete DomainSpec value | `covered` | Robot-Talks T1–T3; Node Model, OCGP, OEW, D38, D40 selectors | Connects the model to current fields and authority semantics. |
| O3 identify concrete Arcanum value | `covered` | Robot-Talks Arcanum report and T4 | Connects receipts, gates, observability, approval, and handoff portability. |
| O4 preserve the research NO-GO | `covered` | `findings.md` Executive verdict, Model A/B/C, Limitations | Prevents the proposal from masquerading as earned implementation authority. |
| O5 carry the owner's strategic override | `covered` | Robot-Talks Human Gate Notes | Explains why a deferred design is being recommended anyway. |
| O6 protect the public/private boundary | `covered` | repository `AGENTS.md`; `cyberAlchemy-v2/AGENTS.md` | Keeps private DomainSpec prose and payloads out of public Arcanum. |
| O7 provide an actionable next thread | `covered` | Gate 0, bounded fixtures, negative controls, kill criteria in this handoff | Makes the proposal falsifiable and owner-decidable without pre-authorizing design. |

Strict coverage: `pass` for handoff authorship. It is **not** implementation readiness.

## Selected Session Context

- `domainspec-lean-formalization/research-domainspec/claim-evidence-proof-model/findings.md`
  - Obligation refs: O1, O4.
  - Selected content: executive verdict; five licenses; minimum roles; typed relations; update policy; Model A/B/C disposition; limitations and next authorized move.
- `domainspec-core/Codex/current_conversations/2026-08-24-1114-rtcep-claim-evidence-domainspec-arcanum-value.md`
  - Obligation refs: O2, O3, O5, O7.
  - Selected content: three concern-based reports, seven reconciled tensions, human gate reclassification, and bounded routing recommendation.
- `domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
  - Obligation refs: O2.
  - Selected content: D23/D34 separation baseline, D38 support ceiling, D40 validation semantics, and D55 premise/axiom alignment.
- Current OCGP/OEW contracts and Arcanum receipt/gate/approval/observability contracts linked from the Robot-Talks record.
  - Obligation refs: O2, O3.
  - Selected content: current consumer and portability pressure points without copying full files.

## Excluded Context

| Candidate | Reason Excluded |
| --- | --- |
| Full research transcript and literature catalogue | Provenance remains linked; it does not improve Vladimir's design decision. |
| Model B/C universal evidence hierarchy | The research killed or deferred it for lack of a consumer. |
| Five universal standing axes | Not required for the proposed event/projection ledger and risks premature ontology. |
| Lean tactic/proof profiles | Implementation detail outside this design decision. |
| D55 as a defect | Current DomainSpec semantics already preserve the relevant non-collapse. |
| Claim that DomainSpec/Arcanum generally conflate evidence and authority | Contradicted by current contracts. |
| Private DomainSpec prose in public Arcanum | Forbidden by the repository boundary; public material must be independently re-authored. |

## Target Boundary

- In scope: a decision on the candidate semantic spine; a bounded design fixture; ledger event/projection behavior; validator queries; public/private split; owner and kill criteria.
- Out of scope: implementation, canonical definition promotion, database selection, migration, universal evidence taxonomy, automatic truth computation, publication, or copying private artifacts into Arcanum.
- Prior decisions to preserve: artifact lifecycle, epistemic evaluation, governance disposition, ownership/provenance, and operational authorization remain separate; execution success does not self-promote to truth or permission.

## Gaps And Blockers

| Gap | Owner | Status | Next Action |
| --- | --- | --- | --- |
| No demonstrated consumer currently requires the shared persisted model | Vladimir / design owner | `open` | Return Gate 0 `GO`, `DEFER`, or `KILL`; only `GO` opens the bounded self-killing design fixtures. |
| `policy_disposition` / `evidence_confidence` intent is unresolved | OEW/OCGP owner | `open` | Classify each as projection-only or governing evaluation. |
| D38 compositional intent is unresolved | definitions owner | `open` | State whether it is a non-compositional ceiling or a computed cross-dimensional strength. |
| Public ledger owner and API boundary are unnamed | Arcanum owner | `open` | Name the owner before public contract design proceeds. |
| Public/private projection and redaction rule is unproven | decision-gate | `blocked` for public mutation | Design opaque-reference/redaction fixtures and require explicit gate. |
| Receipt portability has no failing fixture yet | Arcanum runtime owner | `open` | Run the detached-receipt resolution test before expanding receipt schemas. |

## Dispatch Spec Technique Trace

| Technique | Effect on this handoff | Validation expectation |
| --- | --- | --- |
| `frame_handoff` | Frames a decision artifact, not an implementation order. | Prompt, evidence ceiling, and next owner are explicit. |
| `handle_handoff` | Uses stable paths to research, Robot-Talks, definitions, and runtime contracts. | Every material claim is evidence-linked or labeled proposal. |
| `residue_ledger` | Preserves unresolved semantics, ownership, and privacy gaps. | No open item disappears into narrative prose. |
| `owner_boundary_check` | Splits private DomainSpec binding from public Arcanum contract ownership. | No private-to-public promotion is implied. |
| `artifact_contract_bridge` | Connects research semantics to a candidate design fixture. | The bridge ends at design evidence, not mutation readiness. |
| `concrete_path_evidence` | Resolves the artifact under the target-local `TO-VLAD` convention. | Output path exists under `cyberAlchemy-v2/TO-VLAD/`. |
| `authority_split_gate` | Separates handoff authorship, design approval, implementation, and public release. | Each later authority transition requires its own receipt. |

Full reusable execution dispatch: not emitted by this handoff. The completed Robot-Talks investigation is the multi-agent evidence source; handoff authorship is direct-user-approved, and independent review is a single bounded helper rather than a new multi-wave execution route.

Distill validation for Slice A: skipped because the private semantic fixture is already reduced to one claim, two grounds, parallel evaluation/invalidation, one governance disposition, and one authorization. Any expansion beyond that slice reopens Distill. Slice B receives its own Distill decision only after an Arcanum owner/consumer is named and the public/private gate passes.

## Next-Session Start Prompt

```text
First return Gate 0 for the candidate ClaimVersion/Ground/relation/Evaluation spine and
append-only public Arcanum epistemic ledger: GO, DEFER, or KILL. Treat this as a strategic
hypothesis, not as a demonstrated implementation need. This handoff recommends GO but does
not authorize it on Vladimir's behalf.

First decide four things: (1) whether OEW policy_disposition and OCGP evidence_confidence
are projections or governing evaluations; (2) whether D38 is a non-compositional ceiling;
(3) who owns the private semantic binding and the independently re-authored public ledger
contract; and (4) whether the bounded fixture and negative controls can falsify the design.

If and only if Gate 0 is GO, route to bounded Invoke Design. Build Slice A first as a private
semantic fixture. After an Arcanum owner/consumer is named and the public/private gate passes,
build Slice B from entirely synthetic public data to test transport and redaction. Do not implement,
promote definitions, extract private material, or publish. Kill or shrink the proposal if existing
handles answer every registered query or if public utility requires leaking private semantics.
```

## Provenance

- Source refs:
  - `C:/Users/victo/domainspec-lean-formalization/research-domainspec/claim-evidence-proof-model/findings.md`
  - `C:/Users/victo/domainspec-core/Codex/current_conversations/2026-08-24-1114-rtcep-claim-evidence-domainspec-arcanum-value.md`
  - `C:/Users/victo/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
  - current OCGP/OEW and Arcanum contract paths linked from the Robot-Talks record
- Context Builder mode: `standard`, strict obligation-linked selection, authored inline in this handoff
- Inventory resolution: target-local `cyberAlchemy-v2/TO-VLAD/` convention; `SESSION-HANDOFF-cav2-primordial-basis.md` precedent
- Evidence date: `2026-08-24`
- Output path: `cyberAlchemy-v2/TO-VLAD/SESSION-HANDOFF-claim-ground-evaluation-for-domainspec-arcanum.md`

## Gate Result

- Status: `flag`
- Reason: handoff obligations and provenance are covered, and the owner explicitly authorized carrying the prospective recommendation. The flag preserves the research evidence ceiling: no current consumer proves schema necessity; public/private extraction, canonicalization, and implementation remain separately gated.

## Invoke Validation Fixture Result

- Mode: handoff
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: flag
- Mode contract: `arcanum/spells/invoke/handoff.md`
- Outputs: `cyberAlchemy-v2/TO-VLAD/SESSION-HANDOFF-claim-ground-evaluation-for-domainspec-arcanum.md`
- Handoff type: `new-lifecycle-thread`
- Source session: claim/evidence/proof research plus `rtcep-2026-08-24-1114`
- Context Builder coverage: pass for handoff authorship
- Next-session prompt: Vladimir Gate 0 decision, then bounded `invoke design` only on `GO`
- Decisions: recommend the strategic design hypothesis while preserving the research NO-GO on implementation
- Unresolved gaps: consumer necessity, field semantics, D38 intent, public owner, privacy projection, receipt portability
- Next route: owner decision (`GO | DEFER | KILL`) → conditional `invoke design`; `decision-gate` before any public Arcanum fixture or mutation
