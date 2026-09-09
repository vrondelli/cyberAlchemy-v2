# Explorer return — UX, accessibility, and graph precedent

Agent: Simon, Herbert  
Action: `spawn-0003`  
Status: pass, read-only

## Local evidence

- Baseline screenshot: 237 nodes and 231 edges at fit-to-screen scale; node text is unreadable and the right Project Tour panel reduces canvas width.
- Focus scene: 4 nodes, 0 internal edges, and 6 labeled portal buttons; the bottom overlay may occupy 38% of the viewport while the right panel remains.
- Active-scene edges show `type · description`; portals expose source, presentation relation, arrow, target, source predicate, direction, authority, and evidence.
- Portal controls are native buttons with focus-visible, forced-colors, and reduced-motion CSS. No inspected evidence proves graph-level forced-colors behavior, full-graph keyboard traversal, or that focus remains unobscured by both panels.

Bindings: accepted A/B baseline/focus screenshots; `KnowledgeFocusPortals.tsx:27-89`; focus patch lines 194–219; browser runner lines 214–279.

## Primary-source evidence and bounded inferences

| Topic | Primary evidence | Design inference |
|---|---|---|
| Progressive disclosure | van Ham and Perer organize large-graph exploration as “Search, Show Context, Expand on Demand”: https://aviz.fr/wiki/uploads/Teaching2014/SearchShowContext.pdf | Make the complete graph an intentional Overview escape; use a bounded reversible home |
| React Flow keyboard access | Official docs describe focusable nodes/edges, Tab traversal, Enter/Space selection, Escape, and auto-pan: https://reactflow.dev/learn/advanced-use/accessibility | Reuse owned keyboard mechanics and bound the scene instead of creating a 468-item traversal |
| Color redundancy | WCAG 2.2 SC 1.4.1 forbids color as the sole information cue: https://www.w3.org/TR/WCAG22/#use-of-color | Unique-per-edge colors fail; use a small palette plus labels, markers, and patterns |
| Focus occlusion | WCAG 2.2 SC 2.4.11 requires focus not be entirely hidden by author content: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum | Reserve layout space or collapse panels and test focus within the unobscured rectangle |
| Forced colors and motion | Media Queries 5 defines `forced-colors` and `prefers-reduced-motion`: https://www.w3.org/TR/mediaqueries-5/#user-preference | Preserve boundaries, focus, arrows, and patterns in system colors; disable non-essential relation animation |
| Icons plus text | Wiedenbeck compared text, icons, and redundant icon-plus-label interfaces: https://www.tandfonline.com/doi/abs/10.1080/014492999119129 | Use icons for scanning only beside exact labels |
| Graph readability | Ware et al. found path length, continuity, crossings, and branches affect path-finding: https://vislab-ccom.unh.edu/pdfs/GraphAesthetics.pdf | Prefer bounded scenes and reduce competing branches for novice relation tasks |
| Direction | Holten and van Wijk compared directed-edge representations: https://doi.org/10.1145/1518701.1519054 | Keep arrowheads but redundantly state direction in text; do not rely on animation |

## Candidate matrix

- Home: bounded business-context scene, one-sentence purpose, 3–6 source-backed nodes, labeled portals, and explicit `Overview — all 237 nodes`. Kill the implicit all-node home. Defer search-first home pending novice evidence.
- Controls: use outcome-revealing labels or helper text, including `Overview — all nodes`, `Learn — guided tour`, `Deep Dive — inspect evidence`, `Filter — narrow nodes`, `Export — download current view`, and `Path — trace a relation`. Hide or defer Diff, layer chips, Fuzzy/Semantic, Export, and Path from the learning home unless their effects are explained and tested.
- Cards: one source-backed primary icon plus visible exact text; keep kind/category/authority separate. Kill guessed or icon-only semantics.
- Relations: stable presentation-relation color and line pattern, arrowhead, exact recoverable label, and scene-local legend. Kill per-edge colors, hover-only labels, and animation-only direction.
- Keyboard: deterministic order across shell, scene nodes, portals, and panels; Enter/Space activates, Escape closes transient UI and restores focus.
- Forced colors/motion: require graph-level browser witnesses; make static line/marker/text semantics equivalent.
- Panels: reserve desktop layout space or make one panel collapsible; at narrow widths allow only one focus-managed sheet at a time.

## Measurable novice comparison

Use at least 8 people unfamiliar with Body War/OEW in a counterbalanced comparison between the current all-node home and bounded candidate.

Critical tasks:

1. Explain the starting scene and name two concepts within 45 seconds.
2. Find Identity and Consent → Authentication and Consent and report exact relation and direction within 60 seconds without a color-only explanation.
3. Traverse one portal and return within 60 seconds.
4. Intentionally open the complete graph within 30 seconds and predict the scope change first.
5. Predict at least 6 of 7 effects for Learn, Deep Dive, Filter, Export, Path, Theme, and Search.
6. Repeat relation navigation keyboard-only with visible focus and logical restoration.
7. Repeat relation identification in forced colors and reduced motion.

Candidate threshold: median time improves by at least 20% on tasks 1–3; at least 7/8 complete every critical task; zero direction errors; zero entirely obscured focus events; no increase in full-graph escape failures.

Record time, success, wrong controls, backtracks, direction errors, prompts, focus occlusion, and confidence.

Claim boundary: automated checks prove mechanics only. Human comprehension remains pending until the protocol runs. Screen-reader announcement quality and current graph-level forced-colors/reduced-motion behavior remain unproven.
