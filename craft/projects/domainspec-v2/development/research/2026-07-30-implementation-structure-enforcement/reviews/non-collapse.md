# Non-collapse review

## Definitional-soundness verdict

**REVISE.** Keep the exact-binding architecture, separate enforcement classes, and explicit claim ceilings. Do not forward the current candidate vocabulary unchanged.

The synthesis correctly rejects a universal linter, blanket arrow-functions-only, single-export uniformity, folder layout as ontology, state diagrams as runtime proof, generated output as canonical, and receipts as authority. Its remaining defect is noun inflation: several proposed objects are configuration fields, nested evidence records, or existing DomainSpec/CAV2 concepts rather than independent types.

Most importantly, the exact-binding contract depends on an undeclared `RuleImplementationBinding` while separately proposing `UseCaseBinding` and `MetaTypeImplementationBinding` (`synthesis.md:61-75,91-94`). These are one implementation-binding concept with kind-specific constraints.

## Required non-collapse

| Surface | Owner and invariant | Distinct failure/evidence |
|---|---|---|
| Semantic ontology | DomainSpec DS-D1/DS-D2 owners. `Rule` is already DS-D1.7 and `State Machine` DS-D1.14; canonical `enforces` is Rule→Operation and `transitions` is Event→State Machine. | Formation or unconstructible-edge diagnostic from the existing validators. `projects/domainspec-v2/definitions/meta-types/meta-types.yml:153-170,262-279`; `definitions/relationships/relationships.yml:104-114,133-145`. |
| Semantic profile admission | Existing minted-profile owner selects admitted kinds and relationships. Active DS-D1 membership does not imply profile admission: the current experimental profile includes Rule but omits State Machine. | Profile-admission failure and compiler receipt. `definitions/minted-project/supported-profiles.yml:1-69`. |
| Implementation profile | Candidate configuration selecting source classes, bindings, obligations, evaluators, language realizations, exclusions, and claim limits. It must reference semantic authority, not redefine it. | Invalid/missing profile references or unacknowledged language residue; profile-validation evidence. Owner remains Wave-0 residue. |
| Source code | Language-owned modules, symbols, imports, and runtime callables. | Missing/duplicate binding, unresolved symbol, forbidden dependency, or type error; AST/import-graph/compiler output. Source files do not become semantic authority. |
| Evaluator obligation | A content-addressed check request. Existing implementation precedent already owns an `Obligation` IR with key, rule type, source anchor, parameters, and description. | `pass`, `fail`, `unsupported`, or exception disposition plus a finding. Extending the existing IR requires its owner; research cannot silently widen it. `implementation/domainspec/tools/test-derivation-engine/src/ir/types.ts:65-92`. |
| Runtime behavior | An implementation executes guard, transition, and effect-intent behavior under named inputs. | Runtime rejection, wrong transition/effect, or invariant failure; trace/test evidence. The existing State Machine formation schema checks only `has_transitions=yes`, so it is not runtime proof. `impl/spec/meta-types/lifecycle/state-machine.schema.yml:1-26`. |
| Generated projection | Generator-owned, provenance-bound output that may be bound for execution but is never canonical source. | Source/generator/config/output digest drift; provenance receipt. CAV2 explicitly classifies generated projections as read models, not promotion decisions or canonical sources. `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48-88`. |
| Receipt | Evaluator-produced evidence about one run and named digests. | Missing disposition, unbound input, stale digest, or claim-limit violation. It cannot promote, redefine, or authorize anything. `AUTHORITY-MODEL.md:122-133`. |
| Authority | Existing narrow owner route and promotion gate. | `pass`, `flag`, `block`, or `defer`, evidenced by an owner decision/authority record—not an implementation receipt. `AUTHORITY-MODEL.md:24-69,135-142`. |

## Candidate-object decisions

| Current candidate | Decision | Repair |
|---|---|---|
| `ImplementationProfile` | **RENAME** | `ImplementationConformanceProfile`. “ImplementationProfile” is too easily collapsed with the existing semantic/minted profile. It remains authored configuration, not ontology. |
| `LanguageProjection` | **MERGE** | Embed `language_realizations[]` in the conformance profile for the initial model. Each row records language, evaluator bindings, `realized`, `unsupported`, or residue. “Projection” otherwise collides with the generated-projection authority posture. Extract a reusable object only after independent versioning/reuse is witnessed. |
| `ModuleBoundary` | **MERGE** | Represent as an `Obligation` of class `module-topology` with source/target classes, direction, cycle policy, exclusions, and negative fixture. It has no independent lifecycle. |
| `RuleDefinition` | **MERGE** | Use canonical DS-D1 `Rule`; eliminate the candidate name. A second Rule type would duplicate `meta-types.yml:153-170`. |
| `EnforcementRuleSet` | **MERGE** | Use `ImplementationConformanceProfile.evaluators[]` initially. If independently shared/versioned later, extract an `EvaluatorBundle`; never call it a RuleSet because DomainSpec already owns Rule semantics. |
| `UseCaseBinding` | **MERGE** | Use one `ImplementationBinding`. Its canonical target is an Operation or Query identity; “use case” is an implementation role, not a new semantic kind. |
| `MetaTypeImplementationBinding` | **MERGE** | Same `ImplementationBinding`, carrying `concept_ref`, resolved kind, semantic-profile admission, implementation unit, entry point, language, and source digest. |
| Implicit `RuleImplementationBinding` | **MERGE** | Same `ImplementationBinding` with Rule-specific callable/type/topology obligations. This closes the current vocabulary hole at `synthesis.md:91-94`. |
| `StateMachineContract` | **RENAME** | `StateMachineRuntimeContract`. It references a canonical State Machine but owns only executable state, transition-selection, guard, effect-intent, and runtime-invariant semantics. |
| `Transition` | **RENAME** | Nested `runtime_transition` record only. Do not create a general `Transition` type or reuse canonical DS-D2 `transitions`. |
| `EnforcementObligation` | **MERGE** | Reuse/extend `Obligation`; do not create a second obligation model. **DEFER** the actual IR extension until its owner accepts new class/evaluator/claim-limit fields. |
| `Violation` | **MERGE** | Nested `EvaluationReceipt.findings[]` record. It has no independent authority or lifecycle; `EvaluationFinding` is a safer field label. |
| `Suppression` | **DEFER** | Owner and gate semantics are unresolved. If admitted, name the governed record `ExceptionRecord`; native suppressions are only language-specific representations. A valid exception must never delete the underlying finding. |
| `Migration` | **DEFER** | The generic name is too broad. If profile adoption requires a durable record, use `ProfileMigrationRecord` under the selected owner. The existing import manifest is precedent, not automatically the owner of all implementation-profile migration. |
| `DomainSpecGeneratedProjection` | **KILL** | Do not add a new type. Classify the artifact under the existing generated-projection posture and require provenance metadata. CAV2 already owns the projection/evidence/authority distinction. |
| `ReceiptEnvelope` | **RENAME** | `EvaluationReceipt`, a generated evidence artifact scoped to one evaluator family and claim limit. It is not an ontology kind and never authority. |

The free-standing candidate relation vocabulary at `synthesis.md:77-85` should also be removed. `uses_rule`, `contains_transition`, `guarded_by`, `violates`, `reports`, and `migrates` belong as typed fields or local edges inside the profile, runtime-contract, migration, or receipt schemas. They are not new DS-D2 or CAV2 ontology relationships.

## Enforcement-model repair

The first eight concerns are defensible checks, with one required split and one rename:

- **KEEP** lexical/style, source-shape/AST, module topology, and static type as separately diagnosable check classes.
- **KILL** the combined “DomainSpec formation/profile” layer. Formation and profile admission must remain separate because State Machine is active in DS-D1 but absent from the current admitted four-kind profile.
- **KEEP** DomainSpec graph validation separately from both formation and admission.
- **RENAME** “projection/parity” to **binding and provenance reconciliation**. It checks exact concept-to-code bindings and source/generated digests; it does not manufacture semantic equivalence.
- **KEEP** runtime/temporal checks separately from schemas, diagrams, exhaustiveness, and import graphs.
- **RENAME** evidence/accounting from an enforcement layer to a cross-cutting **evidence channel**.
- **RENAME** authority/promotion from an enforcement layer to an external **authority gate**.

Receipts and authority are therefore not layers 9 and 10 in a single proof ladder. Every check may emit evidence, and only a separate owner gate may decide what governs.

## Required rejections

**KILL universal arrow-functions-only.** ESLint describes function style as a preference, notes that its rule does not apply to every function, and distinguishes declarations from expressions and arrows. Python lambdas cannot contain statements or annotations, while Rust closures capture their environment and have unique anonymous types unlike ordinary `fn` items. There is no semantics-preserving Python/Rust equivalent of a TypeScript arrow-only law. Sources: [ESLint `func-style`](https://eslint.org/docs/latest/rules/func-style), [Python lambda expressions](https://docs.python.org/3/reference/expressions.html#lambdas), [Rust closures](https://doc.rust-lang.org/reference/expressions/closure-expr.html), [Rust functions](https://doc.rust-lang.org/reference/items/functions.html).

**KILL folder cleanliness as composability proof.** The proposed tree is acceptable only as profile-local source classification (`synthesis.md:106-137`). A composability verdict additionally requires canonical graph agreement, resolved module dependency, exact binding, and a non-vacuous invocation fixture. Empty or beautifully named folders prove none of these.

**KILL state diagrams as runtime guarantees.** DS-D1 formation proves only that a State Machine declares transitions; DS-D2 `transitions` proves an Event→State Machine semantic edge. Neither proves guard evaluation, transition selection, effect ordering, persistence, retries, concurrency, idempotency, or compensation. The renamed runtime contract and executed fixture must carry that separate claim.

**KILL receipt-driven authority and generated-source authority.** Generated code may be executed and receipts may evidence its freshness, but canonical meaning remains at the selected source authority. CAV2 requires owner-routed promotion and states that evidence and successful validation do not redefine what was exercised (`cyberAlchemy-v2/SOURCE-MAP.md:23-33`; `authority/AUTHORITY-MODEL.md:122-133`).

## Smallest repaired vocabulary

The initial candidate needs only:

1. `ImplementationConformanceProfile`
2. `ImplementationBinding`
3. existing `Obligation`, extended only through its owner
4. `StateMachineRuntimeContract`
5. deferred `ExceptionRecord`
6. generated `EvaluationReceipt`

Language realizations, module-boundary constraints, evaluator references, runtime transitions, findings, provenance, and migration data remain nested records or existing governed artifact classifications.

This vocabulary preserves a strict chain:

```text
canonical DomainSpec identity
  -> admitted semantic profile
  -> implementation conformance profile
  -> implementation binding
  -> source and evaluator checks
  -> observed runtime behavior
  -> generated evaluation receipt
  -> separate owner authority decision
```

The synthesis remains proposal-only. Nothing reviewed here proves implementation, cross-language parity, promotion, release, or production readiness.
