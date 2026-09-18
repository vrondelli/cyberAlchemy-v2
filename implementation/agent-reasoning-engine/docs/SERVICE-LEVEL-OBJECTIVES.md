# Service-level objectives

**Lifecycle status:** NOT_APPLICABLE

**Audience:** Future product and reliability owners for an operated ARE service.

**Owner:** Unassigned product and reliability owners.

**Last reviewed:** 2026-09-17.

**Applies to:** No operated ARE service currently exists.

**Claim ceiling:** Defines the evidence needed for SLOs. It declares no availability, latency, durability, correctness, or support target.

## Why no numerical SLO exists

Candidate 018 is a local product candidate, not an accepted service. It has no
production traffic, service users, telemetry backend, staffed incident process,
or representative baseline. Product test pass rates, ContextBench scores, model
latency and local canary outcomes measure different questions and cannot serve
as service availability objectives.

## Candidate user journeys

These journeys require owner confirmation after a service boundary is selected:

| Journey | Possible success event | Required exclusions and failure classes |
| --- | --- | --- |
| Route a request | Valid route/gate/block returned for an admitted request | Caller errors, source drift, engine failures and latency timeouts separated |
| Resume a gateway session | Authenticated client reconnects and receives acknowledged replay | Invalid credentials, expired sessions and unknown crash outcomes separated |
| Preserve completed state | Verified checkpoint/frontier recovers without duplicate semantic work | Corrupt logs and unacknowledged delivery remain explicit failures |
| Evaluate a consequential proposal | Bound effect assessment reaches host policy | Host denial differs from ARE unavailability |

## SLI contract required

Every SLI must define the user, event, numerator, denominator, measurement point,
window, exclusions, missing-data treatment, source retention, and acceptable
cardinality. Metrics must separate service availability from model-provider
availability and from semantic task correctness.

## Activation sequence

1. Select an operated service and its users.
2. Publish a versioned telemetry contract with privacy and cardinality controls.
3. Measure a representative baseline and uncertainty over an agreed window.
4. Select targets and error-budget policy through a product-owner decision.
5. Verify alerts and the service runbook through failure exercises.
6. Review targets after material topology or user-journey changes.

## Open Questions

- Which user journey is critical enough to receive the first SLI?
- How will provider failures and ARE failures be separated in denominators?
- Who owns error-budget decisions when reliability and research velocity conflict?
