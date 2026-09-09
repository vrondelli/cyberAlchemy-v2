# PythonConstraint Proof-Agent Experiment Harness

Status: candidate, prepared-not-authorized-for-live-runs  
Harness: `PYC-PROOF-AGENT-HARNESS-001`  
Experiment: `CA2-EXPERIMENT-PYTHONCONSTRAINT-WHOLE`  
Authority effect: none

## Question

For pinned PythonConstraint Wave-1 obligations, how do worker model, worker count,
sequential versus parallel scheduling, and ontology-indexed versus plain presentation affect
proof correctness, elapsed time, aggregate agent effort, token use, rework, and scope safety?

The harness treats ontology-first preparation as a hypothesis. Both context conditions must
contain exactly the same frozen fact IDs. A run with added or missing facts fails context parity
and cannot support an ontology-effect comparison.

## Controlled Factors

| Factor | Levels |
| --- | --- |
| Worker model | Enabled profiles in `models.json`, with reasoning effort pinned. |
| Worker topology | One worker; two independent workers sequentially; the same two workers concurrently. |
| Context | `plain_facts` or `ontology_indexed`, with an identical `fact_set_digest`. |
| Task | Two Wave-1 screening obligations in `tasks.json`. |

The root orchestrator is held constant inside a comparison block and is not counted as a worker.
The two-worker conditions use identical independent roles and merge policy; only scheduling differs.

## Measures

- native Lean compile, official grader, and axiom-probe status;
- attempted and terminal proof-obligation counts;
- scope violations, accepted helpers, merge rework, and blocker class;
- wall-clock, summed worker-active, root-orchestration, and wait time;
- input/output tokens when the runtime exposes them; otherwise `null` plus an explicit unknown path;
- actual spawn count and peak parallelism, so declared topology cannot substitute for observed behavior.

## Operations

```bash
python3 scripts/harness.py validate
python3 scripts/harness.py plan --stage smoke
python3 scripts/harness.py plan --stage screen
python3 scripts/harness.py next --stage smoke
python3 scripts/harness.py report
```

`plan` and `next` write nothing. `validate` verifies source digests, schemas, factor closure,
task fact digests, and positive/negative fixtures. `report` summarizes only validated records in
`runs/`; with no records it returns `not_evaluable`.

## Live-Run Gate

This package does not launch agents. Before a live run, the owner must freeze:

1. exact model identities, reasoning effort, runtime, and budget;
2. pristine per-run sandboxes and the benchmark/toolchain digests;
3. the plain and ontology-indexed packets and their fact-parity receipt;
4. randomized run order and repetition count;
5. an accepted cost/time ceiling;
6. for two-worker regimes, a CyberAlchemy-v2 fan-out sheet naming both workers, scope, join,
   close, and receipt rules.

Every worker must be joined and closed. Timed-out, hidden, or unjoined workers make the run
`blocked`; they are not silently dropped from timing or quality totals.

## Interpretation Boundary

The screening matrix is exploratory. Model rankings must be reported per task and context before
aggregation. Parallel speedup is `sequential wall_ms / parallel wall_ms` only for matching model,
task, context, and repetition. Worker-count benefit compares one versus two workers. Ontology
effect compares paired presentations with identical fact-set digests. These contrasts cannot be
collapsed into a single EVF-effectiveness claim.

## Claim Ceiling

This is a prepared candidate harness. It does not authorize model calls, dispatch subagents,
prove any PythonConstraint theorem, admit the ontology, establish causal benefit, rank models,
prove EVF effectiveness, achieve the Goal, or authorize Rust, Haskell, publication, or deployment.
