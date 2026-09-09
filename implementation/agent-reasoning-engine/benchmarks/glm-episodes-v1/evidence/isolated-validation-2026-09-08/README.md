# Disposable worker validation result

**6/6 retained proposals passed public validation in disposable containers**, with zero validation child timeouts. The forced-timeout canary confirmed cleanup, and all seven containers were verified absent afterward. Five new lifecycle tests passed. No model calls, new proposals or code changes to the retained repairs occurred.

The evaluated set uses the two corrective proposals from [ready feedback](../ready-feedback-2026-09-08/README.md) and the four other historical oracle-correct proposals. This includes the archive replacement and unchanged long-context proposal that previously encountered public execution blocks. All 40 public checks passed in this separate replay. Original failed run scores remain intact; this is not a new end-to-end model benchmark.

## Implementation

The new owned-container wrapper reuses the existing container sandbox configuration and restrictions. It adds an exact random container name, bounded CLI output, forced removal in a finally block, and a separate exact-name absence check. A timed-out Docker client alone does not guarantee the workload stopped; cleanup must confirm the owned container is gone. Failed cleanup makes the wrapper result fail. Denied commands create no container and trigger no removal. No unrelated container is selected.

Workers use the already-installed digest-pinned Node 26.8.1 image without pulling. Each receives only its candidate, public cases/plan, validator and worker program in a read-only input directory. Networking is disabled; the root filesystem is read-only; the process runs unprivileged with dropped capabilities, 512 MiB memory limit, two-CPU quota and 64-PID limit. The outer limit is 120 seconds plus bounded cleanup. Public checks retain five-second child/two-minute batch limits. Filesystem/network isolation and resource limits do **not** reserve CPU/RAM or eliminate shared-host contention.

The wrapper and standalone worker runner are candidate components. They are not yet wired into the default coding-agent or feedback stage. This run proves the minimal container path and cleanup behavior worked for this sample; it does not establish that containers caused the improvement over earlier loaded-host runs.

## Evidence

[Manifest](run/manifest.json), [six-proposal aggregate](run/result.json), [timeout canary](run/timeout-canary.json), [five lifecycle tests](tests.tap), [construction plan](PLAN.md), and per-proposal start/result records retain exact candidate/plan bindings. All five enumerated executable source entries matched after the run. Temporary input directories were removed after container cleanup. Previous test counts are not pooled into this new five-test result. CAV2-D65 candidate construction, authority effect none.

## Open Questions

The next bounded integration is to use this worker as the feedback stage's validation backend, then run a separately frozen evaluation. Does it remain reliable under sustained pressure? Resource quotas are caps rather than capacity reservations; an isolated host may still be required. No production activation, fresh-task reliability or model continuity claim follows from this replay.
