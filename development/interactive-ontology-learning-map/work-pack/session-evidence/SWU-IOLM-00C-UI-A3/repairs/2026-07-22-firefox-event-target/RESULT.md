# Task Session Result — A3 Firefox event-target repair

## Result

- Unit: `SWU-IOLM-00C-UI-A3` repair iteration
- Defect: `B-IOLM-A3-FIREFOX-EVENT-TARGET`
- Result: `PASS`
- Output: fresh `iolm-interactive-viewer/v1`
- Repair receipt: `iolm-interactive-viewer/a3-firefox-event-target-repair-v1`
- Selection authority: `iolm-ui-a4-a3-repair-refresh-applied/v1`
- Changed implementation: `assets/app.mjs`, `assets/selection.mjs`, and `tests/selection-inspector.test.mjs`

## Repair

Delegated selection now resolves an element target directly or falls back to a
text node's `parentElement` before calling `closest("[data-stable-id]")`. Targets
without a usable element return `null` and leave viewer state unchanged. The
browser-facing listener and the pure regression use the same helper.

## Validation

| Check | Result |
| --- | --- |
| Focused selection/inspector suite | `PASS`, 6/6 tests |
| All A1–A3 Node suites | `PASS`, 50/50 tests |
| A1 Python server regression | `PASS`, 8/8 tests |
| `serve_demo.py --check` | `PASS`, 19 fixed routes and no listener opened |
| Loopback A3 asset smoke | `PASS`, 9/9 GET routes; HEAD 200, unknown 404, POST 405 |
| Changed-module syntax | `PASS` |
| Exact A3 inventory | `PASS`, 11/11 files |
| Scoped diff hygiene | `PASS` |

## Boundary and residue

- A4's failed Firefox run and lifecycle evidence were not changed or overwritten.
- This Task Session did not drive a rendered browser and does not claim browser acceptance, accessibility, usability, or manual success.
- The candidate posture, `authority_effect: none`, and all six eligibility exclusions remain unchanged.
- A4 remains blocked until a separate planning refresh selects a new replay from this fresh viewer receipt.
- `SWU-IOLM-00C-B`, `SWU-IOLM-00C-C`, `G-DSV2-SG`, DomainSpec, and public Arcanum are unaffected.

## Next probable route

Invoke Refresh may synchronize this A3 repair pass and select one new A4 replay,
after explicit authorization. That replay must use a new run directory and must
not overwrite `20260722T160251Z-firefox`.
