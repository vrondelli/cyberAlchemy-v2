# Task Session Result — SWU-UOC-004P

- Task Session: `TS-UOC-004P-20260801T225000-0300`
- SWU / task: `SWU-UOC-004P` / `TASK-UOC-004P`
- Terminal status: `PASS`
- Completed: `2026-08-01T23:04:10-03:00`
- Dependencies: joined 003 Refresh receipt and direct-user prototype Refresh
- Context strict coverage: `pass` (10/10 obligations)
- Mutation admission: `material-bound`, `admit`, `mutationReady=true`
- Admission request / receipt SHA-256:
  `9cf926d45e1af1f698475d66d89ac931565a79fcc8906d52df0963cdf608dd12` /
  `09f67bfda61ebc4b6599c8474538853361873c7170768eca1d0f095a6c0658be`
- Final material package / receipt SHA-256:
  `0cdf784ba9f1b3b4bbb7715c3b3d01219d622186a60359c80d731dc0aaf4f4c6` /
  `cb1dd17f334d1c2ccbfe66678fed141e24bf699dad0c105623b65b0ea12f9f50`

## Applied Delta

| Path | Baseline SHA-256 | Terminal SHA-256 |
| --- | --- | --- |
| `ontology-experiment/unified-canvas-model.mjs` | `247bab577c1ce9a0e249b68fe2145c2035fd7638ee79c38918ddf5b0fff551c8` | `7e20f32fca426248b0de0f247c51333788f7cf6500ed30fea4d5f479f6375fad` |
| `ontology-experiment/validate-unified-canvas-model.mjs` | `286b3654c5679a02ce3ce8f57435531ef7d3600f121ae66751a58d633247cefe` | `9b6259d5ed4992d05b77965754b9bd95226381bb2fb7467970b0f1cb87fbef16` |
| `ontology-experiment/unified-canvas-layout.mjs` | `17f95b208a8fe51b88dab44c5226d9edc0ec9dec52da22bf8da3cf7a73150e32` | `7a2d87e8bd37afa3b839a5113d74ae2503f817919b2712f714e188e6e86f8dfe` |
| `ontology-experiment/validate-unified-canvas-layout.mjs` | `6ef403b281c34991d934a35b6ce16dbe071cbc8e6c57b8abed9a306f571117cb` | `bc1e29d24f750652943116be45cc7319512f4d548a8a5c90c5a84f6f1f6eaf14` |
| `ontology-experiment/architecture-ontology-view.html` | `8536cfb86925b8cf76aee7ae48ceed5b05090e15673d055e3b988783735ece0f` | `f21d7021c6c90759d33ed32c9700e721e06107fe6edc98ec3e47c5319e166603` |
| `ontology-experiment/validate-unified-canvas-browser.mjs` | `077c35a2122fab66164ba170173387cd7ac09d1f61cdb7b8d7547d33eed11350` | `34c93a505f7b8901d5e2ac553f65947cbd66078dd1987ac97e5b9759984e8113` |

All six terminal targets match their final validated material post-images
byte-for-byte. The model still preserves the two fixture-provided raw
`source_digest` metadata values; only generated verification checksums were
removed.

## Behavior

- Model ID: `unified-canvas:prototype`.
- Layout ID: `unified-layout:prototype`.
- Verification label: `prototype-unverified`.
- The model and layout import no Node-only crypto module and emit no generated
  digest fields.
- Determinism is evidenced by deep structural replay equality, stable semantic
  IDs, unique identities, complete routes, fixed counts, and source immutability.
- The browser receipt exposes IDs, verification label, counts, request/error
  audit, source mutation status, and cleanup status. It makes no integrity claim.

## Validation

The task contract omitted the model validator's required `--mode projection`.
The source-required command below was used as the documented accepted equivalent.

1. `node .../validate-unified-canvas-model.mjs --mode projection`
   - Exit `0`.
   - 95 nodes, 147 edges, 20 explicit gaps; structural replay pass.
2. `node .../validate-unified-canvas-layout.mjs --mode nodes`
   - Exit `0`.
   - 95 positions, five bands, zero overlaps; structural replay pass.
3. `node .../validate-unified-canvas-layout.mjs --mode edges`
   - Exit `0`.
   - 147 routes, zero node-interior crossings; structural replay pass.
4. `node .../validate-unified-canvas-browser.mjs --mode static`
   - Exit `0` with Playwright `1.59.1` and Chromium revision `1217`.
   - Five bands, 95 unique nodes, 147 unique edges, 54 emphasized nodes, and
     41 dimmed nodes.
   - Zero external requests, failed responses, console errors, or page errors;
     source mutation `false`; server cleanup `true`.
5. Scoped forbidden-symbol check
   - Exit `0`, no matches for Node crypto or generated digest symbols across
     the six product targets.
6. Scoped `git diff --check`
   - Exit `0`.

The first browser acceptance attempt exposed Chromium's automatic missing
`/favicon.ico` request as one console error. The exact in-scope harness now
returns `204` for that browser-default asset. Final material and admission
receipts were replayed against the preserved exact baselines and pass with no
reasons.

## Boundary And Continuation

- Blocker `UOC-BLOCK-BROWSER-NODE-CRYPTO-001`: resolved for the local prototype.
- Blockers: none inside `SWU-UOC-004P`.
- Claim ceiling: local candidate static-browser prototype only. This is not
  cryptographic integrity, conformance, promotion, publication, release,
  deployment, or production-readiness evidence.
- The later small Node integrity service remains deferred and unimplemented.
- `SWU-UOC-005` may become eligible only after the Invoke Refresh owner joins
  this result through the exact 004P closeout receipt. It is not selected or run.
