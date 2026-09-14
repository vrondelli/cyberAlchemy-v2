# Incident Control solid 3D construction proof

Status: local candidate, 2026-09-13. Authority effect: none.
Owner direction: “we should do solid 3d and free walking,” accepting the preceding
one-room proof recommendation. Scope: Incident Control presentation and its local
validation. Policy Archive and Transfer Annex retain their illustrated renderer.

## Construction boundary

This owner-directed native change carries forward the stage distinctions in
[construction-binding-candidate.json](construction-binding-candidate.json).
The existing candidate definitions, capability, business ontology, DomainSpec
source and generated graph remain their respective source/evidence surfaces.
The presentation adapter does not change station IDs, puzzle rules, rewards,
progress, or save format. The candidate binding's historical digests are not
refreshed or claimed to bind this work. System ontology admission and independent
conformance remain unresolved; local tests do not grant those effects.

| Field | Current boundary |
| --- | --- |
| Product frontier | One walkable room with solid machines, architecture, and door |
| Runnable product work | Native Three.js geometry, framing, collision checks, browser traversal |
| Exact affected stage | Local presentation implementation and product evidence |
| Operational tasks and owners | Owner review of composition; release/admission belongs to repository owner |
| Causal blockers | None for this authorized local prototype |
| Deferred operational residue | Release, publication, deployment and admission; no such effects performed |
| Ontology runtime dependencies | None; authored runtime model supplies existing game data |

## Implementation

[solid-incident.mjs](web/solid-incident.mjs) constructs actual three-dimensional
meshes with a consistent metallic/rough material palette. Desk drawers, folder,
lamp, terminal keyboards, printer paper, rack modules, wall cladding, ceiling
fixtures and door panels have depth. Only surface typography uses canvas textures.
There are no room-image murals, camera-facing prop images, floor halos or floating
state spheres in Incident Control. Machine status updates existing emissive lamps.

The room is 14 × 12 units with a 4.2-unit ceiling and a 1.65-unit eye height.
A presentation-only copy supplies compact station placements and safe approach
anchors without mutating the authored content. The 60-degree desktop vertical
field of view adapts on narrow screens. Free WASD/arrow movement, drag-to-look,
optional pointer lock and click-to-approach all use the existing collision and
interaction adapter. The archive doorway is visible from the overview.

[three-room.js](web/three-room.js) selects the solid room and binds picking,
inspection framing, labels, state lamps, resource disposal and navigation.
Static shadows update on room construction rather than every walking frame.

## Validation

- `npm run check`: production build and 22 Node tests pass.
- [Geometry/navigation test](tests/solid-incident.test.mjs): physical depth,
  floor contact, collision-envelope coverage, all-pairs inspection paths at
  desktop/portrait aspects, and original-content immutability.
- [Browser visual/movement check](tests/browser-solid-incident.mjs): actual inputs
  and screenshots, without injected camera or game state.
- [Full puzzle browser check](tests/browser-playability.mjs): existing seven-puzzle
  journey including real reload and inventory dragging.

Both browser checks passed in headless Chromium with software WebGL. The movement
check verified strafe/forward/look inputs, desk approach, physical door, room
re-entry, portrait layout and zero page errors. The complete journey passed all
seven puzzles, real browser reload, inventory dragging, residue preservation and
the honest ending with zero page errors. The final lighting/shadow build was also
opened and visually inspected in an overview screenshot.

Run-local evidence: `/tmp/btg-solid-check.log`, `/tmp/btg-solid-browser.log`,
`/tmp/btg-solid-playthrough.log`, `/tmp/bug-ticket-solid/`, and the final overview
`/tmp/btg-solid-overview.png`. These temporary files are not durable release
artifacts. Windows browser launch succeeded; Windows frame rate and subjective
visual acceptance have not been measured. Browser screenshots expose remaining
prototype limitations: sparse surfaces and intrusive persistent labels on narrow
screens.

## Folder interaction repair — 2026-09-13

Owner report: “now the action should be in the folder, i click inspect and see
nothing.” Within the same local presentation construction boundary, the red folder
now owns the desk's pickable action mesh and label anchor. The desk remains solid
collision geometry. Inspect is now a button, and stays available near the folder.
Inspection opens a readable folder view containing the existing authored ticket
and receipt evidence, including on repeat visits and saved games. Escape, Close
and Return to room restore room focus. Puzzle rules and save schema are unchanged.

`npm run check` passed all 22 tests. The focused
[browser regression](tests/browser-folder.mjs) passed actual folder mesh clicks,
visible document content, Escape, Inspect-button reopen, reload/reopen without
duplicate rewards, portrait close and subsequent station interaction. Screenshot
review confirmed the documents are readable. Run-local evidence is
`/tmp/btg-folder-check.log`, `/tmp/btg-folder-browser.log` and
`/tmp/btg-folder-open.png`. Earlier browser journeys were updated to close the
folder before continuing; the full seven-puzzle run was not repeated for this
focused change.

## Open Questions

- Does the owner accept this solid geometric style and room composition before
  applying it to the other two rooms?
- How much surface wear/detail should the final art pass add?
- Are persistent station labels desirable, or should visual focus reveal them?
- What frame-time target and Windows hardware should define performance acceptance?
