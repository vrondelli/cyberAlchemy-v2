# Persistent conversation dock — bounded result

2026-09-05. Local implementation candidate, not product-approved.

Implemented the first integration-plan slice in the real Workspace shell:
opt-in Control center, retained chat alongside the selected existing surface,
Expand/Compact, and scoped desktop/narrow layout rules. Existing chat bridge,
receipts and decision handlers are unchanged. No duplicate ChatSurface is added.

Executed from workspace/runtime:

- `npx vitest run src/features/control-center/layout.test.ts src/features/chat/ChatSurface.test.ts`: 14 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npx vite build --outDir /tmp/cav2-control-center-integration-final-20260905`: passed.
- Scoped `git diff --check`: passed.

Tests cover the visibility policy and existing chat helpers, not mounted DOM
continuity. Browser layout, keyboard navigation, draft/reading-position retention,
narrow-screen decision accessibility, native Tauri runtime, Rust and full frontend
suite, WDIO smoke, qualified cold-session performance and differential evidence:
not evaluated in this turn. No performance improvement or budget PASS is claimed.

The running desktop was not restarted, and its production dist was not replaced.
Next construction check: exercise this shell in the browser and Tauri, including
draft retention and approval accessibility, before extending multi-panel layouts.
Successor delegation, target adapters, pins/proposals and attention aggregation
remain deferred construction. Product approval and delivery decisions remain open.
