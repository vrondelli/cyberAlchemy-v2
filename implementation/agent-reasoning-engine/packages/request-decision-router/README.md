# Request Decision Router

Private candidate runtime for fast CyberAlchemy-v2 request routing and
configurable continuation gating.

The package performs two pure decisions after one startup verification:

```text
RequestContext + verified DecisionProfile
  -> direct capability | decision gate | block

Completion + proposed continuations + verified DecisionProfile
  -> complete | direct | decision gate | block
```

Goal is a normal route candidate. It matches only goal-specific objective
evidence and is never a fallback for Define, Understand, Validate, or another
capability.

Lexical route signals consume `semantic-key` and `contains-phrase` through an
injected Module Port snapshot. The Router has no direct Alch import and no
lowercase, substring, regular-expression, model, or old-runtime fallback. This
makes separator normalization and substring non-collapse common with Define
and ARE request intent while the verified Decision Profile still owns route
vocabulary, exclusions, priority, and the final route decision.
Only the raw request and structured target/constraint fields marked `explicit`
can supply lexical route signals or exclusions. Inferred fields remain bound
context, not user instructions. A read-only product requirement does not veto
an implementation request; direct `do not implement` wording still does.
An excluded explicit objective cannot fall through to an incidental lexical
route from another field.

`routeRequest(request, profile, modulePort)` records `semantic_evidence` as
`evaluated`, `unavailable`, or `blocked`, including the module-set digest and a
digest over the exact invocation-receipt set. Exact structured objective/effect evidence may
still select a route when semantics are unavailable. A lexical-only request
gates with `route.semantic-capability-unavailable`; a blocked adapter blocks the
decision. Missing capability is never interpreted as a negative match.

## Optional route availability

A Decision Profile route policy may declare `availability_capability_id`. The
Router then asks the injected Module Port whether that exact registered route is
available before considering it eligible. The decision is evaluated by the
compiled `alch/route-availability.alch` contract and records module identity,
version, receipt digest, reasons, and repair focus on the route trace.

Policies without this field continue to use registry lifecycle state alone. A
module cannot invent a route or override a blocked registry lifecycle. If an
explicit objective names a route whose declared capability is unavailable, the
Router returns `gate` and does not fall through to an incidental lexical route.
The Router never invokes the module's workflow; it only consumes availability
evidence and selects from registry-owned routes.

After each completed operation, the host calls `evaluateContinuation`. It may
follow a `direct` result only when exactly one structurally admissible option is
non-consequential and reversible. Multiple choices, unknown effects,
irreversibility, protected hazards, or a named owner gate return `gate`. Zero
admissible options return `block`; no required continuation returns `complete`.

`advanceUntilGate` evaluates an already supplied sequence. It does not execute
tools or effects. A host may use the same rule after each real completion, but
the host remains responsible for execution, persistence, and owner interaction.

## Performance boundary

Production routing loads the content-addressed
`profiles/cyberalchemy-route-pack-v1.json` policy bundle. Repository files are
authoring inputs to `scripts/build-policy-bundle.mjs`; they are not reread by a
normal `are decide route` invocation. The bundle contains the admitted decision
profile, complete route contracts, provenance digests, and its own digest.
Tampering fails closed before routing. Live `loadVerifiedDecisionProfile`
loading remains the development/compiler path and reads and hashes provenance
once. The hot-path
functions receive the admitted frozen profile and perform no filesystem,
network, model, discovery, persistence, or tool calls. Run the local benchmark:

```text
toolchains/node-typescript/bin/node-env run \
  --project projects/domainspec-v2/impl -- \
  node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/scripts/benchmark.mjs
```

Timing is evidence for the current machine and bytes, not a universal latency
guarantee.

## Authority boundary

Every result has `authority_effect: none`. `direct` is routing evidence, not
consent or execution. `gate` identifies an owner decision boundary but cannot
satisfy it. The configured profile is candidate runtime policy, not an adopted
Governance rule, Constitution, permission, or exact-effect gate.
