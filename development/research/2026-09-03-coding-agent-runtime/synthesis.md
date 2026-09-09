# Coding-Agent Runtime Candidate

**Dispatch:** `2026-09-03-cyberalchemy-are-coding-agent-runtime`  
**Synthesizer:** Wiener, Norbert  
**Status:** research synthesis candidate only  
**Authority ceiling:** no architecture selection, implementation, acceptance, publication, deployment, or external-effect authority.

## Evidence labels and bindings

- **LWF** — local witnessed fact.
- **ESF** — external source fact at an exact version.
- **UC** — unverified claim.
- **AI** — architectural inference.
- **DC** — design candidate requiring owner selection and validation.

Exact local selectors:

- **L-ARE-README:** `cyberAlchemy-v2/development/agent-reasoning-engine/README.md:6-140`, SHA-256 `5434e26b5cf8edee325d89f67da99ed6b9351f6130684bb1c58c94344698f3e0`.
- **L-ARE-ARCH:** `.../design/ARCHITECTURE.md:46-162`, SHA-256 `1958758a104c19af9966fd1460097c18fbf919e480da45e5c8dcc0b5f4ffe0de`.
- **L-CONTEXT:** `.../context-basis-runtime/src/context-envelope.mjs:41-243`, SHA-256 `93c98f5451946420fee121053e9861e79ff2e2596256ea2d4b3794b28c40f81e`.
- **L-LIFECYCLE:** `.../context-basis-runtime/src/lifecycle.mjs:14-35`, SHA-256 `f9d2fbc104653fee51eb007ff27189631d1855f8dc09c4cc70a633069ff5b13e`.
- **L-STATE:** `.../reasoning-state-runtime/index.mjs:94-135,207-316,543-806`, SHA-256 `22d9e2705782df56cf922edb4bda3893609ea10bae003a6c67c218679e22ccd0`.
- **L-JOURNAL:** `.../runtime-journal/index.mjs:94-268`, SHA-256 `e74998467cac6dd04b462d58b73ae98c55ac5412dc7c901d5c06686e92666b37`.
- **L-GATEWAY:** `.../codex-app-server-wrapper/src/gateway.mjs:51-290`, SHA-256 `6ea479d604a4664afab1bcaee76d39249b9052fe197e02c15f58705c8e8532d1`.
- **L-RPC:** `.../codex-app-server-wrapper/src/rpc-client.mjs:180-235`, SHA-256 `9e505e5d7340c2ab6eb931763f307307d6665a57d00280900ba407fe0d6c3ea8`.
- **L-CONTINUE:** `.../codex-app-server-wrapper/src/continuation.mjs:68-145`, SHA-256 `a13910408b1875e0725e1cf7beda739ba27ab73e5554f36c7fb74f0952779368`.
- **L-ASSESS:** `.../reasoning-state-runtime/evidence/implementation-recovery-conformance-assessment.candidate.json`, SHA-256 `30a4f2e506557743bb55f46e09c8c9870d434ede7f9d0cf72e28610215d44382`.
- **L-CANARY:** `.../codex-integration/receipts/2026-09-01-live-app-server-canary-v2-final.json`, SHA-256 `1c93f930be47bc8e4eafd0ac637742a4a63619825a68898da7bb8b782759530f`.
- **L-BINDING:** `.../codex-integration/implementation-binding.v2.json`, SHA-256 `e0efea7a88a2c369ede8cce08f9337039b94a6ae44419ca53959e80d7e55cbaf`.

Exact external selectors:

- **E-MINI:** `SWE-agent/mini-swe-agent` `v2.4.6`, commit `a83fcae82d2a08f0ee0c688f9d137b3566c097f8`; especially `default.py:88-190`, `__init__.py:11-80`, `actions_toolcall.py:11-76`, `local.py:24-30,72-92`, `interactive.py:124-181`, `retry.py:19-24`, `pyproject.toml:6-47`.
- **E-MINI-BENCH:** SWE-bench site commit `193160a463a435d05cf44a1fa9dc5eac832113c3`, mini-swe-agent `2.0.0` result only.
- **E-BAML:** BoundaryML BAML v0 `0.225.0`, peeled commit `da2a673b52dceea8bc592462ab3b0ba2d965f65e`; especially `engine/Cargo.toml:1-26,191-196`, `generator.rs:13-37`, `jsonish/README.md:5-24`, `retry_policy.rs:31-60`, `fallback.rs:68-94`, `events.rs:15-33,100-164`, `storage.rs:31-51,76-93`.
- **E-BAML-NIGHTLY:** `baml-language-0.18.1-nightly.20260902.a`, repository commit `ceccb6f91047270a82500a2905444c975005fc4b`; evaluated only to reject/defer conflation with BAML v0.

## Reconciled evidence disagreements

- **CR-001 [LWF]:** The root Inventory validator is globally blocked. All Inventory matches and no-matches in the three reports are discovery-only. The BAML report’s phrase “successful no-match, not degraded” is rejected as a claim-closing characterization. The packet’s six coverage errors and the later observed seven errors also show diagnostic drift.
- **CR-002 [LWF]:** Linux Node v26.8.1 exists at `/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node`. The ARE explorer’s “no Linux Node installed” statement is narrowed to “Node was unavailable through that shell’s PATH”; its zero-test run remains non-evidence.
- **CR-003 [LWF]:** Historical local evidence includes 184 aggregate ARE package tests, 37 Codex regressions, 22 continuation-integration tests, a 100-iteration warm context-lifecycle p95 of 94.263 ms, and one 17-event live canary. Current wrapper bytes have drifted from the historical receipt in 15 authored files; therefore those results remain historical candidate evidence, not current conformance. [L-ASSESS, L-CANARY, L-BINDING]
- **CR-004 [ESF]:** mini-swe-agent’s published benchmark supports one `2.0.0`/model/config result—76.8% over 500 SWE-bench Verified instances—not v2.4.6 performance, startup latency, or suitability. [E-MINI-BENCH]
- **CR-005 [UC]:** BAML’s generic “Rust/fast” and mini-swe-agent’s “starts much faster” claims lack applicable p50/p95 distributions and remain unverified.

## Product thesis and architecture

- **CR-010 [DC]:** Build a thin, replayable coordinator around existing ARE and Codex App Server ownership: deterministic local routing/context before the model turn, one typed candidate boundary after model output, and one effect kernel after authority approval. Speed comes from a persistent transport, immutable-digest caches, and a tiny state machine—not from suppressing provenance or collapsing owners. [L-ARE-README, L-ARE-ARCH, L-GATEWAY, E-MINI, E-BAML]
- **CR-011 [AI]:** The irreducible loop is `query → propose → authorize → execute → observe → append → continue`. mini-swe-agent demonstrates that this topology can stay small, while its state, effect, resume, and sandbox semantics show what must not be imported. [E-MINI]
- **CR-012 [DC]:** Candidate component map:

```text
CyberAlchemy-v2
  owns meaning, route, permission class, owner decisions
        |
        v exact records/selectors/digests
ARE Context Basis ---------> immutable Context Envelope
ARE Reasoning State -------> event frontier/checkpoint/replay
        |
        v
Persistent Codex App Server gateway
  thread/start, turn/start, streaming, approvals, reconnect
        |
        v captured raw response bytes
BAML v0 modular request/parse seam
  typed candidate payload only
        |
        v strict local validation
Minimal coordinator
  proposes one typed action
        |
        v immutable approval bound to action digest
Execution kernel
  sandboxed effect + idempotency/result ledger
        |
        v
ARE observation/checkpoint/completion/continuation
```

## Ownership and trust boundaries

- **CR-020 [LWF]:** CyberAlchemy-v2 owns product meaning, routing, authority, definitions, and ontology status; ARE may consume exact selected records but cannot admit or promote them. [L-ARE-README, L-ARE-ARCH]
- **CR-021 [LWF]:** ARE owns inspectable Context Envelopes, append-only Reasoning State, provenance, receipts, checkpoints, and continuation constraints. App Server thread state and BAML tracing do not replace it. [L-CONTEXT, L-STATE, L-JOURNAL, E-BAML]
- **CR-022 [DC]:** A separately named minimal coordinator owns only loop sequencing. It receives authoritative inputs from ARE/CyberAlchemy and cannot become a second state, routing, or authority owner. [L-ARE-ARCH, E-MINI]
- **CR-023 [DC]:** Codex App Server owns model transport, stream ordering, and transport reconnect; BAML owns typed model request construction/final parsing; the execution kernel owns isolation and effect idempotency. No owner may infer another owner’s decision. [L-GATEWAY, L-RPC, E-BAML]
- **CR-024 [DC]:** Partial model output is untrusted UX data. Parse success, tool-call syntax, command exit zero, user-interface mode, and model completion text confer no authority or correctness.

## Adopt / adapt / benchmark / reject

| Component | Decision | Exact binding |
|---|---|---|
| ARE route, selected-dependency lock, immutable Context Envelope | Adopt/extend | Preserve exact local owner; add immutable-digest cache and measured invalidation. [L-CONTEXT, L-LIFECYCLE] |
| ARE Reasoning State | Adopt/extend | Add cross-process lock, compaction, branch/fork semantics, and durable effect-result linkage. [L-STATE] |
| ARE in-memory completion journal | Adapt | Merge durable causal facts into Reasoning State or establish one explicit durable owner; reject two ledgers. [L-JOURNAL] |
| ARE persistent gateway | Adopt/extend | Per-consumer session; add authenticated cursor reconnect and ambiguous-outcome reconciliation. [L-GATEWAY, L-RPC] |
| ARE continuation | Adopt/extend | Preserve receipt-bound dual lanes; add acknowledgement and branch semantics. [L-CONTINUE] |
| mini-swe coordinator topology | Adapt pattern only | Re-express `query/authorize/execute/observe`; do not import the runtime. [E-MINI `v2.4.6`] |
| mini-swe release/results | Benchmark | Pinned behavioral and latency baseline; keep v2.0.0 benchmark claims distinct from v2.4.6 code. [E-MINI, E-MINI-BENCH] |
| mini-swe messages, whole-file trajectories, magic completion, provider retries, production environments | Reject | They lack authoritative append-only state, durable resume, safe retry, and sufficient isolation. [E-MINI] |
| BAML v0 schema/generated client | Adapt conditionally | Typed candidate payload only, with identities outside model output. [E-BAML `0.225.0`] |
| BAML modular request/parse API and partial streaming | Benchmark | Preserve App Server transport; partials are display-only. [E-BAML `0.225.0`] |
| BAML provider transport, retries/fallbacks, collector as ledger, HTTP preview | Reject for primary path | Duplicates transport/state or obscures attempts. [E-BAML `0.225.0`] |
| New BAML Language nightly | Reject/defer | Separate unstable line without compatibility evidence. [E-BAML-NIGHTLY] |

## Minimal request-to-patch state machine

- **CR-030 [DC]:**

```text
RECEIVED
 -> ROUTED
 -> CONTEXT_LOCKED
 -> PREFLIGHT_RECORDED
 -> TURN_STREAMING
 -> CANDIDATE_PARSED
 -> ACTION_PROPOSED
 -> AWAITING_APPROVAL | DENIED
 -> INTENT_DURABLE
 -> EFFECT_RUNNING
 -> OBSERVATION_DURABLE
 -> PATCH_CANDIDATE
 -> CHECKPOINTED
 -> COMPLETION_CANDIDATE
 -> BLOCKED | COMPLETE | one ELIGIBLE_SUCCESSOR
```

Any schema failure, dependency drift, stale approval, sandbox denial, ambiguous effect outcome, or missing receipt enters a typed blocked state. Replay makes no model, network, or tool calls.

## Context, cache, and token accounting

- **CR-040 [DC]:** Stable prefix: route/profile digest; canonical definition closure; selected ontology selectors and source digests; system/tool schemas; BAML schema/compiler version; repository policy; compact task statement. Volatile suffix: current frontier; recent observations; active diff summary; remaining budgets; current approval/result; user message.
- **CR-041 [DC]:** Cache only compiled catalogs and envelope material under a key such as `hash(route_digest, definition_closure_digest, selector_set_digest, source_digests, tool_schema_digest, baml_schema_digest)`. Never cache authority/gate outcomes or treat provider cache hits as freshness evidence. [L-CONTEXT, L-LIFECYCLE]
- **CR-042 [DC]:** Every model attempt records stable-prefix tokens, volatile-suffix tokens, cached-input tokens, uncached-input tokens, output/reasoning tokens, exact request-byte digest, provider/model/options, cost, and first differing byte from the prior request. The task summary reports totals plus cache-hit ratio and tokens per accepted patch hunk.

## Typed envelopes

- **CR-050 [DC]:** Common header: `schema_version, run_id, branch_id, event_id, sequence, parent_event_digest, state_digest, occurred_at, producer, provenance`.
- **Model action:** `action_id = hash(run_id, branch_id, parent_state_digest, normalized_action, authority_digest)` plus `operation_kind, arguments, cwd_selector, input_state_digest, requested_capability, timeout_ms`.
- **Approval:** `approval_id, action_id, action_digest, authority_record_digest, approver, scope, expiry, decision`; approval cannot float to changed action bytes.
- **Tool result:** `action_id, attempt_id, sandbox_digest, started_at, ended_at, exit_kind, exit_code, stdout_digest, stderr_digest, truncation, artifact_digests`.
- **Observation:** `observation_id, action_id, tool_result_digest, normalized_summary, source_provenance, completeness`.
- **Checkpoint:** `frontier_digest, durable_sequence, context_digest, outstanding_action_ids, result-ledger_digest, fsync_receipt`.
- **Completion:** `candidate_id, final_state_digest, patch_digest, validation_receipts, unresolved_blockers, budget_summary, continuation_eligibility`; it is a candidate until the proper owner accepts it.

## Crash, reconnect, and exactly-once semantics

- **CR-060 [DC]:** Before dispatch, append and fsync `ActionIntent(action_id)`. The execution kernel accepts `action_id` as an idempotency key and durably stores the terminal result before acknowledging. Repeated dispatch returns that result.
- **CR-061 [DC]:** After restart: intent with result → replay result; intent without known result → query the kernel ledger; still unknown → `AMBIGUOUS_EFFECT`, block human-visible, never retry automatically.
- **CR-062 [AI]:** Exactly-once observable behavior is achievable only for tools participating in the idempotency/result protocol. Otherwise the honest guarantee is at-most-once dispatch plus explicit ambiguous-outcome handling.
- **CR-063 [DC]:** Gateway reconnect uses authenticated `session_id + last_acknowledged_event_id + stream_cursor`. It may resume transport delivery, but cannot invent semantic state. Cross-process recovery rebuilds from ARE checkpoints and reconciles in-flight App Server and effect IDs. [L-GATEWAY, L-RPC]

## Sandbox, effects, and interaction

- **CR-070 [DC]:** The effect envelope pins rootfs/image digest, repository root and cwd, writable mounts, UID/GID, capabilities, seccomp profile, network/egress policy, secret-handle allowlist, CPU/memory/time/output limits, and artifact-export rules. Raw host execution and inherited full environments are forbidden in the production profile. [E-MINI]
- **CR-071 [DC]:** Multi-action outputs are split into individually identified actions. Sequential execution is explicit; the first effectful failure blocks successors. No transaction or compensation is implied.
- **CR-072 [DC]:** Human modes are: `observe` (no effects), `approve-each` (default effectful mode), `approve-bounded-batch` (immutable allowlist and budget), and `owner-authorized-autonomous` (only within an exact preaccepted envelope). “Yolo” is rejected. Runtime permission prompts mediate execution but do not replace CyberAlchemy authority.

## Candidate latency budgets

These are **DC targets**, not measured performance:

| Surface | p50 | p95 | Measurement boundary |
|---|---:|---:|---|
| Route/profile selection | 5 ms | 15 ms | request received → exact route |
| Context lock/projection, warm | 25 ms | 100 ms | route → immutable envelope |
| First visible feedback | 150 ms | 500 ms | request → local status/first stream |
| Tool dispatch overhead | 20 ms | 75 ms | approved durable intent → kernel start |
| Same-process reconnect | 75 ms | 250 ms | authenticated reconnect → next event |
| Cross-process recovery | 500 ms | 2 s | restart → reconciled frontier |
| End-to-end small task, excluding user wait | 20 s | 120 s | request → patch candidate + focused check |

The historical 94.263 ms context p95 is encouraging but cannot validate the current bytes. [L-ASSESS]

## Benchmark and acceptance plan

- **CR-080 [DC]:** Four BAML paths with identical mock/provider inputs: direct App Server; BAML high-level; modular non-streaming; modular streaming. Measure cold init and warm p50/p95/p99 request build, first partial, chunk parse, final parse, allocations, request bytes, tokens, prefix-diff position, and replay equality. [E-BAML]
- **CR-081 [DC]:** Compare upstream mini-swe v2.4.6 with the candidate coordinator using pinned model, dataset revision, prompts, retries, containers, and network policy. Report resolved rate, empty patches, failures, calls, cost, wall time, and p50/p95 runtime overhead. Do not compare against the v2.0.0 result as if it were v2.4.6. [E-MINI, E-MINI-BENCH]
- **CR-082 [DC]:** Required crash/security mutants: kill after effect/before append; duplicate dispatch; malformed/truncated/forged model payload; missing terminal stream event; reconnect cursor replay; `cwd=../../`; symlink escape; secret dump; network beacon; oversized output; child timeout; forged environment result; two actions with partial success; dependency/schema version drift.
- **CR-083 [DC]:** Kill the BAML seam if it changes stable-prefix bytes unexpectedly, cannot preserve raw response bytes, permits partial-driven effects, cannot emit unambiguous ARE events for every attempt, fails same-version deterministic replay, or exceeds context/tool overhead budgets.
- **CR-084 [DC]:** Acceptance requires rerunning current local regressions with the absolute Linux Node binary, cleanly binding exact current bytes, and independently validating replay, denial, crash, and benchmark receipts. A PASS cannot imply admission or deployment.

## Threat model and dependency risk

- **CR-090 [AI]:** Principal threats are prompt-to-shell escalation, path/symlink escape, secret or network exfiltration, forged observations, stale/replayed approval, duplicate effects after crash, partial-stream dispatch, transcript/state divergence, cache poisoning, dependency/provider drift, output exhaustion, and cross-session impersonation.
- **CR-091 [AI]:** Building the coordinator, envelopes, state/result ledger, and sandbox policy is justified because these are ownership-critical and small. Rebuilding model parsing/compiler tooling is not justified unless BAML fails its spike.
- **CR-092 [AI]:** Depending on mini-swe-agent would import broad replaceable ownership and range-based dependencies; adapting its four-stage relation is lower risk. Depending on BAML v0 introduces compiler/runtime/version and SAP-coercion risk but may avoid a bespoke structured-output stack. Pin compiler, generated artifacts, schema digests, and transitive lockfiles.

## Smallest vertical slice

- **CR-100 [DC]:** One repository, one branch, one persistent App Server consumer, one non-network sandbox, and one tool operation: apply a patch to an allowlisted temporary fixture.
- One immutable ARE Context Envelope and append-only state.
- One BAML v0 `0.225.0` modular `NextActionCandidate` schema; IDs remain entirely in the outer envelope.
- `approve-each` only.
- Durable action intent/result ledger with crash injection.
- Focused validation, checkpoint, and completion candidate.
- Success means deterministic replay with zero effects, no duplicate effect after injected crash, byte-bound approval, reconnect without event loss, and measured budgets—not production readiness.

## Killed ideas

- **CR-110 [DC]:** No wholesale mini-swe fork or production dependency.
- **CR-111 [DC]:** No `messages` array, App Server transcript, BAML collector, or second journal as authoritative state.
- **CR-112 [DC]:** No high-level BAML provider transport, retries/fallbacks, or BAML-over-HTTP in the initial hot path.
- **CR-113 [DC]:** No model-echoed IDs as receipts; no partial parse may trigger an effect.
- **CR-114 [DC]:** No raw local shell, inherited environment, unpinned container, regex whitelist, “yolo,” magic completion string, or blind retry after ambiguity.
- **CR-115 [DC]:** No full ontology scans, process startup per turn, or provider cache hit on the synchronous preflight path.
- **CR-116 [DC]:** No architecture claim derived from Inventory absence.

## Explicit owner decisions required

1. Select or reject the product thesis and assign the minimal coordinator owner.
2. Decide whether the durable completion journal merges into ARE Reasoning State.
3. Authorize the BAML v0 `0.225.0` modular spike and its kill thresholds.
4. Select the exactly-once contract: participating tools only, with fail-closed ambiguity elsewhere.
5. Select the sandbox kernel/profile and whether any networked tool class exists.
6. Define branch/fork/merge semantics and multi-writer locking.
7. Approve the human modes and default effect policy.
8. Approve latency/token budgets and benchmark hardware/model/dataset selectors.
9. Decide the admissible dependency posture: vendored/pinned BAML artifacts versus a bespoke parser.
10. Authorize a D65 construction binding and current-byte validation separately if this candidate is selected.

## Claim ceiling

The evidence supports a coherent candidate: retain CyberAlchemy-v2 authority, ARE state/context/continuation, and Codex App Server transport; adapt only mini-swe-agent’s tiny loop relation; benchmark BAML v0 as an outer typed candidate boundary; add a dedicated sandbox and idempotent result ledger. It does not establish current conformance, architecture adoption, performance fitness, exactly-once coverage for arbitrary tools, or implementation authority.
