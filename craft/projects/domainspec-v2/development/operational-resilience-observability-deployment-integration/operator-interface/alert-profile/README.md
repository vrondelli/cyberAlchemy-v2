# ORODI Alert Profile

Status: private candidate. Authority effect: none.

This package carries `ORODI-ALERT-PROFILE` through the D65 construction chain
without rewriting an existing Product Capability identity:

```text
candidate definitions
  -> projection of adopted immutable ORODI capabilities
  -> capability-local business ontology
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and system ontology
  -> exact implementation binding candidate
  -> conformance and local commissioning evidence
```

The reusable implementation lives under
`projects/domainspec-v2/impl/operational-resilience/orodi-alert-profile/`.
It validates a tool-neutral JSON profile and deterministically renders Grafana
file provisioning. The Body War rule set is the first instance.

Alert evaluation is evidence-only. Notification delivery remains absent and
requires a separate owner-authorized binding.

No artifact in this package publishes, releases, deploys, contacts an external
destination, or actuates an ORODI control-plane operation.
