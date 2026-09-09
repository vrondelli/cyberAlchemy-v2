# Runtime Repair Handoff — SWU-IOLM-00C-UI-A3

## Identity

- Unit: `SWU-IOLM-00C-UI-A3` repair iteration
- Defect: `B-IOLM-A3-FIREFOX-EVENT-TARGET`
- Runtime: one local Task Session
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`
- Selection authority: operator-approved Invoke Refresh after terminal A4 `BLOCK/FAIL`
- Strict coverage: `pass` (`7/7` obligations)

## Obligations

| ID | Obligation | Resolution |
| --- | --- | --- |
| `A3-R01` | Own the routed Firefox defect | A4 names A3 and provides the exact failing `PW-BB-04` reproduction. |
| `A3-R02` | Preserve terminal A4 evidence | The failed run, defect receipt, screenshots, and A4 lifecycle are read-only. |
| `A3-R03` | Normalize delegated event targets | Resolve either an element target or its `parentElement` before calling `closest()`. |
| `A3-R04` | Fail closed for unknown targets | A target with neither usable `closest()` nor parent element returns no selection. |
| `A3-R05` | Add deterministic regression evidence | Pure Node tests cover element, text-node-shaped, and unresolved targets. |
| `A3-R06` | Preserve the A3 contract and fence | No renderer, snapshot, server, authority, dependency, or publication behavior changes. |
| `A3-R07` | Return a fresh viewer receipt | Validate the declared A3 surface and emit a new passing `iolm-interactive-viewer/v1` receipt. |

## Selected Evidence

- Task contract — `ebfad57466af6c85838acb5078000c3594c9ca7ff1ee74fdae9cc8e802a0334c`
- W0C-UI wave — `cd5045903f84c656401e01992b33f538002ad62bc88c3b9964f3ce576fd0f39d`
- Work-Pack — `1fc5b772b885f403626ebd227f8fa2a4149ecce7d7a94bf1d4e1e50c99f21545`
- Dispatch contract — `df5dea906e5fe01820c16a042513bad212932ac296b2dc5e71b258d08c1ee44a`
- A4 defect receipt — `4c1a0df1331973b9565929f936583a11ef88b49752b01ee5573f2937856ec1a9`
- A4 terminal receipt — `28441bf61cc621d25f6e061c6181e877ba2efcdeeb2a914b7edeebd7845804fd`
- Historical A3 pass receipt — `a5552f75dfb52d4c25417539b148af236f81ece43f57b490187855ab119c6035`
- `assets/app.mjs` — `68e24f59cde7001c2b52add4b0898200c535f0bf85908de8f52c16eaf157b2fb`
- `assets/selection.mjs` — `ea96ee62fc6768e83f39fd777e1576a024a7d8d80643ed4f021789964b2f7092`
- `tests/selection-inspector.test.mjs` — `c818c7f227cce65139b43790b7bcb0247efb188c41c1c45e9083b5751cfea058`

## Exact Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/assets/app.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/selection.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/selection-inspector.test.mjs`
- this repair lifecycle directory

## Validation

- focused selection/inspector Node suite
- all workable-example Node suites
- Python server regression and `serve_demo.py --check`
- `node --check` for changed modules
- exact implementation inventory and scoped diff hygiene

## Stop Boundary

Do not replay A4, alter its failed evidence, claim browser acceptance, change the six-value eligibility fence, or select another SWU. Return the fresh A3 viewer receipt and a probable A4 replay route only.
