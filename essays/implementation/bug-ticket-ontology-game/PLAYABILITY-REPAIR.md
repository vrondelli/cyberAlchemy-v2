# Playability repair

Status: local implementation candidate; local checks passed  
Authority effect: none  
User scope: movement, incorrectly sized objects, and actions in the existing game.

## Observed defects and changes

- Click-to-walk used a straight destination vector, then attempted axis sliding
  when it met a machine. It now plans and follows a continuously checked path
  around the collision envelopes.
- Inspection points could put the camera less than a metre from the front image.
  Approach distance now accounts for the artwork size and camera field of view.
- Images with different transparent margins were stretched into arbitrary plane
  sizes. Rendering now excludes those margins and fits the opaque image with its
  native aspect ratio inside a bounded physical size. Source assets are untouched.
- Nearly transparent placeholder meshes and whole transparent image rectangles
  could receive clicks. Placeholders were removed; machine hits now check image
  alpha. Visible world labels share the same walk-and-interact handler.
- Global movement/Tab handling interfered with page and dialog controls. Movement
  is now scoped to a focused room canvas and clears on blur or puzzle entry.
- Puzzle feedback appeared behind the modal, artifact sockets showed icons alone,
  and the word-capture alternatives changed layout on focus. Feedback and named
  artifacts now appear in the workbench; capture alternatives remain visible.
- Dropped artifacts now approach a distant machine using the same path and
  action handler as clicking; invalid drop targets produce visible feedback.
- Room changes return the scene to view after inventory interactions. The room
  clips overflow without becoming an internally scrollable focus container.
- A visible reload action exposes the existing required replay checkpoint. Room
  exits and a Room view reset remain reachable without discovering invisible UI.

## Construction boundary

The source chain is the existing candidate
[construction binding](construction-binding-candidate.json): candidate definitions,
Product Capability and business ontology; authored DomainSpec development source;
deterministic compiled graph; local implementation and test evidence. Its missing
admitted system ontology and independent conformance remain unresolved. This
repair does not refresh or promote the old binding or its frozen digests.

| Lane | Current state / owner | Effect on this repair |
| --- | --- | --- |
| Product frontier | Game implementation: controls, rendering and UI | Implement and verify the existing BUG-4821 case. |
| Runnable product work | Local Node tests and browser playthrough | No new dependency, content or authority prerequisite. |
| Operational support | Local preview process, maintained in this task | Rebuild the same preview after successful checks. |
| Causal blockers | No unrelated operational task blocks this local repair | Failed movement or action checks block completion. |
| Deferred residue | Repository/product owners: Goals admission, independent conformance, product acceptance and release | No promotion, registration, publication or deployment follows from local tests. |

## Verification

- `npm run check`: production build passed; 21/21 Node tests passed, including
  routes between every machine and door and physical-envelope/aspect-ratio checks.
- Chromium: full visible-control mouse playthrough reached the honest ending
  with 7/7 puzzles, including the real reload checkpoint and residue preservation.
- Direct desk-artwork click: successful walk and inspection. Losing canvas focus
  cancelled an in-progress walk. Dragging an artifact to the distant owner
  terminal walked there and performed the expected action.
- 390 × 844 touch emulation with reduced motion: desk and scanner inspection,
  room exits, and no horizontal page overflow passed. This is a bounded touch
  smoke check, not a full touch playthrough.
- Forced no-WebGL fallback: visible inspection controls and exits worked in all
  three rooms, with no JavaScript page errors.
- No JavaScript page errors occurred in the successful desktop playthrough.

Run-local logs and screenshots for this session are under
`/tmp/btg-repair-browser-final.log` and `/tmp/bug-ticket-playability/`;
these temporary paths are not durable evidence bindings.

The [browser regression](tests/browser-playability.mjs) uses visible mouse
controls and real walking. It reads autosave only for assertions; no hidden
station shortcuts or direct state injection are used.

## Open Questions

- Does the repaired interaction meet the user's expectations on their Windows
  browser? Local automation cannot establish that acceptance.
- Full touch-only completion, immersive pointer-lock completion, and additional
  browser engines still require their own observations.
- The art remains illustrated cutouts in 3D space. Volumetric machine models are
  a separate art/renderer decision, not an outcome claimed by this repair.
