# Auth V4b concrete production-pool successor — v3 candidate

This successor replaces the current-use role of the historical
`AUTH-V4B-READY-SUCCESSOR.v2-candidate.md` after the selected API changed its
production engine pool. Run
`node auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-pool-successor.mjs`
and the sibling `.test.mjs` from the repository root. The v2 exact-byte
certificate intentionally rejects the changed API source.

The v3 certificate pins the API, service, READY authority and decision adapter,
both generated kernels, three bridge roots, the API production-pool integration
test, selected manifests, and root lockfiles. Its selected AST checks still
bind the actual transaction/request to the READY issuer and the post-READY
policy continuation. It additionally checks that `PoolEngine` is a concrete
`SqliteAuthService<SystemDecisionClock>` in non-test builds; the private
`AuthorizationEngine` trait and boxed pool exist only under `cfg(test)`.
The compiled integration test exercises the normal library build and observes
a READY-to-ALLOW and a gate-DENY request. The four selected normal Cargo
closures still exclude legacy decision crates, with only the READY-decision
crate directly depending on the generated policy.

The result remains `indeterminate` and `runtime_guarantees_observed: false`.
Removing one known API trait-dispatch edge does not resolve general typed
def-use, all-path same-invocation dominance, callbacks, SQL/iterator or
implicit effects, async worker continuation, FFI, or every native endpoint.
No FormalClaim admission, product approval, release, deployment, or security
guarantee follows from this candidate.

## Open Questions

- Can compiler-resolved call/effect closure show that no selected pre-READY
  path reaches a native authorization-policy endpoint?
- How will the async worker, SQL callbacks and other implicit effects be
  related to the same request and transaction in an all-path proof?
- What independently observed TDE/EVF run and fresh evidence would justify a
  later `runtime_guarantees_observed` claim after semantic admission?
