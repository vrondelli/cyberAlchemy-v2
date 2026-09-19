---
task: SWU-UCFE-001
mode: lean
status: complete
strict_coverage: n/a
handoff: none
authority: session-evidence
created_at: 2026-07-12
---

# SWU-UCFE-001 Context Pack

## Scope

Implement the candidate-run contract kernel only. This run checks record
completeness, typed state, identity, replay, and prohibited inference
boundaries. It does not evaluate Form evidence or mutate candidate, DS-D1, or
DS-D8 authority.

## Obligation Matrix

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | Represent one candidate ID and one law version. | `TASK-UCFE-CONTRACT.md` SWU-001 goal and algorithm 1 | covered |
| O2 | Require named existing alternatives and distinct/covered/defer hypotheses. | `TASK-UCFE-CONTRACT.md` algorithm 2; `EXPERIMENT-CONTRACTS.md` CandidateRun Input | covered |
| O3 | Reject duplicates, contradictions, cross-candidate evidence, scores, overrides, and authority payloads. | `TASK-UCFE-CONTRACT.md` algorithm 3 and edge cases; shared prohibitions | covered |
| O4 | Check completeness without evaluating Form evidence. | `TASK-UCFE-CONTRACT.md` algorithm 4; `SPEC.md` authority boundary | covered |
| O5 | Permit only three dispositions after typed requirements are complete; otherwise retain a typed run state with no disposition. | `EXPERIMENT-CONTRACTS.md` Evaluation Precedence; `ARCHITECTURE.md` Decision Flow | covered |
| O6 | Provide content, record, and generation identity with predecessor-aware replay. | UI repair `CONTRACT-KERNEL.md`; `canonical-json-v1.mjs` | covered |
| O7 | Reject stale predecessors, timestamp-only identity changes, and non-identical overwrite. | `ARCHITECTURE.md` Run-State Model; UI repair contract-kernel tests | covered |
| O8 | Keep the three schemas closed and total. | SWU write scope and neighboring JSON-compatible YAML schemas | covered |
| O9 | Preserve fixed 2/2/2 and missing-not-collapse policy handles without evaluating them. | `DECISION-LEDGER.md` DEC-UIR-008/009; dossier policy schema | covered |
| O10 | Produce malformed vectors, focused tests, and a run receipt. | SWU done criteria, acceptance evidence, and verification command | covered |

Coverage: 10/10 obligations. No contradiction or stale controlling source was
found. The external corpus and reviewer gaps begin after this SWU.

## Selected Context

| Source | Selector | Obligations |
| --- | --- | --- |
| `work-pack/tasks/TASK-UCFE-CONTRACT.md` | SWU-UCFE-001 | O1-O4, O7-O10 |
| `SPEC.md` | Core Records, Invariants | O1-O5, O9 |
| `EXPERIMENT-CONTRACTS.md` | CandidateRun Input, matrices, precedence | O2-O5 |
| `ARCHITECTURE.md` | low-level components, decision flow, run-state model | O4-O7 |
| `work-pack/shared/context.md` | authority boundary, fixed inputs, global prohibitions | O3, O4, O9 |
| `work-pack/shared/gaps.md` | GAP-UCFE-001 through 004 | gate check |
| `../ui-meta-type-repair/contracts/CONTRACT-KERNEL.md` | identity layers, canonical JSON v1 | O6, O7 |
| `../ui-meta-type-repair/contracts/canonical-json-v1.mjs` | envelope and identity functions | O6, O7 |
| `../ui-meta-type-repair/DECISION-LEDGER.md` | DEC-UIR-008 and DEC-UIR-009 | O9 |
| `../ui-meta-type-repair/tests/contract-kernel.test.mjs` | golden, replay, and tamper test idioms | O7, O8, O10 |

## Constraints

- Candidate evidence is local to exactly one candidate and one law version.
- Coverage alternatives cannot be pooled.
- Scores, weights, threshold overrides, and authority mutation payloads are
  prohibited fields.
- Missing evidence cannot imply collapse, support, failure, or absence.
- `covered-existing` takes precedence over `distinct-supported`.
- Volatile timestamps and storage paths do not affect identity.
- A generation retry with identical semantic content, predecessor, and sorted
  input handles is a no-op; a different payload may not overwrite it.

## Implementation Decisions

1. Import the ratified UI repair `canonical-json-v1.mjs`; do not fork its
   canonicalization or identity rules.
2. Store schemas as JSON-compatible YAML, matching the neighboring package and
   allowing dependency-free schema-shape tests.
3. Separate `run_state` from optional `disposition`. Invalid or incomplete
   inputs never receive a disposition.
4. Validate coverage and distinct evidence as typed completeness only. This
   SWU does not calculate empirical truth.
5. Keep policy identity fixed at `DEC-UIR-008/009-v1` and reject overrides.

These are implementation assumptions within the accepted design, not
blocker-level policy choices.

## Write Scope

- `contracts/candidate-run.schema.yml`
- `contracts/coverage-evaluation.schema.yml`
- `contracts/candidate-disposition.schema.yml`
- `evidence/candidate-run.mjs`
- `fixtures/contracts/candidate-run-*`
- `tests/candidate-run.test.mjs`
- `runs/SWU-UCFE-001/CONTEXT-PACK.md`
- `runs/SWU-UCFE-001/receipt.json`
- SWU-001 status and direct frontier synchronization in `WORK-PACK.md`

## Validation Surface

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/candidate-run.test.mjs
npm --prefix projects/domainspec-v2/impl run validate:docs
```

## Gate Verdict

PASS. Dependencies are empty, all ten obligations are covered, validation is
available, write scope is explicit, and no blocker-level decision remains.
Runtime delegation and subagents are not used.
