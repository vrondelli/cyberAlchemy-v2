# Recycling host integration: staging works; enforcement blocked

The installed codex-cli 0.153.1 public experimental protocol was inspected from
freshly generated bindings. No synchronous callback before every provider request
and before the host compaction decision was identified. Token usage supplies
historical last/total usage and a model window, not a freshly bound pre-dispatch
occupancy upper bound. Provider capability output describes tools, not a dispatch
gate. See HOST-CAPABILITIES.json and copied generated protocol evidence.

Official configuration documentation identifies model_auto_compact_token_limit
and its total/body_after_prefix scope. Reading that setting alone does not prove
the effective model-default threshold or control internal continuation.
https://learn.chatgpt.com/docs/config-file/config-reference

## Implemented and verified

The adapter reads configured threshold data without promoting it to enforcement
proof. Its strict client exposes only isolated setup/read/injection calls and
blocks generation or unknown methods before the underlying RPC client is called.
This is deliberate refusal under missing controls, not successful autonomous
execution with guaranteed no compaction.

Fresh context staging now uses real thread/start, thread/inject_items and
thread/read calls. It verifies a new identity and empty turn history, validates
the capsule digest, requires the injection acknowledgement, and rejects foreign
or concurrently populated readback. It returns staged status, not cutover or
generation permission. It does not modify the parent task.

The credential-free native test created distinct source and fresh contexts,
persisted the exact capsule in the fresh rollout, and verified that the source
raw marker was absent. Six generation/compaction entry points were rejected
before transport. The local provider rejected inference by construction and
received zero requests. Two host checks ran, before and after acknowledgement
and readback hardening; both hosts stopped and owned temporary data was removed.

## Required work to complete the user's target

PROVIDER-GATE-SPEC.json states the missing host interface. It must run before the
native compaction decision and before every provider request, include effective
threshold/scope and current upper-bound evidence, and wait for a request-bound
single-use decision. It must cover tool continuation, steering, retries and
internal loops. A turn/start wrapper or asynchronous interrupt cannot substitute
for that boundary.

The current adapter cannot establish that interface by adding a boolean, setting
a guessed threshold, waiting for PreCompact, or disabling ordinary generation
and calling it success. Live no-compaction enforcement remains BLOCKED. Completion
requires a host-loop modification or an ARE-owned provider-step loop, followed by
integration and model tests. The stock ChatGPT-login host remains unchanged.

The capsule fixture proves exact supplied-state transfer and absence of one old
raw marker; it does not prove full semantic task-state extraction or migration.
Crash-safe live cutover also remains open.

Reproduce local tests: node --test --test-reporter=tap adapter.test.mjs
Reproduce isolated zero-model host check: node host-check.mjs
TEST-RECEIPT.json records source hashes and separates local PASS from live BLOCKED.

Product construction: staging and refusal tested; host control primitive blocked.
Operational owner: host integrator; affected stages: live validation/activation,
deferred until the blocker is resolved. No model calls, credentials, product
approval, publication or activation occurred in this work.
