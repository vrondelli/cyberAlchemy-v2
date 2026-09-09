# State Machines: OEW Semantic Navigation

## NavigationState

```mermaid
stateDiagram-v2
    [*] --> startupModal
    startupModal --> home: dismiss and focus entry
    home --> cluster: portal
    cluster --> cluster: portal
    cluster --> home: Back
    home --> pathOpen: open Path
    cluster --> pathOpen: open Path
    pathOpen --> pathResult: valid query
    pathResult --> pathProjection: select alternative
    pathOpen --> home: close and restore
    pathOpen --> cluster: close and restore
    home --> allLoaded: explicit escape
    cluster --> allLoaded: explicit escape
    allLoaded --> home: Back
    allLoaded --> cluster: Back
```

### Invariants

- Exactly one primary scene and one selected view mode exist.
- Transient surfaces declare activation, result, dismissal, and restoration.
- Every committed scene binds profile, graph, sidecar and filter fingerprints.
- Stale fingerprints invalidate Path/portal results before reuse.
- Scene changes never change ontology or promotion authority.

## AuditSeriesState

`draft-profile -> frozen-baseline -> implementation-pending -> current-run -> delta-recorded`

Changing a frozen profile field starts a new audit series. Unexercised cells
remain residue, never pass.
