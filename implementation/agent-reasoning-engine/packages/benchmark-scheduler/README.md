# Benchmark scheduler

One coordinator runs independent model jobs concurrently while keeping memory
dependencies sequential. It persists reservations before effects and checkpoints
each result. It does not launch Codex subagents or change the evaluated model.

```js
import {runScheduler} from './scheduler.mjs';
const state = await runScheduler({
  directory: './run-001', concurrency: 2,
  manifest: {id: 'example', token_budget: 200, jobs: [
    {id: 'read', depends_on: [], reservation_tokens: 100},
    {id: 'answer', depends_on: ['read'], reservation_tokens: 100},
  ]},
  execute: async (job, {dependencies, attempt_id}) => {
    // Invoke an adapter using this attempt ID and the declared prior results.
    return {usage: {prompt_tokens: 10, completion_tokens: 5, total_tokens: 15},
      output: {text: 'example'}};
  },
});
```

`depends_on` requires successful outputs. Optional `after` waits for terminal
states without using their outputs, for example control/treatment ordering.
Exceptions may carry `receipt.usage` and `receipt.error_code`. Missing usage holds
the full reservation; it is not zero actual cost. Errors 1302/1305/429 reduce future
concurrency without retrying the failed job. Calls already in flight finish.

## Resume and recovery

Use the same run directory and byte-equivalent JSON manifest. Completed, failed,
unknown and budget-blocked jobs are never automatically repeated. The scheduler
rejects changed manifests. A started job interrupted before its checkpoint becomes
unknown with its reservation held, even if provider evidence may later prove its
outcome. Evidence reconciliation is a separate reviewed operation.

The exclusive `.scheduler-lock/owner.json` records the process ID. A crash may leave
the lock behind. Verify that the exact owner process has terminated and that no
provider activity remains before manually clearing that run's lock. Elapsed time
alone is not proof. Never start a replacement while the old handle is live.
Checkpoint writes use atomic rename; this is process-crash protection, not a claim
of power-loss durability on every filesystem. Keep provider attempt receipts.

`summarizeRun` in `report.mjs` reports fixed denominators, measured job overlap,
actual known tokens, uncertain reservations and errors separately. It does not
score open-ended benchmark answers or infer source entailment.

## Integrated GLM CLI

The current adapter and CLI live at
`development/agent-reasoning-engine/planning/representation-preferences/concurrent-benchmark-v1/`.
From the repository root:

```sh
node development/agent-reasoning-engine/planning/representation-preferences/concurrent-benchmark-v1/cli.mjs run MANIFEST RUN_DIRECTORY 2
node development/agent-reasoning-engine/planning/representation-preferences/concurrent-benchmark-v1/cli.mjs resume MANIFEST RUN_DIRECTORY 2
```

The CLI checks optional source bindings before accessing credentials, uses actual
tokenizer admission, and writes `checkpoint.json`, per-job results, provider
receipts and `report.json`. `buildLongMemManifest` reuses the existing complete
history adapter, isolates notes by task/arm/repetition and excludes gold fields.
Its output is a new experiment and must receive its own reviewed protocol freeze.

## Open questions

The concurrent-benchmark-v1 report owns measured account throughput and the next
replication. Multi-process distributed workers, provider cancellation, automatic
uncertain-attempt reconciliation and larger-scale quota tuning are not implemented.
