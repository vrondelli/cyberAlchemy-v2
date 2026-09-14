# Orchestrator Capabilities

Status: implementation candidate  
Authority effect: none

`orchestration/` implements general Strategy validation, recursive Work
compilation, versioned Strategy Template instantiation, Dispatch Proposal review,
explicit Run Admission, Agent Requirement checks, checked Agent Turns, and an ARE
adapter behind a transport trait.

`supervise_once` is the reusable scheduling step: it polls for one compatible
command, acquires its durable lease, executes the selected adapter through the
checked Agent Turn boundary, records the receipt, and lets the runtime submit
the resulting event to RWO. A host may repeat this step, but owns its own timing,
shutdown, and adapter lifecycle.

A saved-template button and a directly authored strategy compile through the
same functions. Scripted agents and ARE-backed agents produce the same runtime
Receipt and Event Proposal types. No adapter mutates RWO state directly.

Pre-admission `AgentRequirement` values describe who and what a strategy needs.
The runtime alone creates an `Assignment` after a concrete command, attempt,
lease, and fence exist.

## Open Questions

Template publication ownership and the supported first-edition adapter set remain
candidate definition questions.
