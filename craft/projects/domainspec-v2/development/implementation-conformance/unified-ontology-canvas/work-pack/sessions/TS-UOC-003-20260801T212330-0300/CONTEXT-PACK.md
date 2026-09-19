# Strict Context Pack — SWU-UOC-003

- Task Session: `TS-UOC-003-20260801T212330-0300`
- Selected unit: `SWU-UOC-003`
- Strict coverage: `pass`
- Dependency: joined `SWU-UOC-002` Refresh receipt
- Claim ceiling: local candidate routing over the accepted node layout

## Execution Contract

- Material writes: `ontology-experiment/unified-canvas-layout.mjs` and
  `ontology-experiment/validate-unified-canvas-layout.mjs`.
- Execution output: `work-pack/results/SWU-UOC-003-RESULT.md`.
- Allowed writes: exactly the two material paths plus the result path.
- Validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode edges`.
- Lifecycle owner: `invoke:refresh:apply-approved`.
- Authority/publication: `private` / `internal`.
- Write profile: `material-bound`.

## Obligations

- Preserve the accepted node-layout digest and all 95 coordinates.
- Route every one of the 147 graph edges exactly once.
- Use top/bottom ports for intra-band routes and left/right ports plus reserved
  corridors for cross-band routes.
- Keep all orthogonal path segments outside every node interior.
- Give parallel edges stable, distinct offsets.
- Preserve structural/semantic/evidence text and solid/dashed/dotted patterns;
  color cannot be the sole relation distinction.
- Add no SVG, DOM, browser, interaction, or external dependency behavior.
- Reject missing endpoints, duplicate routes, crossings, or nondeterminism.

Controlling sources are the 003 task, current Work Pack, strict pack, accepted
model/layout modules, 002 closeout, and Architecture edge-routing section.
