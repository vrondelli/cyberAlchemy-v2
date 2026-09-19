# DomainSpec Language — Refined Design Package (First Pass)

Status: `refined` (design only — no parser implemented, per handoff Non-Goals).
Synthesized from the six research lanes in `research/lanes/`. Every major claim is
traceable to a lane, which in turn cites the evidence sources in
`context-index.json`.

This package delivers the eleven items the handoff requires under "Expected First
Deliverables". It deliberately stops before parser/validator code. Two design
decisions are routed to a decision-gate and are marked **provisional** until the
owner ratifies them (see §9, §10).

---

## 1. Language Purpose And Boundary

**Purpose.** DomainSpec is a small, validateable language for writing three
separable-but-composable layers of agreement:

- **Contract** — the _semantic_ agreement: purpose, authority, ownership,
  invariants/obligations, allowed behavior, methods, gates, evidence
  requirements, downstream obligations.
- **Schema** — the _structural_ representation: fields, types, enums, references,
  required keys, constraints, and the machine-checkable shape that proves a
  document is well-formed.
- **Iteration** — the _governed change record_: what changed, why, prev→next
  state, which obligations/fields/examples/validations/decisions/blockers moved,
  and promotion status.

**Boundary.** DomainSpec is generic. Craft is **one use case and evidence
source, not the boundary** (handoff lines 6–13). The same language must serve
dispatch-spec routes, invoke handoffs, refine seeds, task-session work packs,
sigil/spell contracts, decision-gate records, and future DomainSpec systems.
Therefore no Craft term (`route_events`, `next_move`, etc.) is canonical; Craft
patterns are _evidence_ that informs generic fields.

**What it is NOT.** Not a replacement for prose docs as design thinking, but
prose alone is never sufficient for validation (handoff line 122). Not a single
collapsed "spec" blob — the contract/schema split is load-bearing (§4). Not
syntax-first — the model precedes the surface (§9).

---

## 2. Document Kinds

Lane 1 recommends **five first-class document kinds**; Lanes 3 and 6 refine how
two of them behave. Decision and other governance objects are **sub-records**,
not standalone documents, because they never appear as independent files in the
evidence.

| Kind        | Role                                                              | First-class? | Notes                                                                                                                     |
| ----------- | ----------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `contract`  | Semantic agreement                                                | Yes          | `handoff` is a **profile** of contract (`contract_type: handoff`), not its own kind (Lane 1).                             |
| `schema`    | Structural shape + constraints                                    | Yes          | One `schema` kind must absorb both the JSON-Schema dialect (dispatch) and the Craft `row_families` dialect (Lane 1 risk). |
| `iteration` | Governed change/delta record                                      | Yes          | Separate document, not embedded — keeps subjects append-stable (Lane 3).                                                  |
| `example`   | Validation fixture instance                                       | Yes          | Carries `expect: pass \| fail` intent (Lane 4).                                                                           |
| `use_case`  | Binding from a generic contract to a concrete project/route/sigil | Yes          | The mechanism that keeps the language generic while letting Craft bind in.                                                |

**Sub-records (NOT document kinds):** `decision`, `blocker`, `gap`,
`definition`, `validation`/`receipt`. These live inside contracts, schemas, and
iteration records as typed entries (Lane 1, Lane 6). They are first-class
_records_ (addressable, typed, status-bearing) but not first-class _files_.

---

## 3. Top-Level Field Model (Canonical Envelope)

Every DomainSpec document, regardless of kind, carries the same small envelope.
Lane 1 grounds each field in ≥2 evidence sources.

**Required (9):**

| Field        | Meaning                                             | Evidence basis                                           |
| ------------ | --------------------------------------------------- | -------------------------------------------------------- |
| `domainspec` | Language/version marker (e.g. `"0.1"`)              | dispatch schema header convention                        |
| `id`         | Stable logical identifier (prefixed/regex per kind) | Craft ledger prefixed IDs                                |
| `kind`       | One of the five document kinds                      | —                                                        |
| `version`    | Document version (semver or integer)                | Craft `*_version` pins                                   |
| `status`     | Lifecycle state (§8)                                | Craft `context_stage`, dispatch gate verdicts            |
| `title`      | Human label                                         | Craft/handoff headers                                    |
| `purpose`    | One-line statement of the agreement/intent          | CRAFT-INTERFACE purpose, handoff goal                    |
| `authority`  | Source-of-truth / owner pointer (§8.5)              | dispatch `authority_map`, Craft `source_of_truth_policy` |
| `references` | Typed outbound refs to other DomainSpec docs        | Craft `reference`/`references_any`, schema `extends`     |

**Near-canonical optional (2):** `evidence` (source pointers backing claims),
`validation` (which validator(s) are authoritative for this doc).

Per-kind required additions are specified in the lane files; the most important:

- `contract`: `obligations[]` (each with an `obligation_id` — Lane 2 blocker),
  `methods[]`, `gates[]`, `requires_schemas[]`/`realizes[]`.
- `schema`: `fields`/`row_families`, `validation_rules[]`,
  `implements[]`/`satisfies[]`, optional `extends`.
- `iteration`: `changed_artifact` (version-pinned ref), `prev_state`,
  `next_state`, the delta families (§5).
- `example`: `schema_ref` + `schema_version`, `expect`, optional
  `subject_contract`, optional `targets` (for negative fixtures).
- `use_case`: `binds_contract`, `binds_schemas[]`, `project/route/sigil` target.

---

## 4. Contract-To-Schema Relationship

The split already exists implicitly in the corpus: paired `.md` contracts carry
purpose/authority/method-behavior/prose-invariants; paired `.yml` schemas carry
fields/types/enums/refs/`validation_rules` (Lane 2). The same rule can
legitimately appear in both layers — as a prose obligation in the contract and
as an enforceable check in the schema (Lane 2: CRAFT-INTERFACE "exactly one
next_move" ↔ `CI-R001 on_fail: block`).

**Referencing model (symmetric, by logical id):**

- Contract → schema: `requires_schemas: [schema_id]`, `realizes`/`realized_by`.
- Schema → contract: `implements: [contract_id]`, `satisfies: [obligation_id]`.
- Refs mirror the schemas' existing `extends:` idiom (Lane 2).

**Composition rules:**

- Many-to-many. A contract may require several schemas; a schema may implement
  parts of several contracts (Lane 2).
- **Partial implementation is first-class.** Craft schemas define only ~3 of ~17
  contract concepts and assemble the rest via `extends:` (Lane 2). Obligations a
  schema does not cover must surface as a tracked `gap` record, never silently.

**Anti-collapse invariants (validator-enforced, Lane 2):** e.g. a contract must
not declare types/patterns; every block-level schema rule must trace to a
contract `obligation_id` and vice versa. `dispatch.schema.yml` is flagged as the
existing "schema-into-contract collapse" risk to avoid replicating.

**Lane 2 blocker:** contract invariants are currently unlabeled prose. They must
become addressable `obligation_id`s before any referencing or anti-collapse rule
can be enforced. This is the precondition for §5 and §7 too.

---

## 5. Iteration Model

The Craft ledger schemas already supply ~80% of the iteration primitives
(prefixed IDs, enum lifecycles, typed refs, `extends`, `validation_rules` with
`on_fail`/`severity`); the interaction ledger's ordered, event-typed,
evidence-bearing `route_events` is the strongest structural template, and the
`receipt` (producer/status/validation_result/audit_reference/residue) is the
model for `validations_run` (Lane 3).

**The one genuinely new thing is delta framing.** No existing row family holds
two states at once; iteration needs a `prev_state`/`next_state` pair plus
per-dimension added/changed/removed/opened/closed/resolved sub-deltas (Lane 3).

**Field model:** `changed_artifact` (one version-pinned typed ref to the
subject), `reason`, `prev_state`, `next_state`, `changed_obligations`,
`changed_fields`, `examples_delta`, `validations_run` (receipt-shaped),
`decisions_delta`, `blockers_delta`, `promotion_status`.

**Attachment:** iteration is a **separate document kind**, not embedded. It
points at its subject via one version-pinned `changed_artifact` ref; delta
payloads use polymorphic refs into contract/schema/example/validator rows. This
keeps subjects append-stable, mirroring how Craft keeps `route_events` separate
from the rows they describe (Lane 3).

**Traceability:** filter iterations by subject → order by `sequence`+`supersedes`
→ assert each `prev_state` abuts the predecessor's `next_state` → replay deltas
to current shape → trace each delta's evidence to its decision/blocker/receipt
(Lane 3, proposed rules ITR-R001..R005, cloned from existing VAL/CI/CX rules).

---

## 6. Example And Fixture Model

Examples bind to schemas today via one `schema_ref` + `schema_version` pin and
self-label as fixtures (`status: candidate-local-fixture`), but they do **not**
declare pass/fail intent or point at a contract (Lane 4).

**Proposed example document:** `schema_ref` + `schema_version` (pin),
`expect: pass | fail`, optional `targets` (which rule a negative fixture should
trip), optional `subject_contract`. Positive fixtures prove acceptance; negative
fixtures prove that `block`-severity rules actually trip — none exist today,
which is a top risk (Lane 4).

---

## 7. Validation Strategy

Two layers (Lane 4):

- **Layer A — structural.** The schema owns shape: `required_fields`, enums,
  regex `pattern`, `reference`/`references_any`, and `validation_rules` with
  `on_fail`/`severity`. `dispatch.schema.yml` is literal JSON-Schema.
- **Layer B — semantic/obligation.** The contract owns gates/methods/obligations.
  Today these are discharged by narrative review docs returning pass/flag/block —
  exactly the "prose is not enough" risk the handoff flags. The path forward is
  to make obligations addressable predicates (depends on the §4 `obligation_id`
  blocker).

**Authority model (Lane 4 / Lane 6):**

- Schema/validator is canonical for **accepted shape** (pointed to by
  `schema_ref` / a doc's `validation` field).
- Contract + named owner is canonical for **obligation satisfied** (modeled on
  dispatch `authority_map` and `gates[].owner`).
- Known entanglement to resolve: several `validation_rules` are really
  obligations living inside schema files.

**Smallest validateable surface (the handoff's step 5).** A deterministic
7-step **structural** validator over one `example` against one leaf `schema`
(Lane 4): (1) header/`domainspec` marker, (2) version pin match, (3) required
fields, (4) enums, (5) regex patterns, (6) reference integrity, (7) assert
result against `expect`. It defers obligation checks, `authority`, promotion,
and `extends` resolution. It runs unchanged against **both** a Craft example and
the dispatch JSON-Schema — satisfying the handoff's Craft + non-Craft fixture
requirement (step 6) with minimal code.

---

## 8. Lifecycle States

Lane 6's decisive finding: the CONTEXT-PACK's single lifecycle line collapses
**two orthogonal axes**, and the evidence keeps them separate. Recommend
splitting them.

### 8.1 Two axes

- **`lifecycle_state` (maturity):** `draft → refined → gated → implemented →
validated` plus terminal `superseded` and side-state `blocked`. (Maps to Craft
  `context_stage: idea→…→closed`.)
- **`promotion_state` (authority):** `candidate → active-local →
promoted-by-owner`. (Maps to Craft `definition_status`.)

`pass/flag/block` (dispatch verdict / `gate_status` / receipt) is a **transition
guard**, not a lifecycle member (Lane 6).

### 8.2 Transitions (guarded)

- `draft → refined`: refinement complete.
- `refined → gated`: enters a gate; requires the relevant decision(s) recorded.
- `gated → implemented → validated`: each forward edge guarded by a `pass`
  verdict (dispatch gate behavior + Craft validation readiness).
- any → `blocked`: an open `block`-severity record exists (mechanical).
- any → `superseded`: a later iteration supersedes it.

### 8.3 Promotion model

**Reaching `validated` does NOT make a contract canonical** (Lane 6, rule
CI-R005: items "stay local candidates unless promoted by owner route"; both
Craft validations passed yet explicitly defer promotion). Promotability:

- P1 schema validates · P2 obligations addressable · P3 examples pass · P4 no
  open blockers · P5 decisions closed · P6 evidence present · P7 gates passed —
  all **necessary**;
- P8 **owner-authority approval** — the **sufficient** act (`promotion_state →
promoted-by-owner`).

### 8.4 Interaction with iteration & first-class records

Gaps/blockers/decisions are typed rows whose status mechanically drives the
state machine (an open `block` ⟹ `blocked`). Lifecycle states are exactly the
`prev_state→next_state` fields of the iteration record, audited via the
event-log pattern (Lane 6).

### 8.5 Definitions with source AND confidence

Source authority is well-modeled (`source_of_truth_policy`, `authority_map`,
`evidence`), **but confidence is unmodeled** — the pack asks for "source and
confidence" and only source exists. Confidence must be designed fresh as a field
on definition records (Lane 6).

---

## 9. Open Decisions (route to decision-gate)

**OD-1 — Syntax strategy (BLOCKER, Lane 5).** The handoff forbids choosing
YAML-only / DSL-only / dual-surface without a recorded decision (Non-Goals).
Lane 5 frames four options scored on six criteria and recommends — **provisionally
pending owner ratification** — **Option D: YAML-canonical with a deferred,
optional DSL projection that compiles to canonical YAML** (28/30). Rationale: the
entire corpus is already YAML schemas + Markdown contracts; the contract/schema
split already runs along the `.md`/`.yml` line; any DSL-first path strands the
fixtures the first live test needs. This gate does **not** decide DSL grammar,
schema-dialect details, iteration attachment syntax, or promotion mechanics.

**OD-2 — `handoff`: kind vs contract profile (Lane 1).** Recommend profile
(`contract_type: handoff`); needs ratification.

**OD-3 — Schema dialect unification (Lane 1/4).** One `schema` kind must absorb
JSON-Schema (dispatch) and Craft `row_families`. `extends`/inheritance and the
custom `reference` type are not expressible in plain JSON-Schema (Lane 4),
pushing toward a DomainSpec-native structural dialect. Decide: extend
JSON-Schema vs native dialect.

**OD-4 — Iteration cardinality & history shape (Lane 3).** One subject per
iteration vs many; linear vs branching (DAG) history.

**OD-5 — Canonical state vocabulary (Lane 6).** Ratify the two-axis split (§8),
reconcile overlapping enums, decide terminal success state naming, and confirm
whether `superseded` stays (it was dropped from the handoff list).

---

## 10. Blockers And Risks

- **B-1 (precondition for §4/§5/§7).** Contract invariants are unlabeled prose;
  they must become addressable `obligation_id`s before referencing,
  anti-collapse, or obligation-validation rules can exist (Lane 2).
- **B-2.** No negative fixtures exist, so no `block`-severity rule is proven to
  trip (Lane 4). The first work pack must author one.
- **R-1.** `validation_rules` are natural-language prose, not executable
  predicates (Lane 4) — Layer B validation is not yet mechanizable.
- **R-2.** Two schema dialects + custom `reference`/`extends` may force a
  DomainSpec-native structural dialect beyond JSON-Schema (Lane 4, OD-3).
- **R-3.** Front-matter authority drift if Option D uses Markdown front-matter
  (Lane 5).
- **R-4.** Confidence is unmodeled for definitions (Lane 6, §8.5).
- **R-5.** Overfitting to Craft vocabulary — mitigated by the `use_case` kind and
  by deriving generic field names, but must be watchdogged in every iteration.

---

## 11. First Implementation Plan (summary; full work pack in `WORK-PACK-01.md`)

Build the **smallest validateable surface** (§7) and prove it on a Craft fixture
**and** a non-Craft fixture (dispatch), per handoff steps 5–6 — _after_ OD-1 is
ratified at the gate. No contract/obligation (Layer B) validation in pass 1.

1. Ratify OD-1 (and ideally OD-2, OD-3) at a decision-gate.
2. Freeze the canonical envelope (§3) as a v0.1 `schema` document.
3. Author/normalize two `example` documents with `expect: pass`
   (one Craft, one dispatch) + one `expect: fail` negative fixture (closes B-2).
4. Implement the deterministic 7-step structural validator (§7).
5. Run it against all three fixtures; record results as a `validation`/receipt.
6. Capture residue (B-1, R-1, OD-3..OD-5) as the seed for iteration #1.

---

## Completion Check Against Handoff §"Completion Criteria For The Next Pass"

- Separates contract / schema / iteration → §4, §5 (with anti-collapse rules).
- Supports Craft without being Craft-specific → `use_case` kind §2, generic
  envelope §3, boundary §1.
- Identifies a first syntax strategy → OD-1 / Lane 5 (provisional Option D).
- Names validation authority → §7.
- Names lifecycle states → §8.
- Lists blockers and open decisions → §9, §10.
- Can be turned into one implementation work pack → §11 + `WORK-PACK-01.md`.
