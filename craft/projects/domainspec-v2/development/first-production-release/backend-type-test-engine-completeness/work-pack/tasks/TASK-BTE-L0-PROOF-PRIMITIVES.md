---
task: TASK-BTE-L0-PROOF-PRIMITIVES
layer: L0A-L0B
status: l0a-green-awaiting-independent-validation-freeze
swuCandidates: []
historicalSwus: [SWU-BTE-L0A-001, SWU-BTE-L0A-REPAIR-001]
successorSwus: [SWU-BTE-L0B-001]
updatedAt: 2026-07-23
---

# TASK-BTE-L0-PROOF-PRIMITIVES — Fail-Closed Shared Contracts

## Objective

Create the smallest common machine boundary that later BTE layers can use
without ambiguous identities, partial schema support, forged authority,
self-authored expectations, or path/write escape. Publication and semantic
execution are separate SWUs so the validation owner can author red cases
against real, immutable contract bytes.

## SWU-BTE-L0A-001 — Contract Publication

Status:
`implementation-present; historical-pass-receipt; current-proof-green`.

### Consumes

- Design SHA-256 `b99abbd87d73106cfc9c2f06e886930f6151d53c6f2e4a854e65f73013827296`;
- Design validation SHA-256 `f05f376fe726cf5b013ffa5280ab5a6cd6b00b8d2a950f97ce2098b0c26ecec9`;
- layering seed SHA-256 `01ae2c6589a412ebd2d847c40e38745fe891b3bf087928af0f3aaff8a35ca5d8`;
- the accepted L0 bootstrap decision at
  `work-pack/session-evidence/SWU-BTE-L0-001/20260723T000729Z-context-route-conflict/decision-gate.json`.

L0A does not consume `validation-inputs/l0/` and cannot emit a
`ValidationReceipt`.

### Emits

Under `impl/test-derivation-engine/src/bte/contracts/`:

- `artifact-handle.v1.schema.json`;
- `logical-identity.v1.schema.json`;
- `authority-class.v1.schema.json`;
- `diagnostic.v1.schema.json`;
- `exact-set.v1.schema.json`;
- `red-fixture-manifest.v1.schema.json`;
- `red-fixture-freeze-receipt.v1.schema.json`;
- `validation-receipt.v1.schema.json`;
- `contract-publication-receipt.v1.schema.json`.

Under `impl/test-derivation-engine/src/bte/validation/`:

- `diagnostics.ts`, the closed diagnostic-code registry shared with the
  validation owner and later semantic validators.

It also emits focused positive contract fixtures/tests, one root package script
named `verify:bte:contract-publication`, and these run-scoped artifacts under
`runs/<run-id>/l0a/`:

- `contract-publication-receipt.json`;
- `output-write-manifest.json`.

### Ordered Rules

1. Resolve the preserved handles without following paths outside declared roots.
2. Publish one explicit JSON Schema dialect and closed supported-keyword policy;
   reject any schema that uses an undeclared keyword.
3. Validate every contract against its declared meta-schema and positive fixture.
4. Verify that the diagnostic schema and TypeScript registry contain the same
   unique, deterministic code set.
5. Serialize deterministically and recompute every byte count and SHA-256 before
   emitting the publication receipt.
6. Fail if any output/write path differs from the L0A allowlist.

### Write Scope

Allowed: exact L0A contract and diagnostic-registry paths above; focused L0A
tests and positive fixtures; the exact `impl/package.json` script row; one new
`runs/<run-id>/l0a/` directory. The engine index may change only if needed to
export the bounded contract API.

Forbidden: `validation-inputs/`, semantic validator implementation,
current-v1 definitions/specs, formation/compiler/graph modules, consumers,
admissions, historical session evidence, UI, and public Arcanum.

### Done And Validation

- all nine contract shapes parse and validate against the declared dialect;
- all used schema keywords belong to the published supported set;
- diagnostic schema and registry close over the same exact code set;
- publication bytes and digests are stable over two invocations;
- receipt recomputation ignores producer-authored counts/status;
- the receipt explicitly grants no admission and is not a `ValidationReceipt`;
- no red manifest or freeze is read or written.

Run planned `verify:bte:contract-publication`, plus current `engine:test`,
`typecheck`, JSON/link checks, write-manifest comparison, and scoped
`git diff --check`.

### Stop And Handoff

Stop on an ignored keyword, open diagnostic set, nondeterministic bytes, write
escape, preserved digest drift, or any access to validation-owned inputs. The
historical Task Session passed and the bounded repair below restored current
receipt parity; route the independent validation owner before L0B.

## SWU-BTE-L0A-REPAIR-001 — Exact-Byte Evidence Repair

Status: `completed-pass-receipt-synchronized`.

### Primary Behavior

Restore the current L0A published byte set to the immutable receipt handles and
prove the existing publication verifier passes without replacing historical
run evidence.

### Consumes

- immutable `SWU-BTE-L0A-001` execution receipt and continuation handoff under
  `work-pack/session-evidence/SWU-BTE-L0A-001/20260723T020759Z-contract-publication/`;
- immutable run publication receipt and output-write manifest under
  `runs/20260723T020759Z/l0a/`;
- current nine contract schemas, `validation/diagnostics.ts`, publisher source,
  and package script;
- this applied repair contract.

### Allowed Writes

Append one additional LF to exactly:

1. `contracts/artifact-handle.v1.schema.json`;
2. `contracts/logical-identity.v1.schema.json`;
3. `contracts/authority-class.v1.schema.json`;
4. `contracts/diagnostic.v1.schema.json`;
5. `contracts/exact-set.v1.schema.json`;
6. `contracts/red-fixture-manifest.v1.schema.json`;
7. `contracts/red-fixture-freeze-receipt.v1.schema.json`;
8. `contracts/validation-receipt.v1.schema.json`;
9. `validation/diagnostics.ts`.

All nine paths are relative to
`projects/domainspec-v2/impl/test-derivation-engine/src/bte/`.
One append-only repair Task Session evidence directory is also allowed.

### Forbidden Writes

- `contracts/contract-publication-receipt.v1.schema.json`, which already
  matches;
- every historical Task Session or run receipt and write manifest;
- `validation-inputs/`, semantic validators, positive fixtures, publisher
  source, package scripts, or later BTE layers;
- current-v1, formation, compiler, graph, catalogue, proof, consumer, UI,
  admission, release, Craft, Inventory, visibility, or public Arcanum surfaces.

### Acceptance Evidence

1. Every repaired surface has the exact SHA-256 recorded in the immutable L0A
   receipt.
2. `npm --prefix projects/domainspec-v2/impl run
   verify:bte:contract-publication` passes without changing the existing run
   receipt or write manifest.
3. `npx vitest run src/bte/contract-publication.test.ts` passes from
   `projects/domainspec-v2/impl/test-derivation-engine/`.
4. `npm --prefix projects/domainspec-v2/impl run engine:test` passes.
5. `npm --prefix projects/domainspec-v2/impl run typecheck` passes.
6. `npm --prefix projects/domainspec-v2/impl run validate:docs` passes.
7. JSON parse, links, exact write scope, receipt digests, and
   `git diff --check` pass.
8. The repair receipt says `admission_granted=false` and
   `production_authorized=false`.

### Stop And Handoff

Stop if any mismatch is not the recorded one-additional-LF relation, any target
outside the nine byte surfaces changes, historical evidence would be rewritten,
the verifier still fails, or a formatter/commit strips the restored bytes.

A passing repair receipt routed to Invoke Refresh. This refresh closes
`BLK-DSV2-BTE-L0A-RECEIPT-DRIFT-001`, marks current publication proof green,
removes this candidate, and routes the independent validation owner.

## SWU-BTE-L0B-001 — Semantic Validation Execution

Status: `planned-predecessor-and-owner-gated`.

### Consumes

- current passing L0A publication verification, the exact immutable
  `contract-publication-receipt.json`, and all published contract/registry
  digests;
- package-local
  `validation-inputs/l0/red-fixture-manifest.v1.json` and
  `validation-inputs/l0/red-fixture-freeze-receipt.json`, authored by the
  independent validation owner after L0A;
- immutable validation-owner payloads under
  `validation-inputs/l0/fixtures/*.json` and no-follow filesystem inputs under
  `validation-inputs/l0/topology/*`, all truthfully bound by manifest handles;
- the same preserved Design, Design-validation, and layering-seed digests.

Missing, stale, implementation-authored, contract-mismatched, or
digest-mismatched inputs block selection and execution.

### Emits

Under `impl/test-derivation-engine/src/bte/validation/`:

- `validate-shape.ts`;
- `validate-semantics.ts`.

It also emits focused semantic tests, implementation-owned positive fixtures,
the root package script `verify:bte:contracts`, and run-scoped raw case results,
an output/write manifest, and `validation-receipt.json` under
`runs/<run-id>/l0b/`.

### Ordered Rules

1. Recompute L0A publication bytes/digests, every manifest fixture/topology
   handle, and the validation-owner freeze before interpreting a case.
2. Validate shape only; then run semantic validation for canonical IDs, content
   digests, producer/authority class, exact-set uniqueness, containment,
   diagnostic closure, and manifest/result recomposition.
3. Execute every positive and frozen red case exactly once and store raw input,
   expected diagnostic class/code, observed result, and output digest.
4. Fail if the observed case-ID set is empty or differs from the frozen
   manifest, if any expectation or L0A byte changes, or if write paths differ
   from the allowlist.
5. Independently recompute the case set, bytes, digests, and outputs before
   emitting one non-admitting `ValidationReceipt`.

### Required Red Cases

- structurally invalid input (`BTE_SCHEMA_INVALID`);
- unsupported schema keyword;
- missing, extra, or duplicate logical ID;
- malformed or mismatched SHA-256/content bytes;
- stale contract version or producer;
- forged or substituted authority class;
- absolute path, `..`, symlink escape, undeclared root, or output overwrite;
- empty or duplicate exact-set member;
- missing/extra/overlapping recomposition member;
- unknown diagnostic code or nondeterministic precedence;
- implementation-derived or post-run-rewritten expected value.

The closed diagnostic registry is the denominator: every one of its 25 codes
must have at least one causally isolated RED case. Grouped bullets above expand
to separate cases where the registry assigns separate codes. A fixture handle
is invalid if its path is absent, its bytes or no-follow link bytes do not
match, its root is undeclared, or it was created after the manifest was
serialized.

### Independent Validation-owner Write Scope

Before L0B selection, the validation owner alone may create:

- `validation-inputs/l0/fixtures/*.json`;
- `validation-inputs/l0/topology/*`;
- `validation-inputs/l0/red-fixture-manifest.v1.json`;
- `validation-inputs/l0/red-fixture-freeze-receipt.json`.

It may not edit L0A contracts, diagnostics, semantic validators, tests,
implementation-owned positives, package scripts, run outputs, plans, or
historical receipts. `root_id=domainspec-v2-bte` maps to the BTE package root.
Owner and producer digests use the canonical owner-identity rule recorded in
the Work Pack. The owner serializes fixture/topology bytes first, the manifest
second, and the freeze receipt last.

### Write Scope

Allowed: the two semantic-validator paths, focused L0B tests, positive fixtures,
the exact `impl/package.json` script row, and one new `runs/<run-id>/l0b/`.

Forbidden: every L0A published byte, `validation-inputs/`, current-v1 sources,
formation/compiler/graph modules, consumers, admissions, historical session
evidence, UI, and public Arcanum.

### Done And Validation

- frozen manifest case set equals raw result case set exactly;
- every red fails with the declared stable code and no alternative false green;
- positive cases are deterministic over two invocations;
- receipt recomputation ignores producer-authored counts/status;
- `ValidationReceipt` declares `admission: not-granted` and cannot validate as a
  BuildReceipt, ProofReceipt, ReplayResult, or AggregateResult;
- L0A publication digests and validation-owned input digests remain unchanged;
- legacy compatibility APIs are absent from the BTE contract dependency graph.

Run planned `verify:bte:contracts`, plus current `engine:test`, `typecheck`,
JSON/link checks, write-manifest comparison, and scoped `git diff --check`.

### Stop And Handoff

Stop on missing or unresolved fixture bytes, contract/freeze mismatch, ignored
keyword, expectation rewrite, dependency on legacy completeness behavior, or
write escape. A passing receipt routes to Invoke Refresh before any L1 SWU is
instantiated.
