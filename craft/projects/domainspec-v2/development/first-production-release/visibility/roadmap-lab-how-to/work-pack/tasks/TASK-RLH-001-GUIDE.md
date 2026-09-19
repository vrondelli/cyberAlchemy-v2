# TASK-RLH-001 — author the Roadmap Lab walkthrough

Status: pass — SWU-RLH-001, 2026-07-14  
Layer: L0  
Depends on: approved planning context  
Owner capability: Whisper through Task Session local fallback

## Objective

Create one generic, plain-language guide that a first-time collaborator can follow
against the current standalone Roadmap Lab without oral explanation.

## Inputs

- `../../../WHISPER-HUMAN-REVIEW.md` objective, audience, and claim safeguards.
- `../../../roadmap.template.html` Roadmap Lab controls and event-state card.
- `../shared/context.md` invariants and non-goals.

## Output and write scope

- Create only `../../../HOW-TO-ROADMAP-LAB.md`.
- Write the SWU receipt under `../../runs/SWU-RLH-001/RESULT.md` after validation.

## Implementation detail

The guide must use this order:

1. explain that Roadmap Lab is a review surface, not a roadmap editor;
2. give the server command and URL without claiming the server is permanent;
3. show the reader where the current release state and FPR-01 focus appear;
4. set the participant label and continue the orientation;
5. restate FPR-01 using meaning, dependency, and done evidence;
6. request/copy a source path;
7. select one proposal class and explain when evidence references are required;
8. submit and inspect the event preview;
9. explain that “waiting for storage acknowledgment” means standalone HTML has not
   saved the event;
10. copy the event JSON and bring it to an authorized agent/owner for review;
11. finish with a three-part comprehension check: explain FPR-01, locate a source, and
   produce one reviewable proposal.

Use the visible labels from the page. Introduce no internal term unless the page itself
shows it and the guide immediately explains it.

## Edge cases and failure behavior

- If a control named in the guide is absent, block instead of documenting an imagined
  control.
- If the copy button is not yet present, state that it is delivered by SWU-RLH-002 and
  mark the guide candidate until that predecessor verifies.
- Do not say a submission is saved, accepted, applied, scheduled externally, or release
  evidence.

## Smallest Working Unit — SWU-RLH-001

- Goal: deliver the complete guide above.
- Dependencies: none.
- Done criteria: every step maps to a live/currently planned control; no unexplained
  governance vocabulary; review-only boundary appears before and after submission.
- Acceptance evidence: guide-to-control checklist in the receipt.
- Verification: review all literal control labels with `rg` against
  `roadmap.template.html`, then complete the written comprehension check manually.
- Execution owner: local fallback with Whisper; no subagent.
- Handoff note: read only the named selectors; do not redesign the page or notification.

## Next handoff

On pass, `SWU-RLH-002` may begin. On flag, repair the guide before HTML integration.

Receipt: `../../runs/SWU-RLH-001/RESULT.md`.
