# Core concepts

## Request and route

A request contains the user's exact text and fields that the caller supplies or infers.
A route selects the contract for one repository workflow.
The route identifies the workflow for the request. It does not authorize actions that change files, systems, or external state.

## Context basis and Context Envelope

The context basis is the smallest selected set of information for the current request.
Each item remains linked to its source.
A Context Envelope contains a fixed version of this information for an agent or host.
It records the sources, omitted information, contradictions, and how current the information is.
It also records a digest, which identifies the exact content used in later decisions.

## Reasoning State

Reasoning State is a stored record of reasoning events and checkpoints derived from those events.
An append-only record accepts new entries but does not replace earlier entries.
Epochs mark the boundaries of stable snapshots.
Branches, reductions, contrary evidence, and records of transitions explain why the state changed.
The runtime can rebuild derived indexes. The append-only evidence remains the primary record.

## Runtime journal

The runtime journal records ordered operational events with idempotency and
digest chaining. Cuts and replay reconstruct a bounded view. Journal retention
and Reasoning State retention are related operational concerns but distinct
contracts.

## Proposal, effect, and authority

ARE can assess a specific proposed effect and identify checks for consequences or required owner decisions.
An effect is an action that changes files, systems, or external state.
This assessment does not execute the proposal or grant permission.
Authorization comes from the relevant owner and host policy. Most ARE records
therefore carry `authority_effect: "none"`.

## Continuation

A continuation decision evaluates whether the current objective is complete
and which bounded next options exist. It prevents an agent from treating a
plausible next action as part of an already authorized objective.

## Conversation runtime

The conversation runtime keeps ordered turns, routes internal work, exposes
pending decisions, and produces bounded improvement handoffs while preserving
one user-facing conversation identity.

## Improvement and learning

Failures become structured Improvement Signals and Research Hypotheses. A
candidate change must pass development tests and separate holdout tests before ARE can retain it.
Holdout tests use evidence that did not guide development. Learning records can guide later work but do not silently
activate behavior.

## Open Questions

- Which concepts should receive stable public API names if ARE leaves the
  private repository boundary?
