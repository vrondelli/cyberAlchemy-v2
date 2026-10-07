# G02 NodeBB chat-permission pair: quality rejection

The second predeclared NodeBB task,
`SWE-Bench-Pro__javascript__maintenance__bugfix__09eb0d6d`, ran on pinned
commit `7800016f2f1b89d2d3cfea6a7da7c77096b7b927`. Both arms settled with
complete known model cost. Predictions were [sealed](PAIR-PRE-SCORE-SEAL.json)
before native scoring; the [reverified decision](verified-pair-r2/PAIR-DECISION.json)
rejects the fixed candidate on both quality metrics.

| Arm | Span-F1 | File-F1 | Known model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE GLM treatment | 0.35624 | 0.25000 | 62,202 | 151.38 |
| DSH control | 0.43701 | 0.33333 | 947,218 | 377.69 |

ARE used 93.43% fewer known model tokens and 59.92% less wall time, but lost
Span-F1 by `0.08077` and File-F1 by `0.08333`. The fixed selector added no
reads and dropped none, so its [raw model prediction](model-prediction.json)
and [selected prediction](candidate-prediction.json) score identically.
This is a valid counterexample, not a budget-capped or unscored control.

Mechanism diagnosis after sealing: ARE selected three files—messaging,
user settings, and an old chat-upgrade file. Its receipts show it also read
the admin user-settings template but did not select it. The control selected
the settings OpenAPI schema as well. The native gold for this now-exposed task
spans 13 files, including client settings, account controllers, templates,
language strings, and the settings schema; those labels are retrospective
diagnosis only and cannot be used to tune or claim a prospective win on this
task. The next hypothesis should change source acquisition and/or
receipt-bound cross-layer final selection, then be tested prospectively on a
new untouched task—not merely reword this exposed prompt.

The [source-only task](source-only-task.json), [binding](binding.json),
[freeze](FRESH-PAIR-FREEZE.json), [ARE result](RESULTS.json),
[DSH export](dsh-EXPORT.json), and [selector receipt](selector-receipt.json)
are retained. The [ARE receipt archive](are-receipts.tar.gz) SHA-256 is
`657e018428dde80b1b5a818bdd8d70e8c4dcb5a120696b9e00653b64075023f9`;
the [DSH receipt archive](dsh-receipts.tar.gz) SHA-256 is
`ee8207e6509ea318f7db6cca1e0f566e16a8a721706bbd7d491d8fcb22d17140`.
Both exclude source checkouts and secret files; the DSH archive excludes
session state.

## Open Questions

- Can a gold-blind cross-layer packet retain settings/UI/schema evidence
  without filling the selection with irrelevant files?
- Will that mechanism beat a fresh matched control on an untouched task?
