# Auth Foundation MFA and durable session prototype

This successor shares `@auth-foundation/session-core` with Body War. Each application runs two worker processes behind its own trusted local HTTPS listener and uses a separate PostgreSQL database, login role, encryption key and Keycloak client.

| Consumer | URL | Identity provider |
| --- | --- | --- |
| Auth Foundation | https://auth-durable.localhost:15443 | Existing local Keycloak issuer |
| Body War | https://body-war-durable.localhost:16443 | Same issuer; distinct client/audience |

Use **alice** and the password in [.runtime/TEST-LOGIN.txt](.runtime/TEST-LOGIN.txt). Body War links synthetic Strava separately after sign-in. Existing demos remain at https://localhost:13443 and https://body-war.localhost:14443; those predecessor versions still keep their OIDC state in memory.

## MFA and recovery

The shared Keycloak realm now requires MFA for the operator-assigned `auth-privileged` role. Regular users can opt in; enrolled users must provide OTP or a recovery code. This role selects authentication policy and does not grant application or Keycloak administrative permissions.

Use **alice** for optional enrollment, or **mfa-admin** for mandatory first-login enrollment. The dedicated demo passwords are in [.runtime/security/TEST-LOGIN.txt](.runtime/security/TEST-LOGIN.txt). Synthetic test identities are separate and deleted after each campaign.

Open **Account security** in Auth Foundation or **Seguranca da conta** in Body War. Authenticator setup, recovery-code generation and password changes require fresh authentication. Credential changes invalidate pre-change issuer sessions in both apps, regardless of the form's optional logout checkbox. The completion page asks you to sign in again. The issuer commits a token revocation timestamp with a credential change; the shared callback rejects older authentication times, and the listener removes pre-change sessions after commit to avoid conflicting with Keycloak's own session update. Initial enrollment can complete login when there was no prior session.

Password reset uses Keycloak's sign-in link and the [local test inbox](http://localhost:18025). Email possession cannot bypass an enrolled second factor or remove an authenticator. Use a saved recovery code through **Try another way** when a phone is lost. A recovery-code login signs out other existing sessions. The security page links to Keycloak's credential manager: add the replacement authenticator and remove the lost device there. Every recovery code works once; store them privately before leaving enrollment.

This inbox captures local prototype mail; it has no outbound SMTP relay configured. Do not use it as a production mailbox. No existing Alice password is reset by setup or tests.

The running Body War consumer uses the isolated sibling `body-war-v2-auth-mfa` candidate, captured while another task was changing Body War. Its source-input manifest and final validation remain separate from the actively edited `body-war-v2` checkout.

## Start and recover

From this directory, `npm run recover` starts the required existing issuer containers, waits for verified discovery, starts the dedicated database and launches the successor. It reuses persisted credentials, keys and data. For normal startup when dependencies are already ready, use `npm start`. Stop the foreground cluster with Ctrl+C. A second launch is rejected before existing worker sockets are touched.

Initial installation uses `npm install --ignore-scripts`, `npm run setup`, `npm run build:security`, `npm run setup:security`, and Body War's `npm run build:model` plus `npm run build`. The Java provider is compiled in a pinned JDK container against the pinned Keycloak 26.7.3 libraries. The fixture requires the existing Auth Foundation HTTPS CA/operator files and pinned browser tooling. It does not change machine-wide certificate trust. A trusted test browser is launched using the predecessor's isolated browser trust profile.

Keep `.runtime/config.json`, the PostgreSQL volume and the server encryption keys together when recovering locally. Database loss is different from an app restart: requests deny when the store is unavailable. No fallback creates an in-memory session.

## What is shared

The [session core](../session-core/README.md) owns code/PKCE/nonce validation, token profile and online introspection, hashed opaque handles, encrypted credentials, shared expiration, session generations, one-use login transactions and local revocation. Body War retains its PostgreSQL principal/permission/provider repositories and domain consent checks. Auth Foundation retains its existing compiled authorization bridge and uses a dedicated local policy binding for its new client. The original service-token API remains on the predecessor; this successor milestone covers shared browser sessions.

Renewal keeps the session's idle and absolute deadlines. It rotates the opaque handle; old handles cannot access protected data. Their bounded, stored CSRF proofs allow a logout already in flight to revoke the new handle as well. A logout affects one application's session family, across both instances. It does not globally sign out unrelated applications.

## Validation

- `npm run test:security`: real browser enrollment, mandatory/optional MFA, factor failures, security actions, recovery and cross-worker revocation.
- `npm run test:security-evf`: sixteen finite security-action policy cases and a rejected origin-removal mutation, independently verified.
- `npm run test:store`: real PostgreSQL concurrency, expiry, encryption, isolation and failure scenarios.
- `npm test`: real Keycloak/TLS login across instances; worker restarts; local authorization; provider persistence; real token expiry/renewal; stale-handle logout; idle reauthentication; pending provider link cancellation; database-role isolation; database outage/restart and issuer-session revocation.
- `npm run test:evf`: twelve finite shared policy cases with a rejected deadline mutation and independent verification. It does not prove SQL concurrency or the full OIDC protocol.
- Body War `npm run validate:pilot`: generated models/contracts, unit tests, legacy browser tests, disposable PostgreSQL and existing bounded EVF campaign.

Run `npm test` with the successor cluster stopped; the test owns its cluster and deliberately restarts **only** `auth-durable-postgres-1`. It temporarily shortens tokens for the two dedicated successor clients, then restores 300 seconds. In-process test routing selects workers; there is no HTTP routing or clock-control backdoor.

[Live evidence](evidence/live.json), [store test output](evidence/store-test.txt), [EVF evidence](evidence/evf.json), and [Body War validation](../../../body-war-v2/evidence/validation.json) remain separate evidence surfaces. The combined candidate manifest binds the shared package and both consumers.

## Open Questions

This is a correctness-focused local prototype. PostgreSQL serialization is per application namespace; capacity/retention and high-throughput operation need later work. Production HA/backups, schema migrations beyond v1, externally managed key rotation, rate controls, passkeys, support-assisted recovery, global logout and release qualification remain owned by [the construction plan](../../development/authentication-v1/DURABLE-SESSIONS-PLAN.md#open-questions). Login survives worker/database restarts only while its independent issuer session and application deadlines remain valid. Browser closure, missing cookies or issuer restart policy may still require reauthentication.

Security-specific questions and the construction DAG are owned by [MFA-RECOVERY-PLAN.md](../../development/authentication-v1/MFA-RECOVERY-PLAN.md#open-questions). Concurrent in-flight issuer authentication during a credential change and failure recovery of post-commit session cleanup require further qualification; the tested guarantees cover the pre-change sessions.

## Lifecycle repair candidate

The [repair plan](../../development/authentication-v1/LIFECYCLE-REPAIRS-PLAN.md) tracks the audited lifecycle fixes. Test commands run through `node scripts/verify-run.mjs <suite> <command> <args>` using the exact commands in `scripts/receipt-policy.mjs`. Stop the local launcher before the security suite, which owns its cluster; restart it for account, deletion, console and lifecycle suites. `node scripts/freeze.mjs` requires every current suite receipt, unchanged source and unchanged result artifacts. Historical pilot evidence remains explicitly inherited.

Interactive setup has a ten-minute budget. If a setup callback expires after a credential was saved, start a fresh sign-in with that credential. Idle and absolute app session limits remain fifteen minutes and eight hours. Group/role graph edits conservatively sign out realm users in this prototype.

Open questions remain in the linked repair plan.
