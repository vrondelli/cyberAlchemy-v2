## Evidence-bound synthesis

Status vocabulary:

- **Executed**: directly rerun by an explorer in this dispatch.
- **Observed**: current code, immutable source, test, receipt, or historical trace was inspected, but not rerun.
- **Unverified**: prose contract, generated projection, proposed fixture, or unsupported environment claim.

Inventory lookup readiness remains **blocked**: the owner Inventory failed source/projection conformance, all target machine indexes were unavailable or absent, and its four selected records are degraded discovery leads only. Each load-bearing lesson below therefore rests on explorer re-verification. Excluded Inventory matches remain excluded. Dirty RWO bytes are bound by per-file hashes, not Git HEAD alone.

### Normalized comparison matrix

| Dimension | External Subagents Work Infrastructure, pinned `33a17d…` | CyberAlchemy RWO, dirty HEAD `4821a8…` | CA2 work-orchestration implementation, parent HEAD `dc681a…` | DomainSpec control loop |
|---|---|---|---|---|
| Work unit | Task → graph → immutable Dispatch → Run → Agent Node; mostly candidate product model. | Closed composition graph; accepted event reduced to transition and at most one intent. | Compiled DAG/composite, host transition, executor action, repository promotion boundary. | Craft goal node → finite work-pack frontier → one fresh Task Session per SWU. |
| Authority | Intended graph envelope; runtime may restrict/refuse, not invent. Human-approval modes conflict with exact-confirmation claims. | Explicitly does not authorize, execute, accept events, or own retry policy. | Exact bindings and scopes constrain execution; promotion remains a separately authorized implementation effect. | Plan, audit, human approval, execution, closeout, and promotion have distinct owners. |
| Identity/state | Strong candidate separation of task, node, Run, invocation, attempt, command, delivery, artifact. | Event/history/cursor/command identities; partial-wave schema cannot represent a pre-agent failure cleanly. | Event, cursor, command batch, run, attempt, node, replay state; persistence contract is clearer than deployed physical storage. | Epoch, semantic digest, SWU digest, run/attempt, cursor, blocker fingerprint, terminal receipt, closeout receipt. |
| Dependency/schedule | Rich relation facets; scheduler freedom claimed but schedule equivalence unproved. | Graph reduction; retry/cancel policy belongs outside frozen kernel. | `all`/`any`/quorum joins, impossible-join blocking, bounded retry and deadline cancellation in local extension. | Deterministic serial frontier, unique successor, finite budget; no proven concurrent branches. |
| Evidence | Producer facts, causal edges, bounded unknowns, SQLite probe; experiment invalid when freeze ordering was not observable. | Durable-history candidate plus a historical 14-event partial-wave closeout, all in owner-controlled untracked bytes. | Authored DomainSpec, bindings, Rust source/tests, conformance and ETL receipts; generated graphs/ontologies are projections only. | Append-only receipts and hash-linked chain records; telemetry and readiness projections are non-authoritative. |
| Failure/recovery/join | Recovery required in prose, but joins, waiver, resume, and official-result eligibility remain untyped. | Historical run preserved two sibling results after third spawn failed, but required sidecar repair to express terminal blocking. | Local code/tests cover retry, impossible join, replay conflict, and deadline cancellation; no native partial-wave/durable-restart witness. | Earliest deterministic owner should receive preflight defects; first execution blocker stops; execution PASS may survive a closeout BLOCK. |
| Context isolation | Mandatory/optional/forbidden sources and transformations are described; actual model use cannot be proved by host evidence. | Not established as a complete portable runtime contract. | Scope/toolchain/protected-digest enforcement exists locally; live delivery/model quality unproved. | Exact SWU context pack and fresh Task Session; logical isolation only, not actor/process isolation. |
| Cost | 1,288 tracked files; experiment data dominates several MB; evidence apparatus risks becoming product. | One-go needed governance sidecars to close a runtime schema gap. | Exact compilation/binding reduces ambiguity but adds compiler, digest, receipt, and projection surfaces. | Serial hashing, audit, approval, fresh-session, receipt, refresh, and closeout steps create substantial overhead and retry amplification. |
| Evidence ceiling | No production runtime. | Historical local candidate, not portable or accepted successor. | Bounded local artifact-backed implementation; no fresh run in Shannon’s seat and no production history selection. | Contractual readiness only; 19 proposed fixtures remain unexecuted. |

### Claim ledger

| Claim | Source/selector and explorer return | Status |
|---|---|---|
| Compilation must reject or narrow authority, never add tools, recipients, scope, budget, or effects. | Turing return, `research/agent-invocation-and-collaboration-topology/findings.md:23-30`; external pinned commit. | **Unverified contract**, reusable constraint |
| Identity strata and bounded unknowns are implemented in the external probe. | Turing, `criterion.md:20-75,109-138`, `probe/store.py:16-93,115-145,160-194,307-318`. | **Executed narrowly**: projector 3/3; broader replication 11/13 |
| External production orchestration exists. | Turing, hooks importing absent runtime plus main experiment `INVALID`, `findings.md:3-21,99-110`. | **Unverified/negative** |
| A host spawn failure can occur before an agent identity and defeat the RWO schema. | Shannon, `HOST-SPAWN-FAILURE-0003.json` hash `1cd8a3…`; validation `69d582…`; sidecar `959b4f…`. | **Observed historical trace** |
| Two sibling results were preserved and the run terminalized blocked without dependent work. | Shannon, events `dd216d…`, closeout `9ea123…`, final validation `cf5168…`. | **Observed historical trace** |
| CA2 implements finite DAG joins, impossible-join blocking, bounded retry, deadline cancellation, replay/history guards. | Shannon, `src/dag.rs` `0bfc89…`, `host.rs` `2fd513…`, tests `1d1475…`, `ea5785…`, `e21ebb…`; conformance `afbaac…`. | **Observed source/tests/receipt**, not rerun |
| CA2 proves live model delivery, durable restart, multi-host operation, or production readiness. | Shannon typed negatives and receipt ceiling. | **Unverified/negative** |
| Atomic accepted event + cursor + complete command batch is an authored CA2 requirement. | Shannon, bounded DomainSpec `ac3044…`, system bindings `f202ba…`, host `2fd513…`. | **Observed authored/bound implementation**; physical production journal unselected |
| DomainSpec detects deterministic omissions before mutation when WPRA and Task Session admission operate as specified. | Hewitt, WPRA `7942d0…`, Task Session `937940…`. | **Unverified contract** |
| DomainSpec separates execution PASS, closeout PASS, chain completion, and promotion. | Hewitt, task-session-until-blocker `2528c3…`, Goal `874ce5…`, invoke findings `ba7393…`. | **Observed current contract/research**, not executed |
| Cancellation acknowledgement, late-result quarantine, concurrent joins, restart reconciliation, and actor-mailbox ordering are proven. | Hewitt typed negatives. | **Unverified/negative** |
| Stronger controls currently impose measurable coordination cost. | Turing file/data counts; Shannon OEW lead reports ≥56 governance path-writes versus 28 runtime writes; Hewitt serial lifecycle analysis. | **Observed**, benchmark not common across systems |

### First-knows / first-reports blocker timeline

| System | First knows | First durable report | Delay or loss |
|---|---|---|---|
| External infrastructure | Graph compilation could know malformed scope/dependencies; provider observation could know delivery failure. | Producer fact/checkpoint or validation artifact. | Runtime absent; schedule-sensitive and freeze-order facts can remain unknowable, invalidating the experiment. |
| RWO | Host knows the third spawn failed before an agent binding exists. | Sidecar failure artifact, then event validation BLOCK, later terminal `run_blocked`. | Driver schema could not admit the first-known fact directly; reporting required governance repair after siblings returned. |
| CA2 implementation | Compiler knows graph errors; DAG reducer knows impossible joins; executor/host knows action failure, deadline, history conflict. | Atomic transition/history append and typed node event in the local model. | No integrated native partial-wave or durable restart witness; physical recovery uncertainty remains. |
| DomainSpec loop | Plan owner can know missing authored bindings; WPRA should know deterministic omissions; Task Session first knows live drift/runtime failure; closeout owner knows evidence mismatch. | Audit report, admission blocker, terminal receipt, or closeout receipt respectively. | Recorded research shows omissions reaching Task Session and generic Refresh causing stop–refresh–reselect amplification. |

### Mechanism, benefit, failure, cost

| Mechanism | Benefit | Known failure | Cost |
|---|---|---|---|
| Immutable digest-bound dispatch/approval | Prevents semantic drift after decision. | No-approval mode conflicts with exact confirmation; any changed bound byte forces a new decision. | Hashing, review, invalidation, regeneration. |
| Typed event reducer with atomic append | Replay safety and causal history. | One-intent RWO versus CA2 command batches lacks a non-collapse proof; physical journal unresolved. | Journal, fencing, reconciliation, migration. |
| Structural DAG joins | Makes readiness and impossible joins explicit. | Missing-input degradation can unlawfully bypass independent review; native partial-wave witness absent. | Scheduler state and join bookkeeping. |
| Fresh isolated work unit/session | Limits context and write scope. | Does not prove process/mailbox isolation or durable continuity. | Serial startup, repeated admission, context reconstruction. |
| Separate execution and closeout | Preserves valid work while blocking unsafe advancement. | Partial-result consumers may collapse inner PASS into chain PASS. | Extra receipt and owner join. |
| Exact evidence/provenance | Supports audit and replay. | Portability assumptions and capture volume can invalidate or overwhelm evidence. | Storage, path writes, refresh loops, maintenance. |

### Build-from-owned lessons

1. Keep orchestration as sequencing/reduction, never as a replacement authority owner.
2. Preserve route approval, owner binding, accepted history, execution result, closeout, consumption, acceptance, and promotion as separate truths.
3. Make pre-agent host admission failure, partial-wave result preservation, impossible join, cancellation acknowledgement, late-result quarantine, and fresh-attempt resume first-class transitions.
4. Keep immutable semantic identity across retries while assigning distinct attempt/run identities.
5. Route deterministic defects to the earliest owner before execution; never reclassify an observed runtime failure as preflight residue.
6. Persist event, cursor, and complete emitted-command set atomically, then reconcile uncertain dispatch before retry.
7. Keep fan-out/fan-in structural; semantic gates and waivers remain owner decisions.
8. Tier provenance by decision value and impose removal/cost tests.

Typed negatives:

`OUTPUT ≠ COMPLETION ≠ VALIDATION ≠ ACCEPTANCE`; `ROUTE ≠ AUTHORITY`; `PROJECTION ≠ SOURCE`; `RECEIPT ≠ PROMOTION`; `EVENT ≠ COMMAND`; `REPLAY ≠ RETRY ≠ RERUN ≠ RESUME`; `EXECUTION_PASS ≠ CLOSEOUT_PASS`; `CHAIN_COMPLETE ≠ PRODUCTION_READY`; absence of next-boundary evidence is bounded unknown, not failure; cancellation is not acknowledgement; retry is not compensation.

### Three bounded successor options

| Option | Retained owners | Eliminated mechanism | Migration risks | Falsifier | Decision gaps |
|---|---|---|---|---|---|
| **A. Serial lifecycle spine**: DomainSpec finite frontier delegates each SWU to the CA2 reducer/runtime. | Plan, WPRA, human approval, Task Session, closeout, Craft promotion; CA2 owns only attempt mechanics. | General concurrent scheduler and ambient recursive continuation. | High serial cost; poor independent-work utilization; adapter may collapse CA2 events into lifecycle receipts. | Cannot preserve a successful sibling result or resume a fresh attempt without reopening authority. | Is concurrency required? Which durable journal and cancellation owner? |
| **B. Event-sourced graph core with owner gateways**: CA2 DAG/history becomes shared execution substrate; every semantic gate calls the existing owner. | Canonical definitions/Product Capability/DomainSpec, human gate, repository effect owner, closeout/promotion owners. | Sidecar-only recovery, conversation continuation, duplicated scheduler/registrar state. | Kernel may absorb retry, approval, or semantic-gate authority; one-intent/batch mismatch; journal migration. | Any trace where reducer invents authority, loses a command under crash, or releases an impossible join. | Command aggregation contract, physical history, fencing, gateway failure classification. |
| **C. Minimal dispatch/receipt protocol over replaceable executors**: retain only immutable dispatch, identity/event vocabulary, receipts, and owner joins; scheduling stays host-specific. | Existing route/approval, executor, evidence, closeout, and promotion owners. | Universal scheduler, shared actor-runtime claim, compulsory full-fidelity provenance. | Host divergence; weaker portability; duplicated adapter logic; schedule invariants may drift. | Same dispatch yields authority-relevant differences across hosts, or an adapter cannot report pre-agent failure/cancellation without fabricated identity. | Required portability tier, conformance floor, provenance budget, host certification owner. |

No option is selected; all remain below Product Capability, canonical definition, ontology, implementation, acceptance, publication, release, deployment, or external-effect authority.

### Smallest future witness suite

One shared six-fixture suite should run unchanged, modulo typed adapters, against all four applicable surfaces:

1. **Happy path plus atomic replay:** fan-out two children, terminal join, duplicate event, divergent duplicate, restart at each append boundary.
2. **Preflight blocker:** missing deterministic binding must stop before launch and name the earliest repair owner.
3. **Partial wave:** two successful children plus one pre-agent host admission failure; preserve siblings, block dependents, avoid fabricated agent identity.
4. **Stale authority/evidence:** mutate one approval-bound byte and separately one non-dependent ambient byte; only the selected dependency must invalidate.
5. **Cancel/resume:** cancellation request, acknowledgement, quarantined late result, uncertain external effect, fresh attempt with stable semantic identity and distinct attempt identity.
6. **Execution/closeout/promotion separation:** execution passes, evidence synchronization blocks, repair closes with owner receipt or semantic `NO_OP`, and no promotion occurs without its owner.

Required outputs are an ordered event trace, immutable dispatch/approval identity, owner-labelled state transitions, journal/cursor/command-batch snapshots, explicit bounded unknowns, cost counters for runtime actions versus governance writes/decisions/refreshes, and portable replay results. Until these execute, the cross-system fixture matrix remains **unverified** and lookup readiness remains **blocked**.
