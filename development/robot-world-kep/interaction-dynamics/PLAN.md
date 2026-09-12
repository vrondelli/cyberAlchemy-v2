# Interaction dynamics development plan

Status: candidate plan, 2026-09-11. Owner: Robot World product owner (user).
Scope: a versioned, deterministic local interaction-dynamics prototype.
Authority effect: none. Implementation and product approval are not granted by this plan.
Review: [independent subagent review](REVIEW.md). Questions are owned below.

## Outcome and scope

Make exploration, construction, cooperation and caution independently observable
in robot decisions. Specify normalized semantic state, active semantic alignment,
interaction impulses and decay precisely; demonstrate them through controlled
experiments and checked world actions. Preserve the existing first epoch and
all Godot, Unity, Babylon and Phaser review candidates.

This is a successor to the current W0 heuristic and bounded evidence preparation
for W5 in the [parent plan](../PLAN.md). It does not complete W2 inference,
W3 AlchLang, W4 agent-built experiments, W5 learning evaluation, or M2 real KEP.
Physical steering, collision avoidance, learned policies, network services and
browser renderer selection are outside this milestone. Physical positions remain
two-dimensional; semantic steering affects choices, not physical acceleration.

The immediate deliverable is this reviewed plan. Later implementation should
produce one exact local candidate, tests, decision traces and a comparison report.
No claim of emergent cooperation or useful learning follows from mechanics tests.

## Inspected evidence and current gaps

| Source | Current behavior | Planned closure |
|---|---|---|
| [Definition](../DEFINITION.md#interaction-dynamics) | Describes normalized dimensions and decay-before-impulse | Version the actual successor semantics; retain a clear legacy explanation |
| [Steering and decay](../runtime/prototype.py) `steering`, `decay` | Generic vector operations; force norm capped at 0.15; scale only enters separation distance; fixture velocities are zero | Consistent metric units and genuine semantic velocity, with independent term tests |
| [Policy and tick](../runtime/prototype.py) `World.policy`, `World.step` | `prior + memory` is unbounded; only explore/build scores directly select targets; actions precede decay; actors update sequentially | Explicit normalization, four-component action utility, deterministic phase ordering |
| [Reducer](../runtime/prototype.py) `World.apply` | Local caller ownership, revision, idempotency, energy, resource and position checks | Keep these checks as the only effect boundary; preference cannot override eligibility |
| [Interaction tests](../runtime/test_prototype.py) `InteractionTests` | Dimension/empty-neighbor and pure decay tests | Mechanism isolation, integration, ablation and replay evidence |
| [Action schema](../contracts/bridge.schema.json) `$defs.ActionIntent` | Closed five-action vocabulary with two-coordinate movement | Reuse unchanged for the first successor; diagnostics live outside the intent |
| [Domain scaffold](../model/world.domain.json) | Local carrier and handwritten mapping | Add a local interaction mapping; do not claim compiler or ontology admission |

The existing tests do not establish alignment behavior, four-axis agency,
normalization, unit invariance or a large-population performance envelope.
Browser synthetic-actor counts measure rendering, not this simulator.

Source snapshot inspected for this plan (SHA-256; recheck before implementation):

| File | Digest |
|---|---|
| `runtime/prototype.py` | `25a3e5e6e32e71ece9cec9ce4010ae1998c5da6f1384c583af12717a5bbf4d9e` |
| `runtime/test_prototype.py` | `8ae1bbc070c3ebce9019969ebcacff6923775691c78fc6426d3668b7688fc300` |
| `contracts/bridge.schema.json` | `50de5d5adb8364e12bd850a11f7c5b0e8d13268e14b2f211b8b005702298afdf` |
| `DEFINITION.md` | `a1b38afb7006c0eabe6eb035b8b6b11f8ae9e6e2294fc65059630fa01e8c4d36` |
| `model/world.domain.json` | `de4a3eab81d0bbf3f33afb8e95db4b936d1f1c25953d1785b360214763c1dc52` |

## Proposed contracts to freeze before coding

These are explicit planning choices, open to correction by the owner. They are
local prototype terms, not changes to canonical definitions.

### State, units and time

- Pin axis order to exploration, construction, cooperation, caution. Priors are
  finite values in [0,1]. Raw memory is a separate nonnegative finite vector;
  it is not called normalized state.
- Define semantic preference `s[k] = clamp(prior[k] + gain[k] * memory[k], 0, 1)`.
  Initial gains are 1. Saturation is intentional and observable; log saturation
  frequency and include a sustained-input case so it cannot hide inert dynamics.
- Use a fixed simulation step of one time unit initially, independent of render
  rate or wall time. Retain decay rates [0.08, 0.02, 0.04, 0.10] per time unit.
  The generic decay helper can support other dt values; variable-step world
  equivalence is not claimed.
- For each tick, use a frozen start snapshot for semantic neighbors, velocities
  and preference computation. Commit checked actions in stable agent-ID order,
  rechecking eligibility against the current revision before each submission.
  Contention losers choose a freshly eligible alternative or wait. Record this
  sequential allocation rule rather than claiming simultaneous fairness.
- Queue interaction impulses from accepted actions only. At the end of the tick,
  compute `memory_next = memory_start * exp(-lambda * dt) + sum(impulses)`.
  This adopts the quoted equation and intentionally differs from the legacy
  add-then-decay ordering. Rejected actions and replayed accepted requests add no
  impulses. A new valid action after a stale rejection contributes exactly once.
- Make the successor tick orchestrator the only impulse-accounting owner. Plan
  one narrow shared-reducer seam in `runtime/prototype.py`: move legacy inline
  memory mutations behind an overridable action-memory hook. Its default preserves
  legacy behavior; the successor's hook makes no memory mutation. After `apply`,
  derive impulses only from a newly appended committed event, identified by revision
  and event-hash advance, never merely an `accepted` receipt (duplicates return old
  receipts). Queue by unique committed event identity and consume once in the clock
  commit. Intermediate action states retain start-of-tick memory; never mutate a
  hashed event or patch memory silently after commit. Failed tick handling must
  retain accounting state or terminate the run explicitly, not retry the whole
  partially committed tick. Crash recovery remains outside this in-memory fixture.
- An impulse is a per-event quantity, not a rate multiplied by dt. Retain gather
  +0.1 exploration, build +0.5 construction, deposit +0.3 cooperation. Add caution
  +0.1 for an accepted move leaving energy below the profile's reserve threshold
  (initially 20); this is low-energy feedback, not a physical danger detector.
  Keep at most one accepted policy action per actor per tick. Input bounds and
  positive decay rates must give a documented finite long-run memory bound.
- Define semantic velocity as the finite difference between consecutive committed
  semantic states divided by dt, initialized to zero. Tick t uses the previous
  completed interval's velocity; no future-state reads or render-derived velocity.

### Steering and action decisions

- Compute position and velocity differences in the same declared per-axis scaled
  semantic coordinates for separation, alignment and cohesion. Keep positive
  finite scales explicit; default [1,1,1,1]. Define the 0.5 separation radius,
  zero-distance behavior and 0.15 force cap in that metric. Convert the bounded
  result back to semantic coordinates before adding it to s. Freeze exact units,
  coefficients and conversion in the contract, with a unit-rescaling oracle.
- Define the actual utility weights as `w = clamp(s + converted_force, 0, 1)`
  component-wise. Record both force and w. Negative caution weights must not reward
  energy expenditure; velocity remains derived from s, not this transient w.
- For the two-robot world, retain all-to-all neighbors and stable neighbor order.
  Do not add a spatial index to a semantic neighborhood or silently substitute
  physical distance. Empty neighborhoods contribute zero steering.
- Build a legal action candidate set using current reducer preconditions. Include
  gather, deposit, build, moves toward resource/workshop, and wait where valid.
  Cooperation must be able to favor returning a partial cargo load to shared stock.
  Caution must be able to favor a lower-energy-cost valid option. No charging,
  energy regeneration, collision handling or new action kind is invented.
- Existing cost is exactly one energy unit for every move, zero for other actions.
  A shorter step is not cheaper. The caution oracle compares move versus wait at
  the same location, with a hand-calculated reserve-pressure threshold. If caution
  chooses indefinite waiting in a no-recharge state, report `policy-quiescent` as
  distinct from zero-energy exhaustion; never imply waiting restores energy. D1
  freezes the quiescence detection window and termination reason.
  Quiescence means waiting observed for that window, not proof it can never resume
  as memory decays. If an experiment stops there, report the run as window-censored.
- Score candidates with four explicit bounded features: acquisition opportunity,
  construction opportunity, useful shared-stock contribution, and negative energy
  cost scaled by reserve pressure. The preference vector after steering weights
  these features. Add a task-progress term and deterministic tie break, so idle
  waiting is not accidentally the universal maximum. D1 must freeze numerical
  feature definitions, weights, wait utility and tie order in a versioned profile
  before D2 implementation; no unexplained constants in policy code.
- Destination-directed movement features must reflect the useful task it advances,
  including partial-cargo delivery, not just the immediate move opcode. D1 provides
  hand-calculated choices at a midway position as well as at the workshop. Actual
  energy cost remains one per accepted move regardless of destination feature.
- Show independent counterfactual fixtures where changing only one axis changes
  a legal decision in its intended direction. Cooperation/caution claims require
  these fixtures, not merely nonzero memory fields. Caution can slow progress;
  evaluate this tradeoff and terminal energy exhaustion explicitly.
- Emit a trace containing snapshot/revision, prior, memory before/after, impulses,
  s, semantic velocity, neighbors, separate steering terms, feature scores,
  eligibility/rejection reasons, chosen intent, receipt, profile identity and dt.
  Traces are diagnostic evidence, not additional action permissions.

## Product construction sequence

The [current D65 construction definition](../../../authority/definitions/DEFINITIONS.md#cav2-d65-domainspec-governed-construction-invariant)
is expressed as local planning stages; this plan does not register a
ConstructionBinding or assert ontology/compiler conformance. The
repository PLAN route reports Goals validation blocked for admitted execution
state. This does not prevent authoring or reviewing this candidate plan.

| ID | Owner role | Depends on | Work and output | Completion evidence |
|---|---|---|---|---|
| D0 | World implementer | Later bounded implementation scope | Capture baseline code/input digests, baseline source snapshot and existing epoch identities; reconcile definition and four-axis meaning in `interaction-dynamics/CONTRACT.md` | Every gap above mapped to a requirement; legacy bytes identified; pre-refactor golden outputs captured |
| D1 | World implementer | D0 | Write local concept/relationship and product/business/system/implementation mapping; freeze numerical profile, trace schema, update order and fixture expectations | Contract/profile agree; hand-calculated examples for memory, scale conversion and action selection; no unresolved algorithm choices |
| D1C | DomainSpec binding implementer | D1 | Select installed DomainSpec source/profile/compiler by the repository lookup route; author prototype source and deterministically compile graph/system-ontology scaffolds under `interaction-dynamics/domainspec/` | Exact compiler version/digest, authored source and profile hashes; two identical compiled outputs; contract-to-source-to-implementation mapping. A handwritten mapping alone does not satisfy this stage |
| D2 | World implementer | D1C | Implement pure normalization, decay/impulse step, semantic velocity and steering in a new module | Numeric oracle and negative-input tests pass, each steering term exercised alone |
| D3 | World implementer | D2 | Integrate four-axis policy with a versioned local world entry, behavior-preserving legacy memory hook, unchanged checks, trace and fresh-run output | Independent axis effects, legal actions, deterministic contention and exactly-once impulse handling pass; legacy golden event hashes unchanged |
| D4 | Simulation evaluator | D3 | Run baseline and controlled successor experiments, repeated runs and ablations | Reproducible report with outcomes, costs and limitations; adverse results retained |
| D5 | Candidate evaluator | D4 | Freeze source, profile, fixtures, tests and evidence into a new local candidate | Exact manifest and current tests; replay correspondence; old candidate bytes unchanged |
| R0 | Product owner | D5 | Review demonstrated dynamics and limits | Explicit candidate-bound accept/revise/defer decision; no automatic approval |

Current frontier: reviewed planning candidate; D0–D5, including D1C, are not executed.
Runnable next product work after a separately routed implementation request:
D0 then D1. No inference endpoint, real dataset, GPU, renderer preference or
network setup is a prerequisite. Existing G02/B1 review decisions remain separate.

## Verification and experiment design

Tests should establish external behavior or independent mathematical expectations,
not repeat the production formula as the only oracle.

1. **Numeric contract:** dimensions 1/2/4/100; finite inputs; mismatched shapes;
   zero/negative scales; empty/coincident neighbors; independent separation,
   alignment and cohesion direction; non-unit scales; cap enforcement in the
   declared metric; semantic-velocity initialization and nonzero alignment.
2. **Memory/time:** known half-life expectations, no-input decay composition,
   distinct component rates, one accepted impulse after decay, no impulse on
   rejected/duplicate submissions, saturation and finite long-horizon bounds.
   Splitting time is only equivalent when event timestamps are preserved; an
   impulse must not be injected once per numerical substep.
3. **Policy and authority:** independently vary each semantic axis against the
   same legal candidates; test partial delivery and reserve-sensitive decisions;
   maximal preferences never bypass ownership, stale revision, movement, energy,
   cargo or stock checks. Test insufficient-stock contention and energy exhaustion.
   Every generated intent is accepted or explicitly handled without aborting a run.
   Run conservation checks on the successor itself after every commit:
   `resource + stock + sum(cargo) + 6*built == initial_resource_total`, energy
   nonnegative, cargo within capacity, stable identities and no invalid motion.
   Legacy-only WorldTests are insufficient. Exercise first acceptance, duplicate
   accepted receipt, rejection, and fresh acceptance after a rejection separately.
4. **Determinism and replay:** identical initial state/profile yields identical
   state and decision trace hashes on the named environment; input ordering does
   not change stable-ID processing; each replay frame matches its committed state.
   Verify every successor event's before-state digest and previous-hash chain;
   action events preserve tick-start memory and the clock event applies impulses
   once. Verify the legacy default's golden event hashes after the reducer seam.
   Identical outcomes across Python/platform versions are not assumed.
5. **Behavior comparison:** use frozen scenarios for resource gathering,
   construction-ready stock, partial-load cooperation, low-energy choice,
   changing neighbor velocity, and sustained impulses. Compare legacy baseline,
   full successor, no steering, no memory, no alignment, no cooperation utility,
   and no caution utility with the same scenario inputs wherever compatible.
   Record constructed count, gathered/deposited units, energy, idle time,
   invalid-intent count, saturation rate, and per-axis decision changes over 80
   and 1,000 ticks. Stop conditions are fixed in the profile and reported.
6. **Acceptance:** all hard invariants and four directional counterfactuals pass;
   the ordinary 80-tick fixture constructs at least one item without invalid
   policy submissions. Aggregate throughput improvement is a measured outcome,
   not a required or presumed result. If an ablated mechanism is inert in every
   scenario, do not claim that mechanism demonstrated; revise before D5.

Capture a legacy baseline before editing any shared runtime dependency. Select
existing test commands from [runtime instructions](../README.md#run); use
`tools/toolchain/run` from the repository for any Rust build. New focused Python
tests and experiments must have exact documented commands in D1. The plan does
not claim these future commands or tests already exist.

## Planned file boundaries and compatibility

Current write scope: only this plan and `REVIEW.md` in this directory.
Later proposed implementation envelope, relative to `robot-world-kep/`:

- New `interaction-dynamics/CONTRACT.md`, `PROFILE.json`, `MAPPING.md`,
  `domainspec/` authored sources and generated projections, `fixtures/`,
  `evidence/<candidate-id>/` and `REPORT.md`.
- New `runtime/interaction_dynamics.py`, `runtime/test_interaction_dynamics.py`,
  `runtime/run_interaction_experiments.py` and an explicit successor world module
  `runtime/interaction_world.py` that composes the existing checked reducer.
- Narrow `runtime/prototype.py` change: extract the existing action-memory writes
  into the behavior-preserving hook described above, with a legacy golden-output
  regression. This is proposed future scope, not an edit made by this plan.
- Update only relevant current prose in `DEFINITION.md`, `README.md`, `PLAN.md`
  and `DAG-STATUS.json` to link successor status; never mark parent W2/W5 complete
  based on this narrower work. Shared-reducer changes beyond the memory hook must
  be identified in D0 and included explicitly in the later scope before mutation.

Keep the legacy runner/default policy available. Fresh successor runs must name
their dynamics profile and new run directory; do not rewrite `runs/epoch-001/`,
bundled Godot/browser sessions, Unity preparations or frozen UI checkpoints.
Keep new semantic velocity and trace metadata outside old strict UI schemas.
Fresh-run browser export and UI visualization belong to a separately scoped
consumer integration, with versioned input contracts and regression tests.

## Operational support, blockers and deferred work

| Task | Owner | Affected stage | Blocking basis / posture |
|---|---|---|---|
| Verify installed Python/jsonschema and repository Rust launcher if needed | Environment owner / implementer | D2–D5 | Exact local test prerequisite; resolve during implementation; no temporary compiler installation |
| Store new run/evidence outputs in unique local directories | Implementer | D3–D5 | Required to preserve old evidence and avoid overwrites |
| Goals admission / runtime governance registration | Governance owner | No local prototype stage | Deferred; planning candidate is not admitted execution state |
| Browser/GPU/Unity setup | UI/environment owner | No stage here | Deferred; dynamics tests run without a renderer |
| Inference, real KEP, dataset selection, hosting, settlement | Respective parent owners | No stage here | Separate parent milestones, not blockers to D0–D5 |

Causal blockers: implementation has not been requested; D2 depends on D1's exact
numerical contract and D1C's selected reproducible compiler binding. The compiler
binding is not selected by this plan; if unavailable, keep D1C blocked and report
the exact missing prerequisite rather than claim the handwritten carrier is
compiled. D0/D1 contract work remains independently runnable. No external service
is required. Subagent plan review is
evidence about plan quality, not permission to execute it.

Follow-on **S1: measured scaling** is a separate scope after D5: profile actual
simulation at 2/50/200/500 actors and 4/16/100 dimensions, recording hardware,
median/p95 tick cost, memory and neighbor work. Only then select a deterministic
semantic-neighborhood index, explicit radius/k semantics and brute-force oracle.
Changing from all-to-all to bounded neighborhoods changes the model and needs a
new profile/behavior comparison. No large-world readiness is claimed here.

## Open Questions

| ID | Question / provisional decision | Owner | Blocks |
|---|---|---|---|
| IQ1 | Use independently clamped [0,1] preferences, not a probability distribution; will saturation obscure desired behavior? Measure and revise gains under a new profile if needed. | World owner/evaluator | D5 if all meaningful scenarios saturate or axes are inert |
| IQ2 | Caution initially means energy conservation; collisions, hazards and trust are separate concepts. Confirm through the D1 contract and R0 review. | Product owner | Hazard expansion, not this energy-only prototype |
| IQ3 | Which exact feature weights, reserve pressure function, progress term and tie order meet the directional fixtures? Freeze in D1 before coding, retain adverse comparisons. | World implementer | D2/D3 contract completeness |
| IQ4 | Should future actors use synchronous allocation or fairness rotation? Initial stable-ID sequential effects are explicit and measured for bias. | Simulation owner | Later fairness claims, not local deterministic mechanics |
| IQ5 | What population/tick budget justifies a semantic index? No budget inferred from browser load views. | Product owner/evaluator | S1 acceptance target only |
| IQ6 | Which renderer should visualize diagnostics? Existing G02 owns renderer preference; future replay integration must preserve exact source state. | Product/UI owner | UI integration only |
| IQ7 | Which installed DomainSpec profile/compiler supports this bounded prototype source? Resolve by bounded repository lookup during D1C; record unsupported constructs explicitly. | DomainSpec binding implementer | D1C/D2, not D0/D1 |
