# ORODI Successor Architecture Review

Status: candidate review. Authority and implementation effects: none.

## Verdict

The successor preparation is coherent and dependency-closed for owner review. It resolves the language-to-DomainSpec type gap without rewriting frozen candidates or current implementation bytes. It is ready for the five named decisions, not for graph materialization or implementation migration.

## Findings

### F1 — The missing model surface is six nodes, not five Value Objects

The implementation language exposed six support expressions. DomainSpec’s identity discriminator changes their correct split:

- `OperationalObservation` is an Entity because `observation_id` is designated identity and control receipts refer to it.
- `EvaluationClaim` is an Entity because `claim_id` is designated identity and evaluation output refers to it.
- `TelemetryAccounting`, `ControlReceipt`, `OperationalEvaluationBundle`, and `OperationalEvaluationReceipt` are Value Objects because they have no designated identity and are equal by fields.

All six pass the repository’s current DomainSpec formation engine. Treating the first two as Value Objects would collapse identity into field equality and produce the wrong implementation contract.

### F2 — The profile amendment is minimal

The frozen ORODI development profile already supports Entity, Rule, Operation, and Event. The successor needs to add only `Value Object`; it introduces no guessed relationship signatures. The proposed graph therefore grows from 32 to 38 nodes while retaining 31 edges until a relationship decision is made.

### F3 — Immutable Product Capability records should not be rewritten merely to add realization bindings

The capability manifest’s identity rule says interface, realization, implementation, and evidence changes do not rewrite Product Capability identity. The preferred successor is therefore a separate exact definition-binding manifest that preserves the six capability IDs. New capability IDs are justified only if an owner changes product outcome, scope, or owner boundary.

This refines the earlier recommendation to create successor capability candidates: successor binding evidence is required, but successor identity is conditional rather than automatic.

### F4 — The current business-ontology and DomainSpec candidates remain frozen predecessors

Candidates `001` predate the Definition Pack and Ubiquitous Language. They remain valid historical candidates but cannot be edited into definition-complete records. Decisions 1 and 2 must produce exact predecessor bindings before a business-ontology `002` can be reviewed; DomainSpec `002` follows that admission.

### F5 — The implementation migration can be backward compatible

The code already separates structural decoding as `decodeOperationalEvaluationBundle`. The smallest migration is therefore:

1. introduce `evaluateOperationalEvidenceBundle` and preserve `validateOperationalEvidence` as a compatibility alias;
2. introduce `OperationalEvaluationReceipt` and preserve `OperationalEvaluationResult` as a compatibility alias;
3. add a successor receipt schema and `evaluate` CLI verb while retaining current schema and command behavior;
4. retire aliases only through a later breaking-change decision.

No current implementation file needs mutation before the semantic chain is admitted.

### F6 — Current evidence is healthy but does not grant progression

The definition, language, ontology, and capability validators pass, and the focused operational-evidence test suite passes 20/20. These results establish a stable baseline and candidate consistency. They do not record any of the five owner decisions, materialize the 38-node graph, or prove conformance to it.

## Decision order

1. Definitions-governance owner: disposition the exact 17-definition pack.
2. Craft Product owner: decide the six immutable Product Capability identities and definition-binding strategy.
3. Craft ORODI Business Ontology owner: decide a definition-complete successor ontology.
4. DomainSpec language/profile owner: decide the profile and six-node source amendment, then authorize deterministic materialization.
5. Operational-resilience implementation owner: decide the compatibility migration after the successor graph exists.

## Claim ceiling

This review supports owner decisions only. It does not promote definitions, adopt Product Capabilities, admit an ontology or profile, compile a successor graph, authorize implementation, establish conformance or runtime truth, publish, release, commission, or deploy.
