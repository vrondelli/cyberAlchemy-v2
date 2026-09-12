# Robot World contracts for the ARE orchestrator

Status: research proposal, not an implemented or admitted contract.
Date: 2026-09-11. Authority effect: none.
Scope: integrate the existing interaction-dynamics world with the new sibling
orchestrator. Preserve existing action checks and frozen experiment evidence.
Unresolved decisions are owned by Open Questions below.

## Recommendation

Introduce two executor contracts first: `robot-world.run/v1` and
`robot-world.verify/v1`. A run is a bounded simulation in a fresh, isolated world
instance. Verification consumes immutable results without advancing that world.
Keep individual actions inside the world process. ARE can assess the surrounding
work request and eventual completion; the deterministic policy continues to choose
actions during the simulation. A later proposal contract can introduce model
reasoning without giving that model direct state writes.

These names and fields are proposals. Adding a JSON schema alone does not make
the orchestrator capable of executing them.

## Verified local foundations

- [InteractionWorld](../../development/robot-world-kep/runtime/interaction_world.py)
  owns four-axis policy selection, checked actions, per-tick impulse accumulation,
  and clock commits. `step()` processes stable sorted actor IDs. Semantic neighbors
  come from a frozen tick snapshot; action eligibility uses the current state.
- [World.apply](../../development/robot-world-kep/runtime/prototype.py) checks
  action schema, world identity, caller ownership, request deduplication, revision,
  movement/energy and resource preconditions. Its caller string is a local test
  seam, not remote authentication. A service adapter must derive caller identity
  from a trusted launch binding rather than trust a model-supplied owner.
- [Current epoch](../../development/robot-world-kep/dag/epoch-001.json) runs world
  and marketplace branches before a bridge. The current
  [runner](../../development/robot-world-kep/runtime/run.py) only dispatches its
  three legacy fixture contracts and calls the legacy world entrypoint.
- [Profile](../../development/robot-world-kep/interaction-dynamics/PROFILE.json)
  fixes dt=1, rates, impulses, scales and policy weights. Simulation time does not
  need to equal wall-clock scheduling time.
- The new [worker API](../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/worker.rs)
  already has leases, fencing, command begin, receipts, accepted events,
  cancellation and unknown-effect reconciliation. Its
  [receipt](../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/receipt.rs)
  binds work identity, command/input, fence, event/outcome, executor and times.
- The [ARE decision lane](../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/docs/are-decision-cli-integration.md)
  evaluates route/context/effect/continue. The
  [gateway lane](../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/docs/are-gateway-integration.md)
  currently reads existing App Server threads. The
  [native text lane](../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/are_native.rs)
  accepts native fixtures only. None is presently a Robot World action executor.

## Contract design

| Contract | Input | Output | Permitted effect |
| --- | --- | --- | --- |
| `robot-world.run/v1` — proposed now | Initial-state reference and digest; world/instance identity; profile and engine identity; tick ceiling; explicit stop policy; supported policy mode | Result manifest binding initial/final state, events, frames and traces; completed ticks; stop reason; resource/energy metrics | Advance one fresh isolated simulation and write artifacts beneath its host-assigned attempt directory |
| `robot-world.verify/v1` — proposed now | Accepted run output reference/digest and expected initial/profile/engine bindings | Verification report binding checked artifacts, checks performed, pass/fail and limitations | Read run artifacts and write a verification report; no world advancement |
| `robot-world.propose/v1` — later | Versioned observation, actor identity, objective, allowed action shape and bounded inference budget | Candidate action tied to observed revision and input digest, plus explanatory evidence | Produce a proposal only; no state change |
| `robot-world.action/v1-prototype` — existing | World, actor, request ID, expected revision, action, optional move target | Accepted revision/event hash or rejection | The world owner commits one legal action |

Do not add a public `set-state`, `set-memory`, or arbitrary Python/shell field.
Use closed input/output schemas with required fields, finite-number checks,
integer bounds and explicit versions. JSON Schema's `additionalProperties:false`
rejects undeclared object fields; semantic checks such as valid artifact bindings,
legal actions and resource conservation still belong in code.
Source: [JSON Schema object reference](https://json-schema.org/understanding-json-schema/reference/object).

Separate the semantic input from the scheduler envelope. The orchestrator supplies
run/node/command identity, attempt, fencing token, wall-clock deadline and trusted
executor binding. Tasks cannot supply executable paths, credentials or new owner
authority. A proposed semantic input, with symbolic references rather than actual
digests, is:

```json
{
  "schema_version": "robot-world.run-input/v1",
  "world_id": "workshop-001",
  "initial_state_ref": {"artifact_id": "initial-workshop", "sha256": "<64 hex digits>"},
  "profile_ref": {"artifact_id": "interaction-v1", "sha256": "<64 hex digits>"},
  "engine_ref": {"artifact_id": "reviewed-world-engine", "sha256": "<64 hex digits>"},
  "expected_revision": 0,
  "policy_mode": "scripted-interaction-v1",
  "max_ticks": 100,
  "stop_policy": "horizon-or-profile-quiescence"
}
```

The host resolves artifacts from an allowlisted store, verifies actual bytes, and
supplies the trusted actor-owner map. In v1, require tick/revision zero and a fresh
instance; the current initializer does not restore an arbitrary checkpoint.
An engine reference should bind the Python sources, numerical profile, runtime
versions and serialization rules needed for reproducibility, not just a filename.
No runtime override of the pinned profile is implied by this example.

The result manifest should carry separate fields for execution outcome, stop
reason, goal metrics, completed ticks and artifact identities. Reaching 100 ticks
can be a successful bounded execution even if no building was completed. A
quiescence window is a censored observation, not proof of permanent convergence.
Cancellation and partial results cannot be labeled successful completion.

## Interaction flow

1. A user selects an initial scenario and a bounded run request. The launch host
   may obtain ARE route/context/effect evidence for that exact request. It checks
   the result kind and applicable authorization before dispatch; `ok:true` alone
   is insufficient because ARE gates and blocks can be valid decision results.
   ARE receipts do not provide actor ownership or approve world actions.
2. The orchestrator registers immutable work, allocates shared capacity and leases
   the run node to the exact world executor. The executor checks the command/fence
   and artifact bindings before creating the isolated world instance.
3. The world performs complete ticks. It derives four-axis preferences from prior,
   memory and bounded steering, chooses a currently eligible action, and calls
   `apply(trusted_caller, intent)`. The checked reducer alone changes state.
4. At the tick boundary, the world applies decay plus accepted-event impulses once,
   updates semantic velocities, advances the clock, and records a replay frame.
   Rejected and duplicate actions add no new impulse.
5. The executor seals artifacts and returns a digest-bound result. The orchestrator
   validates completion identity/fence and accepts its receipt/event. A dependent
   verification node reads those exact bytes and produces its report.
6. The UI displays frames and the verification status. ARE `continue` can assess
   supplied completion evidence for a next objective. It does not independently
   verify the simulation or mutate the world.

The launch preflight is outside the run's executable dependency chain: the current
ARE workflow deliberately preserves gates/blocks as results. Do not connect its
ordinary DAG success directly to a world-write node without an explicit dispatch
guard. An in-run ARE continuation stage likewise needs a typed evidence-binding
adapter; the current composer does not automatically ingest a world verifier's
output as completion evidence.

## Concrete world interaction, executed during this research

Constructed example: both robots start at the workshop, stock=6, resource=74,
cargo=0, memory=0, tick=0 and revision=0. This deliberately supplies manual
proposals to exercise the action boundary; it is not the default policy order.

| Event | Observed outcome |
| --- | --- |
| Alice's explorer submits `build`, expected revision 0 | Accepted; stock=0, built=1, revision=1 |
| Exact duplicate of that request | Same receipt; no additional construction |
| Bob's builder submits `build`, expected revision 0 | `STALE_REVISION`; state unchanged |
| Builder submits build at current revision 1 | `BUILD_PRECONDITION`; state unchanged because stock is empty |
| Builder submits wait at revision 1, then host closes tick | Event sequence is build, wait, advance-clock; tick=1, revision=3 |

Explorer memory ends at `[0, 0.5, 0, 0]`. The build impulse becomes construction
memory once at clock commit. Rejection, duplicate delivery and waiting add no
build impulse. A future model can suggest a different action, but cannot create
stock or bypass revision/ownership checks by producing a high semantic score.

## Durability, cancellation and verification

Use one orchestrator writer for execution history and one world writer per world
instance for simulation events. These histories have different responsibilities;
link them with command identity and artifact digests rather than copying world
mutations into two competing reducers. A lease fence protects scheduler acceptance;
a later shared-world service must additionally enforce a per-world writer fence.

For the first version, use one attempt and no automatic redispatch after ambiguous
delivery. A duplicate completed command can return its verified cached result.
Unknown attempts remain quarantined until reconciled. In-memory request dedup in
World does not by itself survive process restart. Temporal documents the general
reason: a worker can finish an effect and crash before reporting completion, and
idempotency must be enforced where the effect happens. This supports our design;
it is not a proposal to replace the existing orchestrator with Temporal.
Source: [Temporal Activity Definition](https://docs.temporal.io/activity-definition).

Heartbeat and cancellation handling belong to the host adapter. Check cancellation
before beginning a tick and acknowledge after a complete tick and confirmed stop;
bound worst-case tick duration. A hard timeout or crash can leave a partial tick.
The current InteractionWorld marks a failed tick unusable and has no durable resume
protocol. V1 must preserve the partial attempt as failed/unknown, not reconstruct a
successful final state or retry into the same instance. Simulation dt remains fixed
while lease/deadline clocks use wall time. The pattern of heartbeats as liveness,
progress and cancellation delivery is supported by
[Temporal failure detection](https://docs.temporal.io/encyclopedia/detecting-activity-failures).

Keep authority posture separate from effect reporting: `authority_effect:none`
does not mean no files or simulation state changed. Map actual local effects to
the existing NotStarted/NotApplied/Applied/Unknown receipt vocabulary; retain
cancelled-after-progress outcomes honestly.

Verification must distinguish artifact integrity from world correctness. The
current `verify_history` checks hash/revision continuity and embedded states; it
does not independently re-execute every domain transition. A strong new verifier
must additionally reapply action legality and clock/memory rules from the initial
state and bound profile, check conservation after each commit, compare final state
and every frame, and check traces. Recomputing a hash chain over altered states
must not turn an illegal action into a verified result.

## Implementation path and acceptance evidence

1. Repair exact kernel source bindings and ICU 74 build/runtime setup. Fix the
   standalone ARE worker's missing-`ok` result-validation defect from the preceding
   review. Keep prior evidence unchanged.
2. Freeze two schemas, lifecycle semantics, artifact serialization and executor
   capability bindings. Implement a thin Python simulation entrypoint plus a
   bounded orchestrator adapter using existing worker/receipt APIs. Add both
   contracts to explicit scheduler capability selection; never only add names to
   its allowlist. Keep script selection operator-owned.
3. Prove one fresh world run followed by independent verification. Compare the
   orchestrated output with direct InteractionWorld execution on identical inputs.
   Exercise duplicate dispatch, changed profile, bad artifact digest, wrong caller,
   stale revision/fence, malformed results, cancellation, crash before result
   acceptance, partial ticks and illegal transitions with recomputed hashes.
4. Add UI run/verification projection. Keep legacy epoch/marketplace/bridge outputs
   unchanged; add separately versioned wrappers if those branches are later moved.
   Existing knowledge consumption records a bound dataset result in context; that
   does not automatically make the current policy use the dataset.
5. Introduce model proposals only after the scripted path passes. Add a frozen
   observation and proposal validator, then choose an actual inference-capable
   transport. The present gateway read and native fixture contracts do not supply
   that capability. Bind proposal revision/digest; stale proposals require new
   observation/reasoning. Never silently rewrite their revision to force acceptance.

For model replay, retain the accepted proposals and their inputs/results. Do not
re-invoke inference while replaying history. If future models propose actions for
many actors concurrently, validate them sequentially against the changing world;
define stale/rejection handling explicitly. Initial integration should preserve
the current actor order and one-action-per-tick constraint.

## Open Questions

- World owner: is the first target an isolated simulation or a continuously shared
  world? This proposal selects isolated simulation; shared mutation needs durable
  ownership, service authentication, fencing and recovery contracts first.
- Product owner: which exact tick ceiling, wall deadline and output-byte budget
  should be admitted? The 100-tick example is illustrative, not a measured SLA.
- World implementer: which serialized checkpoint is sufficient for continuation?
  It must include event/receipt dedup and semantic velocity/clock state, not merely
  positions and memories. V1 deliberately has no resume claim.
- Integration owner: which host path and source manifest bind the new executor,
  artifact resolver and trusted actor-owner map?
- Evaluator: which independent action/clock replay oracle is sufficient for a
  world-correctness label rather than only artifact-integrity verification?
- Product owner: should later inference propose one action or a bounded objective?
  Start with one action per observation if direct model control is wanted; changing
  profiles or priors during a run requires a separate versioned semantics decision.

No new executor, remote service, model call or world integration was installed by
this research. The contention example exercised only in-memory existing code.
