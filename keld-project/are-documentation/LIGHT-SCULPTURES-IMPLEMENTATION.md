# Light Sculptures implementation

Implemented locally on 2026-09-18 following the audited plan and the user's `implement`
instruction. Preview: http://localhost:4193/. No deployment is included.

## Changes

- Eleven transparent WebP sculptures share a typed semantic registry. Six new illustrations
  complete context, progress, permissions, finish/ask, language and connections. Existing
  KELD artwork supplies goal, action, evidence, comparison and refinement.
- The final hero scene has eight labelled documentation links and a repeating conceptual
  signal sequence, including permitted action and blocked/ask paths. Earlier chapters remain
  seekable. Short screens use four columns; narrow screens use two.
- A React two-cycle explanation, capability illustrations, documentation links and canvas
  nodes use the same family. Canvas geometry, ports and saved workspaces are preserved.
- Session pause is shared across hero, explanation and canvas. Replay preserves pause.
  Reduced motion provides a static component map; hidden/offscreen scenes suspend activity.
- Missing images retain correct glyphs and labels. Unknown IDs use a neutral fallback.
  Low canvas zoom uses simple glyphs, with a component picker as an alternative.

## Validation

- Production build, TypeScript and reviewed-document projection pass. All route JS/CSS
  download budgets pass. Eleven built images match manifest hashes: 241.3 KiB / 300 KiB.
- Twelve existing workspace, persistence and download-budget unit tests pass.
- `scripts/sculptures-proof.mjs` passes looping, pause/replay/navigation, reduced motion,
  image fallback, hidden/offscreen suspension and seven responsive sizes from 320×640 to
  1366×768, including 640×360 landscape. Targets fit without overlap; captions remain clear.
- Existing `scripts/canvas-docs-proof.mjs` passes document opening, dragging, reading,
  zoom, persistence, navigation, mobile and storage-recovery checks without browser errors.
- Screenshots reviewed on the dark hero and light canvas, including the narrow layout.
- Six canvas performance scenarios pass with motion enabled: one, three, five and all nine
  documents on desktop, five and nine on mobile. Scrolling produces zero App/card renders
  or Markdown parses, at most three storage writes, and no viewport changes or remounts.
  One repeat per scenario; evidence: `evidence/sculptures/canvas-performance.json`.

Evidence: `evidence/sculptures/interaction.json`, `assets.json`, `frame-timing.json`,
screenshots in the same directory, and `evidence/canvas-docs/results.json`.
Generated-source provenance and prompts: [SCULPTURE-PROMPTS.json](SCULPTURE-PROMPTS.json).
Reproduce with `npm run build`, then `node scripts/sculptures-proof.mjs`.

## Audit decisions

Final components are real links, outside decorative hidden artwork. Pause lasts for the
browser session. Light artwork is darkened locally; labels are not dimmed with entire nodes.
Image bytes have their own build gate. Capability illustrations remain static while reading.
Responsive checks found and corrected pointer interception, overlapping hit areas and
short-screen caption collisions before completion.

## Open Questions

Owner creative acceptance remains subjective. Headless WSL frame timing is informational,
not a physical-device performance guarantee or full accessibility certification. Deployment
and any future asset-budget changes remain separate work. Original research and audit:
[plan](LIGHT-SCULPTURES-PLAN.md), [audit](LIGHT-SCULPTURES-AUDIT.md).
