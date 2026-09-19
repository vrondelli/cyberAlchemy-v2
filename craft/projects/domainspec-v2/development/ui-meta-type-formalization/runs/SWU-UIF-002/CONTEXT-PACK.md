---
task_reference: SWU-UIF-002
parent_task: TASK-UIF-BASELINE
mode: standard
status: pass
created: 2026-07-11
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIF-002

## Task And Output

- Task: freeze the E0 protocol, corpus, result contract, and fixtures.
- Output: three YAML contracts and six Markdown fixtures covering two
  counterbalanced contrast pairs.
- Runtime: local; no adapter, delegation, or subagent.
- Authority: experiment substrate only. No experiment runs, candidate schemas,
  validators, DS-D1 promotion, or DS-D8 mutation.

## Obligation Matrix

| ID | Obligation | Required evidence | Status |
| --- | --- | --- | --- |
| O1 | Prove dependency UIF-001 is complete and consume its frozen matrix. | Work-pack state, UIF-001 receipt, baseline matrix/ledger. | covered |
| O2 | Freeze one versioned E0 protocol with both contrast pairs and expected method outcomes. | EXPERIMENTS E0/result contract; architecture decision flow. | covered |
| O3 | Freeze corpus provenance, framework style, ownership, normalization, expectations, and exclusions. | EXPERIMENTS Corpus Contract; GAP-UIF-REAL-CORPUS. | covered |
| O4 | Define a machine-readable result schema without selecting final outcomes. | EXPERIMENTS Result Contract and six package outcomes. | covered |
| O5 | Create positive, malformed, and neighbor fixtures for each pair. | Baseline hypotheses; Mapping schema/card/fixtures; SWU acceptance. | covered |
| O6 | Freeze expected results before execution and distinguish method evidence from promotion evidence. | UIF-BD1..BD7; package authority boundary. | covered |
| O7 | Keep synthetic-only E0 explicitly promotion-ineligible and preserve the real-corpus gap. | Architecture risk; experiment corpus rule. | covered |
| O8 | Validate YAML parsing, fixture census/references, required fixture sections, links, and diff integrity. | SWU validation surface and repository docs validator. | covered |
| O9 | Synchronize SWU, parent task, W0, layering, and next-ready state only after evidence passes. | Task Session synchronization contract. | covered |

## Controlling Constraints

1. Protocol version is `ui-formalization.v0.1` and expectations freeze before
   UIF-003 runs.
2. E0 method outcomes are not final provisional outcomes.
3. Form/Component must represent a plausible structural-separation signal;
   Adapter/Mapping must represent a plausible structural-collapse signal.
4. Adapter cannot survive on `boundary=ui`, naming, or `shapes` alone.
5. DS-D8 references remain supporting evidence, not formation authority.
6. All six fixtures are synthetic, local, and promotion-ineligible.
7. Existing Mapping artifacts are read-only precedent.
8. No shared or canonical validator code is written in this SWU.

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `WORK-PACK.md` | UIF-002 row, blockers, gates | O1, O3, O8, O9 |
| `TASK-UIF-BASELINE.md` | UIF-002 contract, synchronization | O1, O2, O5, O8, O9 |
| `EXPERIMENTS.md` | E0, Corpus Contract, Result Contract, thresholds, stops | O2, O3, O4, O5, O6, O7 |
| `ARCHITECTURE.md` | decision flow and dependency boundary | O2, O4, O6, O7 |
| `CANDIDATE-HYPOTHESIS-MATRIX.md` | Form, Component, Adapter rows | O1, O2, O5, O6 |
| `DECISION-LEDGER.md` | UIF-BD1..BD7 and deferred UIF-002 decisions | O1, O2, O3, O4, O6 |
| UIF-001 receipt | completion and next-route evidence | O1, O9 |
| `cross-task-gaps.md` | real corpus and authority gaps | O3, O7 |
| Mapping schema | required structure and criterion convention | O5, O8 |
| Mapping card | shape-only boundary | O5, O6 |
| Mapping positive fixture | minimal valid fixture idiom | O5 |
| Mapping negative fixture | explicit rejection idiom | O5 |
| UI11 attack evidence | Form construction and Adapter collapse pressure | O2, O5, O6 |

## Decisions And Assumptions

- No blocker decisions.
- Synthetic E0 is sufficient for method proof only; real-corpus promotion
  evidence remains open.
- Fixtures use Markdown with YAML frontmatter and normalized tables so source,
  role, expected behavior, and repair route remain machine-addressable.
- E0 uses `method_outcome` separate from `provisional_outcome`; final outcome is
  fixed to `not-adjudicated` until later SWUs.
- The Adapter positive and Mapping neighbor intentionally share constructible
  transform structure; UI boundary/name differences are recorded but forbidden
  as non-collapse witnesses.

## Validation Surface

- Parse protocol, corpus, result schema, and fixture frontmatter as YAML.
- Verify two pairs and exactly six fixture records.
- Verify each pair has one `positive`, `malformed-negative`, and `neighbor` role.
- Verify every corpus path exists and every expectation is frozen.
- Verify all fixtures are synthetic and promotion-ineligible.
- Verify the result contract supports both E0 method outcomes and keeps final
  provisional outcome unadjudicated.
- Run local link and repository docs validation.
- Scan trailing whitespace/ASCII and canonical read-only paths.

## Context Builder Summary

- Files selected: 13.
- Snippet groups: 18.
- Obligation coverage: 100 percent.
- Noise ratio: low.
- Handoff pack: none.
- Strict runtime coverage: n/a.
- Blockers: 0.
- Fallback search: named gaps only; real corpus remains explicit residue.
