# ARE local secret bridge

This ARE-owned Python package implements the bounded local SOPS-age process
bridge used by the coding-agent runtime. It is included in the standalone ARE
closure, so runtime secret resolution does not import or locate DomainSpec.

The bridge still requires the explicitly configured Python, SOPS, age, and
age-keygen executables. Secret material crosses the process boundary only on
pipes and is excluded from normal receipts.

## Open Questions

Platform-specific packaging of the external SOPS and age executables remains a
deployment concern documented by the service runbook.
