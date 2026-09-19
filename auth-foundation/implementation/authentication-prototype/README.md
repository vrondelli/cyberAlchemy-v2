# Auth Foundation authentication prototype

Local prototype for people and autonomous services. Keycloak issues identity
tokens; a Node backend validates OIDC/JWTs and token status; a private Rust bridge
invokes the existing Auth Foundation authorization service for a protected
read. Status and observed results: [branded-login report](../../development/authentication-v1/BRANDED-LOGIN-REPORT.md).

## Start and stop

Prerequisites: Docker Compose, Node 22+, npm, Rust/Cargo and a C compiler for
bundled SQLite. Everything uses a dedicated Compose project and loopback ports.

```bash
npm ci --ignore-scripts
npm run build
npm run setup
npm start
```

Open **http://localhost:13000**. Keycloak is at
**http://localhost:18080**. Use `localhost` consistently, not an IP alias.
The setup creates only throwaway local credentials, stored in mode-0600 files
under ignored `.runtime/`. Read `.runtime/config.json` locally for Alice's
`userPassword` and the local administrator's `adminPassword`. Username: `alice`;
Keycloak bootstrap administrator: `prototype-admin`. Do not copy these test
credentials into production. The service's private key is also generated locally.
Setup is repeatable and preserves the existing test database and policy.

In another terminal:

```bash
npm run service
```

This authenticates `prototype-service` with a signed private-key assertion and
prints the protected document response, never the token or key.

Stop the application with Ctrl-C. Stop the containers with `npm run stop`.
Their dedicated database volume is retained. No automatic destructive reset is
provided. Deleting credentials without the matching test database can prevent
bootstrap access; keep the two together.

## Live walkthrough

1. Visit the application: the branded sign-in form opens directly. Sign in as Alice.
2. Open the protected document. Expect `ALLOW`, `principal_kind: human`.
3. Run the service command. Expect `ALLOW`, `principal_kind: service`.
4. Change the relevant principal's `read` to `false` in `.runtime/policy.json`
   and increment `revision`; publish edits atomically (temporary file + rename).
   The next request should return `DENY`. Restore the grant to continue testing.
5. Sign out. You stay on `/signed-out` until choosing Sign in; the old cookie cannot access the document.
6. Disable the service client in Keycloak: existing tokens and new token
   requests should fail. Re-enable it to restore the fixture.

The policy is an operator-owned local test source. Protect it and private stdin
bridge access with the same OS boundary as the application. Missing, malformed,
ambiguous, disabled or wrong-kind identities deny. Token roles and HTTP headers
do not assign permissions. Local policy changes take effect at the next request
snapshot, not retroactively during an already-running decision.

## Tests

```bash
npm test
npx playwright install chromium
npm run test:live
```

Run live tests while the app and containers are running. Live tests temporarily
change the dedicated test policy/client and restore them in `finally` blocks;
avoid simultaneous manual testing. If this Ubuntu host lacks browser libraries,
`bash scripts/browser-deps.sh` extracts packages locally without sudo;
`test:live` adds that local library path. On other systems use Playwright's
platform-specific prerequisites. Browser tooling is test-only.

The offline EVF provider runs real RSA verification and the compiled Rust bridge
under the existing EVF network-isolation mechanism. Its manifest excludes live
credentials; its evidence does not prove live Keycloak behavior. The separate
live test report covers that integration. `scripts/freeze-evf.py` produces a new
input manifest/profile after source changes; never refresh an approved epoch.

## Scope and security boundary

This build deliberately rejects non-local configured URLs. It uses Keycloak
development mode and HTTP on loopback, with HttpOnly/SameSite application cookies
but without Secure. **It is not a production deployment configuration.**
Production requires HTTPS/Secure cookies, hardened administration, accountable
key/recovery operations and the remaining requirements review. No system trust
store changes or public listeners are required for this prototype.

The browser uses code + S256 PKCE, state and nonce, a single-use login transaction
and an opaque server session. Tokens never enter browser storage. Sessions end
at access-token expiry (at most five minutes); refresh tokens are not retained
or used. Each protected request verifies signature/issuer/audience/type/time,
checks token status online, then checks current local policy. Issuer failure
fails closed. No offline acceptance/revocation cache is used.

Service identity is checked against an explicit registered issuer, subject,
client and kind. Asymmetric client authentication does not sender-constrain the
resulting bearer access token. DPoP/mTLS, SPIRE, delegation and multi-tenant
isolation are outside this first local slice. Passkey-only administration,
recovery, refresh-family replay and clustered operation are not claimed tested.

The private bridge materializes one policy snapshot into an ephemeral database,
then uses the predecessor's single-epoch authorization operation. Its legacy
`user_id` column carries an explicitly kind-prefixed principal key; this is a
successor adapter projection, not proof that the original human model already
supported service semantics. The bridge has no socket and accepts only trusted
stdin from the verifier process. Do not expose it as a public authorization API.

This is hand-authored integration over the approved engine. Ontology/source-set
artifacts are construction scaffolds, not full DomainSpec compilation or formal
correspondence proof for the authentication stack. Prior product approval is
preserved and does not extend to this candidate.

## Sources and Open Questions

[DAG](../../development/authentication-v1/PROTOTYPE-DAG.md),
[contract](../../development/authentication-v1/PROTOTYPE-CONTRACT.json),
[requirements](../../development/authentication-v1/REQUIREMENTS.v1-candidate.md),
[comparison](../../development/authentication-v1/SELF-HOSTED-COMPARISON.v1-candidate.md).
Library contracts: [openid-client](https://github.com/panva/openid-client),
[jose](https://github.com/panva/jose),
[Keycloak containers](https://www.keycloak.org/server/containers).
Remaining assurance, recovery, deployment and expansion questions are owned by
the requirements and prototype report. Human live-test feedback and exact
product approval remain separate from automated test results.

The `auth-foundation` login theme inherits the pinned Keycloak native forms.
Setup mounts it read-only and updates only the realm branding and browser-client
logout destination. Theme caching is disabled for local iteration, following the
[Keycloak theme guide](https://www.keycloak.org/ui-customization/themes); production needs its own caching configuration. Opening `/document` while signed out resumes at that document
after login; return destinations are server-owned, with no arbitrary return URL.
