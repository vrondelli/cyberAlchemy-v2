# Shared durable auth session core

Candidate private package used by the Auth Foundation durable successor and Body War's explicit `oidc-durable` profile. It owns OIDC code/PKCE/nonce validation, online token verification, encrypted session custody, opaque cookie rotation, PostgreSQL state and local session-family revocation. Consumers retain authorization and domain data.

`contract.json` records candidate entities/invariants. `src/policy.mjs` supplies finite deadline/freshness predicates; `src/store.mjs` supplies the checksummed schema and SQL concurrency implementation; `src/index.mjs` supplies OIDC orchestration. `src/index.d.ts` is the TypeScript consumer boundary.

Call `createStore`, run its idempotent `migrate()` during controlled startup, then call `createOidc` with a validated application profile and optional identity provisioning adapter. Store credentials and encryption keys must remain stable across restarts. Body War additionally persists local principals, local authorization sessions and provider records in its own database.

Mutations serialize per application using transaction-scoped advisory locks. This is a correctness-first local prototype with bounded lock and statement timeouts, not a throughput claim. The database clock enforces idle/absolute time; issuer tokens retain their own expiry. Sensitive session/transaction payloads use AES-256-GCM and namespace/record AAD. Opaque handles are random 32-byte values, stored by digest; older handles cannot authenticate but retain their own CSRF proof for revoking a racing renewal. Application databases use distinct credentials.

`npm test` runs nine real PostgreSQL scenarios against the dedicated test database initialized by `../authentication-durable/scripts/setup.mjs`. Live two-consumer tests and EVF orchestration are owned by that successor's scripts. The pure policy EVF audit is separate from SQL concurrency and browser evidence.

## Open Questions

Production scaling, key rotation/key custody, schema evolution, cleanup scheduling, database backup/HA, issuer revocation latency, account recovery, passkeys and global cross-application logout are owned by [the milestone plan](../../development/authentication-v1/DURABLE-SESSIONS-PLAN.md#open-questions). No production admission or general formal proof is claimed.

## Security actions

The shared security handler verifies current identity, exact origin, CSRF and an action allowlist, then requests fresh Keycloak authentication. These transactions cannot silently renew or issue an app session on completion. Code exchange checks the signed authentication time against Keycloak's direct token-response `not-before-policy`; older SSO authentication cannot cross a credential-revocation fence. This consumer profile is Keycloak-specific. MFA and recovery are owned by the [security construction contract](../authentication-durable/security/contract.json), with unresolved questions in [the MFA plan](../../development/authentication-v1/MFA-RECOVERY-PLAN.md#open-questions).
