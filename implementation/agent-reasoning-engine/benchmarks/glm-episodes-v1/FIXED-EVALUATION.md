# Fixed v20 evaluation

`fixed-evaluation.py` runs a declared schedule using the existing episode runner and independent report checker. It currently accepts only `example-fields-v20`, the four existing episode IDs, clear/recent-v2 retention, and 8K/10K/12K windows. It does not choose prompts, tune the candidate, retry requests, or replace failed trials.

A closed JSON plan names each trial and declares aggregate limits. The evaluator derives the required maximum calls from the schedule (16 model/32 tokenizer at 8K, 12/24 at larger windows) and rejects a mismatched declaration. Schedules contain at most sixteen trials. Every arm keeps the existing 580-second deadline; the subprocess ceiling is 660 seconds. The outer batch start deadline is 660 seconds times scheduled trials.

Validate a plan without credentials or provider calls:

```sh
python3 fixed-evaluation.py --plan evidence/fixed-repeatability-2026-09-08/schedule.json --check
```

Run an already authorized plan with the pinned Node launcher available, inherited secret-bridge environment, and fresh directories whose parents exist:

```sh
python3 fixed-evaluation.py --plan PLAN.json --node /path/to/pinned/node \
  --credential /path/to/credential-reference.json \
  --raw /tmp/new-private-run --output /path/to/new-evidence-directory
```

The credential file is a reference consumed by the existing runner; it is not copied into exported evidence. The manifest freezes episode sources plus the evaluator, report checker and plan. Their hashes are checked before and after each arm. Raw attempt logs stay in the private run directory. Exported traces whitelist visible evidence and omit raw message history/provider reasoning. Existing output directories are rejected. Started records are exclusive and durable; progress is replaced atomically. A crash does not authorize resume or retry.

Valid failed arms remain counted and the next predeclared arm continues. Invalid reports, source/task drift, subprocess failure or driver errors stop the batch; started records and private logs remain for diagnosis. An incomplete arm's unknown usage is not reconstructed as zero. Result `COMPLETED` means the schedule finished, not that its target passed. The target requires every repair and delivery gate, continuity for every recycled trial, positive headroom, and recycling on each long 8K trial. Independent raw reports enforce the existing admission and candidate contracts.

Tests: `python3 fixed-evaluation.test.py`. They exercise closed plans/caps, failure accounting, long-window recycling requirements, source drift, evidence export redaction, and exclusive/atomic records. The live run is integration evidence for the full subprocess path; no mock model success is presented as a live repair.

## Open Questions

The current fixed repeatability [plan](evidence/fixed-repeatability-2026-09-08/PLAN.md#open-questions) owns reliability questions. Larger matrices, unseen tasks, signed evidence and automated resume are outside this version. Observable recycling cannot prove that provider-internal compaction never occurs.
