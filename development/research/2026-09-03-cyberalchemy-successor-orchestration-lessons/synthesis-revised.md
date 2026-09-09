## Revised evidence-bound synthesis

This repair changes only synthesis claims and integration-boundary definitions. It adds no evidence, selects no alternative, and resolves no owner-controlled decision.

Inventory lookup readiness remains **blocked**: the owner Inventory failed source/projection conformance; the external, RWO, and CA2 targets expose no usable target machine Inventory; selected records remain degraded discovery leads; excluded records remain excluded. Dirty RWO claims remain bound to current per-file hashes, not HEAD alone.

### Evidence-status taxonomy

Each status applies only to the proposition named beside it:

- `SOURCE_INSPECTED`: current prose or implementation source was read. It proves the bytes and declared behavior exist, not that behavior executed.
- `TEST_INSPECTED_NOT_RUN`: test code was inspected. It proves a test case exists, not that it passes.
- `RECEIPT_INSPECTED`: a result receipt was inspected. It supports only the receipt’s bounded historical claim and environment.
- `TRACE_OBSERVED`: an event/run trace was inspected. It supports the transitions visible in that trace, not portability or recurrence.
- `EXECUTED_THIS_DISPATCH`: the explorer directly ran the named check. It supports only that check, fixture, environment, and result.
- `PROJECTION_INSPECTED`: a generated graph or ontology was inspected. It is deterministic candidate evidence, never authored source or authority.
- `UNVERIFIED`: design prose, proposed fixture, unsupported environment behavior, or a claim exceeding the inspected evidence.

No mechanism is proven production-deployed.

### Shared identity and cardinality vocabulary

These are comparison definitions, not a claim that every system implements every type:

| Type | Definition and cardinality |
|---|---|
| `SemanticWork` | One immutable meaning/version of an objective and its governed work graph. It may authorize zero or more runs only through separate decisions. Meaning-changing bytes create a new identity. |
| `Dispatch` | One immutable execution envelope compiled from a selected `SemanticWork` version. One Dispatch may have zero or more Runs; it is never reconciled or mutated after issue. |
| `Run` | One orchestration lifecycle for one Dispatch. It may contain many actions/nodes and attempts. A new Run does not silently inherit acceptance or effect authority. |
| `Action` / `Node` | One bounded responsibility within a Run. One action may have zero attempts if host admission fails before binding, or multiple attempts under an authorized retry policy. |
| `Attempt` | One try to admit or execute one action. Every retry/resume receives a distinct attempt identity while preserving the immutable semantic-work/action identity. |
| `TaskSession` | DomainSpec’s fresh execution context for exactly one admitted SWU attempt, with at most one terminal receipt by current contract. It is not universally equivalent to a Run. |
| `Invocation` | One provider/agent call within an attempt. It may be absent for pre-agent failure and must not be fabricated. |
| `Receipt` | An issuer-typed statement with an explicit claim ceiling: host observation, executor result, validator result, closeout decision, or acceptance decision are different receipt types. |
| `JournalAdmittedEvent` | An event admitted by the selected history owner. Journal admission is not owner acceptance, lifecycle closeout, effect authorization, or promotion. |

### Event, state, invariant, and decision separation

- **Events:** pre-agent host-admission failure, execution result arrival, cancellation request, cancellation acknowledgement, deadline observation, and late-result arrival.
- **States:** blocked dependency, impossible join, cancellation pending, cancelled, effect unknown, late result quarantined, closeout blocked, and terminal run state.
- **Invariants:** a successful sibling result remains preserved; an impossible join releases no successor; one attempt yields at most one terminal receipt; journal cursor and emitted command set remain consistent; quarantined results cannot alter official state.
- **Owner decisions:** route decision, authority grant, owner binding, execution admission, effect authorization, waiver/degradation decision, closeout decision, acceptance, and promotion.

A reducer may validate, apply, duplicate-detect, or refuse an owner-issued decision/event. It may not decide that a gate applies, issue authority, waive required evidence, accept work, or authorize an effect.

### Normalized comparison matrix

| Dimension | External infrastructure, pinned `33a17d…` | RWO, dirty HEAD `4821a8…` | CA2 implementation, parent HEAD `dc681a…` | DomainSpec control loop |
|---|---|---|---|---|
| Work unit | Task → graph → Dispatch → Run → Agent Node; candidate model. | Closed graph; journal-admitted event reduced to transition and at most one command intent. | Compiled DAG/composite, host transition, executor action, repository-effect boundary. | Craft node → finite work-pack frontier → one fresh Task Session per SWU attempt. |
| Decisions/authority | Graph intended as authority envelope; no-approval mode conflicts with exact confirmation binding. | Explicitly does not authorize, execute, admit events, or own retry policy. | Exact bindings constrain execution; repository promotion still requires a separate effect authorization. | Plan, audit, human authority grant, execution admission, closeout, acceptance, and promotion are separately owned. |
| State/identity | Rich task/node/run/invocation/attempt/command/delivery/artifact distinctions. | Event, cursor, command, run, and attempted agent binding; schema gap for pre-agent failure. | Event, cursor, command batch, node, run, attempt, replay/history state. | Epoch, semantic/SWU digest, Task Session, attempt, cursor, blocker fingerprint, terminal and closeout receipts. |
| Scheduling/dependency | Rich relation facets; scheduler freedom asserted without schedule-equivalence evidence. | Reduction core; retry/cancel scheduling outside frozen kernel. | Local extension implements `all`/`any`/quorum, impossible-join state, bounded retry, deadline cancellation. | Deterministic serial frontier, unique successor, finite budget; concurrent branches unproved. |
| Evidence | Producer facts, checkpoints, bounded unknowns, SQLite probe; main experiment invalidated by unobservable freeze ordering. | Historical partial-wave trace and durability candidate in owner-controlled untracked bytes. | Authored source, bindings, Rust source/tests, receipts, and non-authoritative projections. | Append-only receipts and chain records; projections and telemetry remain non-authoritative. |
| Failure/recovery | Joins, waiver, resume, and official-result eligibility remain untyped. | Trace preserves two siblings after third pre-agent failure, but sidecar repair was needed to express terminal blocking. | Source/tests cover impossible joins, replay conflict, retry, and deadline; integrated partial-wave and durable restart unverified. | Contract routes mapped preflight defects before mutation and execution residue to Task Session; observed research records delayed detection and Refresh amplification. |
| Context | Required/optional/forbidden inputs described; model use not demonstrated. | Complete portable isolation contract absent. | Local scope/toolchain/digest controls; delivery and model quality unverified. | Exact SWU context and fresh session provide logical scoping, not actor/process isolation. |
| Cost | 1,288 files and multi-MB experiment residue; capture can dominate work. | Sidecar governance repair added paths after schema failure. | Binding/digest/receipt surfaces reduce ambiguity but add machinery. | Serial audit, hashing, admission, session, refresh, join, and closeout overhead. |
| Ceiling | No production runtime. | Historical/local candidate only. | Bounded local implementation; no fresh Shannon rerun or production journal. | Contractual readiness; 19 fixtures unexecuted. |

### Revised claim ledger

| Proposition | Source/selector and return | Evidence status |
|---|---|---|
| Authority-preserving compilation is a declared rule. | Turing; external `research/agent-invocation-and-collaboration-topology/findings.md:23-30`. | `SOURCE_INSPECTED`; behavior `UNVERIFIED` |
| External identity/cardinality and bounded-unknown probe mechanisms exist. | Turing; `criterion.md:20-75,109-138`; `probe/store.py:16-93,115-145,160-194,307-318`. | `SOURCE_INSPECTED`; projector 3/3 and replication 11/13 are `EXECUTED_THIS_DISPATCH` only for their fixtures |
| External production orchestration exists. | Turing; absent runtime imports and experiment `INVALID`, `findings.md:3-21,99-110`. | `UNVERIFIED`; production claim rejected |
| Third-action host admission failed before agent binding. | Shannon; `HOST-SPAWN-FAILURE-0003.json` `1cd8a3…`. | `TRACE_OBSERVED` |
| Two sibling results survived and terminal `run_blocked` prevented dependent work. | Shannon; events `dd216d…`, closeout `9ea123…`, final validation `cf5168…`. | `TRACE_OBSERVED` |
| CA2 source contains structural joins, impossible-join blocking, retry, deadline, and replay guards. | Shannon; `dag.rs` `0bfc89…`, `host.rs` `2fd513…`; tests `1d1475…`, `ea5785…`, `e21ebb…`. | Source `SOURCE_INSPECTED`; tests `TEST_INSPECTED_NOT_RUN` |
| CA2 conformance/ETL artifacts report bounded passes. | Shannon; conformance `afbaac…`, ETL `fa3ef6…`. | `RECEIPT_INSPECTED`; not fresh execution |
| Generated CA2 graphs/ontologies prove source or authority. | Shannon projection hashes. | `PROJECTION_INSPECTED`; authority claim rejected |
| Atomic event, cursor, and complete command-batch persistence is an authored/bound requirement. | Shannon; bounded DomainSpec `ac3044…`, bindings `f202ba…`, host `2fd513…`. | `SOURCE_INSPECTED`; production journal behavior `UNVERIFIED` |
| DomainSpec contracts separate execution, closeout, chain completion, and promotion. | Hewitt; task-session loop `2528c3…`, Goal `874ce5…`, invoke findings `ba7393…`. | `SOURCE_INSPECTED`; end-to-end behavior `UNVERIFIED` |
| Fresh Task Session proves process isolation. | Hewitt. | `UNVERIFIED`; claim rejected |
| Controls reduce cost universally. | Turing counts; Shannon OEW ≥56 governance path-writes versus 28 runtime writes; Hewitt serial-cost analysis. | Local observations only; universal benefit `UNVERIFIED` |

### First-knows / first-reports timeline

| Surface | First knows | First report | Residue |
|---|---|---|---|
| External compiler/provider | Compiler could know malformed graph; provider observation could know delivery failure. | Producer fact/checkpoint/validation. | Runtime absent; schedule/freeze facts can remain unknowable. |
| RWO host/driver | Host knows pre-agent spawn failure. | Sidecar artifact → validation BLOCK → terminal `run_blocked`. | Driver schema delayed lawful journal representation. |
| CA2 compiler/reducer/executor | Compiler knows malformed graph; reducer knows impossible join; host knows failure/deadline/history conflict. | Typed transition and intended atomic history append. | Integrated native partial-wave and crash recovery unverified. |
| DomainSpec mapped owners | Existing defect-class map should identify plan/readiness omissions; Task Session knows live/runtime failure; closeout owner knows evidence mismatch. | Audit/admission blocker, terminal receipt, closeout decision. | Where the map has no accountable owner, report `OWNER_UNRESOLVED`; do not infer an “earliest owner.” |

### Mechanism–owner–store–duplicate disposition

These are alternative-dependent mappings, not selected assignments:

| Mechanism | Canonical owner requirement | Existing registry/store | Duplicate retired if adopted |
|---|---|---|---|
| Route decision | Existing router owner | Immutable route-decision record | Free-form conversational routing |
| Authority/effect grant | Human/Decision Gate or other already designated authority owner | Digest-bound decision artifact | Reducer-issued or receipt-implied authority |
| Owner binding/admission | Existing capability/execution owner | Dispatch/selection record | Scheduler-created owner identity |
| Scheduling/frontier | Exactly one of DomainSpec finite-frontier supervisor or CA2 DAG scheduler | Chain record or DAG state, according to selected boundary | Second concurrent control loop; Goal may route Craft promotion but must not schedule SWU attempts |
| Journal admission | One `AcceptedHistoryPort` owner; physical owner unresolved | RWO/CA2 event journal candidate | Sidecar event histories and adapter-local event registries |
| Dispatch registration | One existing registrar; exact owner unresolved | Existing dispatch ledger/registry | Per-adapter registrar |
| Execution evidence | Executor/validator issuers | Typed receipts | Event journal masquerading as evidence acceptance |
| Closeout/acceptance/promotion | Their existing separate owners | Owner-issued decision records | Generic PASS/status fields granting successor states |
| Inventory/provenance | Inventory/evidence owner | Inventory plus tiered evidence stores | Full-fidelity duplicate provenance capture |
| Cancellation/late result | `OWNER_UNRESOLVED` pending owner selection | No complete current store | No retirement claim until owner/store selected |

RWO one-intent versus CA2 command batches remains unresolved. A viable boundary must prove that a batch is either multiple independently identified reducer outputs or host-layer aggregation outside the frozen one-event/one-intent contract; it may not silently reinterpret the contract.

### Build-from-owned constraints and typed negatives

Build-from-owned candidates are authority-free sequencing/reduction, separated lifecycle truths, semantic/run/attempt identities, mapped preflight versus runtime residue, structural joins, and tiered provenance. Their benefits remain hypotheses until common fixtures and cost thresholds execute.

Typed negatives:

`ROUTE_DECISION ≠ AUTHORITY_GRANT ≠ OWNER_BINDING ≠ EXECUTION_ADMISSION ≠ EFFECT_AUTHORIZATION`;  
`JOURNAL_ADMISSION ≠ OWNER_ACCEPTANCE`;  
`OUTPUT ≠ COMPLETION ≠ VALIDATION ≠ CLOSEOUT ≠ ACCEPTANCE ≠ PROMOTION`;  
`PROJECTION ≠ SOURCE`; `EVENT ≠ STATE ≠ INVARIANT ≠ DECISION`;  
`REPLAY ≠ RETRY ≠ RERUN ≠ RESUME`;  
cancellation request ≠ cancellation acknowledgement; retry ≠ compensation; fresh session ≠ process isolation; bounded local PASS ≠ production readiness.

### Integration-boundary alternatives

#### A. Serial lifecycle spine

DomainSpec’s finite frontier remains the sole SWU scheduler; CA2 mechanics execute one admitted SWU attempt.

- **Retained owners:** Plan, WPRA, authority grant, Task Session admission/execution, closeout, acceptance, Craft promotion.
- **Required boundary:** Goal routes Craft-frontier promotion only; it does not overlap Task Session Until Blocker’s SWU scheduling.
- **Retired duplicates:** generalized concurrent scheduler, recursive conversational continuation, adapter-local history.
- **Unresolved:** one durable-history owner, physical journal, cancellation owner, unknown-effect terminal owner.
- **Migration risk:** serial overhead, crash recovery, receipt/event collapse.
- **Falsifier:** after a crash or uncertain command delivery, the spine cannot resume without duplicate effect, immutable-Dispatch mutation, or renewed authority not required by semantics.

#### B. Owner-decision reducer hypothesis — `KILLED_AS_WRITTEN`, conditionally researchable as B′

The prior “event-sourced graph core with owner gateways” is killed because it permits circular authority and coexistence with prior control planes.

B′ is only a hypothesis if:

1. owner-issued immutable route, authority, admission, waiver, closeout, and effect decisions are reducer inputs;
2. the reducer may validate/apply/refuse them but never determine gate applicability or authority;
3. exactly one scheduler, one `AcceptedHistoryPort`, one registrar, one gateway-failure owner, and one migration owner replace—not coexist with—prior mechanisms;
4. uncertain delivery/command/effect state is reconciled; the immutable Dispatch is never reconciled or rewritten;
5. the one-intent/batch boundary receives a non-collapse proof.

Until those owners are selected and the boundary is witnessed, B remains killed as an implementation candidate.

- **Falsifier:** crash-boundary traces lose commands, duplicate effects, release an impossible join, or show the reducer originating an owner decision.
- **Decision gaps:** physical journal/fencing, canonical scheduler/registrar, gateway-failure classification, migration owner.

#### C. Minimal protocol over certified host executors

Immutable Dispatch, shared identity/event vocabulary, typed receipts, and owner joins are common; scheduling remains host-specific.

- **Retained owners:** existing router, authority, host executor, evidence, closeout, acceptance, and promotion owners.
- **Adapters:** representation mappings only; they cannot add states, decisions, authority, event/evidence registries, or scheduling semantics.
- **Retired duplicates:** universal scheduler claim, shared actor-runtime claim, adapter-local registrars/journals.
- **Unresolved:** host-certification owner, conformance floor, portable schedule invariants, provenance budget.
- **Falsifier:** two certified hosts produce authority-relevant state differences for the frozen trace, or an adapter cannot represent pre-agent failure/cancellation without fabricated identity.

C is reuse/composition, not claimed novelty.

No alternative is selected.

### Smallest future witness suite

First freeze one common trace contract covering these surfaces: compiler, route/authority decision input, scheduler/frontier, host/executor, journal, validator/evidence, closeout, acceptance/promotion, and adapter representation. Adapters may map representation only.

Seven fixtures are the smallest current set covering the admitted objections:

1. **Happy join and replay:** two children, terminal join, duplicate/divergent duplicate, restart at every append boundary.
2. **Mapped preflight blocker and forbidden context:** missing deterministic binding names an accountable owner or `OWNER_UNRESOLVED`; forbidden bytes never reach execution.
3. **Partial wave:** two sibling results plus one pre-agent failure; preserve results, enter impossible-join/blocked state, release no successor.
4. **Stale decision/evidence:** mutate one decision-bound byte and one unrelated ambient byte; invalidate only intersecting dependencies.
5. **Feedback and continuation:** blocked gate → owner-authorized repair → new evidence → novel continuation segment → successful closeout; unchanged blocker/evidence cannot loop.
6. **Cancel, unknown effect, quarantine, resume:** request, acknowledgement or explicit `effect_unknown`, owner-labelled terminal state, late-result quarantine, owner-authorized new attempt with stable semantic identity and distinct attempt identity.
7. **Execution/closeout/promotion plus cost:** execution PASS, closeout BLOCK, repair/`NO_OP`, separate acceptance/promotion decisions; compare predeclared runtime-action, governance-write, decision, refresh, latency, and storage baselines against owner-selected thresholds.

The observed RWO partial-wave trace covers only part of fixture 3. CA2 tests/receipts are inspected but not rerun. Successful happy join, stale decision, successful feedback continuation, cancellation acknowledgement, late-result quarantine, durable resume, forbidden-context enforcement, cross-host equivalence, and all cost thresholds remain `UNVERIFIED`.

The research ceiling remains unchanged: no successor Product Capability, canonical definition, ontology, implementation, acceptance, publication, release, deployment, or external effect is established or authorized.
