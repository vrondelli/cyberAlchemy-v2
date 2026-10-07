# F2 gateway Evolution signal intake

Status: bounded local candidate, 2026-09-26. This completes the F2 fixture
boundary in the [work-pack](../INTEGRATION-WORK-PACK.md), not live task
activation, Evolution cycle admission, release, or deployment.

## Implemented boundary

The gateway CLI accepts `--evolution-signal-log` only when the selected
profile explicitly enables `evolution_signals`. Enabled operation requires an
absolute private log path and currently selects the Codex backend; DSH remains
unsupported for this Codex-specific completion provenance. Disabled operation
imports no Evolution intake and opens no signal log. The ready receipt reports
the intake posture without exposing signal contents.

The provider derives one deterministic, content-free candidate from a
completed turn whose semantic evaluation was explicitly blocked. It carries
the completion digest, context-envelope digest and semantic-summary digest as
provenance, but no user prompt, model answer or semantic reason text. The
factory uses Evolution's existing `are.improvement-signal/v1` record; the sink
accepts only that verified schema, appends it to a dedicated Reasoning State
log, seals and fsync-checkpoints it, and deduplicates on restart. A single
writer lock prevents a second local process. A bounded record and conservative
checkpoint reserve prevent new writes at the configured log limit; existing
evidence is never truncated. The sink has no cycle, target, experiment,
upgrade, or self-edit method.

## Evidence

- A loopback Codex process, actual gateway CLI and wrapper produced one
  checkpointed signal after a completed turn, with no external model call.
  The log verified and contained no input text.
- Startup fixtures covered disabled-profile/flag mismatch, enabled-profile
  missing path, ready posture, lock acquisition and lock release.
- Intake fixtures covered disabled, duplicate/restart, second writer, failed
  sink and log-limit behavior.
- `npm test` in the Codex wrapper package: 297 passed, one platform skip,
  zero failures. `npm test` in Evolution runtime: 183 passed, zero failures.
  ARE `doctor --json` returned `PASS`. These are local source/fixture checks,
  not an installed-client or live desktop-task claim.
- The Companion's development distribution selection included both the gateway
  CLI and the new Evolution intake in a 715-file standalone closure. The intake
  imported from that materialized closure. This verifies packaging presence,
  not an installed UI or operator log configuration.

## Open Questions

- Choose and protect the private log path, retention, backups and operator
  ownership before durable live use. This candidate has no physical-erasure
  workflow.
- Add independently verified signal kinds; a blocked semantic evaluation is
  the only current gateway-provided candidate. A successful evaluation is not
  automatically an improvement signal.
- The source-level Companion panel now separates verified candidate signals
  from durable-kernel cycles; see [UI evidence](UI-EVOLUTION-CANDIDATE-SIGNALS.md).
  Packaged visual and source-loss checks remain open.
- Prove exact installed-host and current-task binding separately at G1. This
  intake does not make the desktop chat ARE-controlled.
