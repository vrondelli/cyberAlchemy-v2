---
node_type: work-pack
is_session: false
status: candidate
boundary: PUBLIC validation criteria; engine src/rules δ-algorithm NEVER imported/exposed; v1 read-only
created: 2026-07-01
authored_by: "invoke (mode: plan)"
define: ./DEFINE.md
design: ./DESIGN.md
layering: ./implementation-layering.md
target_artifact: meta-type formalization + content validator
complexity: high
---

# Meta-Type Formalization — Work-Pack

> **Current authority update (2026-07-11):** The DONE statements below are
> historical receipts for the original 14-type formalization. Saga-specific
> cards, schemas, fixtures, and distinctions were later removed by the accepted
> collapse; active authority now has 13 backend types. No Saga work in this pack
> is executable.

Formalize the staged meta-type candidate catalog into **checkable criteria**, by category, and build the
**content validator** that checks an aspect file by types + edges. The 14 backend candidates are delivered as
shape/fixture-backed candidates; the 11 UI candidates remain formation-deferred under MT5. Per-SWU contract:
for each selected type, author (a) a formal criterion,
(b) required structure, (c) edge-participation signature, (d) a **positive + negative fixture** — the
discriminating pair; (e) an **automated test** of the validator's accept/reject (spawn-CLI, per DESIGN §7).
**Placement RESOLVED 2026-07-02 (refresh):** per type, a `schema + md` pair —
`meta-types/<category>/<type>.schema.yml` (machine criterion, SCHEMA-CONSTITUTION format) + `<type>.md`
(companion card); the **validator loads the `.schema.yml` files**; `definitions/DS-D1` cites the set. Every
SWU keeps the moat boundary (no δ-rules). See [REFRESH-2026-07-02.md](./REFRESH-2026-07-02.md).

Maturity boundary: schema and fixture evidence establishes checked shape, not
uniform semantic authority. Active DS-D8 endpoint use may pressure a candidate
but cannot promote DS-D1 formation.

## SWU manifest
| SWU | Layer | Category / scope | Acceptance (green) |
| --- | --- | --- | --- |
| **MT0** | L0 | schema + **Entity** exemplar + minimal validator | card schema fixed (DES-D1 confirmed); Entity criterion runs; Entity positive passes, VO-shaped negative **rejected as Entity** |
| **MT1** | L1 | **Structural** — Value Object, Enum | each has a criterion + pos/neg fixtures; Entity/VO discriminate |
| **MT2** | L1 | **Behavioral** — Operation, Query, Calculation, Rule, Policy, Workflow, Saga | each has a criterion + pos/neg fixtures; **Rule≠Policy** discriminates (boolean vs strategy) |
| **MT3** | L2 | **Connective** (Interface, Event, Mapping) + **Lifecycle** (State Machine) + **edge signatures** (DS-D8) | all 14 backend types criteria; 31 active root relationship signatures; validator checks edges (bad-endpoint rejected) |
| **MT4** | L2/L3 | **content validator** (`validate-content`) | validates a real aspect file by all backend types + root relationship edges; a seeded violation flips it; wired to validation-governance and aggregate `validate` |
| **MT5** | L3 | **UI-*** (11 types) — deferred | (deferred; validate-before-broaden) |
| **MT-INST** | L2/L3 | **machine-generated instance validation** — generate `<concept>.instance.yml` + validate instances against the schema (refresh 2026-07-02) | a generator emits a YAML instance conforming to each concept's meta-type schema; the instance validator accepts a conforming instance and rejects a malformed one (round-trip); automated test; public structural (moat-safe) |

Global gate each SWU: `npm run validate` + `npm run engine:test` + `npm run tools:test` stay RC 0 (the formalization must not break the existing surface; **every validator added carries an automated test** — refresh 2026-07-02, DESIGN §7).

---

## MT0 — Schema + Entity exemplar + minimal validator  (L0)
- **Status: DONE (2026-07-02, task-session).** Built `impl/spec/meta-types/structural/entity.{schema.yml,md}` + minimal `impl/tools/validate-content.ts` (loads the `.schema.yml`) + `impl/spec/__fixtures__/mt/entity-{ok,bad}.md`; `validate:content` npm script added (standalone, not yet in the `validate` aggregate). Proof: entity-ok **PASS**, entity-bad **REJECTED as Entity** (identity criterion), deterministic; `validate` / `engine:test` (97/97) / `typecheck` all RC 0. DES-D1 confirmed (schema+md pair); placement rooted at `impl/spec/meta-types/<category>/`. **Test DONE (2026-07-02):** `impl/tools/tests/validate-content.test.ts` + `tools:test` script (suite green). Next: **MT1** (done) → **MT2**.
- **Write scope:** `meta-types/structural/entity.schema.yml` (machine criterion) + `meta-types/structural/entity.md` (companion card); `impl/tools/validate-content.ts` (new, minimal — **loads a `.schema.yml`**); `impl/spec/__fixtures__/mt/entity-{ok,bad}.md` (new).
- **Steps:** (1) confirm DES-D1 placement; (2) write the Entity criterion — *≥1 identity field + typed fields (+ optional State Machine link)*; (3) minimal `validate-content` that reads a concept's declared type + runs the Entity criterion; (4) positive fixture (valid Entity) + negative (VO-shaped: no identity + equality clause).
- **Impl detail:** criterion is a predicate over the aspect file's **structure** (parse the field table; check for an identity field). Inputs: aspect file + the criterion. Output: pass | violation(concept, reason). Failure mode: if the criterion needs *running* the impl to check → boundary flag (record, don't reach into the engine).
- **Validation:** Entity-ok passes; Entity-bad **rejected**; determinism (re-run same result).
- **Verification:** a reviewer recomputes accept/reject from the fixture + criterion.

## MT1 — Structural category  (L1)
- **Status: DONE (2026-07-02).** Built `value-object.{schema.yml,md}` + `enum.{schema.yml,md}` + pos/neg fixtures + tests; validator generalized with rule kinds `none`, `section-contains`, `table-has-column`. VO-bad (identity-bearing) → rejected; Enum-bad (field table, no `Value`) → rejected; Entity↔VO cross-discriminate. `tools:test` green; `validate`/`engine:test`/`typecheck` RC 0.
- **Write scope:** VO + Enum criteria (same placement) + `__fixtures__/mt/{value-object,enum}-{ok,bad}.md`.
- **Steps:** Value Object — *fields, **no** identity, an equality rule*; Enum — *a finite value table*. Author criterion + required structure + edge signature + pos/neg fixtures.
- **Impl detail:** the VO-negative is the Entity-positive's shape with identity added → must be rejected as VO (mirrors MT0's Entity/VO discriminator). Extend `validate-content` to dispatch by declared type.
- **Validation:** each type's pos passes / neg rejected; Entity↔VO cross-discriminate (an identity-bearing thing is Entity not VO, and vice-versa).
- **Verification:** the 3 Structural types each have a runnable criterion.

## MT2 — Behavioral category  (L1)
- **Status: DONE (2026-07-02).** Convention chosen by owner = **declared `Attribute | Value` table** (validator rule `attribute-equals`). All 7 types + schema+md + pos/neg fixtures + tests. Discriminators: Rule/Policy = `formal_return_type` boolean/strategy; Query/Operation = `state_change` no/yes; Workflow/Saga = `scope` intra-/cross-feature; Calc = `formal_return_type` value. Each pair cross-discriminates (bad = neighbour's value → rejected). Boolean-ness is the **declared** key, never parsed (moat). `tools:test` 14/14; gate green. **10/14 backend types now formalized.**
- **Write scope:** Operation, Query, Calculation, Rule, Policy, Workflow, Saga criteria + `__fixtures__/mt/*-{ok,bad}.md`.
- **Steps:** e.g. Rule — *Formal cell parsing to a **boolean** predicate*; Policy — *selects a strategy/branch (decision table)*; Operation — *inputs + ≥1 postcondition + a state change*; Query — *read-only, returns a view*; Calculation — *pure fn, returns a value*; Workflow — *orchestrates Operations, intra-feature*; Saga — *cross-feature orchestration*.
- **Impl detail — the key discriminators (checkable):** Rule vs Policy = boolean-return vs strategy-select; Query vs Operation = no-state-change vs state-change; Calculation vs Rule = value vs boolean. Each becomes a predicate over the Formal cell / table shape.
- **Validation:** each type pos/neg; the Rule/Policy, Query/Operation, Calc/Rule pairs cross-discriminate.
- **Verification:** all 7 Behavioral types runnable; the "Common Confusion" pairs are mechanically separable.

## MT3 — Connective + Lifecycle + edge signatures  (L2)
- **Status: NODES DONE (2026-07-02); EDGE CHECKS LANDED BY R3A.** Built the 4 connective/lifecycle types (Interface/Event/Mapping/State Machine) as schema+md pairs + pos/neg fixtures + tests via declared-attributes (+ `attribute-present` rule kind for multi-value keys like `interface_kind`/`direction`). **All 14 backend node types now formalized (schemas=14).** `tools:test` 18/18; gate green. R3A supplies the root relationship authority (`definitions/relationships/relationships.yml`) with **31 active canonical signatures** plus generated/deprecated/deferred sections; `validate-content` now checks declared feature edges against that authority.
- **Write scope:** Interface, Event, Mapping, State Machine criteria; root relationship signatures (DS-D2/DS-D8) in `definitions/relationships/relationships.yml`; implementation projection in `impl/spec/RELATIONSHIPS.md`; schema `edge_participation` evidence slices.
- **Steps:** criteria for the 4 types; for each active root relationship signature, state `source.type`/`target.type`; validator checks each declared edge's endpoints against the signature.
- **Impl detail:** edge signatures are governed by `domainspec-v2-D3` admissibility (widen/collapse/reject rulings apply — e.g. `queries : Behavioral→Entity`). Bad-endpoint edge (e.g. `enforces` with a Calculation source) → violation.
- **Validation:** all 14 backend types criteria present; 31 active root signatures present; bad-endpoint and generated-view fixtures rejected.
- **Verification:** every backend type + active relationship signature has a checkable signature; schema edge-participation evidence agrees with root authority.

## MT4 — Content validator  (L2/L3)
- **Status: EDGE-AWARE VALIDATOR LANDED BY R3A.** `validate-content` now runs per-concept type criteria plus root relationship signature checks over whole aspect files; `validate:content` and `tools:test` are included in the aggregate `npm run validate`.
- **Write scope:** `impl/tools/validate-content.ts` (complete) + `impl/tools/tests/validate-content.test.ts` (complete) + npm scripts `validate:content` + `tools:test` + a real aspect-file fixture.
- **Steps:** finish `validate-content(aspect_file)` = per-concept type-criterion + per-edge signature checks over a whole aspect file; emit a violations report; wire as a validation-governance method.
- **Impl detail:** extends `validate-relationships` (edges) with per-type content checks; distinct from `engine lint`; **no δ-rule import**. Inputs: aspect file + criteria + root relationship signatures. Output: `{valid, violations[]}`.
- **Validation:** on a valid feature pack → clean; seed one type-violation + one edge-violation → each flips RC non-zero (discriminating); `npm run validate`+`engine:test` stay green.
- **Verification:** a reviewer confirms the validator's accept/reject matches the criteria on the fixture.

## MT5 — UI category  (L3, deferred)
- The 11 UI meta-types + UI edges, same method. Deferred until backend is proven (validate-before-broaden).

## MT-INST — Machine-generated instance validation  (L2/L3)  ← added 2026-07-02 (refresh)
- **Status: DONE (2026-07-02). DEF-D3 = B (canonical example from each schema).** `impl/tools/instances.ts` (`generate` + `validate` modes) + `impl/tools/tests/instances.test.ts` + scripts `instances:generate` / `instances:validate`; generated instances gitignored (`spec/__generated__/`). All 14 schemas → 14 example instances → all validate; a mutated Entity instance (identity dropped) is rejected. `tools:test` 20/20; `validate` / `engine:test` 97/97 / `typecheck` RC 0.
- **Write scope (built):** `impl/tools/instances.ts` + `impl/tools/tests/instances.test.ts` + `package.json` scripts + `.gitignore` (`spec/__generated__/`).
- **Steps (built):** (1) `instances generate` → per schema, emit `<type>.example.instance.yml` conforming by construction from `required_structure` + `criterion`; (2) `instances validate` loads each instance's schema + applies the same criterion rules to the YAML instance data; (3) round-trip: generated examples validate (exit 0), a mutated instance rejected (exit 1).
- **Impl detail:** the instance criterion applier mirrors `validate-content`'s rule kinds over structured data (parallel `field_<column>` arrays / `values` / `attributes`). **No δ-rule import** — the generator normalizes shape, it does not derive (public structural, validators-as-moat #1). **Residue:** the YAML-subset reader is copied into `instances.ts` (a `tools/lib/` extraction is the follow-up).
- **Verification:** `tools/tests/instances.test.ts` — generate→validate PASS + mutated→reject.

---

## Dispatch technique trace
`sequence` (L0→L3 by category) · `owner_boundary_check` (validation-governance owns `validate-content`; layering owns the type catalog; **engine δ-rules never touched**; v1 read-only) · `validation_loop` (per type = positive + negative fixture; the negative is the real proof) · `concrete_path_evidence` (criteria in TAXONOMY/definitions; validator + fixtures named) · `scu_swu_reduction` (by category) · `recomposition_proof` (→ full content validator) · `residue_ledger` (below). **No full dispatch JSON** — single-owner sequence; fan-out-able per category if desired (task-session choice).

## Distill validation — flag
- **Smallest coherent units:** ✅ one type formalized + its pos/neg fixtures + a validator dispatch; MT0 is the schema-proving slice.
- **Recomposition proof:** ✅ per-type criteria + edge signatures + the validator = a checkable type system; makes M1 mechanical; feeds R2/R7.
- **Gaps named (repair path):** (1) **engine boundary** — a type whose well-formedness can only be checked by *running* derivation is a boundary flag (record; don't reach into `src/rules`). (2) **criteria language** — prose-predicate first; a criterion DSL only if prose proves ambiguous (DES-D3). (3) **placement** — DES-D1 unconfirmed until MT0.
- **Verdict:** flag (routable; gaps carried).

## Residue
- The content validator overlaps the engine's per-type parsing — kept as *public contract* consistent with the engine, not a duplicate of the δ-rules; drift between them is a risk to watch.
- UI-11 deferred; single-corpus validation (needs a 2nd feature to generalize).
- Placement (DES-D1) + criteria-language (DES-D3) are open design decisions resolved at MT0.

## Next route
`task-session` per SWU, **MT0 first** (confirm DES-D1 + prove the schema on Entity). Feeds batch-1 **R2**
(TAXONOMY formal criteria) + **R7** (`DS-D1` system definition) — this package OWNS the formalization; R2/R7
consume it. Optionally fan out by category via `domainspec-subagents-strategy`.
