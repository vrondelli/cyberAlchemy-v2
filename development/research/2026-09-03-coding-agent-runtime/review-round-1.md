# Reviewer Round 1

## Lakatos, Imre — precedent and ownership

Overall verdict: **REPAIR**. The candidate preserves the right major owners and avoids wholesale dependency adoption, but several binding labels outrun the precedent/ownership evidence. No architecture selection follows.

- **PASS — CyberAlchemy-v2 / ARE ownership split.** ARE explicitly owns inspectable reasoning/context state while denying effect authority and replacement of CyberAlchemy-v2 routing/governance; its architecture separately reserves effect permission to the effect-gate owner. Sources: `cyberAlchemy-v2/development/agent-reasoning-engine/README.md:6-59,65-140`; `design/ARCHITECTURE.md:46-162`; synthesis `CR-020..024` at `synthesis.md:80-86`.
- **REPAIR — existing ARE components.** Reclassify route/context/state/gateway/continuation from “Adopt/extend” to **build-from-owned / extend-owned candidate**. “Adopt” incorrectly suggests a dependency decision, and historical tests cannot establish current binding because 15 authored wrapper files drifted. Preserve the current owner, but mark current conformance `not_evaluable` until exact-current-byte replay. Sources: `research.md:73-98,100-127`; `synthesis.md:40-43,90-96,172-180`.
- **REPAIR — coordinator, result ledger, sandbox kernel.** `CR-091` says building these is “justified because ownership-critical and small,” but no exact size evidence or accepted owner exists. The ARE architecture already contains actor journal, effect-gate adapter, future dispatcher, idempotent attempt receipt, and replay services; a new coordinator/ledger/kernel risks duplicate ownership. Bound correction: classify each as **unsupported pending owner mapping**; require `mechanism → existing owner/store → missing obligation → duplicate ruled out`. Merge or extend where ARE already owns the causal record. Sources: `design/ARCHITECTURE.md:46-162`; `synthesis.md:84-85,94,145-150,184-186,208-219`.
- **PASS — mini-swe-agent as precedent and benchmark only.** The exact `v2.4.6` tag resolves to `a83fcae…`; it is a non-prerelease release, MIT-licensed, but self-classified Alpha and uses broad dependency ranges. Its small query/execute/observe loop and replaceable protocols are positive precedent, not novelty and not grounds for wholesale adoption. Keep **adapt-pattern-only / benchmark-only**; the synthesis’s wholesale rejection survives. [Release](https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.4.6), [package metadata](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/pyproject.toml#L6-L47), [MIT license](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/LICENSE.md#L1-L20), `research.md:133-173`.
- **PASS — mini-swe benchmark claim ceiling.** The pinned leaderboard artifact supports the 76.8%, 32.896-call, $0.7539 average result for mini-swe-agent `2.0.0` with Claude 4.5 Opus high, not v2.4.6 fitness or latency. Add the missing exact artifact locator to the synthesis: [`data/leaderboards.json@193160a…`](https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/193160a463a435d05cf44a1fa9dc5eac832113c3/data/leaderboards.json). Sources: `research.md:193-218`; `synthesis.md:43-44,98`.
- **REPAIR — BAML modular seam.** `0.225.0` is correctly pinned to peeled commit `da2a673…`, non-prerelease, Apache-2.0, and the modular request/parse API is real precedent. But the cited modular documentation is live/unversioned, not an exact `0.225.0` implementation selector; the release commit also records provider-dependent integration failures and collector-cleanup errors. Reclassify “adapt conditionally” to **benchmark only pending pinned-source API proof**, generated-artifact/lockfile closure, license-notice handling, and mutants.
- **PASS — reject duplicate BAML ownership.** Keeping BAML transport, retries/fallbacks, collector-as-ledger, HTTP preview, and nightly language out of the primary path is supported.
- **KILL — false novelty and unsupported fitness.** Kill novelty claims for append-only trajectories, typed outputs, replay, agent loops, sandbox adapters, and idempotent effect patterns. Kill any present claim that BAML or mini-swe is latency-, security-, replay-, or production-fit.

No component adoption, architecture choice, implementation, or authority decision is established.

## Popper, Karl — non-vacuity and performance

Verdict: **BLOCK / performance fitness not evaluable.** The synthesis correctly labels its latency table as design targets, but “Ferrari-fast,” “slick,” current safety, traceability preservation, or performance fitness have no complete executable evidence.

- The only measured latency is historical: 100 warm context-lifecycle iterations, p95 `94.26293 ms`. Its receipt has no raw samples, p50/p99, cold measurements, hardware/load specification, byte/token counts, cache-hit evidence, or invalidation reasons.
- The September 1 App Server canary is one run over historical bytes. Its 17-event stream contains no timestamp, duration, latency, token, or byte field, so it cannot witness route latency, first feedback, model dispatch overhead, tool RTT, reconnect, recovery time, or task duration.
- The canary’s `ordering.effect_before_approval: true` is semantically hazardous. If literal, it kills the safety claim; if it means “effect decision before approval,” the field must be renamed and directly asserted as `approval_before_effect_execution`.
- `implementation-binding.v2.json` is explicitly unaccepted/not assessed, and the synthesis reports 15 authored-file digest drifts. Historical PASS cannot characterize current bytes.
- No controlled four-way run exists for pinned mini-swe-agent v2.4.6, current ARE App Server, BAML-bound ARE, and the combined slice.
- BAML has no applicable cold-start/per-call distribution. Its cited `<20 ms` JSONish assertion is not a released distribution and lacks machine context.
- Missing entirely: exact-prefix byte reuse, cache invalidation causality, reconnect distribution, duplicate-suppression mutant, effect-crash recovery mutant, and whole-task quality/non-inferiority evidence.

Required benchmark contract:

```text
variants = mini-v2.4.6, current-ARE, ARE+BAML, combined-slice
controls = identical task corpus, model ID/reasoning, prompt bytes,
           environment/container digest, network policy, retry policy
runs     = >=30 cold process runs and >=100 warm runs per variant/task class
record   = raw samples plus p50/p95/p99; request/response bytes;
           stable/volatile/cached/uncached/output tokens; first differing
           prefix byte; invalidation reason; model calls; cost; patch/result;
           focused-check outcome
mutants  = reconnect cursor replay, duplicate action ID, kill after effect
           before append, missing terminal event, schema/dependency drift
quality  = resolved/validated rate, empty patches, regressions, failures,
           wall time, calls, cost; predeclare a non-inferiority margin
```

KILL “Ferrari-fast,” safety, traceability, cache, BAML-fit, and performance-fit claims until their named witnesses pass. Add timestamp/duration/byte/token fields, raw samples, hardware and current digests; separate parsing from model/tool latency; fix ambiguous ordering names; and report missing dependent checks as `not_evaluable`.

## Taleb, Nassim Nicholas — security, authority, and failure tails

Verdict: **BLOCK construction/acceptance.** The synthesis is directionally disciplined but not security-closed. “Typed,” “durable,” “authenticated,” and “exactly once” are aspirations, not established properties.

Verified threats include optional/default-allow gateway authorization; same-UID reconnect impersonation; no durable delivery cursor or acknowledgement; RPC recovery gaps; unsigned observations; floating approvals; under-specified action IDs; non-atomic idempotency; sandbox TOCTOU, descriptor, child, DNS/socket, and secret leaks; incomplete cache keys; patch-success collapse; and p95 tail blindness.

Required repairs:

1. Add typed states including `AUTHN_FAILED`, `AUTHZ_STALE`, `DELIVERY_AMBIGUOUS`, `EFFECT_AMBIGUOUS`, `PROVENANCE_UNVERIFIED`, `CACHE_INVALID`, `DEPENDENCY_DRIFT`, `SANDBOX_ESCAPE_ATTEMPT`, `RESULT_UNTRUSTED`, `PARTIAL_STREAM_TERMINATED`, and `DURABILITY_FAILED`.
2. Bind authenticated sessions to an unforgeable credential, consumer, lane, runtime epoch, expiry, nonce, and acknowledgement cursor; default deny.
3. Give every delivered event a durable sequence/digest and persisted acknowledgement.
4. Domain-separate and canonically encode action IDs with base tree, target, arguments, tool/runtime/sandbox digests, authority capability, branch, and parent state.
5. Narrow “exactly once” to participating kernels with atomically committed effect and result; otherwise block `EFFECT_AMBIGUOUS`.
6. Make approval an immutable capability record with subject, issuer, delegation, operations, resources, limits, tool/environment digests, monotonic bounds, nonce, revocation epoch, and usage semantics.
7. Require kernel-authenticated observations; model summaries remain untrusted projections.
8. Use descriptor-relative no-follow filesystem access, closed descriptors/environment, contained children, default-deny egress, secret handles, and fail-closed limits.
9. Bind cache entries to canonicalizer, compiler, runtime, and transitive-lock digests; never cache authority decisions.
10. Independently verify exact base/post trees, allowlisted changes, validation receipts, residue, and owner acceptance.
11. Measure p99.9/max and adversarial recovery latency; timeout, overload, and telemetry loss default to no effect.

Surviving candidates are the tiny loop relation, BAML only as a pinned benchmark parser boundary, ARE Context Envelope and Reasoning State subject to durable/authenticated closure, App Server as transport only, and per-action immutable approval for a non-network fixture. Kill any default-allow, partial-driven, floating-approval, unsigned-observation, automatic-ambiguity-retry, path-escape, inherited-secret, non-atomic-idempotency, cursor-gap, replay-with-effect, cache-drift, or hidden-retry behavior.

No architecture selection is made.
