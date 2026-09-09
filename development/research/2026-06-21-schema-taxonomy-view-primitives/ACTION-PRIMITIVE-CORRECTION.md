---
tags: [cyberalchemy-v2, schema, classification, taxonomy, human-view, machine-view, primitive-lifecycle, action-method, constitution-governance, definitions-governance]
node_type: correction
is_session: false
layer: knowledge-governance
nature: decision
status: candidate
created: 2026-06-21
dispatch_id: 2026-06-21-schema-taxonomy-view-primitives
dispatch_type: research
working_folder: cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/
sources: [cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/findings.md, cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/AUDIT.md]
---

# Action Primitive Correction

This post-audit operator correction narrows the interpretation of the accepted
finding.

Canonical local definition: [CAV2-D21: Four-Facet Action Method](../../../authority/definitions/DEFINITIONS.md#cav2-d21-four-facet-action-method).

The prior phrase "promotion-readiness" is too narrow. The intended CyberAlchemy
primitive is an **action method**: every governed action must account for
taxonomy/classification, schema, human-continuation view, and machine-checkable
view.

Promotion is only the stricter downstream case. The base rule applies earlier:
before or during an action, the action must either instantiate an existing facet,
create the needed facet, or record typed residue with owner route, rationale,
and action/promotion effect.

## Corrected Rule

No governed CyberAlchemy action may proceed silently without the four action
facets:

- classification/taxonomy: what kind of thing/action is this?
- schema: what shape governs the action or artifact?
- human-continuation view: how can a human understand status, trust boundary,
  blockers, next route, and evidence?
- machine-checkable view: how can a machine parse/check the action state,
  source, validation/proof handle, projection status, and residue?

If a facet is absent or impossible, the action must declare typed residue. The
residue must name the missing facet, owner route, rationale, and whether the
action may continue, must defer, or must block.

## Why Enforcement Is Valid

Enforcement is valid because the rule is not "complete every facet perfectly
before doing anything." It is "no silent action." The system may act by creating
the missing taxonomy/schema/view, by binding an existing one, or by recording a
typed impossibility/residue lane. This avoids deadlock while still making the
four facets constitutional action obligations.

## Revised Next Route

Route the next slice to `constitution-governance` and `definitions-governance`:

- define the action primitive in three voices;
- draft a `Four-Facet Action Constitution`;
- state the action axioms;
- define the minimal action-facet envelope and typed-residue grammar;
- add examples and negative controls before any validator claims enforcement.
