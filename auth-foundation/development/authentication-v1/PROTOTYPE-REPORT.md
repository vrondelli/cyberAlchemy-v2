# Authentication prototype: live-test handoff

Historical revision: the current handoff is [BRANDED-LOGIN-REPORT.md](BRANDED-LOGIN-REPORT.md).
The original report, exact source bytes and evidence are preserved in the
[historical snapshot](history/2ca2c2da173c8b1f42ca0b2770b485e65f16908304a36a28427dd10b58f5334c/README.md).
Evidence links below describe that earlier revision; mutable workspace paths now contain its successor.

Date: 2026-09-07 UTC. Status: locally tested prototype; no product approval or
production-readiness claim. Owner: Auth Foundation product owner.

## Result

A local self-hosted prototype now connects Keycloak to Auth Foundation for
**browser users and autonomous service clients**. Open
[the application](http://localhost:13000) on this machine.
[Runbook and commands](../../implementation/authentication-prototype/README.md).
The test username is `alice`; read `userPassword` from the private local
`.runtime/config.json` in the prototype directory. Credentials are not included
in durable evidence. `npm run service` exercises the separate private-key client.

Implementation: [authentication-prototype](../../implementation/authentication-prototype/).
Planning: [dependency DAG](PROTOTYPE-DAG.md),
[identity contract and ontology scaffold](PROTOTYPE-CONTRACT.json),
[composition source-set scaffold](PROTOTYPE-SOURCE-SET.json).

## Observed evidence

- **12 unit tests pass:** real RSA/JWT verification and wrong issuer, audience,
  type, client, time, signature and malformed-token rejection; existing Rust
  authorization with explicit principal kind, current grants, ambiguity,
  expiry and corrupt-policy denial.
- **5 live scenarios pass:** unauthenticated/caller-authority rejection; service
  private-key issuance and protected access; browser code/S256 login, cookie
  isolation, current permission denial and CSRF/logout; Keycloak client disable
  invalidates existing access and new issuance; issuer outage fails closed and
  normal access recovers afterward.
- **222 predecessor input hashes match** the previously frozen manifest. The
  approved engine and original evidence were not modified.
- npm production dependency audit reported **zero known vulnerabilities** at
  the time of this run. This is an advisory database result, not a security
  certification or a review of Keycloak/container vulnerabilities.

Exact transcripts: [unit tests](../../implementation/authentication-prototype/evidence/unit-test.txt),
[live tests](../../implementation/authentication-prototype/evidence/live-test.txt).
Input manifest: [candidate inputs](../../implementation/authentication-prototype/evidence/INPUT-CANDIDATE.json).
**Offline authentication EVF passed:** 13 stages, one executable check and six hostile input mutations, with two repetitions and a passing independent verifier. [Test result and exact EVF references](../../implementation/authentication-prototype/evidence/TEST-RESULT.json). This covers real cryptographic verifier and bridge behavior; live issuer behavior remains separate evidence.

Tested container versions: Keycloak 26.7.3; PostgreSQL 17.11. Compose pins image
content digests. Production libraries: openid-client 6.8.8, jose 6.2.12;
package-lock pins the npm tree. Browser tests used Playwright 1.63.0 Chromium.
Rust bridge source has its own Cargo.lock and links the existing local engine.

## DAG state and next frontier

| Nodes | State | Meaning |
| --- | --- | --- |
| D / O / P | candidate scaffolds present | Domain language, typed identity contract, relationship graph and acceptance scope are reviewable. |
| K / A / B / M | implemented and locally exercised | Isolated issuer/database, verifier/bridge, browser and service flows run. |
| T | passing for bounded slice | Current unit and live evidence above; not the whole 28-requirement denominator. |
| F | prototype inputs frozen | Content manifest binds tested local source/dependency/bridge inputs; it is not full product approval. |
| L | ready for human live testing | URLs, generated test accounts and reproducible walkthrough available. |
| E | passed and independently verified | 13 stages, one check, six hostile input mutations; offline verifier/bridge scope only. |
| R / H / X | not complete | Human review/approval and separate production decisions have not occurred. |

Construction continues next from user live-test feedback and remaining product
coverage. Full successor DomainSpec compilation/formal correspondence remains
`not_evaluable`; the source-set graph is a composition scaffold, not generated
compiler evidence. That limits product-stage claims without hiding the runnable
local prototype. No canonical definition or ontology admission was performed.

## Limits and operational residue

This first slice uses **HTTP on loopback and Keycloak development mode**. It
has no public/LAN listener or real-user population. Application cookies are
HttpOnly/SameSite but lack Secure in this explicit local HTTP profile. TLS,
Secure cookies and hardened administrator authentication are required for any
production profile; do not expose this build through a public tunnel.

Browser tokens stay server-side and sessions expire with the five-minute access
token. The prototype does not use refresh tokens. Service access tokens are
bearer tokens: private-key client authentication alone does not prevent replay
of a stolen access token. DPoP/mTLS, passkey-only enrollment/administration,
recovery, SPIRE, delegated calls, native/CLI profiles, tenant isolation,
distributed state, abuse/load tests and independent penetration review remain
outside the observed denominator. This is not completion of all A01–A28.

Every protected request checks token status online. The live outage test proves
one local failure case; it does not establish a production 60-second revocation
SLO under every failure mode. Local policy is snapshotted once per request,
projected into an ephemeral SQLite database, and evaluated by the existing
single-epoch engine. Policy changes affect subsequent snapshots. The successor
bridge preserves explicit human/service kind while using the predecessor's
legacy subject column for a kind-prefixed internal key.

Operational owners remain unassigned for production infrastructure, keys,
recovery/support, patches, backups and incident response. These are deployment
residue, separate from runnable local product work. The local services can be
stopped using the runbook without removing the dedicated database volume.

## Open Questions

1. Does live testing confirm the intended experience and person/service
   distinction? Which real application should consume it first?
2. Which remaining profiles and security controls belong in the first full
   product candidate, particularly passkeys, recovery and sender constraint?
3. What successor DomainSpec/formal boundary should cover this hand-authored
   adapter and principal-kind projection before full product-stage claims?
4. Resolve production owners, topology, isolation and assurance targets in the
   [requirements Open Questions](REQUIREMENTS.v1-candidate.md#open-questions).

Human implementation authorization is not product approval. Any later approval
must bind one newly tested candidate and cannot reuse predecessor approval.
