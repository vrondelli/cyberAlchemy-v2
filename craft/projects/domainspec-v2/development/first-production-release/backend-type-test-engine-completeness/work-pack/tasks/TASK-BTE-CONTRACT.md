> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for completed evidence and exact replacement routes.

# TASK-BTE-CONTRACT — Criterion kernel and profile contract

## Objective

Create one strict criterion kernel for the existing meta-type YAML contracts, then bind an owner-approved minted-project profile to exactly the 13 active backend kinds. This task does not authorize changing the admitted release profile.

## Source contracts

- `definitions/meta-types/meta-types.yml`
- `impl/spec/meta-types/**/*.schema.yml`
- `definitions/minted-project/supported-profiles.yml`
- `impl/spec/minted-project/node.schema.json`
- `work-pack/shared/DECISIONS.md`

## Dependencies and blockers

- SWU-BTE-001 has no technical dependency on the profile mapping, but this work-pack policy still requires W0 to close before any mutation-capable Task Session. It is the first executable unit after that gate.
- SWU-BTE-002 is blocked by B-BTE-001 and B-BTE-002: FPR-02B must name the supported profile version and approve the body-to-criterion mapping. FPR-02U is not a dependency.
- The task must not widen the current experimental profile in place.

## SWU-BTE-001 — Extract the shared criterion kernel

### Goal

Replace the duplicated YAML parsing and criterion evaluation in `validate-content.ts` and `instances.ts` with one fail-closed implementation that accepts a normalized `CriterionSubject`.

### Algorithm

1. Parse the repository's bounded YAML subset and reject tabs, duplicate keys, malformed indentation, unsupported constructs, and unknown rule forms.
2. Preflight every criterion for required fields, non-empty option lists, known rule names, and contradictory declarations.
3. Normalize source values without erasing the difference between missing, empty, whitespace-only, false, and zero.
4. Evaluate the eight existing rule forms: `at-least-one`, `none`, `all-nonempty`, `section-contains`, `table-has-column`, `attribute-equals`, `attribute-present`, and `attribute-one-of`.
5. Return stable, ordered violations carrying schema path, criterion ID, rule, subject path, and machine-readable code.
6. Adapt Markdown content and generated instance YAML to the kernel while preserving their current CLI behavior.
7. Add parity tests proving the two callers resolve identical criteria identically.

### Edge cases

- Duplicate YAML keys and unknown rules.
- Empty `options` and criteria with no rules.
- Missing values versus empty or whitespace-only values.
- Boolean `false` and numeric `0` must not be treated as absent.
- Conflicting rule declarations.
- A caller that drops schema or source identity.

### Write scope

- `impl/tools/lib/meta-type-criteria.ts` (new)
- `impl/tools/validate-content.ts`
- `impl/tools/instances.ts`
- `impl/tools/tests/meta-type-criteria.test.ts` (new)
- Existing directly affected tool tests

### Done criteria

- All 13 YAML schemas preflight successfully.
- All 16 current criteria are recognized.
- Both existing callers use the shared kernel; no second evaluator remains.
- Negative fixtures cover every fail-closed parser and normalization case above.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run validate:content
npm --prefix projects/domainspec-v2/impl run instances:validate
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Implementation owner: DomainSpec v2 toolchain owner.
- Review owner: meta-type contract owner.
- Handoff: refresh this Invoke pack with the kernel path, test receipt, and any newly unsupported YAML form.

## SWU-BTE-002 — Ratify the exact backend profile

### Goal

Add an owner-selected successor version of `feature-with-independent-node-files` that names exactly the 13 active backend kinds and binds each kind to its YAML formation contract and adapter behavior.

### Algorithm

1. Preserve the existing profile version unchanged.
2. Add a successor profile only after the FPR-02B receipt names its identifier and version.
3. Require an exact 13-kind set: no missing active kind, Saga reuse, UI kind, or duplicate.
4. Bind each entry to the canonical meta-type ID, schema path, schema digest, criterion count, and body-adapter version.
5. Validate paths against traversal and category mismatch.
6. Keep relationship support as a separate profile dimension; do not imply all 30 relationship signatures.
7. Derive any human-readable index from the machine contract and add negative contract fixtures.

### Write scope

- `definitions/minted-project/supported-profiles.yml`
- A new backend-profile contract/index under `impl/spec/minted-project/`
- Direct contract-loader and profile tests

### Done criteria

- The approved profile resolves to exactly 13 unique active backend kinds.
- Its formation bindings resolve to all 16 criteria and their recorded digests.
- Existing v1 fixtures retain their current behavior.
- UI kinds, Saga, missing entries, duplicate entries, and escaped paths fail validation.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Decision owner: FPR-02B supported-profile owner.
- Implementation owner: minted-project contract owner.
- Handoff: synchronize the decision receipt, profile version, and digest into `DECISIONS.md`, `TRACEABILITY.md`, and the execution dispatch before proceeding to breadth fixtures.
