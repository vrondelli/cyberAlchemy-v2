# Auth V4b downstream-call boundary — source-bound candidate analysis

Status: analysis only. No all-path proof, FormalClaim admission, TDE/F5 result,
or `runtime_guarantees_observed`. This note analyzes the selected current
sources; it does not change the [owner-accepted BusinessMeaning](../../../auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json).

## Exact proposition to investigate

The accepted rule says that every normally evaluated in-scope command-boundary
context producing kernel **DENY** has no downstream authorization call. It
does **not** assert that every public service `Deny` or every HTTP DENY has zero
calls. In particular, a kernel READY followed by a downstream policy DENY has
one call, as the [current service test](../../../auth-foundation/implementation/authorization-service/src/lib.rs)
demonstrates (`concrete_v2_caller_counts_downstream_invocations`, lines 1020–1028).

The candidate downstream endpoint for the selected concrete composition is
`ResolvedDecisionService::authorize` in
[`authorization-service/src/lib.rs`](../../../auth-foundation/implementation/authorization-service/src/lib.rs)
(lines 829–852). It counts entry before checking or evaluating the command.
`resolve_authorization_state_in_transaction` in
[`sqlite-provider/src/lib.rs`](../../../auth-foundation/implementation/sqlite-provider/src/lib.rs)
(lines 141–183) performs state reads, not this decision invocation. Whether
the owner intends *all* external authorization calls rather than this
composition's downstream endpoint remains unresolved; this note does not
silently narrow the accepted wording.

## Selected path and known boundaries

| Stage | Current source | Call-boundary observation |
| --- | --- | --- |
| Public in-process entry | [`SqliteAuthService<C>::authorize`](../../../auth-foundation/implementation/authorization-service/src/lib.rs), lines 255–260 | Supplies a no-op private hook; public callers cannot inject the test hook. |
| Preparation | Same file, lines 273–304, 359–488 | Clock, trusted-input and authorization-state resolution run before the v2 boundary. Early public DENY does not imply a kernel DENY. |
| Concrete composition | Same file, lines 491–543; [`pre-resolved-v2/src/lib.rs`](../../../auth-foundation/implementation/trusted-boundary-pre-resolved-v2-candidate/src/lib.rs), lines 14–60 | Service builds row vectors and then constructs its downstream adapter. The pre-resolved resolvers only clone those vectors; its borrowed decision adapter forwards calls. |
| Kernel dispatch | [`trusted-boundary-v2/src/lib.rs`](../../../auth-foundation/implementation/trusted-boundary-v2/src/lib.rs), lines 79–113 | Direct downstream invocation appears only in the kernel READY arm. |
| Native authorization | Service lines 836–850; [`sqlite-provider/src/lib.rs`](../../../auth-foundation/implementation/sqlite-provider/src/lib.rs), lines 129–135 | An invocation is counted even if the adapter rejects before native state evaluation. |

The existing [`AuthWrapperTrace.lean`](../../../auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AuthWrapperTrace.lean)
explicitly counts only the wrapper's direct site; it treats resolver and
downstream internals as opaque. Selected service tests observe zero calls for
duplicate/no-qualifier/invalid-input cases, not all normally evaluated
contexts. The v2 technical binding pins and replays the selected sources but
does not convert these observations into a universal call-graph proof.

## Counterexamples and scope hazards

- The generic v2 `TrustedAuthorizationBoundary<A,R,D>` allows resolver
  implementations with effects. Its passing
  [`no_call_contract_gap.rs`](../../../auth-foundation/implementation/trusted-boundary-v2/tests/no_call_contract_gap.rs)
  calls the same downstream service inside an authentication resolver before
  the kernel returns DENY. Thus the universal all-path claim is false for that
  unconstrained generic API, even though its direct dispatch is guarded.
- `SqliteAuthService<C>` accepts an unsealed
  [`DecisionClock`](../../../auth-foundation/implementation/runtime-adapter/src/lib.rs)
  (lines 136–138) and invokes it before boundary evaluation. An effectful
  caller-supplied clock is not excluded by the type contract. The concrete
  [HTTP database builder](../../../auth-foundation/implementation/authorization-api/src/lib.rs)
  (lines 314–340) selects `SystemDecisionClock`, but the generic API also
  accepts arbitrary `AuthorizationEngine` implementations.
- HTTP timeout may return an API DENY while a spawned blocking worker still
  runs (same API file, lines 215–236 and 343–360). API DENY therefore cannot
  serve as the kernel-DENY no-call witness.

## Next proof unit and exit condition

Build an exact source-bound trace for the concrete
`SqliteAuthService<SystemDecisionClock>` composition. Identify the domain
event (normally evaluated kernel DENY), the downstream endpoint set, and the
relevant pre-boundary collaborators. Prove that every route to each counted
endpoint passes the kernel READY guard, including aliasing and callback paths;
or retain a counterexample and mark V4b open. The generic resolver and
arbitrary-clock interfaces need a separate effect contract or a distinct,
explicitly scoped claim. A direct-site theorem and finite tests cannot be
promoted to this exit condition.
The bounded [call-edge certificate plan](AUTH-V4B-CONCRETE-CALL-CERTIFICATE-PLAN.v1-candidate.md)
separates that candidate adapter sublemma from full V4b admission.
Its first extractor checkpoint reports `indeterminate`: fixed pre-resolved
call shape, borrowed forwarding and wrapper direct-site counts are checked,
but concrete adapter binding and collaborator closure are still absent.

## Open Questions

- Does “downstream authorization call” designate the selected service adapter,
  every authorization endpoint reachable through injected collaborators, or
  another exact set? The owner-accepted words must not be weakened by an
  implementation-only interpretation.
- Which effect/alias discipline can establish no hidden calls for the selected
  concrete clock, providers, and pre-resolved resolvers?
- Should the generic v2 resolver API remain available with only a direct-site
  guarantee, or be replaced by an API that can carry an enforceable full-path
  contract? This is not decided by the concrete service tests.
