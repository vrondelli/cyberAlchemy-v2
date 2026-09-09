# Fitted control-center layout

Status: implementation prototype; not product approval.

## Product construction

Frontier: replace the floating chat and decisions with non-overlapping layout tracks.
Existing interaction definitions and control-center ontology remain the semantic baseline;
this change adds no authority, conversation targeting, or orchestration backend.

1. Add presentation-only layout presets with explicit Apply, pin and layout-only Undo.
2. Allocate active content, decisions and compact chat separate grid rows. Keep chat
   centered and bottom-side space available. Wide canvas remains rectangular.
3. Keep surfaces mounted. Portal the existing decisions panel into a stable upper slot;
   preserve chat state and all approval checks. Hidden decisions cannot receive focus.
4. Bound scrolling and collapse supporting navigation on narrow screens. On short
   screens allow shell scrolling instead of overlapping or clipping the composer.
5. Check type safety, model regressions, production compilation and rendered geometry.

Acceptance: chat/content/decisions rectangles do not intersect; decisions are above
chat; expand allocates space; pin prevents changes; Undo changes presentation only;
navigation does not remount chat or editors or change their target/draft.

## Operational support

Owner: implementing agent. Build/preview verification affects the implementation
prototype only. Existing native candidate stays untouched and may display older UI.
Native benchmark campaign, identity-bound differential evidence and product approval
remain separate pending work. No budgets, frozen receipts or manifests are refreshed.
No causal construction blocker is currently identified. Commit, merge and release
remain deferred owner decisions. Real orchestration focus integration is deferred;
the balanced preset does not claim a new runtime integration.

## Prototype verification — 2026-09-06

- TypeScript no-emit check: passed.
- Layout and ARE bridge tests: 20 passed.
- Vite production frontend compilation: passed (not the manifest-gated native campaign).
- Firefox rendered geometry: 12 combinations across 1440x900, 1024x768 and
  390x844, compact/expanded chat and closed/open decisions: no panel overlap
  and no horizontal document overflow. Escape closes decisions.
- Apply, pin and Undo browser checks passed; chat DOM identity survived layout changes.
- Screenshot: `output/playwright/fitted-layout.png` from repository root.

The browser preview has no Tauri bridge, so chat correctly reports unavailable;
live dispatch, enabled-composer typing, editor selection preservation and native
performance are not proved by these checks. The existing native app was not replaced.
Full-height supporting columns, narrow-screen support tabs and real orchestration
layout integration remain subsequent construction work; current work spans the upper
canvas and the bottom side spaces remain available, not populated with fake panels.
