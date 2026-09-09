# capacity-curve

First crate migrated into the repository's central Cargo workspace. It models
self-hosted inference capacity without binding the result to a particular chip.

The input contract separates three kinds of evidence:

- `ModelProfileV1`: checkpoint identity, architecture, capabilities, weight
  artifacts, context limits, and theoretical KV/recurrent-state formulas;
- `ServingProfileV1`: an exact observed runtime configuration and its measured
  request/response throughput and per-replica memory;
- `CognitiveProfileV1`: observed swarm scale, facets, semantic gates, and
  accepted unique evidence per minute.

Run from the repository root:

```text
cargo run --locked -p capacity-curve -- model import \
  --config config.json --artifacts artifacts.json \
  --revision <40-character-checkpoint-commit> --out model-profile.json

cargo run --locked -p capacity-curve -- model validate --input model-profile.json

cargo run --locked -p capacity-curve -- plan \
  --input scenario.json --json-out plan.json
```

Rates use milli-RPS, memory uses bytes, duration uses milliseconds, and all
counts are integers. A model with an unknown required capability is rejected.
Techniques such as prefix caching, expert offload, or FreeToken affect planning
only when their measured memory and throughput are recorded in an exact
`ServingProfileV1`. V1 accepts exactly one observed scale point per
`CognitiveProfileV1` (`max_scale_copies` must equal `1`): a 50-RPS observation
cannot make 70 or 100 RPS feasible. Each additional scale point needs its own
measured cognitive profile. Different models are never mixed in one allocation.

Candidates may embed profiles or use digest-bound `model_ref`, `serving_refs`,
`cognitive_refs`, and `cost_refs`. References must stay below the scenario
directory and carry the SHA-256 of the referenced JSON bytes. When a scenario
sets `max_cost_microunits_per_hour`, an exact observed cost profile is mandatory;
missing cost is not interpreted as zero. Accepted evidence is optimized as a
union of stable IDs, so duplicate bundles cannot inflate yield.

Every cognitive observation must encode `Distill -> three proposal tracks ->
Tournament`, with the role worker total equal to the profile's worker count.
The planner compares complete observed scale points rather than combining them
into an unmeasured scale. Curves with up to 32 observations use an observed-point
scan; larger curves use the same deterministic Pareto-frontier selection without
constructing an exponential combination space. Output includes per-model
saturation, the selected observed model for each target, search strategy,
combinations examined, stable evidence IDs, and observed cost when supplied.

Memory validation enforces artifact weight bytes, theoretical KV/recurrent
lower bounds, and Little's-law consistency. Prefix memory is derived as one
shared-prefix KV copy per serving replica plus unique suffix KV and recurrent
state per in-flight request.
