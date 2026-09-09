# Mobile control-center repair: browser witness

2026-09-05. Local construction candidate; no product approval or authority effect.
Supersedes the narrow-layout failure for these tested bytes only. The previous
INTEGRATION-VALIDATION.md and its failing screenshots remain historical evidence.

## Changes

Mobile dock uses the same 720px breakpoint as the navigation rail, subtracts
62px plus safe-area inset, and separates the fixed composer from scrolling
transcript and decisions. Compact controls prevent 320px wrapping. Both scroll
regions have keyboard focus targets; no autofocus or approval-handler changes.

## Executed evidence

- Targeted Vitest: 14 tests passed; TypeScript no-emit check passed.
- Final production Vite build passed to `/tmp/cav2-mobile-repair-20260905`;
  production dist and running desktop unchanged.
- Playwright CLI with Firefox: five viewport checks passed, zero console errors.
  Firefox warns that longtask observation is unsupported; no performance claim.
- Same composer DOM and unsent draft retained through Ontology, Essays,
  Foundation, Expand/Compact and mode Off/On.
- Synthetic pending approval: keyboard focus reached Approve once and hit-testing
  confirmed it was not covered. No approval button was activated. Exactly one
  fixture chat_connect; zero chat_send. Other fixture calls are refused, including
  Essays principal_evidence. This is not a real ARE/Tauri connection.
- No horizontal document overflow at any tested viewport. Send button hit-test
  and composer-versus-decision bounds checks passed.

| Viewport | Input top–bottom | Send bottom | Bottom rail top |
| --- | --- | --- | --- |
| 1440×1000 | 863–936 | 983 | vertical rail |
| 390×844 | 574–628 | 675 | 782 |
| 320×568 | 298–352 | 399 | 506 |
| 710×844 | 574–628 | 675 | 782 |
| 720×844 | 574–628 | 675 | 782 |

Screenshots `mobile-repair-final-390.png` and `mobile-repair-final-320.png`
were visually inspected. At 320×568 the artifact canvas yields nearly all its
space to chat; this is a constrained fallback, not full multi-panel readability.
The earlier `mobile-repair-*.png` files capture the intermediate iteration.

## Reproduction and selected identity

Serve the built directory on 127.0.0.1:4199. Open a fresh Playwright CLI Firefox
session and pass the complete `mobile-repair-check.js` function to `run-code`.
The check injects only a browser-local, refusing transport fixture, never native
IPC. Screenshots are written relative to the experiment directory.

SHA-256:

- control-center.css: `cb627a4a6c462ce59360727cb9edb7d9a2dea3f8ee2f4d773ad3c6116e4d39af`
- ChatSurface.tsx: `ec5c0cd37de84ccaf5a580c3f54bb87905a9243f080035070925fd18b03e56ad`
- mobile-repair-check.js: `0bd8b2b758a0779cd7aa8b0c2b179fcf91f7352d38347e6ede4362d5c9359bab`

Selected-file hashes are not a complete frozen-product differential bundle.

## Next frontier and residue

Next product-test work: native Tauri validation of the dock and real receipt
continuity. Full Rust/frontend/WDIO and host-qualified repeated cold-session
campaign remain pending, with all budgets unchanged. Physical mobile browser,
software-keyboard, nonzero safe-area inset, and screen-reader behavior remain
not evaluated. Product approval remains separate from passing these checks.

Operational support: temporary test browser/server belong to this run; no desktop
restart, commit, merge, publication, or release. No operational blocker prevents
the next independent construction/test task.
