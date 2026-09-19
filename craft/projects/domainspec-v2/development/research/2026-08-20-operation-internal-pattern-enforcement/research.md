# Explorer research returns

The bodies below are persisted verbatim from the read-only explorer agents. Section headings are parent-authored routing metadata.

## Agent 1 — local-precedent-explorer

{
  "schema_version": "arcanum.host-native-action-receipt/v1",
  "action_id": "spawn-0001",
  "role": "local-precedent-explorer",
  "capability": "research",
  "mode": "explore",
  "status": "complete",
  "mutation": {
    "performed": false,
    "write_scope": [],
    "changed_paths": []
  },
  "output_ref": {
    "path": "projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/receipts/explorer-local-precedent.json",
    "materialized": false,
    "reason": "The action is explicitly read-only with an empty write scope; this receipt is returned to the parent for authorized persistence."
  },
  "claim_ceiling": "Repository-local precedent and current-byte evidence only. Candidate architecture-conformance artifacts have authority_effect none and do not promote DomainSpec semantics.",
  "baseline": {
    "selector": "projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/findings.md",
    "review_selector": "projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/reviews/audit-final.md:1-14",
    "review_status": "ACCEPT",
    "current_byte_result": "The July research ceiling remains valid, but current bytes now include executable candidate fixtures, exact bindings, and receipts that were not yet present in that snapshot."
  },
  "findings": [
    {
      "id": "LP-01",
      "classification": "build-from-owned",
      "subject": "Operation and Query semantic boundary",
      "authority_status": "active canonical",
      "evidence": [
        "projects/domainspec-v2/definitions/meta-types/meta-types.yml:99-134",
        "projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml:11-30",
        "projects/domainspec-v2/impl/spec/meta-types/behavioral/query.schema.yml:10-22",
        "projects/domainspec-v2/definitions/relationships/relationships.yml:228-242"
      ],
      "actual_enforced_behavior": "Operation is the state-changing side and Query is read-only. Canonical relationship authority explicitly admits Operation, Query, and Calculation as sources of queries.",
      "bypasses_or_limits": "The canonical discriminator does not inspect runtime effects, SQL, ORM imports, traversal count, or allocation behavior.",
      "decision": "Build checks around state-change versus read-only semantics. Kill any universal rule stating that Operations cannot read or query persistence."
    },
    {
      "id": "LP-02",
      "classification": "build-from-owned",
      "subject": "Rule gating and mutation order",
      "authority_status": "canonical relation plus candidate executable evidence",
      "evidence": [
        "projects/domainspec-v2/definitions/meta-types/meta-types.yml:153-170",
        "projects/domainspec-v2/definitions/relationships/relationships.yml:100-114",
        "projects/domainspec-v2/impl/architecture-conformance/families/outcome-function/fixtures/can-settle-payout/obligations.json:1-19",
        "projects/domainspec-v2/impl/architecture-conformance/families/enforces-relation/fixtures/settlement-rule-operation/obligations.json:1-14",
        "projects/domainspec-v2/impl/architecture-conformance/realizations/relation/typescript/direct-rule-operation-v1/fixtures/settle-payout.ts:1-23"
      ],
      "actual_enforced_behavior": "Canonical enforces means Rule gates Operation and the Operation checks it before mutation. The exact candidate fixture checks one Rule call, one Operation call, and Rule-before-Operation-before-write ordering; Rule cases also require exact boolean outcomes and no observed effects.",
      "bypasses_or_limits": "The executable proof is an exact candidate fixture with authority_effect none. Canonical Rule authority establishes boolean guard behavior but does not independently promote universal purity or a source-level import form.",
      "decision": "Use the canonical gate/order invariant. Treat Rule purity and direct-leaf realization as candidates requiring owner/profile admission."
    },
    {
      "id": "LP-03",
      "classification": "adapt",
      "subject": "Persistence and business-rule separation",
      "authority_status": "private v1 precedent; not v2 authority",
      "evidence": [
        "implementation/domainspec/architecture/pattern-library/concepts/backend/operation.md:3-41",
        "implementation/domainspec/architecture/pattern-library/concepts/backend/query.md:3-30",
        "implementation/domainspec/architecture/pattern-library/concepts/backend/rule.md:3-27",
        "implementation/domainspec/architecture/pattern-library/LAYERING-REFERENCE.md:5-37",
        "implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:5-22",
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:41-69",
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:89-165",
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/get-latest-mirror-projection.ts:73-138"
      ],
      "actual_enforced_behavior": "Local practice places Operation and Query in the application layer, supplies repository/parser/vocabulary dependencies through ports, and reserves concrete adapters for infrastructure. The tagged Operation both reads and saves through ports; tagged Queries read through a repository port.",
      "bypasses_or_limits": "The v1 dependency checks are recommendations and private precedent, not promoted v2 semantics. A direct ORM-import prohibition therefore belongs to a selected implementation profile, not the Operation meta-type itself.",
      "decision": "Adapt port-boundary and import-direction checks as profile-local constraints. Do not encode a canonical ban on persistence access inside Operations."
    },
    {
      "id": "LP-04",
      "classification": "build-from-owned",
      "subject": "Exact bindings, effects, and receipts",
      "authority_status": "implemented candidate evidence; authority_effect none",
      "evidence": [
        "projects/domainspec-v2/impl/architecture-conformance/families/read-model/README.md:1-24",
        "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/query-v1.ts:1-36",
        "projects/domainspec-v2/impl/architecture-conformance/realizations/query/typescript/read-model-v1/typescript-binding.json:1-52",
        "projects/domainspec-v2/impl/architecture-conformance/kernel/evidence/effect-observation/contracts.ts:1-16",
        "projects/domainspec-v2/impl/architecture-conformance/kernel/evidence/effect-observation/contracts.ts:93-132",
        "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json:85-114"
      ],
      "actual_enforced_behavior": "Current candidate machinery binds exact source, callable, observer, provider, and fixture digests. The Query denominator checks two exact ordered reads, closed output, no writes, and seven lifecycle paths. The W3 Operation descriptor declares reads, writes, external effects, ordered checkpoints, guard-controlled mutation, emitted event placement, and a continuation boundary.",
      "bypasses_or_limits": "Read-model evidence is transport-level, exact-fixture evidence, not runtime interception or arbitrary-source proof. Generated or dynamic code can fail closed as unsupported. Receipts prove execution only and cannot admit, waive, promote, or release constraints.",
      "decision": "Reuse exact digest-bound evidence and claim ceilings. Avoid creating a second binding registry."
    },
    {
      "id": "LP-05",
      "classification": "kill",
      "subject": "Prefer reduce, fold, or single traversal as a universal rule",
      "authority_status": "no local authority or enforcement located",
      "evidence": [
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/get-latest-mirror-projection.ts:141-155",
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/get-latest-mirror-projection.ts:364-409",
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:294-323",
        "implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:344-395",
        "projects/domainspec-v2/impl/test-derivation-engine/src/bindings/financial-settlement.json:45-70"
      ],
      "actual_enforced_behavior": "Tagged local Query and Operation implementations use explicit loops and multiple map/filter passes. The legacy fold-sum-profit occurrence derives a test oracle; it does not constrain source implementation form.",
      "bypasses_or_limits": "Equivalent source forms can differ in ordering, short-circuiting, allocation, failure, and effect behavior. A syntax preference cannot prove those properties.",
      "decision": "Kill prefer-reduce or one-pass-only as a portable invariant. Any optimization advice must remain advisory and require measured behavior/cost evidence."
    },
    {
      "id": "LP-06",
      "classification": "defer",
      "subject": "Complexity, nested loops, repeated traversal, and N+1 budgets",
      "authority_status": "no scoped owner, threshold, or active checker located",
      "evidence": [
        "Scoped zero-match search across projects/domainspec-v2/definitions, projects/domainspec-v2/impl/architecture-conformance, projects/domainspec-v2/impl/spec, implementation/domainspec/architecture/pattern-library, and implementation/domainspec/templates for cyclomatic complexity, cognitive complexity, Big-O, nested loops, repeated traversals, loop fusion, prefer reduce, and N+1."
      ],
      "actual_enforced_behavior": "No current portable threshold or profile budget was found. Existing exact Query evidence counts declared reads for one fixture but provides no scale-sensitive database-query proof.",
      "bypasses_or_limits": "Static loop counts miss library traversal, database round trips, lazy iteration, generated queries, and input-dependent cost.",
      "decision": "Defer to a language/runtime/data-access experiment with explicit metrics, fixtures, and owner-selected thresholds."
    },
    {
      "id": "LP-07",
      "classification": "adapt",
      "subject": "Mutation, async iteration, and lifecycle",
      "authority_status": "canonical family semantics plus candidate evidence",
      "evidence": [
        "projects/domainspec-v2/impl/architecture-conformance/families/state-change/fixtures/complete-settlement/operation-definition.json:1-10",
        "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/typescript/state-event-arrow-v1/fixtures/complete-settlement.ts:1-18",
        "projects/domainspec-v2/impl/architecture-conformance/families/read-model/README.md:8-19",
        "projects/domainspec-v2/impl/architecture-conformance/kernel/evidence/effect-observation/contracts.ts:97-132",
        "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json:98-111"
      ],
      "actual_enforced_behavior": "Mutation is expected for Operation, prohibited for the exact Query candidate, and prohibited for exact Rule cases. Query evidence covers await/iteration, cancellation, close, dispose, finalizer, and quiescence; the W3 Operation fixture records an awaited continuation boundary.",
      "bypasses_or_limits": "The current TypeScript Query target is one fixed async function with two sequential awaits. It does not establish arbitrary async-iterator, stream, generator, transaction, or cancellation semantics.",
      "decision": "Adapt effect and lifecycle obligations by family. Defer arbitrary async iteration. Kill any global no-mutation rule spanning Operation, Query, and Rule."
    },
    {
      "id": "LP-08",
      "classification": "adapt",
      "subject": "Module direction and direct Rule leaf",
      "authority_status": "private precedent and experimental profiles",
      "evidence": [
        "implementation/domainspec/architecture/pattern-library/LAYERING-REFERENCE.md:49-55",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:118-145",
        "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json:1114-1129",
        "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json:1094-1109",
        "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json:1107-1122"
      ],
      "actual_enforced_behavior": "Experimental TypeScript, Python, and Rust profiles encode Operation-to-Rule direct-leaf dependency as an error-level relation-property constraint.",
      "bypasses_or_limits": "All three profiles declare authority_effect none. Direct-leaf realization can conflict with the v1 module rule requiring cross-module use through public indexes.",
      "decision": "Keep direct-leaf and module layout in language/profile policy until the owner resolves the public-index boundary conflict."
    },
    {
      "id": "LP-09",
      "classification": "defer",
      "subject": "Exception and waiver policy",
      "authority_status": "imported v1 drift-governance mechanism; reformulation pending",
      "evidence": [
        "projects/domainspec-v2/impl/governance/tags/CODE-TAG-WAIVERS.md:1-41",
        "projects/domainspec-v2/impl/governance/tags/tools/validate-code-tags.ts:119-160",
        "projects/domainspec-v2/impl/governance/tags/tools/validate-code-tags.ts:654-660",
        "projects/domainspec-v2/impl/governance/tags/code-tag-waivers.yaml:1-29",
        "projects/domainspec-v2/IMPORT-MANIFEST.md:34-46"
      ],
      "actual_enforced_behavior": "A matching unexpired waiver marks a code-tag issue waived; strict mode blocks only non-waived HIGH or CRITICAL issues.",
      "bypasses_or_limits": "Live waiver entries are v1 residue that the import manifest says must be reset. Code tags require only concept ID and type, so they are not exact source/callable bindings. Waivers can suppress a blocking diagnostic but cannot change canonical semantics.",
      "decision": "Defer any general pattern-exception policy. If adapted later, retain the underlying finding, owner, reason, expiry, exact selector, and receipt evidence."
    },
    {
      "id": "LP-10",
      "classification": "kill",
      "subject": "Legacy derivation behavior as current authority",
      "authority_status": "separate legacy implementation path",
      "evidence": [
        "projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts:1-40",
        "projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts:62-81",
        "projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts:229-245",
        "projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts:540-555"
      ],
      "actual_enforced_behavior": "The legacy IR records enforces in a direction inconsistent with current Rule-to-Operation authority, and its legacy binding path uses first-match selection.",
      "bypasses_or_limits": "Direction drift and first-match ambiguity can select stale or unintended evidence.",
      "decision": "Do not reuse this path as authority or as the binding owner. Retain only separately verified derivation techniques."
    }
  ],
  "unresolved_residue": [
    "Owner promotion is still required for Rule purity, Query effect-freedom beyond state_change=no, and detailed Operation effect/order obligations.",
    "The owner must resolve direct-leaf imports versus public-index-only module boundaries.",
    "No owned complexity, nested-loop, traversal-count, allocation, or N+1 budget exists.",
    "Arbitrary async iteration, generators, streams, dynamic source, failure paths, and cancellation semantics remain outside current exact fixtures.",
    "Binding ownership remains split among code tags, architecture-conformance bindings, and legacy derivation sidecars.",
    "The imported code-tag waiver set requires v2 reformulation before it can support any pattern-policy exception route."
  ],
  "acceptance": {
    "exact_paths_and_selectors_returned": true,
    "authority_status_distinguished": true,
    "actual_behavior_and_bypasses_returned": true,
    "build_adapt_defer_kill_classification_returned": true,
    "unresolved_residue_explicit": true,
    "scope_widened": false
  }
}

## Agent 2 — algorithmic-semantics-explorer

receipt:
- action_id: `spawn-0002`
- role: `algorithmic-semantics-explorer`
- capability: `research`
- status: `complete`
- mutation: `none`
- intended_output: `projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/receipts/explorer-algorithmic-semantics.json`
- persistence: `inline return only; writing was prohibited by the action contract`
- inputs_read:
  - `strategy-inventory-packet.json`
  - `dispatch-sheet.json`
- claim_ceiling: `Primary-source semantic analysis only. Fixtures were designed but not executed. No DomainSpec authority, implementation profile, tooling fit, or repository behavior was established.`

## Direct answer

No universal source-shape rule survives adversarial analysis. The defensible portable layer is an observable contract, not “use reduce”, “one loop”, “no nested loops”, or “no database access in an Operation”.

For any enforced pattern or rewrite, preserve or explicitly constrain:

`⟨result, termination, error, effect identity/order/count, evaluation order, short-circuit point, input consumption, external roundtrips, asymptotic work, allocation/space, numeric mode, concurrency/cancellation⟩`.

Database/business-rule separation becomes portable only when DomainSpec owns a typed effect or dependency distinction. Architecture literature includes both Active Record, which combines database access and domain logic, and Data Mapper/Repository, which separates them; Service Layer coordinates operations. The portable invariant is therefore “implementation effects agree with declared semantic effects,” not a universal file or layer ban. [Fowler, *Patterns of Enterprise Application Architecture*, Domain Logic and Data Source patterns](https://martinfowler.com/eaaCatalog/). Effect systems demonstrate what a stronger typed claim requires: effects apparent in signatures and semantically connected to behavior. [Leijen, *Koka: Programming with Row-polymorphic Effect Types*, abstract and §§1–2](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/koka-effects-2013.pdf).

## Candidate classifications

### Portable semantic invariants, conditional on an owned DomainSpec declaration

- **P1 — Declared-effect fidelity:** a declared pure decision/Rule cannot perform database, network, clock, randomness, mutation, or other external effects except through explicitly declared inputs/effect capabilities. An Operation or Query may orchestrate declared effects. “Pure” cannot be inferred from a function name, folder, or use of `reduce`.

- **P2 — Rewrite equivalence:** loop fusion, loop splitting, imperative-to-fold, fold-to-loop, eager-to-lazy, and sequential-to-parallel rewrites require equality of the observable-contract tuple above. Hutton’s fold-fusion result has explicit algebraic side conditions; it is not a free syntactic rewrite, and the same paper notes that fold formulations can be less readable than explicit recursion. [Hutton, *A Tutorial on the Universality and Expressiveness of Fold*, §§2–3.2, especially pp. 357 and 359–360](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/CDBAA53C7120E23CBBBE206FD47FDBAA/S0956796899003500a.pdf/tutorial_on_the_universality_and_expressiveness_of_fold.pdf).

- **P3 — Cost-contract fidelity:** a complexity claim must name input measures and resource dimensions, for example `n = number of orders`, `queries ≤ 2`, `work ∈ O(n log n)`, `peak allocation ∈ O(n)`, and `stream buffering ≤ B`. A loop count or complexity score alone cannot discharge this obligation.

- **P4 — External-call budget:** data access inside a cardinality-dependent traversal must respect a declared roundtrip/call budget. N+1 is a real semantic-operational defect when each visited entity triggers another query, but separate queries may also be justified by conditional access, data volume, consistency, or join explosion. [EF Core, “Beware of lazy loading”](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying#beware-of-lazy-loading) and [single versus split-query trade-offs](https://learn.microsoft.com/en-us/ef/core/querying/single-split-queries).

- **P5 — Consumption and liveness:** transformations over one-shot, lazy, streaming, infinite, or asynchronous inputs must preserve consumption count, bounded memory, short-circuiting, cleanup, cancellation, and error timing. Python evaluates only the leftmost generator iterable eagerly and the remainder lazily; async generators retain state and require correct finalization. [Python 3.14 language reference, generator expressions and asynchronous generators](https://docs.python.org/3.14/reference/expressions.html#generator-expressions).

- **P6 — Parallel reduction laws:** parallel reduction requires a true identity and associativity over the actual value domain, plus an explicit order/effect policy. Rayon states that reduction order is unspecified and non-associative operations can be nondeterministic; parallel failure selection may also be unspecified. [Rayon 1.12 `ParallelIterator::reduce`](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html#method.reduce).

### Profile-local enforceable policies

These may be useful diagnostics but are not portable semantics:

- cyclomatic or cognitive-complexity thresholds;
- maximum nesting depth;
- maximum literal traversal count;
- import bans between Rule and repository/database modules;
- maximum iterator-chain length;
- preference for `reduce`, comprehensions, or explicit loops;
- query-count thresholds where DomainSpec has not declared a call budget;
- mutation bans or accumulator-shape restrictions.

McCabe complexity depends on decision structure and is independent of functional statement count, so it measures control-flow shape rather than runtime cost or correctness. [McCabe, *A Complexity Measure*, abstract and §II](https://doi.org/10.1109/TSE.1976.233837). Cognitive Complexity has empirical support for some understandability proxies, but results were mixed for comprehension correctness and absent for physiological measures; it should remain a maintainability signal. [Barón, Wyrich, and Wagner, §§4–5](https://arxiv.org/abs/2007.12520).

### Advisory heuristics

- Prefer a named aggregate or fold when the operation is a small, pure, total accumulation with an explicit initial value and no early-exit requirement.
- Prefer `any`, `all`, `find`, or a fallible/short-circuiting fold when their stopping semantics match the requirement.
- Prefer an explicit loop when control flow, multiple state variables, cleanup, early exit, effects, or error propagation are clearer there.
- Consider fusion only for compatible pure traversals when it measurably reduces work or allocation and preserves ordering and failure behavior.
- Batch or hoist remote access when call count grows with collection cardinality.
- Keep two passes when pass two depends on a global value from pass one, or when separation materially improves proof, readability, or memory behavior.
- Measure before parallelizing or replacing an allocation strategy.

Python’s own HOWTO says many `functools.reduce` uses are clearer as loops. [Python Functional Programming HOWTO](https://docs.python.org/3.14/howto/functional.html). Rust likewise documents lazy `map`, recommends `for` for side effects, distinguishes full `fold` from short-circuiting `try_fold`, and notes that fold order matters for non-associative operators. [Rust `Iterator`, `map`, `fold`, and `try_fold`](https://doc.rust-lang.org/std/iter/trait.Iterator.html).

### Killed folklore

- **KILL:** “Prefer reduce over multiple loops.”
- **KILL:** “One pass is always algorithmically better than two passes.” Two fixed passes remain `O(n)` and may be semantically necessary.
- **KILL:** “Nested loops imply quadratic cost.” Total inner work may be bounded or disjoint; conversely, one loop can hide quadratic searches or N+1 I/O.
- **KILL:** “Reduce is pure.” ECMAScript explicitly permits callbacks to mutate the traversed object. [ECMAScript 2023 §§23.1.3.8, 23.1.3.21, and 23.1.3.24](https://tc39.es/ecma262/2023/multipage/indexed-collections.html).
- **KILL:** “Reduce short-circuits.” JavaScript array `reduce`, Python `functools.reduce`, and Rust `fold` normally consume the traversal; `find`/`any`/`try_fold` supply distinct stopping semantics.
- **KILL:** “A map/filter/reduce chain has the same allocation behavior everywhere.” JavaScript array `map` and `filter` create arrays; Python generators and Rust iterator adaptors are lazy.
- **KILL:** “Lower cyclomatic/cognitive complexity proves correctness or performance.”
- **KILL:** “Database access inside every Operation is invalid.” That requires an owned effect/architecture contract.
- **KILL:** “Parallel reduce preserves a sequential reduction.” Ordering, first error, side effects, and floating-point results can differ.
- **KILL:** “Mutation is intrinsically invalid.” Unaliased local mutation can be clearer and avoid allocation; hidden externally observable mutation is the semantic risk.
- **KILL:** “Fold is intrinsically more readable.” Hutton and Python’s maintained documentation both provide direct counterevidence.

## Three-language fixture matrix

| Fixture | TypeScript | Python | Rust | Required assertions |
|---|---|---|---|---|
| Pure monoid aggregate | `BigInt` loop versus `reduce` | integer loop versus `sum`/`reduce` | checked integer loop versus `fold` | Same value, identity, visit count `n`, no effects/errors |
| Early match before poison item | `find`/`some` versus `reduce` | `any` over generator versus `reduce` | `find`/`any`/`try_fold` versus `fold` | Stop at match; poison callback/query not invoked; same returned witness |
| Justified two-pass classification | first compute threshold, then classify | same | same | Two passes accepted; output/order exact; work `2n`; no claim that fusion is equivalent |
| Safe fusion | separate pure sum/count passes versus tuple accumulator | same | same | Exact integer result; visits `2n` versus `n`; allocation and readability recorded |
| Eager/lazy chain | array `map().filter()` | generator expression | iterator `map().filter()` | Same values/order; record intermediate allocation and callback timing separately |
| Error/effect ordering | callback log then throw at element `k` | generator/fold raising at `k` | iterator returning `Err` at `k` | Exact effect prefix, exception/error identity, remaining-input state, cleanup |
| N+1 query | per-item repository call versus batch query | same with spy datasource | same with mock trait | Same domain result; query count `n+1` versus bounded; payload/latency evidence retained |
| Nested-loop counterexamples | disjoint buckets and all-pairs | same | same | Disjoint total visits `n`; all-pairs `n²`; single-loop linear-search mutant also `n²` |
| Infinite/stream input | async iterable with first-match cancellation | async generator | iterator/stream analogue | Bounded memory, termination at `k`, iterator close/finalization, no full fold |
| Numeric order | left fold and reordered/parallel-style reduction | `sum` versus `math.fsum` | sequential fold versus Rayon reduce | Exact or declared-tolerance verdict; expose non-associativity and overflow policy |
| Hidden mutation | reducer mutating external log/state | same | interior/shared mutation analogue | Diagnostic differs from an unaliased local accumulator; effect trace is observable |
| Async concurrency | sequential `for await` versus launched promises | `async for` versus gathered tasks | sequential stream versus concurrent futures | Ordering, maximum concurrency, first error, cancellation, cleanup all explicit |

For numerical evidence, Python documents `math.fsum` as tracking partial sums to reduce precision loss, while Rayon documents unspecified reduction order. [Python `math.fsum`](https://docs.python.org/3.14/library/math.html#math.fsum), [Rayon reduction semantics](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html#method.reduce).

## Residue for synthesis

- DomainSpec must first decide whether Operation, Query, and Rule own typed effect declarations; external research cannot promote that distinction.
- Static syntax may prove bounded facts only for deliberately restricted forms. General cost, purity, callback effects, dynamic dispatch, lazy ORM access, and semantic equivalence need typed declarations, conservative analysis, tests, or runtime evidence.
- Traversal count, complexity metrics, and import rules should be labeled proxies with suppressions and known bypasses.
- No fixture or tool was executed in this action; all enforcement-realizability claims remain with the language/tooling explorer.

## Agent 3 — language-tooling-explorer

## Bounded receipt — `spawn-0003`

- `status`: `pass`
- `role`: `language-tooling-explorer`
- `capability`: `research`
- `mode`: `explore`
- `mutation_policy_observed`: `read-only`
- `writes`: `[]`
- `receipt_persistence`: returned to parent for persistence; helper did not write the declared output file.
- `claim_ceiling`: Official documentation was verified on 2026-08-20. No tools were installed, no repository fixtures were executed, and no false-positive, IDE-latency, or performance rates were measured.

### Direct result

The viable cross-language model is layered enforcement, not one universal lint:

1. Enforce declared module and dependency boundaries with import-graph rules.
2. Enforce calls to typed effect, repository, Query, or Rule APIs with type-aware AST/HIR checks.
3. Treat complexity, nesting, traversal count, nested loops, and N+1 detection as profile-owned heuristics unless a stronger cost/effect contract exists.
4. Prove behavior-sensitive claims with fixtures and runtime observations, not lint metrics.

The current packet explicitly says that database/business-rule separation and complexity budgets are not established DomainSpec v2 invariants. Therefore these remain proposals, not authority. The universal rules “prefer reduce”, “avoid multiple loops”, and “avoid early returns” should be killed.

### Toolchain projection

| Language | Defensible enforcement surface | Important limitation | Configuration and evidence |
|---|---|---|---|
| TypeScript | `dependency-cruiser` or ESLint import rules for layers; typed `typescript-eslint` custom rules for resolved callee/type checks; ESLint complexity for profile thresholds | `no-restricted-imports` sees static imports only. Typed linting builds project type information and has a measurable cost. Aliases, dynamic imports, callbacks, DI containers, and runtime ORM behavior remain incomplete. | Own rules in the TypeScript implementation profile. Emit ESLint `json-with-metadata`, with tool/config/source digests. ESLint v10 is current; `typescript-eslint` currently supports ESLint 8/9/10 and TypeScript `>=4.8.4 <6.1.0`, so pin the trio and fail unsupported combinations. [ESLint version support](https://eslint.org/version-support/), [typescript-eslint dependency versions](https://typescript-eslint.io/users/dependency-versions/), [typed custom rules](https://typescript-eslint.io/developers/custom-rules/#typed-rules), [typed-lint performance](https://typescript-eslint.io/getting-started/typed-linting/#performance), [dependency-cruiser rules](https://github.com/sverweij/dependency-cruiser#validate-things) |
| Python | Import Linter forbidden/protected/layers contracts; Pylint AST checkers using Astroid inference; Ruff/Pylint built-ins for complexity and ordinary hygiene | Ruff has no third-party custom-rule surface. Python dynamic imports, monkey-patching, decorators, reflection, and partial Astroid inference prevent sound call/effect analysis. Mypy plugins target framework typing and explicitly have an unstable API; they are not the primary architecture-lint owner. | Own contracts and custom Pylint diagnostics in the Python profile. Ruff can emit JSON/SARIF-family formats; Pylint supports enriched `json2`. Pin Pylint/Astroid and Ruff separately. [Import Linter contracts](https://import-linter.readthedocs.io/en/stable/contract_types/), [Pylint 4.0.7 custom checkers](https://pylint.readthedocs.io/en/stable/development_guide/how_tos/custom_checkers.html), [Ruff custom-rule limitation](https://docs.astral.sh/ruff/faq/#can-i-write-my-own-linter-plugins-for-ruff), [Ruff C901](https://docs.astral.sh/ruff/rules/complex-structure/), [mypy plugin stability boundary](https://mypy.readthedocs.io/en/stable/extending_mypy.html#extending-mypy-using-plugins) |
| Rust | Module visibility and crate boundaries; Clippy `disallowed_methods` for globally known effect APIs; custom Dylint `LateLintPass` over typed HIR for scope-sensitive Rule/Query/effect and loop-call checks | Clippy’s ordinary set is not a project plugin system. Dylint permits user libraries, but it depends on compiler-private surfaces whose APIs have no stability guarantee. Macros, trait dispatch, FFI, generated code, and indirect effects require explicit boundaries. | Own custom lint libraries and fully qualified paths in the Rust profile. Pin the complete Rust toolchain plus Dylint lint commit. Cargo/rustc JSON messages can feed receipts; Dylint documents rust-analyzer JSON integration. [Clippy `disallowed_methods`](https://rust-lang.github.io/rust-clippy/master/index.html#disallowed_methods), [Clippy lint passes and UI tests](https://doc.rust-lang.org/stable/clippy/development/adding_lints.html#lint-passes), [Dylint custom libraries](https://github.com/trailofbits/dylint#writing-lints), [Cargo JSON messages](https://doc.rust-lang.org/cargo/reference/external-tools.html#json-messages) |

Formatters should remain outside semantic enforcement: they normalize source trivia and cannot establish dependency, effect, traversal, or complexity guarantees.

### Candidate-rule verdicts

| Candidate | Detectability and failure boundary | False positives / false negatives | Autofix | Classification |
|---|---|---|---|---|
| Business Rule must not directly access database/repository APIs | High when Rule locations and effect APIs have canonical identifiers: import graph plus resolved-callee check. Low without those declarations. | Adapters, mocks, cache reads, generated clients, aliases, dynamic imports, DI, trait/object dispatch | None | Proposed portable invariant only after a typed effect boundary is authority-owned; mappings remain profile-local |
| Direct Rule invocation restriction | High for direct resolved calls; medium for call-graph reachability | Higher-order calls, decorators/macros, reflection, dynamic dispatch | None | Build-from-owned if the July direct-Rule dependency baseline truly owns it; otherwise defer |
| Maximum cyclomatic complexity or nesting | Syntactically easy in all three languages | Metric varies by syntax and tool; does not prove correctness, runtime cost, or readability | None | Profile-local advisory threshold |
| Repeated traversal of one collection | Medium for adjacent, local, same-symbol passes | Aliases and helpers cause misses; two passes may preserve ordering, short-circuit behavior, allocation bounds, or clarity; lazy iterators alter what “pass” means | None | Advisory heuristic / experiment |
| Nested loop means unacceptable complexity | High syntax detection; low cost proof | Inner input may be bounded, indexed, sparse, or constant; costly behavior can also be hidden behind calls | None | Advisory risk diagnostic, never correctness |
| Prefer `reduce`/fold over multiple loops | Syntax is detectable; semantic superiority is not | Fold may hide mutation/state, allocate closures, change exception order, block early exit, or worsen readability. Multiple passes may be deliberate. | Unsafe | **KILL universal rule** |
| Forbid early returns | Easy syntax detection | Early return often provides the required short-circuit or error behavior | Unsafe | **KILL universal rule**; language-local style only |
| Fuse async or streaming loops | Syntax detectable; equivalence generally not | Backpressure, resource lifetime, cancellation, awaiting order, partial consumption, and errors may change | Unsafe | **KILL as automatic rewrite**; require explicit stream contract |
| Query call inside loop / N+1 risk | Medium when query/effect calls are explicitly tagged and loop context is visible | Cached/batched calls and bounded loops can be valid; helper-mediated or ORM-generated calls are missed | None | Profile-local warning, promotable only with runtime query-count evidence |
| Purity/effect enforcement | Useful only against an explicit effect API set and bounded call graph | Hidden I/O, globals, reflection, FFI, interior mutation, callbacks | None | Portable only as a declared effect capability; otherwise an approximation |

ESLint itself advises using warning severity when a rule is uncertain and supports reason-bearing suppressions plus unused-suppression reporting. Clippy similarly distinguishes style/restriction lints from correctness and warns that its old cognitive-complexity metric is not a true measurement. [ESLint rule severity and suppression](https://eslint.org/docs/latest/use/configure/rules), [Clippy cognitive-complexity warning](https://rust-lang.github.io/rust-clippy/master/index.html#cognitive_complexity).

### Suppression and exclusion contract

A usable profile should require:

- Narrow rule-specific suppression, never blanket file disable by default.
- Reason, owner, and optional expiry/ticket on every suppression.
- CI failure for unused or malformed suppressions.
- Explicit generated/vendor/test fixture globs recorded in configuration.
- Separate `unsupported` diagnostics for dynamic constructs instead of silently passing them.
- No semantic autofix unless compilation plus behavior fixtures prove the exact rewrite.

The shared DomainSpec layer may normalize a proposed diagnostic envelope—candidate semantic ID, language/profile, tool and version, configuration digest, source digest, file/span/symbol, verdict, support status, suppression record, command/exit code, and raw artifact locator. It should not normalize language-specific thresholds, AST shapes, or “reduce versus loop” preferences into portable semantics.

### Minimum three-language fixture matrix

| Fixture | Expected result |
|---|---|
| Operation queries through an owned Query/repository boundary, then supplies plain data to a Rule | Pass |
| Rule directly imports or invokes the declared database/repository effect API | Fail with resolved boundary/callee evidence |
| Direct Rule-to-Rule call versus allowed orchestration-mediated composition | Distinct pass/fail if an owner exists; otherwise `deferred` |
| Query call per loop element versus one batched query outside the loop | First warns as N+1 candidate; second passes |
| Nested scan with unbounded input versus bounded fixed-size inner loop or indexed lookup | Warn only for the first when bounds are evidenced; do not infer complexity from syntax alone |
| Two justified passes, fused pass, pure fold, and fold with hidden mutation | All behaviorally classified; no blanket source-shape verdict |
| Explicit early-exit search versus full fold | Early-exit loop passes; fixture asserts iteration count |
| Eager map/filter allocation versus lazy iterator chain | Assert result, allocation behavior, and evaluation count separately |
| Sync exception, async failure, cancellation, and streaming backpressure | Assert ordering, error identity, effects, and partial-consumption behavior |
| Dynamic import/reflection/macro/generated case | `unsupported` or excluded with typed reason, never silent proof |
| Valid suppression, stale suppression, and blanket suppression | Valid exception accepted; stale and overbroad forms fail |

Each fixture should assert output, effect trace, query count, iteration count, ordering, exception identity, and allocation where measurable. Rule-level tests can use `@typescript-eslint/rule-tester`, Pylint checker tests, and Rust UI tests. Mutation testing can add behavioral pressure through [StrykerJS](https://stryker-mutator.io/docs/stryker-js/typescript-checker/), [mutmut](https://mutmut.readthedocs.io/en/latest/), and [cargo-mutants](https://mutants.rs/getting-started.html), but surviving/killed mutants do not prove asymptotic cost or readability.

### Residue

- No tool was executed against current DomainSpec source.
- No profile configuration owner was verified beyond the packet.
- No framework-specific ORM/query detector was selected.
- Dynamic behavior and transitive effect detection remain incomplete.
- Exact versions, executable hashes, performance, editor behavior, and false-positive rates require a later three-language experiment.
- No implementation, authority, promotion, publication, release, or production claim is supported.

Local basis: [strategy-inventory-packet.json](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/strategy-inventory-packet.json:112) and [dispatch-sheet.json](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/dispatch-sheet.json:51).
