# Runtime Handoff Pack

## Identity

- Task/SWU: `SWU-OEWSN-004`
- Source task/work-pack: `planning/work-pack/tasks/TASK-OEWSN-01-RELATION-CORE.md`
- Session/run id: `20260802T014636Z`
- Session evidence path: `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T014636Z`
- Runtime handoff: `runtime`
- Repository revision: `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`
- Evidence date: `2026-08-02`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `O-01` selected unit and dependencies | `covered` | `planning/SWU-MANIFEST.json#/swus/SWU-OEWSN-004` | SWU-004 is selected and SWU-021 is complete. |
| `O-02` exact material/output partition | `covered` | `planning/SWU-MANIFEST.json#/swus/SWU-OEWSN-004/material_write_scope` | Six material paths plus one terminal receipt equal the declared write scope. |
| `O-03` fresh build acceptance is reachable inside scope | `block` | `scripts/build-thin-prototype.mjs:559-602`; `upstream/L1-BUILD.lock.json:137-207`; `upstream/overlay/first-working-version-manifest.json:21-25` | The overlay manifest is mutable, but both files that bind its digest and size are outside the material scope. |
| `O-04` exact closeout contract | `covered` | `planning/CLOSEOUT-SYNC-INVENTORY.json#/entries/SWU-OEWSN-004` | The lifecycle owner, four closeout targets, validation commands, receipt shape and successor policy are declared. |
| `O-05` no weakening of source/build authority | `covered` | `scripts/build-thin-prototype.mjs:559-602` | The builder's fail-closed binding checks remain protected and unchanged. |

Strict coverage: `block`

## Selected Sources

- `planning/work-pack/tasks/TASK-OEWSN-01-RELATION-CORE.md`
  - Selectors: `SWU-OEWSN-004`, `Write scope`, `Validation`
  - Obligations: `O-01`, `O-02`, `O-03`
  - Evidence: the unit requires an overlay-manifest change and a fresh patch/build admission.
- `planning/SWU-MANIFEST.json`
  - Selectors: `swu_id=SWU-OEWSN-004`
  - Obligations: `O-01`, `O-02`
  - Evidence: the six-path material inventory excludes both immutable binding files.
- `planning/MUTATION-ADMISSION-CONTRACT.json`
  - Selectors: `required_evidence`, `material_inventory_source`, `closeout_inventory_source`
  - Obligations: `O-02`, `O-04`
  - Evidence: product mutation stays false until live Task Session admission passes.
- `planning/CLOSEOUT-SYNC-INVENTORY.json`
  - Selectors: `common_contract`, `SWU-OEWSN-004`
  - Obligations: `O-04`
  - Evidence: a blocked terminal result is synchronized by Invoke Refresh before the chain returns.
- `scripts/build-thin-prototype.mjs`
  - Selectors: lines 559-602
  - Obligations: `O-03`, `O-05`
  - Evidence: live overlay and first-working identities must equal the L1 lock, and the first-working overlay binding must equal the live overlay.
- `upstream/L1-BUILD.lock.json`
  - Selectors: lines 137-207
  - Obligations: `O-03`, `O-05`
  - Evidence: it binds both the overlay manifest and first-working manifest by SHA-256 and size.
- `upstream/overlay/first-working-version-manifest.json`
  - Selectors: lines 21-25
  - Obligations: `O-03`, `O-05`
  - Evidence: it separately embeds the current overlay-manifest identity.

## Architecture Guidance

Do not bypass or loosen the L1 build bindings. Repair ownership either by expanding
the admitted material scope to rebind both immutable artifacts consistently or by
adding a separately owned semantic-navigation build binding.

## Constraints And Non-Goals

- No renderer or visible UI change belongs to SWU-004.
- No source predicate, direction, provenance or authority field may be lost.
- Build-lock checks are protected acceptance behavior, not implementation friction.
- This blocked handoff authorizes no product mutation.

## Write Scope

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/relationPresentation.test.ts`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/overlay-manifest.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/patches/0003-oew-semantic-navigation.patch`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`

## Validation Surface

- Focused retained TypeScript/Vitest fixtures.
- Fresh patch application and thin-prototype build admission.
- JSON manifest validation and scoped whitespace check.
- Protected-source equality.

## Gaps And Blockers

- `BLK-OEWSN-004-BUILD-BINDING-SCOPE`: changing the admitted overlay manifest
  invalidates two required immutable bindings that SWU-004 may not update.

## Authority Precedence

1. `upstream/L1-BUILD.lock.json` and the fail-closed build admission checks
2. `planning/MUTATION-ADMISSION-CONTRACT.json`
3. `planning/SWU-MANIFEST.json` and the selected task

## Fallback Exploration Rule

Broad repository exploration is allowed only to repair
`BLK-OEWSN-004-BUILD-BINDING-SCOPE` through an Invoke-owned planning refresh.
It does not authorize product mutation or weakening the build lock.

## Provenance

- Overlay manifest: `4ae2740a7ba7104678f8081504d4a8a957b5f151eedf8bd5f8659d5a18744562`
- First-working manifest: `5fdb50e010c76ee9970b6ec92e64595990cbf74310602e8710ff676c25f4454d`
- L1 build lock: `f8113ad33003ed0a8f8c07eef7c4390499e6e9bbb358445969e5fde20640672b`
- Builder: `5775df6018fe10e2cd9c2643e9eef9ebb57033165d807e4b1d29eb7c0ea9baa8`
- Builder mode: `lean`

## Output Paths

- Markdown: `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T014636Z/context-pack.md`
- JSON/index: `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T014636Z/context-pack.json`
