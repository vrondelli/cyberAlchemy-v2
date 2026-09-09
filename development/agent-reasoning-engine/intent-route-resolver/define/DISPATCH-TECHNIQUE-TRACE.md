# Define Dispatch Spec technique trace

| Technique | Applied to | Concrete effect | Validation expectation |
|---|---|---|---|
| `sequence` | intent -> disposition -> host decision -> owner execution | fixes ordering so advisory output cannot become execution | architecture and plan preserve the sequence |
| `artifact_contract_bridge` | existing `IntentRecord` and new resolver contract | reuses the selected-local intent boundary without redefining it | design links exact source contracts |
| `owner_boundary_check` | resolver, Augmentor, ResonantOS, Dispatch Spec, Continuation Router, Orchestrate | prevents duplicate route, run, approval, and execution owners | non-overlap table remains explicit |
| `residue_ledger` | projection fitness, live catalog compiler, quality evaluation | keeps unproved work visible | blockers/deferrals carry into Plan |
| `concrete_path_evidence` | private engine development and implementation paths | binds the plan to exact repository targets | work-pack names exact write scopes |

Subagent strategy: one bounded read-only helper audited reuse and overlap. This
was a repository background helper, not a governed multi-agent dispatch. It
made no mutations and returned a terminal receipt.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
