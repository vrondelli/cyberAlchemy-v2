# Exact-bound candidate synthesis

## Answer

The smallest defensible architecture is not a universal linter and not a new unified ontology. It is a four-part composition:

1. Existing DomainSpec definitions, relationships, formation schemas, and profile admission remain semantic authority.
2. A candidate `ImplementationProfile` declares language-neutral obligations and exact bindings to canonical DomainSpec identities.
3. TypeScript, Python, and Rust `LanguageProjection`s realize those obligations with ecosystem-native tools and explicitly record non-equivalence or residue.
4. A shared DomainSpec evaluator reconciles identity, topology, projection parity, generated provenance, exceptions, and normalized receipts. Its receipts are evidence, never authority.

The universal invariant is:

> Each admitted canonical Rule identity has exactly one registered implementation binding to one implementation unit and one callable public entry point, and every bound use case has a resolvable direct dependency on that entry point consistent with the canonical `Rule --enforces--> Operation` relation.

“One Rule per OS file,” “exactly one export,” and “arrow functions only” are not universal ontology facts. They may be profile-scoped projection policies only where they produce an observable DomainSpec verdict.

Evidence labels used below:

- **E1:** local-precedent explorer.
- **E2:** ontology-and-authority explorer.
- **E3:** language-tooling explorer.

## Current-state and disposition matrix

| Concern | Classification | Exact evidence | Disposition |
|---|---|---|---|
| DomainSpec meta-type and relationship semantics | **Observed, authority-owned** | E1: `projects/domainspec-v2/definitions/meta-types/meta-types.yml:1-8,153-170,261-278`; E2: `definitions/relationships/relationships.yml:1-18,101-146,517-548` | Keep as semantic inputs; do not redefine. |
| Strict TypeScript, criterion validation, relationship validation, code tags, derivation, minted compilation | **Already deployed, bounded** | E1: `impl/package.json:17-24,39-47`; `impl/tools/validate-content.ts:100-160`; `impl/tools/lib/relationship-signatures.ts:173-305,462-690`; `impl/tools/minted-project/compiler.ts:287-650` | Reuse individual owners; compose a new admission profile without collapsing their claims. |
| Executable file/module/import/export policy | **Gap** | E1: `implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:5-22`; `LAYERING-REFERENCE.md:49-99`; no executable checker found | Build from the owned layering references and compiler/receipt patterns. |
| Existing one-rule-per-file or single-export policy | **Not deployed** | E1: `impl/test-derivation-engine/src/rules/index.ts:1-79,130-209,696-729`; `implementation/domainspec/.../concepts/backend/rule.md:11-28` | Do not claim precedent. Make optional projection policy only. |
| Arrow-functions-only | **Not deployed; non-universal** | E1 found declarations widely used and no gate; E3: [TypeScript classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), [ESLint func-style](https://eslint.org/docs/latest/rules/func-style), [prefer-arrow-callback](https://eslint.org/docs/latest/rules/prefer-arrow-callback) | **KILL** blanket cross-language policy. A narrow TypeScript callback policy may be tested separately. |
| State-machine semantic formation | **Observed but shallow** | E1: `impl/spec/meta-types/lifecycle/state-machine.schema.yml:1-26`; `impl/test-derivation-engine/src/grammar/index.ts:800-870`; E2: current four-kind profile does not admit State Machine | Preserve existing kind; propose a separate runtime contract and fixture. |
| Runtime state transitions, guards, effects | **Gap** | E1: parser drops Guard/Effect; `agent-execution-orchestrator-module.ts:88-102` is an identity mapping rather than runtime transition proof | Add candidate contract plus runtime negatives; do not call current implementation a state machine proof. |
| Implementation-policy vocabulary and profiles | **Proposed research** | E2 candidate decisions and projection contract | Owner review required before schemas, ontology, or policy adoption. |
| TS/Python/Rust toolchains and fixture | **Proposed, documentation-supported** | E3 capability matrix and official documentation | Implement and execute before claiming project fit or parity. |

## Enforcement-layer model

| Layer | Owns | Evaluator and proof | Claim ceiling and source |
|---|---|---|---|
| 1. Lexical/style | Formatting, naming, local syntax preference | Formatter or native linter; clean diagnostic output | Style only. E2 obligation-layer map; E3 formatter profiles. |
| 2. Syntax/AST | Implementation-unit shape, public entry point, prohibited constructs | Stable language AST API or linter extension | Local shape only. E1 shows no current gate; E3: [ESLint custom rules](https://eslint.org/docs/latest/extend/custom-rules), [Python `ast`](https://docs.python.org/3/library/ast.html). |
| 3. Module topology | Direct binding, import direction, cycles, test/generated boundaries | Import graph plus shared binding reconciliation | Static graph, not runtime reachability. E1 dependency references; E3 dependency-cruiser and Import Linter profiles. |
| 4. Static type | Rule callable shape, use-case I/O, exhaustiveness | `tsc`, mypy, rustc | Type admissibility only. E3: [TS narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [mypy literal types](https://mypy.readthedocs.io/en/stable/literal_types.html), [Rust match](https://doc.rust-lang.org/reference/expressions/match-expr.html). |
| 5. DomainSpec formation/profile | Meta-type criteria and admitted kinds | Existing schemas/profile compiler | Formation and profile admission. E1 `meta-types.yml`; E2 `supported-profiles.yml:1-69`. |
| 6. DomainSpec graph | Endpoint, scope, multiplicity, canonical Rule→Operation relation | Existing relationship authority/validator | Declared graph only. E1 `relationship-signatures.ts:173-305,462-690`; E2 live count 31. |
| 7. Projection/parity | Profile/registry/source digests and deterministic generated views | Shared compiler/drift gate | Traceability, not authority. E1 `minted-project/compiler.ts:287-650`. |
| 8. Runtime/temporal | Actual guard decision, valid/invalid transition, effect intent, invariants | Runtime assertion and integration/property fixture | Observed execution only. E1 state-machine gap; E3 allowed-transition routing. |
| 9. Evidence/accounting | Obligation coverage, diagnostics, exceptions, tool/input hashes | Normalizer and admission gate | One reproducible run. E2 `ReceiptEnvelope`; E3 normalized receipt proposal. |
| 10. Authority/promotion | Whether a candidate governs future work | Existing owner route and governance gate | Authority verdict only. E2: `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-165`; `SOURCE-MAP.md:10-33`. |

These layers must remain separately diagnosable. Formatting cannot satisfy topology; compiler success cannot satisfy DomainSpec graph or runtime behavior; receipts cannot confer authority.

## Candidate implementation-policy vocabulary

No row below changes DS-D1, DS-D2, or CAV2 authority.

| Candidate object | Decision | Invariant and status | Evidence |
|---|---|---|---|
| `ImplementationProfile` | **KEEP** | Authored, versioned candidate configuration referencing semantic profile and registry digests; declares obligations, roots, exclusions, evaluators, fixtures, claim limits | E2 candidate type table; current minted profile remains a separate axis at `supported-profiles.yml:1-69`. |
| `LanguageProjection` | **KEEP** | Every universal obligation is realized, explicitly non-equivalent, or residue-bearing; no silent weakening | E2 projection contract; E3 capability asymmetry. |
| `ModuleBoundary` | **KEEP as profile policy** | Source/target classes, direction, cycle rule, exclusions, diagnostic, negative fixture | E1 layering references; E2 candidate type table. |
| `RuleDefinition` | **MERGE into DS-D1 `Rule`** | No parallel semantic Rule type | E2; `rule.schema.yml:1-28`. |
| `EnforcementRuleSet` | **RENAME and KEEP** | Digest-bound evaluator bundle; membership does not prove satisfaction | E2 candidate type table. |
| `UseCaseBinding` | **KEEP** | Exact Operation/Query identity, module, symbol, and referenced Rule bindings | E2 candidate relations; E1 found only a temporary fixture witness at `code-tag-composability.test.ts:29-62`. |
| `MetaTypeImplementationBinding` | **RENAME and KEEP** | References kind registry, profile admission, and formation separately; never redefines a meta-type | E2 candidate type table and non-collapse list. |
| `StateMachineContract` | **KEEP** | References canonical State Machine; explicitly names states, initial state, transitions, guards, effects, invariants | E2 candidate type table; E1 current runtime gap. |
| `Transition` | **Nested record only** | Unique ID, from/to, trigger, optional Rule guard, effect reference | E2. It must not redefine DS-D2 `transitions`, which means Event→State Machine. |
| `EnforcementObligation` | **MERGE into existing `Obligation`** | Add class/layer/evaluator/claim limit rather than a second obligation model | E2; E1 derivation-engine precedent. |
| `Violation` | **KEEP as generated evidence** | Retains obligation, subject, expected/observed, evaluator, severity, exception state | E2. |
| `Suppression` | **DEFER pending owner** | Must be explicit, scoped, justified, expiring, reviewable, and visible; never deletes a violation | E2 reports no accepted owner; E3 proposes required fields. |
| `Migration` | **KEEP as candidate ledger record** | Immutable before/after profile refs, subject inventory, compatibility/residue, rollback and receipts | E2; `projects/domainspec-v2/IMPORT-MANIFEST.md:1-20,57-97`. |
| `DomainSpecGeneratedProjection` | **RENAME and KEEP** | Generated, provenance-bound read model; never canonical | E2 avoids collision with CAV2 projections; E1 minted compiler precedent. |
| `ReceiptEnvelope` | **MERGE EvidenceReceipt** | Evaluator identity, exact input/config/tool digests, verdicts, violations, residue, claim limit | E2 and E3; evidence only. |

Candidate relations are implementation-policy relations, not new DS-D2/CAV2 authority edges:

- Profile composition: `references_semantic_profile`, `selects_language_projection`, `declares_module_boundary`.
- Binding: `binds_meta_type`, `binds_use_case`, `uses_rule`, `implements_state_machine`.
- Obligation/evaluation: `realizes_obligation`, `collects_rule`, `checked_by`.
- State contract: `contains_transition`, `guarded_by`.
- Evidence/projection: `violates`, `reports`, `projects_to`, `migrates`.

This set comes directly from E2’s candidate relationship table. In particular, profile enforcement must not reuse canonical DS-D2 `enforces`.

## Exact-binding contract

For one selected semantic and implementation profile:

1. **Coverage:** every admitted canonical Rule required by an admitted Operation has one `RuleImplementationBinding`.
2. **Uniqueness:** one `rule_id` resolves to exactly one implementation unit and one callable public entry point. Duplicate or absent bindings fail.
3. **Referential integrity:** the binding records canonical concept ID, source module, symbol, language projection, tool/profile version, and source digest.
4. **Semantic agreement:** `UseCaseBinding --uses_rule--> Rule` must agree with canonical `Rule --enforces--> Operation`; it cannot invent or replace the canonical relation.
5. **Directness:** the use-case implementation imports the bound leaf entry point directly. A barrel or re-export may exist for another API purpose but cannot satisfy the required edge.
6. **Direction:** the permitted graph is `use_case → rule → domain types/ports`. Rules may not import use cases, adapters, or tests; production may not import tests.
7. **Resolution:** the evaluator resolves the actual language module graph, path aliases, and public symbol—not filename resemblance.
8. **Non-vacuity:** configured roots must exist and contain classified source. Unregistered/orphan source files and empty expected directories fail.
9. **Invocation evidence:** static binding proves dependency only. A positive fixture must invoke the resolved callable; runtime reachability beyond the fixture remains residue.
10. **Generated integrity:** generated implementations retain source, generator, configuration, and output hashes; successful formatting never proves freshness.
11. **Typed negatives:** missing, duplicate, renamed, re-exported, dynamic, reverse, cyclic, stale-generated, suppressed, skipped, and empty-root variants each have distinct diagnostics.
12. **Receipt:** all obligations receive `pass`, `fail`, `unsupported`, or explicit exception disposition. No silent skip is allowed.

Build-from-owned evidence is E1’s minted containment/digest/error/receipt machinery at `impl/tools/minted-project/compiler.ts:287-650`. The need to replace regex proof and fail on empty roots comes from `check-code-tag-composability.ts:375-429,571-590` and `extract-code-tags.ts:16-38,62-99`.

## Folder, module, and import projections

The semantic contract is one registered implementation unit and entry point. The initial profile may project it as follows:

```text
feature/
  domain/
    rules/
      <rule leaf>
    types/
  application/
    use-cases/
      <use-case leaf>
    ports/
  state-machines/
    <machine contract/runtime unit>
  implementation-profile/
    bindings/
    obligations/
```

This is a candidate layout, not an ontology. Existing layering intent comes from E1’s `DEPENDENCY-RULES.md:5-22` and `LAYERING-REFERENCE.md:49-99`.

| Language | Rule unit and public surface | Use-case binding | Enforcement |
|---|---|---|---|
| TypeScript | `domain/rules/can-approve.ts`; recommended one named runtime export `canApprove`; helpers private or imported from owned modules | `import { canApprove } from "../../domain/rules/can-approve.js"` | ESLint/typescript-eslint custom AST rule, dependency-cruiser, `tsc`; E3: [custom rules](https://typescript-eslint.io/developers/custom-rules/), [dependency-cruiser rules](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md). |
| Python | `domain/rules/can_approve.py`; one registered callable `can_approve`; private helpers may remain in-module | `from ...domain.rules.can_approve import can_approve` | Public Python `ast`, Import Linter, mypy; `__all__` is not accepted as privacy proof. E3: [Python modules](https://docs.python.org/3/tutorial/modules.html), [Import Linter contracts](https://import-linter.readthedocs.io/en/stable/contract_types/). |
| Rust | `domain/rules/can_approve.rs`; one registered `pub(crate)` callable; private helper items are idiomatic | `use crate::domain::rules::can_approve::can_approve` | Rust module visibility, cargo metadata plus shared module validator, rustc/Clippy. E3: [Rust modules](https://doc.rust-lang.org/reference/items/modules.html), [cargo metadata](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html). |

Do not copy TypeScript’s “single export” into Python or Rust. The portable requirement is a single registered public callable entry, not a single syntactic item.

The initial bounded profile should support Rule, Operation/use-case binding, and one experimental State Machine fixture. Other meta-types receive `MetaTypeImplementationBinding` records only after formation-specific obligations are defined; a generic “one file per meta-type” law would erase differences among Entity, Event, Rule, Operation, and State Machine.

## State-machine contract

A candidate `StateMachineContract` references—rather than replaces—a canonical State Machine:

```text
machine_id
canonical_state_machine_ref
initial_state
states[]
transitions[
  transition_id
  from_state
  event_ref
  to_state
  guard_rule_ref?
  effect_ref?
]
invariants[]
```

Initial execution semantics should be deliberately narrow:

1. Resolve current state and event.
2. Reject if no transition exists.
3. Evaluate the referenced Rule guard when present.
4. If accepted, return the next state plus zero or more effect intents.
5. Execute external effects through application ports outside the pure transition decision.
6. Record guard result, selected transition, state result, effect intents, runtime result, and diagnostic/receipt hashes.

This split prevents a state-machine diagram from masquerading as runtime proof and prevents external I/O success from being attributed to the pure transition. E1 shows current parsing drops Guard/Effect and the product tag is not a runtime state machine; E2 separates contract from runtime proof; E3 shows compiler exhaustiveness cannot establish temporal correctness.

Atomic persistence, retries, cancellation, concurrent events, effect delivery, idempotency, and compensation remain **deferred**. The initial fixture uses a pure effect intent so it cannot overclaim those semantics.

## Universal obligations and language profiles

| Obligation | Universal verdict | TS realization | Python realization | Rust realization | Evidence |
|---|---|---|---|---|---|
| `OBL-RULE-IDENTITY` | Rule ID binds exactly once | Shared manifest + AST symbol resolution | Shared manifest + `ast` resolution | Shared manifest + module resolver | E2 exact binding; E3 one registered implementation. |
| `OBL-ENTRYPOINT` | One callable public entry per binding | Named export policy | Explicit imported function; helpers private by convention | One registered visible function; helpers private | E3 language projection rules. |
| `OBL-USE-EDGE` | Required direct use-case→Rule edge; reverse forbidden | dependency-cruiser + AST | Import Linter + AST | cargo metadata plus shared module analysis | E3 obligation routing; E1 no existing gate. |
| `OBL-RULE-TYPE` | Rule evaluates to the profile’s boolean/result contract | `tsc --strict --noEmit` | mypy strict | rustc/cargo check | E1 Rule criterion; E3 type-check profiles. |
| `OBL-STATE-EXHAUSTIVE` | All declared states handled | discriminated union + `never` | Enum/Literal + `assert_never` | exhaustive `match` | E3 official language docs. |
| `OBL-TRANSITION` | Valid transition accepted; invalid one rejected | runtime assertion/test | runtime assertion/test | type/state API where possible plus runtime test | E3 transition routing; E1 runtime gap. |
| `OBL-GENERATED-FRESH` | Generated bytes match exact source/generator inputs | Shared provenance gate | Same | Same; generators use Cargo `OUT_DIR` | E1 minted precedent; E3 [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html). |
| `OBL-EVIDENCE-COMPLETE` | Every obligation has a recorded disposition | Receipt normalizer | Receipt normalizer | Receipt normalizer | E2 ReceiptEnvelope; E3 receipt fields. |
| `OBL-EXCEPTION-VISIBLE` | Exception never erases underlying violation | Native annotation plus shared record | Native ignore plus shared record | preferably `#[expect(..., reason=...)]` plus shared record | E2 suppression deferred; E3 exception policy. |

Minimum proposed toolchains:

- **TypeScript:** Prettier; ESLint flat config with typed typescript-eslint; `tsc --strict --noEmit`; dependency-cruiser; existing test runner if selected; shared DomainSpec evaluator. Typed linting cost must be measured. Sources: E3, [typed linting](https://typescript-eslint.io/getting-started/typed-linting/), [TS project references](https://www.typescriptlang.org/docs/handbook/project-references).
- **Python:** Ruff; mypy strict; Import Linter; pytest JUnit; narrow repository-owned `ast` evaluator. Ruff does not expose a custom-rule plugin baseline, and mypy plugins are experimental. Sources: E3, [Ruff FAQ](https://docs.astral.sh/ruff/faq/), [mypy extension warning](https://mypy.readthedocs.io/en/stable/extending_mypy.html).
- **Rust:** rustfmt; `cargo check --workspace --all-targets`; build where generated diagnostics matter; pinned Clippy; `cargo metadata --format-version 1`; cargo test; shared evaluator. Do not baseline a private Clippy extension or Dylint without an accepted pinned-nightly maintenance budget. Sources: E3, [Clippy lint development](https://doc.rust-lang.org/clippy/development/adding_lints.html), [Dylint](https://github.com/trailofbits/dylint).

## Exceptions, versioning, and migration

Path classes must be explicit:

| Class | Policy | Evidence |
|---|---|---|
| Authored production | All selected style, shape, type, topology, semantic, and fixture obligations | E3 generated/vendor/test boundaries. |
| Generated | Exempt from authorship/style and hand-layout rules; still typechecked, graph-checked, and provenance-checked | E1 minted compiler; E3. |
| Vendor | Exempt from project shape/style; still resolved/built and lock evidence retained | E3. |
| Tests | Dedicated profile; production→test import forbidden; skips/retries recorded | E3. |
| Examples/scripts/migrations | Enumerated policies; no implicit wildcard exclusion | E3. |
| Unclassified | Fail admission | E3. |

A candidate exception record requires `obligation_id`, owner, reason, exact scope, native representation, creation time, expiry/review time, and approval reference. The violation remains in the receipt. Adoption is blocked until an owner route defines whether a valid exception yields `accepted_with_exception` or another explicit gate status; E2 found no accepted suppression owner.

Profiles and projections should be immutable versioned records with content digests. Any change to obligations, diagnostic meaning, public binding shape, exception semantics, source classification, or required evaluator produces a new profile version. A `Migration` records before/after digests, affected bindings, compatibility residue, file moves/codemods, rollback, validations, and receipts. Tool versions are pinned independently; passing under one toolchain does not imply another.

## Minimal cross-language fixture

Canonical fixture:

```text
fixture_id: rule-transition-001
rule_id: can-approve
use_case_id: approve-order
states: [draft, approved]
allowed: draft -> approved
forbidden: approved -> approved
required_edge: approve-order -> can-approve
forbidden_edges:
  can-approve -> use-cases
  can-approve -> adapters
receipt_schema: domainspec-enforcement-receipt/v1
```

Each language projection must contain one directly imported Rule, one use case invoking it, an exhaustive state representation, one valid transition, one rejected invalid transition, one pure effect intent, and one normalized receipt.

Required mutants and observable verdicts:

| Mutant | Required result |
|---|---|
| Missing or duplicate Rule binding | `OBL-RULE-IDENTITY` fails |
| Renamed file/module without manifest update | binding resolution fails |
| Extra/ambiguous public Rule entry | `OBL-ENTRYPOINT` fails |
| Barrel/re-export used instead of leaf import | `OBL-USE-EDGE` fails |
| Variable/dynamic import | fail or explicit `unsupported` residue; never silent pass |
| Reverse dependency or cycle | topology fails |
| Empty expected rule directory or orphan source | coverage fails |
| Stale generated source hash | provenance fails |
| Exception missing owner/reason/expiry | exception validity fails while violation remains |
| Skipped invalid-transition test | evidence completeness fails |
| New unhandled state | exhaustiveness negative fails |
| Invalid approved→approved transition | runtime transition fails |

E3 supplies the fixture and mutants. E1 supplies the local false-green rationale for empty roots, regex matching, omitted aggregate gates, and orphan declared-source coverage.

The normalized receipt carries fixture/obligation/profile IDs, language and tool versions, config/source/generated/exclusion/exception hashes, command arguments, timestamps, exit status, diagnostics, test/skipped/retry counts, raw artifact hashes, residue, and claim limit. Raw native outputs remain attached.

## Adoption waves

| Wave | Outcome | Gate and authority status |
|---|---|---|
| 0. Ownership | Decide owner routes for ImplementationProfile, bindings, exception policy, evaluator, and receipts; resolve name collision with current `language.profile` | Required before canonical mutation. E2 identifies all as unowned. |
| 1. Executable comparison | Implement only manifest/receipt schemas and `rule-transition-001` with mutants for all three languages | Candidate/local; parity claim limited to fixture verdicts. |
| 2. TypeScript pilot | Reuse current TypeScript compiler and minted receipt patterns; add AST/import gate; compose a non-vacuous admission command | Build-from-owned. E1 local precedent; E3 stable extension route. |
| 3. Python and Rust projections | Add idiomatic evaluators and document unsupported dynamic/macro cases | Candidate until fixture receipts reconcile. |
| 4. Repository migration | Inventory bindings and orphan files; migrate incrementally with versioned records; measure false positives, latency, CI cost, and IDE path | No blanket repository enforcement before measurements. |
| 5. Governance decision | Owner reviews ontology vocabulary, constitution/profile policy, generated projections, and promotion separately | Receipts support but cannot decide promotion. |

## Blind-spot register

1. Current aggregate `npm validate` omits typechecking, engine tests, tag gates, minted verification, and non-collapse checks. E1: `impl/package.json:17-24,39-47`.
2. Missing roots and orphan source can make declaration-bounded checks green. E1: `extract-code-tags.ts:16-38,62-99`; minted resolver residue.
3. Relationship/content parsers can skip malformed or missing sections. E1: `validate-content.ts:100-160`; `relationship-signatures.ts:173-305,462-690`.
4. Regex symbol-call presence can match comments, dead code, wrong scope, or post-mutation calls. E1: `check-code-tag-composability.ts:375-429,571-590`.
5. Arbitrary dynamic imports, reflection, monkey-patching, decorators, procedural macros, `cfg`, bundler rewrites, build scripts, FFI, `unsafe`, and runtime plugins are only partially observable. E3.
6. `any`, `Any`, ignores, assertions, and unsafe boundaries can weaken successful static checks. E3.
7. Import-checker configuration can become a second architecture authority if handwritten independently. Generate or reconcile it from the obligation manifest. E3.
8. State diagrams and exhaustive enums do not prove guard/effect ordering, persistence, retries, cancellation, concurrency, idempotency, or compensation. E1/E3.
9. Generated code may compile while stale or derived from the wrong canonical inputs. E1 minted provenance precedent.
10. Suppressions, skipped tests, retries, and flaky outcomes can manufacture false-green receipts. E2/E3.
11. Tool versions, project fit, developer latency, false-positive rate, cache behavior, migration cost, and IDE integration remain unmeasured. E3.
12. State Machine is active in DS-D1 but absent from the current four-kind profile. Supporting it requires an explicit admission decision, not merely new files. E2.
13. Generalizing the Rule module contract to all meta-types would collapse materially different formation and runtime obligations. E2 non-collapse list.
14. No shared effect system exists across TypeScript, Python, and Rust; effect equivalence must remain explicit residue. E3.
15. Successful normalized receipts prove only named evaluator runs under named digests—not semantic preservation, release, promotion, or production readiness. E2 authority matrix.

## Evidence-closure candidate matrix

| Claim cluster | Evidence state | Exact support | Typed negative or missing proof | Candidate disposition |
|---|---|---|---|---|
| Existing validators and their coverage | **Closed for research** | E1 exact package/tool selectors | Commands were not run because this lane was read-only | `already-deployed-bounded` |
| No existing one-rule/file, single-export, arrow-only gate | **Closed for scoped corpus** | E1 derivation module, Rule card, bounded search | Could exist outside authorized roots | `not-currently-evidenced` |
| Semantic and authority non-collapse | **Closed for candidate design** | E2 DS-D1/DS-D2/CAV2 source map and authority selectors | No owner has accepted the candidate vocabulary | `proposed-owner-review` |
| Universal exact-binding invariant | **Design-closed, execution-open** | E1 minted patterns; E2 bindings; E3 shared obligation | Missing/duplicate/barrel/dynamic mutants unexecuted | `build-from-owned` |
| TypeScript enforcement path | **Documentation-closed, project-fit open** | E3 official ESLint/typescript-eslint/TS docs | Versions, latency, AST rule, and fixture unexecuted | `pilot-first` |
| Python enforcement path | **Documentation-closed, project-fit open** | E3 Ruff/Python AST/mypy/Import Linter docs | Custom diagnostics and IDE path unimplemented | `candidate` |
| Rust enforcement path | **Documentation-closed, project-fit open** | E3 rustc/Cargo/Clippy/module docs | Module-level custom validation and macro/cfg coverage unimplemented | `candidate-with-residue` |
| Arrow-only universal policy | **Closed negative** | E1 no current policy; E3 semantic non-equivalence | No DomainSpec-relevant cross-language verdict | `KILL` |
| Runtime State Machine contract | **Current gap closed; candidate execution open** | E1 parser/product selectors; E2 contract model; E3 transition fixture | No guard/effect/runtime receipt executed | `proposed` |
| Suppression semantics | **Owner-blocked** | E2 explicitly finds no owner; E3 minimum fields | Approval semantics and gate status unresolved | `DEFER` |
| Generated provenance | **Reusable precedent closed; cross-language execution open** | E1 minted compiler/receipts; E3 Cargo output rule | TS/Python/Rust generated mutants unexecuted | `build-from-owned` |
| Cross-language parity | **Open implementation proof** | E3 paper fixture only | No projection or normalized receipt executed | `do-not-claim-yet` |
| Developer ergonomics/performance | **Open measurement** | E3 risks only | No latency, false-positive, cache, IDE, or CI budget | `measure-before-adoption` |
| Promotion/authority | **Intentionally out of scope** | E2 authority matrix | No owner verdict | `no-change` |

The synthesis is evidence-closed enough for adversarial reviewer analysis because every open item is typed as implementation proof, owner decision, or measurement residue. It is not evidence-closed for implementation adoption, ontology promotion, repository enforcement, or cross-language semantic-preservation claims.

Nothing in this synthesis was implemented, installed, executed, promoted, generated, or made authoritative.
