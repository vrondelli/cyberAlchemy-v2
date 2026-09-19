# Trusted tenant bridge candidate

A separate consumer adapter for the existing Auth Foundation Rust authorization
service. The HTTPS candidate and its frozen evidence remain unchanged. Stdin is
trusted application input, never a public API. The application must verify and
introspect the token before each use. The bridge additionally checks expiry,
issuer/subject/kind/client binding, current session, flat tenant membership,
active roles and exact resource/action/scope grants from one bounded policy read.
The generated authorization service makes each final decision.

Build from the CyberAlchemy workspace with `tools/toolchain/run cargo build
--manifest-path ../domainspec-core/projects/auth-foundation/implementation/tenant-bridge/Cargo.toml`.
The JSON input has `identity` (issuer, subject, kind, client, expires_at, jti),
`tenant` and `permissions` (resource, action, scope). Policy has a positive
`revision`, `principals` and `roles`. Each principal has the four identity fields,
`enabled`, `memberships` (tenant, enabled), and `sessions` (jti, enabled,
active_roles). Each role has `id` and `permissions`. All objects reject unknown
fields. Policy is operator-managed; no tenant value supplied by a caller grants
membership. Results are an ordered boolean `decisions` list; failures return an
empty list, which consumers must treat as denial. No token or policy is logged.

## Open Questions

Production policy persistence and provisioning belong to Auth Foundation.
This adapter is local candidate evidence, not an admission or production review.
The paired ISB-09 security plan owns the inference integration questions.
