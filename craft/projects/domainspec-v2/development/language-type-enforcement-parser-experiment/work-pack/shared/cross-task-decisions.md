---
module: language-type-enforcement-parser-experiment
status: planned
updatedAt: 2026-07-17
docType: cross-task-decisions
---

# Cross-Task Decisions

| ID | Decision | Applies to |
| --- | --- | --- |
| LTE-D1 | `RegistryParsedCompletely(spec)` is the only L0 judgment; it is not whole-spec proof. | all tasks |
| LTE-D2 | Grammar, exact precedence, eight evidence branches, and emitted code values are frozen by the architecture. | SWU-LTE-001/002/003 |
| LTE-D3 | Pure leaf lives in the existing engine package and is exposed through `@domainspec/test-derivation-engine/concept-registry`. | SWU-LTE-001/002 |
| LTE-D4 | Adapters emit `[LTE-*]` plus compatible existing detail; output carriers and exit conventions stay stable. | SWU-LTE-002/003 |
| LTE-D5 | L0 may preserve authored `metaType` but may not admit or reject it against profile/schema authority. | all tasks |
| LTE-D6 | Parity must invoke both consumer surfaces; two direct kernel calls are not evidence. | SWU-LTE-003 |
