---
decision_id: DEC-GCP-002
status: accepted
created: 2026-07-20
resolved_at: 2026-07-20T18:08:54Z
target: graph-composability-and-test-derivation-proof
owner: user
decision_gate: pass
consumer: cyberAlchemy-v2/development/interactive-ontology-learning-map
---

# Decision: How Does IOLM Participate In The DomainSpec Proof?

## Requirement From The User

Use the private Interactive Ontology Learning Map under
`cyberAlchemy-v2/development/interactive-ontology-learning-map/` as a real proof
surface for DomainSpec graph composability and test derivation work.

This record decides the IOLM proof role. It does not decide whether IOLM is used;
that is already required.

## Blocked Consequential Work

The current EVF work-pack selects a small key-and-door
`Rule --enforces--> Operation` witness for the first executable proof. The
backend completeness plan independently names IOLM as a downstream consumer of
fresh graph, obligation, test, execution, and receipt handles.

IOLM currently proves only its candidate posture/provenance contract. It has no
compiled candidate graph, no parity views, and no authored runnable predicate,
fixture, binding, evaluator, or semantic execution receipt. Its selected graph
task is also blocked because the live minted compiler rejects cross-feature
edges.

Changing IOLM from consumer proof to the primary executable proof would change
both project work-packs, evidence scopes, and task ordering. That mutation must
not happen until the role is explicit.

## Blocker Question

Which proof role should IOLM own?

## Options

### 1. Two-proof chain: small executable core plus IOLM consumer proof — recommended

Keep `SWU-GCP-001` as the smallest executable proof of graph -> obligation ->
TestCase -> binding -> evaluator -> receipt. Then feed its exact handles, and
later the full BTE core handles, into IOLM's candidate/authoritative adapter and
prove unchanged IDs, provenance, semantic bytes, learner/navigation separation,
and graph/hierarchy/table parity.

- Benefit: IOLM is used in a real application without making the UI/read-model
  owner define test semantics or engine completeness.
- Cost/risk: two receipts are required. `DEC-GCP-001` still needs an answer, and
  IOLM's cross-feature decision remains independently blocking its candidate
  graph.
- Choose when: both executable test derivation and real consumer composability
  must be proven without collapsing their owners.
- Downstream impact: preserve the EVF atomic SWU, add an explicit IOLM consumer
  handoff/receipt after core proof, and keep IOLM inside private
  `cyberAlchemy-v2/`.

### 2. IOLM becomes the single combined executable witness

Replace key-and-door as the primary proof with an IOLM-owned witness, most
plausibly Financial Settlement:
`NoDuplicateMakeupRule --enforces--> GenerateSettlement`. Add an authored formal
predicate and fixtures, compile it through the minted graph, bind it to a real
implementation, evaluate it, receipt it, and project the same stable IDs into
IOLM views.

- Benefit: one end-to-end story proves both test derivation and consumption in
  the actual knowledge-graph application.
- Cost/risk: IOLM currently describes Financial Settlement only as a positive
  learner fixture and explicitly separates it from runtime/business
  conformance. This option widens the IOLM scope, requires EVF and IOLM plan
  refreshes, a new bounded implementation SWU, and a formal-source decision.
- Choose when: a single integrated demonstrator is worth the larger first proof
  and slower feedback.
- Downstream impact: supersede the key-and-door-specific handoff, redesign L0
  task ownership, and do not resume implementation until the refreshed plans
  pass review.

### 3. IOLM supplies structural graph proof only; test derivation stays separate

Use IOLM's L0C candidate graph, deterministic compile, posture guard, and parity
views as the first graph-composability witness. Record executable test derivation
as a separate unresolved proof.

- Benefit: directly exercises the named private application and its graph/view
  non-collapse laws.
- Cost/risk: does not prove obligation derivation, runnable tests, binding,
  evaluation, mutation sensitivity, or semantic receipts. IOLM 00C-B also stays
  blocked until its cross-feature decision is resolved.
- Choose when: structural graph/read-model composability is the immediate goal
  and test derivation may remain blocked.
- Downstream impact: split the claimed result explicitly; no S1 or backend test
  completeness claim may follow from the IOLM receipt.

### Explain / more context

This is non-committal. Expand the evidence, reversibility, and concrete artifact
changes for the three options, then ask the same decision again.

## Recommendation

Choose option 1. It uses IOLM as a real consumer proof while preserving the
independent executable core needed to establish test derivation. The two receipts
prove different things and can fail independently:

1. the core receipt proves that authored semantics caused an implementation
   verdict; and
2. the IOLM receipt proves that a real private knowledge-graph application can
   consume and project the exact graph/evidence handles without semantic drift or
   authority collapse.

This recommendation does not choose the option for the user.

## Source Evidence

- `projects/domainspec-v2/development/evolvable-validation-framework/DESIGN.md`
  — four planes and graph-to-receipt contracts.
- `projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md`
  — atomic `SWU-GCP-001` and downstream breadth/consumer handoff.
- `projects/domainspec-v2/development/evolvable-validation-framework/decisions/2026-07-20-key-and-door-formal-source.md`
  — current missing-predicate blocker.
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/SPEC.md`
  — read-only DomainSpec graph consumer boundary and FPR-02B handoff.
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md`
  — two-posture adapter, immutable views, and non-collapse validation.
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/IMPLEMENTATION-LAYERING.md`
  — L0C candidate substrate and later L0A authority rebind.
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/operations.md`
  — projection operations without a formal executable business predicate.
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md`
  — independent cross-feature compiler blocker.
- `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md`
  — IOLM as an independently governed downstream consumer proof surface.

## Decision Record

- Selected option: 1 — two-proof chain: small executable core plus IOLM
  consumer proof
- Rationale: preserve an atomic, independently evaluated test-derivation receipt
  while using IOLM as the real private application that consumes and projects
  the exact graph/evidence handles without semantic drift or authority collapse
- Source of decision: user selected `1` in the Decision Gate conversation on
  2026-07-20
- Remaining blockers: 0 for this gate
- Related independent blockers:
  - `DEC-GCP-001`, authored formal predicate source for the current core witness;
  - `DEC-CAV2-IOLM-00C-B-CROSS-FEATURE-001`, IOLM candidate cross-feature graph.
- Deferred decisions:
  - exact IOLM journey and screen that presents the imported receipt;
  - authoritative L0A rebind after `G-DSV2-SG`;
  - public derivative and production host.
- Assumptions:
  - "IOL" means the Interactive Ontology Learning Map at the path above;
  - the proof remains private inside `cyberAlchemy-v2/`;
  - candidate evidence cannot claim FPR, release, ontology, or production
    authority.
