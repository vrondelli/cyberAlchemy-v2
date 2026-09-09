# AlchLang Typed Backend Definition Drift Audit

Status: candidate audit at A0 closure

## Selected dependency bytes

| Dependency | SHA-256 | Purpose |
| --- | --- | --- |
| `projects/domainspec-v2/definitions/meta-types/meta-types.md` | `c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51` | Three-voice upstream meanings for DS-D1.5, DS-D1.6, DS-D1.8, and DS-D1.13 |
| `projects/domainspec-v2/definitions/meta-types/meta-types.yml` | `bc800afdca36fa701a13ec611e7ee0ef928a4c8d259d48dfac2880a3cc8cbbc4` | Machine index and active status for the four upstream meta-types |
| `projects/domainspec-v2/impl/cli/src/typed-backend/contracts.ts` | `c27e5f34c29a11706e7b43bf8c50808dd576993888d8d625f8054d256d971307` | Current closed typed contract shapes and compile-time failures |
| `projects/domainspec-v2/impl/cli/src/generation/generators.ts` | `6c6fcbef1f93b4f81f47277a255032b195d609a58fdd6a4932133292b56ad593` | Current cross-language runtime behavior used only to identify drift |
| `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/ast.ts` | `cb04ef17df17704836497a00abd718afd2115e290882f1aa60e625d43c2c3b51` | Existing DS-SFOL term, declaration, sort, and quantifier contracts used as the upstream semantic boundary |
| `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/contracts.ts` | `d50954e642ceec7989e8ffda871c2f710ac6d23cd2fe7d5d6ce42fed3a8ebbf4` | Existing DS-SFOL deterministic contract behavior and diagnostics |

Only these selected dependencies control this audit. Unrelated ontology or
repository drift is diagnostic and cannot change this candidate's status.

## Findings

| Finding | Current evidence | Required remediation | Routed DAG node | Status |
| --- | --- | --- | --- | --- |
| `ALCH-TB-DRIFT-001` | `implementation/src/model.ts` originally had no normalized Query, Calculation, Mapping, or Policy carriers. | Add distinct typed carrier records and compilation-plan outputs; do not collapse them into Action or Rule. | `A4` | resolved by distinct normalized carriers and plan contracts |
| `ALCH-TB-DRIFT-002` | `implementation/src/parser.ts` originally accepted action-centered headers only. | Add explicit grammar for all four constructs and causal syntax failures. | `A4` | resolved by explicit `query`, `calculation`, `mapping`, and `policy` grammar |
| `ALCH-TB-DRIFT-003` | The compiler originally could not trace these four constructs from source through generated files. | Add deterministic lowering and per-output trace-ledger bindings. | `A4` | resolved by four contract projections and trace-ledger entry classes |
| `ALCH-TB-DRIFT-004` | DomainSpec TypeScript uses safe integers, Python does not enforce the UInt64 upper bound, and Rust uses `u64`. | Converge all generated targets on checked UInt64 behavior and aligned error classes. | upstream follow-up | retained outside this TypeScript-only AlchLang successor; its TypeScript runtime uses checked UInt64 `bigint` |
| `ALCH-TB-DRIFT-005` | DomainSpec Mapping defaults retain scalar values in TypeScript/Python but are stringified in the current Rust map representation. | Generate a shared typed value representation or explicitly narrow the accepted Mapping value domain. | upstream follow-up | retained outside this TypeScript-only AlchLang successor |
| `ALCH-TB-DRIFT-006` | DomainSpec ordered predicates accept like-typed strings or integers in TypeScript/Python while the current Rust runtime parses only UInt64. | Define and implement one cross-target orderable scalar set without implicit coercion. | upstream follow-up | retained outside this TypeScript-only AlchLang successor |
| `ALCH-TB-DRIFT-007` | Policy generators return selectors and do not execute them. | Preserve this boundary; add a regression proving selection never implies execution authority. | `A5` | resolved by selector-only evaluation and hostile regression test |
| `ALCH-TB-DRIFT-008` | AlchLang called every logical node `Expression` and exposed a separate predicate-named API. | Introduce explicit SFOL term/formula types and make predicate APIs compatibility aliases. | `A4` | resolved by `SfolTerm`, `SfolFormula`, `SfolUInt64Term`, `parseSfolFormula`, and `evaluateSfolFormula` |
| `ALCH-TB-DRIFT-009` | Source files did not select a logic profile. | Add a fail-closed `logic sfol-v1` selector while retaining carrier-v2 default compatibility. | `A4` | resolved by explicit source syntax, normalized profile identity, and hostile unknown-profile test |
| `ALCH-TB-DRIFT-010` | SFOL, Integration Bindings, runtime providers, and operational evidence could be described without one explicit non-collapse boundary. | Define and test the semantic-to-operational layer boundary; retain ORODI as the accepted operational evidence term. | `A0` | resolved in candidate definitions, capability, ontology, DomainSpec source, and language guide |

## Audit result

- Definition voices missing: 0
- Undefined critical terms: 0
- Conflicting canonical definitions: 0
- Downstream findings recorded: 10
- Resolved in this AlchLang successor: 7
- Retained upstream cross-language findings: 3
- Promotion or authority effect: none

This audit records construction work; it does not make the definitions accepted
or the downstream implementation conformant.
