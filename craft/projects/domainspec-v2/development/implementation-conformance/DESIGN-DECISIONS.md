# Design Decisions

| ID | Decision | Alternatives rejected or deferred | Consequence |
| --- | --- | --- | --- |
| DES-D01 | Use a pure L0 contract/normalization kernel with external evidence-provider interfaces. | shared tool runner, daemon, scheduler, CI service | Native execution and repository access remain integration-owned. |
| DES-D02 | Bind all evaluation inputs by id, version, and digest before interpretation. | trust current paths or generated indexes by proximity | Stale or disagreeing inputs fail closed before conformance evaluation. |
| DES-D03 | Keep code tags as the intended sole canonical implementation-symbol mapping owner; `ImplementationBinding` is a reconciled view. | package-owned binding registry | The package cannot write canonical identity and must surface mapping disagreements. |
| DES-D04 | Consume Architecture-Pattern Enforcement findings instead of re-running or redefining admitted architecture laws. | duplicate layer/cycle/direction validator | Structural findings retain their original owner and evidence reference. |
| DES-D05 | Make edge policy explicit in the profile: `direct-rule-leaf` or an owner-admitted public-index alternative. | silently make direct leaf universal | The v1 conflict stays visible and no evaluator may choose a policy implicitly. |
| DES-D06 | Share a total normalized result algebra—`pass`, `fail`, `unsupported`—while keeping language-native raw diagnostics. | diagnostic text equivalence or a universal parser | Cross-language comparison is bounded to meaning and claim limits. |
| DES-D07 | Give each language realization an explicit unsupported set. | heuristic fallback or filename-only proof | Indeterminate constructs block rather than produce false confidence. |
| DES-D08 | Treat runtime State Machine checks as application-owned fixture evidence. | package-owned runtime, workflow engine, effect dispatcher | Formation, exhaustiveness, topology, transition behavior, and effect delivery remain separate claim classes. |
| DES-D09 | Return receipt material as a value; persistence, publication, retention, and access are caller-owned. | package database or receipt service | Persistence architecture is N/A but data lifecycle remains required. |
| DES-D10 | Split invalid-envelope rejection from conformance failure. | treat every failure as no-receipt rejection | A valid, fully bound evaluation may emit a failing/unsupported receipt; stale or malformed envelopes do not emit a passing receipt. This requires an upstream State view clarification. |
| DES-D11 | Define migration compatibility but not rollout waves. | flag-day tag rewrite or deployment plan | Code-tag projection reconciliation is designed; execution sequencing waits for Plan and owner closure. |
| DES-D12 | Use CAV2 authority discipline and private pattern evidence without claiming a CAV2 architecture-pattern ontology import. | promote an inferred ontology | Pattern generalization remains an owner-reviewed future artifact. |

