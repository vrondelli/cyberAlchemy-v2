# Design Context

- Brownfield target: one dependency-free HTML page with five independent graph
  builders, per-view coordinates, per-view cache keys, and one SVG renderer.
- Unified target: normalize once, lay out once, render all families in one
  coordinate system, then derive visibility/emphasis state.
- Primary human contract: complete available trace from meaning to explanation,
  with gaps and authority boundaries visible.
- Constraint: facts/findings are fixed supplied TypeScript fixtures while
  Python/Rust profiles contain expectations only.
- Density: more than sixty objects are plausible; no usability/performance claim
  is admitted before measurement.
- Balancer review: current builders and accessibility gaps confirmed; it rejects
  a sixth concatenating renderer and task-shaped “build canvas” SWU.
- Mutation posture: none in Design.
