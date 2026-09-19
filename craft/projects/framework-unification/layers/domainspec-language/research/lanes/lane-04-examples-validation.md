# Lane 04 — Examples & Validation Strategy (Research / Design)

Lane question: _How do examples become validation fixtures, and what is the validation strategy and authority model?_

## Summary

The Craft evidence already operates a working, if implicit, fixture-and-validation system, and it cleanly separates two validation axes that the DomainSpec language should make explicit. An example document today binds to its schema by a single `schema_ref` + `schema_version` pair and self-declares its role as a fixture via `status: candidate-local-fixture` (`CRAFT-INTERFACE-EXAMPLE.yml:1-4`, `CRAFT-INTERACTION-EXAMPLE.yml:1-4`). Validation happens at two layers: **structural** validation, where schemas own "accepted shape" through `required_fields`, typed `reference`/`references_any` pointers, regex `pattern`s, enum constraints, and `validation_rules` carrying `on_fail: block|flag` severities (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:160-182`, `dispatch.schema.yml:6-13,451-488`); and **semantic/obligation** validation, where contracts own "obligation satisfied" and the evidence shows it is currently discharged by a _narrative review document_ that walks methods, gates, and fixtures and records a pass/flag/block verdict (`CRAFT-INTERFACE-VALIDATION.md`, `CRAFT-INTERACTION-VALIDATION.md`). The authority model is therefore split: the schema/validator is canonical for shape, the contract (adjudicated by an owner) is canonical for obligations, and a document points at its shape authority through `schema_ref` and should point at its obligation authority through an explicit `contract_ref`. The crucial gap the language must close is that example documents do **not** today declare whether they are expected to PASS or FAIL, and the obligation layer is prose that the handoff explicitly forbids relying on alone (`DOMAINSPEC-LANGUAGE-HANDOFF.md:122`). The smallest validateable surface is a structural validator that loads an `example`, resolves its `schema_ref`, checks required fields / enums / patterns / reference integrity, and asserts the result against a declared `expect: pass|fail`.

---

## 1. How examples bind to schemas today, and the proposed fixture declaration

### 1.1 Current binding (evidence)

Both example instances bind to exactly one schema by reference, with a version, and self-label as fixtures:

- `CRAFT-INTERFACE-EXAMPLE.yml:1-6` declares `ledger_id`, `schema_ref: development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml`, `schema_version: 0.1.0`, `status: candidate-local-fixture`, plus `source_of_truth` and `human_view`.
- `CRAFT-INTERACTION-EXAMPLE.yml:1-4` declares the same `schema_ref` / `schema_version` / `status: candidate-local-fixture` pattern against the interaction schema.
- The schema side carries the matching identity: `schema_id: craft.interface_ledger`, `schema_version: 0.1.0`, `status: candidate-local` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:1-3`). The example's `schema_version` and the schema's `schema_version` are the same string `0.1.0` — a manual, unenforced version pin.

The example's body is then a set of row families (`contexts`, `artifacts`, `descriptions`, `definitions`, `gaps`, `typed_items`, `decisions`, `relations`, `recomposition`) whose names mirror the schema's `row_families` and inherited families. So the _binding mechanism that already exists_ is: **one `schema_ref` string + one `schema_version` string + family-name correspondence between document body and schema `row_families`.**

The validation documents confirm this is how examples are treated as fixtures: `CRAFT-INTERFACE-VALIDATION.md:53-64` has an "Example Review" table asserting specific rows exist (`CTX-CRAFT-TEST`, `BLK-STORAGE-SOURCE-001`, `DEF-LOCAL-LEDGER-001`, etc.), and `CRAFT-INTERACTION-VALIDATION.md:53-63` has a "Fixture Review" table asserting `HND-INVOKE-PLAN-001`/`RCT-INVOKE-PLAN-001` etc. exist. The example _is the fixture the contract validation reads against_.

### 1.2 Gaps in the current binding

- **No positive/negative declaration.** Both examples are implicitly positive fixtures (expected to validate clean). Nothing in either file says "this should PASS" or "this is a negative fixture that should FAIL rule CI-R003." Negative fixtures cannot exist in the current model, so the `validation_rules` (e.g. `CI-R003 Raw blockers cannot be marked resolved directly`, `on_fail: block`) have **no executable counter-example** proving the rule actually trips.
- **No contract reference.** The example points at the _schema_ (`schema_ref`) but not at the _contract_ whose obligations it is meant to demonstrate. The contract (`CRAFT-INTERFACE.md`) and its obligations are linked only through the human-authored validation doc, not from the fixture itself.
- **Version pin is a bare string.** `schema_version: 0.1.0` is not range-checked; a drifted schema would silently still "match."

### 1.3 Proposed `example` fixture declaration

An `example` document kind should keep the proven `schema_ref` + `schema_version` mechanism and add explicit fixture intent. Minimal proposed header (language-generic, not Craft-specific):

- `kind: example`
- `subject_schema: <ref>` (generalizes `schema_ref`) — required; the structural authority.
- `subject_schema_version: <semver>` — required; the version pin already present.
- `subject_contract: <ref>` — optional; the obligation authority this fixture demonstrates (the missing link from §1.2).
- `expect: pass | fail` — required; declares positive vs negative fixture.
- For `expect: fail`, a `targets` list naming the rule id(s) and/or layer the fixture is designed to violate, e.g. `targets: [CI-R003]` or `targets: [structural.required_field]`. This makes a negative fixture _self-describing_: the validator can assert not just "it failed" but "it failed for the declared reason."
- `body:` — the instance data, with family/field names corresponding to the subject schema (the existing convention).

This is a strict superset of what the two example files already do, so the current Craft examples remain valid by adding `expect: pass` and (optionally) `subject_contract: development/craft/CRAFT-INTERFACE.md`.

---

## 2. Validation layers

The evidence shows two distinct layers, and the language should keep them distinct (the handoff and context pack both insist contract and schema must not collapse — `DOMAINSPEC-LANGUAGE-HANDOFF.md:33-62`, `CONTEXT-PACK.md:162-163`).

### 2.1 Layer A — Structural validation (schema owns accepted shape)

This layer is machine-checkable and already richly specified in evidence:

- **Required keys / shape.** The dispatch schema is literal JSON-Schema (`$schema: https://json-schema.org/draft/2020-12/schema`, `dispatch.schema.yml:1`) with top-level `required: [dispatch_id, intent, mode, steps, gates, observability]` (`dispatch.schema.yml:6-13`) and nested `required` arrays throughout (e.g. step `required: [step_id, name, capability_ref, pattern, inputs, outputs]`, `dispatch.schema.yml:336-343`). The Craft schemas express the same idea as `required_fields` per row family (e.g. `gaps.required_fields: [gap_id, scope_id, summary, severity, treatment, owner, status, evidence]`, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:102-110`).
- **Types.** Craft fields declare `type:` values including a domain-specific `reference`/`references_any` pointer type (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:59-61,84-88,116-120`). Dispatch uses JSON-Schema primitive types plus `enum`, `minLength`, `minItems`, `maxItems`, `oneOf`, `$ref`/`$defs` (e.g. `technique_ref` oneOf at `dispatch.schema.yml:537-559`).
- **Enums.** Craft centralizes enums and references them by name: `enums: definition_status / gap_status / gap_severity / gap_treatment / description_status` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:17-42`) consumed via `enum_ref` (e.g. `severity: {type: enum, enum_ref: gap_severity}`, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:123-125`). Dispatch inlines enums (e.g. gate `kind` and `on_fail`, `dispatch.schema.yml:466-487`).
- **Patterns.** ID fields are regex-constrained: `gap_id pattern "^GAP-[A-Z0-9-]+$"`, `definition_id "^DEF-[A-Z0-9-]+$"`, `description_id "^DESC-[A-Z0-9-]+$"` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:82-83,112-114,57-58`). The example data honors these (`GAP-VALIDATOR-001`, `DEF-LOCAL-LEDGER-001`, `DESC-CRAFT-TEST-001` in `CRAFT-INTERFACE-EXAMPLE.yml`).
- **Reference integrity.** `reference` / `references_any` declare cross-row pointers (e.g. `scope_id references_any [contexts.context_id, artifacts.artifact_id, typed_items.item_id]`, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:115-120`). A structural validator can resolve these — e.g. the example's `GAP-VALIDATOR-001.scope_id: CTX-CRAFT-TEST` must resolve to a real `contexts.context_id` (`CRAFT-INTERFACE-EXAMPLE.yml:72-79` against the declared context at line 9).
- **`validation_rules` with `on_fail` / severity.** Both Craft schemas carry a `validation_rules` block where each rule has an `id`, a `rule` (currently natural-language), and an `on_fail` severity drawn from `block | flag` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:160-182`: CI-R001..CI-R007; `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:168-189`: CX-R001..CX-R007). Dispatch expresses the equivalent at gate/boundary/receipt level with a shared `gate_action` enum `block | flag | defer | ask | reroute` (`dispatch.schema.yml:691-698`), used by gate `on_fail` (`dispatch.schema.yml:480-487`), boundary `on_violation`, receipt `on_missing`, and promotion-split `on_violation` (`dispatch.schema.yml:560-690`).

Note a boundary inside this layer: some `validation_rules` are _structural_ (CI-R001 "exactly one current next_move", CX-R001 "name exactly one owner capability") and are mechanically checkable, while others are _semantic_ (CI-R003 "raw blockers cannot be marked resolved directly", CX-R003 "Craft records native verdicts but does not rewrite them"). They live in the schema today but several encode obligation logic — see §3.3.

### 2.2 Layer B — Semantic / obligation validation (contract owns obligations)

This layer is where the evidence is currently **narrative**, which is exactly what the handoff says is insufficient on its own (`DOMAINSPEC-LANGUAGE-HANDOFF.md:122` "Do not treat prose documentation as enough for validation").

- **Method-coverage obligation.** `CRAFT-INTERFACE-VALIDATION.md:21-41` is a "Method Coverage" table asserting each contract method (`start_project`, `add_blocker`, `validate`, `recompose`, etc.) has supporting evidence and a `pass` verdict. These methods come from the contract surface (`interface_methods` block, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:137-158`) — note the methods are listed in the schema file but represent _contract_ obligations, a sign the two are entangled today.
- **Capability-contract coverage.** `CRAFT-INTERACTION-VALIDATION.md:31-40` asserts each owner capability (`refine`, `decision-gate`, `invoke`, `task-session`, `dispatch-spec`) has a defined "sends/expects/records/boundary" obligation satisfied.
- **Hard gates (the obligation gates).** Both validation docs have a "Hard Gate Review" table — e.g. `CRAFT-INTERFACE-VALIDATION.md:66-76`: ".craft/ledger.yml remains source of truth", "No receipt closes context without recomposition evidence", "Raw blocker cannot resolve directly", "Definitions are not promoted without owner route". `CRAFT-INTERACTION-VALIDATION.md:65-73` repeats the cross-capability gates ("Dispatch pass is route-shape evidence only", "Craft does not overwrite native owner verdicts"). These are _obligations beyond shape_: a document can be structurally perfect and still violate them.
- **Readiness / verdict.** Each doc ends with a single `Validation Result: pass` and an explicit residue statement of what remains deferred (`CRAFT-INTERFACE-VALIDATION.md:77-83`, `CRAFT-INTERACTION-VALIDATION.md:75-80` — "executable receipt validation ... remain deferred"). The verdict vocabulary is the contract's own `validate` return: "pass, flag, or block" (`CRAFT-INTERFACE-VALIDATION.md:38`).
- **Narrative readiness in the contract layer.** Source-of-truth obligation is declared in the schema's `source_of_truth_policy` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:5-12`) but _enforced_ only by the prose gate review — there is no executable check that `.craft/ledger.yml` is canonical.

**Conclusion for §2:** Layer A is well-evidenced and machine-ready. Layer B exists and is taken seriously, but is discharged by human/agent narrative review with a structured verdict. The language should keep Layer B as first-class but require each obligation to carry a _checkable form_ (a rule id + an `on_fail`, or a named manual gate with an owner and a recorded verdict), so that "prose alone" is never the authority.

---

## 3. Validation authority model

### 3.1 Who is canonical for "accepted shape"

The **schema/validator** is canonical for shape. Evidence: the dispatch schema is a self-declared JSON-Schema document (`dispatch.schema.yml:1-5`) and the context pack names it as the place "how validators become the authority for accepted shape" (`CONTEXT-PACK.md:36-38`). The Craft schemas assert the same role via `owner_surface: development/craft` and `status: candidate-local` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:1-4`). A document points at this authority through `schema_ref`/`subject_schema` + `schema_version`.

### 3.2 Who is canonical for "obligation satisfied"

The **contract, adjudicated by a named owner**, is canonical for obligations. The dispatch schema makes ownership of obligations explicit and machine-addressable in two places:

- `gates[].owner` (required) plus `gates[].kind` including `policy | decision | quality | promotion_guardrail | validation | human_approval` (`dispatch.schema.yml:455-475`) — each obligation gate names who owns it.
- the `boundary_evidence.authority` map with named lanes `lifecycle | execution | validation | evidence | memory | promotion` (`dispatch.schema.yml:595-611`). This is the clearest existing "authority model" artifact: it says _which owner is canonical for validation vs promotion vs execution._ The language should adopt this `authority` map shape directly.

In Craft today, the obligation authority is `development/craft` and is exercised through the validation docs' Hard Gate tables and the contract's own `validate` method returning pass/flag/block (`CRAFT-INTERFACE-VALIDATION.md:38,77`).

### 3.3 The entanglement to resolve

`validation_rules` currently live entirely inside the _schema_ files, but several of them are _contract obligations_ (CI-R003, CI-R005 "definitions stay local candidates unless promoted by owner route", CX-R003, CX-R005). This means the schema file is doubling as both shape authority and obligation authority. The language should let a `validation_rule` declare its `layer: structural | obligation` and, for obligation rules, an `authority`/`owner` and a `check: auto | manual`. Structural rules resolve against the schema; obligation rules resolve against the contract owner. This preserves the handoff's non-goal "Do not collapse semantic contracts into structural schemas" (`DOMAINSPEC-LANGUAGE-HANDOFF.md:121`, restated `CONTEXT-PACK.md:138-143`).

### 3.4 How a document points at its authoritative validator

Proposed, generalizing existing fields:

- `subject_schema` (was `schema_ref`) → structural authority. Already present.
- `subject_contract` → obligation authority. New; the missing pointer.
- `authority:` map (borrowed from `dispatch.schema.yml` `authority_map`) on the contract document → names the owner per lane (validation, promotion, etc.).
- The verdict for any document is computed as: `structural = validator(subject_schema)`, `obligation = owner-adjudication(subject_contract)`, and the document's overall state is the worse of the two on the shared `pass | flag | block` scale (the scale both Craft validate methods and dispatch gate actions already use).

---

## 4. Minimal first validation surface

The handoff says: "Build the smallest validateable language surface" (`DOMAINSPEC-LANGUAGE-HANDOFF.md:131`). The smallest _validateable thing_ is a single `example` document checked against its `subject_schema`, with the result asserted against `expect`.

**The first validator should check, in order:**

1. **Header well-formedness.** The `example` document parses and carries `kind: example`, `subject_schema`, `subject_schema_version`, and `expect: pass|fail`. (The two Craft examples already supply `schema_ref` + `schema_version` + a `status`; this step formalizes them — `CRAFT-INTERFACE-EXAMPLE.yml:1-4`.)
2. **Schema resolution + version pin.** `subject_schema` resolves to a loadable schema document and `subject_schema_version` equals the schema's declared `schema_version` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:2` ↔ `CRAFT-INTERFACE-EXAMPLE.yml:3`).
3. **Required fields present.** Every row in a family has the family's `required_fields` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:102-110`), or every required top-level key for a JSON-Schema-style doc (`dispatch.schema.yml:6-13`).
4. **Enum membership.** Every enum-typed field's value is in the referenced enum (`enum_ref` → `enums` block, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:17-42`).
5. **Pattern match.** Every `pattern`-constrained id matches its regex (`^GAP-…$`, `^DEF-…$`, `^DESC-…$`).
6. **Reference integrity.** Every `reference` / `references_any` value resolves to an existing row id in a permitted target family (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:115-120`).
7. **Verdict assertion against `expect`.** If `expect: pass`, steps 3-6 must all pass. If `expect: fail`, at least one must fail, and (if `targets` is declared) it must fail on a declared target. Emit the worst `on_fail` severity encountered (`block | flag`) as the verdict.

Explicitly **out of scope** for the first surface (defer, matching what Craft itself defers — `CRAFT-INTERFACE-VALIDATION.md:81-83`): obligation/Layer-B checks, owner adjudication, narrative gate evaluation, the dispatch `authority`/`boundary_evidence` map, promotion, scoring, and `extends`/schema-inheritance resolution. This first surface validates _one_ document against _one_ leaf schema (note: `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:14-15` uses `extends: CRAFT-LEDGER-SCHEMA.yml`, so the first validator should either pick a non-extending schema or treat `extends` as a known deferred limitation).

This is genuinely minimal: it is pure structural validation, deterministic, needs no model reasoning, and can be exercised immediately against the two existing Craft examples (as positive fixtures) plus one hand-built negative fixture per `validation_rule` worth proving. The handoff's route step 6 — "Run the first live test using Craft as one fixture, then add at least one non-Craft fixture such as dispatch-spec or invoke handoff" (`DOMAINSPEC-LANGUAGE-HANDOFF.md:132-133`) — is satisfied because the same seven-step structural validator works against the dispatch JSON-Schema document with no Craft-specific logic.

---

## 5. Open questions / risks for this lane

1. **Negative fixtures don't exist yet.** Every `validation_rule` with `on_fail: block` (CI-R001..R006, CX-R001..R006) currently has _no_ counter-example proving it actually trips (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:160-182`). Risk: rules are aspirational prose. Open question: does the language _require_ at least one negative fixture per `block`-severity rule before that rule is considered validated? (Recommend yes for any rule claimed "enforced.")

2. **Custom `reference` type vs JSON-Schema.** Craft's `reference`/`references_any` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:59-61`) is not a JSON-Schema primitive, while dispatch is literal JSON-Schema 2020-12 (`dispatch.schema.yml:1`). Open question: does the language standardize one structural-validation dialect, or support both with a `schema_dialect` field? Cross-row reference integrity is the single most valuable structural check and is _not_ expressible in plain JSON-Schema, which argues for a DomainSpec-native dialect.

3. **`validation_rules` are natural-language.** Every rule's `rule:` field is prose (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:161-181`). A validator cannot execute "Raw blockers cannot be marked resolved directly" without a structured predicate. Open question: which rules get a machine `predicate`, and which stay `check: manual` with an owner? This is the core "prose is not enough" tension (`DOMAINSPEC-LANGUAGE-HANDOFF.md:122`).

4. **Structural vs obligation rules are mixed in the schema file.** §3.3 — rules like CI-R003/CX-R003 are obligations living in the schema. Risk: collapsing contract into schema, which the non-goals forbid (`DOMAINSPEC-LANGUAGE-HANDOFF.md:121`). Open question: do obligation rules move to the `contract` document, or stay in the schema tagged `layer: obligation`?

5. **Version pin semantics.** `schema_version` matching is currently a bare string equality. Open question: semver range matching? What is the failure mode when an example pins `0.1.0` but the schema has advanced — block, flag, or auto-upgrade attempt?

6. **`extends` / schema inheritance.** `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:14-15` extends a parent schema; the example's `typed_items`/`relations`/`decisions` families come from the parent, not the file it references. The first validator can't fully validate the example without resolving `extends`. Open question/risk: is inheritance resolution part of v1 or explicitly deferred (the latter limits which fixtures are fully checkable)?

7. **Authority map adoption.** The dispatch `authority_map` (`dispatch.schema.yml:595-611`) and `boundary_evidence` are the strongest existing obligation-authority artifacts but are entirely absent from the Craft examples. Open question: is the `authority` map a required field on every `contract`, or optional? Making it required forces every contract to name a validation owner, which directly answers the lane's "who is canonical" question.

8. **Single overall verdict scale.** Craft uses `pass | flag | block`; dispatch `gate_action` adds `defer | ask | reroute` (`dispatch.schema.yml:691-698`). Open question: which scale is canonical for an `example` validation verdict? (Recommend the structural surface emit only `pass | flag | block`; the richer actions belong to the obligation/gate layer.)
