# Auth V4b READY-path source certificate — v2 candidate

This is a versioned successor to `auth-v4b-concrete-call-certificate.mjs`, which
remains a historical candidate for the older pre-resolved-wrapper composition.
Do not refresh that predecessor's pins to describe the new path.

Run `node auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-ready-successor.mjs`
from the repository root. Run the hostile controls with
`node --test auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-ready-successor.test.mjs`.

The successor binds exact current source bytes for the selected API, service,
READY authority, READY decision adapter, generated admission and policy kernels,
and three bridge roots. It binds every selected local crate manifest and the
selected root lockfiles.
The pinned `syn` inventory checks explicit call shapes for thirteen selected
functions. Locked offline Cargo metadata checks the exact normal local crate
set, package identities, and normal local dependency edges from the API and
each bridge root, rejecting legacy decision crates and unexpected local
dependencies. The selected source shape
places the actual transaction/request before admission, constructs a private
READY value only after the v2 gate's READY branch, and invokes the policy in
the continuation. Hostile fixtures test a pre-gate policy call, altered issuer
branch, engine/bridge redirection, and changed dependency closure.

Status is always `indeterminate`; `runtime_guarantees_observed` is always
`false`. The source-spelled chain does not resolve general Rust dataflow or
trait dispatch, prove every CFG path or callback effect, model SQL/iterator
semantics and async worker continuation, or close all native endpoint reachability.
In particular, the generated policy remains public inside the selected
dependency graph. This artifact grants no FormalClaim admission, runtime
guarantee, security authority, release, or deployment.

## Open Questions

- How will compiler-resolved call targets, callbacks, macros, implicit calls,
  and external effects be closed for every selected root?
- Can an independently reviewed path-dominance proof connect the actual request
  and transaction to each generated-policy entry for every normal execution?
- Should the generated raw-context policy API be hidden behind a generated
  READY-bound interface before an all-entrypoint claim is considered?
