# DSR-009 checked-project field integration

Date: 2026-09-08. Product-construction lane; local candidate implementation.
Authorization: user `next`. Authority effect: none.

## Outcome

The [adapter](../../../impl/cli/src/input/compiled-field-model.ts) now derives the
DSR-009 field/reference model directly from an existing checked DomainSpec project
graph. Callers select roots and supply reference bindings; they cannot substitute
separately authored Entity, Value Object or Enum definitions.

This is an **opt-in internal API integration**, not a new public project schema,
default generator cutover or DEC-05 admission. The exact existing
[candidate contract](field-and-reference-model.json) is selected by SHA-256:
`9a012a5a669936620e71a6d8e41457b9ef975dd53703c629c26e000ff1d4262d`.
Its numeric, constructor, identity and absence/null limits remain unchanged.

## API and result

The API takes a nominal checked graph, a closed selection and the exact contract
file bytes. The selection is constructed explicitly for that graph:

```ts
const fields = compileSelectedProjectFields(graph, {
  schema_version: PROJECT_FIELD_SELECTION_VERSION,
  contract_sha256: FIELD_CONTRACT_SHA256,
  graph_sha256: createCompiledProjectCertificate(graph).graph_sha256,
  roots: ['commerce:order'],
  bindings: [
    {owner: 'commerce:order', field: 'customer_id',
     kind: 'identity-reference', target: 'commerce:customer', projection: ['id']},
    {owner: 'commerce:order', field: 'customer_name',
     kind: 'field-projection', target: 'commerce:customer', projection: ['name']},
    {owner: 'commerce:customer', field: 'favorite_order',
     kind: 'identity-reference', target: 'commerce:order', projection: ['id']}
  ]
}, contractSourceBytes);

const identityKey = compiledFieldValueKey(fields, 'commerce:order', orderValue);
```

This example assumes the existing commerce fixture's declarations are present in
the checked project. The [integration test](../../../impl/cli/test/input/compiled-field-model.test.ts)
materializes those declarations as real project/feature/node source files,
compiles them through `loadCompiledProjectGraph`, then exercises this API.

The result contains the normalized selection, existing project certificate,
compiled field model, resolved invariant-reference selectors, unselected node
selectors and a deterministic compilation digest. It explicitly reports
`invariant_execution: not-performed` and `authority_effect: none`.

## Enforced boundaries

- Only an unchanged nominal checked graph is accepted. A structurally identical
  reconstructed graph is rejected by the existing snapshot boundary.
- Contract bytes and graph digest must match the explicit selection. A source
  change followed by recompilation invalidates the old selection. It is never
  silently rebound to a new graph or contract.
- Named dependencies and explicit reference targets are resolved transitively.
  A reference target contributes its data dependencies; a metadata binding whose
  owner is outside the resulting closure is rejected, not silently ignored.
- Data definitions come exclusively from the checked graph's typed contracts.
  A selected untyped Entity or unsupported metatype rejects. Unselected nodes
  remain visible in coverage without blocking a supported selected closure.
- VO invariant references resolve to existing Rule nodes. This checks target
  identity only; it does not evaluate Rule truth or grant invariant enforcement.
- Bindings retain the candidate model's projection/type/cycle checks. They do
  not synthesize canonical relationships, look up instances, copy values,
  establish ownership or create persistence constraints.
- Compilation and value checks read no project files after the graph is checked.
  Relocating identical sources preserves the result; changing source bytes is
  distinguished from relocating them. Root/binding order is normalized.
- Output is immutable and nominal. Reconstructed output is rejected by the
  candidate value-check entry point. The certificate is copied before freezing
  so caller-owned graph objects are not newly frozen by this adapter.

## Context, decisions and gates

Task-session used native local execution with context-builder lean selection:

| Source / selector | Obligation |
| --- | --- |
| [DSR-009 task](../WORK-ITEMS.json), DSR-009 | Field/reference reconciliation scope and V11/V12/V13 follow-through |
| [DEC-05](../DECISIONS.md#dec-05) | Final syntax/profile and persistence decisions remain unselected |
| [Candidate report](FIELD-REFERENCE-REPORT.md), remaining decisions | No numeric/constructor expansion in this integration |
| [Field model](../../../impl/cli/src/input/field-reference-model.ts), compileFieldReferenceModel/fieldValueKey | Reuse actual candidate semantics, not a second implementation |
| [Project model](../../../impl/cli/src/input/project-model.ts), checked snapshot/load/references | Preserve graph identity, typed declarations and Rule target checks |
| [Certificate](../../../impl/cli/src/compilation/certificate.ts), createCompiledProjectCertificate | Bind semantic graph and source manifest without changing certificate format |
| [Source identity](../../../impl/cli/src/input/source-manifest.ts), canonicalJson/sha256 | Deterministic content binding and relocation behavior |
| [Candidate descriptor](field-and-reference-model.json) | Exact tested contract selection |

The non-blocking implementation choice is an additive adapter over a checked
graph, with explicit closed metadata. The alternative default-schema change
would finalize authoring/integration choices outside this unit's scope.
The user request authorizes construction of this opt-in candidate, not a status
change in DEC-05. No delegated runtime, handoff, subagent or experiment harness.

## Verification and preservation

Six new tests cover real-source compilation, closure completeness, source and
contract staleness, forged snapshots, closed selections, unsupported targets,
reference meaning separation, cross-feature dependencies and relocation/order
orthogonality. Existing candidate/model tests remain independent regressions.
The current final counts are in [PCR status](../profile-compiler-reconciliation/STATUS.md).

From the DomainSpec root, the combined regression uses the existing locked loader
and disk-backed temporary directory:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run \
  node --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-concurrency=1 \
  impl/cli/test/input/compiled-field-model.test.ts \
  impl/cli/test/input/field-reference-model.test.ts \
  development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
  impl/cli/test/generation/configured-rules.test.ts \
  impl/cli/test/generation/profiled-project.test.ts \
  impl/cli/test/input/project-model.test.ts
```

Full CLI typecheck uses the unchanged shared `node-env` launcher. Existing native
Rule/L0 compilation and behavior tests are included; this adapter emits no target
code and claims no new target-language realization. The whole CLI test aggregate
was not rerun. No dependency or toolchain changes.

| Tested artifact | SHA-256 |
| --- | --- |
| `compiled-field-model.ts` | `9b6139267dc7a09b77e3c9c5c6a65d08a09bad8ade98a0778a4b6a87ec12e684` |
| `compiled-field-model.test.ts` | `ef7529f80e758fa0030926df6f39ffac8663e7fd270fd44e526dbe3e00eb1c0a` |

Write envelope: the new adapter, test, this report, CLI test discovery and PCR
status. Existing field model, descriptor, graph compiler, certificate and project
generator retain entry hashes. Removing only the new test entry recovers package
preimage `6829f2f97587bf5904641dec582e56beb726eeaa84d234883933b9c8d5adc020`.
Earlier dirty package changes and frozen parent/configuration records are preserved.

## Remaining frontier and open questions

Checked-project integration is now executable for the selected candidate subset.
Next construction work is a bounded TypeScript data-generator consumer of this
bound model, with native tests and explicit invariant-execution requirements.
That step must select its exact supported slice rather than claiming full DSR-009
or PCR-06 completion. It is not implemented by this adapter.

DEC-05 still owns final semantics. Full UInt64, nullable collection elements,
recursive values and open-content assurance retain the limits in
[FIELD-REFERENCE-REPORT.md](FIELD-REFERENCE-REPORT.md#remaining-decisions-and-open-questions).
No public Alch syntax, database mappings, release, publication or frozen
configuration blocker has been changed here.
