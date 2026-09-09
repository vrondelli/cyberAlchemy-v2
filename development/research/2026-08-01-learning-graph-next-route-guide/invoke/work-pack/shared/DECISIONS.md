# Cross-Task Decisions

| ID | Decision | Applies to |
| --- | --- | --- |
| PD-001 | Execute serially; overlapping compiler/host baselines forbid parallel mutation. | all SWUs |
| PD-002 | New generated artifacts live under the existing ontology experiment's `learner-projection/` folder. | 001–004, 010 |
| PD-003 | UI integration modifies the existing host only after learner-view mutation admission; no standalone generic HTML product. | 005–009 |
| PD-004 | Static structure, presentation, parity, and keyboard behavior are separate SWUs. | 006–009 |
| PD-005 | Browser acceptance uses the shared runtime and emits exact candidate receipts. | 010 |
| PD-006 | Task Session mutates product scope and writes session evidence; Invoke Refresh consumes separately produced owner evidence. | all mutation SWUs |
| PD-007 | Successor receipts create eligibility only; no successor is selected or launched automatically. | all SWUs |
| PD-008 | Positive-fixture derivation and the LegacyLimitRule gap response are independently accepted. | 003–004 |
| PD-009 | Learner-view mutation admission, semantic-admission evidence, and destination-owner identity/admission are disjoint. | all SWUs |
