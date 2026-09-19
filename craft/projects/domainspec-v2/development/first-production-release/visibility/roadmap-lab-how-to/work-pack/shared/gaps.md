# Gap and deferral ledger

## Blockers

None at plan close.

## Deliberate deferrals

| ID | Deferral | Reopen trigger | Owner |
|---|---|---|---|
| RLH-D1 | General notification registry or service | a second independent recipient/use case needs the same lifecycle | repository workflow owner |
| RLH-D2 | External calendar scheduling | scheduling must notify outside repository sessions | operator/tooling owner |
| RLH-D3 | Standalone persistence | an approved owner defines storage and acknowledgment semantics | Roadmap Lab/IDE owner |
| RLH-D4 | IDE Canvas integration | dirty-scope gate is separately resolved and explicitly authorized | IDE extension owner |

## Known limitation preserved

Plain HTML does not receive Canvas storage acknowledgment. The feature makes the exact
event easy to copy; it does not pretend that copying or submitting has saved it.
