# Refine Result: Definition Promotion Governance

Status: pass
Verdict: completed Refine run
Run id: `20260621T030752Z-definition-promotion-governance`
Target: `cyberAlchemy-v2/authority/definitions/`

## Final Synthesis

The mechanism is **definition elevation by typed adaptation**.

A source definition does not go to a higher CyberAlchemy v2 tower by relocation,
copying, or inheritance-by-proximity. It goes higher only when CyberAlchemy v2
creates a distinct local adaptation candidate that:

1. points back to the source definition;
2. names the tower-level need;
3. states the local semantic delta;
4. passes the right owner gate;
5. records an origin back-reference and drift state.

For the concrete `schema` example, Arcanum `DEF-ARC-SCHEMA` remains Arcanum
authority. CyberAlchemy v2 may represent it locally, and may later define a
local adaptation such as `authority schema` or `tower schema`, but only if
definitions-governance promotes that local semantic delta. The Arcanum
source-cluster row can then carry a non-canonical origin reference to the local
adaptation.

## Stage Evidence

| Stage | Verdict | Artifact |
| --- | --- | --- |
| Context Builder evidence baseline | pass | [stages/s1-context-builder.md](stages/s1-context-builder.md) |
| Invoke Define | pass | [stages/s2-invoke-define.md](stages/s2-invoke-define.md) |
| Interrogation refine-review | pass | [stages/s3-refine-review.md](stages/s3-refine-review.md) |
| Research decision | pass | [stages/s4-research-decision.md](stages/s4-research-decision.md) |
| Distill | pass | [stages/s5-distill.md](stages/s5-distill.md) |
| Invoke Redefine / Design | pass | [stages/s6-invoke-design.md](stages/s6-invoke-design.md) |
| Interrogation refine-design-review | pass | [stages/s7-design-review.md](stages/s7-design-review.md) |
| Distill Repair | pass | [stages/s8-distill-repair.md](stages/s8-distill-repair.md) |
| Invoke Plan | pass | [stages/s9-invoke-plan.md](stages/s9-invoke-plan.md) |
| Final Interrogation and Synthesis | pass | [stages/s10-final-synthesis.md](stages/s10-final-synthesis.md) |

## Subagent Evidence

| Lane | Verdict | Artifact |
| --- | --- | --- |
| Upward promotion by adaptation | pass | [stages/subagents/novelty-upward-promotion-receipt.md](stages/subagents/novelty-upward-promotion-receipt.md) |
| Origin reference and anti-drift | pass | [stages/subagents/novelty-origin-reference-receipt.md](stages/subagents/novelty-origin-reference-receipt.md) |

## Selected Protocol Shape

```text
source definition
  -> source-cluster row
  -> adaptation candidate
  -> promotion gate
  -> local canonical definition
  -> origin reference ledger
  -> drift audit / constitution rule if needed
```

## Required Relation Profile

| Relation | Role |
| --- | --- |
| `represents_source_definition` | Local row points to source definition. |
| `adaptation_candidate_of` | Local candidate names source definition. |
| `semantic_delta_from` | Local candidate states its difference from source. |
| `specializes_for_tower` | Local candidate names higher-tower need. |
| `requires_promotion_gate` | Candidate routes to owner gate. |
| `promoted_as_local_authority` | Promotion record points to local canonical definition. |
| `origin_backreference_for` | Origin reference points to promoted local adaptation. |
| `drift_checked_against` | Origin reference records latest source comparison. |
| `blocked_by_boundary_review` | Contested cases route to decision-gate. |
| `structural_rule_candidate_for` | Reusable rule routes to constitution-governance. |

## Recommended Next Routes

1. `definitions-governance`: decide whether `definition elevation protocol`
   becomes a canonical CyberAlchemy v2 definition.
2. `constitution-governance`: decide whether upward promotion and origin
   reference become a structural rule for future artifacts.
3. `task-session`: after owner approval, implement source-cluster origin
   reference rows or a schema for promotion records.

## Non-Authority Boundary

This Refine run did not promote a canonical definition, mutate the Arcanum
source, update source-cluster rows, or make inventory/ontology authoritative.
It produced the mechanism and owner-route plan.
