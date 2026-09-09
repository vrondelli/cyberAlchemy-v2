# Authority

Status: active local authority surface
Owner: CyberAlchemy v2

This folder owns the project-level rules that future CyberAlchemy v2 artifacts
must obey.

## Surfaces

| Surface | Role |
| --- | --- |
| [imports/README.md](imports/README.md) | Staged import ledgers for scattered repository authority material. |
| [definitions/DEFINITIONS.md](definitions/DEFINITIONS.md) | Canonical local definitions for CyberAlchemy v2 terms. |
| [definitions/DEFINITIONS-INDEX.md](definitions/DEFINITIONS-INDEX.md) | Lookup index and aliases for local definitions. |
| [definitions/DEFINITION-DRIFT-AUDIT.md](definitions/DEFINITION-DRIFT-AUDIT.md) | Drift findings and remediation targets. |
| [definitions/reviews/README.md](definitions/reviews/README.md) | Review-only definition candidates before canonical promotion. |
| [AUTHORITY-MODEL.md](AUTHORITY-MODEL.md) | Owner-facing model for authority kinds, postures, routing, gates, and non-collapse rules. |
| [constitutions/STABLE-REPOSITORY-CONSTITUTION.md](constitutions/STABLE-REPOSITORY-CONSTITUTION.md) | Structure and authority rules for this repository surface. |
| [constitutions/CONSTITUTION-IMPORT-PACK.md](constitutions/CONSTITUTION-IMPORT-PACK.md) | Composition pack over imported constitution and definition candidates. |
| [constitutions/VAULT-CONCEPT-ADOPTION-CONSTITUTION.md](constitutions/VAULT-CONCEPT-ADOPTION-CONSTITUTION.md) | Rules for re-authoring imported vault value concepts into CyberAlchemy v2 authority. |
| [boundaries.md](boundaries.md) | Public/private, source/read-model, generated/canonical, and research/spec boundaries. |
| [promotion-policy.md](promotion-policy.md) | How evidence can become local authority or implementation work. |
| [decisions/](decisions/README.md) | Promotion, boundary, and product/philosophy decision records. |

## Authority Rule

Authority lives in the narrowest responsible surface:

1. Terms live in definitions.
2. Structural rules live in constitutions.
3. Cross-capability practices live in disciplines.
4. Promotion choices live in decisions.
5. Specs own product or runtime contracts only after promotion.

Research, inventory, ontology, observability, and ops may provide evidence and
explanation. They do not become authority without the appropriate owner route.

## Open Questions

### OQ-1. Should this authority model mirror Arcanum exactly?

Context: Arcanum is a source pattern, but CyberAlchemy v2 is a repository
surface with product, method, and implementation ambitions. Recommendation:
borrow authority separations, not folder names blindly. Resolved in
[AUTHORITY-MODEL.md](AUTHORITY-MODEL.md). Status: RESOLVED.
