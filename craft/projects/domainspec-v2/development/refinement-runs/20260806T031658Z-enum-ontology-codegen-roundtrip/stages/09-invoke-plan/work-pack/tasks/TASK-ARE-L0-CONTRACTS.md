# TASK-ARE-L0-CONTRACTS — Freeze the Ontology and Input Denominator

## Objective

Create immutable, independently reviewable inputs before any source emitter is
implemented. Layer L0, slice S0, wave W0.

## Source contracts

- `../../../06-invoke-design/DESIGN.md#architecturerealizationspecv1`
- `../../../06-invoke-design/DESIGN.md#architectureobligationcataloguev1`
- current `development/implementation-conformance/ontology-experiment/ontology.json`
- current `development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json`
- current `development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json`
- `projects/domainspec-v2/development/refinement-runs/20260807T044715Z-enum-snapshot-catalogue-rebind/stages/06-invoke-design/DESIGN.md#view-3--low-level-contracts`

## Smallest Working Units

### SWU-ARE-001 — Freeze the expected-red ontology realization-spec contract

- Status: complete; terminal and closeout evidence current.

- Primary behavior: declare one exact ontology/profile-to-Enum-realization
  denominator and prove the projector implementation is absent.
- Independent acceptance: schema, positive expected spec, missing-property
  mutant, and red receipt validate; the exact planned projector path does not
  exist.
- Split analysis: schema/fixture/red receipt are plausible children, but none
  independently establishes a frozen red denominator; they are one immutable
  owner handoff and never edited after closeout.
- Dependencies: none.
- Source anchors: ontology `architecture.EnumImplementation`, binding/Enum
  properties, `architecture.composed_from`; Design DCR-01 repair.
- Write scope:
  - `projects/domainspec-v2/development/architecture-realization-compiler/contracts/architecture-realization-spec.schema.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/realization-spec.expected.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/realization-spec.missing-property.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/tools/verify-red-realization-spec.mjs`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json`
- Done criteria: complete payload is digest-bound; missing-property mutant names
  exact expected code `ARCH_REALIZATION_PROPERTY_MISSING`; verifier confirms the
  projector target is absent and returns a successful red-validation receipt.
- Validation: `node projects/domainspec-v2/development/architecture-realization-compiler/tools/verify-red-realization-spec.mjs`.
- Execution owner: `manual` independent obligation/ontology fixture owner; not
  the later projector implementer.
- Expected result shape: standard SWU receipt with `result: pass`, five exact
  files, red-state validation, no implementation claim.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-001`.

### SWU-ARE-002 — Implement the ontology realization-spec projector

- Status: complete; terminal and closeout evidence current.

- Primary behavior: deterministically derive `ArchitectureRealizationSpec/v1`
  from exact ontology/profile bytes.
- Independent acceptance: the frozen positive fixture matches byte-for-byte and
  removing one required property fails only with
  `ARCH_REALIZATION_PROPERTY_MISSING`.
- Split analysis: source derivation and its positive/negative test are not useful
  independent units; the smallest executable projector requires both.
- Dependencies: SWU-ARE-001 terminal and closeout receipts.
- Algorithm: exact-load and digest inputs; select exactly one Enum realization;
  validate reciprocal type reference; select required stable property/operator
  IDs; validate applicability/owner/forbidden-inference; canonical-sort; digest.
- Edge cases: duplicate type/property IDs, stale profile digest, unknown operator,
  missing owner route, wrong applicability, relation accidentally required for a
  direct proof.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-realization-spec.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/spec/derive-enum-realization-spec.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/ontology-spec.test.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/tsconfig.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-002.json`
- Done criteria: no ontology writes; deterministic spec equals frozen payload;
  all declared negative codes exact; output has `authority_effect:none`.
- Validation:
  - `npm --prefix projects/domainspec-v2/impl exec -- vitest --root projects/domainspec-v2/impl run architecture-conformance/typescript/realization-tests/enum/ontology-spec.test.ts`
  - `npm --prefix projects/domainspec-v2/impl exec -- tsc --noEmit -p projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/tsconfig.json`
  - `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`
- Execution owner: `subagent` or Task Session local fallback, implementation
  owner distinct from SWU-ARE-001 fixture owner.
- Expected result shape: standard SWU receipt plus positive/mutant digests and
  tool versions.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-002`.

### SWU-ARE-003 — Freeze the independent full-payload obligation catalogue

- Status: complete; terminal and closeout evidence current.

- Primary behavior: publish and validate `enum.member-bijection@1` outside all
  compiler imports.
- Independent acceptance: exact `status.pending/pending` and `status.paid/paid`
  payload passes; the same key with changed Paid value fails only with
  `ARCH_OBLIGATION_PAYLOAD_STALE`.
- Split analysis: positive catalogue and same-key mutant form one discriminating
  admission boundary; either alone cannot prove full-payload joining.
- Dependencies: SWU-ARE-002 proves ontology sufficiency, but catalogue derivation
  reads raw frozen ontology/profile inputs independently.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-obligation-catalogue.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/contracts/architecture-obligation-catalogue.schema.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/catalogue.same-key-drift.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue.mjs`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-003.json`
- Done criteria: full payload digest and input handles frozen; no imports from
  `impl/architecture-conformance`; exact drift diagnostic; owner identity differs
  from compiler/evaluator owners.
- Validation: `node projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue.mjs --catalogue projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json --self-test`.
- Execution owner: `manual` independent catalogue owner.
- Expected result shape: standard SWU receipt plus forbidden-import/owner check.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-003`.

### SWU-ARE-004 — Validate the candidate Enum definition snapshot

- Status: frontier/not-selected; dependency receipts current.

- Primary behavior: publish a reusable validator and one authority-bounded
  `OrderStatus` snapshot.
- Independent acceptance: two stable unique member pairs pass; duplicate ID,
  duplicate value, empty set, stale digest, or `canonical-promoted` self-claim
  fails with exact codes.
- Split analysis: validator and fixture are one executable contract; the fixture
  cannot be admitted without validation and the validator has no selected proof
  value without the fixture.
- Dependencies: SWU-ARE-003.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/enum-definition-snapshot.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/contracts/enum-definition-snapshot.schema.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/definition.snapshot.json`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/definition-snapshot.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-004.json`
- Done criteria: fixture uses `authority_status:candidate-fixture` and
  `authority_effect:none`; complete canonical serialization and digest checks.
- Validation: focused `definition-snapshot.test.ts` Vitest plus the shared
  realization test `tsconfig.json` typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt with fixture and validator digests.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-004`.

### SWU-ARE-015 — Rebind the independent catalogue to the frozen Enum snapshot

- Status: blocked-by-dependency; runs only after SWU-ARE-004 terminal and
  closeout receipts pass.
- Primary behavior: publish and independently validate one
  `ArchitectureObligationCatalogue/v2` whose definition reference exact-joins
  the `EnumDefinitionSnapshot/v1` produced by SWU-ARE-004.
- Independent acceptance: the positive snapshot-bound catalogue has zero
  diagnostics; a same-key changed payload emits only
  `ARCH_OBLIGATION_PAYLOAD_STALE`; stale definition path, byte digest, and
  semantic digest cases each emit their one exact code; the v1 regression stays
  green.
- Split analysis: v2 type/schema, positive catalogue, same-key/reference
  mutants, independent validator, and terminal receipt are plausible children,
  but none independently admits the new definition-to-expectation boundary.
  Together they form one discriminating unit.
- Dependencies: SWU-ARE-004.
- Source anchors:
  - `projects/domainspec-v2/development/refinement-runs/20260807T044715Z-enum-snapshot-catalogue-rebind/stages/06-invoke-design/DESIGN.md#view-3--low-level-contracts`
  - `../../../06-invoke-design/DESIGN.md#enumdefinitionsnapshotv1`
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-obligation-catalogue-v2.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/contracts/architecture-obligation-catalogue-v2.schema.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v2.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/catalogue.same-key-drift.v2.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue-v2.mjs`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-015.json`
- Algorithm: validate the exact ARE-004 snapshot and its byte/semantic digests;
  validate the Enum denominator from raw ontology/profile handles; retain v1
  and ARE-003 only as immutable predecessor lineage; reject Stage 08 expectation
  paths and compiler/evaluator imports; derive members only from
  `snapshot.members`; canonicalize language-neutral IDs and values; validate the
  positive, same-key, and isolated reference mutants; rerun v1 validation.
- Done criteria: v2 TypeScript/JSON contracts align; exact snapshot path/byte/
  semantic references pass; `supersedes_ref` binds the exact v1 bytes; positive
  diagnostics are zero; each mutant has one exact diagnostic; forbidden
  sources/imports are zero; v1 is unchanged and green; terminal receipt is
  complete with `authority_effect:none`.
- Validation:
  - `node projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue-v2.mjs --catalogue projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v2.json --self-test`
  - `node projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue.mjs --catalogue projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json --self-test`
  - `npm --prefix projects/domainspec-v2/impl exec -- tsc --noEmit -p projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/tsconfig.json`
- Execution owner: `manual` independent catalogue owner; never the emitter,
  compiler, adapter, or evaluator owner.
- Expected result shape: standard SWU receipt with predecessor lineage,
  positive/mutant/reference diagnostics, forbidden-source result, and v1
  regression.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-015`.

### SWU-ARE-005 — Validate the safe TypeScript target binding

- Primary behavior: admit one total, injective, path-safe mapping from semantic
  member IDs to `Pending` and `Paid` target identifiers.
- Independent acceptance: positive binding passes; path escape, absolute path,
  missing mapping, duplicate identifier, reserved/invalid identifier, unsafe key,
  or unadmitted provider specifier fails exactly.
- Split analysis: path and identifier checks are inseparable at the data-to-code
  admission boundary; both must pass before any binding is executable.
- Dependencies: SWU-ARE-015.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/typescript-target-binding.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/contracts/typescript-target-binding.schema.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/typescript.binding.json`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/target-binding.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-005.json`
- Done criteria: exact provider/profile/definition handles; no invented mappings;
  hostile binding matrix killed; stable digest.
- Validation: focused `target-binding.test.ts` Vitest plus shared realization
  test typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt with positive/hostile case counts.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-005`.

## Synchronization

Every SWU is sequential. No later unit may edit a frozen L0 catalogue or fixture;
repairs create versioned superseding artifacts and stop for the responsible
owner when semantics change.
