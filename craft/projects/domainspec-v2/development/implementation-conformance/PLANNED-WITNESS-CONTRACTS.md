# Planned Witness And Validator Contracts

Status: Design contracts only. No product witness below has been implemented or
executed. `DESIGN-PLANNED-WITNESSES.json` carries the machine-readable
`planned-design-contract` evidence state.

## Fixture Specifications

| Fixture ID | Claim | Polarity | Target | Input or violation | Expected result | Execution owner | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `witness:baseline-three-language` | shared meaning can be represented through bounded realizations | positive | TypeScript, Python, Rust | one admitted Rule, one Operation, direct edge, exact binding, exhaustive State Machine fixture | language-native passes normalize to comparable evidence without erasing differences | language fixture owners | implementation/validation |
| `witness:empty-rule-root` | scope cannot pass by vacuity | negative | coverage evaluator | selected Rule root has zero admitted Rule bindings | fail `DSV2-RULE-ROOT-EMPTY` | package validator owner | validation |
| `witness:unresolved-rename` | filename does not repair stale identity | negative | binding reconciler | source file renamed while tag/index still name old unit | `DSV2-BINDING-UNRESOLVED` or `DSV2-GENERATED-STALE`; never inferred pass | code-tag and package validator owners | validation |
| `witness:duplicate-binding` | exact cardinality is enforced | negative | binding reconciler | two admitted source entries bind one canonical Rule | fail `DSV2-BINDING-DUPLICATE` | package validator owner | validation |
| `witness:barrel-bypass` | edge policy is explicit | negative | source graph | profile selects direct Rule leaf but use case imports a barrel/public index | fail `DSV2-USE-EDGE-NONDIRECT`; profile conflict remains owner-visible | architecture/provider adapter owner | validation |
| `witness:dynamic-source` | indeterminate source does not pass | negative | each language adapter | computed TS/Python import or unsupported Rust dynamic/macro-generated edge | typed blocking `unsupported` or language-specific fail per admitted contract | language adapter owners | validation |
| `witness:stale-generated-projection` | generated evidence is freshness-bound | negative | binding/provenance | generator/config/source/output/tool digest disagreement | fail `DSV2-GENERATED-STALE` | projection and package validator owners | validation |
| `witness:suppressed-required-evidence` | suppression cannot erase finding | negative | native normalization | native suppression hides a forbidden edge or required diagnostic | retain underlying finding plus `DSV2-EXCEPTION-INVALID`; no accepted-with-exception | language adapter and package validator owners | validation |
| `witness:cycle-and-direction` | topology findings remain distinct | negative | architecture evidence | Rule imports use case and graph also cycles | separate `DSV2-MODULE-DIRECTION` and `DSV2-MODULE-CYCLE` findings | Architecture-Pattern Enforcement/provider owner | validation |
| `witness:new-state-nonexhaustive` | native exhaustiveness is consumed | negative | compiler/type evidence | canonical State Machine gains a state not handled in implementation | native error retained and normalized as `DSV2-STATE-NONEXHAUSTIVE` | language adapter owners | validation |
| `witness:invalid-transition` | runtime contract checks negative behavior | negative | application fixture | attempt transition from already-approved state | expected `DSV2-TRANSITION-NOT-ALLOWED`; success fails `DSV2-TRANSITION-ACCEPTED-INVALID` | application runtime owner | validation |
| `witness:orphan-source` | in-scope leaves require identity | negative | binding coverage | Rule-like source leaf has no admitted canonical concept | fail `DSV2-RULE-ORPHAN` | tag and package validator owners | validation |
| `witness:deterministic-receipt` | output is content-addressable | positive/negative | receipt builder | replay identical canonical inputs, then mutate one bound digest | identical input is byte-identical; changed digest changes identity or blocks stale input | package validator owner | validation |
| `witness:raw-diagnostic-retention` | normalization keeps native evidence reachable | positive | receipt/query | normalize one native diagnostic in each language | `ExplainImplementationFinding` reaches redaction-aware raw reference and tool identity | data and adapter owners | validation |
| `witness:evidence-non-authority` | receipt changes no authority | negative | package API and authority boundary | passing receipt is supplied without external owner decision | no admitted/promoted/released state transition exists; owner route remains external | authority and package validator owners | validation |

## Per-Language Mutation Contract

| Mutation family | TypeScript | Python | Rust | Required shared observation |
| --- | --- | --- | --- | --- |
| duplicate/missing/orphan binding | exact code-tag/source projection | exact module/symbol projection | exact module/function projection | stable cardinality finding; filename cannot repair |
| indirect edge | barrel/path alias when deterministically resolved | package re-export when deterministically resolved | explicit re-export when bounded reader resolves | enforce selected edge policy; otherwise `unsupported` |
| dynamic loading | computed `import()` | `importlib`/runtime construction | dynamic link/runtime loading | never pass; Rust initially `unsupported` |
| generated source | generated barrel/project output | generated module | build script/`OUT_DIR` module | source/generator/config/output/tool digests required |
| non-exhaustive state | missing `never` branch | missing `assert_never`/match branch | non-exhaustive `match` | native compiler/type diagnostic retained |
| suppression | lint disable/ignore | noqa/type ignore/tool suppression | allow attributes/tool suppression | underlying required finding retained |

## Validator Contracts

| Contract ID | Claim | Target contract | Accepted binding | Verdicts | Stale rule | Self-issue rule | Validator owner | Evidence state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `VC-DESIGN-SCOPE` | Design denominator is exact and closed | `DESIGN-SCOPE-MANIFEST.json` | manifest input digest plus repository path digests | pass/block | any path or digest change blocks | detector identity cannot author manifest | `invoke-design-scope-extractor` plus selection validator | executed Design validation only |
| `VC-DESIGN-SELECTION` | concern selection is total and stable | denominator + authored concerns + planned witnesses | denominator receipt digest | pass/block | stale receipt blocks | selection validator differs from manifest author/detector | `invoke-design-selection-validator` | executed Design validation only |
| `VC-EXACT-BINDING` | every admitted in-scope concept has exactly one current binding and callable | profile, owner mapping, indexes, source digests | exact supported schema/version/digests | pass/fail/unsupported | any owner/source/projection change invalidates result | evaluator cannot write canonical mapping | future package validator owner | planned, unexecuted |
| `VC-NATIVE-BUNDLE` | language result mapping is total and reproducible | `LanguageEvaluatorAdapter` contract | adapter/language/tool/config/source digests | pass/fail/unsupported | any bound digest change invalidates bundle | adapter cannot certify package result | future language adapter validator | planned, unexecuted |
| `VC-RECEIPT-DETERMINISM` | receipt material is deterministic and non-authoritative | `EvaluationReceipt` contract | all canonical input/output digests | pass/fail | changed input creates new identity; stale input blocks | receipt builder cannot validate authority movement | future package validator owner | planned, unexecuted |
| `VC-RUNTIME-CONTRACT` | named valid/invalid transition behavior matches application fixture | `StateMachineRuntimeContract` | State Machine/profile/fixture/runtime digests | pass/fail/unsupported | any contract/runtime digest change invalidates result | application fixture cannot admit the semantic State Machine | application runtime validator | planned, unexecuted |

## Acceptance Boundary

A future Plan may turn these contracts into runnable fixtures only after the
direct-edge policy, supported-profile admission, code-tag reformulation, and
receipt lifecycle clarification are owner-closed. Until then, these tables are
specifications, not test results or mutation readiness.
