# CyberAlchemy Orchestrator Product Journey

Status: candidate  
Authority effect: none

## Primary journey

1. **Describe the goal.** The user explains the outcome and constraints in the Control Center or API.
2. **Choose a strategy.** The user authors a strategy or selects a versioned Strategy Template.
3. **Instantiate it.** Parameters produce a concrete Strategy and Dispatch Proposal.
4. **Review the dispatch.** The product shows lanes, assignments, graph shape, capabilities, gates, limits, and effect boundaries.
5. **Admit the run.** Explicit admission freezes a content-addressed Run Bundle.
6. **Execute commands.** The runtime schedules checked Command Intents to compatible Workers or Agents.
7. **Accept progress.** Workers return receipts and Event Proposals; the controller validates them and asks RWO for the next Structural Transition.
8. **Observe and recover.** The Control Center projects current state, attempts, leases, receipts, blockers, and recovery choices from durable records.
9. **Understand the result.** The Strategy Result links outputs, evidence, effect dispositions, and unresolved questions.
10. **Reuse or revise.** The user saves a Run Template or changes the strategy, producing a new reviewed version.

## Comprehension journey

- **Runs** answers what is happening and what happens next.
- **Graph** answers how accepted work is connected and which nodes can progress.
- **Lab** answers which orchestration assets and prior executions can be inspected or reused.
- **Ontology** answers how product records relate across templates, strategies, runs, work, roles, and adapters.
- **Operations** answers whether runtime capacity, durability, recovery, and execution adapters are available.

All five views derive from API records. They do not maintain a competing
execution state or grant effects through observation.

## Journey invariant

Every shortcut, template button, chat instruction, API call, local Worker, and
Gateway-backed Agent crosses the same proposal, admission, command, receipt, and
accepted-history boundaries.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
