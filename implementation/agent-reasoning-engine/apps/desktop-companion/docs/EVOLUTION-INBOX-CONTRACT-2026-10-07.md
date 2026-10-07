# Evolution candidate-inbox presentation contract

Status: local construction evidence, 2026-10-07; no activation or release.
Parent scope: [whole-UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md), steps 2, 6 and 10.
This is not closure of the integration DAG's F1 feedback-attribution requirement.

## Implemented change

The [frontend](../ui/app.js) now accepts only the closed native candidate-inbox
projection: known schema/source/evidence posture, no authority effect, a valid
log digest and observation timestamp, exact bounded row count, correct truncation
flag, and distinct lowercase candidate digests. Each row contains only kind and
record digest. A verified empty inbox is valid; a total above 16 requires exactly
16 projected rows and an explicit truncation flag. Unknown fields, missing rows,
duplicate rows, null rows, malformed digests and contradictory counts refuse.

The [native bridge](../src-tauri/src/main.rs) enforces the same row/count/digest
rules before projecting the observer result. Neither path reads private feedback
text, opens a writer, invokes a model, admits a cycle or changes the ledger.
The backend observer's verified-checkpoint read remains the source of durable
evidence; frontend validation is contract checking, not independent ledger replay.

On invalid refresh the UI reports Incompatible, withdraws the current candidate
count and clears the projected rows. A subsequent valid refresh recovers; source
failure still reports Unavailable. Cycle-ledger state remains independently read.

## Verification

- Dashboard and gateway-signal observer suites: 72 passed, no failures or skips.
- Focused inbox tests after adding the invalid-refresh/recovery journey: four
  passed, no failures or skips.
- Offline locked native bridge suite: 14 passed, including exact-count, empty,
  bounded/truncated, duplicate, extra-field, null and uppercase-digest negatives.
- No changed file belongs to the three pinned DSH graph source manifests.

Commands:

```sh
node --test implementation/agent-reasoning-engine/apps/desktop-companion/ui/dashboard.test.mjs implementation/agent-reasoning-engine/packages/evolution-runtime/test/gateway-signal-observer.test.mjs
tools/toolchain/run-desktop cargo test --offline --locked --manifest-path implementation/agent-reasoning-engine/apps/desktop-companion/src-tauri/Cargo.toml --bin are-companion
```

## Open Questions

Trusted human correction and exact thread/episode attribution, pending ambiguous
feedback, Codex/DSH parity and the full F1 experience remain unfinished. These
records still represent blocked semantic evaluations, not attributed human
corrections. Fresh native Windows/Linux visual and package qualification, physical
accessibility, installed lifecycle, numerical resource budgets and security-last
work remain in the parent plan. No GUI launch, installer, deployment, live profile
selection or current-chat handover occurred in this slice.
