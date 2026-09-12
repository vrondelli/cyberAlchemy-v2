# Interaction v1 contract

Status: local implementation contract. Authority effect: none.
Profile: [PROFILE.json](PROFILE.json). Questions: [REPORT.md](REPORT.md#open-questions).
The reviewed [plan](PLAN.md) supplies scope; this contract resolves D1 choices.

## Meaning and phases

Physical position has two coordinates. Semantic state has four independent axes,
ordered exploration, construction, cooperation, caution. Priors are finite [0,1];
raw memory is finite nonnegative. `s = clamp(prior + gain * memory, 0, 1)`.
Utility weights are `w = clamp(s + semantic_force, 0, 1)`; they are not permissions.
Caution means energy conservation only. Cooperation means delivering useful stock.

A tick snapshots semantic states and previous completed-interval velocities. In
stable agent-ID order, each actor proposes one currently eligible action through
the unchanged checked reducer. The successor suppresses inline legacy memory
writes. A newly committed event queues one impulse, keyed by its event hash.
Duplicate accepted receipts queue nothing. Wrong owner, stale revision and invalid
actions have no effect. An actor may commit at most one action in an open tick.
No external/network actor is authenticated by these local caller strings.

The clock commit computes `m_next = m_start * exp(-rates * dt) + impulses`, advances
tick once and updates semantic velocity `(s_next-s_start)/dt`. Velocity and traces
live outside the legacy state format. Internal tick failure seals the world against
continuation; the partial prefix remains diagnostic evidence. Process recovery is
not implemented. Standalone manual actions open a tick; `finish_tick` commits its
clock, while `step` completes the remaining actors before closing it.

Initial dt is exactly 1. Actions: gather adds (0.1,0,0,0), build (0,0.5,0,0), deposit
(0,0,0.3,0); an accepted move leaving energy <20 adds (0,0,0,0.1). Wait adds zero.
With one action per tick, each component is bounded by
`max(m_initial, max_impulse/(1-exp(-rate)))`; initial zero gives approximately
(1.301,25.251,7.651,1.051). Saturation of s is counted, not hidden.
For m=1, lambda=log(2), dt=1 and impulse=0.5, m_next=1; without impulse, m_next=0.5.

## Steering

For axis scale a, convert position q=s/a and velocity u=v/a. Each neighbor supplies
delta=q-q_neighbor and d=Euclidean norm(delta). Separation is delta/max(d²,0.01)
when d<0.5, otherwise zero; coincident states give zero separation. Alignment is
u_neighbor-u; cohesion is q_neighbor-q. Average each term over all other robots,
multiply by (0.05,0.1,0.08), sum and cap the norm to 0.15 in scaled coordinates.
Convert force back by multiplying axis scales. Empty neighbors give zero.
All three terms use the same metric. Pure-helper unit rescaling scales positions,
velocities and scales together; its scaled force is invariant. The world's [0,1]
semantic convention itself is fixed, not reinterpreted as arbitrary units.
Example: pure alignment from velocity 0 toward neighbor velocity 1 gives scaled
force +0.1; pure cohesion from 0 toward 1 gives +0.08; close separation pushes away.

## Legal candidates and scoring

Each candidate is evaluated by a throwaway copy of the existing reducer before
selection, then applied to current state through that same reducer. This avoids
a separate permissive eligibility implementation. Rejected candidates retain their
reason in the trace and never enter the argmax. Semantic weights stay frozen during
the tick; physical/task inputs are current, so contention losers see remaining stock.

Useful tasks: acquire if cargo<3 and resource>0; deliver if cargo>0 and stock<6;
construct if stock>=6. At resource/workshop, offer their valid terminal action.
Otherwise offer a bounded move toward the useful destination. Delivery remains
legal when stock>=6, but carries zero useful-delivery feature; it may still win the
progress tie. For cargo>0 at workshop, build is also eligible when stock>=6.
Deduplicate moves to the same destination, retaining combined feature opportunities.

For each action/task define features:

| Feature | Value |
|---|---|
| exploration | 1 for eligible gathering or travel toward available resources with spare cargo; otherwise 0 |
| construction | 1 for building or travel toward workshop with stock>=6; otherwise 0 |
| cooperation | min(cargo,max(0,6-stock))/3 for deposit or travel toward workshop; otherwise 0 |
| caution | -max(0.05,1-energy/20) for a move, otherwise 0 |

Travel multiplies the first three features by 0.6. Every move costs exactly 1,
irrespective of distance; zero-energy movement is ineligible. Terminal actions cost
zero. Score=sum(w[k]*feature[k])+0.05 for productive candidates; wait scores 0.
Ties follow PROFILE tie_order; no random policy sampling. Moves are productive only
if they approach a currently useful task. Positions round to six decimals as in
the legacy runtime. No recharge is implied by waiting.

Hand oracles, zero steering: at midpoint with cargo=1, stock=0, energy=100,
w=(0.1,0,0.9,0), resource travel scores 0.11 and delivery travel 0.23: deliver.
Changing cooperation to 0 gives resource 0.11 versus delivery 0.05: acquire.
With no cargo, available resources, energy=1, w=(0.1,0,0,0), moving scores 0.11;
changing caution to 1 gives -0.84, so wait wins. Changing exploration from 0 to 1
against caution=0.2 at energy=1 changes move from -0.14 to 0.46.
With stock=6 and no cargo, construction versus exploration chooses the destination
with the higher corresponding weight. Each axis has a dedicated frozen fixture.

## Traces, tests and stopping

Each tick trace carries profile digest, dt, snapshot/revision, each actor's prior,
start/end memory, impulses, s, previous velocity, neighbors, steering components,
weights, candidate features/scores/eligibility, chosen intent and receipt, clock
receipt and state digest. Exact state/event/replay/trace hashes identify runs.

Checks: resource+stock+sum(cargo)+6*built is conserved after every commit; energy
is nonnegative, motion/cargo bounded, event chains valid, frames exact. Repeat-run
checks are for the named Python environment, not cross-platform float identity.
Run until requested 80/1000 ticks, or 20 consecutive all-wait ticks. The latter
is window-censored observed quiescence, distinct from energy exhaustion, and is
not proof of permanent stasis. Exogenous impulses use a separate pure-mechanics
fixture, never fabricated world actions. Ablations compare both actions and
intermediate numeric/score effects so an unchanged action is not concealed.

From repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s development/robot-world-kep/runtime -p 'test_interaction_dynamics.py' -v
PYTHONDONTWRITEBYTECODE=1 python3 development/robot-world-kep/runtime/run_interaction_experiments.py --output /tmp/robot-interaction-new-run
node --import ./agent-routing/node_modules/tsx/dist/loader.mjs development/robot-world-kep/interaction-dynamics/domainspec/build.mjs --check
```

The runner refuses existing output directories. Compiler --check writes nothing.
Legacy tests use `test_prototype.py` and the repository Rust launcher when builds
are needed. Source and compiler identities are bound by the candidate manifest.
