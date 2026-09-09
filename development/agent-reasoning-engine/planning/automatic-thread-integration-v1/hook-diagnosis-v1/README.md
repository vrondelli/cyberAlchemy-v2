# App-server hook execution diagnosis

Confirmed on installed codex-cli 0.153.1: supplying the outer CLI
--dangerously-bypass-hook-trust flag did not enable the thread's hook. Passing
`bypass_hook_trust: true` inside `thread/start.config` did. Setting it to false
again prevented execution. Three controlled loopback-provider checks reproduced
this distinction. The provider immediately returns HTTP 400 and never runs a
model. No credentials or external inference service were used.

The original failure was the canary runner's configuration boundary, not evidence
that the ARE adapter itself failed. Startup-only probes were inconclusive and
are retained separately; the decisive probe exercised UserPromptSubmit through
native turn/start against the rejecting local provider.

| Configuration | Native marker callback |
| --- | --- |
| Outer CLI flag only | absent |
| Thread config true | present |
| Thread config false | absent |

THREAD-START-CONFIG.json contains the corrected request configuration.
RUNNER-FIX.patch shows the precise runner correction without altering the failed
run's evidence. The [upstream configuration loader](https://github.com/openai/codex/blob/main/codex-rs/app-server/src/config_manager.rs)
also handles this request override explicitly; local behavior tests are the
version-specific evidence.

This bypass applies to all enabled hooks affecting the selected thread, not just
ARE. Use it only in the already-authorized isolated test environment after checking
that the complete discovered hook list equals the exact canary allowlist. Do not
apply it to the current conversation or normal Codex configuration. No persistent
trust status was edited.

Product-construction frontier: resume the real ARE canary with corrected thread
configuration. One of the four authorized Luna turns has been used; three remain.
A fresh three-turn run can first enable scoped application and request a short
explanation, then learn the examples preference, then verify retained guidance
and the hook-only provenance digest. No paid retry was performed in this diagnosis.
The complete adapter flow and model delivery remain unverified by these probes.

Operational support owner: host integrator. Affected stage: isolated host canary.
The configuration cause is resolved; normal desktop trust, reload, installation,
product approval and activation remain deferred. Original candidates and the failed
run remain unchanged. Diagnostic hosts were stopped.

Reproduce the decisive check with `python3 probe-loopback.py` from this directory.
It creates three disposable, credential-free host environments and uses only a
loopback provider. RESULT.json records callback identities and configurations.
