# Constitution Foundry ↔ RWO kernel research transcript

> Parent preservation note: the complete explorer return below is preserved verbatim. It is preliminary evidence only. Exact-binding closure failed because the approved Foundry refresh materially superseded two packet-bound sources; see `receipts/source-drift.json`.

## Formal contract-mapping return

No files were written, and nothing under `projects/cyberalchemy-orchestrator/` was opened.

### Evidence integrity

Four selected sources matched their packet hashes: CF Design, package-review findings, accepted parent RWO findings, and final audit.

Two private artifacts did not:

| Artifact | Packet SHA-256 | Current SHA-256 |
|---|---|---|
| `CF-RESULT` | `c7fc7199…` | `ca45367a…` |
| `CF-WORK-PACK` | `b1268a43…` | `5ffd6be3…` |

The current bytes were read only at the permitted selectors. They appear to contain later wording/route repairs, but no selected receipt proves how the drift occurred. Therefore current Result/Work-Pack observations are usable as read evidence, not exact packet-bound evidence. Exact evidence closure must refresh or restore these bindings.

Evidence aliases below:

- `P-KERNEL`: `strategy-inventory-packet.json:/live_orchestrator_snapshot/sources/0/selectors/0-7`
- `P-FORMS`: `.../sources/1/selectors/0-2`
- `P-FORM-GATE`: `.../sources/2/selectors/0-2`
- `BASE`: accepted parent findings lines 76-86, 150-182, 184-203, 205-254
- `CF-R`: current `CF-RESULT`, lines 13-79 and 81-125; digest mismatch
- `CF-D`: `S06-INVOKE-DESIGN.md`, lines 52-63, 69-92, 98-183, 353-355, 377-394, 400-408, 415-433, 447-470
- `CF-W`: current `S09-WORK-PACK.md`, lines 37-47, 60-70, 76-90, 112-124, 148-171, 177-209; digest mismatch
- `CF-REV`: package review lines 3-22, findings CF-REV-001 through CF-REV-014, lines 125-197

### Result in one sentence

Author → Prove → Decide → Cast can be represented as one recursively composable Work graph, but the correspondence is structural only: Foundry retains case truth and semantic interpretation, formal backends retain report semantics, existing owners retain ratification and casting authority, Mint retains transaction/recovery truth, and the kernel retains only graph expansion, addressed commands, accepted structural events, attempts, routing cursor, and non-authoritative projection.

### Typed mapping

Legend:

- `E` — exact structural correspondence at the proposed RWO outer contract.
- `A` — adapter-mediated correspondence.
- `N` — deliberate non-correspondence.
- `U` — unresolved owner/schema prerequisite.

| Foundry construct | Candidate RWO representation | Class | Required non-collapse |
|---|---|---:|---|
| `ConstitutionCase` | Opaque `case_ref` in a root `WorkRun` body; a separately compiled `CompositeWorkDefinition` describes how to work on it | A/N | A case is neither a `WorkDefinition` nor a `WorkRun`. Its identity, artifacts, and five-axis posture remain Foundry-owned. `case_id`, `definition_id`, `run_id`, and `attempt_id` must be disjoint. `[CF-R:19,43,73-79; CF-D:56-57,126-134; P-KERNEL:2,5]` |
| Author → Prove → Decide → Cast | Root `CompositeWorkDefinition` using immutable authored n-ary sequence syntax | E at outer structure; A at payload | Sequence means routing order only. It does not mean semantic success, authority, installation, or observation. `[CF-R:13-43; P-FORMS:0; P-KERNEL:1-2]` |
| `Author` | Leaf or replaceable sub-composite `WorkDefinition`; addressed `WorkRun`; execution `Attempt` | E/A | Native manifest, IR, and obligation-set schemas remain Foundry artifacts. Native source cannot be replaced by IR. `[CF-D:138-145,400; CF-R:45-60; P-KERNEL:2]` |
| `Prove` | Composite Work containing obligation-evaluation Work plus an explicit aggregation Work | A | Backend completion events are structural. They do not normalize Cedar, Lean, Datalog, SMT, or validator meanings into one success bit. `[CF-D:147-163; CF-R:49-60]` |
| One backend obligation | One addressed Work definition/run; one or more attempts under fixed limits | A | The obligation and projection are Foundry inputs; the backend owns its report semantics and proof ceiling. Attempt failure/retry is not semantic refutation or timeout unless the backend report says so. `[CF-D:149-163; CF-W:66-68,117-120; P-KERNEL:2,6]` |
| Backend report | Artifact reference carried by an `EventContract` payload | A/N/U | Event acceptance only establishes accepted transport/history. It does not establish report validity or discharged obligation. Event payload and artifact-admission schemas remain unresolved. `[CF-D:151-154,386-394; P-KERNEL:3-5; BASE:184-193]` |
| `ObligationAggregator` / completeness report | Explicit Foundry-owned gate Work after backend Work fan-in | A | Never use structural `quorum(n)` as obligation completeness: aggregation is by obligation/profile compatibility, not count or green color. `[CF-R:28-30,49-60; CF-D:152-154; BASE:205-218; P-FORM-GATE:1]` |
| `MovementReadinessReport` | Output artifact from deterministic gate Work | A/N | It may release a structural next edge only under an owner-defined EventContract. It is not ratification or permission. `[CF-R:64-71; CF-D:169-170]` |
| `OwnerRouteRecommendation` | Output artifact from routing/advice Work | A/N | A route is not an authority verdict. Unresolved owner ambiguity must remain explicit. `[CF-R:66-71; CF-D:169-173; BASE:184-193]` |
| `ConstitutionRatificationDecision` | External-owner artifact imported through dedicated gate Work; referenced in `authority_requirements` | N/U | The kernel and adapter cannot issue it. Structural gate release cannot substitute for it. Minimum authority-reference schema remains unresolved. `[CF-R:64-71; CF-D:171; P-KERNEL:1,7; BASE:205-216]` |
| Mint no-write plan | Artifact-producing Work through a Mint plan port | A | The plan is Mint-owned and is not an `Attempt`, authorization, or effect. `[CF-D:62,172,179; CF-R:34-38,77]` |
| `CastingAuthorization` | Second external-owner artifact imported through a separate gate Work | N/U | Must bind ratification, package/candidate, validation, exact plan, target identity/pre-state, conditions, and expiry. No parent or prior authorization inheritance. `[CF-R:68-71; CF-D:171-173,404; P-KERNEL:0-1,7]` |
| `Cast` | Composite sequence: pre-attest → Mint apply → observe → post-attest → cold interpretation | E/A | Composition is structural; Mint remains the only transaction/effect/recovery owner. `[CF-R:36-43,73-79; CF-D:175-183]` |
| Mint transaction | One external adapter invocation associated with a Work attempt; returned transaction-receipt reference | N/U | A Work `Attempt` is not a Mint transaction attempt. An RWO event cannot decide `installed`, `recovered`, or `manual-recovery-required`; it records the Mint-owned result reference. `[CF-R:75-79; CF-D:181; CF-REV:65-72; P-KERNEL:6-7]` |
| Postinstall observation | Separate Work and separate artifact reference | A/N | Failed observation does not rewrite an installed transaction. “Work completed” is not “observed correct.” `[CF-R:75; CF-D:182,404-407]` |
| Pre/post attestation | Separate adapter Work with distinct subjects | A/N | Journal acceptance is not integrity, identity, freshness, replay resistance, or key custody. `[CF-R:79; CF-D:180,183,392,407]` |
| Foundry receipt | Artifact referenced by a structural event | A/N | Receipt ≠ Event; accepted Event ≠ valid receipt; journal fact ≠ Foundry case truth. `[CF-D:63,126-134; P-KERNEL:3-5; BASE:162-180]` |
| `CaseReducer` | Separate domain projection over admitted Foundry artifacts | N | It must not become the RWO routing cursor or generic status projection. The cursor answers “where routing is”; the case reducer answers candidate/validation/authority/casting/observation posture. `[CF-R:19,73-79; CF-D:128,405; P-KERNEL:5]` |
| `CF-RUNTIME` command gate/invoker/appender | Candidate specialization over RWO `Command`, executor adapter, one accepted journal, and event handling | A/N | Reuse must remove duplicate scheduling/journaling mechanics, not create a second orchestrator or Foundry ledger. Foundry keeps domain transition validation and case reading. `[CF-D:126-134; CF-R:43,99-106; BASE:150-160]` |

No Foundry domain artifact has exact semantic correspondence to a kernel type. Exact correspondence exists only for future structural wrappers that actually satisfy the RWO Work/Command/Event contracts.

### Candidate recursive Work graph

```text
FoundryCaseWork(case_ref)
└─ sequence
   ├─ AuthorWork
   │  └─ native manifest + candidate IR + obligation-set refs
   ├─ ProveWork
   │  ├─ obligation evaluation Work*
   │  └─ FoundryCompletenessGateWork
   ├─ DecideWork
   │  ├─ MovementReadinessWork
   │  ├─ OwnerRouteAdviceWork
   │  ├─ RatificationImportGateWork
   │  ├─ MintPlanWork
   │  └─ CastingAuthorizationImportGateWork
   └─ CastWork
      ├─ PreinstallAttestationWork
      ├─ MintApplyWork
      ├─ PostinstallObservationWork
      ├─ PostinstallAttestationWork
      └─ ColdInterpretationWork
```

`obligation evaluation Work*` may use an admitted parallel/map form if one exists. Otherwise it can be a bounded authored sequence. Structural `quorum(n)` is unsuitable for semantic completeness.

### Recursive substitutability test

A stage can be replaced by a leaf or sub-composite only if all of these remain invariant:

1. Same immutable input/output `Command` and `EventContract` envelope.
2. Same artifact subject digests and case reference.
3. Same or narrower limits.
4. Same explicit authority requirements; no widening or parent inheritance.
5. Same externally observable structural terminal classes.
6. No nested scheduler, journal, cursor, or authority service.
7. Internal events cannot bypass the stage’s explicit output/admission gate.
8. Replacement provenance is embedded and versioned.

Under those conditions, recursive structure is plausible at proposal level. Recursive authority is still forbidden: graph parentage gives no authority; a parent `WorkRun` cannot ratify, authorize casting, reinterpret a backend report, or inherit child credentials. This is not proven because the recursive compiler/reducer, 28-row form matrix, and conformance fixtures are unexecuted, while the composition ontology delta remains unapplied. `[P-FORMS:0-2; P-FORM-GATE:0-2; P-KERNEL:6-7; BASE:195-203]`

### Lifecycle and event trace

Event names here are candidate structural vocabulary, not adopted schemas.

1. Root `WorkRun` is addressed to an immutable definition digest plus opaque `case_ref`.
2. `Command<AuthorInputRef>` creates an Author attempt.
3. Author adapter returns manifest/IR/obligation refs.
4. Artifact admission validates schema/digests; journal accepts an Event containing those refs.
5. Author’s structural terminal event releases Prove. It does not declare the constitution valid.
6. Prove addresses obligation Work. Each adapter returns a backend-native report ref.
7. Accepted report-reference events trigger Foundry completeness gate Work.
8. Completeness gate emits a typed completeness-report ref. A structural release means only that the explicit gate contract accepted its input.
9. Decide produces movement and route artifacts.
10. Ratification gate waits for a separately issued, exact-subject owner artifact. Missing, stale, self-issued, or mismatched input blocks with no authorization inference.
11. Mint plan Work invokes the Mint plan port and returns a no-write plan ref.
12. Casting-authorization gate imports a distinct owner artifact bound to the plan/target tuple.
13. Preinstall attestation Work validates exact staged subjects.
14. `Command<MintApplyRef>` invokes at most one Mint adapter. Kernel attempt/retry bookkeeping remains separate from Mint’s write-ahead effect journal and recovery classification.
15. Mint returns a transaction-receipt ref. The structural event records only its accepted reference.
16. Observation is separately commanded and recorded. An installed transaction plus failed observation remains exactly that pair.
17. Postinstall attestation and cold interpretation emit their own artifact refs.
18. Root terminality is evaluated under explicit Foundry-owned terminal/gate contracts; RWO status projection remains derived and non-authoritative.
19. Historical replay rebuilds cursor and case projection with zero adapter/effect calls. New revalidation is a new addressed command/run or attempt, not replay.

### Collisions and missing types

| Collision/gap | Required repair |
|---|---|
| `ConstitutionCase` versus `WorkRun` | Add explicit `case_ref` relation; never reuse IDs or lifecycles. |
| `CaseReducer` versus routing cursor/status projection | Type their subjects and owners separately; prohibit projection-created domain facts. |
| `CF-RUNTIME` versus RWO scheduler/journal | Retain one root scheduler and one accepted journal; Foundry supplies domain adapter and reducer only. |
| Backend completion versus semantic success | Define `BackendReportRef` and separate `ArtifactAdmissionVerdict`; retain native status algebra. |
| Structural quorum versus completeness | Completeness must be explicit Foundry gate Work over obligations, profiles, and reports. |
| Work terminal versus ratified/authorized/installed/observed | Closed schemas must forbid these equivalences. |
| Work `Attempt` versus Mint transaction/effect attempt | Separate identifiers, journals, retry policies, and recovery terminals. |
| Redelivery/retry/repeat/rework/replay/recovery | Carry distinct reason/type fields and owner policies; do not infer one from another. |
| Parentage versus authority inheritance | Authority refs must be exact per Work and per effect; no transitive inheritance. |
| Event versus receipt | Event payload should contain immutable artifact refs and admission evidence, not silently become the artifact. |
| Replay versus revalidation | Add explicit execution mode with zero-call historical replay invariant. |
| Private/public boundary | Public kernel definitions can carry opaque IDs/digests only; private goals, prompts, native source paths, and Foundry prose must not be persisted publicly. |
| Owner schemas | Still needed for minimum authority ref, artifact admission, effect verdict, journal acceptance, executor-adapter ownership, recovery/budget, confirmation, compiler, validator, and conformance. `[P-FORM-GATE:1; BASE:205-242]` |

### Candidate `FoundryWorkAdapter`

```text
type FoundryCaseRef = {
  case_id,
  case_schema_version,
  case_digest
}

type FoundryStageInputRef = {
  case_ref,
  artifact_refs[],
  authority_refs[],
  expected_definition_digest,
  execution_mode: "new" | "resume" | "historical_replay"
}

interface FoundryWorkAdapter {
  compileCaseGraph(
    caseRef: FoundryCaseRef,
    authoredGraphRef: ArtifactRef
  ) -> Candidate<CompositeWorkDefinitionRef>

  preparePortCall(
    command: Command<FoundryStageInputRef>,
    acceptedHistoryCut: JournalCutRef
  ) -> PreparedCall | TypedBlock

  validateReturnedArtifact(
    call: PreparedCall,
    returned: OpaqueArtifactRef
  ) -> ArtifactAdmissionVerdict

  toStructuralEvent(
    verdict: ArtifactAdmissionVerdict
  ) -> EventCandidate<OpaqueArtifactRef>

  deriveCasePosture(
    admittedFoundryArtifacts: OpaqueArtifactRef[]
  ) -> FoundryCasePosture
}
```

Contract limits:

- `compileCaseGraph` authors structural syntax only; it does not adopt ontology or authorize execution.
- `preparePortCall` chooses at most one declared port and cannot mint authority.
- `validateReturnedArtifact` validates identity/schema/digest/subject compatibility, not backend semantics beyond the selected owner contract.
- `toStructuralEvent` cannot label an event ratified, authorized, installed, or observed unless it carries the exact separately owned artifact—and even then the event only references that artifact.
- `deriveCasePosture` is pure and separate from kernel cursor/status projection.
- Historical replay must return zero port calls.
- Mint calls require exact plan, authorization, target pre-state, and accepted-authority refs; Mint remains effect/recovery owner.

This interface location and schema are candidates only. Executor-adapter and ontology owners remain unresolved.

### Proof ceilings and blockers

1. RWO remains proposal-only; the accepted parent research observed an implemented control-plane/journal/protocol environment, not the recursive Work kernel. Only protocol compilation was freshly executed in that earlier research. `[BASE:3-35,56-86]`
2. The newer composition-form result is candidate-only; ontology mutation and its 28-row scenario matrix remain unapplied/unexecuted. `[P-FORMS:0-2]`
3. The Foundry architecture and reference casting are design evidence only. No solver, Mint runtime, target, or real authority owner executed. `[CF-R:81-93; CF-D:353-355]`
4. Package review verdict remains `FIX; block implementation entry`, with defects covering route prerequisites, evidence bindings, ambiguous negatives, validator ownership, durable Mint recovery, exact owner artifacts, source-anchor resolution, and closure. `[CF-REV:3-22,24-114,193-197]`
5. Current Result and Work-Pack hash drift prevents exact packet closure. Their apparent repairs cannot be credited without a refreshed digest/receipt chain.
6. No FoundryWorkAdapter, recursive compiler/reducer, event schema, owner-authorized authority reference, or integration fixture exists in reviewed evidence.
7. Target runtime suites were not run in this dispatch, and the packet records missing pinned FastAPI support in the parent environment.
8. This mapping establishes neither adoption nor implementation, authority, ontology promotion, publication, deployment, release, production readiness, or external-effect permission.

---

> Parent preservation note: the complete explorer return below is preserved verbatim. It is preliminary evidence only and does not supersede the source-drift gate.

## Conformance explorer return

### Bottom line

The smallest safe integration is a private, stateless `FoundryWorkAdapter` behind the proposed generic `ExecutorAdapter` seam, invoked once per Foundry command. A private Foundry-owned compiler may project an admitted `Author → Prove → Decide → Cast` case into generic recursive Work syntax. The kernel may route commands, accept structural events, derive a cursor, and correlate attempts; it must not interpret Foundry artifacts, decide semantic success, ratify, authorize casting, execute Mint policy, classify Mint recovery, or turn projections into domain truth.

No such integration exists in the reviewed evidence. The current orchestrator implements a specialized control-plane/evidence runtime, while recursive Work, its composition compiler/reducer, and Foundry integration remain proposal-only or absent.

### Evidence-closure blocker

Two selected private files no longer match their packet bindings:

| Source | Packet SHA-256 | Current SHA-256 | Consequence |
|---|---|---|---|
| `CF-RESULT` | `c7fc71995d52a21090b82009b61b4638a42791959280cc10c9308608a19b4511` | `ca45367a8c03cc47273648243bcc2777fb4bb7715c8568eebdc0f4c40e171109` | unresolved; unusable as substantive evidence |
| `CF-WORK-PACK` | `b1268a430670ad7ab0882ddbd16e688e1dabe468bd86ae83626cc77d6a49f88b` | `5ffd6be3615bc728685e82fb9f4eeb7d0d08b4f2a3cd9d34c5d6d3827da9edc8` | unresolved; unusable as substantive evidence |

Both are untracked. I did not silently rebind them or use their current contents for findings. `CF-DESIGN`, `CF-PACKAGE-REVIEW`, the accepted parent findings, and the final audit match their packet hashes. Every dependency on `CF-RESULT` or `CF-WORK-PACK` remains evidence-closure-blocking.

The matching package review still says `FIX; block implementation entry` and records twelve surviving route, binding, fixture, validator, recovery/journal, owner, and wording defects. No permitted matching source proves those defects closed. [Package review lines 3–22, 24–114, 193–198.]

### Implementation / proposal / delta matrix

| Surface | Proven status | Required Foundry/RWO delta |
|---|---|---|
| Host-seat binding and bound launch-plan compilation | Observed at the accepted tracked baseline; current detailed tests unverified | Reuse confirmation and bound-address precedent. Do not treat host binding as permission or authority. |
| Deterministic protocol compiler | Earlier executed slice: 13/13 tests at the accepted baseline | It is not a recursive Work compiler. Add an immutable composition compiler with closed node/form schemas, deterministic expansion, digest binding, and rejection of nested orchestrators. |
| ACI-oriented journal | Observed hash-chained acceptance, idempotency/conflict handling, heads, groups, and receipts; current tests unverified | Extend through an owner-approved generic event schema and acceptance bridge. Preserve one orchestration journal; do not create a Foundry lifecycle journal. |
| Specialized command/event delivery | Observed | Add generic addressed Work command/event envelopes and adapter conformance. Transport and journal acceptance must remain non-semantic. |
| APT/UI projections | Observed and rebuildable | They are not the proposed RWO routing cursor and cannot become Foundry state. Add a separate structural cursor reducer. |
| Operator recovery | Observed verify/backup/retire only | It is not Work retry/replay or Mint effect recovery. Keep these mechanisms distinct. |
| `WorkDefinition`, `CompositeWorkDefinition`, `WorkRun`, `Attempt` | Proposal-only | Adopt versioned schemas and runtime semantics before use. A run/attempt may not change graph or authority basis. |
| Composition form | Candidate decision/result only; ontology delta unapplied; scenario matrix unexecuted | Implement compiler and reducer only after owner/schema admission; execute the full scenario matrix, including late arrivals, loops, joins, and negative forms. |
| Recursive cursor/reducer | No implementation evidence | Implement deterministic reduction from accepted structural events only, with schema/reducer-version pins and rebuild proof. |
| Foundry Case protocol/reducer/runtime | Matching design only; implementation absent | Implement privately. Its reducer consumes Foundry artifact references and remains separate from the kernel cursor. |
| Backend adapters | Design contracts only | Pin each backend/profile/version/trusted base and preserve native `unsupported`, `unknown`, `timeout`, translation, proof, and counterexample statuses. |
| Ratification and casting authorization | External-owner artifact design | Import and validate exact owner artifacts; never synthesize or inherit them from Work parentage. |
| Mint planning/effects/recovery | External Mint owner; no executable evidence selected | Use Mint’s no-write plan and effect adapter. Add a distinct Mint-owned write-ahead attempt journal, not a second orchestration journal. |
| Foundry artifact sink | Owner unbound | Select an existing owner, retention, access, privacy, concurrency, and idempotency contract before durable integration. |
| Foundry/RWO end-to-end conformance | Absent | Implement and execute the positive and negative fixtures below. |

Evidence: accepted findings lines 56–74, 76–93, 107–125, 184–203; packet selectors `RWO-DESIGN`, `RWO-COMPOSITION-FORM-RESULT`, `RWO-COMPOSITION-OWNER-GATE`, `ORCHESTRATOR-AS-BUILT`; matching Foundry Design lines 126–134, 147–206, 208–290, 314–335, 373–409.

### Smallest transport-neutral seam

The whole Foundry case must not be placed behind one opaque adapter call; that would make Foundry a nested scheduler. Instead:

1. A private `FoundryPlanCompiler` maps one immutable, owner-admitted Foundry workflow specification to generic `WorkDefinition`/composition syntax.
2. The RWO compiler validates and expands only structural syntax.
3. Each leaf invokes one private `FoundryWorkAdapter`.
4. The adapter derives the current Foundry posture from a verified artifact/journal cut, validates one command, invokes at most one declared owner port, persists or recovers the owner artifact through the selected sink, and returns an opaque artifact reference.
5. The RWO journal accepts a structural event referencing that artifact.
6. The RWO cursor routes structurally; the Foundry reducer separately interprets domain artifacts.

Candidate interface, not an adopted schema:

```text
invoke(
  definition_digest,
  expanded_plan_digest,
  work_run_id,
  node_id,
  attempt_id,
  delivery_id,
  case_id,
  foundry_command_ref + digest,
  accepted_journal_cut + digest,
  input_artifact_refs + digests,
  declared_authority_refs,
  adapter_profile + version
) -> {
  invocation_disposition,
  output_artifact_ref + digest?,
  domain_outcome_schema_ref?,
  idempotency_receipt,
  diagnostics_ref?
}
```

Constraints:

- No native source prose, private paths, authority interpretation, or artifact bodies enter the public kernel contract.
- Kernel authority checks are structural—declared reference, schema identity, digest, and acceptance binding. Subject validity, freshness, conditions, and permission remain owner/adapter decisions.
- A domain block, owner rejection, backend `unknown`, Mint recovery result, or observation failure is normally a successfully returned typed domain artifact, not an infrastructure failure.
- Structural release means only “the declared structural predicate matched an accepted typed event.” It never means proven, ratified, authorized, installed, observed, promoted, or true.

### Required conformance deltas

| Area | Minimum delta |
|---|---|
| Compiler | Closed composition AST; deterministic IDs/order/digest; source mapping; bounded repeats; total port/event validation; separate compile/reject outcomes; no dynamic hidden expansion; reject nested orchestrator authority and inherited child authority. |
| Schemas | Generic Work definition/run/attempt/command/event/acceptance contracts plus private Foundry binding/command/outcome references. Domain schemas remain private and independently owned. Unknown major versions fail closed. |
| Events | Distinguish delivery, attempt lifecycle, adapter return, artifact acceptance, structural release/block, and root terminal. No structural event name may encode semantic or authority success. Exact vocabulary remains owner-unverified. |
| Reducers | One RWO structural cursor reducer and one Foundry Case reducer. Both deterministic and version-pinned, but over different subjects. Neither projection writes authoritative facts. |
| Journal | Reuse one accepted orchestration journal. Require content-addressed artifact references, identical-duplicate acceptance, divergent-identity conflict, causal links, and reconstruction from a verified cut. |
| Artifact/journal crash seam | Artifact commit must be idempotently discoverable by command key. If a crash occurs after artifact commit but before structural event acceptance, redelivery re-emits the same artifact reference without re-invoking the effect. |
| Mint journal | Separate, Mint-owned write-ahead effect journal with stable effect IDs, write-before-effect ordering, outcome records, bounded persistence claims, and recovery evidence. This is effect truth, not a second scheduler journal. |
| Idempotency | Identical redelivery of one `delivery_id`/attempt returns the prior receipt; divergent content conflicts. A new attempt needs explicit retry policy. A changed definition, plan, authority subject, or input digest requires a new command generation/run, not redelivery. |
| Replay | Historical replay uses the original accepted cut and pinned reducer/schema versions with zero backend, authority, Mint, target, or network calls. It cannot refresh evidence. |
| Revalidation | Current-state revalidation is a new addressed run/command generation with new digests and owner acts. It is not replay or resume. |
| Attempts | Address run, node, attempt, predecessor attempt, delivery, input cut, and retry-policy ref separately. Stale attempts cannot publish release events. |
| Failures | Keep transport/protocol fault, domain block, authority rejection, backend partiality, Mint recovered/manual recovery, and observation failure distinct. Manual recovery suppresses further target-effect eligibility until a Mint-owner resolution artifact exists. |
| Conformance | Compiler matrix, reducer replay, duplicate/divergent delivery, crash-window reconciliation, attempt staleness, failure taxonomy, private-data envelope checks, and the fixtures below. |

### Finite positive fixture

`CF-RWO-P1 — garden-club single-root reference casting`

Frozen inputs:

- One private Foundry case with exact native-source and candidate digests.
- Six obligation IDs with deterministic fake profiles preserving Cedar/Lean/Datalog/bounded-solver ceilings.
- Separate exact ratification and casting-authorization fixtures.
- One no-write Mint plan bound to package, target identity, target pre-state, conditions, and expiry.
- Fresh temporary target; deterministic two-effect Mint double.
- Pinned kernel/compiler/reducer/adapter schema versions.

Acceptance:

1. Compile the same private mapping twice; generic definition, expanded plan, node IDs, and digests are byte-identical.
2. Separately confirm/bind the compiled plan; compilation itself does not select or run it.
3. Start one root `WorkRun`; no child owns an orchestrator or inherits authority.
4. Execute Author/compile, obligation-specific Prove fan-out, domain-owned aggregation/gate, route assessment, external ratification import, Mint no-write planning, external casting-authorization import, preinstall validation, Mint apply, observation, attestation, and cold interpretation.
5. Every leaf has one addressed attempt and at most one adapter call.
6. The orchestration journal contains only structural events plus opaque content-addressed artifact refs.
7. Foundry reduction yields the expected case posture; RWO reduction yields the expected structural terminal; neither reducer substitutes for the other.
8. Before/after target digests, transaction receipt, observation artifact, and cold interpretation are exact.
9. Replay both reducers from the accepted cut with all external ports configured to fail on call; outputs and digests match and external-call count is zero.

This extends the matching Design’s planned significant scenario and witness contracts; it is not executed evidence. [Design lines 349–355 and 373–394.]

### Discriminating negatives

| ID | Mutation | Required result |
|---|---|---|
| `N-STale-AUTH` | Change candidate digest, target pre-state, expiry, or authority subject after the owner artifact | Typed stale/mismatch artifact; zero Mint plan/apply calls; no kernel authority refresh. |
| `N-WRONG-PLAN` | Change one byte of the no-write plan after casting authorization | Authorization validation blocks before apply; zero target effects. |
| `N-BACKEND-PARTIAL` | Route a required recursive obligation only to Cedar, or return `unsupported`/`unknown` for its admitted profile | Aggregator remains incomplete/blocked; arrival count or structural quorum cannot release Decide/Cast. |
| `N-DUPLICATE-IDENTICAL` | Deliver the identical command/event twice with the same identity and bytes | Same acceptance/idempotency receipt; one adapter invocation and one effect sequence. |
| `N-DUPLICATE-DIVERGENT` | Reuse the same delivery/event identity with changed bytes or digest | Journal conflict; no reducer advance and no second invocation. |
| `N-OBSERVATION-FAIL` | Mint applies successfully; observer returns an error | Casting remains installed while observation is failed/residue. No inferred rollback and no rewriting transaction outcome. |
| `N-RECOVERED` | Inject effect-2 failure; rollback succeeds | Exact terminal `recovered`; never `installed`. |
| `N-MANUAL-RECOVERY` | Inject effect-2 failure and rollback failure | Exact terminal `manual_recovery_required`; downstream effects stop until Mint-owner resolution. This must be a separate fixture from `N-RECOVERED`. |
| `N-REPLAY-NOT-REVALIDATE` | Replay old accepted history while present authority/target/backend state differs | Historical result reproduces with zero external calls; current-state validation requires a new run and new owner bindings. |
| `N-NESTED-AUTHORITY` | Put an orchestrator node inside a composite or let a parent authority ref satisfy child ratification/casting requirements | Compiler rejects before run start; zero adapter/effect calls and no inherited authority. |

### Executable future acceptance sequence

1. Recreate evidence closure: select exact `CF-RESULT` and `CF-WORK-PACK` bytes, update packet hashes through the owning route, and obtain a new whole-package review proving every surviving finding closed.
2. Obtain exact constitution-protocol, authority-subject, runtime/root, artifact-sink, journal/event, compiler/reducer, Mint, fixture, and privacy-owner acceptances.
3. Freeze generic RWO schemas and private adapter schemas with positive, unknown-version, stale-digest, duplicate-key, nested-authority, and forbidden-form fixtures.
4. Execute deterministic compiler golden tests plus the complete composition-form scenario matrix.
5. Execute journal acceptance, identical/divergent duplicate, artifact/event crash-window, stale-attempt, and cursor-rebuild tests.
6. Execute Foundry Case reducer transition and replay tests independently of the RWO cursor.
7. Execute one-adapter-per-command tests using deterministic backend and authority fixtures, asserting zero-call branches.
8. Execute Mint write-ahead, crash-before/after-each-effect, resume, recovered, and manual-recovery fixtures.
9. Execute `CF-RWO-P1` and all negatives above in fresh isolated temporary targets.
10. Run the target repository’s owner-pinned, dependency-complete host-binding/protocol/journal suite; the exact current command remains unresolved because target dependencies were incomplete and direct target inspection was forbidden.
11. Run private-data envelope checks proving no source prose/private paths enter public source, manifests, prompts, or journal fields.
12. Independently rebuild both projections from a verified cut, compare digests, audit call counts/write sets, and issue a conformance receipt. Only then may an owner decide whether implementation entry is admissible.

### Explicitly unverified

- Current target source behavior beyond the parent-observed packet snapshot.
- Current target runtime suites; the packet says the pinned FastAPI dependency was unavailable.
- Recursive Work schemas, compiler, reducer, cursor, run/attempt runtime, replay bridge, and conformance.
- Composition-form ontology adoption and its planned scenario matrix.
- Any Foundry runtime, adapter, backend execution, Mint execution, real owner act, or target effect.
- Closure of any package-review finding.
- Exact event vocabulary and owner schemas.
- Artifact-sink ownership and artifact/journal crash reconciliation.
- Mint’s current concrete adapter and durability contract.
- Private-data classification/scrubbing behavior.
- End-to-end integration, promotion, publication, deployment, release, or production readiness.


