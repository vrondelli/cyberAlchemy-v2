# Glossary: DomainSpec Implementation Conformance

Terms in this file are package-local unless marked existing authority-owned.
Nothing here promotes a canonical definition.

| Term | Meaning | Posture |
| --- | --- | --- |
| Implementation Conformance | Evidence-backed agreement between an admitted semantic identity/profile and a bounded implementation realization. It is not semantic correctness, runtime correctness, release, or production satisfaction. | package purpose |
| `ImplementationConformanceProfile` | Authored configuration referencing an existing semantic-profile id/version/digest and declaring source classes, realizations, evaluators, exclusions, obligations, and claim limits. | proposed; owner acceptance required |
| `ImplementationBinding` | Exact record connecting a canonical concept/edge to a source unit, entry point, language, digest, and selected profile. | proposed; code-tag-owned identity after reformulation |
| `Obligation` | Existing content-addressed request for a derivable check. | authority-owned; reused unchanged initially |
| `StateMachineRuntimeContract` | Application-owned fixture contract for states, transition selection, guard, effect intent, invariants, and named valid/invalid inputs. | proposed; not a new ontology kind |
| `ExceptionRecord` | Possible complete cross-tool exception reference. It never deletes the underlying finding. | deferred; no acceptance owner |
| `EvaluationReceipt` | Generated evaluator-family evidence binding inputs, versions, digests, findings, skips, unsupported cases, and raw artifacts. | proposed projection; never authority |
| `NativeEvaluationBundle` | Language-adapter result carrying native diagnostics and raw evidence without claiming acceptance. | package-local transport |
| Rule leaf | The bound callable implementation unit for one canonical Rule identity. | profile realization, not semantic identity |
| Direct Rule-use edge | Source dependency from a bound Operation/Query use case to its Rule leaf. | proposed profile decision |
| Public-index edge | Dependency through a module public API/barrel rather than the bound Rule leaf. | existing v1 precedent; conflicts with direct-leaf rule |
| Exact binding | One admitted concept resolves to exactly one admitted binding and entry point. | portable candidate invariant |
| Native evidence | Output owned by formatter, compiler, type checker, graph tool, or application fixture. | observed evidence, not package authority |
| Finding | Stable normalized diagnostic retaining the native diagnostic and owner route. | generated nested receipt record |
| `unsupported` | The implementation construct cannot be determined by the admitted evaluator boundary. It blocks admission and never becomes pass. | fail-closed verdict |
| Claim limit | Explicit statement of what a check/receipt may and may not establish. | required profile/receipt field |
| Profile-local convention | Folder, filename, export, or function-style choice admitted only for a language/profile. | ergonomic policy, not portable semantics |
| Shared evaluator | Reconciliation and normalization kernel consuming owner-held inputs. | proposed; not runner/compiler/scheduler |
| Language realization | TypeScript, Python, or Rust mapping from shared obligations to native evidence providers. | proposed bounded adapter contract |

## Rejected Load-Bearing Terms

- `RuleDefinition`: duplicates the existing canonical `Rule`.
- `UseCase` as a new kind: the canonical target remains Operation or Query.
- `uses_rule` or `contains_transition`: duplicates or reverses existing semantic
  relationships.
- `EnforcementRuleSet`: conflicts with existing `RuleSet`; evaluator references
  stay inside the implementation profile.
- `Violation` as an authority-bearing kind: use nested `EvaluationFinding`.

