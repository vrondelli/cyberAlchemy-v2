# N42 complexity examples

Decision effect: none. Every scenario is hypothetical and holds the boundary, snapshot, exact Entity/Event populations and placement, incoming canonical `emits` facts, completeness claim, and evaluation meaning constant. Only the payload carrier changes.

## Low

A small boundary contains two Entities, two Events, placement evidence, and two incoming `emits` facts. Under A all exact values sit in the sidecar. Under B the sidecar points to consumer-owned payload manifests by contained path and digest. Under C each payload group explicitly selects one tagged inline or reference form. Defer leaves the carrier unresolved; stop ends the route. Demonstrates representation only, not schema authority or currentness.

## Medium

The same snapshot is reevaluated by two tools and one payload collection is reused. Under A each exact sidecar remains self-contained even if values repeat. Under B both sidecars may name the same exact consumer-owned payload-manifest digest. Under C one sidecar may inline a small placement payload while referencing a larger adjacency payload, with exactly one tagged carrier per group. Defer blocks a shared resolver contract; stop ends the route. Adds reuse and multiple consumers, but does not prove that externalization is necessary.

## Complex

Several branches retain historical sidecars while payload size grows and one referenced manifest becomes unavailable. Under A every historical sidecar still contains its complete payload. Under B evaluation of the affected sidecar fails closed because its exact manifest cannot resolve; another digest remains independently usable. Under C only the explicitly tagged referenced group fails, while inline groups remain readable, but the whole evaluation still fails if a required payload is unavailable. Defer leaves failure behavior unstandardized; stop terminates the route. Adds branches, scale, and a failure path, but does not select retention, currentness, producer admission, or implementation.

Coverage: 3/3 rungs; A/B/C/defer/stop covered evenly; unsupported claims: 0; decision effect: none.
