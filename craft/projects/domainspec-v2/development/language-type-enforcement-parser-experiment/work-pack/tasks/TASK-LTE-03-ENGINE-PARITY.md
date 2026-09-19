---
module: language-type-enforcement-parser-experiment
task: TASK-LTE-03
layer: L0
status: blocked-by-swu-lte-001-002
updatedAt: 2026-07-17
docType: work-pack-task
---

# TASK-LTE-03: Engine Adapter And Consumer Parity

## Objective And Mapping

Replace the normalized parser's independent registry path with the shared
result, then demonstrate exact-cause parity through both consumer surfaces and
positive preservation across all current normalized packs. This closes S-003
in W1/L0.

## Source Contracts

- [Architecture exact-cause and compatibility contract](../../ARCHITECTURE.md)
- [Cross-task traceability](../shared/traceability.md)
- `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts`:
  `parseNormalizedSpec`, current Concept Registry branch, and final required
  table checks.
- `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/normalized-spec.test.ts`:
  existing normalized graph, obligation, residue, and negative evidence.
- `projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts`: `lint` output
  and nonzero violation behavior.
- Content adapter and SWU-LTE-001/002 receipts.

## Dependencies And Blockers

- Dependencies: SWU-LTE-001 and SWU-LTE-002 pass.
- Blockers: overlap in any write-scope file; parity fixture cannot isolate
  registry cause from graph/schema failures; positive graph/obligation drift.

## Implementation Detail

### Engine Data Flow

```text
parseNormalizedSpec starts
  -> call shared registry parser once
  -> rejected: append one `[LTE-*]` violation preserving compatible detail;
               return before graph/other normalized table work
  -> parsed: create SpecConcept nodes and concept membership from declarations
  -> continue existing Feature Graph/field/attribute/omission handling unchanged
```

Remove only the normalized Concept Registry decision branch that the kernel now
owns. Existing general Markdown primitives remain for other aspect tables. The
adapter may not validate meta-type admission.

### Parity Harness

Create one minimal sibling normalized pack that is green in both consumers:
this exact body, including the opaque local `Fixture` meta-type and a canonical
empty Feature Concept Graph:

```markdown
# Registry parity fixture

## Concept Registry

| Concept | Type |
| --- | --- |
| ParityFixture | Fixture |

## Feature Concept Graph

| From | Edge | To | Source Evidence |
| --- | --- | --- | --- |
```

Derive eight fixtures from that accepted sibling by exactly one change: delete
the registry section; duplicate it; delete its table; append a second registry
table block; rename one header; reduce one separator cell below three dashes;
delete its only data row; or blank its Type cell. Spawn:

1. content validator with `--file <fixture>/SPEC.md`;
2. derivation-engine CLI `lint <fixture>`.

For each fixture assert expected nonzero carrier and exactly the expected
code, subject, and required detail from the
[diagnostic matrix](../../WORK-PACK.md#expected-diagnostic-matrix) on both
surfaces. Assert no unrelated schema/graph/profile code caused the failure. Do
not call the kernel twice as parity evidence.

The engine adapter's rejected carrier is exactly:

```text
[<code>] <sourceLabel>:<line-or-1>: <subject>: <detail>
```

This keeps the returned `violations: string[]` surface and CLI exit convention
while fixing code, null-line fallback, subject, and detail placement.

### Positive/Recomposition Evidence

For sample, financial-settlement, and agent-execution-orchestrator, snapshot and
compare exact `SpecConcept` declarations, graph/node or obligation counts already
claimed by current tests, content concepts/edges checked, and pass/fail results.
Preserve the prior normalized diagnostic subject/detail after the prefix.

### Failure Modes

- the engine adapter emits a different code or continues graph work after
  rejection;
- parity is tautological because it bypasses a consumer;
- a mutation also removes Feature Graph and fails for the wrong reason;
- engine build passes only under test transpilation;
- current graph, obligation, provenance, or residue assertions drift;
- the adapter begins rejecting `Fixture` or other meta-type text by profile.

## Smallest Working Units

### SWU-LTE-003 — Engine adapter, parity harness, and positive snapshots

- Goal: close the two-consumer experiment as one integrated evidence unit.
- Dependencies: SWU-LTE-001 and SWU-LTE-002.
- Write scope:
  - `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts`;
  - `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/normalized-spec.test.ts`;
  - new `projects/domainspec-v2/impl/tools/tests/concept-registry-parity.test.ts`.
- Done criteria:
  - engine uses declarations/diagnostic only from the shared result for registry
    structure;
  - rejected result stops normalized file work;
  - eight mutation rows match exact codes through both consumer surfaces;
  - all three current packs preserve positive declarations/counts/results;
  - existing normalized tests, engine suite, root tools, typechecks, and build
    remain green.
- Acceptance evidence: parity table, before/after snapshot equality, exact test
  commands/results, and dependency-boundary review.
- Validation, from `projects/domainspec-v2/impl`:
  - `npm -w @domainspec/test-derivation-engine run test -- src/grammar/normalized-spec.test.ts`;
  - `node --import tsx --test tools/tests/concept-registry-parity.test.ts`;
  - `npm -w @domainspec/test-derivation-engine run typecheck`;
  - `npm -w @domainspec/test-derivation-engine run build`;
  - `npm run engine:test`;
  - `npm run tools:test`.
- Execution owner: `subagent` preferred; `local-fallback` allowed.
- Handoff note: include both prior receipts, architecture code/precedence and
  behavior matrix, current normalized parser/tests, CLI lint surface, and three
  current SPEC paths. Do not include or mutate FPR-02 tasks.
- Expected return: the complete
  [shared SWU receipt schema](../shared/execution-receipt-schema.md), plus an
  eight-row code/subject/detail parity table and exact positive snapshot deltas
  (all expected zero).

## Synchronization And Completion

No parallel edits with the content adapter or kernel. A pass opens only the
closure task, not L1. Any exact-cause, build, or positive-compatibility failure
returns `flag`/`block` with the first failing fixture and preserves residue.
