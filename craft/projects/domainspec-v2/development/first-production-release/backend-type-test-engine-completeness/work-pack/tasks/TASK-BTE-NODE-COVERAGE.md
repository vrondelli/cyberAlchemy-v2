> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md`; completed SWU-BTE-003 evidence remains immutable.

# TASK-BTE-NODE-COVERAGE — Node adapter and all-kind corpus

## Objective

Make minted node bodies evaluable through the shared YAML criterion kernel and provide discriminating positive and negative evidence for every active backend kind.

## Dependencies and blockers

- SWU-BTE-003 depends on SWU-BTE-001.
- SWU-BTE-004 depends on SWU-BTE-002 and SWU-BTE-003.
- The selected source layout remains one canonical JSON file per node; generated graph, manifest, Markdown, and receipts remain read-only views.

## SWU-BTE-003 — Adapt minted node bodies to criterion subjects

### Goal

Map the existing minted node body shape into `CriterionSubject` without introducing a second formation evaluator.

### Algorithm

1. Validate the minted node envelope independently from formation criteria.
2. Select the meta-type YAML schema through the ratified profile binding.
3. Normalize `body.fields`, `body.values`, direct scalar body keys, and named prose such as `body.equality` into a criterion subject.
4. Call the shared kernel and translate violations into deterministic compiler diagnostics with criterion IDs.
5. Keep kind-specific knowledge in profile/schema data; hard-coded branching is allowed only where the adapter contract explicitly requires a named body projection.
6. Prove that the four existing supported kinds retain their current successful and failing behavior.

### Edge cases

- Boolean or numeric field properties must retain their values.
- Missing Value Object equality text, empty Enum values, absent attributes, and whitespace-only prose.
- Workflow scope values outside the declared option set.
- Unknown body keys and body/schema digest drift.
- An envelope-valid node whose formation body is invalid.

### Write scope

- `impl/tools/minted-project/meta-type-body-adapter.ts` (new)
- `impl/tools/minted-project/compiler.ts`
- Direct adapter/compiler tests and fixtures
- A schema validator only if required by the approved adapter contract

### Done criteria

- The compiler reports stable formation violations by criterion ID.
- The adapter exercises all eight existing criterion rule forms.
- Node-envelope and formation failures remain distinguishable.
- No duplicated YAML parser or evaluator is introduced.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Implementation owner: minted-project compiler owner.
- Contract review: meta-type schema owner.
- Handoff: record the final adapter mapping and diagnostic codes in the contract README and traceability matrix.

## SWU-BTE-004 — Build the 13-kind discriminating corpus

### Goal

Create a deterministic minted-project witness with one positive node per active backend kind and at least one targeted criterion mutation per criterion.

### Algorithm

1. Create a bounded fixture project containing all 13 active backend kinds; split features only where needed to keep node intent coherent.
2. Compile it through the public minted-project compiler path and assert a deterministic graph and source manifest.
3. For each of the 16 criteria, generate or maintain one minimal mutant that violates that criterion while preserving the nearest possible surrounding structure.
4. Add discriminator pairs where one value boundary distinguishes pass from fail.
5. Assert exact kind and criterion sets; do not use count-only assertions.
6. Keep relationship edges minimal and valid for the selected profile; the corpus is not evidence of relationship completeness.

### Write scope

- `impl/test-derivation-engine/__fixtures__/minted-project/backend-types/` (new)
- Minted-project conformance matrix and direct tests
- Generated fixture receipts only through the canonical generator

### Done criteria

- Exactly 13 positive backend kinds compile.
- Exactly 16 criterion obligations have executable mutants.
- No Saga or UI kind appears.
- Fixture compilation is deterministic and leaves no orphan node.
- Every mutant fails for its targeted criterion, not for an earlier envelope error.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Corpus owner: derivation-engine maintainer.
- Review owner: backend profile owner.
- Handoff: expose the exact positive-node and mutant inventory to TASK-BTE-OBLIGATIONS without letting the engine define the denominator.
