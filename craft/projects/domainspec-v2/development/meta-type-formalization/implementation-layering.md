---
node_type: implementation-layering
is_session: false
status: candidate
created: 2026-07-01
authored_by: "invoke (mode: plan)"
work_pack: ./WORK-PACK.md
define: ./DEFINE.md
design: ./DESIGN.md
---

# Meta-Type Formalization — Implementation Layering

> **Current authority update (2026-07-11):** This layering preserves the
> original 14-type execution baseline. Saga-specific units are superseded and
> are not runnable; active authority now has 13 backend types with scoped
> Workflow.

**Layer-boundary heuristic:** each layer makes one more slice of the type system **checkable** (criterion
+ fixtures + validator support). Value rises as more of an aspect file can be machine-validated; cost is
authoring the criteria + keeping them consistent with the engine (not duplicating the δ-rules). **Promotion
requires the previous layer's fixtures to discriminate** (positive passes, negative rejected).

| Layer | Slice | Minimum working unit | Promotion evidence |
| --- | --- | --- | --- |
| **L0 — schema + exemplar** | MT0 | The per-type card schema (DESIGN §1) + **Entity** fully formalized + a minimal validator that runs Entity's criterion. | Entity positive fixture passes; a VO-shaped negative fixture is **rejected as Entity**; schema reusable. |
| **L1 — backend node types** | MT1 Structural (VO, Enum), MT2 Behavioral (Operation, Query, Calculation, Rule, Policy, Workflow, Saga) | Every backend node-type has a checkable criterion + pos/neg fixtures. | Each type: positive passes, negative rejected; Rule≠Policy and Entity≠VO discriminate. |
| **L2 — connective/lifecycle + edges** | MT3 Connective (Interface, Event, Mapping) + Lifecycle (State Machine) + **edge signatures (DS-D8)** | All 14 backend types criteria + the 31 active root relationship signatures; validator checks edges. | Edge `enforces` with a non-Rule source rejected; generated views like `owned-by` rejected as noncanonical; every backend type + active relationship has a signature. |
| **L3 — full validator (+ UI)** | MT4 content validator; MT5 UI-11 (deferred) | `validate-content(aspect_file)` accepts well-formed / rejects malformed across all backend types + root relationship edges. | On a real feature: valid pack passes; a seeded type/edge violation flips it (discriminating); wired to validation-governance and the aggregate validation script. |

**Dependency order:** MT0 → {MT1, MT2} → MT3 → MT4 → (MT5 deferred).

**Recomposition:** L0–L3 green ⇒ the taxonomy is a **checkable type system** + a content validator exists
⇒ makes the toy's M1 (taxonomy closure) **mechanical**, and gives R2/R7 (batch-1) their formal criteria.

**Boundary carried down:** public validation criteria only; the engine `src/rules` δ-derivation is never
imported or exposed; a criterion that needs derivation to check is a **boundary flag**, not a moat leak.

**Placement resolved (refresh 2026-07-02):** each layer's minimum-working-unit is a per-type `schema + md`
pair — `meta-types/<category>/<type>.schema.yml` (machine criterion) + `<type>.md` (companion); the
validator **loads the schemas**. L0 MWU = the `entity` pair + a schema-loading minimal validator. See
[REFRESH-2026-07-02.md](./REFRESH-2026-07-02.md).

**Testing evidence (all layers, refresh 2026-07-02):** each layer's new/extended validator carries an
automated test (`impl/tools/tests/*.test.ts`, spawn-CLI idiom per DESIGN §7); `npm run tools:test` green is
part of every layer's promotion evidence — build-from-owned on `governance/tags/tools/tests/`. See
[REFRESH-2026-07-02-tests.md](./REFRESH-2026-07-02-tests.md).

**Instance layer (refresh 2026-07-02):** beyond authored-markdown validation, the machine-generated
**instance** surface (`<concept>.instance.yml`) is generated and validated against the same schemas (MT-INST).
Each layer's promotion adds "generated instances of this layer's types validate" (round-trip). Public
structural — the generator normalizes shape, never derives (moat-safe). See
[REFRESH-2026-07-02-instances.md](./REFRESH-2026-07-02-instances.md).
