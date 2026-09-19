# Account console repair

## Product frontier and construction

User-reported failure: the Keycloak account console showed “Danger alert:Something went wrong” and “Sorry, an unexpected error has occurred.” The original imported Alice identity lacked account client roles. A disposable user with equivalent missing roles reproduced the exact screen and HTTP 401 from /realms/auth-https/account/credentials. The previous MFA tests created users through the admin API, which supplied default roles and missed the imported-user case.

The shared security page also used an obsolete hash URL. The installed Keycloak 26.7.3 console uses /account/account-security/signing-in. The old URL did not reliably open the intended section; it was a separate defect from the missing-role failure.

DAG: inspect live failure → reproduce imported-user permissions → preserve baseline → repair scoped migration and shared link → trusted-TLS browser validation → retain testable local service.

The baseline was already archived, with all 685 enumerated inputs verified, in [history/mfa-before-cookie-repair](history/mfa-before-cookie-repair/README.md). This successor changes the shared account link and adds an idempotent self-service permission migration to setup-security. The migration targets the original configured human subject, rejects service accounts, and assigns only account:view-profile and account:manage-account when missing. The latter includes Keycloak's manage-account-links composite; no realm-management role is granted. Existing credentials and other role assignments remain intact.

## Validation and testable result

[Live evidence](../../implementation/authentication-durable/evidence/account-live.json) records five passing browser/integration checks:

1. A legacy imported user without account roles reproduces the exact reported error.
2. Migration is idempotent and does not modify credential metadata.
3. Migration grants no realm or administrator roles.
4. The Foundation security link opens Signing in, Two-factor authentication, and a successful credentials API response.
5. The Body War security link does the same.

Run `node scripts/test-account.mjs` from implementation/authentication-durable while its local cluster is running. It creates and deletes only its own disposable user. Both apps remain running with two workers and trusted TLS.

A metadata-only check confirmed Alice retains the original password (created 2026-09-07T15:54:40.661Z) and OTP (created 2026-09-07T22:43:19.415Z), with no realm-management roles. The permission change invalidated existing sessions through the existing security-event listener; a fresh login is expected. No user credential values were read or changed.

The exact successor and scoped verification are in [CANDIDATE.json](../../implementation/authentication-durable/evidence/CANDIDATE.json) and [VERIFICATION.json](../../implementation/authentication-durable/evidence/VERIFICATION.json). Earlier broad MFA/durable/EVF checks remain historical baseline evidence; they were not rerun for this focused permission-and-link repair.

## Operational tasks and owners

User: sign in freshly and open https://localhost:18443/realms/auth-https/account/account-security/signing-in. Windows CA trust remains a separate user-machine setup step. No certificate, timeout, token-validation, proxy, or MFA policy relaxation was needed. Existing deployment, production-email and passkey work remains deferred under MFA-RECOVERY-PLAN.md; none blocks this local repair.

## Sources

- [Pinned console route](https://github.com/keycloak/keycloak/blob/26.7.3/js/apps/account-ui/src/routes.tsx)
- [Keycloak account console documentation](https://www.keycloak.org/docs/latest/server_admin/#_account-service)
- [Migration](../../implementation/authentication-durable/scripts/account-access.mjs)
- [Regression test](../../implementation/authentication-durable/scripts/test-account.mjs)

## Open Questions

Future imported identities need an explicit self-service access policy in their provisioning workflow. This repair intentionally targets the existing legacy human rather than granting permissions to every realm identity. Production scope remains owned by MFA-RECOVERY-PLAN.md.
