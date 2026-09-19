# Keycloak 26.7.4 deployment VEX assessment

Date: 2026-09-18. Status: candidate downstream affectedness assessment for the
exact KELD deployment, not an upstream Keycloak statement or release waiver.

## Exact subject

This assessment applies only to
`quay.io/keycloak/keycloak:26.7.4@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c`
on `linux/amd64`, used by [compose.yaml](../deploy/compose.yaml). The
machine-readable statements are in
[keycloak-26.7.4.openvex.json](../deploy/keycloak-26.7.4.openvex.json), and
[verify-keycloak-vex.mjs](../deploy/verify-keycloak-vex.mjs) binds those
statements to the rendered deployment configuration.

## CVE-2026-75595

Trivy 0.74.0 reports the bundled `io.netty:netty-handler` 4.1.136.Final as
Critical. The vulnerability concerns Netty server-side TLS ClientHello parsing:
a handshake header split across records can select a default TLS context instead
of the SNI-specific mutual-TLS context.

That code is not in this deployment's execute path:

- Keycloak has `KC_HTTP_ENABLED=true` and no `KC_HTTPS_*` certificate or
  keystore configuration.
- Keycloak publishes no host port and does not use host networking.
- Caddy owns public TLS and forwards plain HTTP to `keycloak:8080`.
- The deployment does not use per-SNI mutual TLS as a Keycloak authorization
  gate.

The disposition is `not_affected` with justification
`vulnerable_code_not_in_execute_path`. Enabling Keycloak TLS, exposing a
Keycloak listener, or introducing a Netty/SNI mutual-TLS gate invalidates it.

## CVE-2025-59250

Trivy reports `com.microsoft.sqlserver:mssql-jdbc` with normalized installed
version 13.2.1. Its own fixed-version list includes the packaged
13.2.1.jre11 classifier, and the image SBOM contains both normalized 13.2.1 and
13.2.1.jre11 coordinates. Independently of that version-normalization issue,
the KELD deployment fixes `KC_DB=postgres` and `KC_DB_URL` to
`jdbc:postgresql://postgres:5432/keycloak`. The Microsoft SQL Server driver is
not selected or executed.

The disposition is `not_affected` with justification
`vulnerable_code_not_in_execute_path`. Selecting SQL Server or changing the
JDBC URL away from PostgreSQL invalidates it.

## Verification gate

Run from the checkout root:

```sh
node keld-project/deploy/verify-keycloak-vex.mjs
```

Then scan the exact digest with Trivy 0.74.0, supplying the OpenVEX file through
`--vex`. The unfiltered report must remain available beside the VEX-adjusted
report, and `--show-suppressed` must demonstrate that only these two reviewed
statements changed the gate outcome. A clean VEX-adjusted result means the
findings have a bounded affectedness disposition; it does not claim the image
contains upgraded dependencies.

## Open Questions

- Replace this downstream assessment with a clean supported Keycloak image when
  one becomes available and remove the statements after the raw scan passes.
- Re-run the verifier and affectedness review after any image digest, database,
  Keycloak TLS, proxy, network, or listener change.
- The production security owner still owns acceptance of this candidate VEX and
  the separate public TLS, egress, syscall, backup, rollback, and incident gates.
