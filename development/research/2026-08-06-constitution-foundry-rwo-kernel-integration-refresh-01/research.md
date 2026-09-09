# Research transcript

## Agent 1 — Spivak, David (`explorer-formal`)

## Explorer report — formal contract mapping

**Agent:** Spivak, David  
**Role:** `explorer-formal`  
**Action:** `spawn-0001`  
**Disposition:** `pass`, with integration remaining proposal-only and owner-blocked.

### Architecture verdict

Constitution Foundry can be represented as a typed domain composition over the proposed RWO uniform Work protocol, but it cannot be reduced to RWO types.

The safe substitution is structural:

- every bounded Foundry operation may expose the same outer `WorkDefinition → WorkRun → Attempt → structural Event` contract;
- Author, Prove, Decide, and Cast may each be leaf Work or bounded composites;
- the whole `ConstitutionCase` journey may be one `CompositeWorkDefinition`;
- composition parentage provides correlation and routing only;
- no child or composite inherits authority from its parent;
- Foundry artifacts remain Foundry artifacts, backend reports remain backend-owned semantic evidence, authority decisions remain external-owner acts, and Mint remains the effect/recovery owner.

This is consistent with the parent-observed RWO proposal: uniform leaf/composite contracts and immutable definitions/runs/attempts (`strategy-inventory-packet.json#/live_orchestrator_snapshot/sources[id=RWO-DESIGN]`, lines 87–140), while the kernel explicitly does not decide correctness, approval, domain state, authority, retries, or artifact meaning (same selector, lines 34–85). Foundry separately declares its case envelope non-authoritative and its reducer derived from receipts (`CF-RESULT:13–19,73–79`; `CF-DESIGN:126–134`).

## Typed mapping table

| Foundry type/capability | RWO correspondence | Classification | Contract and ceiling |
|---|---|---|---|
| `ConstitutionCase` | root `WorkRun` correlation plus domain-owned artifact references | **adapter-mediated** | A case is not a `WorkRun`: it references native source, IR, obligations, reports, decisions, Mint artifacts, observations, and attestations, and derives five-axis posture. The adapter may bind `case_id ↔ root_run_id`, but case truth stays in the Foundry reducer. `CF-DESIGN:56–63,126–134,177–183`; `CF-RESULT:19,73–79`; RWO-DESIGN packet lines 287–302. |
| Author → Prove → Decide → Cast | root `CompositeWorkDefinition` using n-ary sequence | **exact structural correspondence** | The ordered structural relation is exact; the meaning of each stage is not. Candidate composition form supports immutable authored syntax and closed operands; adoption/compiler/conformance are absent. `CF-RESULT:13–43`; RWO-COMPOSITION-FORM-RESULT packet lines 3–18,42–45. |
| `Author` | leaf or composite Work | **adapter-mediated** | Commands can create source manifest, IR, obligation set. Outputs remain domain artifacts, not kernel definitions or events. Native source cannot be replaced by IR. `CF-DESIGN:138–145,415–433`; `CF-RESULT:45–60`. |
| `Prove` | composite Work: projection validation → parallel backend leaf Works → aggregation gate Work | **adapter-mediated** | Structural fan-out/join is reusable; backend success algebra and obligation completeness are Foundry/backend-owned. A quorum or all-arrived join never proves semantic completeness. `CF-DESIGN:147–163`; `CF-RESULT:27–30,49–60`; RWO-DESIGN packet lines 222–285; RWO open residue `RWO-OQ-005`, accepted findings lines 205–234. |
| Cedar/Lean/Datalog/bounded-solver invocation | leaf `WorkDefinition` through executor adapter | **adapter-mediated** | Each leaf binds one projection, pinned profile, version, assumptions, bounds, and trusted base, returning one typed backend report reference. No report can discharge another backend fragment. `CF-DESIGN:149–163`; `CF-RESULT:49–60`. |
| Backend obligation/report | Work input/output artifact reference; structural output event | **deliberate non-correspondence** | Obligation is not a WorkDefinition; report is not an Event or terminal status. Kernel sees a validated artifact reference and structural completion only. Domain adapter validates report status/subject. `CF-DESIGN:151–154,177–183`; RWO-DESIGN packet lines 222–285. |
| `AdmissionAssessment` / `MovementReadinessReport` | ordinary gate Work result | **adapter-mediated** | It may structurally block movement but cannot ratify. A released gate means only that its typed output was accepted. `CF-DESIGN:167–170,377–394`; `CF-RESULT:64–71`. |
| `RouteRecommendation` / `OwnerRouteRecommendation` | gate Work output used by a structural route | **adapter-mediated** | Router may match a typed recommendation; recommendation is never authority. `CF-DESIGN:169–170`; accepted parent findings lines 111–123, especially gate precedent. |
| `ConstitutionRatificationDecision` | external owner artifact consumed by gate/import Work | **deliberate non-correspondence** | Not a kernel decision, event, release, or parent authority. Import Work validates owner, subject, digest, posture, and freshness. `CF-DESIGN:171–172`; `CF-RESULT:64–71`. |
| `CastingAuthorization` | external owner artifact consumed by gate/import Work | **deliberate non-correspondence** | Separate subject and identity from ratification, even if one owner performs both acts. It binds candidate, validation, plan, target pre-state, conditions, expiry. `CF-DESIGN:172–174`; `CF-RESULT:68–71`. |
| Mint no-write plan | output artifact of Mint-owned planning leaf Work | **adapter-mediated** | RWO may schedule/address planning; Mint owns plan semantics. Plan is not permission or effect. `CF-DESIGN:175–176`; `CF-RESULT:34–35,77`. |
| Preinstall verification | gate Work | **adapter-mediated** | Pass can release only the addressed Mint apply command, after exact tuple validation; it does not install. `CF-DESIGN:177–180`; `CF-RESULT:36–39,79`. |
| Mint transaction | command to Mint executor adapter plus returned transaction receipt reference | **adapter-mediated** | Kernel transports one addressed command and persists structural events; Mint exclusively locks, rechecks, writes, journals effects, and classifies installed/recovered/manual recovery. `CF-DESIGN:175–183`; `CF-RESULT:75–79,97–106`; RWO-DESIGN packet lines 368–399. |
| Mint recovery | Mint-owned work/effect policy, surfaced structurally | **deliberate non-correspondence** | RWO redelivery/stale-attempt/cancellation mechanics cannot classify domain recovery. `recovered` and `manual_recovery_required` originate in Mint receipt validation. |
| Postinstall observation | observer-owned leaf Work output | **adapter-mediated** | A structural completion does not make the observation true; failed observation cannot rewrite installed transaction outcome. `CF-RESULT:73–79`; `CF-DESIGN:181–183`. |
| Attestation receipts | artifact references in Work input/output contracts | **deliberate non-correspondence** | Receipts are evidence with declared ceilings, never Work status, authority, identity proof, or promotion. `CF-RESULT:79`; `CF-DESIGN:177–183`. |
| Foundry case reducer | domain adapter/state owner | **deliberate non-correspondence** | It derives candidate/validation/authority/casting/observation posture from validated artifacts. RWO cursor/status projection must not duplicate it. RWO-DESIGN packet lines 287–302; `CF-RESULT:19,75`; `CF-DESIGN:126–134`. |
| RWO status projection | derived structural view | **exact structural correspondence only** | May display requested/accepted/running/released/terminal structural state. It cannot display ratified/authorized/installed/observed unless explicitly presenting a separately validated Foundry projection with provenance. |
| Work/attempt receipts | orchestration history facts | **exact structural correspondence** | They prove acceptance/delivery/attempt facts only, not backend validity, authority, transaction truth, or observation truth. RWO-DESIGN packet lines 222–302. |

## Recursive Work graph

```text
FoundryCaseWork(case_ref)                    [CompositeWorkDefinition]
└─ sequence
   ├─ AuthorWork                             [leaf or composite]
   │  └─ outputs source_manifest_ref, ir_ref, obligation_set_ref
   ├─ ProveWork                              [composite]
   │  ├─ ProjectionValidationWork*
   │  ├─ parallel BackendWork(obligation, profile)*
   │  └─ ObligationCompletenessGateWork
   ├─ DecideWork                             [composite]
   │  ├─ MovementReadinessGateWork
   │  ├─ OwnerRouteWork
   │  ├─ RatificationImportGateWork          [external decision required]
   │  ├─ MintPlanWork                        [Mint-owned leaf]
   │  └─ CastingAuthorizationImportGateWork  [separate external decision]
   └─ CastWork                               [composite]
      ├─ PreinstallAttestationGateWork
      ├─ MintApplyWork                       [sole target-effect leaf]
      ├─ PostinstallObservationWork
      ├─ PostinstallAttestationWork
      └─ ColdInterpretationWork
```

## Agent 3 — Beer, Stafford (`explorer-authority`)

## Authority and control-boundary report

### Bottom line

The safe integration is a typed Foundry composition over a thin structural Work kernel. The kernel may arrange bounded work, address commands, accept structural events, retain accepted history, and derive a non-authoritative cursor/projection. It may not decide what a constitution means, whether backend evidence is sufficient, whether a constitution is ratified, whether casting is authorized, whether Mint installed correctly, whether observation succeeded, or whether an installed domain is true or promoted.

The Foundry control loop remains:

`author intent → candidate/source artifacts → backend evidence → movement/route assessment → owner ratification → Mint no-write plan → separate casting authorization → Mint transaction/recovery → target observation/attestation → cold interpretation`

Each arrow can be represented structurally by Work, but every semantic, authority, effect, and observation fact remains an artifact issued or interpreted by its named external owner.

Evidence ceiling:

- Foundry architecture/design: observed current, approved-refresh-bound design and plan artifacts.
- Foundry implementation/runtime/backend/Mint execution: absent/unverified.
- RWO kernel and composition model: parent-observed proposal-only.
- Existing orchestrator control-plane/evidence runtime: parent-accepted observed implementation; protocol compilation was the only freshly executed slice in the earlier research.
- Foundry-to-RWO adapter, compiler, reducer integration, and conformance suite: planned/proposal-only.
- Authority, installation, promotion, deployment, release, production, and domain truth: absent.

Current package status is established only by `CF-REFRESH-REPORT#/applied_count,/validation,/remaining_lifecycle_gates,/claim_ceiling` and `CF-REFRESH-MATERIAL-RECEIPT#/packageDigest,/validatedPaths,/validationCommands`: 27 exact package artifacts refreshed and validated. The historical package review supplies defect provenance, not the current defect verdict.

## Control-loop owner matrix

| Edge | Decision owner | State owner | Evidence owner | Adapter/port | Required authority reference | Safe kernel-visible structural event |
|---|---|---|---|---|---|---|
| Author intent → native manifest/candidate IR/obligations | Constitution author/reviewer; requiredness remains owner-resolved | Foundry case projection references artifacts; native source owner retains source truth | Author/source-manifest and translation authors | Author Work adapter | Authorship/provenance refs; no authority effect | `work_started`, `artifact_reference_emitted`, `work_released` |
| Candidate → backend projections/reports | Projection/profile/backend owners decide supported fragment and report status | Backend report/projection owners; case only derives validation posture | Each backend adapter plus projection validator | Backend leaf Work adapter | Pinned source, translation, profile, tool/version, trusted-base digests | `command_delivered`, `attempt_started`, `artifact_reference_emitted`, `attempt_terminal` |
| Reports → completeness/movement assessment | Obligation aggregator and admission-rule contract owner | Foundry validation/movement projection | Aggregator and `MovementReadinessReport` issuer | Gate Work / Foundry adapter | Exact obligation/report/source digests | `gate_evidence_emitted`, `work_blocked` or structural `work_released` |
| Assessment → owner route recommendation | Route/interface owner advises; does not decide authority | Recommendation artifact owner; no authority posture | `OwnerRouteRecommendation` issuer | Gate Work / route-advice adapter | Authority-model/version reference; unresolved owner ambiguity must remain explicit | `route_advice_emitted`, `work_blocked` or `work_released` |
| Route → constitution ratification | Existing constitution authority owner only | Authority owner’s decision domain; case imports reference | `ConstitutionRatificationDecision` issuer | AuthorityDecisionImporter | Exact candidate, validation, residue, kind, scope, conditions | `external_decision_reference_accepted` or `reference_rejected` |
| Ratified candidate → Mint no-write plan | Mint plan owner | Mint plan domain; target owner retains pre-state truth | Mint/scaffolder/path-safety evidence owners | MintPlanAdapter / ExecutorAdapter planning operation | Ratification ref, candidate/package digest, exact target snapshot | `effect_plan_reference_emitted` |
| Plan → casting authorization | Exact authority-subject owner; distinct act even if same human/organization | Authority owner’s authorization domain | `CastingAuthorization` issuer | CastingAuthorizationImporter | Ratification, candidate, validation, plan digest, target identity/pre-state, conditions, expiry | `external_authorization_reference_accepted` or `reference_rejected` |
| Authorization → preinstall attestation | Attestation/integrity owner | Attestation domain; no target mutation | Preinstall attestation issuer | PreinstallAttestationAdapter | Exact package/plan/authorization/staging tuple | `precondition_evidence_emitted` |
| Authorized plan → transaction | Mint effect/transaction owner only | Mint transaction journal and actual target | Mint plus target/path-safety owners | ExecutorAdapter → MintApplyAdapter | Fresh casting authorization and locked target-pre-state reference | `effect_attempt_requested`, `effect_attempt_started`, `effect_result_reference_emitted` |
| Transaction failure → recovery | Mint owns effect recovery classification; Work policy owner separately owns orchestration recovery classification | Mint attempt journal for effects; kernel cursor only for delivery/attempt routing | Mint transaction/recovery receipt issuer | ExecutorAdapter/Mint adapter; kernel recovery adapter only for redelivery/stale-attempt routing | Exact attempt/effect journal and authority ref | `attempt_stale`, `delivery_redelivered`, or `effect_result_reference_emitted`; never infer installed |
| Transaction → observation | Target/observer owner decides observed facts; observation does not rewrite transaction | Actual target and observation artifact | Postinstall observer | PostinstallObserver | Transaction receipt and target identity | `observation_reference_emitted` |
| Observation → postinstall attestation | Attestation owner | Attestation domain | Postinstall attestation issuer | PostinstallAttestationAdapter | Observed-result subject plus governance act | `attestation_reference_emitted` |
| Installed object → cold interpretation | Constitution/runtime validator and installed-domain owner | Installed object with pinned meta schema/interpreter | Cold-test validator | Self-standing interpretation adapter | Package manifest and pinned meta-schema/interpreter versions | `interpretation_evidence_emitted`; never `domain_true` |

Load-bearing private evidence: `CF-RESULT lines 13-43, 62-79`; `CF-DESIGN lines 52-63, 84-92, 126-134, 165-183, 187-204, 353-355, 377-394, 400-409`; `CF-WORK-PACK lines 37-47, 60-70, 152-175`. Public packet evidence: `RWO-DESIGN lines 34-140, 222-302, 368-399`; accepted parent findings lines 24-30, 56-105, 145-182, 184-203.

## Meta-Authority split

“Meta-Authority” is not an admitted authority kind.

Ordinary gate Work may:

- Validate structural prerequisites and artifact bindings.
- Reject missing, stale, self-issued, mismatched, expired, or wrong-subject evidence.
- Aggregate obligation completeness without changing backend semantics.
- Produce `MovementReadinessReport`.
- Produce non-authoritative `OwnerRouteRecommendation`.
- Block structural progression or release the next command for consideration.

External-owner decisions must:

- Decide constitution ratification/rejection/return.
- Decide casting authorization for the exact Mint plan and target-pre-state tuple.
- Admit/change authority kinds, subjects, owner mappings, or promotion status.
- Decide whether observed installation becomes any governance or domain-status fact.

A gate pass means only “the declared prerequisites for the next structural step passed.” It never means ratified, authorized, installed, observed, promoted, or true.

Evidence: `CF-RESULT lines 17, 62-71`; `CF-DESIGN lines 165-173, 400-409, 415-420`; `RWO-DESIGN packet selectors lines 34-85 and 222-285`.

## Recovery ownership

Two recovery domains must remain distinct:

1. Kernel/work-owned structural recovery:

   - Delivery redelivery and deduplication.
   - Stale attempt handling.
   - Cancellation routing.
   - Bounded repeat/retry/rework decisions where the Work definition names the policy, bound, decision Work, and exhaustion route.
   - Sidecar failure and cursor reconstruction.

2. Mint-owned transactional recovery:

   - Locked target pre-state recheck.
   - Finite effect journal.
   - Partial-apply classification.
   - Compensation/recovery of target effects.
   - Terminal result of `installed`, `recovered`, or `manual-recovery-required`.

The kernel may transport Mint’s terminal receipt reference and structurally route subsequent Work. It must not derive Mint’s recovery classification. Foundry may reduce the validated receipt into the casting axis, but it must not own the effect journal or rewrite the outcome. Failed observation after successful apply remains `casting=installed`, `observation=observation_failed`.

Evidence: `CF-RESULT lines 73-79, 95-106`; `CF-DESIGN lines 179-183, 405-408, 431-433`; `RWO-DESIGN lines 368-399`; `CF-WORK-PACK lines 154-164`.

## Mint-only effects across ExecutorAdapter

The only safe effect crossing is a typed request/receipt seam:

1. Kernel delivers an addressed command whose immutable subject references the admitted Work definition, exact Foundry case artifacts, ratification, Mint plan, casting authorization, target identity/pre-state, and limits.
2. Foundry CommandGate checks structural eligibility and exact artifact validity.
3. ExecutorAdapter invokes exactly one declared Mint adapter.
4. Mint independently revalidates authorization freshness and target pre-state under its lock.
5. Mint alone stages/applies/recovers effects and owns its effect journal.
6. Mint returns a typed transaction receipt reference.
7. Kernel records only the structural event and artifact reference.
8. Foundry validates the receipt contract and reduces case posture.
9. Separate observer and attestation work inspect the actual target.

Forbidden ExecutorAdapter behavior includes writing the target itself, interpreting authorization policy, translating a release into permission, classifying a partial apply as installed, creating a second effect journal, or fabricating observation.

Evidence: `CF-RESULT lines 43, 75-79`; `CF-DESIGN lines 126-134, 175-183, 400-409`; public packet `RWO-DESIGN lines 222-302, 368-399`.

## Forbidden-collapse matrix

| Forbidden equivalence | Why it fails | Required separation |
|---|---|---|
| `work_released == validation_success` | Release is structural; validation is backend/aggregation evidence | Release event plus separate validated report reference |
| `work_released == ratified` | Kernel cannot perform authority acts | Separate owner-issued ratification artifact |
| `work_released == casting_authorized` | Authorization binds a later exact plan/target tuple | Separate casting authorization artifact |
| `attempt_terminal == installed` | Attempt can end failed, recovered, stale, cancelled, or manual | Mint transaction receipt classification |
| `effect receipt == observed target` | Receipt reports execution; observation inspects actual state | Separate postinstall observation |
| `observed == attested` | Observation and attestation have different owners and subjects | Separate postinstall attestation |
| `installed == promoted/released/true` | Installation is an effect outcome, not governance or truth | External promotion/domain owner decision |
| `backend positive == obligation complete` | Profiles cover different fragments/ceilings | Obligation-specific aggregation |
| `validation complete == ratified` | Evidence informs but cannot self-ratify | Authority owner act |
| `route advice == owner decision` | Advice is non-authoritative and may expose ambiguity | Owner-controlled decision artifact |
| `parent Work authority == child authority` | Composition parentage is syntax, not delegation | Each effecting Work carries accepted authority refs |
| `composite terminal == child semantic success` | Composition observes structural outcomes | Domain gate Work interprets referenced artifacts |
| `journal accepted == domain truth` | Journal owns accepted history, not semantic state | Domain artifact owners plus Foundry reducer |
| `cursor/status projection == case state` | Cursor/projection is rebuildable and non-authoritative | Foundry case posture derived from domain receipts |
| `replay == revalidation` | Replay reconstructs accepted history; it does not rerun current semantics | New command/attempt with current bindings |
| `redelivery == retry/rework/recovery` | Transport behavior is not a new semantic attempt or effect policy | Typed, separately owned mechanisms |
| `Foundry case ledger == orchestration journal` | A second journal creates conflicting accepted history | One orchestration journal; Foundry references artifacts through selected sink |
| `Foundry runtime == scheduler` | It would duplicate orchestration and create recursive authority | FoundryWorkAdapter plus domain reducer/gates |
| `Mint journal == orchestration journal` | Subjects differ: target effects versus structural history | Correlated references, never merged ownership |
| `IR == native constitution` | Translation is partial, directional, and loss-aware | Preserve native source and explicit residue |

## Safe event vocabulary

Kernel event names should expose structure and references, not domain verdicts:

- `work_requested`
- `work_started`
- `command_delivered`
- `attempt_started`
- `artifact_reference_emitted`
- `gate_evidence_emitted`
- `work_released`
- `work_blocked`
- `external_decision_reference_accepted`
- `external_authorization_reference_accepted`
- `reference_rejected`
- `effect_plan_reference_emitted`
- `effect_attempt_requested`
- `effect_attempt_started`
- `effect_result_reference_emitted`
- `observation_reference_emitted`
- `attestation_reference_emitted`
- `interpretation_evidence_emitted`
- `attempt_stale`
- `delivery_redelivered`
- `work_cancelled`
- `work_exhausted`
- `work_terminal`

Avoid kernel events named `validated`, `ratified`, `authorized`, `installed`, `observed`, `promoted`, `released_to_production`, or `true`. If domain vocabulary must appear, it belongs inside a typed external artifact referenced by the structural event, with issuer, subject, digest, and ceiling.

## Stop conditions

Stop integration or implementation entry if:

- Any Work parent/child relation is treated as authority delegation or inheritance.
- A kernel release/terminal event is used as semantic, authority, effect, observation, promotion, or truth evidence.
- A Foundry scheduler, private journal, Mint-replacement journal, or duplicate observability ledger is proposed.
- The exact constitution-protocol, authority-subject, runtime/root, or data/sink owner acceptance is absent.
- Ratification and casting authorization are merged or allowed to self-issue.
- Any candidate, validation, plan, target-pre-state, condition, expiry, tool, schema, or interpreter digest has changed.
- Backend fragments are substituted, unsupported/unknown/timeout is coerced positive, or residue disappears.
- ExecutorAdapter can mutate outside Mint, or Mint’s lock/precondition/effect-journal contract is unresolved.
- A partial effect can be classified installed, or observation rewrites transaction outcome.
- Replay triggers new backend, authority, adapter, or external-effect calls.
- Journal acceptance, cursor, projection, Inventory, or receipt presence is used as domain truth.
- Required authority, recovery, budget, journal-acceptance, artifact-admission, effect, compiler, validator, fixture, or conformance contracts remain unresolved.
- Direct nested-repository access would be required.
- Any source, ontology, authority, Inventory, Git, publication, deployment, release, production, or external mutation would be required.

## Owner prerequisites

Before any implementation selection:

1. Exact typed acceptances from:

   - `constitution-protocol-owner`
   - `authority-subject-owner`
   - `runtime-root-owner`
   - `data-sink-owner`

   Each must bind current S06 design, S08 repair, Work Pack, SWU manifest, and execution-entry digests.  
   Evidence: `CF-WORK-PACK lines 58-60, 136-138`; `CF-RESULT lines 117-126, 140-142`.

2. RWO owner decisions/contracts for:

   - Minimum authority reference.
   - Journal acceptance and replay.
   - Recovery/budget ownership.
   - Compiler/reducer and composition conformance.
   - ExecutorAdapter/effect ownership.
   - Artifact admission and event-class location.
   - Schema/reducer migration.

   Evidence: `RWO-COMPOSITION-OWNER-GATE lines 22-29`; accepted parent findings lines 205-234.

3. Mint owner acceptance of:

   - Existing plan/scaffolder/path-safety surfaces.
   - Lock and target-pre-state checks.
   - Finite effect journal.
   - Installed/recovered/manual terminal algebra.
   - No duplicate synchronizer or transaction owner.

   Evidence: `CF-RESULT lines 75-79, 95-106, 121-127`; `CF-DESIGN lines 175-183, 424-433`.

4. Backend-owner bindings:

   - Exact current Cedar, Lean, Datalog, and bounded-solver versions/APIs/dialects/trusted bases.
   - Positive, negative, unsupported, unknown, timeout, translation-error, and resource-limit fixtures.
   - No cross-profile substitution.

   Evidence: `CF-RESULT lines 45-60`; `CF-WORK-PACK lines 150-164, 173-174`.

5. Finite conformance evidence:

   - Parentage does not confer authority.
   - Gate release does not confer semantic or authority status.
   - Changed plan/target digest invalidates authorization.
   - Partial apply is never installed.
   - Failed observation does not rewrite transaction outcome.
   - Replay performs zero mutable/external calls.
   - Duplicate/divergent delivery remains idempotent and does not create a second attempt.
   - Missing/wrong owner artifacts fail closed.
   - Cold interpretation succeeds without live parent lookup.

   Evidence: `CF-DESIGN lines 373-394`; `CF-WORK-PACK lines 152-164`; accepted parent findings lines 184-203.

No Implementation Readiness or Task Session admission has occurred, and the Work Pack explicitly remains `owner-prerequisite`.

## Access and mutation confirmation

I did not open, list, search, stat, execute, or write anything under `projects/cyberalchemy-orchestrator/`. Public orchestrator facts came only from the digest-bound packet and accepted parent findings. I made no file, repository, authority, Inventory, telemetry, Git, network, or external-state mutation.

```json
{
  "action_id": "spawn-0003",
  "agent": "Beer, Stafford",
  "role_id": "explorer-authority",
  "status": "pass",
  "validation": "Completed read-only authority/control-boundary analysis with owner matrix, forbidden-collapse matrix, safe event vocabulary, stop conditions, exact evidence selectors, proof ceilings, and nested-repository non-access confirmation.",
  "blockers": [
    "Exact constitution-protocol, authority-subject, runtime-root, and data-sink owner acceptances are absent.",
    "RWO authority, recovery, journal-acceptance, effect, compiler, validator, and conformance contracts remain unresolved.",
    "No Foundry runtime, backend, Mint, adapter, or end-to-end execution evidence exists.",
    "No ratification or casting authorization exists."
  ],
  "residue": [
    "FoundryWorkAdapter remains proposal-only.",
    "Kernel event vocabulary and owner schemas require owner admission.",
    "Finite positive and negative integration fixtures remain planned and unexecuted.",
    "Implementation, ontology mutation, authority acts, promotion, publication, deployment, release, and production remain unauthorized."
  ],
  "artifacts": []
}
```

## Agent 2 — Turing, Alan (`explorer-conformance`)

## Explorer report — Turing, Alan / implementation and conformance

### Bottom line

The smallest safe integration is a transport-neutral `FoundryWorkAdapter` at the boundary between:

1. a proposal-only recursive Work compiler/kernel that owns immutable structural graph expansion, addressed runs and attempts, command/event acceptance, accepted structural history, routing cursor, and non-authoritative projection; and
2. the private Foundry, formal-backend, authority, Mint, observation, and recovery owners that retain all domain meaning and effects.

The adapter must translate only opaque, digest-bound Foundry action requests and returned artifact references. It must never translate a structural kernel event such as `released`, `terminal`, or `attempt_succeeded` into “proved,” “ratified,” “authorized,” “installed,” “observed,” or “true.”

No current runtime integration is proven. The accepted parent findings establish an implemented governed control-plane/evidence runtime, journal, protocol compiler, delivery seams, projections, and conservative recovery operations; the recursive Work kernel remains proposal-only. The Foundry package is refreshed and deterministically validated, but its 19 implementation units remain unstarted and owner-prerequisite gated.

### Evidence/status ceiling

- **Observed orchestrator implementation:** governed dispatch/control-plane, bound launch-plan compilation, addressed host delivery, one ACI-oriented journal with idempotency/conflict handling, deterministic protocol compilation, projections, and conservative operator recovery. Parent findings lines 3–14, 56–74.
- **Executed orchestrator evidence:** only the prior protocol compilation slice, 13/13 tests. Parent findings lines 11–14, 63, 69–74.
- **Proposal-only:** uniform recursive Work, generic composition compiler, event-edge reducer, attempts, generic cursor, composition-form metamodel, and Foundry adapter. Packet `live_orchestrator_snapshot.sources[RWO-DESIGN,RWO-COMPOSITION-FORM-RESULT,RWO-COMPOSITION-OWNER-GATE]`; parent findings lines 76–93, 107–125.
- **Current Foundry package status:** approved exact-scope refresh of 27 artifacts with deterministic validation; not implementation or authority. `CF-REFRESH-REPORT` selectors `/applied_count`, `/validation`, `/remaining_lifecycle_gates`, `/claim_ceiling`; `CF-REFRESH-MATERIAL-RECEIPT`.
- **Foundry implementation/runtime:** absent. `CF-RESULT` lines 108–125; `CF-WORK-PACK` lines 75–86, 166–179, 208–217.
- **Authority/effect status:** no ratification, casting authorization, Mint execution, target mutation, promotion, release, or production proof. Refresh report `/remaining_lifecycle_gates`.

## Implementation / proposal / delta matrix

| Surface | Current fact | Foundry relationship | Exact required delta | Ceiling / selectors |
|---|---|---|---|---|
| Compiler | Current deterministic protocol compiler compiles closed-schema dispatch candidates; it does not recursively compile Work or decide/execute. | A Foundry case must compile into opaque leaf/composite Work definitions without compiling domain truth. | Add a separately accepted generic composition schema and deterministic compiler: immutable definition digest, closed operand forms, unique node IDs, event-contract compatibility, bounded repeat/exhaustion, authority-ref presence checks, and rejection of nested orchestration authority. | Current compiler observed/executed only in parent findings 58–74. Recursive compiler proposal-only: packet RWO-DESIGN 87–140, 210–220; composition result 3–18. |
| Work schema | No accepted current recursive Work schema is proven. | Author, Prove, Decide, Cast can be structural Work positions, but `FoundryCase` is not `WorkRun`. | Define versioned `WorkDefinition`, `CompositeWorkDefinition`, `WorkRun`, `Attempt`, `CommandContract`, and `EventContract`; carry Foundry artifacts as opaque typed refs plus digests. | Proposal-only: packet RWO-DESIGN 87–140; Foundry concepts: CF-DESIGN 49–63. |
| Composition | Current launch plans and groups provide finite sequence/fan-out precedent, not generic recursive flattening. | Candidate graph: Author → Prove → readiness gate → external ratification import → Mint plan → external casting-authorization import → Cast → observation. | Compile one root to a finite run plan; distinguish structural sequence/quorum/gate from semantic aggregation and owner decisions; retain late arrivals without making them truth. | Parent findings 107–125; packet composition-form result/gate. |
| Command lane | Current command/event separation is implemented precedent. | Kernel command requests one opaque Foundry transition. | Envelope must bind `definition_digest`, `run_id`, `node_id`, `attempt_id`, `case_ref/digest`, requested action, input refs/digests, authority refs, limits, idempotency key, and adapter contract version. Unknown/missing/stale fields block before invocation. | Parent findings 121–122, 162–182; packet RWO-DESIGN 222–285; CF-DESIGN 126–134. |
| Event lane | Current journal accepts structural events; event transport does not prove semantics. | Adapter returns artifact refs and a structural disposition. | Closed event vocabulary such as `command_accepted/rejected`, `attempt_started`, `artifact_reported`, `attempt_failed`, `attempt_terminal`, `delivery_duplicate/conflict`, `route_released/blocked`; domain verdict remains inside referenced artifact. | Packet RWO-DESIGN 222–302; CF-DESIGN 147–183, 400–409. |
| Reducer | Current projections are rebuildable but non-authoritative; generic recursive reducer unproven. | Foundry `CaseReducer` separately derives five-axis case posture from validated artifacts. | Kernel reducer derives cursor solely from accepted structural events. Foundry reducer validates domain artifact schemas, subjects, and transitions. Cross-reference by immutable artifact ID/digest only; neither reducer writes the other’s truth. | Parent findings 62, 65, 76–86, 184–193; CF-DESIGN 126–134, 405; CF-RESULT 73–79. |
| Journal | One implemented ACI-oriented journal exists; semantic replay completeness remains unverified. | Foundry design forbids a private ledger; Mint owns its effect journal. | Reuse one orchestration journal for structural acceptance. Persist Foundry artifacts in an owner-selected sink or fixture store; Mint retains its finite transaction/effect journal. Define atomic acceptance/reference rules and crash boundaries before integration. | Parent findings 62, 122, 205–216; CF-DESIGN 84–92, 347; CF-RESULT 95–106. |
| Idempotency | Current journal has idempotency/conflict precedent. | Duplicate command delivery must not repeat backend or Mint calls. | Same idempotency key + byte-identical command returns prior accepted disposition; same key + changed digest is conflict; redelivery never creates a new attempt; new attempt requires explicit new attempt ID and policy decision. | Parent findings 62, 120, 184–193; packet RWO-DESIGN 368–399. |
| Attempts | Proposal distinguishes attempt from immutable definition/run. | Backend timeout, adapter failure, or delivery failure may create retry eligibility but not alter obligations/authority. | Attempt record binds definition/run/node/input/authority digests, ordinal, limits, adapter version, start/terminal event refs. Retry policy remains Work-owned and bounded; changed inputs or authority require a new run/revalidation, not retry. | Packet RWO-DESIGN 87–140, 368–399. |
| Backend semantics | No concrete backend execution exists. | Cedar, Lean, Datalog, bounded solver remain distinct leaf adapters with non-substitutable ceilings. | Backend command/result schemas; supported-fragment declaration; exact tool/profile/trusted-base digest; statuses `proved/refuted/unknown/timeout/unsupported/error` as domain artifacts, never kernel statuses; aggregation by obligation, not backend count. | CF-DESIGN 147–163, 377–394, 400–403; CF-WORK-PACK 66–72, 150–164. |
| Authority | Kernel explicitly cannot own approval/readiness/permission. | Readiness and route advice are ordinary domain gate outputs; ratification and casting authorization are separate external owner artifacts. | Validators must bind exact issuer/owner route, subject, candidate/report/plan/target digests, conditions, expiry, and non-self-issue. Structural release merely permits the next command to be considered. | Packet RWO-DESIGN 34–85, 368–399; CF-DESIGN 165–174, 402–404; CF-RESULT 62–71. |
| Mint effect | No current Foundry/Mint integration is executed. | Only Mint plans/applies target mutations and classifies transaction recovery. | Kernel executor invokes an owner-approved Mint port at most once per accepted command. Mint rechecks authorization and pre-state under lock and emits `installed`, `recovered`, or `manual_recovery_required` transaction artifact; kernel records only its reference and structural terminality. | CF-DESIGN 175–183, 405–408; CF-RESULT 73–79, 95–106. |
| Observation | Structural completion and transaction result are not observation. | Failed postinstall observation must not rewrite successful apply. | Observation is a distinct leaf/action and artifact axis. Failed observation yields structural terminal failure/block for that observation node while Foundry posture remains `casting=installed`, `observation=observation_failed`. | CF-RESULT 73–79; CF-DESIGN 175–183. |
| Failure/recovery | Current operator recovery is conservative and incomplete; generic RWO recovery is proposal-only. | Backend retry policy belongs to leaf Work; Mint transaction recovery belongs to Mint; observation repair belongs to its owner. | Typed failure classes: transport, schema, stale-subject, unsupported, timeout, backend error, effect partiality, observation failure, journal conflict. Map each only to bounded retry, new revalidation, recovered, manual recovery, or block; never generic “retry everything.” | Parent findings 66–67, 205–216; packet RWO-DESIGN 368–399; CF-DESIGN 424–433. |
| Replay | Journal verification exists, but integrated semantic replay is unverified. | Historical replay derives the same cursor/case posture from identical accepted bytes; it does not rerun backends, refresh authority, observe target, or call Mint. | Implement two explicit APIs: `replay(cut)` is zero-external-call deterministic reduction; `revalidate(new_subjects)` creates a new run/attempt chain and requires current authority. | Parent findings 137, 162–182, 184–203; CF-WORK-PACK 154–164. |
| Conformance | No integrated fixture exists. | `garden-club-v1` is the finite candidate. | Build compiler golden vector, event/reducer trace, duplicate/conflict vectors, restart/replay trace, and owner/effect negative suite under pinned versions. | CF-DESIGN 349–355, 373–394; CF-RESULT 81–93; CF-WORK-PACK 140–164. |

## Candidate transport-neutral adapter seam

```text
interface FoundryWorkAdapter {
  contract_version: Digest

  describe(action_kind) -> {
    input_schema_ref,
    output_artifact_schema_ref,
    supported_failure_classes,
    effect_class: none | mint_only,
    owner_kind,
    proof_ceiling
  }

  invoke(command: {
    definition_ref, definition_digest,
    run_id, node_id, attempt_id,
    case_ref, case_digest,
    action_kind,
    input_artifact_refs[], input_digests[],
    authority_refs[], authority_subject_digests[],
    limits,
    idempotency_key
  }) -> {
    disposition: reported | blocked | failed,
    artifact_refs[],
    artifact_digests[],
    failure_class?,
    retry_eligibility?: eligible | ineligible | owner_decision_required
  }
}
```

Required properties:

- Adapter does not receive a journal writer, scheduler, graph mutator, authority issuer, semantic-status setter, filesystem writer, or ontology mutator.
- Kernel validates structural envelope and contract version; the action owner validates artifact meaning and exact subjects.
- `artifact_refs` are evidence references, not kernel facts about proof, authority, installation, or observation.
- `effect_class=mint_only` is permitted only for the Cast apply action and only with a valid external casting-authorization reference; no other adapter may effect.
- A returned failure classification is advisory evidence until its owner-specific schema validates; the kernel applies only the predeclared structural route.
- The adapter cannot enqueue nested Work or create a child scheduler. Any follow-up is emitted as a structural artifact/event consumed by the single root kernel.

## Finite positive end-to-end fixture

Use `garden-club-v1`, but constrain integration proof to one finite transport-neutral trace:

1. Compile one immutable root definition with leaf nodes for Author, deterministic validation, Cedar, Datalog, bounded solver, Lean, obligation aggregation, movement-readiness, route recommendation, external ratification import, Mint no-write planning, external casting-authorization import, preinstall attestation, Mint apply, postinstall observation, and postinstall attestation.
2. Freeze every definition, schema, adapter, source, translation, backend profile, authority fixture, plan, target pre-state, and expected artifact digest.
3. Submit one addressed root command and accept one `attempt_started`.
4. Each semantic leaf returns one backend-specific artifact ref; kernel accepts only `artifact_reported`.
5. Foundry aggregation artifact reports all six obligations with their own ceilings.
6. Readiness and route artifacts release only the external ratification-import node.
7. Fixture ratification validates exact subject; Mint creates a no-write plan.
8. Fixture casting authorization validates exact ratification, plan digest, target ID/pre-state, conditions, and expiry.
9. Mint apply under lock records a finite effect journal and returns `installed`.
10. Observation and post-attestation return separate artifacts.
11. Kernel root becomes structurally terminal; Foundry reducer independently derives the expected five-axis posture.
12. Restart from the accepted journal cut: cursor and Foundry posture reproduce byte-identically with zero backend, authority, Mint, target, or observation calls.
13. Redeliver every command once: no adapter executes twice and the accepted history is unchanged except permitted duplicate-delivery evidence.
14. Proof ceiling: transport-neutral structural composition, idempotency, and replay for the fixture only—not formal correctness, real authority, target safety generally, production readiness, or “any pipeline.”

## Discriminating negative fixtures

| Negative | Mutation | Expected result |
|---|---|---|
| Stale authority | Change candidate/report/condition/expiry after ratification or change plan/target pre-state after casting authorization. | Owner validator returns stale/mismatched subject; zero Mint apply calls; structural route blocks. |
| Wrong plan digest | Flip one byte in the no-write plan after authorization. | Authorization invalid; no preinstall/apply event and no target write. |
| Backend partiality | Route recursive reachability only to Cedar, or substitute Cedar report for Datalog/Lean obligation. | `unsupported`/profile mismatch artifact; aggregation incomplete; no ratification-import release. |
| Duplicate delivery | Deliver identical command twice with same key. | One invocation, same terminal artifact reference; no new attempt. |
| Divergent duplicate | Same key, changed input/authority digest. | Journal conflict; zero invocation; run blocks for operator/owner resolution. |
| Failed observation | Mint returns installed; postinstall observer fails. | Casting remains installed, observation axis is failed; no invented rollback and no “fully observed” status. |
| Backend partial effect | Backend leaf reports timeout/error after producing no admissible report. | No semantic success; bounded retry only if predeclared, otherwise block. |
| Mint partiality recovered | Inject effect-2 failure and successful compensation. | Mint artifact `recovered`; never installed; kernel records structural terminal reference only. |
| Mint partiality manual | Inject failure plus failed/unsafe compensation. | `manual_recovery_required`; no automatic retry/redelivery; root blocks. |
| Replay vs revalidation | Replay old journal after current source, authority, or target changed. | Historical result reproduced from old cut with zero external calls and explicitly old subject; current decision requires a new revalidation run. |
| Attempt identity | Retry with same attempt ID after terminal failure, or silently change inputs for ordinal+1. | Duplicate/conflict respectively; new attempt requires new ID with identical bound subjects, while changed subjects require new run/revalidation. |
| Forbidden nested authority | Adapter returns child graph, owner decision, authorization, or requests journal/scheduler access. | Schema/contract rejection before acceptance; no nested run and no authority artifact accepted. |
| False structural quorum | Required backend artifacts arrive but obligation aggregator rejects one or reports unresolved residue. | Arrival/quorum does not release ratification; semantic gate remains blocked. |
| Projection as truth | Mutate/read projection to claim installed absent accepted Mint artifact. | Rebuild removes false projection; no downstream release. |
| Missing sink owner | Adapter attempts durable Foundry-specific receipt append without selected sink contract. | Integration entry blocks; fixture-local immutable artifacts only. |

## Executable future acceptance sequence

1. **Owner-entry gate:** obtain four exact owner acceptances named by the refreshed Work Pack; bind current design, Work Pack, manifest, execution-entry, and proposed integration contract digests.
2. **Freeze schemas:** WorkDefinition/composite/run/attempt/command/event/failure/artifact-reference schemas plus Foundry action contracts. Reject additionalProperties and ambiguous terminal meanings.
3. **Compiler conformance:** golden compile of the positive fixture; deterministic byte equality; cycle, duplicate-ID, incompatible edge, unbounded repeat, nested scheduler, and missing-authority-ref negatives.
4. **Journal conformance:** accept/reject/conflict/idempotency vectors; crash-before/after acceptance; hash-chain/store verification; exact artifact-ref binding.
5. **Reducer conformance:** rebuild kernel cursor from accepted structural history; separately rebuild Foundry posture from validated artifact set; permutation tests where ordering is not semantic; forbidden-transition tests.
6. **Attempt conformance:** redelivery versus new attempt; stale terminal events; attempt/input immutability; exhaustion routing.
7. **Backend adapter conformance:** pinned positive, refutation, unsupported, timeout, resource-limit, malformed-result, wrong-profile, and cross-backend substitution fixtures for each backend.
8. **Authority conformance:** exact issuer/route/subject/freshness/expiry tests; self-issued, stale, missing second act, wrong plan, wrong target, and owner substitution negatives.
9. **Mint conformance:** no-write plan determinism; lock/pre-state recheck; exact authorization; partial apply recovered/manual paths; duplicate application prevention; effect-journal restart.
10. **Observation conformance:** installed+observed, installed+observation-failed, and observation artifact subject mismatch.
11. **End-to-end positive:** execute the frozen fixture once in a fresh temporary target; compare complete event/artifact/target digest vector.
12. **Duplicate pass:** redeliver all commands and prove zero duplicate adapter/effect invocations.
13. **Cold replay:** restart with only frozen definitions, accepted journal cut, fixture artifacts, and pinned meta interpreter; prove byte-identical cursor/posture and zero external calls.
14. **Current revalidation:** mutate one current subject and prove replay remains historical while a new run blocks pending fresh proof/authority.
15. **Independent verification:** run the Work Pack’s unit/integration/reference-casting/scoped-whitespace suite plus the integration negatives; issue a bounded conformance receipt.
16. **Only then:** owner-routed implementation/adoption decision. Passing fixtures still do not grant ratification, casting authorization, promotion, deployment, release, or production status.

## Explicit unverified items

- No accepted recursive Work schema, generic compiler, reducer, or runtime implementation.
- No implemented composition-form metamodel or executed 28-row scenario matrix.
- No executable `FoundryWorkAdapter`.
- No demonstrated compatibility between current orchestrator journal/event schemas and proposed Work events.
- No atomicity proof spanning journal acceptance and external artifact sink references.
- No selected durable Foundry receipt sink or retention/access/concurrency contract.
- No concrete pinned Cedar, Lean, Datalog, or bounded-solver runtime/API/toolchain evidence.
- No executed Foundry case reducer, backend adapter, authority validator, Mint adapter, observation adapter, or cold replay.
- No exact admitted ratification/casting-authorization owner subjects.
- No resolved minimum verifiable authority-reference schema.
- No demonstrated cross-host delivery guarantees.
- No complete cancellation/compensation combinators or schema/reducer migration policy.
- No target-wide restoration/reinstatement proof.
- No real owner act, Mint effect, target mutation, integration, adoption, ontology promotion, publication, deployment, release, or production evidence.

Forbidden nested-repository access was not used: I did not open, list, search, stat, execute, or write anything under `projects/cyberalchemy-orchestrator/`. All public orchestrator facts above came from the digest-bound packet and accepted parent findings. No files or external state were mutated.

```json
{
  "action_id": "spawn-0002",
  "agent": "Turing, Alan",
  "role_id": "explorer-conformance",
  "status": "pass",
  "validation_summary": "Completed a read-only implementation/proposal/delta reconstruction, transport-neutral adapter seam, finite positive fixture, discriminating negative suite, and future executable acceptance sequence using only packet-authorized private sources and accepted parent evidence.",
  "blockers": [
    "recursive Work compiler/reducer/runtime remains proposal-only",
    "Foundry implementation and backend/Mint execution evidence absent",
    "four exact owner acceptances and authority subjects absent",
    "durable sink and exact journal-to-artifact acceptance contract unresolved"
  ],
  "residue": [
    "generic schema and compiler contract",
    "journal/artifact atomicity",
    "attempt and failure taxonomy",
    "backend/toolchain pins",
    "authority-reference schema",
    "Mint recovery and cold replay conformance"
  ],
  "artifacts": []
}
```

Recursive substitutability holds only if each composite exposes the same immutable outer Work contract and its children are compiled into one root plan. It fails if any child creates a scheduler/journal, changes the graph or authority basis during an attempt, treats parentage as authority, or interprets a structural event as a domain verdict. These are forbidden by the RWO packet at lines 368–399. Bounded repetition, if later needed for rework, must use explicit decision Work, a bound, and an exhaustion route (RWO packet lines 210–220); backend retry, Mint recovery, replay, revalidation, and semantic rework must remain distinct.

## Lifecycle and event trace

1. Foundry adapter submits `StartWork(root_definition_ref, case_ref, authority_refs=[])`.
2. Kernel accepts root run and releases Author.
3. Author attempt returns artifact references; adapter validates source/IR/obligation subjects; kernel records a structural terminal/release event. This event does **not** mean translation fidelity.
4. Prove composite fans out addressed backend commands.
5. Each backend attempt returns a backend report reference. Adapter validates schema/profile/subject; kernel records structural completion. `unknown`, `timeout`, `unsupported`, and `translation_error` remain domain statuses, not kernel failures unless the Work contract explicitly maps them to a structural branch.
6. Aggregation gate consumes all required report references and emits a typed completeness artifact. Its release means only the gate contract accepted that artifact.
7. Movement/readiness and route Works emit assessment/advice.
8. Ratification import gate waits for and validates an external `ConstitutionRatificationDecision`. No event generated earlier can substitute.
9. Mint planning Work returns a no-write plan reference.
10. Casting-authorization import gate validates a second external artifact over the exact candidate/validation/plan/target tuple.
11. Preinstall gate validates staged inputs and attestation; only then may the kernel release one addressed Mint apply command.
12. Mint adapter performs effects under Mint ownership and returns `MintTransactionReceipt`.
13. Kernel records only command/attempt/structural outcome plus receipt reference. Foundry reducer derives casting posture; Mint receipt owns installed/recovered/manual classification.
14. Observation and post-attestation Works return separately validated artifacts. Failed observation leaves casting installed when the Mint transaction says installed.
15. Cold interpretation Work verifies the installed object without live parent lookup.
16. Root structural terminal means the graph reached a declared terminal branch. It does not mean ratified, authorized, installed, observed, promoted, or true.

## Collisions and missing types

### Forbidden collisions

- `ConstitutionCase ≠ WorkRun`
- native constitution source `≠ ConstitutionIR`
- obligation `≠ WorkDefinition`
- backend report `≠ Event`
- backend-positive result `≠ proof of translation fidelity`
- all-arrived/quorum `≠ obligation completeness`
- gate release `≠ validation success`
- route recommendation `≠ ratification`
- ratification `≠ casting authorization`
- plan `≠ permission`
- authorization `≠ effect execution`
- transaction receipt `≠ observation`
- installed `≠ promoted`
- journal fact `≠ domain truth`
- routing cursor/status projection `≠ Foundry case posture`
- parent/child relation `≠ authority inheritance`
- redelivery/replay/retry/rework/revalidation/recovery `≠` one mechanism

### Unresolved owner schemas

The integration cannot enter implementation until owners define or accept:

- minimum verifiable `authority_requirements` reference carried by WorkDefinition/Command;
- exact `EventContract` vocabulary and artifact-admission contract;
- mapping of domain-return statuses to structural event classes without semantic collapse;
- journal acceptance/replay rules and schema/reducer migration;
- executor-adapter ownership and effect-reference schema;
- bounded repetition/recovery/budget contracts;
- case/run correlation and artifact lineage schema;
- exact owner selectors for movement/routing, ratification subject, casting-authorization subject, runtime/root, and data/sink;
- compiler/validator/conformance contracts for the composition-form candidate.

These align with RWO-COMPOSITION-OWNER-GATE packet lines 22–29 and accepted findings residue `RWO-OQ-001` through `RWO-OQ-010` plus ontology residue 011–014 (accepted findings lines 205–234).

## Candidate `FoundryWorkAdapter` interface

Proposal only:

```text
interface FoundryWorkAdapter {
  compileCase(
    caseRef,
    foundryContractVersion,
    compositionFormVersion
  ) -> CompositeWorkDefinition | CompileBlocked

  prepareCommand(
    workRunRef,
    workNodeRef,
    caseArtifactCut,
    requestedTransition
  ) -> Command | GateBlocked

  admitDomainArtifact(
    workRunRef,
    attemptRef,
    artifactRef,
    expectedContract,
    expectedSubjectDigest
  ) -> ArtifactAdmission | ArtifactRejected

  mapArtifactToStructuralOutcome(
    admittedArtifact,
    declaredEventContract
  ) -> StructuralEventProposal | MappingBlocked

  projectCase(
    validatedArtifactCut
  ) -> FoundryCaseProjection

  validateEffectRelease(
    mintCommand,
    ratificationRef,
    castingAuthorizationRef,
    mintPlanRef,
    targetPreStateDigest,
    preinstallAttestationRef
  ) -> EffectReleaseEvidence | ReleaseBlocked
}
```

Required invariants:

- pure/deterministic compilation and mapping;
- unknown schema/version/status fails closed;
- adapter never authors semantic results, ratification, authorization, Mint plan, recovery class, observation, or attestation;
- adapter cannot append directly to a second journal;
- it proposes structural commands/events to the existing kernel lanes;
- it invokes no more than the one declared port for a transition, matching `CF-DESIGN:126–134`;
- `mapArtifactToStructuralOutcome` preserves the artifact reference and ceiling and never maps a structural release to a domain success;
- effect release requires accepted, fresh authority references but does not itself grant authority.

## Finite substitutability tests

Smallest positive witness:

- one root sequence;
- Author produces exact manifest/IR/obligations;
- Prove fans out two backend leaves with distinct profiles;
- aggregation gate admits both reports by obligation;
- ratification and casting authorization arrive as separate owner fixtures;
- Mint apply is the only effecting leaf;
- post-observation succeeds;
- one root plan, one orchestration journal, deterministic replay yields the same cursor and Foundry projection.

Discriminating negatives:

1. Change IR after backend reports: Prove artifacts become stale; no Decide release.
2. Mark Cedar report as discharging recursive Datalog obligation: aggregation blocks.
3. Treat all-arrived as semantic completeness: fixture must fail.
4. Substitute route recommendation for ratification: import gate blocks.
5. Reuse ratification as casting authorization: blocks.
6. Change plan byte or target pre-state after authorization: preinstall/apply blocks with zero target effect.
7. Duplicate command delivery: same idempotency identity produces no second Mint transaction.
8. Stale attempt emits late report: retain history but do not advance current cursor.
9. Mint partial apply: never emit/derive installed; only recovered/manual-recovery-required from Mint.
10. Observation fails after installed receipt: casting remains installed; observation becomes failed.
11. Replay historical accepted artifacts: no backend, owner, or Mint call; replay does not refresh authority.
12. Child composite attempts to create scheduler/journal or inherit authority: compilation/conformance rejects.

The Foundry Work Pack already authors related planned witnesses (`CF-WORK-PACK:76–90,148–171`), but none has executed.

## Proof ceilings and current status

- **Observed:** current Foundry design/refinement artifacts describe the owner-separated architecture; parent-observed RWO sources describe the proposal-only kernel and composition candidate.
- **Executed:** the direct Invoke refresh applied 27 exact artifacts and deterministically validated JSON, design extraction/selection, dispatch shape, 19-node acyclic graph, 40 routes, readiness contracts, source bindings, negative cases, receipt reproduction, and whitespace. `CF-REFRESH-REPORT#/applied_count,/validation`; material receipt `patchVerdict=pass`.
- **Proposal-only:** RWO uniform Work kernel, composition compiler/reducer, Foundry-over-RWO adapter, event mappings, recursive substitution, and all integration contracts.
- **Planned:** 19 Foundry SWUs and the positive/negative/recovery/cold fixtures; no task admitted. `CF-WORK-PACK:37–47,60–70,76–90,112–124,148–171,177–209`.
- **Unverified/absent:** owner acceptances, Implementation Readiness, Task Session admission, concrete runtime, backend or solver execution, Mint execution, end-to-end conformance, ratification, casting authorization, authority mutation, promotion, publication, deployment, release, or production evidence. `CF-REFRESH-REPORT#/remaining_lifecycle_gates,/claim_ceiling`; `CF-RESULT:3–9,91–93,117–125`.

The earlier package-review defects are provenance only. The current verdict is the directly approved refresh report: twelve review defects closed, while the four owner acceptances and all execution/authority gates remain open.

No file was written or mutated. I did not open, list, search, stat, execute, or otherwise access anything under `projects/cyberalchemy-orchestrator/`; all public-orchestrator claims above come solely from the digest-bound packet and accepted parent findings.

```json
{
  "action_id": "spawn-0001",
  "agent": "Spivak, David",
  "role_id": "explorer-formal",
  "status": "pass",
  "validation_summary": "Completed read-only typed mapping, recursive-substitutability analysis, lifecycle/event trace, collision and missing-type inventory, candidate adapter interface, finite witnesses, and proof ceilings using only packet-authorized private sources and accepted parent evidence.",
  "blockers": [
    "RWO kernel and composition metamodel remain proposal-only",
    "exact authority, artifact-admission, event, recovery, journal, effect, compiler, validator, and conformance schemas remain owner-unresolved",
    "four Foundry owner acceptances are absent",
    "Implementation Readiness, Task Session, runtime/backend/Mint execution, authority acts, and integration conformance are absent"
  ],
  "residue": [
    "Bind owner schemas and authority reference contract",
    "Define non-collapsing Foundry-to-structural event mapping",
    "Execute finite positive and negative conformance fixtures",
    "Prove one root plan and one journal without recursive authority"
  ],
  "artifacts": []
}
```
