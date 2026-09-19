# CB4 first-exposure amendment

Prospective amendment to preserve the requested capacity evaluation after an
infrastructure failure. The original ContextBench task 4 could not check out its
pinned source tree in either arm. Both arms recorded zero model calls, zero known
model tokens and no unknown usage. Repairing that exact cache permits this same
task's first exposure; it does not permit retrying an observed model outcome.

Keep the original freeze, all first-stage outputs, original failed scaling
admission and original results unchanged. Bind the cache repair evidence and exact
additive code in `AMENDMENT-FREEZE.json` before any supplemental generation.
Preserve task, source revision, model, request settings, AB order, scorer and all
other original outcomes, including quality failures. No outcome-dependent tuning.

From this directory, the coordinator runs:

```sh
node amendment.mjs freeze
node amendment.mjs repair
node amendment.mjs admit
node amendment.mjs stage2
```

`freeze` verifies the original source bindings, successful infrastructure repair
and original zero-exposure proof. `repair` repeats those checks and permits one
sequential pair worker only when the original queue has no pending ContextBench
job and at most one running ContextBench worker. Its fresh directory is
`amended-live/first-exposure-cb4/pairs/contextbench-4/run/`.
A scheduler checkpoint prevents repeating a started or completed generation.

The supplemental pair reserves 192,000 tokens from the original CB4 allocation.
It does not raise the first-stage ceilings of 768,000 ContextBench and 204,800
LongMemEval including judges, or the combined two-stage ceiling of 1,945,600.
Known original spending and in-flight/unknown reservations remain counted.

`admit` accepts only the original gate's CB4 missing-exposure/window reasons.
Every other original health condition remains required, including two simultaneous
requests per benchmark and four total. The supplement must have known usage,
valid 8K dispatch evidence, both arms exposed and no capacity failure. Quality
outcomes never determine scaling. A new `AMENDED-SCALING-ADMISSION.json` records the
decision; the original false gate is never overwritten.

`stage2` uses the unchanged original stage2 manifest and source freeze, with four
workers per benchmark, under the new gate. Its evidence goes to
`amended-live/stage2/`. All reports explicitly distinguish original infrastructure
failure, supplemental first exposure and the amended comparison. Keep eight
planned slots per arm and every original non-CB4 outcome. This is amended
**development evidence**, not a retrospectively clean preregistered success.

## Open Questions

Can the repaired first exposure satisfy the unchanged health gates? Can eight
workers run successfully? Do the unchanged quality and 15% whole-task token gates
pass? Original and amended results retain separate answers and evidence.
