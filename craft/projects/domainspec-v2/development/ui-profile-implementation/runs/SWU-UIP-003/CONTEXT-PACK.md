---
task_reference: SWU-UIP-003
parent_task: TASK-UIP-MECHANICS
mode: standard
status: pass
created: 2026-07-17
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIP-003

## Task And Output

- Task: build a preregistered synthetic Create Player calibration corpus for all
  eleven required UI concepts and their profile representations.
- Output: one manifest, one specimen file per concept, a 66-cell expected/actual
  matrix, stable codes/digest, validator support, and focused tests.
- Authority: synthetic mechanical evidence only; no real-corpus or canonical
  inference.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Cover exactly 11 concepts x 6 fixture classes without pooling. | Task contract; profile census; approved design requirements. | covered |
| O2 | Keep provenance explicitly synthetic and preregister expected outcomes. | Architecture synthetic-corpus component; work-pack stop conditions. | covered |
| O3 | Exercise the same nine formation contracts and two placement contracts. | SWU-UIP-002 receipt; profile registry; placement files. | covered |
| O4 | Prove classification does not depend on the human label. | Label-erasure fixture class; formation criteria. | covered |
| O5 | Reject nearest-neighbor, malformed, criterion-erased, and changed-consequence variants. | Candidate positive/malformed/neighbor vectors; placement prohibitions. | covered |
| O6 | Emit stable typed outcomes and a deterministic corpus digest. | SWU algorithm; existing canonical digest convention. | covered |
| O7 | Preserve synthetic limits and synchronize only after validation. | Approved design prohibited inferences; Task Session contract. | covered |

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `TASK-UIP-MECHANICS.md` | SWU-UIP-003 goal, algorithm, done criteria | O1-O7 |
| `UI-PROFILE-DESIGN.json` | six required fixture classes and prohibited inferences | O1, O2, O7 |
| `ARCHITECTURE.md` | synthetic corpus and confidence boundaries | O2, O7 |
| `profile.yml` | exact eleven concepts and representations | O1, O3 |
| `spec/meta-types/ui/*.schema.yml` | nine implemented formation contracts | O3-O5 |
| `spec/ui-profile/concepts/*.yml` | Adapter and State placement/prohibitions | O3, O5 |
| candidate `candidates.json` | Create Player positives, malformed cases, neighbors | O5 |
| `validate-ui-profile.ts` | profile CLI and digest conventions | O6 |

## Decisions And Assumptions

- Each concept owns one file containing six independent cases; this preserves
  the user's per-node machine-view preference without creating 66 tiny files.
- `label-erased` is expected to accept: the manifest supplies the test target,
  while formation is decided only from payload structure. This is the explicit
  anti-label-cheat control, not an intended negative.
- `positive` and `label-erased` accept. The other four classes reject with
  stable codes.
- Changed consequence is checked by representation outcome (`construct`,
  `normalize`, or split emission), not by pretending to prove product behavior.
- No blocker decision was required.

## Context Builder Summary

- Files/source groups selected: 8.
- Obligation coverage: 7/7, 100 percent.
- Blockers: 0.
