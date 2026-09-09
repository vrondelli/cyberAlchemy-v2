# Distill Repair

Status: pass
Capability: `distill`
Mode: `validate`
Dispatch step: `s8`

## Distill Result

- Target context: design after `refine-design-review`.
- Objective and output artifact: repair and validate the mechanism before
  non-executed planning.
- Mode and budget: validate.
- Proposal tracks: one repaired mixed-protocol track.
- Recursive rounds: 1/1.
- Verdict: pass.
- Current smallest coherent unit: `definition elevation protocol`.
- Optimization point: keep one protocol with two appendable ledgers rather than
  splitting promotion and origin reference into unrelated mechanisms.
- Next route: invoke plan.

## Accepted Repair

The design remains coherent if the protocol is expressed as three layers:

1. **Representation layer**: source-cluster row, import candidate, inventory
   selectors, ontology candidates. These are evidence and routing surfaces.
2. **Promotion layer**: adaptation candidate, semantic delta, owner gate,
   promotion record, local definition.
3. **Reference layer**: origin reference record, drift status, boundary review,
   back-reference to promoted local adaptation.

The repair keeps these layers separate while allowing typed relations across
them.

## Closure Check

| Check | Result |
| --- | --- |
| Responsibility is singular. | pass: govern definition elevation. |
| Inputs and outputs are named. | pass: source refs, candidates, gate records, origin refs. |
| Abstraction level is explicit. | pass: governance mechanism, not implementation. |
| Recomposition into tower map works. | pass. |
| No hidden glue. | pass: typed relations carry cross-layer dependencies. |
| No smuggled future scale. | pass: schema and constitution are deferred. |
| Meaning survives further split? | no; splitting loses the promotion/reference coupling. |

## Repaired Relation Groups

| Group | Relations |
| --- | --- |
| Source representation | `represents_source_definition`, `preserves_source_authority` |
| Local adaptation | `adaptation_candidate_of`, `semantic_delta_from`, `specializes_for_tower` |
| Promotion | `requires_promotion_gate`, `promoted_as_local_authority` |
| Origin reference | `origin_backreference_for`, `drift_checked_against` |
| Boundary and rule routing | `blocked_by_boundary_review`, `structural_rule_candidate_for` |

## Validation Verdict

Pass. The design can move into a non-executed plan because it:

- preserves source authority;
- blocks source-cluster-as-canon drift;
- makes semantic deltas explicit;
- records origin references after promotion;
- routes structural behavior to constitution-governance;
- keeps inventory and ontology out of canonical promotion.

## Receipt

```yaml
dispatch_id: 20260621T030752Z-definition-promotion-governance
step_id: s8
capability_ref: distill
mode: validate
status: pass
artifact: stages/s8-distill-repair.md
validation: repaired unit closes and recomposes
observer_status: not_emitted
blockers: []
residue:
  - later owner route must choose exact artifact/schema placement
handoff_note: plan the governance mutations as next routes, not as this Refine run
```
