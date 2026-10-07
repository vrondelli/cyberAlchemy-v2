# Appearance UX brief

Status: candidate design. Question: **Can this companion fit my workspace?**
Appearance changes only local Companion preferences, never ARE decisions or
runtime configuration.

## User journey

1. Open Appearance from the bottom of the navigation.
2. Preview one of three skins and choose it. The selected skin remains legible
   in normal, warning, and unavailable states.
3. Move the orb by drag or choose a named screen corner with a single click.
   Optionally reset placement if the orb is obscured or off-screen.
4. Close and reopen Companion; the preference persists or the UI clearly says
   that saving failed. The app remains recoverable from the operating system.

## Minimum effective screen

- Three skin choices, each with a meaningful name and visible selected state.
- Orb position presets and Reset position; drag remains an optional shortcut.
- A reduced-motion and high-contrast behavior check before adding visual
  effects. Avoid an always-on-top animation that competes with active work.
- No theme controls that change warning semantics, evidence, or ARE behavior.

The [current UI](../../ui/dashboard.html) has three skins, a draggable
[orb](../../ui/orb.html), four corner presets, and Reset to center. A preset
is stored as a local Companion preference and reapplied against the current
screen's usable area on startup; free drag remains temporary. The skin/placement
error appears beside the controls. The header uses platform-neutral prototype
wording. Native Windows isolated tests verified movement, reset, skin
propagation, and saved skin/corner recovery after process relaunch. An
[isolated WSLg/X11 test](../LINUX-WSLG-POINTER-PIXEL-TEST-2026-09-28.md#saved-placement-regression-and-drag-limit)
also verifies corner/center controls and saved-preset recovery after process
relaunch in the exact Linux development package. Physical-mouse free drag and
normal Linux compositor behavior remain open. The Windows legibility build
checks its high-contrast token and reduced-motion transition behavior; broader
screen-reader and contrast-ratio review is still open. The orb's keyboard
activation remains available after a drag without a trailing pointer click,
and its focus ring fits inside the 84-pixel orb surface. These are
source-level interaction checks, not screen-reader or physical-pointer proof.
W3C [dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
motivates a non-drag pointer alternative.

## State contract

| State | User-facing meaning |
| --- | --- |
| Saved | Selected choice is visibly active and survives reopen. |
| Unsaved | Keep the previous persisted choice and show a local error beside the control. |
| Off-screen | A taskbar/app-menu path and Reset position restore the orb. |
| Unsupported placement | Explain an OS/compositor limit and offer a safe visible fallback. |

## Experience checks

- A user can relocate and recover the orb without dragging.
- Every skin preserves readable labels and a non-color status cue.
- Preference failure does not masquerade as an ARE connection failure.
- Linux and Windows copy names the actual platform or uses neutral wording.

## Open Questions

- Should orb placement persist per monitor, per desktop session, or globally?
- Which OS-specific recovery affordance is reliable on both Windows and Linux
  compositors?
