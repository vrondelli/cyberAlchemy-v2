# TASK-RLH-002 — integrate the quick guide and standalone copy path

Status: pass — SWU-RLH-002 and SWU-RLH-003, 2026-07-14  
Layer: L1  
Depends on: SWU-RLH-001 pass receipt  
Owner capability: Task Session, using Whisper for visible copy

## Objective

Make the approved walkthrough discoverable inside Roadmap Lab and let a standalone user
copy the exact validated event already rendered in the preview.

## Inputs

- `../../../HOW-TO-ROADMAP-LAB.md`.
- `../../../roadmap.template.html` Roadmap Lab section, `[data-copy]` handler,
  `postLabMessage`, and event preview.
- existing Roadmap Lab unit and Playwright tests.

## Outputs and write scope

- `../../../roadmap.template.html`.
- `../../../roadmap.html` only through `tools/build-roadmap.py`.
- focused files under `../../../tests/`.
- receipts under `../../runs/SWU-RLH-002/` and `../../runs/SWU-RLH-003/`.

Do not edit the event schema, builder normalization, Canvas adapter, or generated HTML by
hand.

## Implementation detail

### SWU-RLH-002 — exact event copy

1. Add a `Copy event JSON` button beside the existing retry control.
2. Point `data-copy` to `roadmap-lab-last-event` so the existing generic handler copies
   the preview's `textContent`.
3. Do not construct, transform, reserialize, save, or acknowledge a second message.
4. Keep the status text explicit that Canvas storage acknowledgment is still pending.
5. In Playwright, submit a proposal, parse the preview, activate copy, and prove the
   copied/target text equals the captured emitted message.

Failure modes: missing Clipboard API keeps the existing `Select text` fallback; empty
preview must not claim success; a payload mismatch blocks.

### SWU-RLH-003 — embedded quick guide

1. Add a concise, keyboard-reachable `How to use Roadmap Lab` disclosure before the two
   interaction columns.
2. Summarize the walkthrough as: understand, restate, inspect a source, propose, copy.
3. Link to `HOW-TO-ROADMAP-LAB.md` for the complete guide.
4. State visibly that standalone submit does not save or apply a proposal.
5. Keep one visible thought per step and avoid new jargon.
6. Verify desktop/mobile layout and keyboard expansion/focus.

Failure modes: hiding the review-only boundary, promising persistence, obscuring the
focus node, or making the Lab unusable without expanding the guide blocks.

## Smallest Working Units

### SWU-RLH-002

- Dependencies: SWU-RLH-001.
- Done criteria: copy uses the existing preview and existing copy handler; message schema
  and post behavior are unchanged.
- Acceptance evidence: emitted/preview/copied equality in browser test.
- Verification: builder generation/check, unit suite, focused Playwright test.
- Execution owner: local fallback via Task Session.
- Handoff note: use the existing `[data-copy]` contract; do not add persistence logic.

### SWU-RLH-003

- Dependencies: SWU-RLH-002.
- Done criteria: embedded guide matches full guide and all promised controls exist.
- Acceptance evidence: keyboard/mobile browser proof plus copy review.
- Verification: builder generation/check, unit suite, full Roadmap Lab Playwright suite.
- Execution owner: local fallback with Whisper through Task Session.
- Handoff note: preserve the current Lab forms and progressive-disclosure hierarchy.

## Next handoff

On both receipts passing, `SWU-RLH-004` may create the notification.

Receipts: `../../runs/SWU-RLH-002/RESULT.md` and
`../../runs/SWU-RLH-003/RESULT.md`.
