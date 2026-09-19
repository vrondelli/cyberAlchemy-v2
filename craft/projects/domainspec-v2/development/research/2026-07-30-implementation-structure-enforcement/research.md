# Research transcript

## Agent 1 — local precedent

## Finding

The local corpus has strong reusable machinery for declared graph validation, schema criteria, deterministic derivation, generated-source provenance, and digest-backed receipts. It does **not** currently enforce the proposed implementation-structure policies: one Rule per file, single export, arrow-only functions, use-case-to-Rule import direction, or layer-aware import boundaries.

The nearest truthful classification is:

- **Already deployed:** structural TypeScript checks, relationship validation, code-tag validation, derivation tests, and minted-source compilation—each with bounded coverage.
- **Build from owned:** a source-language structure checker and unified admission gate using the already-owned TypeScript/compiler and receipt patterns.
- **Gap:** executable import/export/file-shape policies, product State Machine semantics, cross-language profiles, and aggregate coverage.
- **Keep separate:** domain graph semantics, source-language structure, runtime temporal behavior, generated-source integrity, and lifecycle/promotion authority.

## Bounded evidence table

| Mechanism | Exact evidence and authority | What it enforces | Bypass or false-green | Disposition |
|---|---|---|---|---|
| Aggregate v2 validation | `projects/domainspec-v2/impl/package.json:17-24,39-47`; implementation-owned scripts | Docs, relationships, content, tool tests, and one sample engine lint | `validate` omits typecheck, engine tests, all tag gates, non-collapse, minted compilation/verification; engine lint targets only `spec/features/sample` | Adapt into a complete named admission gate |
| TypeScript shape | `projects/domainspec-v2/impl/tsconfig.json:2-11`; `tsconfig.base.json:2-13` | Strict typing for included tooling files | Root impl config includes only `tools/**/*.ts` and governance tag tools; it does not encode file count, export count, arrow-only, or dependency direction | Already deployed; keep separate from structure policy |
| Layering rules | `implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:5-22`; `LAYERING-REFERENCE.md:49-99`; reference authority | Defines intended layer directions and suggested layout | Explicitly recommends ESLint, aliases, and architecture tests; bounded search found no ESLint/import-boundary configuration in either authorized root | Build executable checker from owned reference |
| Rule card | `implementation/domainspec/architecture/pattern-library/concepts/backend/rule.md:11-28`; reference card | One business intent per pure predicate | Its example exports both predicate and assertion from one file; it is not evidence for single-export enforcement | Adapt semantics; do not elevate example syntax |
| Staged v2 cards | `projects/domainspec-v2/development/architecture-pattern-enforcement/cards/backend/README.md:1-21,27-40`; non-authoritative staging | Records candidate Rule and State Machine patterns | Card explicitly has no authority transfer; stale `enforces-cross` and incomplete guard/effect coverage remain | Keep as evidence; retire stale claims before promotion |
| Meta-type catalogue | `definitions/meta-types/meta-types.yml:1-8,153-170,261-278`; active read-model index | Maps Rule to Boolean-return criterion and State Machine to transition presence | Represents semantic criteria, not source files/imports/exports; State Machine requires only `has_transitions=yes` | Already deployed; keep separate |
| Meta-type content validator | `impl/tools/validate-content.ts:3-15,100-160`; implementation checker | Evaluates registered criterion schemas | Missing Concept Registry, missing headers, and unknown meta-types all `continue`; shape validation can green without semantic coverage | Adapt fail-closed parsing before reuse |
| Relationship authority and validator | `definitions/relationships/relationships.yml:1-18,101-146`; active authority. `impl/tools/lib/relationship-signatures.ts:173-305,462-690` | Validates recognized relationship tables, endpoint kinds, scope, generated authorship, and one-to-one multiplicity | Missing/malformed sections and placeholder rows can be skipped; validates declared triples, not source imports or runtime order | Already deployed semantic graph layer; keep separate |
| Code-tag composability | `impl/governance/tags/CODE-TAG-COMPOSABILITY-PATTERNS.md:21-35,140-175`; implementation projection | Nine dynamic relationship patterns | `produces`, `transitions`, `contracts`, and `consumes` are uncovered; gate remains separate from `npm validate` | Adapt coverage model |
| Code-tag checker | `impl/governance/tags/tools/check-code-tag-composability.ts:375-429,571-590` | Blocks Critical/High violations and detects calls by tagged symbol | Medium unsupported-signature findings do not block; regex `symbol(` can match comments, dead branches, post-mutation calls, or unrelated scope; it proves neither import nor execution order | Retire regex as proof; replace with owned AST analysis |
| Code-tag extraction | `impl/governance/tags/tools/extract-code-tags.ts:16-38,62-99` | Extracts tags from existing configured roots | Defaults name `backend/src` and `apps/web/src`, absent under v2 impl; missing roots are filtered, so zero-source extraction can produce an empty artifact | Adapt to explicit non-empty source ownership and fail closed |
| Explicit use-case imports Rule witness | `impl/governance/tags/tools/tests/code-tag-composability.test.ts:29-62`, especially generated import at line 42 | Test fixture demonstrates an operation importing and calling a Rule | It is temporary test data, uses plural `rules.ts`, and is not product architecture evidence | Reuse as fixture seed only |
| Current derivation rules | `impl/test-derivation-engine/src/rules/index.ts:1-79,130-209,696-729`; test-engine implementation | Deterministically derives obligations | One 729-line rule module contains many derivation functions and exports; directly contradicts claims of an existing one-rule-per-file/single-export convention | Keep separate; do not use its layout as product precedent |
| Minted source layout | `definitions/minted-project/supported-profiles.yml:18-67`; `impl/spec/minted-project/{feature,node}.schema.json`; experimental profile and machine schemas | One canonical JSON node source per declared node, including Rule | This is data-source layout, not implementation-module layout; resolver follows only declared references, so unlisted/orphan JSON files are outside its graph | Adapt resolver/provenance pattern, not policy semantics |
| Minted compiler and receipts | `impl/tools/minted-project/compiler.ts:287-650`; `views.ts:130-280`; generated JSON selectors `.authority`, `.inputs`, `.records`, `.status` | Containment, digest, kind/formation, relationship, multiplicity, generated provenance, and stale-source verification | Proves only the declared source set and generated read models; not application source behavior or promotion | Strong build-from-owned precedent |
| State Machine source and parser | `implementation/domainspec/docs/features/agent-execution-orchestrator/rules.md:9-37`; `impl/test-derivation-engine/src/grammar/index.ts:800-870`; `rules/index.ts:132-209` | Parses From/Event/To and derives valid/invalid transition obligations | Guard and Effect columns are dropped; obligations do not enforce runtime transition behavior | Keep structural derivation separate; runtime enforcement is a gap |
| Product State Machine | `implementation/domainspec/backend/src/modules/agent-execution-orchestrator/agent-execution-orchestrator-module.ts:88-102` | Tagged function returns an already-computed parent outcome | No transition table, guard, effect, or invalid-transition rejection; identity mapping can appear to satisfy the tag | Retire as State Machine proof |
| Parser experiment | `development/language-type-enforcement-parser-experiment/ARCHITECTURE.md:11-81,123-171`; `WORK-PACK.md:62-125`; non-authoritative proposal | Designs shared Concept Registry parser and parity checks | Planned parser, tests, parity test, and run receipts are absent; work-pack tasks remain not started | Build from owned; not already deployed |

## Requested convention checks

- **“A use case imports a Rule”:** the sole exact local witness is the generated test fixture at `code-tag-composability.test.ts:42`. Bounded source search found no product use case in `implementation/domainspec/backend/src` importing a domain Rule module.
- **One Rule per file:** not currently enforced. Minted JSON uses one declared node record per source file, but the test derivation engine aggregates rules in `src/rules/index.ts`.
- **Single export:** not currently enforced. The Rule card itself demonstrates two exports; public index files intentionally re-export multiple APIs.
- **Arrow-only functions:** no policy or executable check found; current product and tooling use function declarations extensively.
- **Meta-types:** represented as governed YAML catalogue entries plus criterion schemas. They classify and validate conceptual properties, not implementation-module structure.
- **`implementation/domainspec` development:** it demonstrates domain/application/interface/infrastructure organization, factory-created use cases, ports, and barrel APIs, but layering documents remain reference guidance and no import-graph gate was found.

## Enforcement layer map

1. **Source identity/provenance:** Minted resolver, compiler, generated manifest, and build receipt — deployed but declaration-bounded.
2. **Language/compiler correctness:** TypeScript strict checking — deployed for selected include sets.
3. **File/module/import/export structure:** no executable enforcement — principal gap.
4. **Concept and relationship semantics:** meta-type criteria, relationship schemas, and code tags — deployed with skip and coverage gaps.
5. **Runtime/temporal behavior:** derivation obligations and tests exist; State Machine runtime semantics remain unproved.
6. **Admission and receipts:** several independent commands and receipt formats exist; there is no complete aggregate structure-enforcement gate.

## Top five blind spots

1. No executable source-layout, module-direction, import, export-count, or function-form policy.
2. Aggregate validation can pass while typecheck, engine tests, tags, composability, minted verification, and non-collapse are unexecuted.
3. Code-tag composability can false-green from nonexistent default roots, empty extraction, regex call matching, partial relationship coverage, and non-blocking Medium gaps.
4. Content/relationship parsing silently skips absent or malformed semantic sections; the proposed shared fail-closed parser is not implemented.
5. State Machine evidence stops at transition presence and derived obligations; guards, effects, invalid runtime transitions, and actual product state evolution are not enforced.

Residual blind spot: the minted resolver validates only declared source references, so unlisted source files can remain invisible unless an ownership/orphan scan is added.

## Recommended classification

**Build from owned**

- Implement a language-profile checker atop the already-owned TypeScript compiler dependency.
- Reuse minted containment, deterministic ordering, digest binding, error-code, and receipt patterns.
- Reuse relationship and meta-type authority as inputs, without conflating them with source-language policy.

**Already deployed but bounded**

- Strict TypeScript checking.
- Relationship and criterion validation.
- Code-tag extraction/validation/composability commands.
- Deterministic derivation engine.
- Minted compilation, generation, and verification receipts.

**Adapt**

- Make source roots explicit, owned, and non-empty.
- Replace regex call matching with AST import/call/order analysis.
- Add orphan-source detection.
- Compose required gates into one explicit admission profile.
- Define profile-scoped exceptions for generated, vendor, test, and barrel files.

**Retire**

- Stale v1 waiver/readme assumptions in the v2 tag surface.
- `enforces-cross` or State Machine claims unsupported by current schemas/runtime.
- Any claim that existing `rules/index.ts` establishes one-rule-per-file precedent.
- Regex symbol-call presence as proof of composability.

**Keep separate**

- Concept graph validity.
- Language structure.
- Runtime behavior.
- Generated-artifact integrity.
- Governance approval and promotion.

## Claim/proof ceiling

This receipt proves a read-only, bounded local-precedent inventory and identifies enforceable mechanisms and concrete gaps in the two authorized roots. It does not prove that current gates pass, that no relevant precedent exists outside those roots, that any candidate policy has been accepted, that runtime State Machines are correct, or that implementation, authority, lifecycle, publication, release, or production state changed.

Residue:

- No validation command was executed because several configured commands can write generated/tag artifacts and this action was strictly read-only.
- External language/tool comparisons belong to the separate external-practice explorer.
- Final policy ownership, exception taxonomy, and promotion route remain synthesis decisions for the parent.

## Agent 2 — ontology and authority

action_id: spawn-0002  
dispatch_id: 2026-07-30-domainspec-v2-implementation-structure-enforcement-route  
run_id: dsv2ise-20260730T202619Z  
wave_id: explorers  
step_id: s1  
role: ontology-authority-explorer  
capability_ref: research  
status: pass  
validation: pass  
artifacts:

- `strategy-inventory-packet.json:40-159`
- `dispatch-sheet.json:1-63,115-144`
- `definitions/meta-types/meta-types.yml:1-43,153-170,261-278`
- `impl/spec/meta-types/behavioral/rule.schema.yml:1-28`
- `impl/spec/meta-types/lifecycle/state-machine.schema.yml:1-26`
- `definitions/relationships/relationships.yml:1-18,101-146,517-548`
- `definitions/minted-project/supported-profiles.yml:1-69`
- `impl/spec/minted-project/node.schema.json:1-36`
- `impl/tools/minted-project/compiler.ts:287-651`
- `development/research/2026-07-16-language-type-enforcement-proof/findings.md:19-150`
- `research/evolvable-validation-framework/findings.md:97-366,497-586`
- `formalization/README.md:1-96`
- `development/architecture-pattern-enforcement/cards/backend/README.md:1-47`
- `IMPORT-MANIFEST.md:1-20,57-97`
- `implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:24-56,74-140`
- `cyberAlchemy-v2/SOURCE-MAP.md:10-33`
- `cyberAlchemy-v2/architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md:13-24,58-180`
- `cyberAlchemy-v2/ontology/{README,NODE-MODEL,RELATION-MODEL,LIFECYCLE-MODEL}.md`
- `cyberAlchemy-v2/ontology/projections/README.md:6-57`
- `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md:6-45`
- `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-165`
- Persisted action `spawn-0002.json:1-35`
- Live `sha256sum`/JSON consistency probe: both profile-bound registry digests match current bytes; declared and actual relationship counts are both 31.

blockers: []  
residue:

- no accepted implementation-policy ontology or authority surface
- no proven TypeScript/Python/Rust preservation fixture
- no suppression semantics or owner
- State Machine is active DS-D1 but absent from the current four-kind implementation profile
- no implemented `TestCase -> evaluator -> ReceiptEnvelope` path
- no evidence that source layout implies semantic composability
- language-specific tooling and developer-cost evidence belongs to the separate language explorer

started_at: 2026-07-30T20:26:19Z  
finished_at: 2026-07-30T20:33:07Z  

## Explorer return

The smallest defensible model is not one unified ontology. It is a DomainSpec implementation-policy model that references—but does not absorb—DomainSpec’s domain ontology, plus language-specific projections and claim-limited evidence.

### Candidate type decisions

| Requested type | Decision and semantic role | Authority, lifecycle, status | Invariants | Must remain language-specific |
|---|---|---|---|---|
| `ImplementationProfile` | **KEEP as candidate configuration.** Selects a DomainSpec admission profile and implementation policies for one target language/toolchain. Separate from the existing minted-project profile axis. | No current authority path. Candidate → reviewed → owner-approved configuration → deprecated/superseded. Authored, not generated. | Stable ID/version; references exact semantic-profile and registry digests; each policy names enforcement layer, evaluator, exceptions, fixtures and claim limit. | File/module layout, export idiom, native tools, exclusions, autofix and diagnostics. |
| `LanguageProjection` | **KEEP.** Maps language-independent obligations to an idiomatic language realization or explicit non-equivalence. | Candidate research until an implementation/profile owner approves it. Generated instances may be read models only. | Every obligation is realized, explicitly unsupported, or residue-bearing; no silent weakening; exact source/profile/tool digests. | Syntax, types, modules/imports, effects, concurrency, state representation and tool configuration. |
| `ModuleBoundary` | **KEEP as profile policy record**, not a domain concept. | Candidate architecture/constitution input; becomes governing only through the rule/constitution owner. | Named source/target module classes, allowed direction, scope/exclusions, cycle policy, diagnostic and negative fixture. | Module systems, barrels/re-exports, dynamic imports and generated/vendor/test handling. |
| `RuleDefinition` | **MERGE into existing DS-D1 `Rule`.** Do not create a parallel semantic type. Use an implementation binding when code mapping is required. | Canonical semantics remain with DS-D1 and `rule.schema.yml`; active. | Boolean predicate, blocks/allows, source of canonical `enforces`; not Policy. | Function syntax, filename/export and error/result representation. |
| `RuleSet` | **RENAME to `EnforcementRuleSet` and KEEP as candidate aggregate.** A versioned evaluator/profile bundle, not a domain Rule or Policy. | Candidate derived/configuration record. Formalization supplies rule-set precedent but is a stale non-authority snapshot. | Ordered or explicitly unordered membership, stable rule IDs/versions/digest, declared evaluator and coverage; membership does not prove satisfaction. | Packaging, discovery and native rule registration. |
| `UseCaseBinding` | **KEEP as bridge record.** Binds an Operation or Query concept to a code module/symbol and its referenced Rules. | Candidate; current v1 “use-case function” material is frozen evidence, not v2 authority. | Exact concept, module, symbol and profile refs; imports cannot redefine canonical `Rule --enforces--> Operation`; Query bindings must not imply mutation. | Import syntax, dependency injection and callable shape. |
| `MetaTypeImplementation` | **RENAME to `MetaTypeImplementationBinding`.** Maps a DS-D1 kind/formation to a language representation; it does not define the meta-type. | Candidate authored configuration referencing registry, profile-admission and formation authorities separately. | Preserve `registry_ref`, `profile_admission_ref`, `formation_ref`; registry existence never implies profile support. | Type/class/trait/function representation and serialization conventions. |
| `StateMachineContract` | **KEEP as implementation/runtime contract attached to a canonical State Machine.** | Candidate. DS-D1 State Machine is active, but the current implementation profile does not admit it. | States, initial state, valid transitions, guards, effects and invariants are explicit; contract/diagram is not runtime proof. | Enum/union/typestate representation, effect execution, persistence and concurrency. |
| `Transition` | **KEEP only as a nested StateMachineContract record**, not a new DS-D1 kind or DS-D2 edge. | Consumer-authored contract component; candidate until a state-machine source/profile owner exists. | Stable transition ID; from/to state; trigger; optional Rule guard and effect reference; invalid transitions reject explicitly. | Exhaustiveness mechanism, event dispatch, async effects and error form. |
| `EnforcementObligation` | **MERGE into existing `Obligation`.** Add `class/layer/evaluator_ref`, not a second obligation model. | Existing deterministic derivation substrate; generated from source declarations/constraints. | Content-addressed key, source anchor, expected polarity, claim class; obligation existence is not satisfaction evidence. | Evaluator/tool selection and diagnostics. |
| `Violation` | **KEEP as result record**, normally embedded in a receipt. | Generated evidence, never authority. | Obligation ID, subject/source anchor, evaluator, diagnostic code, observed/expected values, severity and suppression state. | Native diagnostic locations and payloads. |
| `Suppression` | **DEFER.** The dispatch requires it as a test dimension, but the scoped corpus supplies no accepted semantics or owner. | Blocked candidate until a constitution/profile owner defines scope, expiry and evidence behavior. | Must never erase a violation; must be explicit, scoped, justified, expiring/reviewable and visible in receipts. | Inline annotation/config syntax and tool-specific exclusion mechanisms. |
| `Migration` | **KEEP as candidate change record**, using the active v1→v2 Import Manifest as precedent. | Authored plan/ledger record: proposed → applied → verified → superseded. Not ontology promotion. | From/to profile/version, classified subjects, compatibility/residue, rollback, validation and receipt refs; historical evidence remains intact. | File moves, codemods, package/tool versions and compatibility shims. |
| `GeneratedProjection` | **RENAME to namespaced `DomainSpecGeneratedProjection`.** Distinct from CAV2 ontology projections. | Generated read model only. | Canonical sources and profile/registry digests; deterministic output; provenance manifest; allowed/blocked uses; drift owner. | Output format and generated directory conventions. |
| `EvidenceReceipt` | **MERGE into `ReceiptEnvelope`.** | Generated evidence; never specification, proof by itself, promotion or authority. | Receipt family, subject/profile/registry/evaluator digests, evaluator version, status, per-obligation verdict, violations, residue and `claim_limit`. | Tool-native attachments and diagnostic rendering. |

### Candidate relationship set

These are implementation-policy relations, not additions to DS-D2 or CAV2’s authority relation model.

| Relation | Source → target | Owner/effect | Invariant |
|---|---|---|---|
| `references_semantic_profile` | ImplementationProfile → existing DomainSpec profile | Profile owner; no authority movement | Digest-bound; does not widen admitted kinds. |
| `selects_language_projection` | ImplementationProfile → LanguageProjection | Implementation-profile owner | Exactly one target language/version per selected projection. |
| `declares_module_boundary` | ImplementationProfile → ModuleBoundary | Architecture/constitution owner | Every boundary has an enforceable layer or explicit residue. |
| `realizes_obligation` | LanguageProjection → Obligation | Projection/profile owner | Realize, reject as non-equivalent, or record residue—never silently omit. |
| `binds_meta_type` | MetaTypeImplementationBinding → DS-D1 kind/formation | Domain authority remains DS-D1 | Mapping cannot redefine kind semantics or profile admission. |
| `binds_use_case` | UseCaseBinding → Operation or Query | Consumer source/profile owner | Exact code-symbol and concept identity. |
| `uses_rule` | UseCaseBinding → Rule | Consumer implementation relation | Must agree with canonical `Rule --enforces--> Operation`; not a replacement DS-D2 verb. |
| `collects_rule` | EnforcementRuleSet → Rule/structural evaluator rule | Profile/evaluator owner | Stable membership and digest; no Rule/Policy collapse. |
| `implements_state_machine` | StateMachineContract → State Machine | Consumer/spec owner | Contract references, never replaces, canonical concept identity. |
| `contains_transition` | StateMachineContract → Transition | Contract-local composition | Transition IDs unique; states closed under endpoints. |
| `guarded_by` | Transition → Rule reference | Contract-local reference | Guard stays boolean; does not invent a DS-D2 Rule→Transition edge. |
| `checked_by` | Obligation → enforcement layer/evaluator | Evaluator owner | Evaluator and claim limit explicit. |
| `violates` | Violation → Obligation | Generated evidence | Exact subject, cause and evaluator. |
| `reports` | ReceiptEnvelope → Violation/obligation verdict | Generated evidence | Suppressed and unresolved results remain visible. |
| `projects_to` | LanguageProjection → DomainSpecGeneratedProjection | Compiler/projection owner | Generated artifact is traceable and noncanonical. |
| `migrates` | Migration → profile/projection/binding version | Migration owner | Before/after refs, preservation obligations and rollback explicit. |

Do not reuse canonical DS-D2 `enforces` for profile enforcement, linter behavior or transition guards. It already means `Rule → Operation`, including cross-feature scope. Likewise, DS-D2 `transitions` means `Event → State Machine`; it is not the internal from-state/to-state transition record.

### Obligation-to-enforcement-layer map

| Layer | Representative obligations | Owner/evaluator | Evidence ceiling |
|---|---|---|---|
| Lexical/style | Arrow-function preference, formatting, naming | Language profile + formatter/linter | Style conformance only. |
| Syntax/AST | One Rule per file, single public symbol, prohibited construct | Language-profile AST rule | Local syntactic/module-shape claim. |
| Module topology | Allowed imports, use-case→Rule direction, cycles, generated/vendor boundaries | Import graph/module checker | Static dependency claim; not runtime reachability or composability. |
| Static types | Input/output types, boolean Rule result, exhaustiveness where supported | Native compiler/type checker | Language type-check result only. |
| DomainSpec formation/profile | DS-D1 formation, `ProfileAdmitted` | Schemas/profile registry/compiler | Shape and named profile admission. |
| DomainSpec graph | Canonical predicate, endpoint, scope and multiplicity obligations | Relationship authority + graph validator | Structural graph/signature claim only. |
| Projection/parity | Source/profile/registry digest match, deterministic generation, provenance | Compiler and drift gate | Projection consistency/traceability. |
| Runtime/temporal | Guard evaluation, valid/invalid transition, effects, invariants, ordering | Integration/property harness; bounded temporal model where governed | Runtime observation or bounded model result. |
| Evidence/accounting | Every obligation resolved, violation retained, receipt digests current | Receipt evaluator/build gate | Audit/freshness claim only. |
| Authority/promotion | Candidate may govern future work | Owner routes/decision and constitution gates | Authority verdict; never delegated to a linter or receipt. |

### Projection contract

A defensible contract should minimally carry:

```yaml
implementation_profile:
  profile_id:
  version:
  semantic_profile_ref:
  semantic_profile_digest:
  registry_digests:
  target_language: {id:, version_range:}
  status: candidate
  owner_route:
  source_roots:
  generated_roots:
  exclusions: {generated:, vendored:, tests:, examples:, scripts:}

language_projection:
  obligations:
    - obligation_id:
      universal_invariant:
      enforcement_layer:
      realization: native | custom | non-equivalent | blocked
      evaluator_ref:
      positive_fixture:
      typed_negative_fixture:
      diagnostic_id:
      claim_limit:
      residue:
  meta_type_bindings:
  use_case_bindings:
  module_boundaries:
  state_machine_contracts:
  suppression_policy_ref: null   # blocked until owned
  migration_ref:
  receipt_contract:
    receipt_family:
    required_digests:
    evaluator_identity:
    violation_retention: required
```

Projection invariants:

1. Domain semantics and DS-D2 endpoints remain language-independent.
2. Each language projection may differ idiomatically while preserving the same named obligation verdict.
3. Unsupported equivalence becomes typed residue, not a weakened common denominator.
4. Authored sources remain canonical; generated projections carry provenance and blocked-use declarations.
5. Each enforced obligation needs an exact-cause positive and negative.
6. A receipt witnesses one execution; it does not prove semantic preservation.
7. Preservation claims must name the judgment, e.g. `J(x) -> J(P_language(x))`; they cannot jump from folder cleanliness to semantic correctness.

### Style and layout verdicts

- **Arrow-functions-only:** not an ontology fact and not a universal DomainSpec law. It is at most a TypeScript `ImplementationProfile` style/AST policy. No equivalent Python/Rust invariant is evidenced. Today it remains a proposal/local guideline; kill it if no DomainSpec-relevant failure mode survives the cross-language fixture.
- **One-rule-per-file:** not a DS-D1 Rule invariant. It is a candidate source-layout/module policy. The existing experimental profile says `per-node-connections`, but this does not establish one Rule per file. Today it is a guideline without a scoped owner/validator. Promotion would require traceability value, explicit exceptions, barrel/dynamic-import negatives and receipt evidence.
- **Single export:** same classification as one-rule-per-file: profile-specific module policy, not domain ontology.

### Authority matrix

| Surface | Status and owner | Allowed claim | Forbidden collapse |
|---|---|---|---|
| DS-D1 meta-types and criterion schemas | Current DomainSpec definition/formation authority | Rule and State Machine semantics/formation | Implementation syntax or profile support. |
| DS-D2/DS-D8 relationship registry | Current active authority; 31 live signatures | Endpoint/scope/multiplicity record | Runtime behavior or general type system. |
| Minted supported profile | Experimental canonical configuration; release admission deferred | Entity/Event/Operation/Rule admission with three relationships | All 13 backend kinds or State Machine implementation support. |
| Consumer node/edge/code sources | Consumer-owned canonical sources | Authored intent and implementation bytes | DomainSpec definition authority. |
| ImplementationProfile/LanguageProjection proposal | Research candidate only | Design for owner review | Current policy, ontology or constitution. |
| Generated graph/provenance/projection | Generated read model | Deterministic derived representation and traceability | Canonical source or promotion. |
| ReceiptEnvelope/Violation | Generated evidence | Named evaluator observation under digests and claim limit | Proof, spec, or authority. |
| v1 architecture pattern library/cards | Frozen/staged evidence | Reusable examples after scoped review | Current v2 authority or automatic transfer. |
| CAV2 ontology model | Candidate authority-model view | Model authority kinds, lifecycle, projections and owner routes | Decide DomainSpec semantics or authority. |
| CAV2 authority model | Active only for CAV2’s local authority routing | Non-collapse and owner-route precedent | DomainSpec domain ontology. |
| Inventory | Non-authority read model | Discovery and source selection | Specification or promotion. |

### Non-collapse decisions

1. DomainSpec’s domain ontology answers what Rule, Operation, State Machine and canonical relationships mean. CAV2’s authority ontology answers how candidates, evidence, projections and owners are modeled. Neither subsumes the other.
2. ImplementationProfile is separate from the current DomainSpec formation/admission profile and must reference it explicitly.
3. LanguageProjection is a realization contract; DomainSpecGeneratedProjection is an emitted read model.
4. Rule semantics, linter rules and evaluation rule sets are three different objects.
5. A source module is not a domain concept; bindings preserve the bridge.
6. A transition record is not DS-D2 `transitions`.
7. Folder/module conformance is not semantic composability.
8. Static type success is not graph validity or runtime satisfaction.
9. A state-machine diagram/contract is not runtime transition proof.
10. Suppression is not deletion or success.
11. A receipt is evidence, not authority.
12. Generated code cannot become canonical by successful regeneration.
13. Ontology may model authority; only owner routes decide it.

### Blind spots

- No current source owns `ImplementationProfile`, `LanguageProjection`, `ModuleBoundary`, suppression or their lifecycle schemas.
- `project.schema.json` calls the DomainSpec admission bundle `language.profile`, creating a naming collision with a target programming-language projection.
- State Machine is active in DS-D1, but the current profile admits only four kinds and has no state-machine formation binding.
- The current State Machine criterion checks only `has_transitions=yes`; it does not validate actual states, from/to transitions, guards, effects or invariants.
- No current use-case-to-code-symbol binding or one-rule-per-file contract was evidenced.
- Dynamic imports, re-exports/barrels, reflection/macros and generated-code bypasses remain unclassified.
- Suppression scope, expiry, ownership and receipt semantics are absent.
- No cross-language fixture proves comparable verdicts without erasing idioms.
- No migration/IDE/autofix/false-positive/incremental-build budgets exist.
- Prior research reported 30 signatures; live authority now declares and contains 31, with matching bound digest. Current source therefore supersedes the older count.
- No product tests or runtime validators were executed in this mutation-forbidden lane; validation here covers selector inspection, JSON parsing, declared/actual count agreement and digest consistency only.

### Claim/proof ceiling

Defensible current claim: DomainSpec v2 has active domain meta-types and a 31-signature relationship authority, plus an experimental digest-bound four-kind compiler profile and generated semantic/provenance read models. Existing research and code support distinct structural, profile, projection and receipt layers.

Not defensible: that the proposed ontology exists, that any new profile is implemented or promoted, that one-rule-per-file or arrow-functions-only governs the repository, that State Machine behavior is enforced, that TypeScript/Python/Rust projections preserve the same semantics, or that receipts prove implementation/runtime correctness.

No implementation, ontology promotion, definition change, authority movement or generated projection occurred.

## Agent 3 — language tooling

action_id: spawn-0003  
dispatch_id: 2026-07-30-domainspec-v2-implementation-structure-enforcement-route  
run_id: dsv2ise-20260730T202619Z  
wave_id: explorers  
step_id: s1  
role: language-tooling-explorer  
capability_ref: research  
status: pass  
validation: pass  
artifacts:

- https://www.typescriptlang.org/docs/handbook/typescript-from-scratch
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- https://www.typescriptlang.org/docs/handbook/2/classes.html
- https://www.typescriptlang.org/docs/handbook/project-references
- https://www.typescriptlang.org/tsconfig/composite.html
- https://www.typescriptlang.org/tsconfig/incremental.html
- https://eslint.org/docs/latest/extend/custom-rules
- https://eslint.org/docs/latest/rules/func-style
- https://eslint.org/docs/latest/rules/prefer-arrow-callback
- https://eslint.org/docs/latest/rules/no-restricted-imports
- https://eslint.org/docs/latest/use/formatters/
- https://typescript-eslint.io/developers/custom-rules/
- https://typescript-eslint.io/getting-started/typed-linting/
- https://prettier.io/docs/ignore
- https://github.com/sverweij/dependency-cruiser
- https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- https://github.com/sverweij/dependency-cruiser/blob/main/doc/faq.md
- https://vitest.dev/guide/reporters
- https://docs.astral.sh/ruff/configuration/
- https://docs.astral.sh/ruff/linter/
- https://docs.astral.sh/ruff/faq/
- https://docs.astral.sh/ruff/versioning/
- https://docs.python.org/3/library/ast.html
- https://docs.python.org/3/library/typing.html
- https://docs.python.org/3/tutorial/modules.html
- https://mypy.readthedocs.io/en/stable/literal_types.html
- https://mypy.readthedocs.io/en/stable/mypy_daemon.html
- https://mypy.readthedocs.io/en/stable/extending_mypy.html
- https://import-linter.readthedocs.io/en/stable/contract_types/
- https://docs.pytest.org/en/stable/how-to/output.html
- https://doc.rust-lang.org/cargo/commands/cargo-check.html
- https://doc.rust-lang.org/cargo/commands/cargo-test.html
- https://doc.rust-lang.org/cargo/commands/cargo-metadata.html
- https://doc.rust-lang.org/cargo/reference/build-scripts.html
- https://doc.rust-lang.org/stable/rustc/lints/levels.html
- https://doc.rust-lang.org/stable/clippy/index.html
- https://doc.rust-lang.org/clippy/development/adding_lints.html
- https://doc.rust-lang.org/reference/items/modules.html
- https://doc.rust-lang.org/reference/expressions/match-expr.html
- https://doc.rust-lang.org/stable/book/ch18-03-oo-design-patterns.html
- https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html
- https://rust-analyzer.github.io/book/diagnostics.html
- https://rust-analyzer.github.io/book/configuration
- https://github.com/trailofbits/dylint
- https://nexte.st/docs/machine-readable/junit/

blockers: []  
residue:

- Exact project versions, existing configurations, performance, false-positive rates, and IDE latency were not measured.
- The shared fixture and proposed profiles were not implemented or executed.
- Python and Rust dynamic/reflection/macro imports remain only partially observable to static graph tools.
- Stable project-local custom lint extensibility is asymmetric across the three languages.
- Exact ownership and schema of the proposed shared DomainSpec validator and receipt remain unresolved.

started_at: 2026-07-30T20:28:18Z  
finished_at: 2026-07-30T20:33:49Z  

## Explorer return

### Result

The smallest defensible model is not a universal linter. It is:

1. One language-neutral obligation manifest and diagnostic/receipt schema.
2. Idiomatic language projections using each ecosystem’s formatter, compiler/type checker, import-graph checker, and test harness.
3. One shared DomainSpec validator for obligations that language tools cannot own: rule identity, cross-artifact graph semantics, projection parity, suppressions, generated-source provenance, and comparable receipts.

The universal rule should be “exactly one registered implementation for each rule identity,” not “one OS file with one export.” Literal one-rule-per-file and single-export policies do not preserve the same semantics in TypeScript, Python, and Rust.

### Capability matrix

| Capability | TypeScript | Python | Rust |
|---|---|---|---|
| Formatter | Prettier `--check`; generated paths via `.prettierignore` | Ruff formatter; common config with linter | `rustfmt --check` |
| Built-in lint | ESLint + typescript-eslint typed presets | Ruff | rustc lints + Clippy |
| Project-local custom AST rule | Strong public route through ESLint and `@typescript-eslint/utils`; typed rules can use checker services | Ruff explicitly has no custom-rule support. Standard `ast` validator or Pylint checker is possible | No stable project-local Clippy plugin surface. Dylint is possible but depends on `rustc_private`/Clippy internals |
| Module/import checking | dependency-cruiser for cycles, direction, required edges, static and literal dynamic imports | Import Linter forbidden/layers/independence/protected contracts | Cargo metadata for crate dependencies; rustc privacy for visibility; no stable built-in module-direction contract |
| Compiler/type checker | `tsc --strict --noEmit`; project references/composite/incremental | mypy strict profile; daemon for incremental runs | `cargo check`, then full build for codegen-only diagnostics |
| Exhaustiveness | Discriminated unions plus `never` | Enum/Literal plus `exhaustive-match` or `assert_never` | Compiler-enforced exhaustive `match` |
| Typestate/state-machine support | Discriminated unions or state-specific types; runtime inputs still need validation because types are erased | Enum/Literal/dataclasses; annotations are not runtime-enforced | Enums plus type-state structs/generics can make invalid transitions uncallable |
| Concurrency/effects | Promise/async typing, but no general effect or data-race proof | Async and type hints, but no general effect or data-race proof | `Send`/`Sync`, ownership and borrowing provide materially stronger concurrency constraints; external effects still need contracts/tests |
| IDE/incremental | TypeScript Project Service aligns typed ESLint with editor project information, at added type-check cost | Ruff language server is fast; mypy daemon is incremental but separate; custom validator feedback needs integration | rust-analyzer consumes cargo-check/Clippy diagnostics and can use JSON-producing override commands |
| Autofix | Prettier is formatting-only. ESLint fixes must declare fixability; semantic/custom-rule fixes require conservative tests | Ruff distinguishes safe/unsafe fixes; unsafe fixes require opt-in | `cargo fix` applies compiler suggestions but misses inactive features/targets; structural or semantic fixes should remain manual |
| Structured output | ESLint JSON, dependency-cruiser graph/report formats, Vitest JSON/JUnit | Ruff JSON/JSONL/JUnit/SARIF, pytest JUnit; normalize mypy diagnostics | Cargo JSON diagnostics and metadata; baseline `cargo test` has no stable full-fidelity JSON test receipt |
| Primary ceiling | TypeScript types are erased and import resolution ultimately depends on the runtime/bundler host | Python runtime does not enforce annotations; dynamic imports and monkey-patching evade static graphs | Macros, `cfg`, build scripts, unsafe/FFI, and module-internal dependency direction exceed baseline proof |

### Obligation-to-tool routing

| Obligation | Primary owner | Required proof | Do not misclassify as |
|---|---|---|---|
| Whitespace/layout | Formatter | Clean check/diff | Architecture or semantics |
| Syntax/local bug pattern | Native linter or stable AST rule | Diagnostic code, span, config hash | Type safety |
| One registered rule implementation | Shared DomainSpec validator | Manifest rule ID resolves exactly once | Literal one-file policy |
| Language-specific export surface | TS custom rule; Python/Rust projection validator | Resolved public symbol and module | Universal cross-language law |
| Use-case-to-rule import | Import/module graph checker plus shared manifest | Required direct edge and forbidden reverse edges | Merely matching folder names |
| Dependency direction/cycles | dependency-cruiser, Import Linter, Cargo metadata plus shared validator | Complete graph over declared scope | Compiler success |
| Static type admissibility | `tsc`, mypy, rustc | Strict type-check receipt | Runtime input validation |
| State exhaustiveness | Type checker/compiler | Missing-state negative fails | Full temporal correctness |
| Allowed transition | State-specific types where possible; runtime assertion and tests otherwise | Invalid-transition negative fails | Diagram or enum declaration |
| Effect/concurrency permission | Port/interface types where expressible; runtime policy/tests | Forbidden-effect and cancellation/concurrency tests | `async` syntax alone |
| Canonical graph/schema | Shared DomainSpec validator | Schema and graph diagnostics | Language linter |
| Generated projection freshness | Generator/reproducibility gate | Source hash, generator version, output hash | Successful formatting |
| CI acceptance | Build gate plus normalized receipt | Exact versions, inputs, exclusions, suppressions, commands, exits and raw outputs | Promotion authority |

### Smallest proposed profiles

#### TypeScript

- Prettier for formatting only.
- ESLint flat configuration plus typescript-eslint typed linting using Project Service.
- `tsc --strict --noEmit`; use composite/project references and incremental state where package topology warrants it.
- dependency-cruiser for cycles, dependency direction, production-to-test prohibitions, required use-case-to-rule edges, and literal dynamic imports.
- Vitest only if it is the selected/existing test runner; its JSON/JUnit reporters are receipt-capable.
- Shared DomainSpec validator for rule IDs, exact binding, suppression lifecycle, generated provenance, and normalized receipts.

Custom rules should use documented ESLint/typescript-eslint APIs and RuleTester. ESLint warns that its own core-rule implementations are private and fragile to extend.

`no-restricted-imports` alone is insufficient because it covers static imports only. dependency-cruiser recognizes literal dynamic imports but documents that variable/expression imports are not resolvable.

#### Python

- Ruff for formatting, ordinary linting, import sorting, exclusions, and safe fixes.
- mypy strict checking with exhaustive matches enabled and `warn_unused_ignores`; use `dmypy` only where latency warrants it.
- Import Linter built-in contracts for dependency direction, protected entry points, independence, and cycles.
- pytest with JUnit output.
- A narrow repository-owned validator using Python’s public `ast` module for DomainSpec-specific rule binding, file/module identity, and receipt projection.

Do not assume Ruff plugins: its official FAQ says custom lint rules are unsupported. Pylint AST checkers are a viable integration alternative, but adding a second general linter increases configuration duplication. Mypy plugins are not a suitable baseline for DomainSpec structural policy: mypy calls the plugin API experimental and gives no backward-compatibility guarantee.

`__all__` is not an encapsulation mechanism; Python documents it mainly as controlling `from package import *`. Explicit absolute imports and an import contract are the stronger projection.

#### Rust

- `rustfmt --check`.
- `cargo check --workspace --all-targets`, followed by an actual build where code-generation diagnostics matter.
- Clippy with a curated, version-pinned workspace lint set.
- `cargo metadata --format-version 1` feeding the shared validator for crate-level dependency direction.
- `cargo test --workspace --all-targets --no-fail-fast`.
- Shared DomainSpec validator for module-level binding, generated provenance, and normalized receipts.

Do not baseline a private custom Clippy lint. Clippy’s documented lint-authoring route is contribution inside Clippy. Dylint supports local dynamic lint libraries, but its own documentation uses `rustc_private` and states that Clippy utilities have no stability guarantees. Adopt Dylint only if a pinned nightly/toolchain maintenance budget is explicitly accepted.

If CI requires per-test JUnit rather than a DomainSpec fixture receipt, cargo-nextest is a possible additional tool. It should not be installed merely to create a paper parity claim.

### Language projection rules

- Universal: each `rule_id` has exactly one manifest binding to one implementation unit and one callable public entry point.
- TypeScript: a leaf module may enforce one named exported rule value/type. A custom rule can reject extra public exports and barrels. Blanket arrow-only policy is not universal.
- Python: one rule per module is possible as a profile convention, but helpers may remain in the same module. Require an explicit absolute import and manifest binding; do not call `__all__` proof of privacy.
- Rust: one rule per module can be a convention, but Rust modules idiomatically contain multiple items and are private by default. Enforce a single registered public rule entry, not a single `pub` item.

A use case should import the leaf rule directly:

- TypeScript: `import { canApprove } from "../rules/can-approve.js"`.
- Python: `from ...rules.can_approve import can_approve`.
- Rust: `use crate::rules::can_approve::can_approve`.

The graph invariant is `use_case -> rule -> domain/types/ports`. Rules must not import use cases or adapters. Production code must not import tests. Barrels/re-exports must not conceal the required direct binding.

### Arrow-function policy

Arrow-functions-only is TypeScript-specific and semantically non-neutral. TypeScript documents different memory, prototype, `super`, and `this` behavior for class arrow properties. ESLint’s `func-style` does not inspect every function position, while `prefer-arrow-callback` deliberately fixes only replacements that preserve behavior.

There is no faithful Python or Rust equivalent:

- Python lambdas are expression-only and do not replace normal definitions.
- Rust closures capture environments and have different types/coercions from `fn` items.

KILL blanket arrow-only if it interferes with generators, constructors, overload declarations, prototype methods, recursion/hoisting, or produces no measured DomainSpec benefit. A narrow callbacks-only rule is defensible.

### Shared cross-language fixture

Use one canonical JSON fixture, not three independently authored examples:

```text
fixture_id: rule-transition-001
rule_id: can-approve
use_case_id: approve-order
states: [draft, approved]
allowed_transition: draft -> approved
forbidden_transition: approved -> approved
dependency_policy:
  use_case_requires: can-approve
  rule_forbids: [use_cases, adapters]
expected_receipt_schema: domainspec-enforcement-receipt/v1
```

Each projection contains:

- One directly imported rule.
- One use case invoking it.
- One exhaustive state representation.
- One valid transition.
- One runtime-rejected invalid transition.
- One emitted normalized diagnostic/receipt.

Required mutants:

1. Missing rule implementation.
2. Duplicate manifest binding.
3. Renamed file/module without manifest update.
4. Multiple TS exports or ambiguous Python/Rust public entry.
5. Barrel/re-export bypass.
6. Variable/dynamic import bypass.
7. Reverse dependency and cycle.
8. Generated implementation with stale source hash.
9. Suppression without owner/reason/expiry.
10. Skipped transition test.
11. Newly added unreachable/unhandled state.
12. Rule directory present but empty.

The normalized receipt should contain:

```text
schema_version, fixture_id, obligation_id, language_profile,
language_version, tool_versions, config_hashes, source_hash,
generated_input_hash, exclusions_hash, suppressions_hash,
command_argv, started_at, finished_at, exit_status,
diagnostics[{code,path,span,message}], test_counts, skipped_tests,
raw_artifact_hashes
```

Raw tool output should be retained beside the normalized receipt. Receipts are evidence, not canonical authority.

### Autofix and suppression policy

Safe automatic actions:

- Formatter output.
- Ruff fixes classified safe.
- Compiler/linter fixes whose public API declares applicability and whose rule-specific tests prove idempotence.

Manual-only actions:

- Moving modules.
- Rewriting imports across boundaries.
- Selecting or renaming a rule identity.
- Adding/removing state transitions.
- Changing effects or concurrency.
- Creating suppressions.
- Regenerating canonical projections.

Every suppression needs an obligation code, owner, reason, scope, expiry/review date, and native representation. Fail on stale/unmatched suppressions. Rust’s `#[expect(..., reason = "...")]` is preferable to silent `#[allow]` where applicable because unfulfilled expectations are diagnosable.

### Generated, vendor, and test boundaries

- Generated code: exclude from authorship/style and custom source-layout rules, but compile/type-check it and include its executable dependency edges. Validate source hash, generator version, and output hash.
- Rust generators should write under Cargo `OUT_DIR`; Cargo explicitly advises build scripts not to modify outside it.
- Vendor code: exclude from project style and DomainSpec rule-shape policies; still build/resolve it and separately capture dependency lock evidence.
- Tests: use a dedicated profile, not a blanket exclusion. Enforce production-not-importing-tests and run type/lint checks over the cross-language fixture.
- Examples/scripts/migrations: enumerate explicitly. An unclassified path is a failure, not an implicit exclusion.

### Migration and ergonomics risks

- TypeScript typed linting asks TypeScript to build project information and is slower than syntax-only linting. Project Service improves editor/CLI alignment but does not eliminate cost.
- Python splits feedback among Ruff, mypy, Import Linter, and the DomainSpec validator. Without LSP integration, custom violations arrive later than ordinary lint feedback.
- Rust has excellent compiler/rust-analyzer feedback for type and exhaustiveness errors but weak stable extensibility for project-specific HIR rules.
- Import-graph tools can create a second architecture authority if their configuration is handwritten independently. Prefer generating/checking tool configuration from the canonical obligation manifest.
- Ruff uses custom pre-1.0 versioning: minor versions may break configuration or stable rule behavior. Pin exact versions.
- Mypy plugins and Dylint/rustc-private surfaces have explicit stability risks.
- Cargo metadata format should be pinned with `--format-version 1` and parsed tolerantly because fields may be added.
- New lints can break `-D warnings`; pin and review upgrades instead of floating toolchains.
- Test retries/skips can create false-green receipts. Record attempted, skipped, retried, and flaky outcomes explicitly.

### KILL conditions

Kill a proposed enforcement when it:

- Is aesthetic only and changes no fixture verdict.
- Duplicates a compiler guarantee without adding DomainSpec identity or evidence.
- Requires an unstable/private API without an accepted pinning and maintenance budget.
- Cannot detect its declared negative control.
- Has no IDE or bounded fallback path for routine developer feedback.
- Needs semantic autofix to pass.
- Converts tool configuration into a second canonical architecture source.
- Excludes generated code so broadly that executable graph/type failures disappear.
- Allows unowned or permanent suppressions.
- Cannot preserve the same obligation through the three-language fixture.
- Makes Python or Rust imitate TypeScript syntax instead of preserving semantics.

### Blind spots

- Arbitrary dynamic imports, reflection, monkey-patching, decorators, macros, procedural macros, `cfg` combinations, build-script behavior, bundler rewrites, FFI, `unsafe`, and runtime plugin loading.
- TypeScript `any`/assertions, Python `Any`/ignored imports, and Rust unsafe boundaries can weaken otherwise successful static checks.
- Compiler success does not prove DomainSpec graph admissibility or permitted runtime effects.
- Rust typestate can prove API reachability for represented states, but not external I/O success, cancellation safety, or data-driven state validity.
- No official documentation establishes a common effect system across these languages.
- No latency, false-positive, migration, cache, or CI cost was measured.
- No current repository tool availability or configuration was inspected by this action.

### Claim/proof ceiling

Official documentation supports the capability and limitation matrix. It does not prove project fit, installed versions, cross-language parity, acceptable developer cost, or runtime correctness.

The fixture, profiles, obligation manifest, and receipt schema are proposal-level research. Nothing was installed, implemented, executed, promoted, or made authoritative. The highest supported claim is: these profiles are plausible minimal candidates for an executable comparison after exact version pinning, implementation, negative-control execution, and receipt reconciliation.

## Agent 1 feedback — supplemental owner check

## Supplemental owner check — feedback loop 1/1

Two review locators were stale:

- Supported profiles live at `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml`, not `definitions/supported-profiles/`.
- The financial-settlement sidecar lives at `projects/domainspec-v2/impl/test-derivation-engine/bindings/financial-settlement.json`, not beneath `src/bindings/`.

### Owner reconciliation

| Concern | Exact evidence | Owner classification |
|---|---|---|
| Implementation profiles | `definitions/minted-project/supported-profiles.yml:1-7` names owner `definitions/minted-project`, role `minted-project-profile-admission`, and `release_admission: not-granted`. Lines 18-67 define the experimental admitted profile, formation schemas, relationships, effective conditions, and non-goals. | **Policy owner already deployed; proposed implementation-conformance profile is build-from-owned.** Extend or companion this registry; do not create a parallel profile registry. |
| Consumer profile binding | `impl/spec/minted-project/project.schema.json:3-35,45` defines a consumer-owned project source binding one profile and its profile/kind/relationship digests. | **Consumer source owner already deployed.** It selects a governed profile; it is not itself a second profile authority. |
| Minted compiler | `impl/tools/minted-project/compiler.ts:287-339` selects the canonical or explicitly handled development registry; lines 366-453 validate project schema, registry digests, profile identity, profile digest, and admitted relationships. | **Implementation validation owner already deployed.** Adapt this compiler for profile-bound mapping reconciliation rather than creating another compiler. |
| Derivation bindings | `impl/test-derivation-engine/src/bindings/index.ts:1-6,30-49,51-81` defines the obligation-to-module/symbol/strategy projection and explicitly says it identifies the target, never the expected answer. `bindings/financial-settlement.json:1-14,17-43,98-128` contains concrete mappings, emitter strategies, fixtures, and explicit coverage gaps. | **Test-derivation projection already deployed.** It owns emitter strategy, fixtures, and honest coverage-gap handling—not general implementation identity authority. |
| Code-tag mapping | `impl/governance/tags/CODE-TAG-SCHEMA.md:1-7,27-51` explicitly calls itself the canonical source-annotation contract and maps implementation symbols to DomainSpec concepts and canonical relationship edges. | **Best existing canonical implementation-mapping owner, but still reformulation-pending in v2.** It is the only checked artifact that explicitly claims source-symbol mapping ownership. |
| Code-tag migration state | `IMPORT-MANIFEST.md:34-46` says tag tooling/schema/docs were imported verbatim with reformulation pending, must be retargeted to v2, and its v1 waiver entries reset. | The code-tag owner cannot yet be called precedent-clean or release-admitted. Its intended ownership survives, but current paths/data require reconciliation. |
| Code-tag waivers | `CODE-TAG-WAIVERS.md:1-10,12-40` defines temporary, owned, expiring code-tag exceptions. `validate-code-tags.ts:513-629` validates required fields and expiry; lines 632-660 apply exact code/file/concept selectors. `code-tag-waivers.yaml:1-29` contains four owned waivers expiring in December 2026. | **Scoped suppression owner already deployed.** The earlier “no suppression owner” claim must be narrowed to “no general cross-tool exception owner.” Current waiver data is v1 migration residue under the active Import Manifest. |
| Obligation IR | `impl/test-derivation-engine/src/ir/types.ts:68-100` defines a content-addressed `ObligationKey`, existing `RuleType` union, and `Obligation` with canonical parameters and source anchor. | **Canonical derivation IR already deployed.** Reuse it; do not add a second obligation representation. |
| RuleSet | `impl/test-derivation-engine/src/rules/index.ts:1-56` defines pure deterministic derivation and versioned `RuleSet`; lines 692-729 define total, deterministic `derive(G, Δ)`. | **Rule derivation owner already deployed.** A proposed `EnforcementRuleSet` must extend this versioned owner or be a profile configuration projected into it—not a parallel registry. |
| Transition derivation | `src/rules/index.ts:132-208` derives valid and invalid transition obligations. `src/emit/spec.ts:41-67` classifies both as `derivable-needs-harness`. `src/emit/tests.ts:330-347` identifies them as outside the pure slice. The binding sidecar repeats this at `bindings/financial-settlement.json:125-128`. | **Obligation derivation already deployed; runtime enforcement remains application-owned.** A profile may configure transition derivation but cannot claim state effects, scheduling, or execution. |
| Active migration ledger | `IMPORT-MANIFEST.md:1-20` is explicitly active and defines the v1→v2 verdict/status vocabulary. Lines 22-46 track engine and validator/tag migration; lines 95-97 define the freeze gate. | **Migration owner already deployed.** Reuse it for any profile/tag/binding migration; do not create another generic migration ledger. |
| Private derivation moat | `IMPORT-MANIFEST.md:6,24-27` marks `impl/test-derivation-engine/src/rules` private and never publishable to Arcanum. | **Private DomainSpec implementation owner.** Public routes may reference its receipt, not absorb its logic or prose. |
| Generated projections | `impl/tools/minted-project/compiler.ts:574-629` labels the compiled graph `generated-semantic-read-model` and source manifest `generated-provenance-read-model`, each bound to source/profile/registry digests. | **Generated secondary evidence, never canonical source authority.** |
| Minted build receipts | `impl/tools/minted-project/views.ts:46-77,130-175` defines and constructs `generated-verification-evidence` with profile, registry, source-set, artifact, and generator digests. Lines 186-280 verify schema, staleness, language binding, and provenance. `impl/spec/minted-project/build-receipt.schema.json:3-40` fixes this boundary. The checked example at `impl/spec/features/ui-profile-create-player/generated/build-receipt.json:1-20` is `status: pass`. | **Receipt/provenance owner already deployed.** Extend its digest/reference pattern; do not create a replacement receipt system or treat a generated receipt as authority/promotion. |
| Private/public boundary | `cyberAlchemy-v2/SOURCE-MAP.md:14-19,23-33` distinguishes public Arcanum authority from private implementation evidence and requires boundary scrub, owner review, and canonical back-references. Lines 54-58 keep public generalization owner-gated. | **Boundary already defined.** DomainSpec mapping metadata, diagnostics, fixtures, and engine internals stay private. |
| Public Arcanum projection | `arcanum/formulae/dispatch-spec/TECHNIQUE-CATALOG.md:96-103` permits stable evidence references and summaries, not full foreign state. `arcanum/arcana/verification-weaver/README.md:3-17,49-60` limits the public capability to routing/recomposition and blocks private implementation material and generated artifacts as authority. | **Public routing/projection owner only.** Arcanum may link owner-held receipts and bounded summaries; it does not inherit DomainSpec mapping or enforcement authority. |

## Minimal canonical-mapping rule

Select **source-local DomainSpec code tags conforming to `CODE-TAG-SCHEMA.md` as the sole canonical implementation-symbol mapping owner**, after the Import Manifest’s v2 reformulation obligations are completed.

The reconciliation rule is:

1. The supported-profile registry owns which mapping policy is admitted; it does not enumerate project symbols.
2. Code tags own the canonical tuple of implementation symbol, DomainSpec concept, and declared relationship edge.
3. Extracted tag indexes or any future mapping manifest are generated/reconciled projections of those source annotations, never independent sources.
4. Derivation binding sidecars retain only obligation selection, emitter strategy, fixtures, and coverage-gap semantics. Their current `module` and `symbol` fields must be derived from, or fail-closed reconciled against, the canonical code-tag mapping. During migration, duplicated values must match exactly and bind the tag-extraction digest.
5. Existing `ObligationKey`, `Obligation`, and versioned `RuleSet` remain the derivation identities. Mapping artifacts reference them; they do not redefine them.
6. The minted compiler validates profile admission, registry bindings, mapping agreement, and digests. Generated mapping views and build receipts remain evidence projections.
7. The active Import Manifest records the one-time sidecar/tag reconciliation and eventual retirement of duplicated mapping fields.

This selection avoids both a second implementation-mapping registry and the inverse mistake of making a test-emitter sidecar authoritative over production symbols.

## Evaluator boundary

A shared evaluator may:

- normalize native diagnostics;
- compare code tags, binding projections, profiles, obligations, and receipt digests;
- emit agreement, disagreement, and explicit residue referencing raw owner artifacts.

It must not:

- parse/compile as a second language compiler;
- execute TypeScript, Python, Rust, or other native tools;
- schedule tasks or CI;
- derive a replacement RuleSet or Obligation IR;
- perform application State Machine transitions;
- replace minted receipts, tag waivers, or the Import Manifest.

## Corrected claim ceiling

The supplemental evidence establishes the existing owners and a minimal non-duplicative reconciliation rule. It does **not** establish that the v2 code-tag owner has completed reformulation, that current waivers are acceptable for a new profile, that a new implementation-conformance profile is release-admitted, or that any reconciliation/compiler change has been implemented.

No files were changed, no validation command was executed, and no authority, promotion, or lifecycle state changed.
