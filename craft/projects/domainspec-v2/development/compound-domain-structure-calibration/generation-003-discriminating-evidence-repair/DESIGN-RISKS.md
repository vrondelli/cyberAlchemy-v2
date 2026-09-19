---
artifact_id: CDSC3-DESIGN-RISKS-v0.1
status: owned
---

# Design Risks

| Risk | Consequence | Control | Owner |
| --- | --- | --- | --- |
| post-hoc target splitting | outcome optimization disguised as evidence repair | parent-field-only digests and adversarial vectors | L0 contract SWU |
| browser harness diverges from Savvy | invalid observations | pinned slices, baseline equivalence, stop on drift | baseline SWU |
| screenshot-only proof | non-replayable evidence | structured DOM/route state required | observation SWUs |
| mutation edit-surface leak | experiment no longer tests one variable | generated adapter allowlists and diff receipts | observation SWUs |
| usefulness planner circularity | candidate assumed useful by construction | finite preregistered catalog, two planners, accept empty `D` | usefulness SWU |
| UI-repair ownership collapse | duplicated portability policy or false pass | handle import only and below-threshold assertion | L0/import validator |
| adjudicator sees desired result | biased matrix | evaluator output absent until overlay freeze | adjudication SWU |
| generation append conflict | corrupted history | preflight, atomic append, duplicate/wrong-tail tests | evaluation SWU |
| local completion read as promotion | authority inflation | prohibited inferences, independent audit, Inventory read-model boundary | all SWUs |
| browser unavailable | evidence task cannot run | L0 runtime preflight returns BLOCK before mutation writes | harness contract SWU |

No risk is silently accepted. Browser unavailability is an execution blocker;
the remaining risks have explicit validators or owner routes.
