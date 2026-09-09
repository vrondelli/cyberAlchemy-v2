# Isolated ARE hook adapter

Implemented and tested an adapter that reuses the existing ARE interaction learning
lifecycle and file-backed reasoning ledger. Seventeen subprocess integration tests
pass. Every invocation is a fresh process: feedback persists and is reused after
restart. These are simulated hook inputs with real local persistence, not a live
desktop or model experiment.

Use an isolated JSON configuration with mode `isolated-prototype`, exact nonblank
`session_id`, `cwd`, `transcript_path`, `participant_ref`, `product_ref`, and a
`log_path` in disposable storage. Invoke `node adapter.mjs CONFIG.json` with one
hook JSON object on stdin. No hook registration or global configuration is provided.
The test harness builds and removes its own temporary configuration and ledger.

The default mode is observe. Exact first-line commands listed in CONTRACT.json
select modes, learn one of two fixed preferences, disable those preferences, or
suppress lessons for one request. Learning binds to the most recent completed
adapter-observed episode. An interrupted latest episode cannot support feedback.
Ordinary natural-language feedback remains ordinary input; it is not interpreted.
Learned preference text is allowlisted, so arbitrary prompt strings are never
copied into developer-context guidance. Original input is retained in the ARE
intent contract. Checks of output quality are not implemented in this adapter.

Prompt reservation, learning transitions, and context emission receipts use the
existing ledger, seals, checkpoints, fsync and writer lock. The adapter rejects
repeated turn IDs, including steering and unknown-delivery retries. A failed
invocation may leave a reserved turn requiring explicit recovery. Lock contention
or corrupt storage emits no guidance. This is conservative recovery, not automatic
retry. Filesystem power-loss behavior and partial-write faults were not injected.

The [official hook contract](https://learn.chatgpt.com/docs/hooks) defines prompt
additionalContext and Stop output. This adapter emits that JSON shape; completion
and interruption return {} and never request another model turn. Failures exit 1
with {} and stderr diagnostics: this withholds ARE context, not a promise that the
host blocks the user's request.

Run from repository root:

```sh
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node --test cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/hook-adapter-v1/adapter.test.mjs
```

Tests cover persistence/restart, learning and reuse, mode off, disable, one-time
exceptions, five attribution/identity failures, duplicates/steering, identical
text in separate turns, interruptions, missing/duplicate completions, quoted and
unknown commands, corrupted storage, writer contention and input bounds.

Configuration and payload matching do not authenticate a root user. No host was
launched, no experimental model call was made, and no existing hooks were changed.
Live invocation and model receipt remain not_evaluable. A native-host canary must
establish attribution, ordering, trust/reload and delivery before this can become
an installation candidate. PROGRESS.json separates that construction frontier
from deferred operational activation. Full gateway control and capability
improvement are not claimed by this adapter.
