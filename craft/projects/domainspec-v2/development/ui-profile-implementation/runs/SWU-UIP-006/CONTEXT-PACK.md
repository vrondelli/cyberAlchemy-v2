---
task_reference: SWU-UIP-006
parent_task: TASK-UIP-AUTHORITY
mode: standard
status: pass
created: 2026-07-17
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIP-006

## Task And Output

- Task: bind the mechanically validated UI development profile to an exact
  DS-D1, DS-D8, supported-profile, FPR-02U, and R2/TAXONOMY owner packet.
- Output: one machine packet plus a synchronized human review view.
- Authority: proposal transport only. Canonical registries and FPR decisions
  are immutable inputs to this SWU.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Bind every proposal to current canonical and development digests. | DS-D1, DS-D8, supported profiles, TAXONOMY, FPR-02 lanes, SWU-UIP-005 receipt. | covered |
| O2 | Cover all eleven required concepts with exact dispositions. | UI profile, placement contracts, traversal coverage. | covered |
| O3 | Cover all 14 existing DS-D8 signatures whose endpoints mention a UI concept. | Current relationship registry selector. | covered |
| O4 | Preserve earlier Action-source, Hook-Binding, Guard-target, and Binding decisions. | `DEC-UIR-010` decision ledger. | covered |
| O5 | Give Adapter/`shapes` and State Indicator/`reflects` owners finite alternatives without selecting one. | Representation contracts and five-item graph residue. | covered |
| O6 | Make supported-profile admission a separate, release-neutral owner decision. | Canonical registry and FPR-02 lane decision. | covered |
| O7 | Route UI-11 migration before root TAXONOMY deletion or generation. | `GAP-SH-UI11-MIGRATE` and R2 work-pack. | covered |
| O8 | Prove canonical authority bytes are unchanged by this SWU. | Pre/post SHA-256 comparison over six bound authority inputs. | covered |

## Selected Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `TASK-UIP-AUTHORITY.md` | algorithm, failure modes, done criteria | O1-O8 |
| `definitions/meta-types/meta-types.yml` | UI maturity block and current DS-D1 members | O1, O2 |
| `definitions/relationships/relationships.yml` | 14 signatures with UI endpoints | O1, O3-O5 |
| `definitions/minted-project/supported-profiles.yml` | admission authority and default profile | O1, O6 |
| `impl/spec/TAXONOMY.md` plus R2 sources | root migration dependency | O1, O7 |
| FPR-02 decision and lane machine view | independent UI/backend lanes | O1, O6 |
| `development/ui-meta-type-repair/DECISION-LEDGER.md` | accepted relationship subdecisions | O4 |
| SWU-UIP-001..005 receipts and generated outputs | exact mechanical result and residue | O1-O6 |

## Decisions And Assumptions

- The packet requests promotion review for the nine direct-node candidates; it
  does not claim that mechanical evidence grants activation.
- Adapter and State Indicator remain explicit owner choices. Their development
  normalization is evidence, not a canonical selection.
- The earlier Hook-Binding and Guard-target decisions are not reopened. The
  earlier Action-source route remains open but unadmitted; this packet supplies
  a finite candidate for review without admitting it.
- A supported profile may be proposed as experimental only after DS-D1/DS-D8
  reconciliation. It remains separate from backend FPR-02B and from release.
- Because canonical files already contain unrelated user changes, byte identity
  is measured against a pre-SWU digest baseline rather than Git cleanliness.

## Context Builder Summary

- Source groups selected: 8.
- Obligation coverage: 8/8, 100 percent.
- Blockers: 0.
