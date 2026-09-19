# Policy selection using declared Rules

Date: 2026-09-09. PCR-06 / bounded DSR-015 product construction.
Authority effect: none. This is a configured TypeScript compiler candidate,
not public CLI integration, profile admission or full 39-realization completion.

## Implemented contract

`domainspec.typed-policy/v2` separates Policy selection from Rule meaning.
The closed node body contains description and typed_contract. The contract
contains schema_version, ontology_policy, inputs, cases and default_target.
Each ordered case contains a target and a Rule reference; a reference contains
an existing Rule selector and exact parameter/value bindings.

```json
{
  "schema_version": "domainspec.typed-policy/v2",
  "ontology_policy": "COMMERCE-REVIEW-POLICY",
  "inputs": [
    {"name": "total", "type": {"kind": "scalar", "name": "UInt64"}}
  ],
  "cases": [
    {
      "target": "commerce:review",
      "rule": {
        "selector": "commerce:high-value",
        "arguments": [
          {"parameter": "amount", "value": {"op": "path", "root": "total", "properties": []}}
        ]
      }
    }
  ],
  "default_target": "commerce:accept"
}
```

This fragment requires a declared Boolean Rule `commerce:high-value` with an
UInt64 amount parameter, existing Operation/Calculation targets, and canonical
Policy applies edges to exactly review and accept. It does not define the Rule
predicate or execute either target.

The planner emits static Policy arrows, their frozen callable/descriptor
bindings, and separately generated structured Rule v8 modules:

```text
application/features/commerce/src/domain/
  policies/choose.provider.ts   typed select(parameters) arrow
  policies/choose.ts            immutable callable and descriptor
  rules/eligible.ts             declared Boolean Rule
  rules/forward.ts              Rule composition, not Policy inlining
  rules/high.ts                 transitive declared Rule dependency
```

Case order is meaningful. The first true Rule selects its case target; the
fallback selects default_target. Repeated target or Rule references remain
separate ordered case occurrences. Only reached Rules and their argument
expressions evaluate; there is no implicit caching or execution of a strategy.

## Type and relationship checking

The generic `createTypedValueChecker` now serves Mapping field expressions
and Policy Rule arguments. No synthetic Entity, Rule or Operation is inserted
to borrow another metatype's validator. Mapping behavior remains covered by
its unchanged tests.

Policy arguments use scalar, named, optional, list, set and sum values.
Ontology property paths and explicit list-to-set conversion reuse existing
static value-expression lowering. Every supplied Rule parameter is bound
exactly once with the exact declared type. Unknown Rules, extra/missing/wrong
arguments, invalid paths and implicit optional traversal reject before generation.
Rules retain their independently checked transitive closures.

Scalar-only Policies explicitly select a null field compilation. They do not
need a fabricated data root. Named values require a registered exact field
model from the same checked graph. Policy, Rule and target evidence all bind
that graph; cloned, detached or cross-graph snapshots reject.

The existing canonical relations remain unchanged:

- Policy `applies` to Operation or Calculation, within its supported scope.
- Rule references in a Policy are value dependencies, not invented applies or
  enforces relationships.
- Rule `enforces` Operation retains its existing meaning.
- Calculation `calculates` Operation remains distinct from a Policy selecting
  that Calculation. The fixture supplies a lawful existing Operation endpoint.

All Policy facts validate before selection, including unused formal inputs and
facts not needed by an early successful branch. Structural normalization returns
frozen copies; it does not run Entity factories, invariant validation or reference
lookup. Full-width UInt64 remains bigint internally. List occurrences, set
equality, optional null, Entity identity and sum/Enum tags retain their roles.

## Current strategy and callable bindings

A returned strategy is a typed selector identity, not a Boolean, callable,
executable object or evidence of successful execution. No Operation or Calculation
source module is imported by the generated Policy.

The immutable descriptor binds the Policy source/contract, exact typed inputs and
case arguments, Rule plan and direct dependency closure/provider bytes, target
catalogue and its digest, field model, numeric profile and generated provider.
Catalogue entries bind each existing target's selector, kind, source-file hash
and decoded body hash. Changing a strategy's content under the same selector
changes the catalogue and descriptor, even though selection still returns an
identity. Transitive Rule changes also change the selected Rule-plan binding.

The selected W2 effect-free strategy profile requires input-sensitive behavior.
The compiler rejects obvious violations: no explicit inputs or fewer than two
distinct possible target identities. These are necessary structural checks,
**not** a universal proof of branch reachability or semantic input sensitivity.
Independent input/output witnesses establish those properties for the tested
fixtures; metadata and a passing compiler do not establish profile conformance
for every arbitrary authored Policy.

## Explicit legacy migration

`migrateTypedPolicyV1` takes a decoded-compatible typed Policy v1 and a
caller-supplied Rule selector and ontology name for every case. It returns a
v2 Policy, separate typed Rule v2 contracts and a source-bound extraction record.
It performs no graph registration or file writes. The caller must explicitly
add the named Rules and handle name collisions.

The adapter translates supported scalar comparisons and all/any/not into Rule
expressions while preserving first-match order and default identity. UInt64
literals become exact decimal literals. Different scalar operand types and
ordered Boolean comparisons reject: the former are ambiguous/coercive, and the
existing v1 renderer rejects the latter. Migration does not reinterpret those
programs as valid typed comparisons.

The accepted runtime perimeter is explicit typed scalar data. New validation
can reject malformed data that the old generic runtime happened to accept;
there is no claim of compatibility outside that stated perimeter. Static
untyped Policy decisions and typed v1 defaults remain on their existing paths.
They are not silently promoted or renamed into v2.

## Source selection

A new `configuration-policy-v2-sources.json` binds the exact Mapping-v2
selection as predecessor, validates the Rule-v2 ancestor back to the original
configuration, and identifies updated parser, Mapping decoder, shared value
checker and Policy decoder bytes. Earlier selection files remain immutable and
reject against current changed sources. Current Rule, Enum and factory
configuration integration tests select the explicit successor; negative
historical-drift tests remain.

The 13-type/39-cell catalogue, canonical relations, profile locations, original
configuration blockers and public defaults are unchanged. Unsupported default
generators reject typed Policy v2; only the explicit configured selection uses
the new compiler.

## Validation

Final focused suite: **10/10 PASS**, zero failures or skips, **30.21 seconds**.
Source typecheck and frozen catalog/relationship/integration-profile checks pass.
Final 26-suite shared regression: **313/313 PASS**, zero failures or skips,
**288.97 seconds**, with two test workers. This includes the unchanged legacy
static and thin-backend completion suites as well as the configured generators.

The fixture generates three Policies and three declared Rules. Native TypeScript
compilation emits JavaScript and declarations; fresh processes consume strategy
results. Tests exercise all three choose outcomes, duplicate-target occurrences,
scalar-only selection, exact UInt64, structured facts, changed referenced Rules,
current strategy catalogue content, source relocation and deterministic ordering.

Thirteen migrated predicate forms are compiled alongside existing v1 output
and compared over 24 valid inputs each: **312 native equivalence comparisons**.
Unsupported comparisons, unprovided Rule names and accessor-backed source inputs
reject. Migration does not silently mutate the graph.

The independent native AST observer checks Policy, Rule and binding modules,
exact imports, typed strategy/Boolean distinctions, ordered Rule argument
expressions, default targets, closed call/write forms, pinned common support,
current catalogue source/body identities and provider/descriptor hashes.
Nine compiling Policy provider mutations, three binding mutations and one
declared Rule mutation fail observation. Three independent native semantic
mutations change the required first-match result.

These are bounded inert-data/source/native witnesses, not OS-wide purity,
arbitrary Proxy isolation, modified-realm protection, universal input-sensitivity
proof or strategy execution evidence. Complete public CLI and native language
parity still require the remaining PCR work.

## Task-session record

Task-session and context-builder selected DSR-015, W2-POLICY-001 and the exact
Policy profile overlay; current Policy/static/typed contracts, Rule v8 compiler,
field/value models, canonical applies/enforces/calculates endpoints, source
selection chain, CLI ledger and native observer tests cover the obligations.
Local execution; no runtime handoff or subagents. No blocker-level choice or
additional owner decision was required. Experiment harness is not applicable.

ARE request 040 selected IMPLEMENT and direct context; its exact 22-file effect
assessment was admissible with no new owner gate. Existing user construction
authorization applies. The generic checker extraction and named compatibility
adapter preserve metatype boundaries and avoid duplicating Rule definitions.
Operational admission/publication/default cutover remain deferred, not implied.

Completion continuation selects configured Operation generation, with decision
`c58adb88a35de0682bea5628f01ee597172a91dfac666a3897bf1ee9bb4b8d60`.
The option is structurally admissible with no additional owner gate; its
repository-write consequence still requires an exact next-unit write envelope.
The existing user construction authorization continues to apply. This closes
only this Policy unit, not the active full-CLI objective.

Initial fixture and test issues were corrected: the Calculation relationship
endpoint, the copy created by object rest in a freeze assertion, the current
configuration CLI selection and unsupported legacy Boolean ordering. None
required changing canonical authority. Historical reports and unrelated dirty
work are preserved; current report and two ledgers own successor evidence.

The first expanded 26-suite regression completed 313 tests: 312 passed, one
failed, zero skipped (288.84 seconds). The older B15 corpus test could not launch
its hard-coded workspace-local TypeScript compiler because `impl/node_modules`
was absent. An initial link at the CLI-local location did not fix that path;
it was removed. A temporary workspace dependency link to the previously exported
locked mirror restored the expected compiler. The unchanged static backend suite
then passed **17/17**, zero failures/skips, in **7.76 seconds**. No compiler source
or test assertion was changed for this environment repair. The full rerun uses
that same mirror and disk-backed temporary directory, with two test workers.
The final rerun passed all 313 tests. The temporary workspace link was removed
after checking its exact target; the dependency mirror and pre-existing CLI
`tsx` link remain untouched. No dependency data was deleted.

Preservation checks confirm the three existing generator integration tests have
only the source-selection filename change; the old generator differs only by
three explicit Policy v2 rejection guards; the package adds only the Policy test
entry. All 19 recorded implementation/test/source hashes still match, and all
22 scoped files have no trailing whitespace.

## Exact source identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/typed-operation/value-bindings.ts` | `4050e387fb82025a6acbe78b4b125886e31c3a2bd2824bfa533eba07e73f4f85` |
| `impl/cli/src/typed-backend/mapping-inputs.ts` | `2f254026ee5a05ef31fbac7d5e1cb16ae7dd7f0aef692585887e9f0ee75173ff` |
| `impl/cli/src/typed-backend/policy-rules.ts` | `1d17adc365283a2c3e7dbd9026262532a64564543bdd37e577c548f8e68137a0` |
| `impl/cli/src/typed-backend/policy-compatibility.ts` | `9ce3dbe1a9d32e6a6eddf6ffd6e5c12d9b2de9803b081ba5ce0fe54a1a5be887` |
| `impl/cli/src/input/project-model.ts` | `d747e4763c8e173d4beadb8ed9a9faa3cd1954ae9f57960f9d8518d2d971fdb7` |
| `impl/cli/src/generation/generators.ts` | `1d6820aa299b74266420b490e63526926827b0e11672cfc9d9b5d986cdf8e2d0` |
| `impl/cli/src/generation/configured-policy-source.ts` | `e0cb76cd1c754db20d3a98402673ea978c242b3824caa221ed612b2aa07b8601` |
| `impl/cli/src/generation/configured-policies.ts` | `31c151140ce54c912b17b75ea567b2d662658e76263219bce6c5ad0933a471c5` |
| `impl/cli/test/generation/configured-policies.test.ts` | `fedd5961f50e83ae1bae31cddc39dbf49c1b914989f4ed9a46711f275f176110` |
| `impl/cli/tools/observe-configured-policies.mjs` | `33abbdd6cfa05dca19b9e96a52441a945484a9523b2dcc3cbd3b6fcb8f2a9362` |
| `impl/cli/package.json` | `464b70515bab60423660d626f83ef3bd2288d6ace607af256665bf12c828b648` |
| `development/reconciliation-v1/profile-compiler-reconciliation/policy-generation-contract.json` | `7fe86c60c892471a91bce1795c7f5a960616aa2b3ec57c4467c38055cf239b2d` |
| `development/reconciliation-v1/ontology/policy-generation-candidate.json` | `d5113be0ff2239736d777737277822e5a1276a42f022f974d5cbc50dbd18c44d` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs` | `1168d73ee66db352696797dfa2e44fde30ad3438a262080d9f4ce311f7204d72` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs` | `a03f671c5c861e965143ecc7c914d8356776fb3ce17f58f41cdaf7b996dc97f5` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration-policy-v2-sources.json` | `ba0ab10bbb1bf33f201e21fd131e342e79b3591063f93d905f79bd077c4a83b6` |
| `impl/cli/test/generation/configured-enums.test.ts` | `cdcfea31d694294399bac40da25562dd499909dc085c4b78f00c6ec52fcfbd57` |
| `impl/cli/test/generation/configured-rules.test.ts` | `09db71f7e7d0124ec5fe99537084cc73fdcdf7f262ad46b38c1a6671b2df252b` |
| `impl/cli/test/generation/configured-factories.test.ts` | `b00946ec35bd5b8cd968a53640ba8e630b10d86ab9f5f15b5a974bbf22c78b90` |

## Remaining construction

Finish the remaining Operation, Workflow, State Machine, Event and Interface
realizations, then shared public planning, reconciled Python/Rust compilation,
all-cell and compound-commerce tests, compatibility and clean installation.
This candidate does not finish the full PCR plan, source-wide DSR-015 migration,
or AlchLang authoring reconciliation.
