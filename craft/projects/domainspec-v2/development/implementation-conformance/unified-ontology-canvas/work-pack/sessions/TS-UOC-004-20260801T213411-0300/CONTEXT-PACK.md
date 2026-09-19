# Strict Context Pack — SWU-UOC-004

- Task Session: `TS-UOC-004-20260801T213411-0300`
- Selected unit: `SWU-UOC-004`
- Strict coverage: `pass`
- Dependency: joined 003 Refresh receipt; L0 complete
- Runtime: shared Playwright `1.59.1`, Chromium revision `1217`

## Execution Contract

- Material writes: `ontology-experiment/architecture-ontology-view.html` and
  `ontology-experiment/validate-unified-canvas-browser.mjs`.
- Execution output: `work-pack/results/SWU-UOC-004-RESULT.md`.
- Allowed writes: exactly the two material paths and result.
- Validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode static`.
- Lifecycle owner: `invoke:refresh:apply-approved`.
- Authority/publication: `private` / `internal`.
- Write profile: `material-bound`.

## Obligations

- Replace lens-specific graph reconstruction with one graph/layout render.
- Bind five bands, all 95 model nodes, and all 147 routes exactly once.
- Keep every identity present while the default Rule story dims unrelated nodes.
- Show plain-language information inside every node and preserve candidate/source
  boundaries in the page guide.
- Keep the Explore sidebar as an on-click popup, not persistent chrome.
- Retain source immutability and `authority_effect: none`.
- Browser harness must discover the shared runtime, serve only the exact
  experiment directory on loopback, audit requests/errors, assert exact DOM
  identity/counts, and stop its server in success or failure.
- Add no package root, external request, source adapter, or later interaction
  state beyond the existing guide popup.

Controlling sources: task 004, current Work Pack, strict pack, accepted
model/layout modules, current HTML baseline, 003 closeout, Architecture render
contract, and shared browser runtime contract.
