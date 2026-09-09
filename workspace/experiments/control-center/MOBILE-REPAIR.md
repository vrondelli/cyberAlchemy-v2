# Mobile dock repair

Construction candidate; CA2-ROUTE-IMPLEMENT. No authority effect.

## Plan recorded before code

Current product-construction frontier: fix the reproduced 390×844 composer
occlusion. Preserve the existing IC-STATE/SYS-VIEW integration boundary; no
ontology or definition bytes change. Source evidence is the previous
output/playwright/INTEGRATION-VALIDATION.md failure.

1. Scope control-center CSS to the shell's 720px navigation breakpoint. Subtract
   its 62px bottom rail and safe-area inset from available frame height.
2. Allocate a bounded mobile dock, keeping chat composer fixed within it while
   transcript and decisions scroll independently. Do not hide approval controls.
3. Give transcript and decision scroll areas keyboard focus without autofocus,
   component remounting, permission changes or automatic decision actions.
4. Rebuild outside production dist. Run targeted tests/typecheck and Playwright
   desktop, 390px, 320px and breakpoint checks. Use a refusing browser-only
   transport fixture for unsent drafts and synthetic pending approvals.
5. Preserve the failing evidence and append a new report/screenshots.

Exact implementation files: runtime/src/features/control-center/control-center.css
and runtime/src/features/chat/ChatSurface.tsx. Evidence and CLI check live under
experiments/control-center/output/playwright/. All unrelated dirty bytes remain.

Operational support: current agent owns temporary build/server/browser, affecting
only prototype verification. No operational blocker prevents this repair.
Deferred construction/test: native Tauri, full suite and qualified differential
campaign; no budgets change. Deferred operational work: desktop restart, product
approval, reconciliation, commit and delivery remain separate decisions.
