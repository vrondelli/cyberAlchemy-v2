---
task_reference: SWU-UIP-007
parent_task: TASK-UIP-VERIFY
mode: standard
status: pass
created: 2026-07-17
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIP-007

## Task And Output

- Task: independently recompose SWU-UIP-001..006 and audit the approved
  development architecture, authority firewall, and claim boundary.
- Output: focused and aggregate validation evidence, recomposition census,
  authority digest comparison, final residue, and synchronized closeout.
- Authority: audit and local work-pack synchronization only.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Verify six predecessor receipts, identity, dependency order, and next-SWU chain. | SWU-UIP-001..006 receipts. | covered |
| O2 | Re-run every focused profile, formation, fixture, graph, and engine test. | Focused test files and task validation contracts. | covered |
| O3 | Re-run graph content/relationship, instance, build, engine, type, and aggregate gates. | `impl/package.json` scripts and SWU-UIP-004..005 receipts. | covered |
| O4 | Recompose exactly 11 concepts, 66 synthetic cases, 17 nodes, 20 edges, 11 traversed representations, and one 11/14 owner packet. | Machine registries, manifests, generated outputs, packet. | covered |
| O5 | Verify deterministic profile and graph bindings. | Profile semantic digest, development-registry digest, graph/build digests. | covered |
| O6 | Verify six canonical authority inputs remain byte-identical to the owner packet baseline. | Packet evidence bindings and live SHA-256. | covered |
| O7 | Detect prohibited activation, release, independent-evidence, or universality claims. | Architecture claim boundary, packet prohibited inferences, package scan. | covered |
| O8 | Apply the decision profile only to a real blocker and preserve external residue exactly. | `DEC-UIP-002-AGGREGATE-GUARD` and current aggregate audit. | covered |

## Selected Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `TASK-UIP-VERIFY.md` | audit algorithm and acceptance evidence | O1-O8 |
| SWU-UIP-001..006 receipts | identity, results, authority effects | O1-O6 |
| `ARCHITECTURE.md` | approved structure and prohibited equivalences | O4, O7 |
| `IMPLEMENTATION-LAYERING.md` | L0-L3 promotion contract | O1, O4, O7 |
| machine profile/fixtures/feature/generated outputs | recomposition sources | O2-O5 |
| authority packet | owner coverage, digest baseline, claim boundary | O4-O7 |
| `impl/package.json` | aggregate command surface | O2, O3 |
| decision profile and aggregate guard decision | fail-closed blocker policy | O8 |

## Decisions And Assumptions

- A red aggregate gate caused exclusively by the same four out-of-scope files is
  recorded as external residue, not hidden and not repaired through this SWU.
- The work-pack may close as `complete-with-external-residue` when every owned
  obligation passes and the repository-level residue is unchanged, named, and
  routed.
- Existing dirty canonical files are not treated as UIP writes. Live bytes must
  equal the packet's pre-SWU authority bindings.
- No release, production, empirical-universality, or canonical-activation claim
  may be introduced by closeout wording.

## Context Builder Summary

- Source groups selected: 8.
- Obligation coverage: 8/8, 100 percent.
- Blockers: 0 before validation.
