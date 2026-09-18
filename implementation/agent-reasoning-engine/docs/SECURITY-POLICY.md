# Security policy

**Lifecycle status:** DRAFT_INACTIVE

**Audience:** Future users and vulnerability reporters for an accepted ARE distribution.

**Owner:** Unassigned security owner.

**Last reviewed:** 2026-09-17.

**Applies to:** No public version or deployed system yet.

**Claim ceiling:** Drafts the required policy structure. It provides no active reporting channel, safe-harbor commitment, response-time promise, or supported-version declaration.

## Current status

ARE is a private product candidate. There is no public vulnerability intake and
no owner-approved disclosure program. Do not send security-sensitive material
to repository issues, examples, benchmark artifacts, or documentation files.
The selected [release policy](release-policy.json) identifies `0.10.0-rc.1` as
the first possible accepted successor, but no such artifact or active supported
version exists yet.

## Policy sections awaiting owner activation

An active policy must define:

- exact supported versions and distribution identities.
- systems, repositories, endpoints, and third-party services in and out of scope.
- allowed and prohibited testing, including data-access and service-impact limits.
- a private reporting address or form and its operational owner.
- information requested for reproduction without requiring secrets or personal data.
- acknowledgement, triage, status-update, remediation and disclosure stages.
- realistic response targets based on staffed ownership.
- handling of duplicate, spam, embargoed, out-of-scope and sensitive-data reports.
- coordinated disclosure and any owner-approved authorization or safe-harbor text.
- advisory, CVE, release and downstream notification process.
- retention, access and deletion rules for submitted report data.

## Existing technical evidence

The candidate has secret-provider boundaries, effect gates, append-only recovery,
source-closure checking, common secret-pattern scanning, private Unix-socket
assumptions, and fail-closed handling for stale or unknown outcomes. The
[operations and security guide](OPERATIONS-AND-SECURITY.md) describes their
bounded scope. The [Candidate 018 threat model](THREAT-MODEL.md) identifies the
exact local-package boundaries, controls, and residue. None establishes hostile multi-tenant isolation or a complete
secure-development program.

## Activation gate

Before this policy becomes `ACTIVE`, the selected security owner must approve
the scope and commitments. The owner must operate the private intake and complete
tabletop tests for each supported report class. The supported-version table must bind the selected release policy and
the threat model for its exact distribution and resolve or explicitly accept
its applicable residue.

At publication, place the approved policy at the root of the distributed ARE
repository as `SECURITY.md`. Retain this manual explanation as a link to it.

## Open Questions

- Who owns vulnerability intake and coordinated disclosure?
- Will the security owner accept `0.10.0-rc.1` after its successor threat-model review?
- What response targets can the staffed process actually meet?
