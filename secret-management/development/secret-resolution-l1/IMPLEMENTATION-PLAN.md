# Implementation Plan — Fake-Local Grant, Resolver, And Lease

## Objective

Add one candidate-local execution boundary to `projects/secret-management`:
an already-issued structural `ExecutionGrant` may authorize exactly one call to
a test-owned in-memory resolver and exactly one bounded material callback.

## Delivery Boundary

Included:

- provider-neutral grant binding to a `SecretRef` digest, consumer digest,
  request digest, strict expiry, and one-shot claim state;
- a `SecretResolver` protocol;
- an internal `SecretMaterialLease` that owns and clears a mutable buffer;
- one orchestration entrypoint returning only a redacted canonical receipt;
- a fake resolver and spy confined to tests;
- exports and README text for the supported L1A boundary.

Excluded:

- grant issuance, authentication, signing, durable replay protection, policy
  evaluation, real secrets, credentials, SOPS, paths, files, environment,
  subprocess, CLI, network, provider calls, voice integration, migration,
  concurrency claims, publication, deployment, commit, or push.

## Public And Internal API

- Public package exports:
  - `ExecutionGrant`
  - `SecretExecutionError`
  - `SecretResolver`
  - `consume_secret`
  - receipt schema/profile constants needed to verify the redacted result
- Module-internal execution primitive:
  - `SecretMaterialLease`; it is constructed by a resolver implementation and
    is not exported at package top level.
- Test-only implementation:
  - `FakeSecretResolver`; it is defined in `test_fake_resolution.py` and never
    exported by product code.

## Inputs And Outputs

Inputs:

- one existing `SecretRef` with `backend_class == "test-fake"`;
- one structural `ExecutionGrant` built from high-entropy grant and consumer
  identifiers, the exact reference digest, one lowercase SHA-256 request digest,
  and an integer expiry;
- the execution-time `consumer_id` and `request_digest` repeated as explicit
  `consume_secret` parameters, so the current request can be compared with the
  grant rather than trusting grant-held values alone;
- an injected integer `now_epoch_seconds`;
- a resolver implementing `open_lease(secret_ref)`;
- a trusted callback accepting a read-only `memoryview` and returning `None`.

Output:

- one self-digesting redacted receipt containing only schema/profile, reference
  digest, grant digest, backend class, and `consumed` status;
- otherwise one generic `SecretExecutionError` that reflects no rejected input,
  callback exception, locator, or material.

## Ordered Rules

1. Validate argument runtime types, `test-fake` backend class, grant grammar,
   reference binding, consumer binding, request binding, strict freshness, and
   unused grant state. `consume_secret` accepts `consumer_id` in exact
   `co_[0-9a-f]{32}` form and `request_digest` as exact lowercase SHA-256 hex;
   it derives the consumer digest with the package canonical hash domain and
   constant-time compares both current values with the digests stored by the
   grant before resolver invocation.
2. If any pre-resolution check fails, raise a generic redacted error. Resolver
   and callback counts must remain zero.
3. Atomically for the declared single-threaded evidence model, claim the grant
   before invoking the resolver. A later replay or callback re-entry sees the
   consumed state and stops before another resolver call.
4. Call `resolver.open_lease(secret_ref)` exactly once. A missing fake mapping is
   an already-authorized resolver failure: resolver count may be one, callback
   count must be zero, and the outward error is generic.
5. Require the resolver result to be the internal lease type. Enter the lease,
   mark it consumed before callback invocation, and pass one read-only view over
   its owned mutable buffer.
6. Require callback return value `None`. A non-`None` return or exception becomes
   a generic outward failure.
7. In `finally`, release the local view, overwrite every byte in the owned
   buffer, and close the lease. Retained views must be unusable or observe only
   cleared bytes after return.
8. Return the redacted canonical receipt only after successful consumption.

## Failure Rules And Edge Cases

- `now == expiry` and `now > expiry` are stale.
- Wrong reference, consumer, request, malformed grant, non-test backend, and
  replay all stop with zero new resolver/callback calls.
- Missing fake mapping consumes the claimed grant, calls the resolver once, and
  returns a redacted failure with no callback call.
- Callback re-entry with the same grant or lease fails closed.
- Callback copies are outside the trusted-consumer boundary and are not claimed
  preventable by this Python prototype.
- Copy, pickle, JSON, `repr`, `str`, errors, and receipts must not disclose
  synthetic material or raw identifiers.
- No wall clock is read; time is injected.

## Exact Product Write Scope

| Path | Baseline | Operation |
| --- | --- | --- |
| `projects/secret-management/secret_management/execution.py` | absent | create |
| `projects/secret-management/tests/test_fake_resolution.py` | absent | create |
| `projects/secret-management/secret_management/__init__.py` | SHA-256 `5635561174f91e0a3384c42c0a08548581981af93bb46aa2102502547610d78d`, 528 bytes | update |
| `projects/secret-management/README.md` | SHA-256 `3ee49baa6680b8477b71892ccae013d8b09de73173adb30419bf1d1eca4e1125`, 774 bytes | update |

## Acceptance-Critical Validation

1. Valid future grant: resolver count one, consumer count one, exact synthetic
   material visible only inside callback, redacted result returned.
2. Table-driven wrong reference, wrong consumer, wrong request, malformed grant,
   non-test backend, expiry equality, and past expiry: resolver and consumer both
   zero.
3. Replay after success: resolver remains one; callback re-entry and second lease
   consumption fail.
4. Callback return or exception: one resolver/callback call, cleared/closed lease,
   generic outward failure.
5. Retained callback view is unusable or observes cleared bytes after return.
6. Representations, serialization, copy, errors, and result contain no material or
   raw identifiers.
7. Missing mapping: resolver one, consumer zero, redacted failure.
8. Focused L1A, full secret, ElevenLabs static, voice no-network, import/coupling,
   and exact-target whitespace checks pass.

## Recomposition

L1B may implement `SecretResolver` behind the same orchestration gate only after
SOPS recipient/recovery/CI policy is accepted and process behavior is separately
tested. L1C may inspect redacted reference and health metadata without resolving
material. Neither successor inherits a claim about real authorization, encryption,
credentials, voice generation, deployment, or production readiness.
