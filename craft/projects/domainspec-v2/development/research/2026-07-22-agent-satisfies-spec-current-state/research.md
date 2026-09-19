---
dispatch_id: 2026-07-22-agent-satisfies-spec-current-state-research
dispatch_type: research
artifact_role: verbatim-explorer-transcript
authority: non-authority-research-evidence
status: captured
---

# Agent Satisfies Spec — Explorer Returns

## Agent 1 — Tarski, Alfred — Formal Semantics Reconstruction

## Formal current-state: what `agent ⊨ spec` can presently mean

### Bottom line
There is **no single current repository judgment whose subject is an agent and whose specification object is an arbitrary DomainSpec**. The exact machine-checked relation is much narrower: a **request** satisfies a **layered permission policy**, and some later files prove bounded trace-monitor properties over recorded events. The proposed `(spec, action/stream) -> verdict + counter-witness + fallback` relation is candidate design, not implementation or theorem. Current DomainSpec research independently marks runtime behavior satisfaction A6 **KILL/open** and warns that “typed” cannot imply runtime or semantic satisfaction (`findings.md:21-27,90-99`).

### Reconstructed candidate judgments

| Judgment | Subject and spec object | Observation/action/trace domain and quantification | Verdict / counter-witness | Trust assumptions | Actual proof status |
|---|---|---|---|---|---|
| **J1 permission point judgment** `Satisfies(P,r)` | Subject is one request `r : Req`; spec is `P : List (List (Rule Req))`, with each rule containing an arbitrary Boolean matcher and permit/forbid effect. This is not an agent denotation. | One memoryless request. `Satisfies P r := (∀ L∈P, ¬∃ forbid matching r) ∧ (∀ L∈P, ∃ permit matching r)`—universal across policy layers, existential inside each layer (`AgentPermissionKernel.lean:89-103`). | Boolean `allow/deny`; no structured counter-witness. Denial cause can exist extensionally (forbid or absent permit) but `decidePolicy` does not return it (`:105-122`). | Fully parametric in `Rule.applies`; matcher adequacy, request capture, canonicalization and mediation are outside this theorem. File explicitly says crafted requests may evade matchers and non-bypassability is only combinator-level (`:20-27`). | **Existing Lean theorem, locally checked this run.** `decidePolicy P r = allow ↔ Satisfies P r`; soundness half separately exposed (`:132-164`). Lean printed only standard `propext, Quot.sound` dependencies for the main equivalence/soundness. Deny precedence, layer restriction, and a non-flattenability witness also exist (`:166-205`). |
| **J2 policy-composition judgment** `Satisfies(P++Q,r) ↔ Satisfies(P,r) ∧ Satisfies(Q,r)` | Same request; spec object is composition of two layered policies. | Point request, universally quantified theorem over all `P,Q,r`. | Equivalence; counterexample theorem shows flattening layers into a single-set Cedar-like union changes a concrete verdict (`AgentPermissionKernel.lean:187-205`). | Inherits arbitrary matcher and observation assumptions. | **Existing Lean theorem** in `AgentPermissionKernelComposition`: relational and executable meet laws (`:37-55`), plus restriction corollaries (`:57-67`). This is cross-layer permission algebra, not general agent/spec conformance. |
| **J3 recorded-trace confidentiality judgment** | Subject is a current structured request plus recorded history `List Event`; spec comprises layered policy `P`, policy-declared secret path prefixes `S`, and hard-coded egress predicate. | Trace fold over observed events, each carrying request and monitor decision. `egressGuard` denies iff prior trace taint is secret and current request is an enumerated egress, otherwise delegates to `decidePolicy` (`AgentPermissionKernelTaint.lean:54-63,79-113`). Whole-trace theorem quantifies over every prior event in history. | `allow/deny`, still no structured counter-witness; non-vacuity supplies concrete histories discriminating clean vs secret reads (`AgentPermissionKernelTaintTrace.lean:119-164`). | Secret labels are trusted path-prefix declarations; no laundering; egress catalogue complete (currently only `webFetch`); no covert/timing/implicit flows; trace faithfully recorded in order (`AgentPermissionKernelTaintTrace.lean:31-46`). | **Existing Lean theorems**: taint monotonicity, egress denied after secret, refinement of base kernel (`AgentPermissionKernelTaint.lean:115-155`); allowed egress implies clean prefix and no declared-secret read anywhere in recorded history (`AgentPermissionKernelTaintTrace.lean:53-128`). This proves monitor safety relative to labels/catalogue/trace, not actual-agent reasoning conformance or semantic noninterference. |
| **J4 generic runtime-conformance interface** `Certify_D(S,a,c)` / streaming `Monitor_D(S,astream)` | Intended subject is a domain-encoded action (dosage scalar, access tuple, or robot trajectory); spec is domain-owned parsed spec; domain plug-in owns the predicate. The “agent” is therefore operationally represented only by an action/stream, not agent internals (`DESIGN.md:30-40,62-73`). | Point action for dosage/access; continuous temporal stream for robot is proposed. Exact signature is unresolved: synchronous vs streaming is still DES-AV-1 (`DESIGN.md:85-95`). | Candidate envelope: `conform | not-conform(counter-witness) | indeterminate`; indeterminate triggers domain fallback. Counter-witness may be point input or optional failing trace/time-slice (`DESIGN.md:34-40,87-92`). | Correct root-spec parsing, faithful action encoding/observation, sound selected backend, domain adequacy of predicate, backend/monitor mediation, fallback execution, clock/sampling assumptions for robot. None are discharged. | **Scaffolded prose only.** DEFINE preregisters fixture criteria: positive, discriminating negative, fail-closed non-certifiable case, automated test (`DEFINE.md:49-58`). Generality is only a future architectural falsification test: robot must fit without core/interface change (`:60-72`; `DESIGN.md:49-60`). No core, plug-ins, dosage invariant, robot monitor, or soundness theorem is evidenced in the read set. |
| **J5 categorical semantic satisfaction** `⟦A⟧ ⊨ φ` | Intended subject is a categorical denotation of one agent; spec/property is `φ` on that same semantic object. | Behavioral/residue semantics, not specified in current artifacts. | Would require a certifying satisfaction judgment and soundness theorem; no counter-witness contract exists. | Adequate agent denotation, correct categorical model, bridge from observation to denotation, property adequacy. | **External analogy / intended bridge only.** Inventory says the categorical type/semantics exists but the satisfaction judgment and soundness theorem are unpublished/not built; first target is “one agent + one property + categorical denotation + sound judgment” (`kodamai…synthesis.md:32-55,105-107`). Inventory is non-authority. |
| **J6 constitution/model judgment** `s ⊨ C`, and derivation `axiom ⊨ rule` | Subject is a discrete governance state `s`; spec is whole constitution/rule set `C`; separately an axiom formula is proposed to entail a rule formula. | Cross-rule state space: existence of a common satisfying state; contradiction is absence thereof. Proposed transitive-closure checks over `governs`. | SAT/UNSAT plus model/counterexample is implied by Cedar/Datalog/Alloy proposal; not implemented. | Faithful logical encoding of constitutions/axioms/edges and exception rules. | **External classical-method analogy + hand-run witness, intended-not-shipped.** Inventory distinguishes per-rule permission checks as relabeling, cross-rule satisfiability as genuine open residue, and categorical behavior as FOL-blind (`fol…synthesis.md:28-55`). Axiom entailment is explicitly prose-only and collapses if axiom merely restates rule (`:57-70`). Inventory is non-authority. |

### Collapse tests

1. **Collapse to schema validity.** If `spec` and `action` are accepted merely because their envelopes parse or satisfy `agent-conformance.plugin.schema.yml`, the relation is only `ShapeValid(spec) ∧ ShapeValid(action)`. The design assigns schemas to the contract but domain semantics to the plug-in (`DESIGN.md:34-40,75-81`). Current research explicitly separates `ShapeValid` from later judgments and says shape-valid artifacts can encode the wrong obligation (`findings.md:68-84,97-99`). Required discriminator: two schema-valid actions with opposite semantic verdicts and exact failing evidence.

2. **Collapse to `decidePolicy`.** For a memoryless domain encoded as `Req` and `LayeredPolicy`, if `certify(S,a)` is definitionally `decidePolicy P r` and adds no independently stated domain adequacy/compilation theorem, then `agent ⊨ spec` is only J1 with renamed arguments. This is valid as a bounded permission component, not a general agent judgment. Inventory names this exact categorical collapse test (`kodamai…synthesis.md:53-55`) and warns the defensible scope is “action satisfies encoded invariant,” not “agent correct” (`:80-93`). Data-access plus dosage do not escape the collapse because both are point permission decisions (`DEFINE.md:60-65,74-87`).

3. **Collapse to test-pass.** If “proof” means the preregistered positive/negative fixtures pass, the quantified judgment has been replaced by `∀ f ∈ finiteFixtures, expected(f)=actual(f)`. Fixtures establish discrimination and mechanism behavior only. The repository’s proof vocabulary requires a quantified claim discharged under explicit assumptions; a receipt/test is a witness (`findings.md:41-53,109-116`). Required escape: a theorem connecting backend output to a precisely quantified domain predicate, plus fidelity/adequacy premises; tests then witness integration, not soundness.

4. **Collapse to a restated rule.** If the alleged formal spec/predicate simply embeds the same rule text/check (`φ := rule`) and the theorem is `φ → φ`, there is no derivation. This is the explicit `axiom ⊨ rule` collapse test (`fol…synthesis.md:61-65`). Analogously, defining `Conforms S a := certify S a = conform` makes `certify… → Conforms…` tautological unless `Conforms` is independently specified and the implementation-equivalence theorem is nontrivial. The permission kernel avoids the most direct form by defining `Satisfies` independently from `decidePolicy` and proving iff (`AgentPermissionKernel.lean:115-138`), but remains relative to arbitrary matchers.

### Exact claim boundary
The strongest current statement supported by these sources is: **for all encoded requests and layered policies, the executable permission monitor agrees with its independently defined permission predicate; bounded trace guards provably only narrow that monitor and enforce declared-label properties over faithfully recorded traces.** Nothing read supports: arbitrary `agent ⊨ DomainSpec`, conformance of hidden reasoning, adequacy of domain encoding, implementation equivalence, real robot/clinical runtime assurance, or semantic correctness. DEFINE itself forbids those promoted claims (`DEFINE.md:102-109`), and current DomainSpec research records runtime satisfaction as open (`findings.md:90-99`).

## Agent 2 — Shannon, Claude — Live Executable Evidence Audit

## Live executable evidence audit

Strongest judgment: the current working tree reproducibly satisfies only a bounded L0A contract-publication property plus older narrow kernel/adapter behaviors. It does **not** establish “agent satisfies spec,” arbitrary semantic correctness, implementation/spec equivalence, or a completed BTE graph-to-proof/replay chain.

The source README explicitly says generated software satisfying the specification is not established:

`projects/domainspec-v2/impl/test-derivation-engine/src/README.md:119-132`

## Capability matrix

| State | Current evidence | Exact limits |
|---|---|---|
| Built and rerunnable | L0A publication implementation at `projects/domainspec-v2/impl/test-derivation-engine/src/bte/contract-publication.ts`; nine Draft 2020-12-subset schemas under `src/bte/contracts/`; nine positive instances; closed 25-code ordered registry at `src/bte/validation/diagnostics.ts`; focused five-test suite; root command `projects/domainspec-v2/impl/package.json#verify:bte:contract-publication`; run artifacts under `.../runs/20260723T020759Z/l0a/`. | Publishes and independently recomputes exact contract bytes, handles, supported keywords, diagnostics closure, and an allowlisted output set. The receipt says `admission: not-granted`; it emits no `ValidationReceipt`. |
| Built, narrow prerequisite evidence | Preserved SWU-BTE-001 shared criterion kernel and SWU-BTE-003 minted-node body adapter. | They prove their declared eight-rule-form and body-normalization behavior only. They do not close current-v1 compatibility, exact-16 parity, BTE completion, semantics, or agent correctness. |
| Executable but bounded legacy lane | `src/bindings/index.ts`, `src/emit/tests.ts`, `src/formal/eval.ts`, `src/roundtrip/*`, and the CLI roundtrip surface. | Compatibility-only, not the planned BTE proof lane. The binding resolver is first-match and nullable, contrary to planned exact-one/fail-before-execution BTE requirements. The emitter can produce `todo`/`skip` coverage gaps. |
| Scaffolded | Contract shapes for red-fixture manifests, freeze receipts, diagnostics, exact sets, and validation receipts; positive schema fixtures. | Positive instances show schema acceptance only. No validation-owner red freeze or semantic execution exists. |
| Planned | L0B semantic validation; L1 formation-v2; L2 successor sources; L3 compiler graph/replay; L4 six catalogues; L5 obligation-to-test/binding/execution/mutation/receipt/replay; L6 core; L7 consumers; L8 aggregates. | Task and wave documents exist, but the implementations and executable evidence do not. |
| Absent | Exact-one role-typed BTE bindings; isolated BTE evaluator registry; BTE execution and mutation results; proof receipts; independent raw-artifact replay; core, consumer, and terminal aggregates. | No current basis for a full BTE, semantic, implementation-correctness, or agent-satisfaction claim. |
| Stale | Work-pack and L0 task planning metadata still labels L0A unselected/planned. | Contradicted by the live selected, passing L0A owner receipt and implementation. Inventory is also stale and non-authoritative. |

## Exact receipts and hashes

Preserved prerequisite receipts:

- `SWU-BTE-001`:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/session-evidence/SWU-BTE-001/20260720T192338Z-shared-criterion-kernel/execution-receipt.json`
  - Live SHA-256: `c74804c056c681e9596fce170c50ac664bdc002492b3fbc6340a13a47f42b1e1`
  - Exactly matches `PLAN.md:65` and the refresh apply receipts.

- `SWU-BTE-003`:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/session-evidence/SWU-BTE-003/20260720T205600Z-minted-node-body-adapter/execution-receipt.json`
  - Live SHA-256: `2465113b7e18d1e58670df52636a18499b22420f3c36cd460e5179a8f1c4a2c4`
  - Exactly matches `PLAN.md:66` and the refresh apply receipts.

Current L0A evidence:

- Execution receipt:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/session-evidence/SWU-BTE-L0A-001/20260723T020759Z-contract-publication/execution-receipt.json`
  - `swu_id: SWU-BTE-L0A-001`
  - `result: pass`
  - `selection.this_swu_selected: true`
  - `implementation_changed: true`
  - `admission_granted: false`
  - `production_authorized: false`

- Publication receipt:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/contract-publication-receipt.json`
  - Live SHA-256: `20ed6886b199917ef739f36c388c0c0f236fa4c57c33c44a8deae8b47f3f193c`
  - Matches the execution receipt.
  - `receipt_kind: contract-publication`
  - `admission: not-granted`

- Publisher:
  `projects/domainspec-v2/impl/test-derivation-engine/src/bte/contract-publication.ts`
  - Live SHA-256: `5c54257424845112d1bfda50f898aa8449748de43d086d4b5329bb3cf31e68c2`
  - Matches the publication and execution receipts.

- Output manifest:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/output-write-manifest.json`
  - Allows exactly `contract-publication-receipt.json` and `output-write-manifest.json`.

## Rerun results

Executed against the live working tree:

```text
npm --prefix projects/domainspec-v2/impl exec -- \
  vitest run test-derivation-engine/src/bte/contract-publication.test.ts
```

Result: one test file passed, 5/5 tests passed.

```text
npm --prefix projects/domainspec-v2/impl run engine:test
```

Result: 11 test files passed, 112/112 tests passed.

```text
npm --prefix projects/domainspec-v2/impl run typecheck
```

Result: pass, with no diagnostic output.

The current typecheck result is stronger than the L0A receipt’s then-observed workspace-`tsc` residue; the live tree is green now.

I did not rerun:

```text
npm --prefix projects/domainspec-v2/impl run verify:bte:contract-publication
```

Although it has stable-write protection, it is still a writing command, and this audit was explicitly read-only.

## Stale metadata

These planning surfaces still incorrectly describe L0A as unselected or merely planned:

- `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md`
  - `status: validated-l0a-candidate-unselected`
  - `selectedSWU: none`
  - L0A listed as candidate-ready
  - `verify:bte:contract-publication` listed as planned

- `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md`
  - L0A status remains `candidate-unselected-dependency-ready`.

The live L0A execution receipt is the stronger current evidence: it records explicit selection and successful completion.

## Missing later BTE surfaces

No implementation was found for:

- `verify:bte:contracts`
- `verify:bte:formation-v2`
- `verify:bte:build`
- `verify:bte:catalogue <catalogue-id>`
- `verify:bte:core`
- `verify:bte:consumers`
- `verify:bte`

No files were found for the expected L0B implementation or inputs:

- `validation-inputs/l0/red-fixture-manifest.v1.json`
- `validation-inputs/l0/red-fixture-freeze-receipt.json`
- `src/bte/validation/validate-shape.ts`
- `src/bte/validation/validate-semantics.ts`
- L0B raw results or `validation-receipt.json`

The later planned task sources are under:

`projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/tasks/TASK-BTE-L*.md`

## Binding, evaluator, and replay limitation

The existing binding surface is not acceptable as evidence that planned BTE binding requirements are met:

`projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts`

Its `bindingFor` function returns the first matching binding or `null`. The active BTE requirements instead call for exactly one compatible, role-typed binding and require empty, duplicate, wildcard, first-match, and stale bindings to fail before execution.

Likewise:

- `src/formal/eval.ts` is a bounded formal-expression evaluator, not the planned independent BTE evaluator registry.
- `src/roundtrip/*` compares existing derived/committed semantic identifiers, not the planned independent raw-artifact BTE replayer.
- `src/emit/tests.ts` can emit honest skipped coverage gaps and legacy TODOs; green engine tests therefore do not imply all obligations are runnable or satisfied.

These surfaces remain useful executable substrate, but they cannot be counted as fulfillment of BTE’s binding, evaluator-isolation, execution, mutation, proof-receipt, replay, or aggregation requirements.

## Composability guide source leads

Primary guide:

`projects/domainspec-v2/impl/governance/tags/CODE-TAG-COMPOSABILITY-PATTERNS.md`

It is explicitly an implementation projection. Relationship authority remains:

`projects/domainspec-v2/definitions/relationships/relationships.yml`

Executable checker:

`projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts`

Reference templates:

`projects/domainspec-v2/impl/governance/tags/examples/composability/README.md`

and the TypeScript snippets in that directory.

The guide currently reports 31 active relationship signatures and nine derived call-semantic rules. Several relationships—`produces`, `transitions`, `contracts`, and `consumes`—are still marked “Not yet” enforced. `tags:composability` remains outside aggregate `npm run validate` because the default extracted `governance/tags/code-tags.json` input is not committed.

This is a useful source for an implementation-composability guide. It is not evidence that an agent or implementation satisfies an arbitrary specification.

## Exact claim boundary

Currently reproducible:

> The live DomainSpec-v2 tree can deterministically publish and independently recompute an exact, non-admitting set of nine BTE contract schemas and a closed ordered diagnostic registry; its focused publication tests, wider 112-test engine regression, and current TypeScript typecheck pass. Preserved receipts also support narrow shared-criterion-kernel and minted-body-adapter behaviors.

Not currently reproducible:

- An agent satisfies a DomainSpec.
- Generated software truly satisfies a specification.
- Arbitrary business or semantic correctness.
- Semantic refinement or code/spec equivalence.
- Complete exact-one BTE binding and isolated evaluation.
- Complete execution, mutation, proof receipt, or independent replay.
- Six-catalogue exact recomposition.
- Core, consumer, or terminal BTE satisfaction.
- Admission, release, production authorization, or lifecycle promotion.

Finally, the audited scope is heavily dirty and untracked, including the entire new `src/bte/` surface, run receipts, and refreshed work-pack artifacts. These results characterize the **current working tree**, not a committed or released baseline. Structural graph preservation, positive fixtures, receipt status, and green tests must not be converted into semantic or agent-correctness claims.

## Agent 3 — Peirce, Charles Sanders — Operational Grounding

## Operational grounding verdict

At the current checkout, `agent ⊨ spec` is not an owned or implemented relation. The defensible decomposition is:

```text
Bind(agent/run identity, spec snapshot, environment snapshot)
  -> execute bounded action or trace
  -> observe typed runtime facts
  -> compare facts with owner-authored expectations
  -> emit evidence-bearing verdict
  -> return drift/residue to the owning route
```

The repository has partial owners for every box except the first binding as a unified contract and the semantic comparator for general agent behavior. The existing material supports narrower conformance claims, not whole-agent satisfaction.

## Authority-aware grounding map

| Grounding concern | Current representation | Owner / authority | Defensible use | Missing |
|---|---|---|---|---|
| Agent | Arcanum native action has `action_id` ↔ returned `agent_id`; adapters identify `adapter_id`, runtime kind, execution surface. DomainSpec stage execution records identify stage/run continuity. | Parent runtime / Orchestrate for native execution; adapter for translation/raw outcome; DomainSpec task/session owner for bounded work. | Identify one actor attempt or bounded delegated run. | No canonical `AgentIdentity` binding model/provider/model version/system prompt/tools/config/memory/state/expiry. `agent_id` is runtime identity, not a behavioral denominator. |
| Action | Persisted Orchestrate action document with role, capability, target, mode, scope, inputs/outputs; DomainSpec task has goal, prerequisite, directives, completion criteria. | Dispatch Spec validates shape; Orchestrate schedules; task/work-pack owner defines task. | Per-action eligibility and execution receipt. | No repository-owned semantic rule that says an agent’s chosen action follows from observed conditions. |
| Finite trace | Orchestrate event stream (`action_attempted`, spawn return/failure, wait, terminal, close); DomainSpec ordered stages, handoff refs, telemetry envelopes; proposed reasoning `RuntimeJournal`. | Runtime/parent owns lifecycle facts; DomainSpec feature owner owns stage expectations. | Check a bounded trace against declared ordering, handoff, terminal, retry, and evidence obligations. | No single trace schema binds every action to a frozen spec/environment and no general trace-satisfaction reducer. Reasoning-engine journal remains candidate design. |
| Spec | CAV2 promoted `Spec`; DomainSpec SPEC/stories/test-spec/work-pack task graph; Arcanum capability contract and handoff obligation matrix; proposed `AuthoritySnapshot + ProblemFrame + RuleCatalogManifest`. | Spec owner + decision gate; narrower feature/task/capability owners author expectations. | Freeze exact obligations/done criteria for a bounded claim. | Candidate reasoning objects are not promoted specs. No owner yet supplies executable applicability, precedence, exceptions, contradiction, or stale-rule semantics. |
| Environmental observation | Tool/model outputs, files, tests, telemetry, terminal state, runtime receipts; candidate reasoning `ObservationSet`; IOLM imports exact source/graph/profile/digest handles. | Source/runtime/validation/observability owners. | Typed facts when provenance, issuer, validator, freshness, and digest are bound. | No general environment model or observation function. Ambient repository/tool/world state is not frozen uniformly; admissible issuers/validators remain unspecified for the reasoning evaluator. |
| Expectation comparator | Domain-specific validators/tests; Context Builder obligation coverage; CAV2 Gate; proposed finite semantic evaluator. | Expectation author is the narrow spec/rule owner; gate owner decides movement; validator only checks its contract. | Structural, output, action, or trace conformance when an executable predicate exists. | No general `Satisfies(agent, spec, env)` owner/implementation. Gate is transition logic, not truth; receipts and consensus do not supply inference. |
| Evidence return | Arcanum receipts/status/artifact paths/validation/telemetry; DomainSpec evidence refs/envelopes and gap signals; CAV2 gate record with verdict/residue/downstream effect. | Runtime emits; validator grades; gate/authority owner consumes and routes. | Saturn-style feedback: observation → comparison → drift/residue → correction owner. | No universal evidence envelope joining agent/spec/environment/comparator versions and claim class. Central comparison remains capability-specific. |

## Candidate interfaces supported by current sources

These are candidate interfaces, not promoted definitions:

```text
ExecutionBinding {
  run_id, action_id, agent_id?,
  execution_surface, adapter_id?,
  spec_ref + digest,
  authority_snapshot_ref + digest,
  environment_snapshot_ref + digest,
  write_scope, tool_scope, freshness_id
}
```

Source basis: Orchestrate’s persisted action and returned `action_id/agent_id` binding; Context Builder’s task/SWU identity, source refs, provenance, hash/SHA, constraints and scopes; IOLM’s exact-handle and digest joining. The unified object and environment snapshot owner are absent.

```text
Observation {
  observation_id, run_id, action_id,
  kind, value_or_artifact_ref, issuer,
  validator, captured_at, source_digest,
  environment_snapshot_ref
}
```

Source basis: reasoning-contract `ObservationSet`, DomainSpec telemetry/evidence envelopes, Arcanum runtime results. General issuer/validator admissibility is not implemented.

```text
ExpectationSet {
  spec_ref + digest,
  claim_class,
  obligation_ids,
  executable_predicate_refs + digests,
  owner_route,
  applicability_decision_ref,
  unknown/timeout/contradiction policy
}
```

Source basis: DomainSpec coverage IDs/completion criteria/test obligations; Context Builder obligation matrix; reasoning-contract catalog requirements. Applicability and stale-rule ownership are explicit blockers in the research findings.

```text
ConformanceReceipt {
  binding_ref,
  expectation_set_ref,
  observation_refs,
  comparator_id + version + digest,
  verdict: pass | flag | block | defer,
  failed_obligations,
  residue,
  evidence_refs,
  owner_route,
  downstream_effect
}
```

Source basis: CAV2-D37 Gate, D38 claim-proof bound, DomainSpec validation evidence, Arcanum receipts. It must not imply truth, approval, authority promotion, or effect permission.

## Claim classes must remain separate

1. **Output conformance**<br>
   `artifact/output ⊨ schema or expected bytes`. Compare emitted artifact, digest, tests, or semantic projection with exact output obligations. This is the strongest currently grounded class.

2. **Per-action conformance**<br>
   `action_event ⊨ action_contract`. Check scope, allowed tool/target, required inputs, preconditions, result, and receipt. This says the bounded action conformed, not that selecting it was rational.

3. **Finite-trace conformance**<br>
   `trace[0..n] ⊨ workflow/task-graph contract`. Check ordering, dependencies, handoffs, retries, terminal state, evidence continuity, and closeout. Replay can prove the recorded lifecycle reduction, not premise truth or conclusion quality.

4. **Policy conformance**<br>
   `policy ⊨ obligations over a declared environment/test distribution`. Requires multiple counterfactual fixtures, mutation/defeater cases, temporal rules, and environment coverage. One passing trace cannot establish it. The reasoning-contract witness family is a candidate minimum, currently unwitnessed.

5. **Whole-agent satisfaction**<br>
   `agent ⊨ spec` would require a frozen agent denominator, admissible environment family, observation semantics, temporal horizon, quantification rule, and owner-defined acceptance threshold. None is currently owned or implemented. This claim should be blocked, not inferred from outputs, receipts, consensus, effort, or finite traces.

## IOLM boundary

IOLM is a projection witness and independent consumer only:

- Its workable example is a generated read model over a pinned fixture with `authority_effect: none`.
- It proves exact import identity, provenance/digest binding, deterministic rebuild, view parity, and resistance to navigation/learner-state semantic mutation.
- Its consumer contract forbids self-authored upstream evidence and fixture/schema substitution for run evidence.
- Its forbidden claims explicitly include `semantic-satisfiability`, predicate authority, profile admission, production readiness, and upstream promotion.

Therefore:

```text
IOLM receipt ⇒ projection fidelity under bound inputs
IOLM receipt ⇏ output/spec satisfaction
IOLM receipt ⇏ policy satisfaction
IOLM receipt ⇏ agent ⊨ spec
```

## Minimum binding and observation gaps

1. Assign an owner for the executable applicability/precedence/exception/staleness relation over specs and obligations.
2. Define the frozen agent identity denominator; otherwise “same agent” is not reproducible.
3. Define environment snapshot identity and which ambient state is included or typed as residue.
4. Bind every observation to an admissible issuer, validator, timestamp/freshness identity, and environment snapshot.
5. Define claim-class-specific comparators; do not reuse one Boolean `satisfies`.
6. Persist one join object linking agent/run, spec digest, environment digest, observations, comparator digest, and verdict.
7. Separate semantic recommendation from exact effect authorization through two full CAV2-D37 gate records.
8. Define invalidation/revalidation behavior when agent config, spec, catalog, evidence, or environment changes.
9. For policy claims, declare quantified environment/fixture coverage and mutation/defeater suites.
10. Leave whole-agent satisfaction blocked until a spec owner admits the quantification and an implementation supplies counterexample-sensitive evidence.

Primary sources: `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` CAV2-D37/D38/D39/D40; `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md`; `implementation/domainspec/templates/work-pack.md`; the AEO work-pack/task graph; `arcanum/transmutations/context-builder/README.md`; Orchestrate and runtime-adapter contracts; the 2026-07-22 reasoning-engine research/findings; and the IOLM workable-example and consumer machine contracts.
