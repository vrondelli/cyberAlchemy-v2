# RWO: how it works and why we use it

RWO stands for **Recursive Work Orchestrator**. It coordinates the structural
progress of work: given a work definition, current progress, and an event, it
calculates the next state and which commands should be issued.

Workers perform tasks and report outcomes. RWO calculates the structural
consequences. The surrounding host records accepted transitions and dispatches
the resulting commands. This separation makes coordination explicit, testable,
and replayable across different kinds of workers.

This is an explanatory candidate, checked against local sources on 2026-09-12.
It does not redefine the contracts or claim that every orchestration path uses
the RWO kernel. The implementation distinction is described below.

## Why “recursive”?

A unit of work can contain smaller units, which can themselves contain further
work. For example:

```text
Prepare report
├── Collect evidence
│   ├── Retrieve sales
│   └── Retrieve costs
├── Write analysis
└── Review report
```

“Collect evidence” is a composite inside another composite. The same structural
model can describe both levels. The example is bounded; recursive composition
does not imply unlimited nesting or prove that arbitrary recursion terminates.

The design requires one root execution authority for the graph. Nesting work
does not create a new, independently authoritative scheduler or journal at every
level. “Recursive” describes work composition, not an agent repeatedly thinking
or invoking itself. The [source registry](../work-orchestration/sources.json)
records the original title, “Thin Recursive Work Orchestrator — Design”; the
[composition and ownership model](../work-orchestration/nodes.json) records
these boundaries.

## The problem it solves

Once work has parallel tasks and dependencies, completion order matters. A
summary may require two inputs, a repeated completion message must not advance
the workflow twice, and an interrupted run needs an inspectable account of its
progress.

RWO centralizes the structural rules behind those transitions. With the same
versioned definition, reducer, and accepted event sequence, structural replay
derives the same progression. Workers can change without each worker having to
implement the whole workflow's coordination logic.

The benefit is predictable coordination and evidence of how work progressed.
Durable storage, recovery, and safe handling of external effects still require
the surrounding host and domain-specific mechanisms.

## Commands, events, and progress

| Term | Meaning | Example |
| --- | --- | --- |
| Work definition | Declared structure and inputs of the work | Collect two datasets, then summarize, then review |
| Command intent | A derived request for a task to be dispatched | Retrieve sales for the selected period |
| Event | A report of an outcome tied to assigned work | Sales retrieval succeeded, with this output reference |
| Cursor | The recorded structural progress of a run | Sales finished; costs still pending |
| Accepted history | Events and transitions committed by the designated host owner | The sequence used to reconstruct progress |

A command requests work. An event reports an outcome. A submitted event becomes
part of accepted history only after the host checks and accepts it.

RWO's operation can be pictured as the following conceptual relationship; this
is not a literal API signature:

```text
Work definition + current cursor + incoming event
                       ↓
             Structural calculation
                       ↓
      Next cursor + zero or more command intents
```

Producing zero commands is useful: one task may finish while another required
dependency is still pending. The host also handles invalid or duplicate inputs;
not every incoming event results in a new accepted transition.

## A complete execution cycle

Imagine a report that needs sales and costs before analysis can begin:

```text
Retrieve sales ──┐
                ├── Write analysis ── Review report
Retrieve costs ──┘
```

1. **Start the work.** The host initializes structural progress and obtains the
   initial commands for the two retrieval tasks.
2. **Dispatch a command.** A compatible worker receives the task and its inputs.
   The worker may be an ordinary program, a service adapter, or an AI agent.
3. **Perform the task.** The worker retrieves sales data and produces an output.
4. **Report the outcome.** Its adapter constructs an event identifying the task,
   command, outcome, and output reference. Printing “done” is insufficient: the
   adapter must submit the expected structured message.
5. **Check and calculate.** The host checks the submission and obtains its
   structural consequence. Sales becomes complete; analysis remains waiting if
   costs has not finished.
6. **Accept the transition.** The designated history owner atomically records
   the accepted event, next cursor, and complete command batch. The structural
   core does not accept its own history.
7. **Dispatch the next work.** After both required outcomes are accepted, the
   host can dispatch analysis. Its accepted completion subsequently releases
   review.

The worker reports what happened. The core calculates how that affects the
declared work. The host makes the transition durable and operational according
to its configured implementation.

## What each part owns

| Part | Responsibility |
| --- | --- |
| RWO kernel | Structural compilation, reduction, cursor replay, and immutable command intent derivation |
| Host and accepted-history owner | Acceptance and storage of transitions; operational dispatch and execution ownership |
| Worker adapter | Translate an assignment into execution and its outcome into the expected messages |
| Worker or agent | Perform the assigned computation or action |
| Domain contracts and validators | Operation meaning, result correctness, recovery and compensation policies, and business completion |
| ARE, when used | Its configured reasoning and request-decision tasks; its output crosses the same host boundaries |

These boundaries are fixed in the [RWO realization selection](../authority/decisions/work-orchestration-rwo-realization/selection.json).
The pure kernel does not execute work, call models, own a queue or journal,
schedule retries, manage credentials, or authorize effects. A retry
classification is a calculation; executing a retry is a host action governed by
the applicable policy.

## What the guarantees mean

**Replay reconstructs structural progress.** It does not require re-running the
worker or reproducing an AI model's text. Re-executing work is a separate action
that can produce a different result or repeat an external effect.

**Duplicate detection protects progression.** It does not alone guarantee
exactly-once effects. For example, preventing a second completion transition
does not prove that a payment was sent only once. Effect idempotency and
reconciliation belong to the host and the relevant domain adapter.

**Accepted completion is scoped.** Accepting “analysis finished with this
output” does not prove the analysis is correct, approved, or ready to publish.
Validation and approval must be represented by their own contracts and owners.

## How this maps to the current implementation

The package contains both a vendored `rwo-rust` semantic core and a separate
`DagEngine`. They must not be presented as one implementation path.

- The core/demo code calls the RWO `reduce_event` API.
- The inspected durable service calls `DurableRunController.accept_event`,
  which uses `DagEngine.apply_event`. That path does not directly invoke the
  vendored RWO reducer.
- In that durable service, the worker adapter submits a `CommandReceipt` before
  `SubmitEvent`. Receipt checks bind the result to the pending command, run,
  inputs, and fencing token. Event acceptance requires a matching receipt.
- The controller records the accepted event, next cursor, and derived commands
  together. Identical duplicates are recognized; divergent event reuse fails.

Calling the whole package “the RWO orchestrator” therefore names a broader
assembly. It is not evidence that every runtime transition passes through the
pure RWO kernel. Making that connection requires an explicit implementation
binding and validation.

Implementation evidence in the inspected sibling checkout:

- [Kernel scope and exclusions](../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/vendor/rwo-rust/README.md)
- [Core/demo reducer calls](../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/lib.rs)
- [Worker request handling](../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/worker.rs)
- [Durable acceptance controller](../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/controller.rs)
- [DAG transition engine](../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/dag.rs)

These sibling links require that checkout layout. The conceptual explanation
above remains readable without it. Package-specific claims are also scoped in
the [implementation README](README.md).

## Open Questions

- Should the durable DAG path bind directly to the pure RWO reducer, or remain
  a separately specified structural implementation? Its owner must select and
  validate that relationship.
- Which exact deployment and durability profile will be supported? The kernel
  alone cannot establish process-loss, host-loss, or external-effect recovery.
- Where should the historical design and frozen contract be made available for
  readers who lack the original source checkout? Their identities are preserved
  in the realization selection; this explanation is not their replacement.
