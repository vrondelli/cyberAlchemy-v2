# HTTPS authentication threat model and construction boundary

Date: 2026-09-07. Candidate A+B implementation contract; authority effect: none.
Inputs: [next-steps plan](NEXT-STEPS-PLAN.md), [HTTPS profile](HTTPS-CONTRACT.json),
[requirements](REQUIREMENTS.v1-candidate.md). Owner: Auth Foundation product owner.

Assets are identity bindings, tokens, sessions, client keys, issuer signing keys,
policy grants and database state. Adversaries include unauthenticated network
callers, a malicious client with its own credentials, stolen bearer tokens and
untrusted forwarding headers. Docker/root and the owning OS user control this
local test environment; isolation from those operators is not claimed.

| Threat | Selected control | Required observation |
| --- | --- | --- |
| Traffic interception / wrong endpoint | CA-validated TLS, explicit issuer/origin and pinned proxy backend hostname | Valid flow succeeds; unknown CA and wrong hostname fail without TLS bypass. |
| Proxy/Host spoofing | Reject caller Forwarded/X-Forwarded identity hints; exact Host; app Unix socket; no Keycloak/DB published ports | Forged headers/Host fail; Docker publication inspected; private app socket permissions checked. |
| Public administration | Public realm/resources path allowlist; separate mutual-TLS operator listener and realm-scoped service account | Admin/master/management paths unavailable publicly; absent/wrong operator certificate fails; correct certificate plus token succeeds. |
| Credential and grant confusion | Code+PKCE/state/nonce; separate human/service clients, audience and typed policy; fixed return IDs | Replay/state/code manipulation and wrong client/key/audience reject; both positive controls work. |
| Session theft/fixation and logout CSRF | Opaque __Host- Secure/HttpOnly cookies; rotation; Origin+CSRF; five-minute token cap | Cookie/storage checks, rejected logout CSRF, old session denial and stationary signed-out page. |
| Issuer failure or stale authority | Online introspection and current Rust authorization policy | Valid token denied during issuer/policy failure and after disablement. |
| Bootstrap leakage or repeat-setup reset | Import realm-scoped provisioning account; no master password-grant bootstrap; generated private files; narrow repeat updates | Fresh import succeeds; repeat setup preserves subjects, credentials, keys and policy; master bootstrap user absent. |
| Resource exhaustion | Proxy request/body/connection limits, backend concurrency cap, Keycloak bounded queue | Bounded malformed/oversize failures and post-error health; production load sizing not claimed. |

Provisioning uses a local client certificate plus a realm-scoped confidential
service credential. It is a test operator mechanism, not the future human admin
assurance flow. Private-key JWT authenticates the autonomous service at token
issuance; issued bearer tokens are not sender-constrained. No passkey, recovery,
tenant isolation, high availability or production assurance claim is added.

Construction frontier: A contract -> B implementation -> frozen candidate ->
current live and EVF evidence -> human review. Runtime source is a hand-authored
successor scaffold; complete DomainSpec compilation/formal correspondence remains
not_evaluable. No ambient ontology selector dependency is introduced.
Operational support: implementing agent owns isolated certificates, Docker state
and browser trust for B/tests. Production domain/custody/operations owners remain
unassigned; that residue does not block this disposable local construction.

## Open Questions

Production hostname/RP, persistent sessions, recovery/administrator assurance,
load targets, audit retention, key custody and release review remain in
[NEXT-STEPS-PLAN.md](NEXT-STEPS-PLAN.md#open-questions).
