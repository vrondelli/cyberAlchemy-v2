# Durable auth milestone result

The requested next milestone is implemented and available for local review. Auth Foundation and Body War use the same [durable session core](../../implementation/session-core/README.md), with separate clients, database roles, databases and encryption keys. Their tested successor runs two workers per application.

- Auth Foundation: https://auth-durable.localhost:15443
- Body War: https://body-war-durable.localhost:16443
- Username: `alice`; password and URLs in the private [credential handoff](../../implementation/authentication-durable/.runtime/TEST-LOGIN.txt).

## Completed construction

Preserved predecessor → candidate session contract → shared PostgreSQL/OIDC core → two consumer adapters → cross-instance and restart tests → regression/EVF → tested successor. The [DAG and operational lane](DURABLE-SESSIONS-PLAN.md) retain the exact scope and deferred work. Body War routes remain generated from its canonical AlchLang model; the shared package has its own candidate contract and a joint manifest with both consumers.

Valid sessions, stable local principals and linked synthetic provider records survive worker restarts. Login can start on A and complete on B. A logout submitted with an older valid handle/CSRF pair revokes a completed renewal as well as the current handle. Expired sessions cannot renew through SSO; fresh authentication is required. Pending provider callbacks cannot recreate identity after logout. Database/issuer failure denies protected access. Sensitive state is encrypted, and cookie handles are stored by digest.

## Validation

- Nine real PostgreSQL store tests passed: concurrency, one-use transactions, expiry boundaries, pending-write/logout serialization, ciphertext integrity, namespace separation and unavailable-store denial.
- Twenty live checks passed through real Keycloak and verified TLS: both worker restarts, stable identity, existing authorization bridge, persistent provider connection, old-handle logout, actual token expiry/renewal, fresh login after inactivity, database-role isolation, signed-token audience/signature negatives, database outage and physical database-process restart, and targeted issuer-session revocation.
- All 23 Body War pilot validation stages passed, including 51 unit tests, eight legacy browser tests, seven critical PostgreSQL scenarios and the existing bounded EVF checks.
- The shared policy EVF passed twelve finite cases and independent verification; the deadline-equality mutation was rejected. This is not a proof of the SQL implementation or whole OIDC system.

The user's host reboot interrupted an earlier campaign. Files and persisted data survived; required services were restored and final checks rerun. The original memory sessions were lost in that reboot, so no claim is made that those predecessor sessions survived. All 163 original Auth Foundation source inputs remain unchanged. A test-ordering defect was also corrected: generated EVF policy inputs are prepared before the Body War source snapshot. Live restart tests run after compilation against a fixed build.

## Exact candidate and evidence

Joint candidate: `bb1f146d998042f95db82f01e2e99ee5f08d1de1e9c37fe1c60ee0dbff731db7`.

[Joint source/runtime manifest](../../implementation/authentication-durable/evidence/CANDIDATE.json), [verification summary](../../implementation/authentication-durable/evidence/VERIFICATION.json), [live evidence](../../implementation/authentication-durable/evidence/live.json), [EVF evidence](../../implementation/authentication-durable/evidence/evf.json), and [recovery checks](../../implementation/authentication-durable/evidence/recovery.json).

Run `npm run recover` in `implementation/authentication-durable` after a host restart. The tested launcher reuses the dedicated database and keys, waits for verified issuer discovery, and refuses a second live cluster before touching worker sockets. No production deployment, source commit or submodule pointer change occurred.

## Open Questions

MFA/passkeys, recovery, production certificates/secrets, key rotation, HA/backups, rate controls and global cross-application logout remain subsequent roadmap milestones. The original service-token API stays on the predecessor; this increment covers shared durable browser sessions. Full ORODI readiness, formal discharge and production qualification are not claimed. The [plan](DURABLE-SESSIONS-PLAN.md#open-questions) and [successor guide](../../implementation/authentication-durable/README.md#open-questions) own that residue.
