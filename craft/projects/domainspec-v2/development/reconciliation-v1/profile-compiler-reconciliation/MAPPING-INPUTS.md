# Explicit Mapping inputs

Date: 2026-09-09. PCR-06 / DSR-014 prerequisite. Product-construction candidate.
Authority effect: none. The full working-CLI objective remains active.

## Implemented contract

`domainspec.declarative-function/v2` adds multiple explicitly declared Mapping
arguments to the existing declarative composition compiler. It does not change
`domainspec.typed-mapping/v1`, the canonical relationship registry, or AlchLang
authoring. This closes the single-argument source limitation that otherwise
prevents passing an already-computed amount into a Mapping.

For example, these are the Mapping signature and call expression inside a
complete v2 contract:

```json
{
  "id": "OrderToSummary",
  "kind": "Mapping",
  "ontology": "COMMERCE-ORDER-SUMMARY",
  "meaning": "Project order identity and the supplied total.",
  "inputs": [
    {"name": "order", "type": "Order"},
    {"name": "orderTotal", "type": "UInt64"}
  ],
  "target": "Summary",
  "fields": {
    "id": {"op": "path", "path": ["order", "id"]},
    "total": {"op": "path", "path": ["orderTotal"]}
  }
}
```

```json
{
  "op": "call",
  "name": "OrderToSummary",
  "args": [
    {"op": "path", "path": ["input", "order"]},
    {"op": "path", "path": ["input", "orderTotal"]}
  ]
}
```

These excerpts assume the named shapes and root fields are declared; they are
not standalone source files. The executable complete fixture is
`impl/cli/test/generation/mapping-inputs.test.ts#fixture`.

Every v2 Mapping requires an ordered, dense `inputs` array (at most 128 entries);
zero-argument Mapping uses `[]`. Each formal has exactly `name` and `type`.
Duplicate, unsafe, unresolved or shadowed names/types reject. v2 rejects the
legacy `input` member, and v1 rejects `inputs`. The original v1 constant
remains unchanged; the public module additionally exports
`DECLARATIVE_FUNCTION_INPUTS_PROFILE` and `MappingInput`.

Calls supply exactly the declared number of compatible arguments. Nullable
formals still require an argument. Missing and null are not implicit defaults:
existing explicit `coalesce` expressions define fallback behavior. Existing
target-field type and required-field coverage checks remain in force.

## Evaluation and graph meaning

Arguments evaluate left to right, once per argument occurrence, before the
Mapping body. Using a bound amount twice does not repeat its Calculation.
Writing a Calculation call twice does evaluate it twice. Argument failure stops
later arguments and prevents the Mapping from starting. Parameterized calls
are not memoized; zero-argument declarations retain invocation-local memoization.

An existing, explicitly authored Calculation call remains legal under the
existing contract and core-binding requirements. v2 records its dependency in
the local behavior trace. No Calculation is inserted by the compiler.

The v2 trace carries the Mapping's ordered signature and evaluation policy.
The project checker includes all record input types in the existing
composition-local `maps-from` roles and retains `maps-to` for the result.
Wrapped record types are unwrapped for the role; scalar inputs do not become
ontology nodes. Two formal slots may share one input type/graph role without
collapsing their positions or names. The checked composition boundary preserves
these references separately from canonical domain relationships and explicit
core bridges.

The Node backend emits direct argument-taking arrows; Rust emits the same
ordered parameters with left-to-right argument temporaries. Guard analysis
checks actual argument expressions and recognizes formals as local bindings.
Direct DomainSpec JSON composition, source-project planning and checked-snapshot
planning accept the explicit successor. Existing AlchLang output remains v1.

## Verification

- Final source typecheck: PASS, including the frozen 39-row catalog, 31 canonical
  relationship signatures and integration-profile materialization checks.
- Initial seven-suite regression: 43/43 PASS, no failures/skips, 60.40 seconds.
  This preceded the final compiling-mutation and repeated-type fixtures.
- Final focused suite: 8/8 PASS, no failures/skips, 35.62 seconds.
- Final 22-suite shared regression: 273/273 PASS, no failures/skips,
  462.16 seconds. This includes the preceding 237-test matrix plus declarative,
  guard, portability, project/outbound composition and the new Mapping suite.
- The normal package `test:parallel` command includes the new test file.

Behavioral controls cover exact maximum UInt64 and values above the JavaScript
safe-integer range, multiple input kinds, explicit nullable fallback, static
arity/type/target rejection, guard availability, Calculation evaluation order
and reuse, deterministic trace, source relocation, and canonical/composition
graph separation. Native Rust output is compared against the same fixed expected
result as Node. Three Node mutations change argument order, repeated-value use
or defaults. A Rust mutation substitutes the wrong argument and must compile
but fail the native result assertion.

The original one-argument v1 fixture retains these exact hashes:

| Artifact | SHA-256 |
| --- | --- |
| Node source | `d4eda3ea09d0c026927b16fa6b31b446b31db9586fe93e1a0ee9fde8e87ff405` |
| Canonical trace | `b1b6719041ccaf8bceb00fe29df42c6e3cb1e40a48933ea230812f5e84c14051` |
| Canonical Rust artifact set | `37ba83ce4a4d6106214ff4dd6e1e80c006ca9669ca1cdba9f7d2bbf66fa3b171` |

## Current source identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/typed-backend/declarative-function.ts` | `67c35e7ec05a681f514d7f1dba633f5653e7ab5a428e195f9f806e8d72fafea0` |
| `impl/cli/src/typed-backend/guarded-bindings.ts` | `318c2772ab6ccae388dd5d954649ceea51d838a2136ca1fa4ce3641794a94321` |
| `impl/cli/src/input/project-composition.ts` | `ffeba81ac5c6a0563e95e7db04c901275e41d199d3bcb33cf28ea75aeef0bf91` |
| `impl/cli/src/generation/rust-composition.ts` | `39530cca39b84c489baa7b0848c520ed45fc5cc2b53c435fc98c9c007b856252` |
| `impl/cli/src/index.ts` | `e1f3fec7c9c7735394776b14334fd2df46657d0aecc68de90c8367dbb328160e` |
| `impl/cli/test/generation/mapping-inputs.test.ts` | `9f82c98889754c8178f72ac304c9d307906caa89883143cef2ebcca6d07255d4` |
| `impl/cli/package.json` | `1e822ec698335005c50feacfb66d353e9b72e610454e13db54c1c99f4b5b8897` |
| `mapping-input-contract.json` | `f26cee71ffc9904279a68651c50c2ffe71f01a119a48fddb9ec7f3be48c10f63` |
| `../ontology/mapping-input-candidate.json` | `b87e61459f1cb5e95b60f9def9d73c1d53106725c49ad851b7f10edc36473f3c` |

## Task-session and context record

Selected scope: one DSR-014 source-input prerequisite for the remaining PCR-06
Mapping generator. Context-builder used the CLI completion ledger; DSR-014
action/acceptance and dependency rows in WORK-ITEMS; Mapping profile selector;
the v1 typed/declarative Mapping contracts; project composition closure and
guard checker; Node/Rust renderers; and existing composition/native tests.
Each source controlled either compatibility, input meaning, dependency closure,
native lowering or verification. The lean budget expanded only to cover these
cross-backend dependencies; no broad repository discovery or runtime delegation.

Decisions: use an explicit successor, require all actual arguments, preserve
explicit fallback expressions and lawful Calculation calls, preserve v1 bytes.
These are local additive implementation choices within existing authorization,
not owner decisions or profile admission. No blocker-level user choice was
needed. The initial 11-file write envelope was extended only to add the new
test to `impl/cli/package.json`; all 12 files preserve existing dirty edits.

Runtime: native local task-session; adapter/handoff: none; strict runtime handoff:
not applicable. ARE route/context succeeded; effect assessment was admissible
with no missing owner gate. Experiment harness: not applicable to this bounded
compiler change. Technical evidence does not prove product approval or release.

Result: PASS for this prerequisite. All nine source hashes in this report and
the normal test-discovery entry were checked against the final files. Final
typecheck was repeated after adding that entry. CLI-COMPLETION and STATUS are
synchronized; historical parent work-item/admission records are unchanged.

## Remaining construction and operational boundary

Next: standalone descriptor-bound Mapping generation over checked field/value
models, followed by remaining pure-function/orchestration generators and the
full PCR-07..14 integration/parity/composition/compatibility/installed-package
matrix. DSR-014 as a whole is not marked complete by this input prerequisite.

The existing declarative type grammar and runtime perimeter remain unchanged.
This is not new runtime input normalization, deep immutable output ownership,
Entity factory construction, invariant execution, or support for the full
checked named/optional/list/set/sum algebra in declarative composition.
Node and Rust native evidence here covers this argument extension, not the
full reconciled 39-cell profile matrix or Python.

Operational support is limited to local test execution and this evidence update.
The product owner retains profile admission, default cutover, release and
publication decisions. No such effect is needed to continue the next candidate.
