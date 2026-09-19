---
title: SFOL Deterministic Test Closure Implementation Layering
status: planning-candidate
updatedAt: 2026-09-01
owner: DomainSpec v2 TDE and Auth Foundation owners
scope: capability
authorityEffect: none
---

# SFOL Deterministic Test Closure Implementation Layering

This plan adds a successor test-closure capability after the implemented Auth
L0-L6 construction. It does not revise the admitted Lean formal claim, derive
the SFOL claim from Lean, or change the meaning of the admitted SFOL claim.

The target is a deterministic compiler from one admitted, typed SFOL clause to
neutral cases, exact Rust observations, a closed proof receipt, and bounded
mutation evidence.

```text
admitted SFOL + immutable proof context
  -> exact clause denominator
  -> versioned partition rules
  -> canonical neutral fixtures
  -> evaluated SFOL cases
  -> exact Rust bindings
  -> real Rust observations
  -> SFOL evaluations
  -> set-equality proof receipt
  -> mutation adequacy receipt
```

## Planning and authority boundary

- This is a planning candidate only. It does not authorize implementation,
  admission, acceptance, publication, deployment, or an external effect.
- The existing Python ontology runtime is not an input and cannot admit or
  block this work.
- The existing admitted Lean claim remains an independent sibling claim. No
  Lean source or receipt is an implementation target.
- Existing `*.v1.json` claim, admission, fixture, and evidence carriers remain
  immutable historical inputs. Successor evidence uses new versioned files.
- The dirty Auth worktree must be snapshotted before each wave. Each wave uses
  an exact allowlist and preserves unrelated owner bytes.

## Selected semantic dependencies

The implementation may depend only on these selected records and selectors,
with fresh digests frozen at the start of L7:

- ontology ID `AUTH-ONTOLOGY-AUTHORIZATION-COMMAND-BOUNDARY`;
- operation `AUTH-CB-OP-ADMIT-AUTHORIZATION-COMMAND`;
- clause `AUTH-CB-SFOL-READY-IFF`;
- rules
  `AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE`,
  `AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING`,
  `AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE`, and
  `AUTH-CB-RULE-ADMISSIBLE`;
- `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/FORMAL-CLAIM-SFOL.v1.json`;
- `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/SFOL-MODULE.v1.json`;
- `formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/sfol-formal-claim-admission-001.json`;
- `implementation/standard-conformance/command-boundary-compiled-operation-graph.json`;
- `implementation/standard-conformance/command-boundary-system-ontology.json`;
- the exact generated Rust command-boundary crate and its current build receipt.

Drift outside this set is diagnostic. Missing, changed, ambiguous, or stale
selected dependencies fail closed.

## Current gap

The existing TDE already provides:

- SFOL decoding, type checking, and evaluation;
- exact clause-denominator construction;
- canonical SHA-256 values and fixture/case identities;
- exact binding resolution;
- pure invocation, observation, and evaluation;
- proof receipts requiring equality across `C_spec`, `C_projected`,
  `C_validated`, `C_typed`, `T_generated`, `C_bound`, `O_run`, and
  `R_evaluated`.

The missing unit is SFOL-AST-to-neutral-fixture derivation. Auth currently
supplies five handwritten scenario fixtures and directly renders Rust tests.
It does not build the native denominator/binding/observation/evaluation/proof
closure, and it omits three valuations from the three-Boolean truth space.

## Layer decision table

| Layer | Decision question | Minimum working unit | Operator outcome | Risk reduced | Promotion |
| --- | --- | --- | --- | --- | --- |
| L7 - Auth Boolean closure | After this layer, we know whether an admitted Boolean SFOL clause can mechanically produce exhaustive neutral cases and a proof receipt over real Rust observations. | The current three-input Auth clause derives all eight valuations, executes the generated Rust kernel for every case, and closes all eight proof sets. | One replayable eight-case Auth proof receipt with no handwritten case selection or expected results. | Missing cases, manufactured observations, and adapter-owned oracle logic. | Continue only when two clean derivations and executions are byte-identical and every set join closes. |
| L8 - bounded SFOL partition calculus | After this layer, we know whether partition derivation is capability-neutral and remains deterministic for supported finite SFOL operators. | A versioned rule catalog, declared finite witness domains, budget behavior, typed residue, and one non-Auth vertical. | Reusable neutral-case derivation for supported Boolean, enum, comparison, set/list, and quantifier boundaries. | Auth overfitting, guessed witnesses, and combinatorial instability. | Continue only if unsupported or unbounded terms become explicit residue and the second vertical uses no Auth identifiers. |
| L9 - mutation adequacy | After this layer, we know whether derived cases distinguish the supported semantic faults the rule catalog promises to expose. | Deterministic SFOL AST mutants, equivalent-mutant classification, kill matrix, and integration negative controls. | A content-addressed mutation receipt where every mutant is killed, equivalent, or explicit residue. | Superficial coverage that executes every case but cannot detect meaningful semantic changes. | Package only when there are no silently surviving supported mutants. |
| L10 - stable package and migration | After this layer, we know whether the capability can be invoked repeatably without Auth-specific test orchestration owning derivation semantics. | Stable TDE API/CLI, versioned artifacts, validator integration, historical v1 preservation, and replay documentation. | One supported DomainSpec TDE path; Auth retains only the context-to-Rust binding adapter. | Dual derivation paths, receipt drift, and accidental evidence inflation. | Close locally after fresh aggregate validation; publication remains separate. |

## L7 - minimum working unit

### Decision algorithm

For each admitted denominator member whose clause is a pure predicate or
Boolean-returning function:

1. Verify exact module, clause, node, graph, manifest, build, source-set, and
   profile identities and digests.
2. Decode and type-check the module; require that the denominator membership
   equals the selected admitted clause.
3. Collect the clause's primitive Boolean inputs and sort their names by Unicode
   code-point order.
4. Require an `exhaustive-boolean/v1` rule set and a declared maximum input
   count. L7 uses a maximum of 12; exceeding it returns
   `SFOL_PARTITION_BUDGET_EXCEEDED` and generates nothing.
5. Enumerate integers from `0` through `2^n - 1`; map the fixed-width bit vector
   to sorted input names with `0=false` and `1=true`.
6. Canonicalize the assignment and derive the fixture ID from SHA-256 of the
   rule-set version, coverage key, typed clause digest, and assignment.
7. Evaluate the unchanged typed SFOL expression to obtain the expected digest.
8. Sort fixtures and cases by their stable IDs. Reject duplicate identities.
9. Resolve one exact Rust binding for every case.
10. Invoke the real Rust observation target with the three Boolean inputs. The
    Auth adapter maps each false input independently to its corresponding
    context mutation, invokes `admit_authorization_command`, and returns
    `true` for `Ready` and `false` for `Deny`.
11. Evaluate each observation through `evaluatePureObservation`.
12. Build `buildPureProofReceipt`; require exact set equality across all eight
    stages and require every evaluation to pass.
13. Repeat from a clean generated target. Require byte-identical cases,
    generated Rust, observations, evaluations, and proof receipt.

For the current Auth clause this necessarily produces eight cases: one
`Ready` valuation and seven `Deny` valuations.

### L7 exact implementation surface

Generic TDE files:

- create `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/partitions/index.ts`;
- create `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/partitions/partitions.test.ts`;
- add focused exports only if the existing direct-module import boundary is
  insufficient.

Auth successor files:

- create `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/SFOL-CLAUSE-ADMISSION-MANIFEST.v1.json`;
- create `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/TDE-CASES.v2.json`;
- create `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/TDE-EVIDENCE.v2.json`;
- create `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/EVF-OBLIGATION.v2.json`;
- refactor `formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/derive-tests.ts` into a thin composition adapter over the native TDE APIs;
- update `implementation/sfol-conformance/Cargo.toml` so the observation binary can link the generated kernel;
- create `implementation/sfol-conformance/src/main.rs` as the machine-readable Boolean observation target;
- regenerate `implementation/sfol-conformance/tests/derived.rs` from the eight neutral cases;
- update `implementation/scripts/validate.py` to validate v2 digests, eight-case inventory, exact stage-set closure, two-run identity, and historical v1 preservation.

No change is expected in `cases/index.ts`, `bindings/index.ts`,
`runners/pure/index.ts`, or `proof/index.ts`. A change there requires a focused
failing test that proves an existing contract cannot express the L7 join.

### L7 exit evidence

- partition unit tests cover zero inputs, one input, the Auth three-input case,
  stable ordering, duplicate names, stale digests, unsupported sorts, and the
  budget boundary;
- the Auth case set is exactly eight unique IDs and all are denominator-bound;
- generated Rust contains exactly eight tests and no expected result copied
  from a handwritten fixture;
- Rust observation output contains exactly eight unique case IDs;
- all evaluations pass and all proof-stage sets are equal;
- deleting, duplicating, or changing any case, binding, observation, or digest
  makes proof construction fail;
- two clean runs produce identical SHA-256 digests;
- existing TDE SFOL tests, Auth validation, strict Rust checks, and all Auth
  tests remain green.

## L8 - capability-neutral bounded partition calculus

L8 extends the rule set without allowing arbitrary value invention. The input
contract adds a canonical `PartitionDomain` containing finite witnesses and
universes. A term that needs a witness absent from that domain becomes typed
residue; it is never guessed.

Supported rule families are introduced one at a time:

| SFOL form | Deterministic partitions |
| --- | --- |
| Boolean or enum input | Exhaustive declared values |
| `not p` | Partitions inherited from `p` with inverted result |
| `p and q`, `p or q` | Exhaustive below budget; otherwise declared deterministic MC/DC |
| `x = y`, `x != y` | Equal and unequal witnesses from the declared domain |
| `<`, `<=`, `>`, `>=` | Below, equal, and above around literals or declared boundaries |
| count/exact cardinality | `0`, exact boundary, and one above where the finite domain permits |
| set equality/membership | Equal, missing member, extra member, present, and absent |
| `exists`, `forall` | Empty, one satisfying witness, and one violating witness when declared |
| unsupported call, arithmetic, or missing domain | Typed residue with source span and causal code |

When a Cartesian product exceeds the declared budget, the caller must select a
versioned reduction mode. `mcdc/v1` uses fixed atom ordering and lexicographic
tie-breaking. No implicit random, pairwise, or first-found fallback is allowed.

L8 adds a non-Auth SFOL fixture under the TDE package and proves that the same
partition module, case derivation, and proof closure operate without Auth IDs
or branches.

Expected files:

- extend `src/sfol/partitions/index.ts` and its focused tests;
- create `src/sfol/partitions/domains.ts` only if witness validation is not
  coherent inside the main module;
- add one small non-Auth fixture and vertical test under `src/sfol/partitions/`;
- document the rule-set and residue codes in the TDE guide.

## L9 - deterministic mutation adequacy

Create a mutation catalog over the supported SFOL AST. Mutants are sorted by
source span, original operator, replacement operator, and canonical operand
digest. The mutant ID is the SHA-256 of that tuple plus the mutation-catalog
version.

Initial mutations:

- `and` to `or` and `or` to `and`;
- insert or remove `not` at an atomic Boolean term;
- flip a Boolean literal;
- replace `eq` with `neq` and the inverse;
- shift strict/non-strict comparison boundaries;
- change existential to universal and the inverse where types permit;
- change exact cardinality by one where a finite domain permits.

For every mutant:

1. Type-check the mutated module.
2. If ill-typed, record `invalid-mutant`; it does not count as killed.
3. Compare mutant and original over the complete bounded case domain.
4. If no valuation differs and the domain is exhaustive, record
   `equivalent-bounded` with the domain digest.
5. Otherwise require at least one derived case whose original and mutant
   expected digests differ; record the stable kill set.
6. Record unsupported mutation families as residue.

Integration negative controls also mutate one Rust binding, one observation,
one case digest, and one stage set and require the existing proof builder to
reject each mutation.

Expected files:

- create `src/sfol/mutations/index.ts` and `mutations.test.ts`;
- create Auth `TDE-MUTATION-EVIDENCE.v1.json`;
- extend the Auth validator with exact mutant-set and kill/residue closure.

## L10 - package, migration, and replay

- Expose a stable TDE SFOL command or API that accepts exact module,
  denominator, partition-domain, rule-set, binding, and target handles.
- Emit canonical case, observation, evaluation, proof, mutation, and replay
  artifacts without timestamps in content-addressed data.
- Keep wall-clock or host metadata in a non-identity execution envelope only.
- Preserve the v1 five-fixture evidence as historical evidence; do not rewrite
  its receipt or admission-bound predecessors.
- Retain Auth-specific code only for mapping neutral Boolean arguments into a
  valid `CommandBoundaryContext` and invoking Rust. It must not select cases or
  calculate expected outcomes.
- Add drift checks proving that claim, module, denominator, rule set, target,
  runtime, and binding digests are current.
- Document replay from an allowlisted receipt using the existing
  `replayPureProofReceipt` contract.

## Implementation waves

| Wave | Layer | Work | Verification |
| --- | --- | --- | --- |
| W7.0 | L7 | Freeze exact selected dependency digests and dirty-byte ownership. | Preimage manifest, no intersecting active writer, immutable v1 baseline. |
| W7.1 | L7 | Add exhaustive Boolean partition derivation and unit tests. | Focused TDE typecheck/tests; two-run canonical case identity. |
| W7.2 | L7 | Build the Auth clause denominator and derive all eight neutral cases. | Exact denominator/case coverage; no handwritten expected values. |
| W7.3 | L7 | Add the Rust observation runner and exact per-case bindings. | Eight real observations; stale or partial bindings fail closed. |
| W7.4 | L7 | Build evaluations, proof receipt, generated Rust tests, and validator integration. | Eight equal stage sets, all pass, aggregate Auth validation twice. |
| W8 | L8 | Add finite-domain rules, budgets, residue, and a non-Auth vertical. | No Auth identifiers in generic code; deterministic reduced/exhaustive modes. |
| W9 | L9 | Add mutation catalog, kill matrix, and proof negative controls. | Every supported mutant killed or classified; no silent survivors. |
| W10 | L10 | Stabilize command/API, replay, docs, and migration boundary. | Fresh package and aggregate validation; v1 bytes preserved. |

## Non-regression guardrails

- SFOL remains a sibling formal claim; Lean theorem bytes and meaning do not
  change.
- The admitted SFOL source is evaluated, not re-authored by the test engine.
- Expected outcomes always come from the typed SFOL evaluator, never the Rust
  renderer, Auth adapter, or a fixture field.
- Observations always come from the bound Rust target; passing test-process
  status is not substituted for semantic output.
- Stable identities use canonical JSON and lowercase SHA-256. No timestamp,
  random seed, filesystem order, locale, or network result enters identity.
- Enumeration and tie-breaking orders are explicit and versioned.
- Bounds are inputs to identity. Exceeding a bound fails closed or uses only an
  explicitly selected reduction rule.
- Unsupported semantics produce residue and make dependent completeness claims
  not evaluable.
- Every stage is an exact set join; missing, extra, duplicate, stale, failed,
  or indeterminate members prevent a passing receipt.
- Technical PASS does not establish product admission, production security,
  publication, deployment, or external-effect authority.

## Promotion and stop rules

- Start implementation with W7.0 only and freeze the exact dependency and
  dirty-byte manifest before changing generic or Auth files.
- Promote from W7.1 only if Boolean enumeration is deterministic and bounded.
- Promote from W7.3 only if observations are returned by Rust, not inferred
  from generated assertions.
- Promote to L8 only after the complete eight-case L7 proof replays from exact
  allowlisted digests.
- Stop and re-plan if L7 requires modifying the admitted SFOL or Lean claim,
  weakening exact binding selectors, or fabricating upstream stage sets.
- Re-run the layering review if a new SFOL language version, another target
  language, effectful clause, or unbounded domain becomes current scope.

## Recommended next action

Execute W7.0 only: snapshot the exact v1 sources and current generated Rust
target, resolve ownership of every proposed L7 path, and materialize a no-effect
dependency/preimage manifest. Then implement W7.1 against that immutable
baseline.

## Local execution result - 2026-09-01

L7 is complete locally. Bounded foundation slices of L8 through L10 are also
implemented:

- the admitted Lean claim and all historical v1 carriers remain unchanged;
- the generic finite partition API derives eight Auth Boolean valuations;
- eight exact bindings produce sixteen real Rust observations over two runs;
- all eight evaluations pass and the eight proof-stage sets close exactly;
- proof replay succeeds against the exact denominator, typed artifact, and
  tool digests;
- four deterministic Auth SFOL mutants are all killed by the exhaustive case
  domain;
- the stable API and replay/adapter boundaries are documented in the TDE
  package;
- non-Boolean finite witnesses, automatic enums, and exact finite universes
  are representable, while budget overflow remains fail-closed.

The broader L8 reduction and operator-specific partition catalog remains
deferred: deterministic MC/DC, automatic comparison-boundary witness
synthesis, and specialized set/list/quantifier partition strategies are not
claimed by this result. L9 currently covers the initial Boolean, comparison,
literal, and quantifier mutation catalog; later catalog versions remain
successors rather than implied completeness.

This is local technical evidence only. Publication, admission of a successor
system ontology, deployment, and production-security claims remain separate.
