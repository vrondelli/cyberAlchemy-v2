# Mappings

## Failure mapping

`runtime/library failure` → profile-local `ExceptionMapping` → integration-owned `IntegrationOutcome` → domain-owned `FailureMeaning`.

The reverse mapping is permitted only when explicitly total for the bound profile. Timeout, rejection, partial success, unavailable, cancelled, and unknown remain distinct.

## Evidence mapping

`raw observation` → allowlist/privacy transform → immutable `ObservationRef` → SLI/workload/control evaluator → typed receipt → claim-specific aggregate.

## Ontology mapping

`DomainSpec local concept` → generated projection with source digest → optional directional CAV2 crosswalk with provenance. Neither projection nor crosswalk becomes semantic authority.

## v1 mapping

Every legacy element maps to exactly one disposition: reuse, adapt behind a profile, supersede, or historical-only. “Exists in v1” is not an admission predicate.
