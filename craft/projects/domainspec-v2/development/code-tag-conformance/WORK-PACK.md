---
node_type: work-pack
is_session: false
status: candidate
boundary: INTERNAL — code-tag subsystem conformance; consume root authority; engine δ-rules never described
created: 2026-07-06
authored_by: invoke (mode: plan)
design: ./DESIGN.md
layering: ./implementation-layering.md
target_artifact: projects/domainspec-v2/impl/governance/tags
complexity: medium
governing_decision: DEC-DSV2-SPEC-HOMING
---

# Code-Tag Conformance — Work-Pack

Finish the R0 migration across the whole code-tag subsystem so it matches the v2 pattern: **root authority,
machine schema, one gate.** `impl/spec/*.md` is never a source for these tools. v1 (`implementation/
domainspec/`) stays read-only. Validators are runnable, so every acceptance is machine-checkable.

**Global regression gate for every SWU:** `npm run validate`, `npm run engine:test`, **and**
`npm run tags:test` stay RC 0 after the edit.

## SWU manifest
| SWU | Layer | Change | Depends | Acceptance (green) |
| --- | --- | --- | --- | --- |
| **CT-1 ✅ DONE** | L0 | `validate-code-tags` reads the type set from root meta-type `.schema.yml` files, not `spec/TAXONOMY.md` | — | **[met 2026-07-10]** `tags:test` green from schema taxonomy; invalid-type fixture rejects; scratch run passes with `spec/TAXONOMY.md` absent; **R2 code-tag landmine closed** |
| **CT-3** | L0 | Reset `code-tag-waivers.yaml` to v2-clean; fix `docs/features` → `spec/features` in `CODE-TAG-SCHEMA.md` | — | waivers valid/empty; no `docs/features` residue; `tags:test` green |
| **CT-2** | L1 | Author `code-tag.schema.yml` (SCHEMA-CONSTITUTION) + shape validation; retire prose to companion | CT-1 | schema rejects a malformed tag; companion points to schema |
| **CT-4** | L2 | Fold the code-tag check into `npm run validate` | CT-1, CT-2, CT-3 | `validate` covers code-tags; RC 0 |

## CT-1 — Taxonomy from root (L0)
- **State (2026-07-10): DONE.** `validate-code-tags` now defaults `--taxonomy` to `spec/meta-types` and
  reads `meta_type:` from `.schema.yml` files via `loadTaxonomyTypesFromSchemas`; `parseTaxonomyTypes` remains
  exported for compatibility. The unit fixture was retargeted from UI `Binding --mutates--> Operation` to
  backend `Interface --exposes--> Operation` so CT-1 tests the backend-14 schema set. User-facing remediation /
  schema companion wording now points at `spec/meta-types`. UI recognition still rides on
  `GAP-SH-UI11-MIGRATE`.
- **Write scope delivered:** `impl/governance/tags/tools/lib/code-tag-rules.ts` (new
  `loadTaxonomyTypesFromSchemas`), `impl/governance/tags/tools/validate-code-tags.ts` (default `--taxonomy` +
  call site), focused tests/fixtures, and CT-1-facing taxonomy-source wording in the code-tag schema/remediation
  companions.
- **Detail:** current `parseTaxonomyTypes(spec/TAXONOMY.md)` reads column 1 of the MD table → normalized
  type set. Replace the *source*, not the contract:
  - **Inputs:** the glob `impl/spec/meta-types/**/*.schema.yml`; each declares `meta_type: <TypeName>`.
  - **Rule:** for each schema file, read `meta_type`; `normalizeTypeName(meta_type)` → key; display = raw.
    Build `Map<string,string>` — the same shape `parseTaxonomyTypes` returns.
  - **Reader:** build-from-owned on the YAML-subset reader already in `tools/instances.ts` (or a minimal
    `meta_type:` line read — one field, no full YAML needed). No new dependency.
  - **Default path:** `--taxonomy` default `spec/TAXONOMY.md` → `spec/meta-types` (the schema root); call
    `loadTaxonomyTypesFromSchemas(dir)`. Keep `parseTaxonomyTypes` exported (tests/back-compat).
  - **Edge cases:** empty dir → empty Map → `CT-VAL-001` (unchanged UX); a schema missing `meta_type` is
    skipped; UI types appear only once their schemas exist (`GAP-SH-UI11-MIGRATE`).
- **Validation:** `npm run tags:test` (8/8); flip a fixture concept `type` to a non-type → still flagged
  (discriminating); `validate`/`engine:test`/`typecheck` RC 0.
- **Verification:** `validate-code-tags` recognizes the 14 backend types with `spec/TAXONOMY.md` absent
  (prove the R2 landmine is closed by temporarily renaming it in a scratch run).

## CT-3 — Waiver reset + v1 residue (L0)
- **Write scope:** `impl/governance/tags/code-tag-waivers.yaml`, `impl/governance/tags/CODE-TAG-SCHEMA.md`.
- **Detail:** the 4 AEO waivers target `backend/src/modules/agent-execution-orchestrator/…` (app-runtime,
  below the adapter line — fixture residue). Per D-CT-2 (owner confirm): reset `waivers: []` (recommended)
  or keep only entries whose `file` exists in v2. In `CODE-TAG-SCHEMA.md`, change the canonical-shape
  `spec_ref.path` example `docs/features/payments/SPEC.md` → `spec/features/payments/SPEC.md`.
- **Validation:** `tags:test` green; grep `docs/features` in `impl/governance/tags/` → none.
- **Verification:** waiver file parses and matches the `Waiver` type; no expired/orphan entries.
- **Dovetail:** this is `SWU-APE-004`'s code-tag half — cross-reference, do not double-execute.

## CT-2 — Tag contract as schema (L1)
- **Write scope:** new `impl/governance/tags/code-tag.schema.yml`; `impl/governance/tags/CODE-TAG-SCHEMA.md`
  (retitle to companion); optional shape-validation wiring in `validate-code-tags.ts` or a small helper.
- **Detail (D-CT-3 = MVP):** author `code-tag.schema.yml` in the SCHEMA-CONSTITUTION format mirroring
  `impl/spec/meta-types/structural/entity.schema.yml`. Declare the tag's `required_structure` from the owned
  TS types (`code-tag-types.ts`): `concept.id` (required, string), `concept.type` (required; ∈ taxonomy),
  `concept.concern` (∈ `{biz,sys}`), `concept.spec_ref.{path,section}`, `edges[].{edge (∈ relationships),
  to}`. Add a shape-validation pass (or extend the existing checks) that reads the schema and rejects a tag
  missing a required field or with a bad enum. **Shape only — never parse Formal/semantic content (moat).**
  MVP does **not** rewrite the existing `type ∈ taxonomy` / edge-endpoint checks; it *declares* the contract
  and validates structure.
- **Validation:** pos fixture (well-formed tag) PASS; neg fixtures (missing `concept.id`; `concern: xyz`)
  REJECTED; `tags:test`/`validate` green.
- **Verification:** `CODE-TAG-SCHEMA.md` names `code-tag.schema.yml` as the machine authority; a reviewer can
  predict a tag's validity from the schema alone.

## CT-4 — One gate (L2)
- **Write scope:** `impl/package.json` (`validate` script).
- **Detail:** add the code-tag check to the `validate` chain: `… && npm run tags:extract && npm run
  tags:validate` (composability optional). **D-CT-4:** the gate needs a deterministic corpus —
  `tags:extract` reads tagged source. If the only tagged code is the AEO fixture, wire the fixture-scoped
  extract+validate and record the residue (no real backend corpus yet). Do not add a gate that is red for
  lack of input.
- **Validation:** `npm run validate` RC 0 and demonstrably runs the code-tag step (its output appears);
  `engine:test` RC 0.
- **Verification:** removing a required tag field in a fixture turns `npm run validate` red (the gate bites).

## Dispatch technique trace
`sequence` (L0→L2) · `owner_boundary_check` (each SWU→code-tag subsystem; root authority read-only; moat
untouched) · `artifact_contract_bridge` (each SWU satisfies `tags:test`/`validate`) · `validation_loop`
(per-SWU acceptance = validator RC 0 + discriminating fixture) · `concrete_path_evidence` (exact files +
validators) · `scu_swu_reduction` (4 SWUs, one coherent change each) · `recomposition_proof` (→ Batch-2
code-tag row closes) · `residue_ledger` (below). No full dispatch JSON — single-owner sequence, no delegated
subagents.

## Distill validation — flag
- **Smallest coherent units:** ✅ one change per SWU; CT-1/CT-3 split so L0 is two small units, not one big one.
- **Recomposition proof:** ✅ CT-1..CT-4 green ⇒ code-tag subsystem conformant ⇒ Batch-2 `code-tag` row closes.
- **Gaps named (repair path):** (1) **CT-2 balloon risk** — bounded to schema+shape MVP (D-CT-3). (2)
  **CT-4 corpus** — may be fixture-only until real tagged backend exists (D-CT-4). (3) **UI types** —
  inherited from `GAP-SH-UI11-MIGRATE`, not owned here.
- **Verdict:** flag (routable — all three gaps carried).

## Residue
- CT-2 is contract+shape only; semantic satisfiability stays the engine moat.
- CT-4's real-corpus gate depends on committed tagged backend code (fixture-only until then).
- Dynamic edge-law composability enforcement across the full signature set stays under `CTX-DSV2-APE`
  (`check-code-tag-composability` checks code-composition patterns, a separate concern from this pack).

## Cross-pack ledger
- **CT-1 → batch-1 R2 prerequisite** (unblocks `spec/TAXONOMY.md` deletion; closes the CT-VAL-001 landmine).
- **CT-3 == `SWU-APE-004`** (code-tag half).
- Recomposition target: `IMPORT-MANIFEST.md` Batch-2 `code-tag` reformulation row.

## Next route
`task-session` per SWU. **CT-1 is done** (L0; closes the code-tag `TAXONOMY.md` deletion landmine for R2).
Next within this pack: **CT-3** (waiver reset + `docs/features` residue), then CT-2, then CT-4. R2 still
requires `GAP-SH-UI11-MIGRATE` before deleting/generating `TAXONOMY.md`.
