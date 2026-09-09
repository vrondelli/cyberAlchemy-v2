# Interfaces: Learner Projection And Next-Route Guide

## ProjectionCompiler

Local deterministic command interface. It accepts repository-relative source
bindings and writes a generated snapshot plus receipt. It performs no network
request and has no learner-view mutation-admission, semantic-admission,
destination-owner admission, or execution capability.

## ProjectionReader

Read-only JavaScript interface consumed by the existing ontology view.

| Method | Result |
| --- | --- |
| `loadProjection()` | Current snapshot or fail-closed diagnostic. |
| `inspect(subjectId)` | Exact typed neighborhood and proof tiers. |
| `suggest(gapId)` | Display-only package or no suggestion. |

## LearnerGuideView

Candidate extension of
`projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`.

The view adds an orientation rail, focused binding stack, abstention message,
question revision, and suggestion package. It reuses the host's selection and
inspector state. Graph, Outline, and Table presentations must expose identical
record IDs, classes, proof tiers, and validity state.

No control may trigger a network request, mutation, route selection, owner
admission, registration, dispatch, or execution. Host mutation is blocked
until its owner issues learner-view mutation admission for this exact candidate
extension. That receipt cannot close an owner-resolved semantic-evidence gap or
establish the displayed destination owner's identity/admission.
