# G02 Flipt import/export matched development pair

The unchanged G02 ranker snapshot (`5a0b40b99bbf798bddc537c2c234010425835d0d758a38c2e606eede6eaf31b9`) completed another source-only matched ARE–DSH pair on Flipt Go task `153337fe` (import/export namespace and version metadata). The same one-command driver froze the task and candidate, ran both arms, sealed predictions and costs, then invoked native scoring. Full receipts are at `/opt/are-benchmark-runs/g02-cross-layer-flipt-import-export-r1` on the GLM VPS. SHA-256 anchors: `FREEZE.json` `fe56d4111aef66669a99bafc677da9dc54cadd0041f950c56a5c08e2eb190266`; `PAIR-PRE-SCORE-SEAL.json` `b51092d5a3d3523a170bea27f2e2d26d3f276c0c3ba8456720b60cacf43bd25d`; `PAIR-DECISION.json` `8e0be5b1e4b1510c6ee6b5029905b54f3371bb3aa63ef98846b37fc3974fffb5`.

| Arm | Native Span-F1 | Native File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.40703 | 0.30000 | 89,332 | 129.92 |
| DSH | 0.43204 | 0.30000 | 405,960 | 324.91 |

ARE saved **78.0% tokens** and **60.0% time**, but lost Span-F1 by **0.02500** and tied File-F1. The predeclared strict four-gate decision is **fail-quality**. Both arms selected the same three core files: `internal/ext/common.go`, `internal/ext/exporter.go`, and `internal/ext/importer.go`. Gold spans 17 files, including CLI entrypoints, tests, test fixtures, and supporting subsystems. Those other files were not delivered to ARE. The task is now exposed; these labels are diagnosis only.

Together with the [database-config Flipt pair](../g02-flipt-dbconfig-pair-r1/RESULT-NOTE.md), this shows strong cross-repository token/time savings but no strict Flipt quality pass for the current candidate. The next source-only hypothesis should improve objective-term-to-path acquisition and adjacent test/CLI delivery in Go, then be evaluated on a different task. Simply changing the final selector cannot recover files that were never read.

## Open Questions

- Can a generic, task-term-weighted path selector find CLI/test/fixture neighbors without overfitting to this exposed import/export task?
- Will a new Go acquisition candidate retain the substantial efficiency advantage on a fresh matched task?
