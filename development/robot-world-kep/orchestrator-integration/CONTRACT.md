# World execution contracts v1

Status: local prototype; authority effect none. Open questions: PLAN.md.

`robot-world.run/v1` binds the default initial world, numerical profile and engine
bytes to a fresh orchestrator command. It executes 1–100 complete scripted ticks,
stopping at the horizon or 20 all-wait ticks. No task supplies a caller, path,
code, memory override, checkpoint or model. The host selects the Python executor.

`robot-world.verify/v1` consumes the accepted run node's exact output. It checks
every hash and reconstructs actions and clock transitions independently from the
initial state. It compares all committed states, frames, memory and trace bindings.
Policy determinism is checked separately by regenerating the scripted trace.
Verification proves this bounded local contract, not product approval.

The input schema is closed. SHA-256 refers to canonical JSON (UTF-8, sorted keys,
compact separators, finite numbers) for semantic payloads and raw bytes for source
files and output artifacts. Engine identity includes Python and jsonschema versions.

Each worker invocation binds command ID, canonical input digest and fencing token.
The orchestrator is the sole execution-history writer; the worker owns one isolated
simulation. Outputs are exclusively created and fsynced before receipt acceptance.
An accepted duplicate returns the exact cached output; changed requests reject.
An interrupted attempt cannot redispatch automatically. It requires a fresh run or
explicit reconciliation. A world snapshot alone is not a resume checkpoint.

Cancellation is observed between ticks and acknowledged only after the process
stops. A hard timeout retains unknown/partial effect evidence. No cancelled output
can satisfy the verifier dependency. Lease/deadline time is wall-clock time;
simulation dt remains 1. Artifacts are capped at 32 MiB and jobs at 120 seconds.
Completed simulations distinguish stop reason and constructed count from task
completion. File and simulation effects are reported as applied, never as authority.

No ARE gate is treated as launch permission. The local launch command is explicitly
owner-directed; it does not consume arbitrary ARE output to authorize dispatch.
The existing ARE decision and world-action boundaries remain separate.
