---
module: specified-first-order-logic-framework
status: approved
updatedAt: 2026-07-23
docType: cross-task-decisions
---

# Cross-Task Decisions

| Decision | Applies To | Enforcement |
| --- | --- | --- |
| DS-SFOL v1 is bounded, typed, finite, and executable. | all tasks | grammar registry and unsupported-residue tests |
| Denominator and evaluator are independent trust boundaries. | 001, 005, 007-012 | forbidden dependency scans |
| Expected values stay in source logic, never bindings. | 006-012 | binding schema rejection tests |
| Pure and effectful observations are different contracts. | 007-009 | distinct runner interfaces and tests |
| Source logic stays in owning DomainSpec documents. | 010-012 | source anchor/digest round-trip |
| Generality requires an adopter-neutral corpus and two adopters. | 007, 011, 012 | vocabulary and compatibility checks |
| One Task Session executes one SWU. | all mutation tasks | terminal receipt and deterministic successor |
| Structural BTE evidence remains separate. | all tasks | no result merging or readiness inflation |

Changing any decision requires an Invoke refresh or a new Define/Design
decision; a Task Session may not silently revise it.
