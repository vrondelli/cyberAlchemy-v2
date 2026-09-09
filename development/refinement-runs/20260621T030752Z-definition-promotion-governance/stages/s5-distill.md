# Distill: Coherent Mechanism

Status: pass
Capability: `distill`
Mode: `standard` with tournament-shaped comparison
Dispatch step: `s5`

## Distill Result

- Target context: CyberAlchemy v2 definition governance across source clusters,
  towers, local definitions, and origin references.
- Objective and output artifact: select the smallest coherent mechanism that
  explains upward promotion and origin reference together.
- Mode and budget: standard; three proposal tracks, one reconciliation pass.
- Proposal tracks: definition-first, constitution-first, mixed-protocol.
- Recursive rounds: 1/2; closure reached without needing another round.
- Verdict: pass.
- Current smallest coherent unit: `definition elevation protocol`.
- Optimization point: small enough to route through governance, large enough to
  include both promotion and anti-drift.
- Next route: invoke design.

## Proposal Tracks

| Track | Claim | Objection | Reconciliation |
| --- | --- | --- | --- |
| definition-first | Promote `definition elevation protocol` as a canonical CAV2 definition first. | Risks enforcing a mechanism before structural behavior is clear. | Keep as candidate next route; do not promote inside Refine. |
| constitution-first | Add a structural rule before defining a term. | Risks constraining artifacts before term semantics are stable. | Defer structural enforcement until the mechanism is defined and reviewed. |
| mixed-protocol | Design a protocol with definition, relation profile, promotion record, and origin reference surfaces. | More moving parts. | Selected because it preserves both lanes without canonical mutation. |

## Selected Unit

Name: `definition elevation protocol`

Responsibility:

Hold the route by which source-owned definitions represented inside v2 may
become local CyberAlchemy v2 authority through adaptation, while preserving
origin links, drift state, owner gates, and non-authority boundaries.

## Concept Layer Map

| Layer | Role |
| --- | --- |
| Source definition | Original source authority. |
| Source-cluster row | Local representation and search/Craft routing. |
| Adaptation candidate | Proposed tower-scoped semantic delta. |
| Promotion gate | Owner decision for local authority. |
| Local canonical definition | CyberAlchemy v2 authority after promotion. |
| Origin reference ledger | Back-reference, drift state, and promotion record. |
| Constitution rule | Optional structural rule if future artifacts must obey the protocol. |

## Recomposition Proof

The selected unit recomposes into existing CyberAlchemy v2 surfaces:

- `DEFINITION-LOCALIZATION-ROUTE.md` gets a clearer mechanism for when a local
  representation becomes a local adaptation.
- `source-clusters/*.md` can gain non-canonical origin reference rows.
- `DEFINITIONS.md` remains the only local canonical definition source.
- `promotion-policy.md` remains the ladder and gate map.
- `DEFINITION-DRIFT-AUDIT.md` can review drift without becoming authority.
- `constitution-governance` can later decide whether the protocol becomes a
  structural rule.

## Deferred Complexity

- No full schema file for origin reference ledger yet.
- No new canonical CAV2 definition yet.
- No constitution rule yet.
- No source-cluster mutation yet.
- No inventory or ontology promotion behavior.

## Tension Ledger

| Tension | Status | Handling |
| --- | --- | --- |
| Promotion needs a path but not premature canon. | resolved | Use protocol artifact now; route canon later. |
| Source-cluster rows must be local but not authoritative. | resolved | Keep representation and origin references non-canonical. |
| A higher tower must not be prestige naming. | resolved | Require named tower need and semantic delta. |
| Relationship fields may become a schema. | deferred | Route later through definitions/constitution governance if needed. |

## Receipt

```yaml
dispatch_id: 20260621T030752Z-definition-promotion-governance
step_id: s5
capability_ref: distill
mode: standard
status: pass
artifact: stages/s5-distill.md
validation: selected unit closes and recomposes
observer_status: not_emitted
blockers: []
residue:
  - schema materialization deferred
  - canonical definition deferred
handoff_note: design the protocol as a non-canonical mechanism with later owner routes
```
