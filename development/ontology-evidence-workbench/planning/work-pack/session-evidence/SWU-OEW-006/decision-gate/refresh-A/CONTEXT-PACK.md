# SWU-OEW-006 Option-A Refresh Context Pack

Status: strict coverage pass
Mode: Context Builder lean
Artifact class: private session evidence

## Objective

Apply only the owner-selected option-A planning amendment: add
`package.json` to SWU-OEW-006, route its passing receipt to `attempt-002`, and
reactivate the existing serial chain without launching a server or touching
implementation bytes.

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| REF-6A-01 | preserve the exact owner-selected option A | covered |
| REF-6A-02 | preserve the original SWU-006 block as historical evidence | covered |
| REF-6A-03 | add exactly one target and no new acceptance behavior | covered |
| REF-6A-04 | preserve one visited SWU-006 selector while reactivating attempt 002 | covered |
| REF-6A-05 | grant planning bookkeeping only | covered |

## Write Scope

Exactly four planning targets: Work Pack, Viewer task contract, SWU manifest,
and chain state. Implementation mutation and server launch are forbidden.

Strict coverage: **PASS**. Blockers: **0**.
