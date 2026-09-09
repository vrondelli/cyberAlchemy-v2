# Native Luna canary: integration failed on first turn

The user authorized an isolated app-server test with ChatGPT login and Luna,
limited to four turns. One turn was submitted and completed. The app-server
reported ChatGPT authentication and gpt-5.6-luna. No API key was supplied.

Luna answered the cache question. Host telemetry reported 9,095 input tokens
(including 5,888 cached input tokens), 58 output tokens and 9,153 total tokens.
This is token usage, not a measured account credit deduction. Coordinating chat
usage is separate. No claim of a general cost improvement follows.

Three isolated project hooks were discovered: UserPromptSubmit, Stop and
Interrupt. The first prompt and completion produced no callback receipt and no
ARE ledger. Thus the native adapter-invocation check FAILS; retained guidance and
model context delivery are not_evaluable. No second turn or retry was submitted.

Preflight first exposed missing project trust. A temporary Codex configuration
then trusted only the disposable project and referenced the existing ChatGPT
credential file by symlink. Hook discovery succeeded but still reported the exact
hook definitions as untrusted. The one-invocation bypass flag was supplied; it did
not establish execution through this app-server path. Its propagation and the
actual hook execution gate require diagnosis. Do not treat this as proof that all
app-server hooks are unsupported or that the adapter implementation failed.

The host process was stopped and the temporary authentication symlink removed.
Normal Codex configuration, production hooks, prior prototypes and this parent
conversation were not modified. The isolated test transcript remains in the
disposable workspace named in WORKSPACE.json; no credentials are copied into this
report. run.py refuses to run again once TURN-COUNT.json exists.

Product-construction frontier: diagnose app-server hook trust/execution using
metadata or a model-free probe before proposing another inference run. Operational
support owner: host integrator; affected stage: isolated native testing. Current
conversation installation, trust changes, product approval and activation remain
deferred. This failure does not block unrelated prototype construction.

RESULT.json contains the outcome and usage; EVENTS.json holds the selected native
completion and usage receipts; HOOK-DISCOVERY.json records the discovered hooks.
