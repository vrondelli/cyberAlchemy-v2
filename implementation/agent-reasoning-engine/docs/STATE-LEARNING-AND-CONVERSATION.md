# State, learning, and conversation

## Durable state model

Reasoning State uses append-only events and content-bound epochs. The runtime
can checkpoint by risk, create branches, record reductions and counterevidence,
export portable epochs, compare provenance, and execute verified transition
plans. Storage sinks write durable records to files. The runtime rebuilds derived indexes
from verified logs.

The runtime journal separately records operational event order and supports
cuts, replay, idempotency, and eviction receipts. Eviction removes eligible
closed journal segments under policy. It does not rewrite Reasoning State
history.

## Context refresh and reuse

Context reuse depends on the current request, selected sources, and a Context
Refresh Assessment. A changed dependency creates a new version of the selected context.
Exact-prefix and cache-affinity signals help optimize context reuse.
These signals alone do not prove that the context has the correct meaning.
They also do not prove provider cache use without observed provider fields.

## Conversation runtime

The conversation component owns:

- conversation identity and ordered turns.
- the current route and route changes.
- pending decisions that require user or owner input.
- canonical response records.
- usability observations.
- bounded improvement handoffs.

Its routed form supplies the semantic module port to the request router. This
keeps one user-visible conversation while internal work moves through route and
decision boundaries.

## Failure learning

The improvement process starts with a specific failure and a testable hypothesis.
It implements a variant with a defined scope. It evaluates development evidence and tests separate holdout evidence.
The process then produces `KEEP` or `REJECT`.
Candidate 018's failure-learning
canary reduces stale-reuse incidents from five to zero in its deterministic
fixture and records `KEEP`. It does not observe provider caching or activate a
runtime change by itself.

## Open Questions

- What retention policy should govern long-lived portable Reasoning State
  across multiple host products?
- Which user-facing controls should expose correction, contradiction, and
  revocation without exposing internal record mechanics?
