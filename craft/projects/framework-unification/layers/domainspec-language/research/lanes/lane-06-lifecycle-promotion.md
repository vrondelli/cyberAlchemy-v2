# Lane 06 — Lifecycle States & Promotion (Research / Design)

Lane question: _What are the canonical lifecycle states, the transitions between them, and what makes a contract promotable from candidate to canonical?_

## Summary

The CONTEXT-PACK proposes a single document-level lifecycle line (`draft, refined, gated, implemented, validated, promoted, superseded, blocked`), but the evidence shows this is actually **two orthogonal axes that have been collapsed into one list**: a _maturity/lifecycle_ axis (how far an artifact has progressed) and a _promotion/authority_ axis (whether it is a local candidate or an owner-blessed canonical). The Craft schemas already prove this separation in practice: `context_stage` tracks maturity (`idea → … → closed`) while `definition_status` tracks promotion (`candidate → active-local → promoted-by-owner`), and a separate `gate_status` (`pass/flag/block`) is the verdict that gates transitions rather than a state itself. The strongest reusable model is therefore: (1) a maturity lifecycle whose forward transitions are guarded by gates; (2) a promotion lifecycle (`candidate → canonical`) governed by an explicit owner route, never by reaching `validated`; (3) a gate verdict (`pass/flag/block`) as the transition guard, not a lifecycle member; and (4) gaps, blockers, and decisions as first-class rows whose open/unresolved status mechanically blocks both validation and promotion. Promotability is the conjunction of "validates structurally," "obligations addressable," "examples pass," "no open blockers," "decisions closed," "evidence present," and "an owner authority approves the promotion" — each of which maps to a concrete construct already in the evidence. Below I reconcile the proposed list against every status/state enum found, give a guarded state machine, and define the promotion model criterion-by-criterion with citations.

---

## 1. Canonical lifecycle states — reconciled against the evidence

### 1.1 The proposed list and where it comes from

The handoff and context pack both assert a single lifecycle line:

- Handoff: _"this artifact is draft, refined, gated, implemented, validated, promoted, or blocked"_ (`DOMAINSPEC-LANGUAGE-HANDOFF.md:30-31`) and `lifecycle state` listed as a contract concern (`:42`).
- Context pack: _"lifecycle state, including draft, refined, gated, implemented, validated, promoted, superseded, and blocked"_ (`CONTEXT-PACK.md:154-155`).
- `superseded` appears in the pack list but is dropped from the handoff list — first conflict (see §1.4).

### 1.2 Every status/state enum found in the evidence

The proposed list is _not_ taken from any single existing enum. The evidence has several distinct enums, none of which matches it. They fall into three families:

**A. Maturity / stage enums**

- `context_stage`: `idea, define, design, plan, execute, validate, reflect, blocked, closed` (`CRAFT-LEDGER-SCHEMA.yml:27-36`). This is the closest analogue to the proposed lifecycle. Note it has `idea/define/design/plan/execute/validate/reflect` where the proposal has `draft/refined/gated/implemented/validated` — different vocabulary, overlapping intent. It also carries `blocked` and a terminal `closed`, and has **no** `promoted` member.
- `artifact_status`: `planned, active, stale, superseded, closed` (`CRAFT-LEDGER-SCHEMA.yml:41-46`). A coarser artifact-level lifecycle; contributes `superseded` and a terminal `closed`.
- `handoff_status`: `planned, active, completed, blocked, superseded` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:21-27`). Same shape as artifact_status with `completed` instead of `closed`.

**B. Promotion / authority enums**

- `definition_status`: `candidate, active-local, superseded, promoted-by-owner` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:18-22`). This is the **promotion axis**, explicitly distinct from maturity. `candidate → active-local → promoted-by-owner` is exactly the "candidate to canonical" path the lane question asks about, and the schema status field itself is `status: candidate-local` (`:3`).

**C. Verdict / gate enums (NOT lifecycle states)**

- `gate_status`: `pass, flag, block` (`CRAFT-LEDGER-SCHEMA.yml:37-40`). This is the transition _guard_, not a state. The Craft interface `validate` method "returns pass, flag, or block" (`CRAFT-INTERFACE-VALIDATION.md:38`).
- `receipt_status`: `pass, flag, block, superseded` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:28-32`); `native_stage_receipts.status`: `pass, flag, block, not_run` (`dispatch.schema.yml:305-311`); `subagent_lifecycle.status`: `none, pass, flag, block` (`dispatch.schema.yml:217-222`). All verdict enums, all share the `pass/flag/block` core.
- Gap/blocker/decision status enums (treated in §4): `gap_status` (`active, planned, resolved, waived, superseded`, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:23-28`), `typed_item_status`, `refinement_status`, `decision_status`.

### 1.3 Canonical lifecycle state set (recommended)

I recommend the language adopt the **maturity axis** as its `lifecycle_state` enum, keep `superseded`/`blocked` as cross-cutting states, and move `promoted` to a separate `promotion_state` field (§3). Definitions, reconciling the proposed names against the evidence vocabulary:

| State         | Definition                                                                                                         | Evidence anchor / reconciliation                                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft`       | Artifact exists but is not yet internally coherent; obligations and structure incomplete.                          | Maps to `context_stage: idea`/`define` (`CRAFT-LEDGER-SCHEMA.yml:28-30`).                                                                                                                                                                                                                   |
| `refined`     | Intent, obligations, and structure are coherent enough to design/plan against; no gate passed yet.                 | Maps to `context_stage: design`/`plan` (`:31-32`); aligns with `refine` capability producing "refined seed/design" per pack derived requirements.                                                                                                                                           |
| `gated`       | A gate condition has been declared and evaluated; the artifact has passed at least one design/plan/readiness gate. | `gates[].kind` includes `policy, decision, quality, promotion_guardrail, validation, human_approval` (`dispatch.schema.yml:467-473`); Craft `readiness_gate`, `plan_gate`, `design_gate` (`CRAFT-LEDGER-SCHEMA.yml:115-126`). `gated` is the proposal's name for "a gate has been crossed." |
| `implemented` | The agreement has a concrete realization (schema instance, code, executed work).                                   | Maps to `context_stage: execute` (`:33`); handoff "implemented" (`DOMAINSPEC-LANGUAGE-HANDOFF.md:30`).                                                                                                                                                                                      |
| `validated`   | Validation has run and returned `pass` (or `flag` with accepted residue); evidence recorded.                       | Maps to `context_stage: validate` (`:34`); validation reports return `pass` (`CRAFT-INTERFACE-VALIDATION.md:77-79`, `CRAFT-INTERACTION-VALIDATION.md:75-77`). **`validated` is necessary but NOT sufficient for `promoted` — see §3.**                                                      |
| `promoted`    | An owner authority has blessed the artifact as canonical for its scope.                                            | `definition_status: promoted-by-owner` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:21`); recommend moving to a separate `promotion_state` axis (§3).                                                                                                                                                |
| `superseded`  | A newer artifact has replaced this one; retained for traceability.                                                 | `artifact_status: superseded` (`:45`), `definition_status: superseded` (`:20`), `relation_type: supersedes` (`:53`). Cross-cutting terminal state reachable from any maturity state.                                                                                                        |
| `blocked`     | Forward progress is stopped by an open blocker, failed gate (`block`), or unresolved decision.                     | `context_stage: blocked` (`:35`); `gate_status: block` (`:39`); `handoff_status: blocked` (`:25`). Cross-cutting state reachable from any maturity state, exited by resolving the blocking record.                                                                                          |

Two additional terminal states exist in the evidence but are **absent from the proposed list** — flag them as gaps (§6):

- `closed` (`context_stage`, `artifact_status`) — a successful terminal distinct from `superseded`. The proposal has no successful terminal short of `promoted`.
- `completed` (`handoff_status`) / `stale` (`artifact_status`) — additional terminals not in the proposal.

### 1.4 Conflicts and overlaps flagged

1. **`superseded` dropped from the handoff list** but present in the pack and in three evidence enums — keep it. (`DOMAINSPEC-LANGUAGE-HANDOFF.md:30-31` vs `CONTEXT-PACK.md:154-155` vs `CRAFT-LEDGER-SCHEMA.yml:45`).
2. **`gated` conflates a state with a verdict.** `gate_status` (`pass/flag/block`) is the verdict; `gated` should mean "a gate was applied and passed." Recommend `lifecycle_state=gated` only after `gate_status=pass`. (`CRAFT-LEDGER-SCHEMA.yml:37-40`.)
3. **`promoted` conflates maturity with authority.** Evidence keeps these separate: `context_stage` has no `promoted`; promotion lives in `definition_status` and is governed by an explicit owner route (rule CI-R005, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:174-176`). Collapsing them would let "reaching validated" imply canonical, which the evidence explicitly forbids (§3).
4. **Vocabulary mismatch maturity-axis vs proposal.** `context_stage` uses `idea/define/design/plan/execute/validate/reflect`; the proposal uses `draft/refined/gated/implemented/validated`. The language must pick one canonical vocabulary and provide a mapping table (above) so Craft artifacts remain expressible. `reflect` has no proposal analogue (gap, §6).
5. **No successful non-promoted terminal** in the proposal (`closed`/`completed` exist in evidence). An artifact that is validated but will not be promoted needs a resting terminal.
6. **Verdict-enum drift.** `pass/flag/block` is the shared core but receipts add `superseded`, dispatch stages add `not_run`, subagents add `none`. The language should define one canonical verdict enum and document the per-context extensions.

---

## 2. Allowed transitions (guarded state machine)

The transition model has two principles drawn from the evidence: **(a) forward maturity transitions are guarded by gate verdicts**, and **(b) `blocked`/`superseded` are cross-cutting and reachable from anywhere**.

### 2.1 Maturity transitions

```
draft ──gate(design/plan)──▶ refined ──gate(readiness)──▶ gated
gated ──(realization)──────▶ implemented ──validation──▶ validated
validated ──owner promotion route──▶ promoted        (promotion axis, §3)
validated ──(no promotion intended)──▶ closed         (successful terminal)

any state ──block verdict / open blocker / open decision──▶ blocked
blocked ──(blocker resolved + recomposition evidence)──▶ (prior state)
any state ──supersedes relation──▶ superseded          (terminal)
```

### 2.2 Which transitions require a gate or validation to ENTER a state

| Target state  | Guard required to enter                                                                                                                                                                                                                                                                                                                                        | Evidence                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `gated`       | A declared gate evaluates to `pass`. Gate kinds: `policy, decision, quality, promotion_guardrail, validation, human_approval`; `on_fail ∈ {block, flag, defer, ask, reroute}` (`dispatch.schema.yml:451-488`). Craft gates carry a `closure_condition` (VAL-008, `CRAFT-LEDGER-SCHEMA.yml:393-394`).                                                           | `dispatch.schema.yml:451-488`; `CRAFT-LEDGER-SCHEMA.yml:115-126,393-394`                      |
| `implemented` | Realization exists; in dispatch terms a step produces output with a `native_stage_receipt.status ∈ {pass,flag}` (not `not_run`/`block`).                                                                                                                                                                                                                       | `dispatch.schema.yml:279-330`                                                                 |
| `validated`   | Validation runs and returns `pass` (or `flag` with accepted residue). Craft `validate` returns pass/flag/block (`CRAFT-INTERFACE-VALIDATION.md:38`); both Craft validation reports return `pass` only after a method-coverage + schema + example + hard-gate matrix all pass (`CRAFT-INTERFACE-VALIDATION.md:22-79`, `CRAFT-INTERACTION-VALIDATION.md:22-77`). | `CRAFT-INTERFACE-VALIDATION.md:22-79`; `CRAFT-INTERACTION-VALIDATION.md`                      |
| `promoted`    | Explicit owner promotion route + promotion guardrails (see §3). Never automatic on `validated`.                                                                                                                                                                                                                                                                | `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:21,174-176`; `dispatch.schema.yml:467-471,527-535,671-690` |
| `blocked`     | Any `block` verdict, open blocker (`typed_item_status`/`gap_status` active), or active blocking decision.                                                                                                                                                                                                                                                      | `CRAFT-LEDGER-SCHEMA.yml:39,403-419`; CI-R004 (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:177-178`)   |

### 2.3 Prohibited / constrained transitions (from evidence)

- **No skipping refinement on blockers.** `blocker_lifecycle.prohibited_transitions`: `raw→resolved` and `typed→resolved` are forbidden (`CRAFT-LEDGER-SCHEMA.yml:415-419`). Generalize: a record cannot jump from unrefined to resolved/closed without passing through the intermediate refined/proposed states.
- **`blocked` cannot be exited (context closed) without recomposition evidence.** "Closed contexts require validation evidence and recomposition evidence" (CI-R006, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:177-179`); a blocked receipt cannot close a context (CX-R004, `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:177-178`; CI-R004).
- **A blocked receipt cannot drive a forward transition** — verdict authority belongs to the producer and is recorded, not rewritten (CX-R003, `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:175-176`).
- **`on_fail`/`on_violation` defines the transition outcome on guard failure**: `block` (stay/regress to blocked), `flag` (advance with recorded residue), `defer`, `ask` (human gate), `reroute` (`dispatch.schema.yml:480-488,691-698`).

---

## 3. Promotion model — candidate → canonical

### 3.1 Promotion is a separate axis governed by an owner route, not by maturity

The single most load-bearing finding for the lane question: **reaching `validated` does NOT make an artifact canonical.** The evidence is explicit and repeated:

- `definition_status` is a distinct enum from `context_stage`/`artifact_status`, with the canonical endpoint named `promoted-by-owner` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:18-22`).
- Validation rule **CI-R005**: _"Definitions stay local candidates unless promoted by owner route"_, `on_fail: block` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:174-176`).
- Both Craft validations passed yet **explicitly defer promotion**: "promotion remain deferred" / "promotion remains deferred" (`CRAFT-INTERFACE-VALIDATION.md:81-83`; `CRAFT-INTERACTION-VALIDATION.md:79-81`). The hard-gate rows assert "Definitions are not promoted without owner route" / "Candidate definitions are not promoted" (`CRAFT-INTERFACE-VALIDATION.md:75`, `CRAFT-INTERACTION-VALIDATION.md:72`).
- The schema files themselves carry `status: candidate-local` / `status: candidate` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:3`, `CRAFT-LEDGER-SCHEMA.yml:3`) — they are validated artifacts that are _still candidates_.
- The dispatch schema has dedicated promotion machinery separate from gates: `gates[].kind: promotion_guardrail` (`dispatch.schema.yml:471`), a top-level `promotion_guardrails: [string]` (`dispatch.schema.yml:532-535`), `authority_map.promotion` (a named promotion authority, `dispatch.schema.yml:608-609`), and `promotion_split { source, target, rule, on_violation }` (`dispatch.schema.yml:671-690`).

Recommendation: model promotion as `promotion_state ∈ {candidate, active-local, promoted-by-owner, superseded}` (mirroring `definition_status`), orthogonal to `lifecycle_state`. Promotion to canonical requires an explicit `promotion` authority (`authority_map.promotion`) and survives the `promotion_guardrails`.

### 3.2 Promotability criteria → evidence map

A contract is promotable from candidate to canonical when **all** of the following hold:

| #   | Criterion                    | Concrete check                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Schema validates**         | The artifact instance satisfies its schema: required fields present, enums valid, references resolve.              | Craft VAL-001..VAL-010 (`CRAFT-LEDGER-SCHEMA.yml:370-400`); dispatch `required` lists + `enum` constraints (`dispatch.schema.yml:6-12`, throughout); validators are "the authority for accepted shape" (`CONTEXT-PACK.md:38`).                                                                            |
| P2  | **Obligations addressable**  | Every declared obligation/method/invariant has coverage evidence.                                                  | Craft validation "Method Coverage" matrix — every interface/interaction method maps to contract evidence and `pass` (`CRAFT-INTERFACE-VALIDATION.md:22-40`, `CRAFT-INTERACTION-VALIDATION.md:22-30`); handoff "obligation coverage matrix" + block unless every obligation covered (`handoff.md:89,104`). |
| P3  | **Examples pass (fixtures)** | At least one example instance validates against the schema.                                                        | Craft "Example Review" / "Fixture Review" matrices, all `pass` (`CRAFT-INTERFACE-VALIDATION.md:53-64`, `CRAFT-INTERACTION-VALIDATION.md:53-63`); examples are "validation fixtures" (`CONTEXT-PACK.md:158`).                                                                                              |
| P4  | **No open blockers**         | No blocker row in `active/proposed`; resolved blockers carry refinement/waiver evidence.                           | `typed_item_status` (`CRAFT-LEDGER-SCHEMA.yml:60-73`); VAL-007 resolved blocker needs evidence or waiver (`:389-390`); CI-R003 raw blocker can't resolve directly (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:167-168`); a blocked receipt cannot close (CX-R004).                                                |
| P5  | **Decisions closed**         | All blocking decisions have `status: closed`/`superseded` with rationale + evidence.                               | `decision_status: active/superseded/closed` (`CRAFT-LEDGER-SCHEMA.yml:87-90`); CI-R004 "Blocking active decisions stop dependent execution" (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:177-178`); `decide` requires rationale and evidence (`CRAFT-INTERFACE-VALIDATION.md:33`).                                 |
| P6  | **Evidence present**         | Definitions/gaps/blockers/receipts carry an `evidence` field; closure carries validation + recomposition evidence. | `evidence` required on definitions and gaps (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:76-79,108-110`); `receipts.required_fields` include `validation_result, audit_reference, residue` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:88-96`); CI-R006 closure needs validation + recomposition evidence.               |
| P7  | **Gates passed**             | Any `promotion_guardrail`/`validation`/`human_approval` gate returns `pass`/approved.                              | `gates[].kind` + `on_fail` (`dispatch.schema.yml:451-488`); `promotion_guardrails` (`:532-535`); `subagent_strategy.authorization ∈ {not_needed,requires_user_permission,approved,blocked}` (`:195-201`).                                                                                                 |
| P8  | **Owner authority approves** | A named promotion owner executes the promotion route; promotion is not implied by validation.                      | CI-R005 (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:174-176`); `authority_map.promotion` (`dispatch.schema.yml:608-609`); `promotion_split.rule`/`on_violation` (`:671-690`).                                                                                                                                     |

P1–P7 are _necessary preconditions_ (mostly checkable mechanically / by the validator). **P8 is the sufficient act** — without an owner route the artifact stays `active-local`, never `promoted-by-owner`.

### 3.3 Promotion guardrail / split behavior

The dispatch schema models promotion as a guarded _split_ from a candidate source to a canonical target: `promotion_split { source, target, rule, on_violation∈{block,flag,defer,ask,reroute} }` (`dispatch.schema.yml:671-690`). This generalizes cleanly: a DomainSpec promotion is a transition from `candidate` namespace/scope to `canonical` namespace/scope, governed by a `rule`, owned by `authority_map.promotion`, and protected by `promotion_guardrails`. `state_namespace { namespace, owner, write_policy }` (`dispatch.schema.yml:654-670`) supports modeling "candidate-local" vs "canonical" as different owned namespaces.

---

## 4. Lifecycle ↔ iteration record ↔ first-class gaps/blockers/decisions

### 4.1 Lifecycle state is a field on the iteration record's endpoints

The handoff's iteration record already names lifecycle as a delta: an iteration record captures "previous state / next state ... decisions opened or closed / blockers created or resolved / promotion status" (`DOMAINSPEC-LANGUAGE-HANDOFF.md:67-80`). So `lifecycle_state` (and `promotion_state`) are exactly the `prev_state → next_state` fields of an iteration record, and "promotion status" is carried as its own delta dimension. This confirms the two-axis split: an iteration can advance maturity, advance promotion, or both.

The interaction ledger's `route_events` family is the concrete evidence that ordered, evidence-bearing transition events already work: `event_type ∈ {route_classified, handoff_created, receipt_received, receipt_applied, residue_opened, recomposition_completed}` with `application_policy ∈ {record-only, apply-to-context, open-residue, recompose-child}` (`CRAFT-INTERACTION-LEDGER-SCHEMA.yml:27-38,120-159`). Each lifecycle transition should emit such an event with evidence — this is the audit trail that proves a state was entered legitimately.

### 4.2 Gaps, blockers, and decisions are first-class state-affecting records

These are not prose; they are typed rows whose status mechanically constrains lifecycle and promotion:

- **Gaps**: `gaps` row family with required `severity ∈ {info,flag,block,deferred}`, `treatment ∈ {plan,defer,waive,delegate,split}`, `owner`, `status ∈ {active,planned,resolved,waived,superseded}`, `evidence` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:29-39,99-135`). A `block`-severity active gap forces `blocked`; a `waived` gap requires a decision (treatment `waive`).
- **Blockers** (`typed_items` kind=blocker): require `refinement_status` + `closure_condition` (VAL-006), cannot resolve from raw/typed (prohibited transitions), and a `resolved` blocker needs refinement evidence or a linked waiver decision (VAL-007) (`CRAFT-LEDGER-SCHEMA.yml:260-269,386-390,402-419`).
- **Decisions**: `decisions` row family, `decision_type ∈ {selection,waiver,deferral,approval,rejection}`, `status ∈ {active,superseded,closed}`, required `rationale` (`CRAFT-LEDGER-SCHEMA.yml:81-90,334-368`). An active blocking decision stops dependent execution (CI-R004) — i.e. holds the artifact at `blocked`/pre-`validated`.

So the lifecycle machine is _driven by_ the status of these first-class rows: an open `block` record ⟹ `blocked`; all such records resolved/closed/waived-with-decision ⟹ eligible to advance; this is the mechanical backbone of promotability criteria P4/P5/P6.

---

## 5. Definitions with source + confidence

### 5.1 What the evidence already provides: source authority

Definitions are modeled as first-class rows with explicit source/authority and a promotion status:

- `definitions` row family: required `term`, `statement`, `status` (`definition_status`), and `evidence` (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:70-97`). `evidence` is the source pointer; `status` is the authority/promotion level (`candidate → active-local → promoted-by-owner`).
- A `source_of_truth_policy` declares the canonical owner for state: `target_project_source: .craft/ledger.yml`, `human_view: CRAFT.md`, with the note "candidate definitions remain local unless promoted by an owner route" (`CRAFT-INTERFACE-LEDGER-SCHEMA.yml:5-12`).
- Validation confirms "YAML owns state" / "Markdown is view only" via `source_of_truth_policy.*` (`CRAFT-INTERFACE-VALIDATION.md:48-51`).
- The dispatch `authority_map` is the generic source-authority construct: named owners for `lifecycle, execution, validation, evidence, memory, promotion` (`dispatch.schema.yml:595-611`). `technique_ref.source ∈ {arcanum-dispatch-synthesis, pole-data-standards, local-extension}` shows source provenance attached to a reusable item (`dispatch.schema.yml:537-559`).

### 5.2 What is MISSING: explicit confidence

The pack asks for "definitions as reusable terms with source and confidence" (`CONTEXT-PACK.md:158`; handoff §Source/derived requirements). **Source is well-modeled; confidence is not.** No evidence enum carries a confidence/uncertainty value. The closest proxies are:

- `definition_status` (`candidate/active-local/promoted-by-owner`) — an _authority_ tier, which is a coarse confidence proxy but conflated with promotion.
- `gate_status`/verdict (`pass/flag/block`) — a quality verdict, not a definition confidence.

Recommendation (gap, §6): add an explicit `confidence` field to definitions (e.g. an enum `assumed | inferred | source-backed | proven`, or a 0–1 score), distinct from `status` (authority/promotion) and from `evidence` (the source pointer). Source = _where it came from_; confidence = _how much we trust it_; status = _who has blessed it_. The three are independent and the evidence only models the first and third.

---

## 6. Open questions / risks for this lane

1. **One vocabulary or two?** The proposed `draft/refined/gated/implemented/validated` vs Craft's `idea/define/design/plan/execute/validate/reflect`. The language must pick a canonical `lifecycle_state` enum and ship a mapping table so existing Craft artifacts remain expressible. `reflect` and `closed` have no proposal analogue. (`CONTEXT-PACK.md:154-155` vs `CRAFT-LEDGER-SCHEMA.yml:27-36`.)
2. **Single axis vs two axes.** Strong evidence says maturity and promotion are orthogonal (`context_stage` has no `promoted`; promotion is `definition_status` + owner route, CI-R005). Decision needed: keep `promoted` in the lifecycle enum (overfit, risks implying validated⟹canonical) or split into `lifecycle_state` + `promotion_state` (recommended, matches evidence). Needs a decision-gate record.
3. **`gated` semantics.** Is `gated` a state (a gate was passed) or a synonym for the `pass` verdict? Recommend the former, but the proposal's wording is ambiguous. (`dispatch.schema.yml:451-488` vs `CRAFT-LEDGER-SCHEMA.yml:37-40`.)
4. **Missing successful terminal.** The proposal has no `closed`/`completed` — an artifact that is validated but intentionally not promoted has nowhere to rest. (`CRAFT-LEDGER-SCHEMA.yml:36,45`; `CRAFT-INTERACTION-LEDGER-SCHEMA.yml:24`.)
5. **Confidence is unmodeled.** Source authority is well-supported; confidence has no evidence backing and must be designed fresh (§5.2). Risk of conflating it with `status` or `gate_status`.
6. **Verdict enum drift.** `pass/flag/block` core extended inconsistently (`+superseded`, `+not_run`, `+none`). The language needs one canonical verdict enum with documented per-context extensions.
7. **Promotion authority binding.** `authority_map.promotion` and `promotion_split` exist in dispatch but no Craft artifact has _exercised_ a promotion (all defer it). The promotion route is specified but unproven — the first live test should promote one candidate to validate the model end-to-end. (`CRAFT-INTERFACE-VALIDATION.md:81-83`; `dispatch.schema.yml:608-609,671-690`.)
8. **`flag` handling at gates.** `on_fail: flag` lets an artifact advance with recorded residue (e.g. CI-R007, VAL-009 are `flag` not `block`). The language must define whether a `flag`ged artifact can reach `validated`/`promoted` and what residue record is mandatory. (`dispatch.schema.yml:480-488`; `CRAFT-LEDGER-SCHEMA.yml:396-397`; `CRAFT-INTERFACE-LEDGER-SCHEMA.yml:180-181`.)
