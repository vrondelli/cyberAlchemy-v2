# Context Pack - Authority Artifact Lifecycle Placement

Status: pass
Owner: context-builder
Mode: standard
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Task

Refine whether definitions, constitutions, and disciplines lifecycle should live
inside ontology, and how multi-provenance / multi-origin authority artifacts
should be represented in CyberAlchemy v2.

## Obligation Matrix

| Obligation | Required evidence | Status |
| --- | --- | --- |
| O1: Separate ontology representation from lifecycle authority. | ontology boundary and authority boundary files | covered |
| O2: Account for definitions, constitutions, and disciplines as distinct authority kinds. | authority README, definitions, constitution, discipline catalog | covered |
| O3: Account for multiple provenance/origin/source. | import staging, source-ledgered amalgamation, prior relation findings | covered |
| O4: Preserve non-promotion and owner gates. | promotion policy, stable constitution, relation findings | covered |
| O5: Produce next route without mutation. | promotion policy and refine seed write scope | covered |

## Selected Sources

| Source | Selectors | Obligations | Why included |
| --- | --- | --- | --- |
| `cyberAlchemy-v2/ontology/README.md` | status, owner, non-promotion paragraph | O1, O4 | Defines ontology as candidate-map route, not authority owner. |
| `cyberAlchemy-v2/authority/README.md` | authority rule list | O1, O2, O4 | Names the narrow owner surface for terms, rules, practices, decisions, and specs. |
| `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md` | CAV2-C1, CAV2-C2, CAV2-C4, CAV2-C11 | O1, O2, O3, O4 | Gives the local constitution rules for source-ledgered consolidation, layer separation, non-promotion, and import before promotion. |
| `cyberAlchemy-v2/authority/imports/README.md` | import rules | O3, O4 | Establishes source/origin staging before owner-route promotion. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | authority rule, CAV2-D2, CAV2-D3 | O2, O3 | Defines source-ledgered amalgamation and authority layer. |
| `cyberAlchemy-v2/disciplines/DISCIPLINES.md` | growth rule | O2, O4 | Shows disciplines can recommend routes but cannot directly promote. |
| `cyberAlchemy-v2/authority/promotion-policy.md` | promotion ladder and required gates | O2, O4, O5 | Gives the owner route ladder and mutation gates. |
| `cyberAlchemy-v2/development/research/2026-06-21-authority-movement-ontology-relations/findings.md` | corrected relation model, owner matrix | O1, O3, O4, O5 | Supplies the latest relation model and blocks authority-by-proximity. |
| `projects/ontology/ARCHITECTURE.md` | build-from-owned ladder, artifact classes, node eligibility | O1, O3 | Gives the older materialization pattern for source -> evidence -> candidate -> promotion -> projection. |

## Evidence Summary

The covered evidence points to a two-plane model:

1. Ontology plane: represents meanings, source links, candidate branch maps,
   provenance, lifecycle status, and promotion requests.
2. Governance plane: owns artifact lifecycle transitions and promotion through
   definitions-governance, constitution-governance, discipline-governance,
   decision-gate, and `PromotionRecord`.

## Blockers

No evidence blocker for the design answer. Implementation and schema mutation
remain blocked until a later owner route.
