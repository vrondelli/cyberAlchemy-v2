---
taskId: TASK-GCP-GRAPH-LAWS
layer: L2
slice: S3
status: blocked-on-L0-L1
complexity: high
---

# Task GCP Graph Laws

## Objective

Add bounded graph-level evaluators for reachability, cycle, and closure claims
without pretending they are a universal FOL/Cedar/Datalog engine.

## Dependency And Gap

Blocked until `SWU-GCP-001` and one L1 repeatability receipt exist. An
independent graph-law oracle and query contract are still missing.

## Candidate SWU

Define one bounded reachability query, its independent expected result, and a
receipt. Split analysis and write scope must be completed after L1 evidence.
