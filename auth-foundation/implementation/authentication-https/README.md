# Auth Foundation HTTPS test candidate

Isolated successor to the approved HTTP prototype. Browser and autonomous service
identities use Keycloak over verified TLS and the existing Rust authorization
bridge. This implements A+B of the
[next-steps plan](../../development/authentication-v1/NEXT-STEPS-PLAN.md).
[HTTPS profile](../../development/authentication-v1/HTTPS-CONTRACT.json),
[threat model](../../development/authentication-v1/HTTPS-THREAT-MODEL.md),
[results](../../development/authentication-v1/HTTPS-REPORT.md).

## Start and test

Tested platform: Ubuntu Linux, Docker Compose, Node 26, OpenSSL and owner UID/GID
1000 (matching this Keycloak image's certificate access). Rust/Cargo and a C
compiler are needed to rebuild the unchanged authorization bridge. Use the
locked dependencies and pinned images; this checkout already has its fixtures.

```bash
npm ci --ignore-scripts
npm run build
bash scripts/browser-deps.sh
npx playwright install chromium
npm run setup
npm start
```

In another terminal:

```bash
npm run open
```

The launcher opens **https://localhost:13443** in a separate Chromium profile
that trusts only the additional disposable local CA. It pre-fills the `alice`
test account on the native sign-in form; click **Sign in**, open the protected
document and then **Sign out**. A normal browser does not trust this CA. Use the
launcher instead of bypassing a certificate warning. Neither system trust nor
your normal browser profile is changed. Test credentials and private keys are
under ignored, owner-only `.runtime/`; they are never embedded in evidence.

```bash
npm run service
npm test
npm run test:live
npm run test:fresh
```

The service command prints the authorization result, not its token. Live tests
temporarily revoke fixture grants/clients and pause the HTTPS issuer, restoring
state in finally blocks. Avoid simultaneous manual tests. The fresh rehearsal
briefly stops only the main HTTPS proxy, creates its own temporary project,
CA/credentials/database, tests both clients, removes its own disposable volume,
and restarts the main proxy. It leaves the approved HTTP stack untouched.

Close the isolated browser to end its launcher. Ctrl-C stops the application;
`npm run stop` stops the HTTPS containers and retains their database volume.
Certificates expire after 14 days (CA: 30 days). This first slice deliberately
does not implement automatic trust/key renewal; expired fixtures require a
separately scoped replacement retaining matching credential/database state.

## Boundaries

Only the proxy publishes host ports, all on 127.0.0.1: app 13443, public issuer
18443, and client-certificate-required operator API 19443. The app listens on an
owner-only Unix socket. Keycloak's TLS and PostgreSQL ports are not published.
The proxy verifies the internal Keycloak certificate and name, rejects incoming
forwarding hints, writes its own values, and restricts public issuer paths.
Keycloak trusts the selected proxy IP. TLS 1.2/1.3 are the selected test profile.

Keycloak runs `start` with HTTP disabled. Realm import creates a realm-scoped
provisioner; no master bootstrap administrator/password is installed. Operator
requests need a client certificate and realm-scoped client credentials. This is
an automated local provisioning mechanism, not completed human admin assurance.
Setup reapplies only selected realm HTTPS/branding fields and preserves existing
identities, signing keys, credentials and policy.

Cookies use __Host-, Secure, HttpOnly, Path=/ and SameSite=Lax. Browser tokens
stay on the server. Five-minute access tokens, 15-minute app inactivity and an eight-hour app maximum, code+PKCE, state/nonce,
single-use transactions, explicit issuer/audience/type/time checks, per-request
introspection, and current typed authorization remain in place. No refresh token
is retained. Service private-key JWT authentication does not sender-constrain
its resulting access token. Issuer or policy failure denies protected access.

No HSTS is sent for shared localhost, because HSTS would also affect the approved
HTTP prototype on other ports. Dedicated hostnames, production certificates,
HSTS, persistent sessions, passkeys/recovery, monitoring, backups, independent
security review and production operations remain later work. The use of
production-mode Keycloak alone is not a production-readiness claim.

## Evidence and Open Questions

`evidence/INPUT-CANDIDATE.json` closes the selected source/dependency/bridge bytes;
private runtime material is excluded. `evidence/TEST-RESULT.json` links live,
fresh-bootstrap and scoped offline EVF results. EVF checks the real cryptographic
verifier and Rust bridge with hostile inputs; it does not prove the TLS/browser
integration. The separate live/fresh tests cover that integration.

The predecessor remains unchanged in `../authentication-prototype`. This is a
hand-authored successor with a contract/scaffold, not full DomainSpec compiler
or formal-correspondence proof. Remaining questions and owners are in the
[next-steps plan](../../development/authentication-v1/NEXT-STEPS-PLAN.md#open-questions).

Mechanism references: [Keycloak TLS](https://www.keycloak.org/server/enabletls),
[trusted proxy configuration](https://www.keycloak.org/server/reverseproxy),
and [Chromium Linux certificate management](https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/docs/linux/cert_management.md).

## Session lifecycle increment

The [session contract and DAG](../../development/authentication-v1/SESSION-LIFECYCLE-PLAN.md) supersede the baseline HTTPS contract’s access-token-bound session maximum. Active sessions renew tokens through a bounded OIDC round trip. Inactivity or the absolute maximum locks the app and requires fresh credentials, even with issuer SSO. Missing cookies also require fresh authentication. No refresh tokens are stored. Server request activity on successful home/document navigation resets only the idle timer.

The isolated test browser is started with `npm run open`; regular browsers do not trust the disposable CA. Sign in, leave the app idle for 15 minutes, then open the document: the app must show “Your session expired” and require authentication after “Sign in again”. Token renewal after five minutes while still active should return to the app without a password prompt.

Open questions and later persistent/multi-app session work are owned by the linked plan.
