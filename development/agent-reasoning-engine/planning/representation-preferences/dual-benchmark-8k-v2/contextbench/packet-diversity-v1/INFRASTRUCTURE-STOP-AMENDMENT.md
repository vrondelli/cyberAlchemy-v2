# Native export infrastructure stop — additive runner v2

Offline implementation only; independent review and a separately frozen successor are still required. No model calls, real tokenizer calls, network, gold access, or recalculation of prior expenditure occurred.

`run-v2.mjs` descends from frozen `run.mjs`. The exact implementation diff consists of an ancestry comment, exported failure classifier, structured export failure fields, and inclusion of the infrastructure flag in shared-health stopping and successful-completion checks. Imports, native recycler, request admission, source selection/export, packet ranking, 8,000-token window, 2-worker pool, 16-slot denominator, 128,000-token ceiling, and usage accounting are inherited unchanged.

A native export exception now records `export_failure: {phase, kind, code}`. Typed system errors, persistence markers, instrument-error diagnostics, source projection/binding failures, and otherwise unrecognized exceptions set `infrastructure_failure: true` and status `infrastructure-failure`. The pool sets shared health false before invoking its health reporter. Pending dispatch callbacks and remaining slots observe that state. Existing known receipt usage remains intact; no error converts measured cost to zero.

Only named model-selection diagnostics with matching native error wording, no instrument error, and no typed system/persistence marker remain ordinary `invalid_terminal_selection` outcomes. These include invalid handles/schema/JSON, invalid source selections, the required terminal tool response, and empty context. Such outcomes still fail quality/completion but do not stop healthy peers. Unknown exceptions conservatively stop infrastructure rather than attributing a new failure class to the model.

Validation: `node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/run-v2.test.mjs` passed **15/15** tests. Eleven inherited tests exercise native transport/recycler behavior using in-memory HTTP primitives only. Four new tests cover:

- A removed synthetic base file causes actual native-export ENOENT after a known 120-token model receipt; one waiting peer is denied dispatch, all 16 slots remain, and the saved receipt retains cost.
- Changed synthetic base contents trigger source projection infrastructure failure with known cost intact.
- Invalid and empty model handle selections retain ordinary model-outcome classification and allow the full synthetic pool to proceed.
- Typed ENOSPC, persistence and instrument-error markers override semantic wording; unknown exceptions fail closed.

| File | SHA-256 |
| --- | --- |
| Frozen `run.mjs`, unchanged | `af5d99f7284375335b5934b17f56e7ff2080fff0c28b4bbb3059afffe090df8d` |
| Frozen `run.test.mjs`, unchanged | `499da8463f163c3cf9495b20561f3ef98bf3d5f17aa024acdfed0163c0d28688` |
| New `run-v2.mjs` | `5cee4baafc9b09bea65a0559cd888ef16750519a8eecf67924523f88ea963aff` |
| New `run-v2.test.mjs` | `89fb407bd7405207d54c0b1a452f17d4d940b5a8cc44b4696783f07e77cf4d6b` |

## Open Questions and execution prerequisites

The frozen live wrapper still imports the original runner. This additive module does not change that run or authorize another attempt. A successor must explicitly import the new runner, bind it in a new freeze, and preserve the stopped attempt and its costs. It must use the separately reviewed request-complete base restoration (`source-closure.mjs`), verify projection of all delivered reads before dispatch, and pass current storage admission without weakening limits. Wrapper cancellation/drain, durable global sealing and accounting of already-dispatched peers remain separate integration work; this runner only prevents subsequent dispatch after it observes the failure. The component claim ceiling remains unchanged: no fresh full-trajectory, perfect benchmark, or 15% savings claim follows from these tests.
