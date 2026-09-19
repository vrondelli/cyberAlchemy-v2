---
node_type: design
is_session: false
status: candidate
created: 2026-07-06
authored_by: invoke (mode: design)
work_pack: ./WORK-PACK.md
layering: ./implementation-layering.md
target_artifact: projects/domainspec-v2/impl/governance/tags (the code-tag / C6 code↔spec binding subsystem)
source_of_intent: 2026-07-06 code-tag conformance assessment (this session) — 5 gaps
parent: Batch-2 reformulation (IMPORT-MANIFEST.md); sibling of batch-1
governing_decision: DEC-DSV2-SPEC-HOMING (no hand-authored projections; consume root)
---

# Code-Tag Conformance — Design

## 0. What this is and why now

The code-tag subsystem (`impl/governance/tags/`) is the **C6 enforcement arm** — it binds implementation
symbols (`@biz`/`@sys` tags) to DomainSpec concepts + relationship edges (constitution C6: "code must bind
to documented concepts via explicit anchors"). It is a **legacy Batch-2 import** that never received the
treatment the meta-type work did. R0 (2026-07-06) migrated its *relationship* source to root authority and
deleted the projection; this design finishes that migration across the rest of the subsystem so the whole
code-tag layer is conformant with the v2 pattern: **consume root authority; express contracts as machine
schemas; one validation gate.**

**Not a merge.** The code-tag layer stays a distinct plane — it validates the CODE↔spec *binding*, whereas
the meta-type schemas validate the SPEC *content*. Conformance means the two planes share the same root
authority and schema format, not that they collapse into one validator. (Two-plane discipline, per
`DEC-DSV2-SPEC-HOMING` and `DEF-DSV2-TWO-PLANE`.)

## 1. The five non-conformances (from the assessment)

| # | Gap | Current | Conformant target |
| --- | --- | --- | --- |
| 1 | Taxonomy from an MD projection | `validate-code-tags` MD-parses `spec/TAXONOMY.md` | Read the type set from root — the 14 `.schema.yml` `meta_type` fields |
| 2 | Tag contract is prose | `CODE-TAG-SCHEMA.md` (doc + YAML example) | A machine `code-tag.schema.yml` (SCHEMA-CONSTITUTION format) + shape validation |
| 3 | v1 path residue | schema example uses `docs/features/…/SPEC.md` | v2 `spec/features/…/SPEC.md` |
| 4 | Waivers never reset | 4 stale AEO waivers over `backend/src/modules/…` | v2-clean (empty or only v2-valid entries) |
| 5 | Separate gate | `tags:test` runs outside `npm run validate` | `validate` covers code-tags |

R0 already closed the relationship half of #1. This design closes the rest.

## 2. Architecture — target subsystem shape

**Authority flow (target):** root `definitions/` (meta-type `.schema.yml` files + `relationships.yml`) →
consumed directly by `validate-code-tags`. No `impl/spec/*.md` projection is read by the code-tag tools.

**Two loaders, one pattern.** R0 added `loadRelationshipRulesFromAuthority` (build-from-owned on
`loadRelationshipAuthority`). This design adds its taxonomy twin — `loadTaxonomyTypesFromSchemas` — reading
the `meta_type:` field of every `impl/spec/meta-types/**/*.schema.yml`. Both return the exact Map shapes the
validator already consumes (`Map<string, CanonicalEdgeRule>` / `Map<string, string>`), so the validator body
is unchanged — only its *sources* move to root.

**Why schema-files over `meta-types.yml`:** `meta-types.yml` is a read-model index; it declares each member
"points at its criterion schema (**the machine source of truth**)." Reading the schemas directly means the
type set is the *same object* the content validator ranges over — a single source — and UI types are
recognized automatically the moment their schemas exist (dovetails `GAP-SH-UI11-MIGRATE`), with no second
edit.

**Tag contract as schema (#2).** The tag shape (`concept:{id,type,concern,spec_ref}`, `edges:[{edge,to}]`,
today only in TS types + prose) becomes `impl/governance/tags/code-tag.schema.yml` in the SCHEMA-CONSTITUTION
format, with `CODE-TAG-SCHEMA.md` retained as its human companion (pointer, not authority). This makes the
tag contract declarative and conformant with the meta-type schemas.

## 3. Load-bearing interactions (avoid double-ownership)

- **CT-1 ⟂ R2 (batch-1).** R2 deletes `spec/TAXONOMY.md`. If `--taxonomy` still points there, R2 triggers
  `CT-VAL-001` — the exact failure R0 just fixed for RELATIONSHIPS. **CT-1 is therefore a prerequisite of
  R2's deletion.** Sequence CT-1 before R2, or make R2 depend on CT-1.
- **CT-3 == SWU-APE-004.** The waiver reset is already an APE SWU. This pack *owns the code-tag half*; APE
  keeps the docs/features-anchor half. One reset, cross-referenced — not done twice.
- **CT-1 UI recognition ⟂ GAP-SH-UI11-MIGRATE.** Backend-14 works today (all current tags are backend);
  UI-typed tags resolve only once UI schemas exist. CT-1 does not block on it; it inherits it for free.

## 4. Design decisions surfaced (owner to confirm at execution)

- **D-CT-1 — taxonomy source:** schema-files (recommended) vs `meta-types.yml` registry. *Recommend
  schema-files* (single source of truth; auto-tracks UI).
- **D-CT-2 — waiver reset policy:** reset-to-empty (Batch-2 manifest intent) vs keep-v2-valid entries. The 4
  AEO waivers point at `backend/src/modules/…` (app-runtime, below the adapter line) — likely fixture
  residue. *Recommend reset-to-empty*; re-add per real committed feature.
- **D-CT-3 — CT-2 depth:** MVP (schema.yml + a shape-validation pass) vs full rewrite of `validate-code-tags`
  to be schema-driven. *Recommend MVP* — declare the contract, validate shape; leave the existing semantic
  checks (type ∈ taxonomy, edge endpoints) as-is. (Distill guard against ballooning.)
- **D-CT-4 — gate corpus:** the unified gate needs a deterministic tag corpus (`extract → validate`). If the
  only tagged code is fixtures, CT-4 wires the fixture-based check and notes the residue. *Owner decision at
  CT-4* whether a real backend corpus exists to extract.

## 5. Design → plan handoff

Four SWUs (CT-1..CT-4) over three layers (L0 consume-root + clean-state, L1 contract-as-schema, L2
unified-gate). Every SWU's acceptance is validator-green (`tags:test` + `npm run validate` + `engine:test` +
`typecheck` RC 0) plus a discriminating fixture. Distill verdict: **flag** — CT-2 is the ballooning risk,
scoped to MVP; CT-1↔R2 and CT-3↔APE-004 dovetails named. See [WORK-PACK.md](./WORK-PACK.md) and
[implementation-layering.md](./implementation-layering.md).
