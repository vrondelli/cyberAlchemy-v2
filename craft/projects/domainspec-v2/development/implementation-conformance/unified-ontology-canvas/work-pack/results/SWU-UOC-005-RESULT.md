# Task Session Result — SWU-UOC-005

- Task Session: `TS-UOC-005-20260802T133000-0300`
- SWU / task: `SWU-UOC-005` / `TASK-UOC-005`
- Terminal status: `PASS`
- Completed: `2026-08-02T13:42:26-03:00`
- Dependencies: joined passing `SWU-UOC-004P` Invoke Refresh receipt
- Context strict coverage: `pass` (9/9 obligations)
- Mutation admission: `material-bound`, `admit`, `mutationReady=true`
- Admission request / receipt SHA-256:
  `a2549de1886a12aa46586dca669739bf279a31dd1972c75e5350940f55479879` /
  `ddea7121bab588180105102fdba40f632c9fabf33f512f977846bde2fba1762a`
- Final material package / receipt SHA-256:
  `72d3fc443caf54e3b16619434dce9cf453061ff5563d4b0fea7cc4409974eac6` /
  `5a00fb602a42adf770c243bb8687e55ec44d99ecbf59d663a067d59edbf96e0f`

## Applied Delta

| Path | Baseline SHA-256 | Terminal SHA-256 |
| --- | --- | --- |
| `ontology-experiment/architecture-ontology-view.html` | `f21d7021c6c90759d33ed32c9700e721e06107fe6edc98ec3e47c5319e166603` | `2093d7d8b700b8e080d03d81bf6ca4ec376e404391bf870f06602f6f9f70579c` |
| `ontology-experiment/validate-unified-canvas-browser.mjs` | `34c93a505f7b8901d5e2ac553f65947cbd66078dd1987ac97e5b9759984e8113` | `a3d480f41844b9642e8b7f73d0e3c3cbc4865990e8ad4d5026312aa5764d2610` |

Both terminal targets match their admitted material post-images byte-for-byte.

## Behavior

- `deriveVisibility(graph, filterInput)` is the single visibility reducer.
- Inputs are `family`, `maturity`, `coverage`, `profile_id`, `relation`, and
  `non_match`; outputs are `graph_id`, `node_visibility`, `edge_visibility`,
  `node_profile_matches`, and `profile_notice`.
- Family, maturity, coverage, profile, and relation controls derive visibility
  over the same 95 nodes and 147 edges. They do not rebuild the graph.
- Non-matches are explicitly either `dimmed` or `hidden`; clearing restores
  every identity to `visible`.
- Fixture, evaluation, and constraint-origin profile IDs are exposed as DOM
  attributes for direct audit.
- Python and Rust profile selection activates no TypeScript fixture or finding
  path and explicitly reports that no supplied observation/evaluation exists.

## Validation

1. `node .../validate-unified-canvas-browser.mjs --mode visibility`
   - Exit `0` with Playwright `1.59.1` and Chromium revision `1217`.
   - Graph ID remained `unified-canvas:prototype` across 19 filter replays.
   - Identity sets remained exactly 95 unique nodes and 147 unique edges.
   - Family hide/dim, maturity, coverage, and relation filters passed; the
     `candidate-aligns-to` relation exposed exactly five edges.
   - Python and Rust activated and displayed zero TypeScript evidence nodes;
     TypeScript activated 13 matching evidence nodes.
   - Clear restored all 95 nodes and 147 edges to visible.
   - Zero external requests, failed responses, console errors, or page errors;
     source mutation `false`; server cleanup `true`.
2. `node .../validate-unified-canvas-browser.mjs --mode static`
   - Exit `0`; prior static acceptance remains intact with five bands, 95 nodes,
     147 edges, 54 trace-emphasized nodes, and 41 trace-dimmed nodes.
   - Zero external requests, failed responses, console errors, or page errors;
     source mutation `false`; server cleanup `true`.
3. Scoped `git diff --check`
   - Exit `0`.

## Boundary And Continuation

- Blockers: none inside `SWU-UOC-005`.
- Residue: selection, trace calculation, search, and focus emphasis remain
  intentionally assigned to `SWU-UOC-006`.
- Claim ceiling: local candidate browser-prototype evidence only. This is not
  ontology admission, cross-language conformance, promotion, publication,
  release, deployment, or production-readiness evidence.
- Recommended successor: `SWU-UOC-006` becomes eligible only after the Invoke
  Refresh owner joins this result through the exact 005 closeout receipt. It is
  not selected or run by this Task Session.
