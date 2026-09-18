# Particles flowing inside an unseen geometric enclosure

Date: 2026-09-17. Research and proposed implementation only; current animation unchanged.
Request: particles surround the engine, meet an invisible geometric boundary, and
redirect without tracing an obvious wall. This replaces the particle-floor concept.

## Primary sources

- Bridson, Hourihan, Nordenstam, [Curl-Noise for Procedural Fluid Flow](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf), SIGGRAPH 2007.
  Procedural flow can use a curl-derived velocity field and account for solid
  boundaries. Provides the basis for coherent swirling, rather than unrelated
  random walks. The paper's incompressibility/boundary guarantees do not transfer
  automatically to a simplified art-directed browser implementation.
- Craig Reynolds, [Containment steering](https://www.red3d.com/cwr/steer/Containment.html).
  Predictive probes, nearest surface points and normals support steering inside
  arbitrary enclosures. Useful for starting a bend before a hard collision.
- [Curl_Noise](https://github.com/kbladin/Curl_Noise): OpenGL GPU implementation
  referencing Bridson. Algorithm reference, not a drop-in React/Canvas dependency;
  any code reuse requires its exact license review.
- NVIDIA, [Real-Time Simulation and Rendering of 3D Fluids](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-30-real-time-simulation-and-rendering-3d-fluids).
  Full fluid simulation is another route. Its scope exceeds the first proposed
  landing-page prototype; choose based on measured visual/performance needs.

## Proposed appearance

Use a broad rounded hexagonal chamber around the existing engine. Its sides and
corners are never rendered. Small streams drift diagonally and circulate around
an inner exclusion region covering the engine and brain. Approaching the outer
facets, particles curve, briefly deflect, then rejoin the flow. Different depths,
speeds and phases reveal volume without collectively outlining every face.
The geometry choice is a design hypothesis, not an outcome established by sources.

## Mechanism

1. Replace the procedural floor rows in src/ParticleSurface.tsx with persistent
   particle position, velocity, depth and age; preserve its lifecycle controls.
2. Define an outer containment boundary and an inner keep-clear shape anchored to
   the hero visual. Use analytic nearest-boundary distance/normal calculations or
   a signed-distance representation. No boundary mesh is painted.
3. Combine a gentle circulation field with smooth curl-like variations. Do not
   describe an approximate field as physically simulated incompressible fluid.
4. Predict the next position; near a face, bias motion along its tangent. If an
   integration step crosses the boundary, correct penetration and reflect only
   the outward component with damping. Preserve tangential movement. Use substeps
   or swept checks where necessary to avoid tunneling through thin regions.
5. Vary depth and brightness, keep short fading trails, and soften corners. Avoid
   bright wall flashes, long accumulated trails, and particles sticking to edges.
6. Composite behind the engine and retain quiet title/button zones. Any foreground
   layer needs explicit occlusion handling; do not imply real 3D interaction from
   simply painting on top of the engine's raster assets.

## First prototype

Use Canvas 2D with projected depth (2.5D), rather than immediately adding a WebGL
fluid solver. Begin with a few hundred particles, a single hidden enclosure, and
an engine exclusion region. Tune turn sharpness, noise strength and trail lifetime.
Particle count and frame-rate targets are provisional until profiled. Keep a local
debug-only boundary overlay to validate collisions; production never shows it.

Acceptance: visible deflection without a continuously legible polygon; particles
move around the engine rather than remain on a floor; no wall penetration, edge
pileups, resize bursts, or re-entry jumps; stable pause/resume and reduced motion;
no rendering work offscreen; readable text in narrow panes. Compare recordings of
hard reflection and softened steering to judge whether the intended wall-hit feel
survives. Numerical containment tests do not establish visual success.

## Open Questions

- Rounded hexagon, box, or another enclosure: which suggests geometry without
  making its silhouette too clear?
- How sharp should the moment of impact remain after steering is introduced?
- Can projected depth supply enough volume, or is true 3D needed after profiling?
- How should the enclosure follow the hero's four changing foreground scenes?
