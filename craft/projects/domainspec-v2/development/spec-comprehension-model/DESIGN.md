---
node_type: design
is_session: false
status: candidate
created: 2026-07-02
authored_by: "invoke (mode: design)"
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
target_artifact: M1–M4 concrete edits to the spec surface + the target-state template
promotion_boundary: PUBLIC surface; fixtures stay the single validator source; no δ-rules; UI edges intact.
---

# Design — Spec Comprehension Model (M1–M4)

> **Current authority update (2026-07-11):** Saga-specific learning and crossed-
> pair steps below are superseded by the accepted collapse and are not
> executable. The live learning projection has 24 staged labels and represents
> cross-feature orchestration as Workflow scope.

## M1 — Distilled learning order (a reading lens, not a deletion)
- **`meta-types/LEARNING-ORDER.md`** — tiers the 25:
  - **CORE (~6, internalize):** Entity, Value Object, Operation, Rule, State Machine, Event.
  - **SUPPORTING (~6, learn on demand as "an X is a Y that…"):** Enum, Query, Calculation, Workflow,
    Policy, Interface, Form.
  - **GENERIC (~13, recognize + template):** Saga, Mapping, and the 11 UI types — the 5 shadows
    (View Model→Value Object, Guard→Rule, Binding→Interface, Adapter→Mapping, State Indicator→State
    Machine/Enum) become a one-line dictionary. **Shadows keep their edges** (`protects`, `mirrors`,
    `reflects` in RELATIONSHIPS.md) — this file dictionaries the *learning*, not the graph.
- **Declarable:** an optional `tier:` field in each `.schema.yml`; a domain may override (the split is a
  per-domain lens). Engine/validator still range over all 25.
- **Edge reading view:** a short table in LEARNING-ORDER.md collapsing the 29 edges to ~8 base relations
  + `@cross` / `@shadow` modifiers — a comprehension aid; RELATIONSHIPS.md stays the source of truth.

## M2 — Surface the 9 crossed pairs (author nothing new)
For each of the 9 crossed types (Entity, Value Object, Operation, Query, Calculation, Rule, Policy,
Workflow, Saga):
- Add a **`## Discriminating pair`** section to `<type>.md` that **references** the existing
  `__fixtures__/mt/<type>-ok.md` and its cross-negative, captioned with the schema's `distinguisher.rule`
  (one line, already on disk). Fixtures **stay in `__fixtures__/`** as the single validator source — the
  card links/transcludes, it does not copy (no duplication, no validator drift).
- **Delete** the `TAXONOMY.md` "Common Confusion" rows that merely restate a pair the card now shows;
  keep any row that encodes a distinction the pair does not (a judgment per row, logged).

## M3 — Upgrade the 5 weak pairs (pre-decided per type; DEF-B2)
| Type | Current negative | Decision | Concrete edit |
| --- | --- | --- | --- |
| **Event** | intent-flip, renames concept (PaymentCompleted→CompletePayment) | **genuine cross** | rewrite `event-bad.md` to keep `PaymentCompleted` but present-tense/imperative → lands on Operation's `-ok` shape |
| **State Machine** | intent-flip (PaymentStatus→PaymentKind) | **genuine cross** | rewrite `state-machine-bad.md` to keep `PaymentStatus` modeled with no transitions → lands on Enum's `-ok` shape |
| **Enum** | malformed (field table, no Value col) | **genuine cross** (cheap) | make the bad-Enum a typed field table *with identity* → lands on Entity; axis = "flat value list vs typed identified table" |
| **Interface** | malformed (no `interface_kind`) | **attribute-distinguished mark** | no clean sibling-cross with a matching positive; mark the card "attribute-distinguished, axis: exposed boundary vs field-transform (`interface_kind`)" |
| **Mapping** | malformed (no `direction`) | **attribute-distinguished mark** | mark "attribute-distinguished, axis: has a direction (`direction`) vs an exposed boundary" |
Every upgraded fixture must still pass the existing validator (positive) / be rejected (negative) — the
class-flip is a *stronger* negative, not a validator change.

## M4 — Target-state doc + oracle-by-example
- **`research/target-state/TEMPLATE.md`** — a target-state authored as: (1) a **buildable narrative**
  paragraph ("Done looks like: …" in plain language, one screen), (2) an **oracle-by-example** block —
  a DONE exemplar + a discriminating NOT-DONE near-miss (the smallest change that makes it not-done). This
  is the SEED Lane-A "buildable narrative" made checkable; it is the owner's narrative instinct, landed at
  the **document level**, not per meta-type.

## Design decisions
- **DES-B1 — no type deletion.** M1 reorganizes learning order; the type system is untouched
  (completeness preserved).
- **DES-B2 — shadows stay first-class.** UI shadow edges preserved (Gigerenzer's verified
  edge-completeness finding); the dictionary is a learning aid only.
- **DES-B3 — fixtures are the single source.** M2/M3 keep `__fixtures__/` authoritative; cards reference,
  never copy; validators are the regression guard on every move.
- **DES-B4 — data decides order.** L1's first move = the highest-ranked stall in Package A's dataset.

## Views coverage
Context (the model + its data source) · Structure (M1 tiers, M2/M3 cards) · Data (M3 per-type table,
fixture references) · Behavior (M4 oracle, the re-run promotion) · Alternatives (DEF-B2 per-type forks) ·
Boundary (DES-B1/B2/B3, no δ-rules, UI edges intact).
