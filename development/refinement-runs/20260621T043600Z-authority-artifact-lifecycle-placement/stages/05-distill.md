# Stage 05 - Distill

Status: pass
Capability: distill
Mode: standard
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Objective And Output Artifact

Distill the broad placement question into the smallest coherent design unit
that can answer it and recompose into CyberAlchemy v2 authority governance.

## Role Conversation Trace

| Role | Verdict | Claim | Reconciliation |
| --- | --- | --- | --- |
| ontology-boundary-critic | KEEP | Ontology may represent lifecycle state and provenance, but must not own lifecycle transitions. | Accepted. This is the boundary rule. |
| lifecycle-governance-designer | KEEP | Definition, constitution, and discipline lifecycles need artifact-specific owner states. | Accepted. This becomes the lifecycle matrix. |
| provenance-model-skeptic | FIX | The hypothesis is right but needs explicit multi-provenance fields and conflict rules. | Accepted as repair input. |

## Smallest Coherent Unit

The smallest coherent unit is an `authority_artifact_lifecycle_envelope`.

Responsibility:

- identify the artifact kind,
- name the authority owner,
- carry lifecycle state,
- carry a set of sources/provenance entries,
- name promotion gate and decision record,
- hold conflict/drift status,
- link to ontology candidates/projections as read-model references.

This is smaller than a full ontology schema and larger than a single provenance
edge. It can answer the user's question without implementing a schema.

## Concept Layer Map

```text
CyberAlchemy v2 authority model
  -> artifact-kind governance routes
    -> authority_artifact_lifecycle_envelope
      -> provenance entries
      -> owner gate / PromotionRecord
      -> ontology refs as read-model/candidate links
```

## Closure And Recomposition Proof

The envelope closes because it has:

- named artifact kind,
- named lifecycle owner,
- status,
- source set,
- conflict/drift owner,
- promotion gate,
- ontology refs as non-authority projections.

It recomposes upward because definitions, constitutions, and disciplines can
each use the same envelope shape while keeping their own lifecycle states,
review rules, and owner gates.

## Deferred Complexity

- No schema file.
- No ontology mutation.
- No ARR promotion.
- No generated projections.
- No source-cluster or import-ledger mutation.

## Verdict

Pass. Use the envelope as the design unit for the next stages.
