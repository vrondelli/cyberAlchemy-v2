# TASK-CDSC3-CONTRACTS

## Objective

Freeze generation-3 imports, atomic targets, and browser evidence contracts
before any browser source or observation artifact is generated.

## SWU-CDSC3-001 - Protected Import And Atomic Target Contract

**Goal:** implement versioned schemas/direct validators for exact predecessor
imports and six outcome-independent target propositions.

**Dependencies:** approved Invoke package only.

**Source anchors:** `SPEC.md#Immutable-Inputs`, `SPEC.md#Atomic-Target-Contract`,
generation-2 `generations/index.json`, parent F3 `semantic.S`, generation-2
audit/provenance, and UI-repair corpus/policy/dossier handles listed in
`IMPLEMENTATION-PLAN.md`.

**Inputs:** exact generation-2 tail; parent/M1/M2/overlay/projection/results;
UI-repair corpus, policy, dossier, and integrated audit; six target definitions.

**Ordered algorithm:**

1. Freeze a protected-input manifest containing paths, raw SHA-256 digests,
   record/generation handles, expected statuses, and allowed import semantics.
2. Define `cdsc.atomic-target-set.v1` with exactly six target IDs, kind,
   parent-field selector, canonical proposition, and target digest.
3. Derive each target from frozen parent `S`; compare against the six approved
   propositions and reject extra source fields.
4. Validate that UI imports remain `DEFER`/`missing` and prohibit local
   portability or identity inference.
5. Add direct validator/schema vocabulary parity tests.
6. Add negative vectors for wrong predecessor, changed parent text, observed
   outcome input, combined/missing/duplicate/overlapping target, semantic
   reordering, unknown field, and UI status inflation.
7. Verify generations 1/2 and every imported file remain byte-identical.

**Write scope:** `contracts/protected-import.schema.yml`,
`contracts/atomic-target-set.schema.yml`, `runtime/validate-imports.mjs`,
`runtime/validate-atomic-targets.mjs`, `fixtures/contracts/import-target-vectors.json`,
`tests/import-target-contract.test.mjs`, and `runs/SWU-CDSC3-001/`.

**Done criteria:** exact imports validate; six target records/digests are
deterministic; every invalid vector rejects before browser work; protected bytes
are unchanged.

**Acceptance evidence:** Task Session context/result/receipt, schema/direct
parity, target snapshot, negative-vector table, byte-protection check, and
observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/import-target-contract.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route only to SWU-CDSC3-002 with accepted import manifest, target
set, validators, and exact target handles. Do not install browser dependencies.

**Execution status:** complete. `runs/SWU-CDSC3-001/receipt.json` records 17/17
tests passing, twelve rejected negative vectors, fifteen protected files, and
exact protected-manifest and target-set handles.

## SWU-CDSC3-002 - Browser Runtime And Observation Contract

**Goal:** resolve and freeze the real browser runtime plus schemas for source
manifest, baseline, mutation observations, edit diffs, and supporting images.

**Dependencies:** accepted SWU-CDSC3-001 and `DEC-CDSC3-011`.

**Source anchors:** `ARCHITECTURE.md#Dependency-Interface-View`,
`IMPLEMENTATION-PLAN.md#Browser-Runtime-Gate`, Savvy `package.json`/lockfile,
and the accepted atomic target handle.

**Resolved runtime decision:** `DEC-CDSC3-011` authorizes a pinned isolated
install inside this package during SWU002. No install occurred during the
Decision Gate.

**Decision Gate history:**

1. **Pinned isolated install (selected):** authorize package-local
   `@playwright/test` plus Chromium, freeze lock/runtime/browser digests, and
   prohibit dependency writes outside this package. Cost: download and local
   disk use; benefit: reproducible owned runtime.
2. **Bind existing runtime (not selected):** use an existing Playwright executable
   and browser cache; freeze their paths, versions, and digests. Cost: more
   environment dependence; benefit: no download.
3. **Defer (not selected):** write a blocked receipt and stop before source/harness/evidence
   generation. Cost: no generation-3 progress; benefit: zero runtime mutation.

**Ordered algorithm after approval:**

1. Record approval and selected runtime source.
2. Create a package-local runtime descriptor and lock/digest manifest.
3. Prove Chromium launches, renders a fixed local page, exposes structured DOM,
   and captures one support screenshot.
4. Define schemas/direct validators for source manifest, baseline witness,
   browser observation receipt, and edit-surface diff.
5. Require structured state for every target; screenshots cannot satisfy a
   missing structured field.
6. Add launch-failure, missing-browser, screenshot-only, unknown-observable,
   partial-vector, wrong-runtime, and edit-leak negatives.
7. Verify no predecessor, Savvy, or UI-repair file changed.

**Write scope:** package-local `browser-runtime/`, browser contract schemas,
`runtime/validate-browser-*.mjs`, browser contract fixtures/tests, and
`runs/SWU-CDSC3-002/`. No other package or source checkout.

**Done criteria:** decision recorded; runtime launches deterministically;
contracts reject incomplete/screenshot-only evidence; protected sources remain
unchanged. If no option is approved, result is BLOCK rather than partial PASS.

**Acceptance evidence:** decision artifact, runtime descriptor/lock/digests,
smoke-run output, contract tests, protection hashes, Task Session receipt, and
observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/browser-contract.test.mjs
```

**Execution owner:** local fallback with human Decision Gate.

**Handoff:** on pass, route to SWU-CDSC3-003 with runtime and contract handles;
on block, stop with no generated browser evidence.

**Execution status:** complete. `runs/SWU-CDSC3-002/receipt.json` records the
isolated 1.61.1/Chromium-1228 runtime, two identical smoke runs, 13/13 focused
tests, 114/114 aggregate tests, and exact contract handles.

## Synchronization

SWU001 and SWU002 are complete. W0 is closed and SWU003 is selected.
