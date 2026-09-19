---
node_type: design
is_session: false
status: candidate
created: 2026-07-01
authored_by: "invoke (mode: design)"
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
target_artifact: meta-type formalization + content validator
promotion_boundary: PUBLIC validation criteria; engine δ-rules private.
---

# Design — Meta-Type Formalization

> **Current authority update (2026-07-11):** The completed 14-type material below
> records the formalization baseline at execution time. The accepted Saga
> collapse supersedes its Saga-specific rows; active authority now has 13
> backend types and Workflow carries declared intra-/cross-feature scope.

## 1. The per-type definition schema ("meta type value with its own category")

Each meta-type becomes a **card** carrying a checkable criterion, filed under its category:

```
### <TYPE>   (category: Structural | Behavioral | Connective | Lifecycle | UI-*)   [DS-D1.<n>]
- Formal criterion:   a concept is a well-formed <TYPE> IFF <checkable predicate over its content>
- Required structure: the tables/fields an aspect file must provide for this type
- Code pattern:       <from TAXONOMY "Architecture Mapping Appendix">
- Edge participation: may be SOURCE of {..}; may be TARGET of {..}   (the DS-D8 signature slice)
- Distinguisher:      how it differs from its nearest neighbour (from "Common Confusion")
- Fixtures:           positive (valid) + negative (malformed) — the discriminating pair
```

## 2. Category organization (the 25, by category)

- **Structural:** Entity, Value Object, Enum
- **Behavioral:** Operation, Query, Calculation, Rule, Policy, Workflow, Saga
- **Connective:** Interface, Event, Mapping
- **Lifecycle:** State Machine
- **UI-*** (deferred): Page, Layout, Component, View Model, Hook, Form, Action, Guard, Binding, Adapter, State Indicator

## 3. Worked exemplars (the shape — 3 concrete criteria)

**Entity (Structural).**
- Formal criterion: has ≥1 **identity field** (a field designating identity) AND fields are typed; MAY link a State Machine.
- Required structure: a field table `(name, type, required, description)` with an identity field.
- Edge participation: SOURCE of `performs, contains, emits`; TARGET of `queries, produces-for, derives`.
- Distinguisher vs Value Object: Entity **has identity**; VO is equal-by-fields.
- Negative fixture: a "field table, no identity field, has an Equality clause" → must be **rejected as Entity** (it's a VO).

**Rule (Behavioral).**
- Formal criterion: a **Formal cell that parses to a boolean predicate** over named inputs (no state mutation).
- Required structure: an `ID | Rule | Formal` row whose Formal expression is boolean-typed.
- Edge participation: SOURCE of `enforces`; never a TARGET of `applies` (that's a Policy inbound).
  `enforces-cross` is deprecated/collapsed into `enforces` plus cross-feature metadata. *(Governed by
  `domainspec-v2-D3`: `enforces` ≠ `applies`.)*
- Distinguisher vs Policy: Rule **blocks** (boolean); Policy **selects** (strategy).
- Negative fixture: a "Formal cell returning a chosen strategy/branch, not a boolean" → **rejected as Rule** (it's a Policy).

**Edge `enforces` (DS-D2/DS-D8).**
- Signature: `source.type = Rule ∧ target.type = Operation`.
- Check: both endpoints resolve to declared types matching the signature; else a violation.
- Negative fixture: `enforces` with a Calculation source → **rejected** (calculates, not enforces).

**Relationship authority (R3A).**
- Root machine authority: `definitions/relationships/relationships.yml`.
- Human companion: `definitions/relationships/relationships.md`.
- Implementation projection: `impl/spec/RELATIONSHIPS.md`.
- Current active canonical signatures: `31`; generated views such as `owned-by` are not authored edges.

These show the shape: a criterion is a predicate over the aspect file's *structure* (tables/fields/Formal
cells) + the declared types — checkable without running the implementation.

## 4. The content validator (the enabling artifact)

```
validate-content(aspect_file, defs, edge_signatures):
  for each concept C with declared type T:
      run T.criterion over C's content  ->  pass | violation(C, T, reason)
  for each declared edge E(a --verb--> b):
      check verb.signature against type(a), type(b)  ->  pass | violation(E, reason)
  return { valid: bool, violations: [...] }
```

- **Owner:** validation-governance (it's a build-time fidelity check on the spec).
- **Relationship to existing tools:** *extends* `validate-relationships` (which already checks declared
  edges) with **per-type content criteria**; distinct from `engine lint` (canonical-tables + needs-formal)
  and from engine `derive` (the moat). This is the **type-and-edge content validator** the discussion named.
- **Boundary (DES-D2):** the engine's parser already recognizes per-type structure to *derive* tests; the
  validator's criteria are the **public contract** of "what a valid T is" — kept consistent with the engine
  but NOT importing the δ-rules. If a criterion can only be checked by running derivation, that's a
  boundary flag (FALSIFIED for that type per DEFINE), not a moat leak.

## 5. Design decisions surfaced

- **DES-D1 — where the formal criteria live.** (a) a **formal field in TAXONOMY.md** per type (single
  per-type home, upgraded from descriptive to formal) + a system-level `DS-D1` that cites it; or (b)
  per-type cards in `definitions/` (`DS-D1.<n>`). **RESOLVED 2026-07-02 (refresh; owner-confirmed) →
  per-type `schema + md` PAIR:** `meta-types/<category>/<type>.schema.yml` (machine criterion, in the
  imported SCHEMA-CONSTITUTION `.schema.yml` format) + `<type>.md` (companion card, `companion_to` the
  schema, artifact-metadata frontmatter per the adopt-wide decision). `definitions/DS-D1` is the
  system-level definition pointing at the pair set; TAXONOMY.md keeps a back-reference. **The validator
  LOADS the `.schema.yml` files.** See [REFRESH-2026-07-02.md](./REFRESH-2026-07-02.md).
- **DES-D2 — validator/engine boundary** (above): public criteria, private δ-rules; consistency, not duplication.
- **DES-D3 — criteria language.** Prose-predicate vs a small structured criterion DSL. **RESOLVED
  2026-07-02 (refresh) →** the criterion is the **`.schema.yml`** (structured, validator-loadable) + a
  **prose md** companion for humans — the machine twin replaces the "prose-predicate only" default.

## 6. Views coverage
Context (§1 schema) · Structure (§2 categories) · Data (the per-type cards + edge signatures) · Behavior
(§4 validator) · Alternatives (§5 DES-D1/D3) · Boundary (§4 DES-D2, engine moat).

## 7. Validator testing convention (refresh 2026-07-02)
Every validator added carries an **automated test** — build-from-owned on `governance/tags/tools/tests/`:

- **Location:** `impl/tools/tests/<validator>.test.ts`.
- **Idiom:** black-box CLI test — `node:test` + `node:assert/strict`; `spawnSync(process.execPath,
  ["--import", "tsx", "tools/<validator>.ts", ...args], { cwd })` over fixtures written to
  `mkdtempSync(tmpdir())`; assert on `.status` (exit code) + `.stdout`; clean up the temp dir. It exercises
  the validator through its real CLI (no internal-function coupling), so it survives refactors.
- **Runner:** `tools:test` = `node --import tsx --test tools/tests/*.test.ts` (mirrors `tags:test`).
- **Gate:** `npm run tools:test` joins the per-SWU global gate. Each meta-type's test asserts its
  positive fixture → exit 0 and its negative fixture → exit 1 with the expected violation on stdout.

## 8. Machine-generated instance validation (refresh 2026-07-02; DEF-D3 → source B) — BUILT
Beyond validating authored **markdown**, the `instances` tool generates a machine-readable **instance** per
meta-type schema and validates it against the same schema — so machine-generated files are validated too.

- **Instance shape** — `<type>.example.instance.yml`. To stay within the minimal YAML-subset reader (no
  lists-of-maps), fields are parallel arrays keyed `field_<column>`:
  ```
  meta_type: Entity
  concept: ExampleEntity
  field_name: [id, sample]
  field_type: [Uuid, String]
  field_identity: [yes, no]
  ```
  Enum uses `values: [...]`; behavioral/connective/lifecycle use `attributes: { key: value }`; a
  `section-contains` criterion (e.g. Value Object equality) emits a scalar carrying the required token.
- **Generator** — `instances generate` emits one `<type>.example.instance.yml` per **schema** (DEF-D3 = B: a
  canonical example built from the schema's `required_structure` + `criterion`, conforming by construction).
  It **normalizes shape only — it does not derive** (no `src/rules`, no δ-algorithm): a public asset.
- **Instance validator** — `instances validate` loads each instance's schema and applies the **same criterion
  rules** to the instance's YAML data (identity / typedness / none / table-has-column / attribute-equals /
  attribute-present / section-contains) that `validate-content` applies to markdown — only the data reader
  differs (YAML keys vs table cells).
- **Round-trip (acceptance)** — every generated example validates (exit 0); a mutated instance (identity flag
  dropped) is rejected (exit 1). Proven by `tools/tests/instances.test.ts`.
- **Boundary (moat)** — generator + instance validator are the **public structural** authoring aid
  (validators-as-moat asset #1); they never expose or reproduce derivation. Generated instances are gitignored
  (`spec/__generated__/`), regenerated via `npm run instances:generate`.
