# Core concepts

## Request and route

A request carries the user's raw text plus explicitly supplied or inferred
fields. A route selects one repository workflow contract. Route selection says
where work belongs. It does not authorize the work's effects.

## Context basis and Context Envelope

The context basis is the smallest selected set of source-bound information for
the current request. A Context Envelope is its immutable projection for use by
an agent or host. It records provenance, omissions, contradictions, freshness,
and a digest so later decisions can identify the exact context they used.

## Reasoning State

Reasoning State is the durable, append-only record of reasoning events and
derived checkpoints. Epochs delimit stable snapshots. Branches, reductions,
counterevidence, and transition receipts preserve why state changed. Derived
indexes can be rebuilt. The append-only evidence remains primary.

## Runtime journal

The runtime journal records ordered operational events with idempotency and
digest chaining. Cuts and replay reconstruct a bounded view. Journal retention
and Reasoning State retention are related operational concerns but distinct
contracts.

## Proposal, effect, and authority

ARE can assess an exact proposed effect and identify consequence or owner
gates. That assessment does not execute the proposal or create permission.
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
candidate change must pass development and disjoint holdout evidence before it
can be retained. Learning records can guide later work but do not silently
activate behavior.

## Open Questions

- Which concepts should receive stable public API names if ARE leaves the
  private repository boundary?
