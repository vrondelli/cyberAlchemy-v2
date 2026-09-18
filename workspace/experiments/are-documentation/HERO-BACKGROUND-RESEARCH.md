# Hero background directions

Date: 2026-09-17. Research only; no hero changes made.

## Five options

1. Soft blue halo: a broad, diffused blue light behind the engine, darkened toward
   the text and edges. Reference: https://ui.aceternity.com/components/spotlight
   Adaptation: centered glow rather than a diagonal spotlight. Proposed CSS radial
   gradients, static by default. Lowest added visual complexity.
2. Schematic grid: sparse blue grid/dots, fading beneath the engine and text.
   References: https://vercel.com/geist/grid and
   https://ui.aceternity.com/components/grid-and-dot-backgrounds
   Adaptation: faint construction-plane cues, not a boxed layout. Proposed CSS/SVG.
   Best fit for the existing holographic schematic identity; avoid dense lines.
3. Blue light field: broad, slow-moving bands of navy, cobalt and pale blue.
   Reference: https://ui.aceternity.com/components/aurora-background
   Adaptation: remove rainbow colors and keep the title region dark. Proposed CSS
   gradients with transform/opacity changes. Can compete with engine motion.
4. Signal paths: a few thin curved blue light traces approaching the engine from
   the edges, conveying connection. Reference:
   https://ui.aceternity.com/components/background-beams
   Adaptation: sparse SVG paths, dimmer than foreground wires, avoid busy flow.
   May be confused with functional edges; treat as decorative and unlabeled.
5. Particle surface: a shallow perspective field of sparse blue points, gently
   undulating behind the engine. Reference:
   https://threejs.org/examples/webgl_points_waves.html
   Adaptation: restrained density and depth; no starfield or fast camera movement.
   Greatest likely implementation/rendering cost and overlap with current particles.

## Recommendation

Prototype option 2 over a very subtle option 1 halo. Grid supplies an engineering
setting; halo supplies separation. Keep the engine brighter than both. This is a
visual design judgment, not a measured preference result. References are patterns
and component documentation; no dependency or licensed asset has been adopted.

## Constraints and verification

Keep all variants blue; preserve quiet regions behind text and controls. Background
must cover the hero and fade naturally toward the landing section. Keep motion
optional and governed by the existing pause and reduced-motion settings. Use static
or simplified fallback in short/narrow panes. Validate text contrast, clipping,
horizontal overflow, and actual device rendering cost before selecting an animated
implementation. Relative cost estimates above describe proposed implementations,
not measurements of the linked examples.

## Open Questions

- Which option best supports the existing engine across all four scenes?
- Does a grid remain legible without visual interference in the 240px pane?
- Does any additional background motion improve the experience over a static field?
