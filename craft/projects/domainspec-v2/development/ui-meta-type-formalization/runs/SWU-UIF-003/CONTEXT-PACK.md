---
task_reference: SWU-UIF-003
parent_task: TASK-UIF-BASELINE
mode: standard
status: pass-with-resolved-pre-execution-correction
created: 2026-07-11
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIF-003

## Task And Output

- Task: run the counterbalanced E0 twice and compare results.
- Output: isolated runner, two independent run directories, deterministic final
  results, and comparison summary.
- Runtime: local fallback; dispatch subagents were not authorized for this run.
- Authority: method evidence only. Final provisional outcomes remain
  `not-adjudicated` and promotion stays disabled.

## Obligation Matrix

| ID | Obligation | Required evidence | Status |
| --- | --- | --- | --- |
| O1 | Prove UIF-002 completion and consume only its frozen contracts/fixtures. | Work-pack state and UIF-002 receipt. | covered |
| O2 | Implement a bounded structural E0 runner inside the experiment package. | Protocol criterion probes, fixture tables, existing CLI idiom. | covered |
| O3 | Parse YAML/frontmatter through a structured parser and Markdown tables deterministically. | PyYAML availability and fixture contract. | covered |
| O4 | Apply positive, malformed, neighbor, and supporting graph probes for both pairs. | Protocol expectations and result schema. | covered |
| O5 | Run the unchanged protocol twice into separate output directories. | Protocol run policy. | covered |
| O6 | Compare method outcome, reason codes, evidence, and residue, then emit deterministic final records. | Protocol compare fields and result contract. | resolved |
| O7 | Match preregistered separation/collapse expectations or fail the SWU. | E0 method expectations. | covered |
| O8 | Preserve synthetic-only, portability, round-trip, and promotion residue. | Corpus and stop conditions. | covered |
| O9 | Avoid shared/canonical validator mutation. | SWU write scope and authority boundary. | covered |
| O10 | Validate results, rerun equivalence, docs, links, and synchronized status. | SWU acceptance and Task Session contract. | covered |

## Resolved Pre-Execution Correction

`protocol.yml` listed `evidence_refs` in `run_policy.compare_fields`, but
`result.schema.yml` requires the field `evidence`. Before any run, this task
changes only that selector to `evidence` and records the correction in the
decision ledger. No hypothesis, fixture, expectation, criterion, or method
outcome changes; no prior evidence exists to invalidate.

## Controlling Constraints

1. Protocol version remains `ui-formalization.v0.1`.
2. Both runs consume the same protocol and corpus content hashes.
3. The runner evaluates authored tables and declared attributes only.
4. Supporting DS-D8 edges may pass/fail graph coherence but do not determine
   method outcome independently.
5. Form separation requires positive accept, malformed reject, neighbor reroute.
6. Adapter collapse requires positive accept, malformed reject, Mapping neighbor
   accept, and no forbidden separator.
7. Final records remain `not-adjudicated`, portability `incomplete`, round trip
   `not-run`, and promotion ineligible.
8. No protocol edits are allowed after run 1 without version bump and complete
   rerun.

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `WORK-PACK.md` | UIF-003 row, gates, selected-next state | O1, O5, O9, O10 |
| `TASK-UIF-BASELINE.md` | UIF-003 contract and synchronization | O1, O2, O5, O7, O10 |
| `EXPERIMENTS.md` | thresholds and stop conditions | O4, O7, O8 |
| `protocol.yml` | run policy, pair probes, expectations | O2, O4, O5, O6, O7 |
| `corpus.yml` | six specimen records and promotion residue | O3, O4, O8 |
| `result.schema.yml` | required result fields and E0 rules | O4, O6, O8 |
| Form positive fixture | Fields, Contract, relationships | O3, O4 |
| Form malformed fixture | missing required structure | O3, O4 |
| Component neighbor fixture | reroute probe | O3, O4, O7 |
| Adapter positive fixture | transform structure and supporting edge | O3, O4 |
| Adapter malformed fixture | missing target/map | O3, O4 |
| Mapping neighbor fixture | structurally equivalent collapse probe | O3, O4, O7 |
| UIF-002 receipt | dependency and frozen-substrate evidence | O1 |
| existing validator CLI test | deterministic black-box command convention | O2, O10 |

## Decisions And Assumptions

- No blocker decisions.
- Local fallback is used because subagent authorization was not provided; the
  same SWU contract and receipt are preserved.
- PyYAML is the structured parser because no Node YAML package is installed.
- The runner writes generated evidence under `experiments/results/e0/` and does
  not edit protocol or fixture inputs during execution.
- Byte-for-meaning comparison ignores output directory names; protocol and
  corpus hashes are included in every record.

## Validation Surface

- Run command once to `run-1` and once to `run-2`.
- Compare/finalize command emits deterministic final results and comparison.
- Recursive diff of run-1 versus run-2 must be empty.
- Parse all generated YAML and validate required/allowed result fields.
- Assert both method outcomes match preregistration.
- Assert final provisional outcomes remain `not-adjudicated` and promotion false.
- Run local links/docs validation, whitespace scans, dispatch validation, and
  canonical read-only guard.

## Context Builder Summary

- Files selected: 14.
- Snippet groups: 20.
- Obligation coverage: 100 percent after one bounded pre-execution correction.
- Noise ratio: low.
- Handoff pack: none.
- Strict runtime coverage: n/a.
- Blockers: 0.
- Fallback search: one dependency check for YAML parser availability; resolved
  with installed PyYAML.
