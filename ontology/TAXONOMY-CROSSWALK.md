# Taxonomy Crosswalk

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

This crosswalk classifies ontology package objects through the Arcanum/DomainSpec
meta-type vocabulary. It is explanatory. DS-D1 remains normative in
[../../arcanum/definitions/DEFINITIONS.md](../../arcanum/definitions/DEFINITIONS.md)
and is explained by
[../../arcanum/definitions/TAXONOMY.md](../../arcanum/definitions/TAXONOMY.md).

## Crosswalk Rules

1. Classify for review and navigation only.
2. Prefer the narrowest DS-D1 meta-type that fits the current use.
3. If wording here conflicts with DS-D1, DS-D1 wins.
4. If an object needs a new type, route it through definitions-governance.
5. Classification does not promote the object.

## Candidate Object Crosswalk

| Ontology object | Object role/view | DS-D1 meta-type | Source evidence | Promotion state | Owner/gate | Notes/residue |
| --- | --- | --- | --- | --- | --- | --- |
| Authority Artifact Lifecycle Envelope | Workflow/evidence rail | Workflow | [../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md](../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md) | candidate model | owning governance route | The envelope is not a new authority-harness object. |
| Promotion Gate | Decision boundary | Policy | [../authority/promotion-policy.md](../authority/promotion-policy.md) | active local policy concept | relevant owner route | Gate may pass, flag, block, defer, or reject. |
| PromotionRecord-compatible Decision | Decision record | Event or State Machine, context-dependent | [../development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md](../development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md) | candidate | owner route | Exact artifact shape remains owner-routed. |
| Authority Kind | Classification model | Enum / Type | [AUTHORITY-KINDS.md](AUTHORITY-KINDS.md) | candidate | definitions-governance before canon | Not a vault `node_type`. |
| Authority Posture | Reliance model | Enum / Type | [AUTHORITY-POSTURES.md](AUTHORITY-POSTURES.md) | candidate | definitions-governance before canon | Not confidence or tag authority. |
| Ontology Projection | Read model | View Model / Mapping | [projections/README.md](projections/README.md) | candidate projection | ontology route plus owner permission | Projection cannot change authority. |
| Promotion Request | Staged request | Workflow | [promotion-requests/README.md](promotion-requests/README.md) | candidate | relevant owner route | Request is not verdict. |
| Ledger as Primitive witness | Review workflow witness | Workflow | [../development/research/2026-06-21-ontology-package-consolidation-model/findings.md](../development/research/2026-06-21-ontology-package-consolidation-model/findings.md) | candidate/deferred | definitions-governance | This row classifies the review workflow, not canonical ledger meaning. |
| Residue | Unpreserved structure | Value Object or Event, context-dependent | [../authority/definitions/DEFINITIONS.md](../authority/definitions/DEFINITIONS.md) | active local definition | owner route named by residue | Residue type determines next owner. |

## Gate Result

Status: flag

Reason: the crosswalk is useful for package navigation, but new vocabulary still
requires definitions-governance before canonical use.
