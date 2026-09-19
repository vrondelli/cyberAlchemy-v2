# Verified HTTPS authentication: A+B handoff

Date: 2026-09-07. Status: A+B ready for human testing. 13 unit tests, 10 live scenarios, clean-room setup, scoped EVF and independent verification passed. Authority effect: none.
This is the isolated first increment of [NEXT-STEPS-PLAN.md](NEXT-STEPS-PLAN.md),
following the user's instruction `do until we have a testable`.
The selected profile is [HTTPS-CONTRACT.json](HTTPS-CONTRACT.json); the
[threat model](HTTPS-THREAT-MODEL.md) defines its boundaries and remaining risks.

Implementation: [authentication-https](../../implementation/authentication-https/README.md).
Target: https://localhost:13443, opened using `npm run open` from that directory.
The launcher uses isolated CA trust and pre-fills the disposable Alice account.
The existing approved HTTP candidate and database remain independent.

## Behavior

The branded native login, protected human document, asymmetric service client,
and stationary signed-out page now run over verified HTTPS. Secure __Host-
cookies and the original OIDC/authorization checks remain server-owned. Only
the proxy exposes loopback ports; the application uses a private Unix socket,
and Keycloak/PostgreSQL have no published ports. The proxy validates Keycloak's
internal TLS certificate and rejects incoming forwarding/Host spoofing.
Administration is available only through a client-certificate-required listener
and a realm-scoped provisioning account. No master bootstrap user is created.

## Validation

Input digest: `3bc71dc0fd1ba87984103586714f642afb38393920923d44ebbe655c88cde609` (158 files).

13 unit tests and 10 live scenarios passed. A separate clean-room rehearsal
generated a new CA, credentials and empty database, then passed verified-TLS
browser and service authentication. Its disposable volume was removed and the
main listener restored. The isolated headed browser was opened for human testing.

[Machine-readable results](../../implementation/authentication-https/evidence/TEST-RESULT.json),
[live transcript](../../implementation/authentication-https/evidence/live-test.txt),
[fresh setup](../../implementation/authentication-https/evidence/FRESH-SETUP.json),
[environment identity](../../implementation/authentication-https/evidence/LIVE-ENVIRONMENT.json).

[Desktop sign-in](../../implementation/authentication-https/evidence/screenshots/https-login.png),
[mobile sign-in](../../implementation/authentication-https/evidence/screenshots/https-mobile.png),
[authenticated app](../../implementation/authentication-https/evidence/screenshots/https-app.png).

All 149 approved HTTP input hashes and 222 authorization predecessor input
hashes remain unchanged.

Scoped EVF passed 13 stages, one check, six hostile-input mutations and two
repetitions; independent verification passed all 13 stages.
[EVF evidence](../../implementation/authentication-https/evidence/evf/runs/sha256/e42985da7b9d9309368cdefea5d6b4e82ba1387a2d4c5156d29700a953938b9b/authentication-https-001/EVIDENCE.json)
and [independent verification](../../implementation/authentication-https/evidence/evf/INDEPENDENT-VERIFICATION.json).
Evidence digest: `e42985da7b9d9309368cdefea5d6b4e82ba1387a2d4c5156d29700a953938b9b`. Cryptographic/bridge EVF is separate from real TLS and
browser evidence. The new live suite includes unknown CA/wrong hostname,
untrusted browser, Host/forwarded headers, public administration, client
certificate enforcement, secure cookies, CSRF, state/nonce/PKCE substitution,
callback replay, mobile/keyboard login, current grants/client disablement,
repeat setup, outages and malformed/oversized requests.

## Construction and operations

Product construction frontier is A+B: explicit profiles and verified HTTPS
integration. C–H remain as defined in the next-steps plan. Exact product approval
for this HTTPS successor is pending after the live handoff. Existing approval
of the HTTP candidate does not certify these changed bytes. Complete successor
DomainSpec compilation and formal correspondence remain not_evaluable.

The implementing agent owns the disposable test CA, Docker/browser fixtures and
local test handoff. Permanent hostname, certificate/key custody, production
availability and recovery owners remain unassigned and do not block this local
increment. No public deployment, machine-wide trust or normal-browser changes
were made. Shared localhost deliberately omits HSTS to preserve the existing
HTTP application. Local certificates are short-lived fixtures, not a production
renewal system. Operating-system and Docker administrators remain trusted.

## Open Questions

Passkeys/recovery, persistent and cross-instance sessions, a second application,
service key lifecycle, audit/abuse/load/restore assurance, permanent issuer/RP,
HSTS and production release decisions remain in
[NEXT-STEPS-PLAN.md](NEXT-STEPS-PLAN.md#open-questions).
