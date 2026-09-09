# Queries: OEW Typed-Test Recovery

## ReadFailureEvidenceReference

Returns only the admitted producer reference: `status`, normalized `path`,
`sha256`, `schema`, `producer`, `gate`, `issue`, and `unavailable_reason`.
It never returns raw streams or a workspace path.

## ReadRecoveryStatus

Returns the current typed gate result, authorization consumed state, retry
authorization state, evidence availability, and cleanup result without
collapsing them into one completion label.

