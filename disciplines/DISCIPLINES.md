# CyberAlchemy v2 Discipline Catalog

Status: candidate
Owner: CyberAlchemy v2

This catalog formalizes recurring project practices that should guide the
stable repository surface without becoming definitions, constitutions, specs,
or implementation by themselves.

## Catalog

| ID | Discipline | Status | Steward | Evidence | Next hardening move |
| --- | --- | --- | --- | --- | --- |
| `stable-repository-stewardship` | Stable repository stewardship | candidate | CyberAlchemy v2 authority owner | [Stable repository stewardship card](cards/stable-repository-stewardship.md) | Harden through [Stable Repository Constitution](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md) and owner review. |
| `artifact-tree-admission` | Artifact tree admission | candidate | CyberAlchemy v2 authority owner | [Artifact tree admission card](cards/artifact-tree-admission.md) | Route a private artifact-admission amendment through `constitution-governance`, reusing `CAV2-C7` and `CAV2-C14`; then add an admission template and deterministic validator. |
| `provisional-model-stewardship` | Provisional model stewardship | candidate | CyberAlchemy v2 authority owner | [Provisional model stewardship card](cards/provisional-model-stewardship.md) | Route a private model-frame clause (frame status + recorded completeness probe + derivation context) through `constitution-governance`; make the completeness probe a validator surface. Do not edit the public CyberAlchemy method. |
| `tracking` | Tracking (governance-lifecycle ledger) | candidate | CyberAlchemy v2 authority owner | [Tracking card](cards/tracking.md) | Harden via (a) the SMT/FOL non-collapsing-discipline validator (validator route, OQ-1-gated) and (b) a validating constitution rule (`constitution-governance`); depends on the deferred `ledger` primitive. Scope-pinned to authority-lifecycle state (NOT Craft work). |

## Status Meanings

| Status | Meaning |
| --- | --- |
| `candidate` | Useful practice exists, but authority and validation are still being proven. |
| `active-pattern` | Practice is already used by active artifacts, but its discipline-level contract is not canonical. |
| `implemented` | Working repository support exists, but may still need discipline-level rules. |
| `canonical` | Accepted authority with validator or constitution support. |
| `deprecated` | Superseded or withdrawn. |

## Growth Rule

Promote a discipline only when the next route names owner, evidence, validation
surface, and mutation boundary. Discipline evidence can recommend a route, but
it cannot directly promote ontology, definitions, constitutions, specs,
capabilities, or implementation work.
