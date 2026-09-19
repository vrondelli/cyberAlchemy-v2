# DSR-009 field/reference candidate

Date: 2026-09-08. Product-construction lane. Authority effect: none.
Status: candidate contract and bounded conformance validator implemented;
not a finalized input profile, default compiler integration or DEC-05 admission.

## Outcome

The [machine-readable contract](field-and-reference-model.json),
[validator](../../../impl/cli/src/input/field-reference-model.ts),
[commerce fixture](../../../impl/cli/test/fixtures/field-reference-model/commerce.json)
and [conformance tests](../../../impl/cli/test/input/field-reference-model.test.ts)
make the structural distinctions executable without inventing database types.

The fixture declares Order and Customer as Entities, Money and a compound OrderId
as Value Objects, and Status using the existing typed Enum/sum contract. Order
contains an embedded Customer value, a separate Customer identity reference and a
separate Customer-name projection. OrderId contains tenant and number; it remains
one identity-valued property, not several implicit database key columns.

| Declaration | Meaning in this candidate | Does not imply |
| --- | --- | --- |
| `named` type targeting Customer | Embedded typed Entity value | Reference lookup or ownership edge |
| `customer_id` plus identity-reference binding | Same type as the explicitly selected Customer identity | Foreign key, storage or referential integrity |
| `customer_name` plus field-projection binding | Same type as the explicitly selected Customer name | Automatically loading or copying that value |
| Order identity typed as OrderId | Finite identity Value Object | Database composite-key declaration |
| Money fields | Value equality over all fields | Entity identity or automatic invariant execution |

`named` is reused from the existing internal wire format; this work does not
select it as the public Alch spelling. It does not implement `-> Order.id` syntax.

## Bounded context and selected semantics

Context-builder standard, selector-level evidence; no runtime handoff:

| Obligation | Controlling source/selector | Candidate disposition |
| --- | --- | --- |
| Task output and dependency | [WORK-ITEMS](../WORK-ITEMS.json), DSR-009/DSR-006 | Specify contract and conformance fixtures, not automatic downstream generation |
| Type composition and identity | [PLAN](../PLAN.md#4-non-negotiable-semantic-boundaries), Domain concepts and fields | Keep six constructors and distinct domain meanings |
| Meaning reuse | [DSR-006 review](../definition-pack/SEMANTIC-REVIEW.md), first three distinctions | Preserve Entity, VO, typed sum, embedding, reference and ownership separation |
| Existing decoders | [contracts.ts](../../../impl/cli/src/typed-operation/contracts.ts), decodeTypedType/Property/RecordContract/SumContract | Reuse closed decoders, cardinality agreement and depth-16 limit |
| Existing target sum spelling | [generators.ts](../../../impl/cli/src/generation/generators.ts), typescriptTypedType | Retain `variant` discriminator and variant-specific payload |
| Acceptance surface | [VALIDATION](../VALIDATION.md#v11), V11/V12/V13 | Test semantics and explicit unsupported outcomes independently |
| Decision boundary | [DEC-05](../DECISIONS.md#dec-05) | Candidate only; public syntax and persistence remain unselected |
| Downstream frontier | [PCR status](../profile-compiler-reconciliation/STATUS.md) | Do not clear frozen configuration blockers by editing hashes |

Selected candidate choices, not promoted decisions:

- Reuse `scalar`, `named`, `optional`, `list`, `set`, `sum`. Do not introduce a
  seventh type constructor for references; bindings are separate metadata.
- Optional missing fields and explicit null normalize to absence for semantic
  comparison. Undefined is not JSON. This candidate does not change the older
  body decoder's required-field behavior.
- Lists preserve ordering and allow duplicates. Sets reject duplicate semantic
  values and ignore order. Empty collections are valid. Entity elements compare
  by identity; Value Objects by all values; tagged alternatives by tag/payload.
- Entity identity is exactly one required property: String, UInt64, or a finite
  Value Object built from those types. Collections, optional identities, Entity
  embedding as identity, Bool identities and sum identities are unsupported here.
- Named embedding must be acyclic, including through optional/collection fields.
  Finite identity-reference cycles are allowed. Projection-dependency cycles,
  missing targets and missing fields reject. Optional and collection boundaries
  cannot be silently traversed by a field projection.
- Closed shapes reject extras. Explicitly open content rejects as unsupported;
  this does not pretend an open payload has closed-shape assurance.
- The selected **JSON-safe UInt64 envelope** is 0 through 9007199254740991. Larger
  values, fractions, negatives, decimal strings and bigint reject. This is not
  full UInt64 or cross-language numeric parity; no existing numeric implementation
  is removed or reinterpreted.

The current decoder rejects an optional element directly inside optional, list
or set. That restriction is retained and tested, not described as support for all
possible nested type expressions. VO invariant references are retained, not
resolved or executed by this candidate. Other semantic graph relationships remain
the existing compiler's responsibility.

## Implementation boundary

`compileFieldReferenceModel(input)` validates declarations and binding type parity
and returns a deep-frozen, digest-bound nominal snapshot. It reads no files and
emits no code. `fieldValueKey(model, selector, value)` validates closed JSON values
and returns a semantic comparison key. It rejects reconstructed snapshots and
validates all Entity fields even though Entity equality uses identity only.

Reference metadata does not fetch instances or enforce equality with a stored
target field. No database, provider, ownership relationship or canonical graph
edge is synthesized. The candidate JSON object boundary rejects accessors,
non-JSON values and inherited-only record shapes; it is not a sandbox for hostile
JavaScript proxies or a proof of denial-of-service resistance.

## Validation and preservation

Final results are synchronized in [PCR status](../profile-compiler-reconciliation/STATUS.md).
The selected regression command, from the DomainSpec root:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run \
  node --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-concurrency=1 \
  impl/cli/test/input/field-reference-model.test.ts \
  development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
  impl/cli/test/generation/configured-rules.test.ts \
  impl/cli/test/generation/profiled-project.test.ts \
  impl/cli/test/input/project-model.test.ts
```

Full CLI typecheck uses the existing shared `node-env` launcher. Regression
includes existing native Rule/L0 target compilation and execution, but the new
model tests validate the TypeScript candidate itself, not three generated targets.
The full CLI test aggregate was not run. No toolchain or dependency installation.

| Exact tested artifact | SHA-256 |
| --- | --- |
| Validator | `6ae5cee12a307023e28bde0dd5d2658df20b20f0bb8074f81838dd79f4a440b5` |
| Conformance tests | `bb82b642c8fa242508a32d4a433941a5cccc747bc225592139745d724fdbe935` |
| Commerce fixture | `841a27686381d7445a9f0b7d585ab340eebff360b759144321d9a37560d9f8bf` |
| Candidate descriptor | `9a012a5a669936620e71a6d8e41457b9ef975dd53703c629c26e000ff1d4262d` |

The exact write envelope is these four artifacts, this report, the new CLI
test-discovery entry and PCR status. Parent WORK-ITEMS, DECISIONS, VALIDATION,
profiles, PCR configuration and legacy compiler inputs are preserved. Their
existing admission/completion claims are not silently upgraded. Removing only
the new test entry recovers package preimage
`d42cced061c87107f81693a43af3fb54cc1a424ad5dac58aa9d49069adb0cd88`.

## Task Session Result

- Task: DSR-009, bounded candidate contract/conformance slice.
- Runtime: local native execution; no adapter, subagent or handoff.
- Gate: existing `next` authorization covers candidate construction, not admission.
- Decisions: conservative existing-constructor envelope; explicit reference
  metadata; no public syntax, default cutover or storage effects.
- Context: eight controlling sources above; obligations covered for this subset.
- Synchronization: successor report and PCR status; historical parent receipts
  remain intact. No experiment-harness claim; not a skill-development task.
- Result: candidate technical evidence only. Integration and complete DSR-009
  closure require the remaining decisions below.

## Remaining decisions and open questions

DEC-05 still owns final field/reference semantics. Before selecting a public
profile or extending dependent generators, review the candidate's absence/null,
finite identity, embedding-cycle and projection rules against intended consumers.
Full UInt64 wire/target representation, nullable collection elements, recursive
finite-value types and open-content assurance remain explicit follow-up work.

The proposed next construction step is to select the field/reference contract
for checked-project integration, with any expanded constructor/numeric envelope
specified and tested first. This candidate does not itself clear PCR-05's
DSR-009 blockers or complete PCR-06. Persistence remains DSR-028; AlchLang remains
separately reconciled. No release, publication or operational owner action is
required to run this candidate's tests.
