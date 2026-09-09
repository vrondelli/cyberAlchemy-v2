# Node Model

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

This file defines candidate ontology concepts for authority objects in the
CyberAlchemy base. These concepts are not live vault `node_type` values and do
not amend any schema.

## Node Concept Contract

Every candidate node concept must record:

| Field | Required | Meaning |
| --- | --- | --- |
| `concept_id` | yes | Local stable identifier. |
| `label` | yes | Human-readable name. |
| `concept_role` | yes | Authority object, evidence object, workflow object, projection object, or residue object. |
| `source_refs` | yes | Concrete paths supporting the concept. |
| `owner_route` | yes | Owner route for promotion or mutation. |
| `candidate_status` | yes | candidate, reviewed-candidate, deferred, blocked, or projected. |
| `confidence` | yes | Top-level node confidence using `evidence_confidence` and `commitment_confidence`; not a challenge threshold. |
| `challenge_contract` | yes | How this concept may be challenged, contradicted, validated, blocked, or routed for review. |
| `residue` | optional | The node's own unresolved remainder; not challenge-contract residue routing. |
| `forbidden_collapse` | yes | What this concept must not be confused with. |

`challenge_contract` is defined by
[`CAV2-D40`](../authority/definitions/DEFINITIONS.md#cav2-d40-challenge-contract).
It is not a third confidence axis. It binds existing challenge-response,
`contradicts`, `validates`, owner-route, blocking-question, and challenge
residue-routing semantics into one explicit protocol field. Node confidence and
node residue remain sibling properties.

Minimum shape:

```yaml
confidence:
  evidence_confidence:
  commitment_confidence:
challenge_contract:
  challenge_response:
  valid_challenge_modes:
    - evidence
    - contradiction
    - owner_review
  contradiction_edges:
  validation_edges:
  owner_route:
  resolution_gate:
  blocking_questions:
  challenge_residue_route:
residue:
```

The compact table below lists the initial concept set and collapse boundaries.
Full node records must expand the top-level `confidence` and the
`challenge_contract` before the concept can move beyond candidate modeling.

## Initial Node Concepts

| Concept ID | Label | Concept role | Owner route | Forbidden collapse |
| --- | --- | --- | --- | --- |
| `concept.definition` | Definition | authority object | definitions-governance | Not a local definition unless promoted in `authority/definitions/DEFINITIONS.md`. |
| `concept.constitution` | Constitution | authority object | constitution-governance | Not an enforceable rule unless promoted. |
| `concept.discipline` | Discipline | authority object | discipline-governance | Not an active practice unless cataloged and hardened. |
| `concept.decision` | Decision | authority object | decision-gate | Not a human decision record by itself. |
| `concept.spec` | Spec | authority object | spec owner / decision-gate | Not a runtime contract until promoted. |
| `concept.promotion_gate` | Promotion Gate | workflow object | relevant owner route | Not the verdict. |
| `concept.promotion_record` | PromotionRecord-compatible Decision | workflow object | relevant owner route | Not the authority artifact it approves. |
| `concept.authority_envelope` | Authority Artifact Lifecycle Envelope | workflow object | owning governance route | Not a new harness object. |
| `concept.inventory_evidence` | Inventory Evidence | evidence object | inventory route | Not source authority. |
| `concept.ontology_projection` | Ontology Projection | projection object | ontology route plus owner permission | Not promotion by proximity. |
| `concept.ledger_event` | Ledger Event | evidence object | authority-ledger owner | Not a graph node or movement edge today. |
| `concept.residue` | Residue | residue object | route named by residue type | Not proof of novelty or automatic promotion. |

## Node Status Axis

`candidate_status` is package workflow state. It must not collapse into vault
maturity `status`.

Allowed values for this package slice:

- `candidate`
- `reviewed-candidate`
- `deferred`
- `blocked`
- `projected`

## Gate Result

Status: flag

Reason: node concepts are useful and source-backed, but live vault `node_type`
changes remain schema-evolution work.
