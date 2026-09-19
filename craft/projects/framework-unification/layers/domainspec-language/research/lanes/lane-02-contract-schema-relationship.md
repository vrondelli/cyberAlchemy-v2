# Lane 02 — Contract / Schema Relationship

## Summary

The existing Arcanum evidence already enforces a clean two-layer split without naming it as such: a `.md` **contract** carries purpose, authority, methods (input/write/return/invariant), boundaries, and closure rules, while a paired `.yml` **schema** carries `row_families`, `fields`, `types`, `enums`, `references`, and machine-checkable `validation_rules`. The two layers point at the same concepts (methods, blockers, gaps, definitions, decisions, receipts) but never duplicate each other's authority: the contract says _what must remain true and who may do it_, the schema says _what shape is accepted and how it is referenced_. The relationship today is implicit and one-directional (schema `extends:` another schema; contract prose mentions storage targets), with no explicit cross-layer reference field. This lane proposes adding explicit, symmetric reference fields (`requires_schemas` / `realizes`, `implements` / `satisfies`), many-to-many partial-implementation semantics tracked by obligation coverage, and a set of anti-collapse validator invariants derived directly from how the Craft and dispatch artifacts already keep behavior and structure apart.

---

## 1. Evidence of the contract/schema split today

The strongest evidence is the Craft interface pair, which describes one concept across two files with no overlap of authority.

### Pair A — Craft interface

- Contract: `/home/vrondelli/projects/domainspec-core/arcanum/development/craft/CRAFT-INTERFACE.md`
- Schema: `/home/vrondelli/projects/domainspec-core/arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml`

What only the **contract** carries:

- Method semantics as input/write/return triples plus an `Invariant` line per method — e.g. `start_project` (lines 31–57) declares inputs `project_id, title, purpose, ...`, what rows it writes, what it returns, and the invariant "root context starts with one current `next_move`". The schema never describes method _behavior_, only that `start_project` exists in `interface_methods.project_lifecycle` (schema lines 137–142).
- Authority and scope boundaries — the contract's Purpose (lines 9–14) and Validation Boundary (lines 378–382) state this is "documentation and fixture authority for local testing only" and "cannot be used as evidence for promotion". No field in the schema expresses this prose obligation.
- Behavioral invariants that are not shape constraints — e.g. "raw blockers cannot be resolved directly" (`add_blocker`, lines 117–119) and "description history is preserved; updates do not erase context purpose" (`describe`, lines 93–95).

What only the **schema** carries:

- Concrete row structure and field types — `definitions` row_family (schema lines 70–97) declares `definition_id` with `pattern: "^DEF-[A-Z0-9-]+$"`, `scope_id` as a `reference` with `references_any` to `contexts.context_id` or `artifacts.artifact_id`, and required vs optional field lists. The contract's `add_definition` (md lines 252–272) names the same inputs in prose but gives no ID pattern, no type, no reference target.
- Enumerated value sets — `definition_status: [candidate, active-local, superseded, promoted-by-owner]` (schema lines 17–22). The contract only says definitions "remain local candidates unless an owner governance route promotes them" (md lines 269–272); it does not enumerate the legal states.
- `extends:` composition — the schema declares `extends: development/craft/CRAFT-LEDGER-SCHEMA.yml` (schema lines 14–15), a structural-inheritance relationship that has no equivalent in the contract.

The two cross-reference the _same_ invariants under different authority. Example: the contract invariant "active contexts must have exactly one current next move" (md lines 180–182) reappears as machine-checkable rule `CI-R001 ... on_fail: block` (schema lines 161–163). The contract states the obligation in semantic terms; the schema restates it as an enforceable rule with a failure action. This is the key signal: **the same rule legitimately lives in both layers, but in different form** — prose obligation vs. executable check.

### Pair B — Craft interaction

- Contract: `/home/vrondelli/projects/domainspec-core/arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md`
- Schema: `/home/vrondelli/projects/domainspec-core/arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml`

Same pattern, plus two extra signals:

- The contract carries a **Capability Contracts** section (md lines 144–304) describing, per external capability (`refine`, `decision-gate`, `invoke`, `task-session`, `dispatch-spec`), what Craft "sends / expects / records" and the **Boundary** line for each (e.g. "dispatch validation proves route shape, not execution", md line 304). This is pure semantic agreement — there is no structural field for it. The schema only enumerates the capability names as `capability_ref` enum values (schema lines 9–15).
- The contract's prose closure rule (md lines 306–314: "A Craft context can close only when... recomposition evidence connects child work to parent context") is mirrored by schema rule `CX-R006 ... on_fail: block` (schema lines 184–186). Again: obligation in the contract, enforceable check in the schema.
- The interaction schema `extends:` the interface schema (schema lines 6–7), showing schema-to-schema composition is already an established move while contract-to-schema linkage is not yet expressed by any field.

### Pair C — Schema-backed route contract (no separate `.md`)

- `/home/vrondelli/projects/domainspec-core/arcanum/formulae/dispatch-spec/dispatch.schema.yml`

This is a counter-pattern worth recording: dispatch-spec collapses contract and schema into a single JSON Schema file. It still encodes contract-like semantics, but as structure:

- `boundary_evidence` (lines 508–531) and the `$defs/boundary` block (lines 560–594) encode authority handoffs (`from_owner`, `to_owner`, `contract` string, `on_violation`) — i.e. obligation language pushed into a free-text `contract` field plus an enum `on_violation` action.
- `$defs/authority_map` (lines 595–611) encodes lifecycle/execution/validation/evidence/memory/promotion ownership — the _authority_ dimension that in the Craft pair lived in contract prose.
- `gates` (lines 451–488) encode gate `kind`, `owner`, `condition`, `on_fail` — lifecycle/gate semantics as structure.

The lesson: dispatch-spec proves you _can_ express obligations structurally, but it does so by burying agreement meaning inside free-text fields (`contract: { type: string }`, line 589–591) that the validator cannot actually check for meaning — it can only confirm a string is present. This is precisely the collapse risk the handoff warns against (`DOMAINSPEC-LANGUAGE-HANDOFF.md` lines 119–123, Non-Goals): a schema-only surface "would miss behavior, lifecycle, authority, and iteration semantics" (`CONTEXT-PACK.md` lines 170–172).

### Summary table of what each layer carries

| Dimension                                | Contract (`.md`)                       | Schema (`.yml`)                           |
| ---------------------------------------- | -------------------------------------- | ----------------------------------------- |
| Purpose / authority / scope boundary     | yes (CRAFT-INTERFACE.md 9–14, 378–382) | no                                        |
| Method behavior (input/write/return)     | yes (CRAFT-INTERFACE.md 31–377)        | names only (schema 137–159)               |
| Semantic invariants (prose obligations)  | yes (e.g. md 117–119)                  | no                                        |
| Field names, types, ID patterns          | no                                     | yes (schema 55–135)                       |
| Enums / legal value sets                 | no                                     | yes (schema 17–42)                        |
| References between rows                  | no                                     | yes (`references`, `references_any`)      |
| Required vs optional keys                | no                                     | yes (`required_fields`/`optional_fields`) |
| Machine-checkable rules + failure action | no                                     | yes (`validation_rules`, `on_fail`)       |
| Schema-to-schema composition             | no                                     | yes (`extends:`)                          |
| Cross-layer reference (contract↔schema)  | **absent today**                       | **absent today**                          |

---

## 2. Proposed referencing model

Today the link is implicit: the contract mentions a storage target in prose (`Storage model: .craft/ledger.yml`, CRAFT-INTERFACE.md line 6) and the schema names its `owner_surface` (schema line 4), but neither file names the other. The proposal is to make the link explicit and **symmetric**, so a validator can resolve it in both directions.

### 2.1 Contract → schema (`requires_schemas`)

A contract declares the schema(s) that realize its structure. Proposed field on a `contract` document:

```yaml
kind: contract
contract_id: craft.interface
requires_schemas:
  - schema_id: craft.interface_ledger # logical id, not a path
    ref: development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml
    realizes: # which obligations this schema backs
      - method:start_project
      - method:validate
      - invariant:CI-R001
    coverage: partial # full | partial
```

Rationale for `schema_id` + `ref` (not bare path): the Craft schemas already self-identify with a logical `schema_id` (`craft.interface_ledger`, schema line 1) distinct from their file path. Referencing by logical id lets a schema move files without breaking contracts, while `ref` keeps a resolvable locator.

### 2.2 Schema → contract (`implements`)

A schema declares the contract(s) it (partly) realizes. Proposed top-level field on a `schema` document:

```yaml
schema_id: craft.interface_ledger
implements:
  - contract_id: craft.interface
    satisfies: # the obligation ids this schema covers
      - invariant:CI-R001
      - invariant:CI-R006
      - method-shape:start_project
    coverage: partial
```

This mirrors the existing structural-composition idiom: schemas already declare `extends:` to compose with other schemas (CRAFT-INTERACTION-LEDGER-SCHEMA.yml lines 6–7). `implements` is the cross-layer analog of `extends`.

### 2.3 Shared obligation identifiers

The reference model only works if obligations are _addressable_. Evidence shows two natural id spaces already exist:

- Method names (`start_project`, `validate`, ... CRAFT-INTERFACE.md) — proposed urn `method:<name>`.
- Validation-rule ids (`CI-R001`...`CI-R007`, CRAFT-INTERFACE-LEDGER-SCHEMA.yml lines 160–181; `CX-R001`...`CX-R007`) — proposed urn `invariant:<rule_id>`.

The contract should therefore give each prose invariant a stable `obligation_id` (it does not today — invariants are unlabeled prose lines). This is the single biggest authoring change the referencing model requires: **invariants become first-class, addressable entries in the contract**, not loose prose. This aligns with the handoff/context-pack requirement that "gaps and blockers" be "first-class records, not prose hidden in notes" (`CONTEXT-PACK.md` lines 156–157) — extend the same principle to invariants.

### 2.4 Reference shape (recommended vocabulary)

- On contract: `requires_schemas[]` with `{ schema_id, ref, realizes[], coverage }`.
- On schema: `implements[]` with `{ contract_id, satisfies[], coverage }`.
- Optional iteration/use_case layer (out of lane but adjacent): `realized_by` on a contract could point to concrete _instances/use_cases_ (e.g. a `.craft/ledger.yml` fixture), distinct from `requires_schemas` which points to the _type_ schema. Keep these two distinct: schema = type authority; use_case/instance = realization evidence.

---

## 3. Composition rules

### 3.1 Many-to-many (required)

The evidence requires M:N, not 1:1:

- One contract → many schemas: the Craft interaction _contract_ references five external capabilities (CRAFT-INTERACTION-CONTRACT.md lines 144–304), and the interaction _schema_ `extends:` the interface schema (interaction schema lines 6–7) — so the interaction contract is effectively realized by two composed schemas (interface + interaction row families).
- One schema → many contracts: `CRAFT-LEDGER-SCHEMA.yml` is `extends:`-ed by `CRAFT-INTERFACE-LEDGER-SCHEMA.yml` (interface schema lines 14–15), and the base ledger schema plausibly backs both the interface and interaction contracts. A shared base schema realizing multiple contracts is the natural consequence of `extends:` chains.

Therefore both `requires_schemas` and `implements` are arrays, and a `(contract_id, schema_id)` pair may appear from either side. The validator should treat the union of both directions as the authoritative edge set and flag asymmetry (see §4).

### 3.2 Partial implementation (required, first-class)

The handoff states plainly: "A schema can implement part of a contract" (`DOMAINSPEC-LANGUAGE-HANDOFF.md` line 60). Evidence confirms partial realization is the norm: `CRAFT-INTERFACE-LEDGER-SCHEMA.yml` defines row_families for only `descriptions`, `definitions`, `gaps` (schema lines 44–135), but the contract defines ~17 methods touching contexts, blockers, enablers, decisions, relations, recomposition, export (CRAFT-INTERFACE.md). The `contexts`, `typed_items`, `relations` row families it references (e.g. `references: contexts.context_id`, schema line 61) are inherited via `extends:` from the base schema — so even "full" coverage is assembled from multiple partial schemas.

Composition model for partial implementation:

- Each contract obligation has a coverage state: `covered` (some schema's `satisfies`/`realizes` names it) or `uncovered`.
- A contract's overall coverage = `full` only if every obligation is covered by at least one referenced schema; otherwise `partial`.
- `coverage` declared on the reference is an authoring claim; the validator recomputes actual coverage from `satisfies`/`realizes` ∩ obligation set, and flags mismatch between declared and computed coverage.

### 3.3 What happens when a schema satisfies only part of a contract

Borrow the existing severity vocabulary rather than inventing one. The schemas already use `on_fail: block | flag` (CRAFT-INTERFACE-LEDGER-SCHEMA.yml lines 160–181) and dispatch-spec uses `gate_action: block | flag | defer | ask | reroute` (dispatch.schema.yml lines 691–698). Proposed behavior:

- Partial coverage by itself is **not** a failure — it is the expected state and should be `flag`-level visibility at most (compare `CI-R007 ... on_fail: flag`, schema line 179).
- A contract with **zero** covering schemas for a _required_ obligation (one whose own `on_fail: block`, e.g. CI-R001) should be `block` — a block-level obligation with no structural enforcement is the dangerous case.
- Uncovered obligations should surface as **gaps**, reusing the existing `gaps` row family with `treatment: plan|defer|waive|delegate|split` (CRAFT-INTERFACE-LEDGER-SCHEMA.yml lines 34–39). This makes "this contract is only partly schematized" a tracked, first-class gap, not silent.

### 3.4 Overlap and conflict

When two schemas both claim to realize the same obligation, the validator should confirm they do not contradict (e.g. two different ID patterns for the same logical field). `extends:` already implies the deriving schema may add but should not silently override; the language should require an explicit `override:` marker if a realizing schema narrows a base constraint.

---

## 4. Anti-collapse rules (validator invariants)

These are concrete checks a validator should enforce to keep the two layers from degenerating into each other. Each is grounded in an observed property of the evidence.

1. **A contract must not declare field types, ID patterns, or enums.** Grounded in: the Craft contract never specifies `pattern:` or `type:` — those live only in the schema (CRAFT-INTERFACE-LEDGER-SCHEMA.yml lines 55–135). If a contract document contains `type:`/`pattern:`/`enum:` field-definition structures, it is collapsing into a schema → `block`.

2. **A schema must not be the sole carrier of authority/purpose/boundary prose.** Grounded in: scope boundaries live only in contract prose (CRAFT-INTERFACE.md lines 378–382) and dispatch-spec's attempt to carry them as a free-text `contract: { type: string }` (dispatch.schema.yml line 589) is uncheckable. Rule: an authority/boundary obligation must be addressable as an `obligation_id` in a contract; a schema may _reference_ it (`satisfies`) but may not be the only place it is stated → `flag` if only in schema.

3. **Every block-level validation rule in a schema must trace to a contract obligation.** Grounded in: CI-R001/CI-R006 (schema) correspond 1:1 to invariants in the contract (CRAFT-INTERFACE.md lines 180–182, 333–335). A schema rule with `on_fail: block` and no `satisfies` link to a contract obligation is an orphan enforcement → `flag` (the schema is encoding meaning the contract never agreed to).

4. **Every contract obligation marked block-level must be realized by at least one schema rule.** The inverse of #3. An unenforced block obligation → `block` (this is the "obligation that nothing can check" failure; see §3.3).

5. **Cross-layer references must be symmetric and resolvable.** If contract C `requires_schemas` schema S, then S should `implements` C (and vice versa), and both `schema_id`/`contract_id` must resolve. One-sided or dangling references → `flag` (dangling) / `block` (unresolvable id).

6. **A document declares exactly one `kind`.** A file claiming both `kind: contract` and schema-shaped `row_families` is an in-place collapse → `block`. (Dispatch-spec is the legacy exception: it should be migrated or explicitly tagged `kind: schema_backed_contract` as a recorded, deliberate hybrid, not the default.)

7. **Declared coverage must match computed coverage.** A reference claiming `coverage: full` while uncovered obligations remain → `flag` and open a gap (§3.3).

8. **Schemas compose via `extends:`; contracts compose via obligation reference, not `extends:`.** Grounded in: `extends:` appears only in schemas (CRAFT-INTERFACE-LEDGER-SCHEMA.yml line 14, CRAFT-INTERACTION-LEDGER-SCHEMA.yml line 6). A contract using `extends:` to inherit structure is reaching into the schema layer → `flag`.

---

## 5. Open questions / risks for this lane

1. **Obligation identity is not yet authored.** Contract invariants are unlabeled prose lines (CRAFT-INTERFACE.md). Until invariants get stable `obligation_id`s, neither `realizes`/`satisfies` nor anti-collapse rules #3/#4 can be enforced. This is a prerequisite work item, possibly its own lane.

2. **Where does the contract↔schema rule duplication legitimately live?** The same rule (e.g. "exactly one next_move") appears as prose obligation _and_ `CI-R001`. Is the schema rule the authoritative enforcement and the contract obligation merely descriptive, or are they co-equal with a sync check? Decision needed — affects whether iteration records must update both in lockstep.

3. **Dispatch-spec hybrid.** A single schema-backed contract file (dispatch.schema.yml) is a sanctioned existing pattern that violates the clean split. Decide: is `schema_backed_contract` a legitimate third `kind`, or is dispatch-spec debt to be split into a `.md` contract + `.yml` schema? The handoff's Non-Goal "Do not collapse semantic contracts into structural schemas" (line 121) argues for splitting, but dispatch-spec is a heavily-used production artifact.

4. **`extends:` semantics under partial coverage.** When a realizing schema `extends:` a base, does coverage of an obligation by the base count as coverage by the deriving schema? Need an explicit transitivity rule for the coverage computation in §3.2.

5. **Reference granularity.** `realizes`/`satisfies` at method/invariant granularity may be too coarse — a schema might realize the _shape_ of `start_project`'s writes but not its invariant. Proposed `method-shape:` vs `invariant:` urn prefixes (§2.3) address this but add authoring burden; needs validation against a real fixture before locking.

6. **Conflict resolution authority.** When two schemas realize the same obligation with conflicting constraints (§3.4), who wins — base or override? No evidence of an override mechanism exists today; `extends:` is additive-only in the observed files.

7. **Instance vs type confusion.** `realized_by` (instances, e.g. `.craft/ledger.yml`) vs `requires_schemas` (types) is a distinction the current evidence blurs (the contract's `Storage model: .craft/ledger.yml` line, CRAFT-INTERFACE.md line 6, points at an instance path, not a schema). Keep them separate fields or the reference model will conflate "a schema that defines the shape" with "a file that contains data".
