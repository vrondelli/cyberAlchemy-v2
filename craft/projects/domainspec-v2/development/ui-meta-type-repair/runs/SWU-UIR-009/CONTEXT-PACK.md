---
artifact_id: CONTEXT-UIR-009-v1
task: SWU-UIR-009
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-009 Context Pack

## Summary

- Files selected: 11 controlling sources and five immutable generation records.
- Selector groups: 12.
- Obligation coverage: 100 percent.
- Runtime: local; blockers: none.
- Human owner outcomes remain versioned inputs and are excluded from mechanical
  replay authority.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Append generation entries with predecessor, inputs, handles, and replay status. | task contract; S7 orchestration index | covered |
| O2 | Preserve every prior generation and reject in-place updates. | SPEC invariant; S7 invalidation rule | covered |
| O3 | Reject missing handles and unexplained predecessor forks. | task negative fixtures | covered |
| O4 | Exclude timestamps from semantic identity. | DEC-UIR-005; SWU-001 kernel | covered |
| O5 | Replay mechanical producers and dossier from frozen inputs. | task contract | covered |
| O6 | Treat owner outcomes as versioned inputs, not replayed decisions. | architecture risks; SWU-007 boundary | covered |
| O7 | Require an explicit reason and successor for invalidation. | EVIDENCE-CONTRACTS S7 | covered |
| O8 | Keep the index handle-only and non-authoritative. | architecture risk control; prohibited inference | covered |

## Frozen Generation Inputs

| Plane | Content digest | Generation handle | State |
| --- | --- | --- | --- |
| mutation | `sha256:0ebe25d1d478321ea6909aeb5d2630bc7fc27750daf11d6f79dfa60f9ea88d87` | `generation:sha256:f25d8b7b9310760f58c04fd29ef3ecc78bec9bc1c62d7c1b631b9aeae24183f6` | complete |
| reroute | `sha256:5f81fc24dafc1276683650dd1eba8d0c188e62d0a12bc92dac7906ea4ac2e9c6` | `generation:sha256:5ba56a2d8559cadae183cbddb0c71d7d19f6f19b3a41eddcee0cd0afd513348b` | pending-owner |
| corpus | `sha256:1b53cef85b3d0dbcc6e7057f08f3fac4e03d38d2294f640b4ed52d0b6ef4c17b` | `generation:sha256:858c0d94070258dc1db5eccf945e1965409ed4b85f5c442600d04f27336aaa85` | defer |
| relationship packet | `sha256:c20c4465bd670fbfb4c34696ae41e5e02edf535ee860f50956ff4b3c3c97ee5f` | `generation:sha256:8768ca294f44e65efbe8d9fad512673d02933770406be474d7cf89992278c28b` | pending-owner |
| dossier | `sha256:2108425a7ba474a5148c3ac2bdc2a1d3453c34eb8413cdc011d2fecc72f1a482` | `generation:sha256:d73ac0e0df89af583bc0c31c6352d06e06e0ec575c8ae351cd95609e17f1b846` | defer |

## Decisions And Assumptions

- Initial index generation uses branch `main` with no predecessor.
- A successor on `main` must name the current head. A different predecessor
  requires a distinct explicit branch identity.
- Mechanical replay executes each producer publisher and the dossier publisher
  against frozen inputs, then compares content and generation identities.
- The pending relationship packet is replayed only as immutable transport. Its
  owner question is not re-decided.
- A replay mismatch requires a successor generation and invalidation reason; it
  cannot update generation 001 in place.

## Write Scope And Validation

- Add index/replay schemas, tooling, fixture, immutable generation 001, and
  focused tests under this repair package only.
- Test missing handles, predecessor forks, explicit branches, volatile time,
  in-place overwrite, explained invalidation, full mechanical replay, schema
  validity, and prior-generation availability.
- Do not mutate producers, owner decisions, candidate status, DS-D1, DS-D8, or
  prior UIF history.
