# Events

## Evidence Events

These are receipt facts, not authority-domain events:

| Event | When | Required payload |
| --- | --- | --- |
| `DispositionRecorded` | Candidate evaluation completes | candidate, policy binding, disposition, reason |
| `ProjectionMaterialized` | Pure projection bytes exist | projection ID, source result digest, output digest |
| `IsolationChecked` | Governed-input before/after comparison completes | protected selectors, digests, denied-write result |
| `RunBundleCompleted` | All binding checks pass | artifact digest map and evidence ceiling |

## Run-Bundle Emission

Events are serialized inside the isolated run receipt in deterministic order.
They are not appended to an authority ledger and do not trigger promotion.
