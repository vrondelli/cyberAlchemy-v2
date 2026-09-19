# N42 Design context: closure payload representation

Status: authored-complete; owner choice pending.

N39-A selected one dedicated consumer-authored closure sidecar, N40-A limited evaluation to the exact bound snapshot, and N41-A made coexisting same-snapshot sidecars independent digest-addressed attestations with no supersession semantics.

The smallest unresolved representation question is how the sidecar carries the exact proof payloads required by N37: eligible Entity population and placement, eligible Event population and placement, and complete incoming canonical `emits` adjacency. The Define contract explicitly allows exact sets or digest-bound manifest references but does not select between them.

N42 compares a fully inline payload, separately resolved consumer-owned manifest references, and a closed per-payload tagged union. Snapshot provenance such as graph and source-manifest digests remains referenced under every option. N42 does not select field names, serialization, filenames, manifest schema, producer admission, canonical schema authority, profile admission, packet projection, implementation, runtime Event behavior, or D06 work.
