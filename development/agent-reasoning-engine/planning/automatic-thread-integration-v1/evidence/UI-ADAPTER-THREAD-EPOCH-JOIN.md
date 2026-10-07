# Companion adapter and Reasoning State epoch join

Status: bounded read-only UI candidate, 2026-09-26. No installed-app result,
current desktop-task handover, or product approval is claimed.

The Companion's Adapters and Threads readings already carry a gateway
`runtimeEpochId`, but they were refreshed independently. The UI now accepts a
current adapter observation only with a bounded epoch identifier. When a
current thread observation and a current adapter observation share that epoch,
the Threads source label says so. When one read crosses a gateway restart, the
thread rows are downgraded to **Last seen / Source changed**; the dashboard
does not present the two readings as one current gateway picture. If the
adapter observation is absent or stale, Threads can still display its own
bounded process-local observation, explicitly marked as not correlated to the
adapter link. This join never infers host-task ownership.

The dashboard unit suite passed 17/17, including both refresh orders around
an epoch change. The network-isolated Chromium browser fixture passed 22
checks, including the adapter, backend-thread, and decision journey, narrow
layout, and no uncaught page errors. That browser fixture is synthetic; it
does not prove the installed Windows or Linux app, live gateway socket, or
current desktop chat.

## Claim ceiling

Epoch equality is a process-source correlation for two fresh read projections,
not a durable session identity, authenticated gateway proof, backend binary
identity, or proof that ARE controls a host task. The client may still observe
a gateway change between reads; a subsequent refresh downgrades the stale
view. Adapter capability labels remain adapter-declared, not exact-host proof.

## Open Questions

- Should the UI expose a compact shared gateway epoch indicator for users who
  need to inspect source changes without opening the evidence identifiers?
- What exact authenticated host-task binding and handover evidence would be
  required before a future UI may label any desktop task ARE-managed?
