# CyberAlchemy Orchestrator Product Thesis

Status: candidate  
Authority effect: none

## Problem

Useful agent workflows are often trapped in prompts, scripts, provider-specific
sessions, or domain-specific interfaces. Their participants, dependencies,
gates, retries, evidence, and consequences become difficult to review and reuse.
A successful response can also be confused with accepted truth or an executed effect.

## Thesis

A general orchestration product should let a person express a bounded strategy,
inspect the exact dispatch it will create, admit a versioned run contract, and
observe durable execution through one understandable control plane. The same
contracts should support agents, tools, people, local executors, and Gateway-backed
providers without embedding one domain workflow into the product core.

## Product promise

A participant can create or reuse a strategy, understand who will do what and
why, start a checked run, recover interruptions, and inspect results with their
evidence, receipts, effect state, and unresolved questions intact.

## Constraints

- RWO owns pure structural decisions; the runtime owns durability and execution.
- Agents propose events and return receipts; they do not mutate the graph.
- Orchestration does not own domain truth, acceptance, promotion, or effect authority.
- The first edition is local-first and single-host.
- Templates are versioned inputs to review, not hidden executable modes.
- Candidate implementation evidence may challenge definitions but cannot silently promote them.

## Success evidence

The product succeeds when an authored strategy and a saved template compile to
the same run contract, execute through the same checked boundary, survive restart,
and produce a result that a new operator can understand from the Control Center.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
