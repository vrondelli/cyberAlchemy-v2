# Lifecycle Model

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

This file is a candidate `CAV2-D23` lifecycle-axis separation model for ontology
use. It does not create a lifecycle schema and does not move lifecycle ownership
into ontology. Ontology may carry authorized read-model projections, but it does
not own lifecycle verdicts.

## Lifecycle Separation

| Axis | Lives on | Owner | Notes |
| --- | --- | --- | --- |
| Workflow state | authority artifact lifecycle envelope | owning governance route | Tracks review and promotion flow. |
| Vault maturity status | vault node, when applicable | vault/schema owner | Separate from workflow state. |
| Promotion verdict | owner decision / PromotionRecord-compatible record | owner route | Pass, flag, block, defer, reject, or supersede. |
| Projection state | ontology projection row | ontology route plus owner permission | Read model only. |

## Candidate Workflow States

| State | Meaning | Allowed next states |
| --- | --- | --- |
| `source-evidence` | Source material exists in its original home. | `import-candidate`, `inventory-candidate` |
| `import-candidate` | Path-level authority material is staged. | `inventory-candidate`, `ontology-candidate`, `local-authority-proposal` |
| `inventory-candidate` | Source-backed lookup or evidence card exists. | `ontology-candidate`, `context-pack` |
| `ontology-candidate` | Candidate meaning, relation, confidence, and owner route are modeled. | `definition-proposal`, `constitution-proposal`, `decision-proposal`, `spec-proposal`, `deferred`, `blocked` |
| `review-candidate` | Owner route accepted review scope. | `active`, `deferred`, `blocked`, `rejected` |
| `active` | Owner route promoted the artifact in its authority surface. | `drift-flagged`, `superseded`, `deprecated` |
| `drift-flagged` | Conflict or stale usage needs owner review. | `active`, `superseded`, `deprecated`, `blocked` |
| `superseded` | A newer authority artifact replaced this one. | `deprecated` |
| `deprecated` | Artifact should no longer guide new work. | none except explicit owner reopening |

These states are a candidate model. They do not bind current artifact schemas.

## Typed-Hole Rule

The shared envelope may carry status, sources, promotion handle,
challenge contract, conflicts, drift owner, and ontology refs. The owner
profile produces the verdict.

```text
shared rail -> owner profile -> verdict
```

Ontology may represent the rail and projection. It must not fill the verdict
hole.

## Multi-Provenance Rule

Many sources may support one authority artifact. The owner route decides the
canonical synthesis. Ontology may show the support graph and residue.

## Deferred Work

| Work | Reason | Owner |
| --- | --- | --- |
| Live lifecycle schema | Would constrain artifacts. | schema governance / constitution-governance |
| Movement edge lifecycle | Current edge law does not admit it. | schema governance |
| Authority-ledger validator | Missing append-only authority movement validator. | authority-ledger owner |
