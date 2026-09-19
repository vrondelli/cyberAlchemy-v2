# Design Dispatch Spec technique trace

| Technique | Applied to | Validation expectation | Status |
| --- | --- | --- | --- |
| `sequence` | Define → closed scope → denominator → selection → six views | Plan cannot begin before selection pass | pass |
| `artifact_contract_bridge` | receipt, diagnostics, pagination, source manifest, acceptance binding | each interface has planned positive/negative witnesses | pass |
| `authority_split_gate` | profile, conformance, CLI, evidence, release owners | no derived receipt changes owner authority | pass |
| `validation_loop` | extractor and two-pass selection | immutable inputs produce equal pass digests | pending until scripts run |
| `state_namespace_boundary` | source, generated result, release archive, diagnostic bundle | each namespace has one writer/retention rule | pass |
| `owner_boundary_check` | Invoke Design versus Plan/Task Session/release | Design emits no tasks or implementation admission | pass |
| `residue_ledger` | unexecuted witnesses and owner assignments | gaps remain visible without false evidence | pass |

Skipped: `ux-plan` because the CLI returns JSON and introduces no rendered
semantic interface; `deployment` companion because private tagged checkout is
a release boundary, not deployment.

