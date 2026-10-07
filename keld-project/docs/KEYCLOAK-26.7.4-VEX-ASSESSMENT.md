# Keycloak 26.7.4 deployment VEX assessment

Date: 2026-09-18; refreshed 2026-09-20. Status: partial downstream affectedness
assessment for the exact KELD deployment, not an upstream Keycloak statement,
clean scan, or release waiver.

## Current scan update

A fresh exact-stock-image Trivy 0.74.0 scan on 2026-09-20 reports seven raw
records representing five distinct High/Critical CVEs. The two statements below
still cover only `CVE-2026-75595` and `CVE-2025-59250`. The scan also reports
`CVE-2026-8763` (Critical) and `CVE-2026-13506` (High) against Bouncy Castle
1.84 in both `/opt/keycloak/bin/client/lib` and `/opt/keycloak/lib/lib/main`,
plus `CVE-2026-22020` (High) against the OpenJDK 21 runtime. Trivy marks the
first four distinct findings as fixed-available and the OpenJDK finding as
`affected` without a fixed version. The machine-readable OpenVEX file does not
cover or suppress the Bouncy Castle or OpenJDK findings.

The stock and experimental optimized images contain identical Bouncy Castle jar
hashes, so the optimization layer did not introduce them. Live realm inspection
found both WebAuthn registration required actions enabled even though WebAuthn
authentication was disabled in the browser flow. The reversible
`harden-keycloak-crypto-surface.sh` migration now disables those unused actions
and verifies zero identity providers, OIDC-only enabled clients, no configured
X.509 client authenticator, the expected seven active flow bindings, and no
enabled X.509/WebAuthn execution outside the guarded built-in client flow. The
public edge now also returns 404 for the realm's dynamic-client-registration
surface. This is a configuration-bound mitigation and candidate affectedness
argument, not a raw-image remediation. The machine-readable VEX remains
unchanged and production promotion remains on hold pending security-owner
acceptance or a clean supported dependency update.

Subsequent vendor research found that Red Hat's tracker records
`CVE-2026-22020` as officially rejected as bogus and its Fedora OpenJDK child as
closed `NOTABUG`. The installed OpenJDK 21.0.12 package is also newer than the
Oracle 21.0.11 update cited by the tracker. The raw scanner record remains
visible and the current machine-readable VEX remains unchanged; a
security-owner-reviewed exact-subject disposition is still required before it
can stop gating promotion.

An experimental downstream candidate now replaces the complete Bouncy Castle
set with vendor-fixed 1.85 bytes. Its exact raw scan removes both Bouncy Castle
CVEs, and its isolated restored-state health/discovery rehearsal passes. It is
not deployed or upstream-supported. See
[KEYCLOAK-BC185-CANDIDATE-2026-09-20.md](KEYCLOAK-BC185-CANDIDATE-2026-09-20.md).
The exact full-scan receipt and evidence boundary are recorded in
[LIVE-IMAGE-SBOM-LICENSE-REVIEW.md](LIVE-IMAGE-SBOM-LICENSE-REVIEW.md).

## Exact subject

This assessment applies only to
`quay.io/keycloak/keycloak:26.7.4@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c`
on `linux/amd64`, used by [compose.yaml](../deploy/compose.yaml). The
machine-readable statements are in
[keycloak-26.7.4.openvex.json](../deploy/keycloak-26.7.4.openvex.json), and
[verify-keycloak-vex.mjs](../deploy/verify-keycloak-vex.mjs) binds those
statements to the rendered deployment configuration.

## CVE-2026-8763 candidate disposition

The Bouncy Castle advisory describes a trailing-dot name-constraints bypass in
the BC PKIX validator and requires an attacker-controlled name-constrained
intermediate CA. Keycloak 26.7.4 does contain an executable bridge to that code:
`DefaultCryptoProvider.getCertPathBuilder()` explicitly selects the BC `PKIX`
provider, and `CertificateValidator` plus the optional NGINX certificate lookup
can call it. The finding is therefore not a false positive for the image.

The exact KELD staging configuration removes the untrusted certificate path:

- Keycloak accepts HTTP only behind Caddy; it does not terminate TLS or request
  client certificates.
- The deployment does not select a proxy X.509 lookup provider or configure a
  Keycloak truststore.
- The live realm has no enabled X.509 browser/direct-grant execution and no
  client configured with the `client-x509` authenticator.
- Both WebAuthn registration actions and WebAuthn browser authentication are
  disabled.
- Caddy does not expose admin/master paths and explicitly blocks public dynamic
  client registration before the realm wildcard proxy.

This supports a deployment-specific `vulnerable_code_not_in_execute_path`
candidate. It does not support calling the image clean, and the current OpenVEX
file intentionally does not yet suppress the finding.

## CVE-2026-13506 candidate disposition

The Bouncy Castle advisory describes a stack-exhaustion denial of service from
a deeply nested attacker-supplied DER CRL parsed through BC's lazy ASN.1 CRL
path. Whole-source inspection of the exact Keycloak 26.7.4 commit found runtime
CRL parsing only in the X.509 `CertificateValidator` loader; that loader is
activated by X.509 authenticator configuration and a CRL/CRLDP option. Neither
is configured in the KELD realm or container. The same all-flow/client checks
and edge restrictions above therefore remove the public CRL input path.

This also supports only a deployment-specific
`vulnerable_code_not_in_execute_path` candidate. A future X.509 flow, client
certificate authenticator, proxy-certificate lookup, truststore, CRL/CRLDP
configuration, or broader Keycloak route invalidates the argument.

Primary references:

- [Bouncy Castle CVE-2026-8763 advisory](https://github.com/bcgit/bc-java/wiki/CVE%E2%80%902026%E2%80%908763)
- [Bouncy Castle CVE-2026-13506 advisory](https://github.com/bcgit/bc-java/wiki/CVE%E2%80%902026%E2%80%9013506)
- [Keycloak 26.7.4 exact source commit](https://github.com/keycloak/keycloak/tree/aa9fe3fba0c6cd5770f19a49378c55f4378cf544)

An authenticated-free read of the official Quay tag API at
`2026-09-20T07:53Z` still listed `26.7.4` / digest
`sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c`
as the newest 26.x image. There was no newer supported image to evaluate in
place of this deployment. This is a point-in-time availability check, not a
reason to stop watching for an upstream replacement.

The official [Keycloak 26.7.4 release
announcement](https://www.keycloak.org/2026/09/keycloak-2674-released) dated
2026-09-16 and the [current Keycloak downloads
page](https://www.keycloak.org/downloads) also identify 26.7.4 as the current
supported release as of this review. The release's published security-fix list
does not identify either Bouncy Castle CVE above. This confirms that an
in-place supported version upgrade is not presently available; it does not
establish non-affectedness or authorize a waiver.

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
statements changed the gate outcome. The current adjusted result is expected to
retain the Bouncy Castle and OpenJDK findings. Do not describe this partial VEX
as a clean image or expand it without executable-path evidence and
security-owner review.

## Open Questions

- Replace this downstream assessment with a clean supported Keycloak image when
  one becomes available and remove the statements after the raw scan passes.
- Have the security owner either accept the two configuration-bound candidate
  dispositions above and authorize machine-readable statements, or keep them
  unsuppressed. Do not silently convert this prose into a scan waiver.
- Have the security owner review Red Hat's rejected/not-a-bug status for
  `CVE-2026-22020`; keep it raw-visible until an exact-subject disposition is
  approved.
- Decide whether the unsupported Bouncy Castle 1.85 overlay is acceptable only
  after its remaining private browser identity regression and candidate-specific
  VEX/license review. Prefer a clean supported Keycloak release when available.
- Re-run the verifier and affectedness review after any image digest, database,
  Keycloak TLS, proxy, network, or listener change.
- The production security owner still owns acceptance of this candidate VEX and
  the separate public TLS, egress, syscall, backup, rollback, and incident gates.
