# Ontology-guided hero motion experiment 02

Status: local candidate, 2026-09-16. Authority effect: none.

## Objective and comparison

The owner found the first hero too simplistic and requested an experiment using the DomainSpec Core ontology, with a result closer to [Anime.js](https://animejs.com/). Preserve ARE's high-level explanation, blue/silver palette, brain-engine concept, icon-first component presentation and working canvas entry.

The first version mostly rotated/scaled a raster illustration and revealed a small static overlay while text scrolled beside it. The selected version pins a complete stage, gives each chapter a distinct composition, and reorganizes persistent graphical elements. The reference's large central instrument, coordinated concentric motion, scroll choreography and strong typography inform this adaptation; its code/artwork are not copied.

Before/after evidence: `evidence/baseline/hero-start.png` and `hero-scroll.png` retain the earlier local render; `evidence/v2-assembly.png`, `v2-context.png`, `v2-feedback.png`, and `v2-map.png` show the current four stages. Reference-page screenshots were inspected locally at `/tmp/anime-home.png` and `/tmp/anime-scroll.png`; temporary reference images are not distributed with this prototype.

## Exact ontology use

The selected sibling source is `../domainspec-core/projects/animejs/ontology/agent-knowledge-vault` relative to the repository root. Its README describes a candidate knowledge graph over Anime.js 4.5.0 documentation/source material, and explicitly distinguishes source examples from executed operational lessons. We read its README, task recipes and selected node records; no sibling source was modified or runtime executed.

[The source ledger](motion-source-ledger.json) binds the source-file SHA-256, selected record IDs, official URLs and evidence IDs. These records supplied concrete implementation choices:

| Selected topic suffix under `topic:documentation:` | Experiment use | Observed evidence |
| --- | --- | --- |
| `utilities/stagger` | Stagger 72 calibration ticks and the reorganization of 96 particles; stagger the arrival of eight icon stations. | Tick/particle/station DOM counts and sampled rendered coordinates. |
| `svg/createdrawable` | Draw feedback and component paths as their scenes arrive. | Actual rendered SVG and four stage screenshots. |
| `svg/createmotionpath` | Move a luminous tracer along the drawn feedback path. | Tracer transform differs between two feedback-phase scroll positions. |
| `timeline/timeline-methods/seek` | Use scroll position as a reversible timeline clock. | Forward state changes and restored opening particle coordinates after reverse scroll. |
| `scope/scope-methods/revert` | Own animation instances with the React component and clean them up on unmount. | Re-entry has exactly one field and no duplicate particles or runtime errors. |
| `events/onscroll/scrollobserver-synchronisation-modes/smooth-scroll` | Considered as an alternative to direct seeking. | Not selected: direct seeking gives deterministic scroll-position comparisons without a trailing synchronization lag. |

The recipe instruction to bind a version and execute local acceptance checks is applied to the already-vendored Anime.js 4.5.0. The ledger does not promote the sibling ontology or claim its examples were executed upstream. The full product ontology is not loaded into the browser.

## Choreography

1. **Assembly:** the blue holographic brain-engine sits inside layered blue/silver rotor arcs. A scanning line, staggered calibration ticks and orbital particles establish an engineered motion vocabulary.
2. **Context selection:** the hologram recedes while the same particles form a bounded grid. The text explains retained state versus selected context. The grid is an illustration, not an observed token count or a measured compression ratio.
3. **Feedback:** particles flow into a looping shape, a path draws, and a tracer follows it. The text retains the distinctions between observations, decisions, permissions and completion.
4. **Components:** the field resolves into clusters around eight bordered icons with labels and a central ARE mark. Spokes depict composition only, not causal/runtime dependency edges. The button enters the actual React Flow map for typed relationships and component explanations.

Scroll remains native; no wheel event is intercepted. Chapter buttons provide direct scroll navigation. Inactive copy is inert and hidden from accessibility APIs. Reduced-motion mode removes the animated/pinned interaction and exposes all four chapters in document order. The selected final stage does not claim that every depicted mechanism runs together by default.

## Hypotheses and result limits

- H1: reorganizing persistent elements produces materially distinct visual stages, rather than cosmetic rotation. Supported mechanically: mean particle travel between successive sampled stages exceeds 65 SVG units, and the final scene replaces the raster with eight visible icon stations. This threshold is a coarse distinctness check, not a universal motion-quality standard.
- H2: the choreography stays reversible and navigable. Supported by reverse-scroll geometry, chapter controls, map entry and remount checks.
- H3: the composition remains usable on representative small screens and without motion. Supported by 390×844 and 360×640 checks, screenshot inspection, and the reduced-motion document flow. This does not establish all-device or accessibility conformance.
- H4: the result better matches the reference's visual direction. Visual inspection supports the design judgment: larger instrument composition, staged transformation, staggered elements, traced feedback and dark blue/silver hierarchy. User preference and unfamiliar-reader comprehension remain unmeasured.

## Construction boundary and reproducibility

Implementation is confined to this local prototype. Current frontier: the ontology-guided motion experiment is implemented and browser-verified. Runnable work: `npm run dev`, `npm run build`, `node scripts/hero-proof.mjs`, and `node scripts/browser-proof.mjs` from this directory. The latter keeps the existing interactive map under regression checks.

Operational owner decisions about publishing, hosting and standalone dependency installation remain deferred and do not block this local experiment. No source-ontology promotion, ARE runtime change, deployment, or release is performed. Current causal construction blockers: none.

Build and browser results are recorded in `evidence/hero-proof.json` and `evidence/browser-proof.json`. A short local scroll recording is retained at `evidence/recordings/motion-v2.webm`. Generated screenshots, recordings and build output remain ignored and regenerable; the source ledger and experiment explanation are durable.

## Open Questions

- Does the owner prefer this dark graphite treatment or the previous pale surface with the richer choreography?
- Does the motion help new readers explain state, context and feedback, or distract from the text?
- Should the final composition transition directly into an embedded interactive map rather than using a deliberate button?

These are subsequent design/evaluation questions, not claims that the current experiment has measured audience preference or comprehension.
