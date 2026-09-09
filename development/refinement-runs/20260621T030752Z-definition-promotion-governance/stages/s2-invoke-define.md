# Invoke Define: Definition Elevation Protocol

Status: pass
Capability: `invoke`
Mode: `define`
Dispatch step: `s2`

## Invoke Result

- Mode: define.
- Spell: invoke.
- Canonical ID: invoke.
- Scope: library.
- Phase status: pass.
- Mode contract: `.agents/skills/invoke/define.md`.
- Outputs: this definition-stage artifact.
- Template selection: lightweight protocol definition inside Refine run evidence; no canonical template promotion.
- Dispatch techniques: `handle_handoff`, `authority_split_gate`, `owner_boundary_check`, `residue_ledger`.
- Distill validation: queued for stage `s5`.
- Decisions: define the protocol as a routeable mechanism, not yet as a canonical CyberAlchemy v2 term.
- Unresolved gaps: whether the protocol should later become a definition, constitution rule, or both.
- Next route: interrogation.

## Defined Unit

Working name: `definition elevation protocol`

Definition-stage meaning:

A definition elevation protocol is the governed route by which a source-owned
definition represented inside CyberAlchemy v2 becomes a higher-tower local
adaptation without relocating, overwriting, or silently absorbing the source
authority.

The protocol has four required movements:

1. represent source authority locally;
2. identify a tower-level local need;
3. promote only the local semantic delta through the correct owner gate;
4. record an origin back-reference and drift state.

## Protocol Objects

| Object | Authority posture | Owner |
| --- | --- | --- |
| source definition | Source-owned normative semantics. | source authority owner |
| source-cluster row | Local representation and routing evidence. | Craft + definitions-governance |
| adaptation candidate | Proposed local semantic delta. | definitions-governance after submission |
| promotion record | Decision evidence for canonical promotion. | owner gate that decided it |
| local canonical definition | CyberAlchemy v2 normative term. | definitions-governance |
| origin reference record | Non-canonical back-reference and drift state. | definitions-governance with source-cluster maintenance |
| constitution rule | Structural constraint on future artifacts. | constitution-governance |

## Typed Relations

| Relation | Source | Target | Effect |
| --- | --- | --- | --- |
| `represents_source_definition` | source-cluster row | source definition | Search and Craft can use local representation without canonizing it. |
| `adaptation_candidate_of` | adaptation candidate | source definition | The local candidate must state what it adapts from. |
| `semantic_delta_from` | adaptation candidate | source definition | The local difference must be explicit. |
| `specializes_for_tower` | adaptation candidate | definition tower | Higher-level need must be named. |
| `requires_promotion_gate` | adaptation candidate | owner gate | Canonical promotion must route to an owner. |
| `promoted_as_local_authority` | promotion record | local canonical definition | Promotion is traceable to a decision. |
| `origin_backreference_for` | origin reference record | local canonical definition | Source cluster can point to local adaptation without becoming canon. |
| `drift_checked_against` | origin reference record | source definition | Drift state remains reviewable. |
| `structural_rule_candidate_for` | protocol or relation profile | constitution-governance | Future-constraining behavior routes to constitution-governance. |

## Pass/Flag/Block Semantics

| Verdict | Meaning |
| --- | --- |
| pass | Source evidence, local delta, owner gate, and origin reference are adequate for the next owner route. |
| flag | The route may proceed with named drift, naming, scope, or boundary risk. |
| block | Promotion stops because authority owner, source link, local delta, typed relation, or promotion gate is missing. |

## Boundary

This Define stage does not promote a new `CAV2-D*` term. It defines a
route-ready mechanism for the Refine run. Canonical status must be decided later
by definitions-governance, and structural enforcement must be decided later by
constitution-governance.

## Receipt

```yaml
dispatch_id: 20260621T030752Z-definition-promotion-governance
step_id: s2
capability_ref: invoke
mode: define
status: pass
artifact: stages/s2-invoke-define.md
validation: source authority preserved; local adaptation separated
observer_status: not_emitted
blockers: []
residue:
  - canonical naming and final owner route deferred
handoff_note: review the protocol against two novelty lanes and authority boundaries
```
