# Independent first-pass repair recheck

Date: 2026-09-18. Implementation read-only. Evidence: after-metrics.json, after-extra-metrics.json, after-residual.json, after-mobile-cinema.png, after-short-nav.png, after-mobile-next.png.

## Fixed

- 1366×650 expanded scene 5: dialog height and scrollHeight both650; Next y570–618 and Close y14–56 visible.
- 390×844 expanded scene: Close remains visible at y10 even when reading further; scene navigation stays at bottom of reading area.
- 640×360 mobile menu: bounded y71–359 with overflow:auto; focus brings final link into y286–332. No document scrolling needed.
- Film iframe removed when opening full reader (network stub used; lifecycle tested).
- No JavaScript errors in exercised paths; Escape and focus restoration retained.

## Residuals reported for second pass

1. Scene selection tests only viewer.top. If viewer top is on screen but its bottom is clipped, it does not reposition: frame y471–751 at1366×650 in recorded sequence. Check bottom clipping as well when scene can fit; align viewer below sticky header following explicit choice.
2. Inner reading scroll persists across scene changes. At280×650, scroll scene5 to bottom then Previous: scene4 caption.scrollTop92, title y191–260 while caption viewport begins245. Reset `.cinema-caption.scrollTop` after replacing scene prose and when opening viewer.

## Open Questions

Parent audit owns final validation after the two remaining repairs. Actual YouTube audio remains outside deterministic lifecycle checks. Natural scrolling in long-form/mobile text should remain available, with persistent controls.

## Second-pass verification

Both residuals passed the same reproduction after rebuild. At1366×650, selecting chapter1 shows its frame at y216–496, fully within viewport. At280×650, moving from scrolled chapter5 to chapter4 resets caption.scrollTop to0; title now y283–352 inside reading area beginning245. The after metrics and narrow screenshot were refreshed with this passing result. No additional implementation changes were made by this reviewer.
