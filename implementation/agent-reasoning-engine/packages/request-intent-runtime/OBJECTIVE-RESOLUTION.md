# Objective resolution — first implementation slice

This prototype implements the objective subset of the planned Interaction State.
It does not create another ledger, replace Intent Contract, or change the serving
wrapper. Existing product meanings are CURRENT-OBJECTIVE, OBJECTIVE-TRANSITION
and OBJECTIVE-RESOLUTION in the first-class ARE business ontology.

```text
request + scoped active/suspended state
                  ↓
explicit transition cue, otherwise optional structured provider
                  ↓
validate interpretation and reference bindings
                  ↓
immutable successor state + resolution record
                  ↓
future wrapper integration → route → context → dispatch
```

`are.objective-state/v1` is a bounded, consumer- and scope-bound projection with
one active objective, suspended objectives, predecessor digest and the latest
request identity. An objective includes description, source request, evidence,
target references and completion criteria. Empty completion criteria remain
explicitly unknown; classification does not establish completion or authority.

`are.objective-resolution/v1` records continue/refine/replace/interrupt/new,
evidence span, classification basis, previous and next state identities, and
resolved/ask/block/replayed disposition. An unresolved reference changes no state.
Replace retires the previous active objective from this projection, preserving
it in the input snapshot and resolution record. New work parks unfinished work;
interrupt suspends it; an explicit resume can select one suspended objective.

The deterministic grammar covers explicit discourse cues, not general language
understanding. Without a clear cue, an active-objective relationship needs the
optional provider or an explicit candidate. Both receive structural validation;
source-span binding does not prove semantic correctness. Providers receive usable
selected context text plus state, not only digests, and cannot grant effects.

Bounds: 32 KiB request/context/state individually, 16 suspended objectives,
at most one provider call per resolution and a configurable 1-second default
deadline. Timeout aborts the signal; provider implementations must honor it to
cancel external work. Missing or malformed provider evidence remains visible.

`expected_state_digest` is required when supplying state: it is an optimistic
concurrency check, not proof that external sources are current. The existing
Context Envelope/preflight owns selected-source freshness. Only the latest
request retry is recognized here; full journal replay/deduplication belongs to
the existing ledger. No external action or persistence is performed.

## Construction frontier

Product construction: definitions and ontology meanings already exist; this is
the additive implementation prototype and focused test/benchmark slice. Next:
connect its verified state to wrapper preparation before committed routing and
persist resolutions through the existing ledger. No full-loop result is claimed.
Operational support: existing product source-binding/projection reconciliation
is separate and does not block these package-local tests. Owner: ARE integration
owner. Serving profiles, runtime authority and historical bindings are unchanged.

## Open Questions

- Which selected objective/context meanings should the wrapper supply per turn?
- Which source-currentness and retention policies apply to suspended work?
- Which held-out natural-language episodes validate provider interpretation?

The local benchmark measures deterministic cue/state handling only, not a market
benchmark or general semantic understanding.
