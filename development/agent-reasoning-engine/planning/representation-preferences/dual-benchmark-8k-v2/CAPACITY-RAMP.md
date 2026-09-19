# Two-to-four-worker execution gate

The user requested two workers per benchmark, followed by a measured trial of four per benchmark. Worker count changes throughput; it is not evidence of token efficiency. The enduring objective, exact 8,000 input-plus-reserved-output limit, fixed denominators, quality requirements and at least 15% total model-token reduction per benchmark remain unchanged. See [CURRENT-PROGRESS.md](CURRENT-PROGRESS.md).

## Ordered dependencies

1. Finish the two-worker implementations, source validation, evaluator isolation and exact freezes for both branches. LongMemEval has a verified freeze; ContextBench is integrating the infrastructure repair. The ContextBench archived packet trial is a component diagnostic, not the full trajectory benchmark.
2. Admit enough real Windows host and WSL space for both evidence streams above their reserves. Account for concurrent growth before launch, not only each process's individual floor. Keep source restoration bounded and retain all failed-attempt costs.
3. Run at most two request workers in each benchmark, four generation workers in total. Tokenizer and judge traffic also counts toward provider load. Keep local request timestamps, provider statuses, known and unknown token usage, and every scheduled slot. Report configured worker count separately from observed simultaneous requests.
4. Seal both branches and reconcile every dispatched request. Infrastructure failure, provider capacity errors, unresolved usage or insufficient storage prevents the capacity ramp. Scientific failure leads to a hypothesis decision; it must not be hidden by changing concurrency.
5. Preregister a separate four-worker capacity trial with unchanged request construction, fixed tasks and reserved budgets. First measure four workers in one branch while the other remains at two; admit four plus four only after that stage completes without capacity or accounting failures. Freeze each stage before dispatch. Do not edit the completed two-worker run in place.
6. Report throughput, overlap, completion and failed-call token overhead separately from benchmark accuracy and savings. Concurrency repeats on exposed tasks are operational evidence; they are not untouched quality confirmation.

## Required evidence for each stage

Record the exact source and runtime hashes, assigned benchmark/task/arm IDs, fixed denominators, worker limits, reservations, host/guest capacity, actual dispatch/start/finish timestamps and terminal receipts. Include all model input and output, ingestion, reasoning and cached-input subtotals without double counting, failed calls and judges. Retain unknown spend conservatively; never replace it with zero.

A shared supervisor is still required before simultaneous production dispatch: enforce the combined process limits, stop admission across both branches on provider capacity or unknown-usage failures, and drain/seal existing requests. Independent two-worker processes alone do not establish this cross-benchmark health behavior. The current frozen LongMemEval comparison may run by itself once storage admits it; simultaneous or four-worker execution requires a separately reviewed supervisor and stage freeze.

## Open questions

Does the provider sustain four and then eight concurrent generation requests without capacity errors or added failed-call token cost? How much evidence-growth headroom do simultaneous long-history and source-selection runs require? Can the candidate retain benchmark quality while meeting the separate 15% token gates? No current artifact establishes eight-worker capacity for this workload.
