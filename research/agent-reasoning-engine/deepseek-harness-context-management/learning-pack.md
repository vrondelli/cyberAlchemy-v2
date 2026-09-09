# Learning pack

## The useful idea

Do not rebuild context as an anonymous blob. Record context changes as immutable
events, cut an exact prefix, and derive the current view from that prefix. Old
events keep their identities and bytes, so both local projection reuse and
provider request-prefix reuse become explainable.

## The subtle part

The event log is not the provider cache. The provider sees a serialized request,
not ARE's storage. The request must preserve all earlier bytes—system prompt,
tool schemas, messages, context fragment, and ordering—under the same provider
and model. Even then, provider retention is outside ARE.

## What ARE already has

ARE already knows how to canonicalize and digest records, chain runtime events,
freeze Context Envelopes, identify selected dependencies, distinguish selected
from unrelated drift, and keep authority effect at none. Those primitives make
this a focused evolution, not a rewrite.

## What ARE needs next

Create a canonical context event stream and make the existing Context Envelope
a deterministic projection of an exact stream prefix. Add a disposable
checkpoint cache. Add a request-affinity header covering the entire early
request—not just the Context Envelope—and verify the dispatched request against
its reconstruction. Only then instrument the Codex boundary and run a
controlled provider canary. This ordering lets local correctness be proven even
if Codex does not expose cache telemetry.

The broader DSH lesson is to keep exact history, model-visible projection,
retrieval index, spill storage, usage measurement, effect durability, and
provider caching as separate layers. They may share event identities, but none
is allowed to silently become another layer's authority.

## One-sentence rule

**Canonical events establish reconstructable context; byte-stable projections
create cache affinity; provider telemetry establishes observed cache use.**
