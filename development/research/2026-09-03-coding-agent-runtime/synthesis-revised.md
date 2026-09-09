# Coding-Agent Runtime Candidate — Revised After Review Round 1

**Dispatch:** `2026-09-03-cyberalchemy-are-coding-agent-runtime`  
**Synthesizer:** Wiener, Norbert  
**Status:** repaired research candidate  
**Current conformance:** `not_evaluable`  
**Fitness:** latency, security, replay, cache, traceability, BAML, mini-swe-agent, and production fitness are all `not_evaluable`.  
**Authority ceiling:** no component adoption, architecture selection, implementation, acceptance, publication, deployment, or external effect.

## Evidence classes and exact bindings

- **LWF:** local witnessed fact.
- **ESF:** external fact at an exact selector.
- **UC:** unverified claim.
- **AI:** architectural inference.
- **DC:** design candidate requiring owner selection and validation.
- **NE:** not evaluable from current evidence.

Local selectors are `L-ARE-README` (`cyberAlchemy-v2/development/agent-reasoning-engine/README.md:6-140`, SHA-256 `5434e26b5cf8edee325d89f67da99ed6b9351f6130684bb1c58c94344698f3e0`), `L-ARE-ARCH` (`design/ARCHITECTURE.md:46-162`, `1958758a104c19af9966fd1460097c18fbf919e480da45e5c8dcc0b5f4ffe0de`), `L-CONTEXT` (`context-envelope.mjs:41-243`, `93c98f5451946420fee121053e9861e79ff2e2596256ea2d4b3794b28c40f81e`), `L-LIFECYCLE` (`lifecycle.mjs:14-35`, `f9d2fbc104653fee51eb007ff27189631d1855f8dc09c4cc70a633069ff5b13e`), `L-STATE` (`reasoning-state-runtime/index.mjs:94-135,207-316,543-806`, `22d9e2705782df56cf922edb4bda3893609ea10bae003a6c67c218679e22ccd0`), `L-JOURNAL` (`runtime-journal/index.mjs:94-268`, `e74998467cac6dd04b462d58b73ae98c55ac5412dc7c901d5c06686e92666b37`), `L-GATEWAY` (`gateway.mjs:51-290`, `6ea479d604a4664afab1bcaee76d39249b9052fe197e02c15f58705c8e8532d1`), `L-RPC` (`rpc-client.mjs:180-235`, `9e505e5d7340c2ab6eb931763f307307d6665a57d00280900ba407fe0d6c3ea8`), `L-CONTINUE` (`continuation.mjs:68-145`, `a13910408b1875e0725e1cf7beda739ba27ab73e5554f36c7fb74f0952779368`), `L-ASSESS` (`implementation-recovery-conformance-assessment.candidate.json`, `30a4f2e506557743bb55f46e09c8c9870d434ede7f9d0cf72e28610215d44382`), `L-CANARY` (`2026-09-01-live-app-server-canary-v2-final.json`, `1c93f930be47bc8e4eafd0ac637742a4a63619825a68898da7bb8b782759530f`), and `L-BINDING` (`implementation-binding.v2.json`, `e0efea7a88a2c369ede8cce08f9337039b94a6ae44419ca53959e80d7e55cbaf`).

External selectors are `E-MINI` (`SWE-agent/mini-swe-agent` `v2.4.6`, commit `a83fcae82d2a08f0ee0c688f9d137b3566c097f8`), `E-MINI-BENCH` (`SWE-bench/swe-bench.github.io@193160a463a435d05cf44a1fa9dc5eac832113c3`, `data/leaderboards.json`, mini-swe-agent `2.0.0` result only), `E-BAML` (BoundaryML BAML v0 `0.225.0`, peeled commit `da2a673b52dceea8bc592462ab3b0ba2d965f65e`), and `E-BAML-NIGHTLY` (`baml-language-0.18.1-nightly.20260902.a`, commit `ceccb6f91047270a82500a2905444c975005fc4b`). Exact file/line selectors remain in `research.md`.

## Reconciled evidence and claim ceilings

- **CR-001 [LWF]:** The root Inventory validator is globally blocked. Every Inventory match and no-match is discovery-only. Six versus seven source-coverage errors also shows diagnostic drift.
- **CR-002 [LWF]:** Linux Node v26.8.1 exists at `/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node`. “No Linux Node” described one shell’s PATH; its zero-test output remains non-evidence.
- **CR-003 [LWF, NE]:** Historical evidence records 184 aggregate ARE tests, 37 Codex regressions, 22 continuation-integration tests, 100 warm context-lifecycle iterations with p95 `94.26293 ms`, and one 17-event canary. Fifteen authored wrapper-file digests have drifted; the binding is unaccepted/not assessed. Current conformance and fitness are `not_evaluable`.
- **CR-004 [ESF, NE]:** The pinned leaderboard artifact records 76.8% over 500 SWE-bench Verified instances, 32.896 average calls, and `$0.7539` average cost for mini-swe-agent `2.0.0` with Claude 4.5 Opus high. It establishes neither v2.4.6 quality nor local fitness.
- **CR-005 [UC, NE]:** “Rust/fast,” “starts much faster,” “Ferrari-fast,” “slick,” currently safe, and currently traceability-preserving are killed as fitness claims.
- **CR-006 [LWF, NE]:** `ordering.effect_before_approval: true` is ambiguous and cannot support safety. Future evidence must separately assert `effect_decision_before_runtime_approval` and `runtime_approval_before_effect_execution`.

## Product thesis and architecture hypothesis

- **CR-010 [DC, NE]:** Evaluate whether low overhead can be achieved by extending existing CyberAlchemy-v2/ARE ownership, keeping Codex App Server as transport, treating mini-swe-agent only as loop precedent/benchmark, and testing BAML only as an optional typed parsing benchmark.
- **CR-011 [AI, NE]:** The minimal relation is `query → propose → authority decision → runtime approval → execute → observe → append → continue`. Its local suitability remains `not_evaluable`.
- **CR-012 [DC, NE]:** Architecture hypothesis:

```text
CyberAlchemy-v2 authority records
  -> ARE selected-dependency/context candidate
  -> ARE-owned reasoning frontier
  -> Codex App Server transport
  -> raw response capture
  -> direct parser baseline | BAML 0.225.0 benchmark parser
  -> locally validated action candidate
  -> effect authority decision
  -> capability-bound runtime approval
  -> existing effect-gate/dispatcher seam
  -> participating execution mechanism
  -> authenticated result/observation
  -> ARE-owned checkpoint, completion candidate, continuation
```

No BAML or new coordinator/result-ledger/sandbox component is bound by this diagram.

## Ownership and duplicate-avoidance map

- **CR-020 [LWF]:** CyberAlchemy-v2 owns product meaning, routing, definitions, ontology status, and effect authority. ARE consumes exact records but cannot replace those owners.
- **CR-021 [LWF, NE]:** ARE contains candidate Context Envelope, Reasoning State, actor journal, effect-gate adapter, future-dispatcher, idempotent-attempt-receipt, replay, gateway, and continuation mechanisms. They are **extend-owned candidates**, not adopted or currently conformant components.
- **CR-022 [DC]:** No new owner may be created until this mapping proves a missing obligation and rules out duplication:

| Proposed mechanism | Existing owner/store | Missing obligation | Duplicate ruled out only if |
|---|---|---|---|
| Loop sequencing | ARE runtime orchestration, future dispatcher, actor journal | Closed coding-loop transition contract | It extends the existing seam or an owner proves non-overlap; no second scheduler/state store |
| Durable result ledger | ARE Reasoning State, actor journal, idempotent attempt receipt, replay | Atomic effect/result correlation, acknowledgement, ambiguity reconciliation | Facts merge into ARE or a selected kernel store has one-way authoritative linkage and no second causal ledger |
| Sandbox enforcement | CyberAlchemy effect authority, ARE effect gate/dispatcher, Codex runtime | Isolation, kernel authentication, descriptor-safe filesystem and limits | It enforces existing policy without creating a second permission/authority system |
| Reconnect state | ARE state/checkpoint plus App Server gateway/RPC | Authenticated binding, durable cursor/ack, cross-process reconciliation | App Server owns delivery only; ARE remains semantic-state owner |
| Typed parsing | No accepted BAML owner; ARE owns identities/raw evidence | Pinned API proof and lossless raw-byte/result projection | Parser owns candidate conversion only; no transport, retry, authority, state, receipt, or loop |

- **CR-023 [DC, NE]:** Codex App Server remains a transport candidate only. Authenticated reconnect, ordering, durability, and fitness are `not_evaluable`. BAML owns nothing unless separately selected.
- **CR-024 [DC]:** Partial output, parser success, tool syntax, UI mode, exit zero, and completion text are untrusted candidates, not authority or proof.

## Component disposition

| Component | Disposition | Exact boundary |
|---|---|---|
| ARE route/context/selector lock | Build from owned / extend-owned candidate | Current conformance `not_evaluable`; benchmark invalidation |
| ARE Reasoning State, actor journal, replay | Build from owned / extend-owned candidate | Close durability, locking, branches, authenticated results, compaction |
| ARE runtime journal | Reconcile before extension | Merge causal facts or prove non-overlap; no second causal ledger |
| ARE gateway/RPC | Build from owned / extend-owned candidate | Default-deny auth, persisted delivery sequence/ack, ambiguity reconciliation |
| ARE continuation | Build from owned / extend-owned candidate | Receipt-bound lanes remain candidate; ack/branching missing |
| mini-swe-agent loop/protocols | Pattern and benchmark only | No runtime/library adoption or novelty claim |
| mini-swe state, saves, retries, environments, completion marker | Reject for production binding | Insufficient state, resume, authority, isolation, retry safety |
| BAML v0 modular/generated seam | Benchmark only | Pending pinned API proof, generated/lock closure, notices, mutants, distributions |
| BAML transport/retries/collector/HTTP | Reject from primary path | Duplicate transport/state and hidden attempts |
| BAML Language nightly | Reject/defer | Unstable separate product line |

## Request-to-patch state and typed failures

- **CR-030 [DC, NE]:**

```text
RECEIVED -> AUTHENTICATED -> ROUTED -> CONTEXT_LOCKED
 -> PREFLIGHT_RECORDED -> TURN_STREAMING -> FINAL_BYTES_CAPTURED
 -> CANDIDATE_PARSED -> CANDIDATE_VALIDATED -> ACTION_PROPOSED
 -> EFFECT_AUTHORITY_DECIDED -> AWAITING_RUNTIME_APPROVAL
 -> CAPABILITY_APPROVED -> INTENT_DURABLE -> EFFECT_RUNNING
 -> RESULT_AUTHENTICATED -> OBSERVATION_DURABLE -> POSTIMAGE_VERIFIED
 -> PATCH_CANDIDATE -> CHECKPOINTED -> COMPLETION_CANDIDATE
 -> BLOCKED | COMPLETE | one ELIGIBLE_SUCCESSOR
```

Effect authority precedes and constrains runtime approval; runtime approval precedes effect execution. Typed failures include `AUTHN_FAILED`, `AUTHZ_STALE`, `DELIVERY_AMBIGUOUS`, `EFFECT_AMBIGUOUS`, `PROVENANCE_UNVERIFIED`, `CACHE_INVALID`, `DEPENDENCY_DRIFT`, `SANDBOX_ESCAPE_ATTEMPT`, `RESULT_UNTRUSTED`, `PARTIAL_STREAM_TERMINATED`, `DURABILITY_FAILED`, `SCHEMA_INVALID`, `CAPABILITY_DENIED`, `LIMIT_EXCEEDED`, and `POSTIMAGE_MISMATCH`. Timeout, overload, telemetry loss, durability uncertainty, or incomplete recovery defaults to no effect. Replay performs no call or effect.

## Context, cache, and accounting

- **CR-040 [DC]:** Stable material includes route/profile, definition closure, selected ontology/source, repository policy, system/tool/action/result schemas, canonicalizer, compiler/generator/runtime, transitive lock, provider/model/options, and compact task digests. Volatile material includes frontier, user message, observations, diff/postimage, budgets, approval, and result.
- **CR-041 [DC, NE]:** Candidate cache key domain-separates all stable digests above. Missing or mismatched members yield `CACHE_INVALID`. Authority, approvals, currentness, and effect results are never inferred from hits.
- **CR-042 [DC]:** Record stable/volatile/cached/uncached tokens, output/reasoning tokens, exact request/response bytes, first differing prefix byte, invalidation reason, call ID, cost, timings, parser variant, patch/result digest, and check outcome.

## Typed identity, approval, and evidence

- **CR-050 [DC]:** Every event binds schema, run, branch, runtime epoch, durable sequence, parent/state digests, monotonic time, producer identity/signature, and provenance.
- `action_id = H(domain="ca2-action-v1", run, branch, parent state, base tree, target, operation, canonical arguments, tool/runtime/sandbox digests, authority capability digest)`.
- Capability approval binds authenticated subject/issuer/delegation, operations/resources, limits, tool/runtime/sandbox digests, monotonic bounds, nonce, revocation epoch, usage semantics, action, and signature. Drift yields `AUTHZ_STALE`.
- Tool results are kernel-authenticated and bind attempts, sandbox, monotonic times, exit/output/artifact/resource/result-commit digests. Observations derive only from authenticated results; model summaries are untrusted projections.
- Completion binds exact base/post trees, allowlisted changes, patch, independent validation, residue, blockers, budgets, continuation, and owner acceptance. Runtime success cannot fill owner acceptance.

## Crash, reconnect, sandbox, and postimage

- **CR-060 [DC, NE]:** A participating kernel atomically commits effect and authenticated terminal result under one idempotency transaction before acknowledging. Intent persistence alone is not exactly-once evidence.
- **CR-061 [DC]:** Recovery returns a committed result, authenticates a kernel-known result, or blocks `EFFECT_AMBIGUOUS`; never retry ambiguity automatically.
- **CR-062 [AI, NE]:** “Exactly once” applies only where a participating kernel proves atomic effect/result and duplicate-key return semantics. Everything else is at-most-once dispatch with fail-closed ambiguity.
- **CR-063 [DC, NE]:** Reconnect defaults deny. An unforgeable credential binds session, consumer, lane, runtime epoch, monotonic expiry, nonce, and durable acknowledgement cursor. Event sequences/digests and acks are persisted; gaps yield `DELIVERY_AMBIGUOUS`.
- **CR-070 [DC, NE]:** Candidate enforcement uses descriptor-relative no-follow operations under preopened allowlisted roots; closes inherited descriptors/environment; contains descendants; pins executable/runtime/rootfs/sandbox; drops capabilities; sets limits; defaults egress deny; uses scoped secret handles; fails closed on enforcement/telemetry loss.
- **CR-071 [DC]:** Multi-action output becomes separate capability-bound actions; first effectful failure blocks successors. No transaction, rollback, compensation, or correctness is implied.
- **CR-072 [DC]:** Candidate modes are `observe`, `approve-each`, `approve-bounded-batch`, and separately owner-authorized autonomy. All are default-deny and capability-bound; regex whitelists and “yolo” are killed.
- **CR-073 [DC, NE]:** An independent verifier rehashes exact base/post trees, allowlisted changes, residue, and validation environments. Patch fitness and acceptance remain `not_evaluable`.

## Performance targets, not claims

- **CR-075 [DC, NE]:** Proposed experiment thresholds:

| Surface | p50 | p95 | Required tails |
|---|---:|---:|---|
| Route/profile | 5 ms | 15 ms | p99, p99.9, max |
| Warm context | 25 ms | 100 ms | p99, p99.9, max |
| First feedback | 150 ms | 500 ms | p99, p99.9, max |
| Approved tool-dispatch overhead | 20 ms | 75 ms | p99, p99.9, max |
| Same-process reconnect | 75 ms | 250 ms | p99, p99.9, max |
| Cross-process reconciliation | 500 ms | 2 s | p99, p99.9, max |
| Small task excluding user wait | 20 s | 120 s | p99, p99.9, max |

Historical p95 does not validate current bytes or these thresholds.

## Four-variant benchmark contract

- **CR-080 [DC]:** Compare `mini-v2.4.6`, `current-ARE`, `ARE+BAML-0.225.0`, and `combined-slice` under identical task strata, model/reasoning, prompt bytes, base tree, environment/sandbox/network, retries, tools, and resources. Run at least 30 cold and 100 warm trials per variant/task class.
- **CR-081 [DC]:** Preserve raw samples and p50/p95/p99/p99.9/max for routing, context, initialization, request build, first feedback, transport, parsing, dispatch, tool runtime, reconnect, recovery, verification, and whole task.
- **CR-082 [DC]:** Record exact bytes, token partitions, prefix differences, invalidation reason, calls/cost, trees, patches, checks, telemetry loss, hardware/OS/load, source/compiler/runtime/lock digests, and timestamps.
- **CR-083 [DC]:** Mutants cover cursor replay/gaps, duplicate action, all effect/commit kill points, stream termination, malformed/forged payload, stale capability, unsigned result, dependency/schema/canonicalizer drift, filesystem races, secrets, egress, output/child limits, partial multi-action failure, overload, and telemetry loss.
- **CR-084 [DC, NE]:** Predeclare quality non-inferiority. Current ARE validation must use exact current bytes and absolute Linux Node. Focused PASS cannot imply fitness, admission, or deployment.
- **CR-085 [DC]:** BAML stays benchmark-only until pinned API proof, generated/transitive closure, notices, raw-byte capture, attempt projection, partial-effect exclusion, replay, and predeclared margins pass; selection remains separate.

## Smallest vertical slice and killed ideas

- **CR-100 [DC, NE]:** One temporary fixture repository/branch, existing ARE state owner, persistent App Server consumer, non-network descriptor-relative sandbox, one allowlisted patch, `approve-each`, and independent postimage verifier. Compare direct and BAML parsing; inject crashes before execution, after effect/before observation, and during participating-kernel commit. Success is bounded receipt evidence only.
- **CR-110..117 [DC]:** Kill mini-swe fork/library/novelty; alternate authoritative message/transcript/collector ledgers; BAML binding without proof or duplicate transport/retries; model identities/partial effects/unsigned observations; default-allow/same-UID auth/floating approval/raw host shell/inherited state/unpinned runtime/path escape/yolo/blind retry/non-atomic exactly-once; full ontology scan/process startup/provider-cache freshness/incomplete cache/cursor gaps/replay effects/hidden retries; Inventory absence claims; and all present Ferrari/slick/safety/traceability/cache/dependency/production fitness claims.

## Explicit owner decisions

1. Decide whether a coding-loop obligation remains after mapping ARE’s existing seams.
2. Decide whether atomic effect/result evidence extends ARE or belongs to a separately bounded participating kernel store.
3. Select sandbox enforcement ownership without duplicating authority/effect gating.
4. Authorize or reject the four-variant benchmark, selectors, non-inferiority margin, and targets.
5. Authorize or reject the BAML pinned-source proof and benchmark.
6. Select credentials, revocation, cursor persistence, and reconnect ownership.
7. Select participating-kernel effect classes; other effects retain `EFFECT_AMBIGUOUS`.
8. Select branches, locks, compaction, and durability semantics.
9. Approve capability-bound modes and default-deny policy.
10. Define independent postimage verification and owner-acceptance binding.
11. If a candidate survives, authorize a separate D65 construction binding and current-byte validation.

## Final claim ceiling

The surviving hypothesis is limited to extending owned ARE candidates where ownership exists; retaining mini-swe-agent as pinned loop precedent/benchmark; evaluating BAML as a pinned parser benchmark; and testing missing authentication, durability, effect, sandbox, and verification obligations without duplicate owners. Every architecture, conformance, latency, security, replay, cache, traceability, quality, dependency, and production-fitness claim remains `not_evaluable`.
