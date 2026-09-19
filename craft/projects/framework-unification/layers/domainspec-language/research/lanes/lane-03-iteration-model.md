# Lane 03 — Iteration Model (Research / Design)

Lane question: _How should iteration records attach to contracts, schemas, examples, and validators, and what is their field model?_

## Summary

The Craft ledger schemas already contain almost every primitive an iteration record needs, but they record them as **standing state** (current blockers, current gaps, current decisions, current validation rules) rather than as **deltas between two artifact versions**. The reusable core is: typed identified rows with regex-prefixed IDs, enum-governed status fields, `reference`/`references_any` typed pointers between rows, and validation rules with `on_fail`/`severity`. The interaction ledger's `route_events` family (an ordered, event-typed, evidence-bearing log) is the closest existing analogue to an iteration history and is the strongest structural model to generalize. I recommend the iteration record be its own first-class **document kind** (`iteration`), not embedded in the contract or schema, attaching to its subject through a typed `changed_artifact` reference plus an explicit `prev_state`/`next_state` lifecycle pair, with each delta dimension (obligations, fields, examples, validations, decisions, blockers) modeled as a list of typed sub-deltas that reference rows in the contract/schema/example/validator documents. This keeps the subject documents append-stable and lets a reader reconstruct history by replaying the ordered iteration chain — exactly the pattern `route_events` already proves works for one ledger.

---

## 1. What the Craft schemas already model — and what is reusable

The evidence below is drawn from the two iteration-relevant schemas and their shared parent, plus the two example instances.

### 1.1 Events / ordered history

The strongest existing iteration analogue is the `route_events` row family in the interaction ledger:

- `route_events` is described as _"Ordered route-memory events for classification, handoff, receipt, residue, and recomposition"_ (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:120-122`).
- Each event carries `event_id`, `context_id`, `event_type` (enum), `capability_ref`, `summary`, `evidence`, and optional links `receipt_id`, `handoff_id`, `application_policy` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:123-159`).
- `route_event_type` enumerates the event vocabulary: `route_classified`, `handoff_created`, `receipt_received`, `receipt_applied`, `residue_opened`, `recomposition_completed` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:27-33`).
- The example instance shows these events forming an ordered, evidence-linked chain (`CRAFT-INTERACTION-EXAMPLE.yml:166-213`), e.g. `EVT-RECEIPT-001` references both a `receipt_id` and a `handoff_id`.

**Reusable:** event_id + typed event vocabulary + summary + evidence + typed back-references is exactly the shape an iteration log needs. An iteration record is conceptually one `route_event` whose `event_type` is "artifact changed" and whose payload is a structured delta rather than a free-text `summary`.

### 1.2 State / lifecycle

State today is a per-context snapshot, not a delta:

- A context carries a single current `stage` (enum `context_stage`: `idea`, `define`, `design`, `plan`, `execute`, `validate`, `reflect`, `blocked`, `closed`) and a single `gate` (enum `gate_status`: `pass`, `flag`, `block`) (`CRAFT-LEDGER-SCHEMA.yml:26-39`, `137-178`).
- Artifacts carry one `status` from `artifact_status`: `planned`, `active`, `stale`, `superseded`, `closed` (`CRAFT-LEDGER-SCHEMA.yml:40-46`, `180-206`).
- Descriptions are explicitly _versioned_ with a `description_status` of `active` or `superseded` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:40-43`, `44-69`). This `active`/`superseded` pair is the seed of a `prev_state`/`next_state` model — superseding is already a recognized lifecycle transition.

**Reusable:** the enum lifecycle vocabularies (`context_stage`, `artifact_status`, plus the CONTEXT-PACK's expanded list of `draft, refined, gated, implemented, validated, promoted, superseded, blocked` — `CONTEXT-PACK.md:154-156`) supply both ends of an iteration's `prev_state`/`next_state`. **Not directly reusable:** there is no existing field that holds _two_ states at once; the schemas record only the current one. The iteration record must add the "before" side.

### 1.3 Blockers

Blockers are first-class typed rows, not prose:

- The interface ledger has a dedicated `gaps` family (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:99-135`); the parent ledger has `typed_items` covering `blocker`, `gate`, `enabler` (`CRAFT-LEDGER-SCHEMA.yml:60-64`, `249-332`).
- A blocker carries `kind`, `base_type` (e.g. `authority_blocker`, one of ten enumerated in `base_condition_types` — `CRAFT-LEDGER-SCHEMA.yml:103-114`), `refinement_status` (`raw`→`typed`→`refined`→`resolution_proposed`→`resolved`, plus `waived` — `CRAFT-LEDGER-SCHEMA.yml:74-80`, `402-419`), `closure_condition`, and `decision_ref`.
- The example shows a blocker moving to `status: resolved` / `refinement_status: resolved` with a `closure_condition`, `evidence`, and a `decision_ref` (`CRAFT-INTERFACE-EXAMPLE.yml:82-99`).
- A hard rule forbids resolving a raw blocker directly: `prohibited_transitions` raw→resolved and typed→resolved (`CRAFT-LEDGER-SCHEMA.yml:415-419`), enforced by `VAL-007` (`CRAFT-LEDGER-SCHEMA.yml:389-391`) and `CI-R003` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:166-168`).

**Reusable:** the full blocker row (id, kind, base_type, status, refinement_status, closure_condition, decision_ref, evidence) is the unit a `blockers_delta` entry should reference. An iteration that _creates_ a blocker emits a new typed_item row + a delta entry; one that _resolves_ a blocker references the existing row and its closing decision.

### 1.4 Gaps

- `gaps` row family: `gap_id`, `scope_id`, `summary`, `severity` (`info`/`flag`/`block`/`deferred`), `treatment` (`plan`/`defer`/`waive`/`delegate`/`split`), `owner`, `status` (`active`/`planned`/`resolved`/`waived`/`superseded`), `evidence` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:17-39`, `99-135`).
- Example: `GAP-VALIDATOR-001` with `severity: flag`, `treatment: defer` (`CRAFT-INTERFACE-EXAMPLE.yml:71-79`).

**Reusable:** gaps already carry a `status` with a `superseded`/`resolved` terminal — an iteration can record gap opening/closing the same way it records blockers. Gaps are not in the lane's named delta list but share the blocker delta mechanism.

### 1.5 Decisions

- `decisions` family: `decision_id`, `scope_id`, `decision_type` (`selection`/`waiver`/`deferral`/`approval`/`rejection`), `selected`, `rationale`, `evidence`, `status` (`active`/`superseded`/`closed`) (`CRAFT-LEDGER-SCHEMA.yml:81-90`, `334-368`).
- Example: `DEC-STORAGE-SOURCE-001` with `status: closed`, linked from a blocker via `decision_ref` and from a relation via `evidence` (`CRAFT-INTERFACE-EXAMPLE.yml:118-141`).
- Rule `CI-R004`: blocking active decisions stop dependent execution (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:169-171`).

**Reusable:** the open→closed/superseded lifecycle and the `decision_ref` back-pointer give a `decisions_delta` its "opened" and "closed" semantics directly.

### 1.6 Validation status

Three distinct validation surfaces exist:

- **Schema validation_rules** with `on_fail`/`severity`: e.g. `CI-R001..R007` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:160-182`), `CX-R001..R007` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:168-189`), `VAL-001..VAL-010` (`CRAFT-LEDGER-SCHEMA.yml:370-400`). Each is `id` + `rule`/`description` + `on_fail`/`severity` ∈ {`block`, `flag`}.
- **Receipt validation results** from owner capabilities: a `receipt` carries `status` (`pass`/`flag`/`block`/`superseded`), `validation_result` (string), `audit_reference`, and `residue` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:21-26`, `85-118`). Example `RCT-DISPATCH-001` status `pass` (`CRAFT-INTERACTION-EXAMPLE.yml:137-145`).
- **Rule `CX-R003`**: Craft records native verdicts but does not rewrite them (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:176-177`).

**Reusable:** the receipt is the precise model for a `validations_run` entry — it names the validator (`producer`/`capability_ref`), the verdict (`status`), the human result (`validation_result`), and an audit pointer. An iteration's `validations_run` is a list of receipt-shaped records. `CX-R003` gives the governance principle: the iteration record stores the validator's verdict verbatim, it does not author the verdict.

### 1.7 Cross-cutting reusable mechanics

| Mechanic                                              | Evidence                                                                                                                                                       | Reuse for iteration                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Prefixed string IDs with regex pattern                | `^EVT-…$`, `^GAP-…$`, `^DEC-…$`, `^RCT-…$`, `^ART-…$` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:135-137`; `CRAFT-LEDGER-SCHEMA.yml:153-155`, `192-194`, `347-349`) | `iteration_id` pattern `^ITR-[A-Z0-9-]+$`                                                                |
| Typed single reference                                | `references: contexts.context_id` (`CRAFT-LEDGER-SCHEMA.yml:156-158`)                                                                                          | `changed_artifact` points at one subject row                                                             |
| Polymorphic reference                                 | `references_any` over contexts/artifacts/typed_items/decisions (`CRAFT-LEDGER-SCHEMA.yml:226-237`, `300-313`)                                                  | delta entries point at any row kind in the subject doc                                                   |
| Required vs optional vs conditionally-required fields | `required_fields`/`optional_fields`/`conditionally_required_fields` (`CRAFT-LEDGER-SCHEMA.yml:252-279`)                                                        | iteration core required; deltas optional; `next_state=superseded` conditionally requires `superseded_by` |
| `extends` schema composition                          | `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:6-7`; `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:14-15`                                                                           | iteration schema can `extends` a shared lifecycle/enum base                                              |
| Schema vs fixture authority split                     | `source_of_truth_policy` (`CRAFT-LEDGER-SCHEMA.yml:16-24`)                                                                                                     | YAML owns iteration field model; example owns fixture                                                    |

**Net assessment:** ~80% of the iteration model is reusable as-is from existing primitives. The genuinely new requirement is the **delta framing** — pairing a `prev_state` with a `next_state` and grouping referenced rows into "added/changed/removed/opened/closed/resolved" buckets — which no current row family expresses because every current family records only standing state. The `route_events` family is the structural template to clone and the receipt is the template for `validations_run`.

---

## 2. Proposed iteration-record field model

Modeled as a document kind `iteration` whose top-level is one or more iteration rows. Core fields are required; delta fields are optional lists (an iteration that changes nothing in a dimension omits it).

```yaml
# iteration row (proposed)
iteration_id: ^ITR-[A-Z0-9-]+$ # cf. EVT-/RCT- ID patterns
changed_artifact: # the subject this iteration mutates
  ref_kind: contract | schema | example | validator | iteration
  ref: <document id> # typed reference, see §3
  ref_version: <semver-ish> # cf. schema_version
reason: string # why the change happened
prev_state: <lifecycle enum> # before; cf. description_status/artifact_status
next_state: <lifecycle enum> # after
sequence: integer # ordering within the subject's chain
supersedes: ^ITR-…$ | null # prior iteration this one follows
evidence: string | ref # cf. ubiquitous `evidence` field
promotion_status: <enum> # see below

# delta dimensions (each an optional list of typed sub-deltas)
changed_obligations: [{ op, obligation_ref, summary }]
changed_fields: [{ op, field_ref, was, now }] # fields OR constraints
examples_delta: [{ op, example_ref, summary }]
validations_run: [{ validator_ref, status, result, audit_reference, residue }]
decisions_delta: [{ op, decision_ref, status_after }]
blockers_delta: [{ op, blocker_ref, status_after, closure_condition? }]
```

Mapping each field to evidence:

| Iteration field                           | Evidence basis                                                                                                                                                                                                                                                       | Notes                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `changed_artifact` (ref + kind + version) | `references_any` polymorphism (`CRAFT-LEDGER-SCHEMA.yml:226-237`); `schema_ref`/`schema_version` (`CRAFT-INTERFACE-EXAMPLE.yml:2-3`)                                                                                                                                 | One subject per iteration, mirroring `CX-R001` "exactly one owner capability" (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:169-171`) |
| `reason`                                  | `reason` field on typed_items/relations (`CRAFT-LEDGER-SCHEMA.yml:331-332`, `244-245`); blocker `reason` in example (`CRAFT-INTERFACE-EXAMPLE.yml:99`)                                                                                                               | Free text, required                                                                                                           |
| `prev_state` / `next_state`               | `description_status` active/superseded (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:40-43`); expanded lifecycle list (`CONTEXT-PACK.md:154-156`)                                                                                                                              | **New pairing** — no single existing field holds both                                                                         |
| `promotion_status`                        | `definition_status` incl. `promoted-by-owner` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:17-22`); rule `CI-R005` promotion-by-owner-route (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:173-175`); `promotion_guardrail_status` receipt field (`CRAFT-INTERACTION-EXAMPLE.yml:88-89`) | Enum e.g. `candidate`, `promoted-by-owner`, `superseded`                                                                      |
| `changed_obligations`                     | Contract "downstream obligations"/"invariants" (`DOMAINSPEC-LANGUAGE-HANDOFF.md:35-46`); obligation-linked context (`handoff.md:84-90`)                                                                                                                              | Obligations live in the contract doc; delta references them                                                                   |
| `changed_fields` (fields/constraints)     | schema `fields`, `required_fields`, `enums`, `pattern` (`CRAFT-LEDGER-SCHEMA.yml:137-368`)                                                                                                                                                                           | `op` ∈ add/change/remove; `was`/`now` capture constraint change                                                               |
| `examples_delta`                          | example instances as fixtures (`CRAFT-INTERFACE-EXAMPLE.yml`, `CRAFT-INTERACTION-EXAMPLE.yml`); CONTEXT-PACK "examples as validation fixtures" (`CONTEXT-PACK.md:158`)                                                                                               | Points at example documents/rows added or changed                                                                             |
| `validations_run`                         | receipt shape: producer/status/validation_result/audit_reference/residue (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:85-118`); `CX-R003` verdicts not rewritten (`:176-177`)                                                                                               | Verbatim verdicts, one entry per validator run                                                                                |
| `decisions_delta`                         | decisions family + `decision_status` open/closed (`CRAFT-LEDGER-SCHEMA.yml:81-90`, `334-368`)                                                                                                                                                                        | `op` ∈ opened/closed/superseded                                                                                               |
| `blockers_delta`                          | typed_items/gaps + refinement_status + closure rules (`CRAFT-LEDGER-SCHEMA.yml:249-332`, `402-419`); `CI-R003` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:166-168`)                                                                                                         | Must honor prohibited raw→resolved transition when `op=resolved`                                                              |
| `sequence` / `supersedes`                 | ordered `route_events` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:120-122`); supersedes relation_type (`CRAFT-LEDGER-SCHEMA.yml:47-53`)                                                                                                                                   | Enables history reconstruction (§4)                                                                                           |
| `evidence`                                | ubiquitous `evidence` field across all families                                                                                                                                                                                                                      | Required, points at proof                                                                                                     |

Each sub-delta uses an `op` verb. Proposed vocabulary, grounded in existing status terminals: `added`, `changed`, `removed` (structure); `opened`, `closed`, `superseded`, `resolved`, `waived` (records). The record verbs reuse exactly the terminal states already in `gap_status`, `decision_status`, and `typed_item_status` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:23-28`; `CRAFT-LEDGER-SCHEMA.yml:65-90`).

**Conditional requirements** (mirroring `conditionally_required_fields`, `CRAFT-LEDGER-SCHEMA.yml:261-270`):

- `next_state = superseded` ⇒ require `supersedes` or a `superseded_by` pointer.
- `blockers_delta[*].op = resolved` ⇒ require `closure_condition` and either evidence or a `decision_ref` (mirrors `VAL-007`, `CRAFT-LEDGER-SCHEMA.yml:389-391`).
- `promotion_status = promoted-by-owner` ⇒ require an owner-route evidence ref (mirrors `CI-R005`, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:173-175`).

---

## 3. Attachment model

### 3.1 Iteration is a separate document kind, not embedded

The CONTEXT-PACK already lists `iteration` as one of four peer artifact families alongside `contract`, `schema`, `use_case` (`CONTEXT-PACK.md:134-145`). Three pieces of evidence argue for keeping it a separate document rather than an embedded section:

1. **Authority separation.** The handoff insists contract and schema must not be collapsed (`DOMAINSPEC-LANGUAGE-HANDOFF.md:116-124`). Embedding mutation history inside the contract/schema would entangle "what is agreed/structured now" with "how it changed", re-introducing the very collapse the project forbids.
2. **Append-stable subjects.** In Craft, history lives in a _separate_ `route_events` family, not inside the `contexts` or `artifacts` rows it describes (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:120-159`). The subject row stays clean; the event row carries the change. Iteration should follow the same separation.
3. **Cross-document subjects.** A single iteration can touch a contract, its schema, its examples, and its validators at once (the lane's full delta list). Only a free-standing record can reference all of them; an embedded block could reference only its host.

### 3.2 Reference shape

Reuse the existing typed-reference machinery exactly:

- **Single typed ref** for the subject, like `references: contexts.context_id` (`CRAFT-LEDGER-SCHEMA.yml:156-158`). `changed_artifact.ref` resolves to one document of one `ref_kind`.
- **Polymorphic ref** for delta payloads, like `references_any` (`CRAFT-LEDGER-SCHEMA.yml:226-237`, `300-313`): a `changed_fields` entry references a schema field row; a `changed_obligations` entry references a contract obligation row; an `examples_delta` entry references an example document; a `validations_run` entry references a validator/rule id.
- **Version-pinned ref.** Because contracts/schemas evolve, the subject reference carries `ref_version` analogous to `schema_ref` + `schema_version` in the example fixtures (`CRAFT-INTERFACE-EXAMPLE.yml:2-3`, `CRAFT-INTERACTION-EXAMPLE.yml:2-3`). This lets an iteration name _which_ version it transformed.

So the attachment is: **subject document is referenced, never edited in place by the iteration; the iteration is the durable change record that points inward at the rows it touched** — the same inversion Craft uses for receipts/events pointing at handoffs and contexts.

### 3.3 Validator attachment

Validators attach two ways, matching the two validation surfaces in §1.6:

- A `validations_run` entry references a **schema rule id** (e.g. `VAL-007`, `CI-R003`) when the change was checked against static rules.
- A `validations_run` entry references a **receipt/producer** (e.g. a `dispatch-spec` or `task-session` verdict) when an owner capability validated the change (`CRAFT-INTERACTION-EXAMPLE.yml:127-164`). Per `CX-R003` the iteration stores, never rewrites, that verdict.

---

## 4. Traceability — reconstructing history

A reader reconstructs the full evolution of any contract/schema/example by the same replay the interaction ledger demonstrates:

1. **Filter by subject.** Select all iteration rows whose `changed_artifact.ref` equals the target document id. (Analogue: filtering `route_events` by `context_id`, `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:124-126`.)
2. **Order the chain.** Sort by `sequence` and follow `supersedes` links to form a linear (or branching) version chain. The `supersedes` relation type already exists (`CRAFT-LEDGER-SCHEMA.yml:47-53`), and ordered events are an established family.
3. **Replay states.** Each row's `prev_state`→`next_state` must abut its predecessor's `next_state`, giving a verifiable lifecycle trail (`active`→`superseded`→…). This is the generalization of `description_status` versioning (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:44-69`).
4. **Walk deltas to current shape.** Applying each `changed_fields`/`changed_obligations` delta in order reproduces the document's current structure; the last iteration's `next_state` is the live state.
5. **Trace evidence outward.** Every iteration and sub-delta carries `evidence` and typed refs to the decisions, blockers, and receipts that justified it — the same evidence-everywhere discipline used across all Craft families. From any iteration a reader can jump to the closing `decision_ref` or the validating `receipt_id` (as `EVT-RECEIPT-001`/`EVT-RECOMPOSE-001` do, `CRAFT-INTERACTION-EXAMPLE.yml:181-204`).

**Validation rules to enforce traceability** (cloning the existing `validation_rules` style, `CRAFT-LEDGER-SCHEMA.yml:370-400`):

- ITR-R001 (block): `changed_artifact.ref` must resolve to an existing document.
- ITR-R002 (block): `prev_state` must equal the `next_state` of the immediately-preceding iteration on the same subject (no gaps in the chain).
- ITR-R003 (block): a `blockers_delta` with `op=resolved` may not act on a blocker whose refinement_status is `raw` or `typed` (mirrors prohibited transitions, `CRAFT-LEDGER-SCHEMA.yml:415-419`).
- ITR-R004 (flag): every sub-delta should carry `evidence` (mirrors VAL-009 enabler-evidence flag, `CRAFT-LEDGER-SCHEMA.yml:396-397`).
- ITR-R005 (block): `promotion_status=promoted-by-owner` requires owner-route evidence (mirrors CI-R005).

---

## 5. Open questions / risks

1. **One subject vs many per iteration.** §3 recommends one `changed_artifact` per iteration (clean traceability), but the lane's own delta list spans contract+schema+example+validator simultaneously. Open decision: allow a single iteration to declare a _primary_ subject plus secondary refs, or force one iteration per document and link sibling iterations via `supersedes`/relations? Evidence pulls both ways — `CX-R001` favors one owner (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:169-171`); the delta list favors many.
2. **Branching vs linear history.** `route_events` are linear-ordered; real iteration may branch (a draft forked, one branch superseded). Does the chain need a DAG (parent_iteration list) or is linear `sequence`+`supersedes` enough? Not resolvable from current evidence — Craft has no branching example.
3. **State enum ownership.** `prev_state`/`next_state` need a _single canonical_ lifecycle enum, but evidence offers several overlapping vocabularies (`context_stage`, `artifact_status`, `definition_status`, and the CONTEXT-PACK list). These must be reconciled into one iteration lifecycle enum before implementation — likely a Lane-wide decision-gate item, not a Lane-3-only call.
4. **Constraint deltas vs field deltas.** The lane bundles "changed fields/constraints" into one dimension, but schemas express constraints in several forms — `pattern`, `enum_ref`, `required_fields`, `conditionally_required_fields`, `validation_rules` (`CRAFT-LEDGER-SCHEMA.yml`). Whether one `changed_fields` op-type covers all of these or constraints need their own delta sub-family is unresolved.
5. **Validator verdict freshness.** `validations_run` stores a verdict for a specific subject version. After a later iteration mutates the subject, prior verdicts are stale. Need a rule for marking superseded validation results (the `receipt_status: superseded` value exists — `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:25` — but no policy ties it to iteration sequence).
6. **Where iteration records physically live.** Craft splits schema authority (YAML) from fixture (Markdown/`.craft/ledger.yml`) via `source_of_truth_policy` (`CRAFT-LEDGER-SCHEMA.yml:16-24`). Open: do iteration rows live inside the subject's ledger, in a sibling iteration ledger, or as standalone documents? This interacts with the project-wide YAML-first/DSL-first/dual-surface syntax decision still deferred (`DOMAINSPEC-LANGUAGE-HANDOFF.md:119-121`).
7. **Gaps not in the named delta list.** The lane brief names blockers and decisions but not gaps, yet gaps are a first-class Craft record with their own lifecycle. Recommend folding gaps into `blockers_delta` (shared mechanism) or adding a `gaps_delta`; flagged as a scope question.

---

### Evidence index

- `DOMAINSPEC-LANGUAGE-HANDOFF.md` — Iteration Layer, contract/schema split, non-goals.
- `CONTEXT-PACK.md` — four artifact families, lifecycle list, derived requirements.
- `CRAFT-LEDGER-SCHEMA.yml` — parent: contexts/artifacts/relations/typed_items/decisions, enums, validation_rules, blocker_lifecycle.
- `CRAFT-INTERFACE-LEDGER-SCHEMA.yml` — descriptions(versioned)/definitions/gaps, interface validation rules.
- `CRAFT-INTERACTION-LEDGER-SCHEMA.yml` — route_handoffs/receipts/route_events, interaction validation rules.
- `CRAFT-INTERFACE-EXAMPLE.yml` / `CRAFT-INTERACTION-EXAMPLE.yml` — concrete instances of the above.
- `arcanum/spells/invoke/handoff.md` — handoff as bounded contract, obligation-linked selection.
