# G02 exposed Flipt task-term acquisition diagnostic: rejected

The source-only Go task-term selector proposed `cmd/flipt/export.go`, `cmd/flipt/import.go`, `internal/ext/exporter.go`, and `internal/ext/importer.go` on the already exposed Flipt import/export task `153337fe`. A live ARE-only episode verified all four focused reads were delivered before model calls (`events.jsonl` SHA-256 `4be702e9c062879a9f93141c67fe16dbf3490c6295db05a5228d8f84e173db23`). The VPS receipt root is `/opt/are-benchmark-runs/g02-cross-layer-flipt-import-go-diag-r1`; `FREEZE.json` SHA-256 is `a237b9c6f97aa69353661fea8aab2b1e40199d249b9f1b9c4c13dd910c424c03`.

The raw model again selected only the three `internal/ext` core files. Native Span-F1 fell from the earlier matched ARE run's **0.40703** to **0.25025**; File-F1 remained **0.30000**. The diagnostic used 36,734 known model tokens and 76.47 arm seconds, but lower cost does not compensate for this quality loss. An after-score opt-in receipt-bound selector added the two CLI files and another importer read: File-F1 rose to **0.45455**, while Span-F1 remained **0.24979**. Neither variant is a prospective or matched win; the task and gold were already exposed, and DSH was not rerun.

The hints selected only the first roughly 35 source lines. Post-score diagnosis showed important CLI and core spans deeper in these files, while the model's final selected core spans were also shallow. The result rejects the simple task-term path-hint hypothesis as a complete fix. Source-path identification worked; useful span acquisition and finalization did not. Native score SHA-256 anchors are `0fa2f3867dd43e43ca809f7132841826417cd93de41691268a3a0309ccb0f3dc` (raw) and `d20c2b229d7655533a53bffae6750905956aa9f9ddf2ae3855f9cfadce373cce` (selector diagnostic).

## Open Questions

- Can source-only function-level Go windows provide relevant spans without losing precision or inflating tokens?
- Would a fresh matched task retain an accuracy and efficiency advantage under that revised mechanism?
