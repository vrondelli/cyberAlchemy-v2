# Host recycling integration

Product construction: resolve actual host controls; wire a strict generation gate;
implement capsule staging into a fresh isolated host context; verify exact readback
without generation. Missing enforcement controls remain an explicit blocker.
Definitions: StagedContext is fresh host storage with a verified state capsule,
not an active successor. ConfiguredThreshold is configuration evidence, not proof
of the effective native trigger. UsageNotification is historical usage, not a
pre-dispatch bound. GenerationGate refuses unproved context safety.
Scaffold: HostCapabilityEvidence bounds Gate; Capsule stages Context; Receipt
proves Persistence; GenerationAdmission requires ProviderStepControl.
Product prototype: real fresh-context preparation and truthful dispatch refusal.
Business benefit unmeasured. Contract: HOST-CAPABILITIES.json and
PROVIDER-GATE-SPEC.json. Implementation: host-adapter.mjs. Tests: adapter.test.mjs
and credential-free host-check.mjs. Approval and activation not asserted.

Runnable: gate and fresh-context staging. Causal live enforcement blocker:
installed 0.153.1 public protocol has no identified synchronous provider-step gate
or pre-dispatch bounded occupancy event. Do not claim direct enforcement from a
turn/start wrapper, PreCompact notification, configured number or total tokens.
Required host-side interface is recorded explicitly in PROVIDER-GATE-SPEC.json.

Operational owner: host integrator. Stage: runtime enforcement blocked on host
control primitive; native generation canary and activation deferred. Zero model
calls. No login, normal host settings, parent task or installed binary changes.
Fresh context staging is independent construction and remains runnable.
