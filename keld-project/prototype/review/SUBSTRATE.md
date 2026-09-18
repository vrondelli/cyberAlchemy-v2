# KELD UI review substrate

Owner objective: review the whole UI, use TasteCheck plus two independent reviewers, then execute an evidence-based DAG. The central defect is needing to scroll within a scene to understand it or reach its actions on normal laptops.

## Evidence

- Actual TasteCheck oracle collection and clipping functions: `oracle/run.mjs`, `oracle/before/results.json`. Upstream CLI is fixture-bound; this adapter calls the real exported functions on KELD, using the existing Playwright driver. No upstream changes or invented paired-judge certification.
- Cold-load heuristic: CLEAN, 0 fails/0 warnings. This does not mean usable or accessible.
- A11y heuristic at 1366×768: 39 flags, 96 warnings. Includes real small targets/low contrast and gradient-background false positives requiring triage. No claim of 39 distinct WCAG violations.
- Independent reviews: `laptop/REVIEW.md` and `interaction/REVIEW.md`, with measured geometry and screenshots.
- At1366×768, header88 leaves680px: hero886, gear919, studio826, film834 and scenes925–1115px. Scene selection can leave the newly selected image above the viewport. Expanded scene5 requires1011px; navigation drops below the screen.

## Product and preserved identity

Audience: visitors discovering the KELD studio, its fictional maker and ARE offering. Primary paths: understand the studio → inspect the engine → watch/read the legend → explore or prepare an inquiry.

Preserve: ivory/forest/copper palette, Georgia editorial headings, hooded-maker artwork, geometric mark, six chapters, exact story prose, manual navigation, optional click-to-play YouTube, existing shop terms. These are directly observed repeated signals, not new branding.

Normalize: width-driven oversized media, excessive vertical gaps, tiny functional labels, disconnected chapter selection, controls outside viewport, inactive-background narration, inaccurate embed disclosure. Authorization: explicit user instruction to plan and execute UI fixes.

Layout rule: fit complete laptop presentation units to the usable viewport where content fits at readable size. Prose remains at least15px in laptop scenes. Phones, zoom, long-form articles and forms retain natural vertical reflow; no hidden text, fixed-height clipping, forced scroll snapping, or microtype to satisfy a measurement. Each film/scene is its own unit; the entire six-chapter legend is not one viewport.

Inferred direction: restrained workshop editorial design; artwork supports the message instead of determining section height. High confidence for targeted repair, not a material rebrand. No new palette or sales promises.

## Open Questions

Physical diagonal is insufficient: representative tests use1280×720,1366×768,1536×864,1920×1080 and1024×640, plus phones and effective400%-zoom reflow. Actual YouTube media playback and owner visual approval remain separate from local integration checks. Final evidence and any residual defects belong to `PLAN.md` and `RESULTS.md`.
