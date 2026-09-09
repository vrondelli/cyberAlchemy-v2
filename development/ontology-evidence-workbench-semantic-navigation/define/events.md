# Events: OEW Semantic Navigation

## ProjectProfileAdmitted

Produced after exact profile, baseline, graph and sidecar bindings validate.
Payload: profile ID/digest, source handles, unresolved owner-decision IDs, and
`authority_effect: none`.

## NavigationFrameRestored

Produced after Back/Close/Escape restoration. Payload: prior/current frame
digests, restoration target, fallback used, and responsive reflow status.

## QualityDeltaRecorded

Produced by `RunComparableQualityLoop`. Payload: baseline/current IDs and
digests, atomic claim deltas, regressions, residue, runtime binding, evidence
ceilings, and `authority_effect: none`. It is execution evidence only.
