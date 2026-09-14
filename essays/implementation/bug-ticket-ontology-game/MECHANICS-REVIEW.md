# Mechanics review — 2026-09-13

Status: owner-directed local candidate. Authority effect: none.
Request: “so lets review all mechanics one by one and see if we can improve it or
fix it in the game.” This records the first complete mechanics review; it is not
player approval or a claim that every design issue is resolved.

## Construction boundary

The [solid-room construction boundary](SOLID-3D.md#construction-boundary) and
[historical candidate chain](construction-binding-candidate.json) continue to
apply. Exact scope is game presentation, input handling, readable puzzle feedback,
address formatting, and local tests. Puzzle answers, rewards, story, score costs,
autosave version and room content remain unchanged. No ontology selector is needed.

| Planning field | Current state |
| --- | --- |
| Product frontier | Complete observable interaction journey through the existing mechanics |
| Runnable product work | Controls, station responses, puzzle affordances and browser regression |
| Affected construction stage | Local implementation and product evidence |
| Operational tasks and owners | Owner reviews play experience and later design choices |
| Causal blockers | None for the authorized repairs |
| Deferred operational residue | Release, external deployment, admission and conformance; no such effects performed |

## Sequential review

| Mechanic | Finding | Repair or retained behavior | Larger design consideration |
| --- | --- | --- | --- |
| 1. Free walking and inspection | Guided keyboard targeting was special-cased to the nearby folder, even without a relevant viewing direction. The room rendered continuously behind modal puzzles. | Nearby interaction now selects a station in front of the player; explicit hover remains available. Room rendering pauses while a modal is open. Collision and click-to-walk remain. | All stations still need physical sub-object targets as they become solid models. |
| 2. Folder and inventory | A selected artifact turned inspection into use, but the folder UI still claimed its documents were collected. Item descriptions relied on hover. | Item-use mismatch shows its actual result; folder collection appears only after inspection. Inventory descriptions are readable on the cards. | Consider separate Read and Use actions if implicit selection remains confusing. |
| 3. Independent witnesses | Printer, quality index and scanner results were easy to miss in the off-screen log. | Every non-puzzle station response now opens a readable inspection panel with owned evidence cards. Locked interactions visibly explain why they cannot proceed. | Animate physical printing/scanning later. |
| 4. Event Ledger address | Natural witness format such as LP-2041 / 09:17 / R4 was rejected; typed input disappeared on hint redraw. | Normalize equivalent subject/window/machine formatting, preserve input on edit and across redraw/reload. Other identifiers remain wrong. | Keep deduction difficulty separate from punctuation. |
| 5. Word-rain replay | Incomplete capture could be submitted; first success closed the panel before the required reload. | Require five selections before sealing; show saved-capture/reload panel. Reopening the reboot-pending ledger also exposes a reload button. Real browser reload and two ordered captures remain mandatory. | Falling words still test selection/order, not an actual event-processing service. Review pacing and decoy readability with players. |
| 6. Missing-input circuit | Generic submit label and empty-selection penalties obscured the action. | “Connect input,” selected-state accessibility, disabled submission until a choice exists, visible result/reward on success. | Directly plug a cable into the 3D rack in a later interaction pass. |
| 7. Policy catalogue | Three dials and wraparound work; completion feedback was off-screen. | “Open drawer” and visible source/scope/owner rewards. Draft retention remains. | Animate a physical drawer; keep the scope distinction intact. |
| 8. Meaning rings | Reordering works, but the generic submit action and silent completion weakened feedback. | “Align meanings” and visible reward explanations. Wrong orders remain retryable. | The fixed sequence is a teaching abstraction; review whether it could imply automatic transitions between meanings. |
| 9. Relation sockets | Empty frames could be submitted; placed artifacts had no removal action. Descriptions were hard to consult. | “Assemble candidate,” completion gating, click a filled socket without a selection to remove its artifact, descriptions on the palette. Existing uniqueness/replacement behavior remains. | Dragging onto physical 3D sockets remains future work. |
| 10. Owner terminal | A click said it needed an artifact only in the log; successful submission also lacked a visible response. | Readable response with an explicit Send candidate relation action when eligible. Inventory dragging still works. Accepted seal and contract are shown. | This is a simulated owner decision, not a real external approval. |
| 11. Transfer residue | The submit button did nothing except tell players to click an artifact. | Remove that redundant button; artifact choice remains the action. Success presents the preserved residue record. | Make the unanswered transfer question legible through physical evidence as well as text. |
| 12. Exit chain and endings | Missing records were reported only as a count after a penalized attempt. One exploratory override click ended the game. | Named collected/missing checklist; validate only when records are present. Override expands a consequence explanation before an explicit “End with False green” button. Honest ending still requires residue. | The runtime receipt is produced by the authored game progression; it is not independent proof of a production system. |
| 13. Hints and autosave | Exhausted hints looked like another available hint. Input persistence was inconsistent for the replay address. | New hint cost is visible, exhausted hints disabled, address editing saved. Existing puzzle drafts and reload checkpoint preserved. | Decide whether assistance should reduce integrity at all. Broader malformed-save/storage-failure recovery is not covered by this pass. |

## Evidence

Source rules: [game-content.json](content/game-content.json),
[game-logic.mjs](web/game-logic.mjs), [game.js](web/game.js),
[three-room.js](web/three-room.js).

- `npm run check`: production build and 23 Node tests pass, including accepted
  address variants and rejection of incorrect subjects/machines.
- [Full browser journey](tests/browser-playability.mjs): updated for explicit
  response dismissal; verifies visible witnesses, address retention across hint,
  real reload, circuit gating, slot removal, all seven puzzles, inventory drag,
  missing-record checklist and both endings using real input.
- [Focused review browser test](tests/browser-mechanics-review.mjs): selected-item
  folder mismatch, locked response, witness reading, portrait close and return.
- Existing movement, folder and fallback checks remain separate bounded evidence.
  Tests use known answers; they do not demonstrate unaided puzzle discoverability.

The full browser journey passed all seven puzzles, the real reload, new control
checks and both endings with no JavaScript errors. The focused response/portrait
check also passed. A movement rerun uses observed camera displacement rather than
an 800 ms elapsed-time assertion, which failed under concurrent software rendering.
The movement rerun passed strafe, forward movement, drag-look, desk approach,
physical door, room re-entry and portrait layout with no page errors. Its log is
`/tmp/btg-review-movement.log`. Windows frame rate remains unmeasured.

Run-local logs:
`/tmp/btg-review-check.log`, `/tmp/btg-review-browser.log`,
`/tmp/btg-review-focused.log`. Screenshot directory:
`/tmp/bug-ticket-mechanics/`.

## Open Questions

1. Should reading an inventory artifact be separate from selecting it for use?
2. Should hints be free, with integrity reserved for unsupported claims?
3. Does the word-rain/reboot mechanic communicate its purpose without instruction?
4. Does the meaning sequence incorrectly suggest one state automatically implies another?
5. Which physical interaction should replace its panel next: circuit cable, catalogue
   drawer, meaning rings or relation sockets?
6. Are persistent labels useful after the first visit, especially on portrait screens?
7. What malformed-save and browser storage failure behavior should the supported build promise?
