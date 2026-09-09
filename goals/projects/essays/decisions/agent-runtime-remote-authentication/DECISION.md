# Essays Agent Runtime Remote Authentication

Result: selected, pending security-owner review

Selected option: `OPT-AUTH-PAIRING-DPOP`

Authority effect: none

An owner-visible, expiring pairing ceremony will register one asymmetric key
for each remote client. The daemon may then issue short-lived, audience-,
resource-, and scope-restricted tokens sender-constrained to that key. Each
protected request must carry a fresh DPoP proof, and refresh credentials must
rotate with replay detection and selective device revocation.

This authenticates a client; it does not authorize an Essays action. Every
command still crosses the capability, revision, idempotency, policy, and effect
gates. Remote exposure remains prohibited until the separate Essays
security-owner gate is satisfied.

The machine-readable decision is `selection.json`, bound to request digest
`bddd17f6609bfb8f3d268c745a4d070f3ca85c6fba2af6104de2d1cd5219045a`.
