# Invisible enclosure flow implementation

Objective: replace the particle floor with particles flowing around the engine,
redirecting at an unseen geometric boundary. Basis: BOUNDED-FLOW-RESEARCH.md.

## Construction sequence

1. Persistent seeded particles with position, velocity, depth and short trail.
2. Broad circulation plus smooth varying flow; predictive tangent steering.
3. Hidden six-face enclosure with softened approaches, damped contact deflection,
   and an elliptical engine keep-clear region. Neither shape is rendered.
4. Canvas projection anchored between the caption and action controls, scaled
   to viewport width, with restrained depth-dependent size and parallax.
5. Preserve pause, reduced-motion, hidden-tab and offscreen suspension.
6. Test long-run enclosure/core invariants, explicit contact deflection, bounded
   trail memory, repeatable seeding, and browser rendering/lifecycle behavior.
7. Review the local visual result; user review owns the desired motion style.

## Scope and operational lane

Owner-directed local prototype construction only. No operational prerequisites,
new libraries, live model calls, deployment or publication. Canvas flow is an
art-directed approximation, not a physical-fluid or incompressibility guarantee.
Product evidence lives in scripts/particle-flow.test.mjs and
scripts/particle-depth-proof.mjs; test results do not grant release approval.

## Open Questions

- Does the amount of contact deflection match the intended wall-hit sensation?
- Are the six sides too discernible after observing the flow for a longer period?
- Should the engine keep-clear region change shape with each of its four scenes?

## Owner refinement

Expand the field across the whole hero; increase density to 1,100 / 360 points
(wide / narrow). Remove rendered trails and accumulated trajectory history.
The boundary is now implied exclusively by changes in point direction.
