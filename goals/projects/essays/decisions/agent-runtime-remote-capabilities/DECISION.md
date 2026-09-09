# Essays Agent Runtime Remote Capabilities

Result: selected, pending security and Work Owner review

Selected option: `OPT-REMOTE-CAP-SCOPED-LEASES`

Authority effect: none

An authenticated remote client receives no ambient workspace access. Each
allowed operation requires a short-lived immutable capability lease bound to
the paired device key, actor, workspace, resource selectors, admitted
operations, current authority revisions, quotas, validity, and revocation
generation.

The Rust daemon checks both the DPoP-bound token and the live authoritative
lease on every request. Their intersection can only narrow authority. Missing,
stale, expired, revoked, exhausted, or mismatched authority fails closed.

Browser actions and external effects remain governed by their own grants and
one-shot approvals. This decision creates no lease, remote access, endpoint,
or effect authority. The machine-readable decision is `selection.json`, bound
to request digest
`b6a7f73b2560e91436bf76c66e72abfe4c1e5660a8ac60f18b0c41888090d0b9`.
