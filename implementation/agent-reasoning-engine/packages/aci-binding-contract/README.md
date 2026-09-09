# Candidate-local intent-route lineage edge

This private package preserves the immutable request and disposition references
produced around an intent-route decision so the reasoning-engine entry seam can
carry their exact artifact refs and content digests.

It is deliberately smaller than the planned ACI binding contract. The output
posture is always `candidate_local_non_integrated`, and the only authority
effect is `none`. The package does not read either artifact, verify an artifact
owner receipt, choose or confirm a route, create a Dispatch, construct an ACI
command, canonicalize ACI bytes, allocate an ACI ID, write a journal, map an
effect, execute an agent, or claim compatibility/conformance.

The planned `SWU-ARE-016` through `SWU-ARE-018` gates remain open. In
particular, this candidate does not replace the missing external conformance
fixtures and owner receipts required before integrated ACI mapping.

## Input

```json
{
  "schema_version": "intent-route.lineage-input@1",
  "intent_route_request_ref": {
    "artifact_ref": "artifact://intent-route/request/1",
    "content_digest": "<lowercase sha256>"
  },
  "intent_route_disposition_ref": {
    "artifact_ref": "artifact://intent-route/disposition/1",
    "content_digest": "<lowercase sha256>"
  }
}
```

Both the input and nested reference shapes are closed. Request refs are limited
to `artifact://intent-route/request/...`; disposition refs are limited to
`artifact://intent-route/disposition/...`. Every suffix is a slash-separated
sequence of neutral identifier segments; embedded schemes, percent escapes,
empty segments, and `.`/`..` path normalization are rejected. This prevents an
opaque ref from smuggling ACI command, receipt, effect, or compatibility
identity across the candidate-local boundary. The result is immutable and
digest-bound. Any extra field is also rejected.

## Validation

```bash
npm test --prefix cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-binding-contract
```
