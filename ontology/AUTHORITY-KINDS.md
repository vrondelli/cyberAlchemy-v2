# Authority Kinds

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

Authority kinds classify what sort of authority artifact or candidate is being
modeled. They help route review. They are not vault `node_type` values and do
not make anything canonical.

## Kind Contract

| Field | Meaning |
| --- | --- |
| `kind_id` | Local identifier. |
| `label` | Human-readable kind. |
| `owner_route` | Governance route that owns promotion. |
| `authority_surface` | Where the artifact counts if promoted. |
| `candidate_inputs` | Evidence or candidates that may feed the kind. |
| `forbidden_collapse` | What this kind must not be confused with. |

## Candidate Kinds

| Kind ID | Label | Owner route | Authority surface | Forbidden collapse |
| --- | --- | --- | --- | --- |
| `kind.definition` | Definition | definitions-governance | `authority/definitions/DEFINITIONS.md` | Not glossary usage or ontology naming. |
| `kind.constitution` | Constitution | constitution-governance | `authority/constitutions/` | Not any structural preference. |
| `kind.discipline` | Discipline | discipline-governance | `disciplines/` | Not one-off work style. |
| `kind.decision` | Decision | decision-gate | `authority/decisions/` when created | Not unresolved discussion. |
| `kind.spec` | Spec | spec owner / decision-gate | `specs/` after promotion | Not research finding. |
| `kind.runtime_contract` | Runtime Contract | task-session after owner gates | `implementation/` or generated surface contract | Not generated mirror output. |
| `kind.projection` | Projection | ontology route plus source owner | `ontology/projections/` or generated read model | Not promotion. |
| `kind.evidence` | Evidence | source/inventory owner | source, inventory, validation, observability | Not authority by itself. |
| `kind.residue` | Residue | route named by residue type | gap ledger, Craft, or owner route | Not defect by default. |

## Use Rule

Use authority kinds to route a candidate to the correct owner. Do not use them
to decide the candidate.

## Promotion Note

If one of these kinds becomes load-bearing across CyberAlchemy v2, route the
term through definitions-governance before treating it as canonical vocabulary.
