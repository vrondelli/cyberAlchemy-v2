# Inference browser consumer candidate

Separate Auth Foundation consumer adapter; the existing HTTPS application and
its frozen evidence are unchanged. `oauth.mjs` reuses its OIDC library, verifier,
introspection and authentication-time checks. `gateway.mjs` stores bearer tokens
server-side and exposes an opaque Secure/HttpOnly/SameSite cookie. The application
origin must be supplied by a trusted TLS adapter, never a caller forwarding header.

`enrollment.mjs` accepts verified identities on a trusted in-process port. The
operator policy adds `enrollment_roles: [roleId]` to each eligible principal.
Principals, memberships and role grants remain operator-owned. No registration
request or token role claim creates them. Enrollment materializes only the current
session and operator-selected active roles for the existing Rust authorization
service. The binding copies a fresh policy into an owner-only temporary file and
removes it after each decision; it never rewrites the operator's source policy.

Registry capacity is bounded. Expired tokens free capacity; revoked token IDs
remain denied until expiry and cannot automatically enroll again. Logout racing
an authorization decision suppresses a late allow. Current policy and online
issuer status are checked on access. Enrollment is session state, not an
allow-decision cache. This single-process candidate requires process affinity.

The browser follows `/login` → issuer → `/callback` → tenant picker and inference
form. Callback state, nonce and PKCE belong to the OIDC port; callback transactions
are single-use and bounded. `/session` exposes current tenants, CSRF proof and
expiry, never access or ID tokens. Writes and local logout require exact Origin
and CSRF proof. Bearer API clients bypass cookies and use the same authorization
port; combining bearer and session-cookie authentication is rejected.

Run `node --test consumer.test.mjs` from this directory. Tests cover enrollment,
current grants, revocation, expiry, capacity, callback reuse, CSRF and logout races.
The paired Alch browser package owns the compiled inference and live browser test.

## Open Questions

Persistent/cross-instance session and revocation storage, silent renewal,
issuer-wide logout, production origin registration and trusted TLS ingress are
not implemented here. Sessions end at token expiry or the imported AF idle limit,
whichever comes first. Active streams are not continuously reauthorized after
headers have been delivered. Re-login obtains a fresh token; local logout does
not sign out other applications at the issuer.

## Durable state successor

`state.mjs` exports `openSqliteState({path,key})` and `createMemoryState()`.
Pass the same durable state to enrollment and gateway so logout is one database
transaction. The operator supplies an absolute database path in a private local
directory and a separately retained 32-byte key. Close only after draining work.
No authorization grants are persisted or derived by this adapter. Existing
constructors without state retain their ephemeral rehearsal behavior.

Established sessions and token revocations persist, encrypted with AES-GCM;
record keys are HMACs. Wrong keys, unsupported schemas and storage failures do
not reset the database or choose memory. In-flight login transactions remain
local to one gateway; restart requires beginning login again. `state.test.mjs`
covers reopening, separate connections, abrupt process exit, revocation races,
capacity, encryption and failure. Tests use fixture issuer/provider behavior.

Open Questions for this successor are owned by
[the durable state plan](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/PLAN.md#open-questions).

## Bounded renewal successor

`renewal.mjs` binds silent OIDC renewal to the same verified identity, issuer
session and original authentication time. New OIDC sessions retain the original
application absolute deadline; access-token expiry returns RENEWAL_REQUIRED
before inference. POST /renew requires current browser cookie, Origin and CSRF.
Renewal preserves last activity, rotates cookie/CSRF and revokes the old token
atomically. No refresh or ID token is stored. Legacy sessions without renewal
metadata keep their original expiry. User inference is never automatically retried.

Current behavior, tests and Open Questions are owned by
[the renewal candidate](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md).
