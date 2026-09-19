# Versioned State Machine source and configured reducer

Date: 2026-09-09. PCR-06 / DSR-016 product construction. Authority effect: none.

## Product frontier

The user's explicit `yes` selected the corrected versioned source and explicit
legacy migration in [DEC-08](STATE-MACHINE-DECISION.md). The source contract is
`domainspec.typed-state-machine/v1`; the opt-in planner is
`planConfiguredStateMachines`. It emits native TypeScript reducers, not classes
or a runtime interpreter. Existing source files are not rewritten or silently
reinterpreted. Workflow's separate occurrence-schema decision remains pending.

The [definition](state-machine-contract.json) and
[candidate ontology](../ontology/state-machine-candidate.json) preceded code.
The definition SHA-256 is
`024cddb7ebf6c61e569053ef48a059b675fe89cbe484bebe93c40fd4b9ef63a8`.
Full CLI construction remains tracked by [CLI-COMPLETION.md](CLI-COMPLETION.md).

## Meaning and generated result

A versioned body contains exactly `description` and `typed_contract`. The
contract declares explicit typed inputs, states, initial state and transitions.
Each transition has an identity, source state, target state, trigger Event,
optional declared Rule with typed argument bindings, and ordered output slots.

| Part | Meaning |
| --- | --- |
| `trigger_event_ref` | Qualified Event identity used as an input symbol. It is not an Event occurrence or proof of delivery. |
| `guard` | A declared typed Rule and exact argument bindings from explicit facts; never an inline predicate or caller-supplied Boolean verdict. |
| `output_intents` | Ordered named slots referencing Events. Two slots referencing the same Event remain distinct intents. |
| Result | Immutable transitioned state and intents, or rejected source state with no intents. |

Canonical `Event -> State Machine` relationships match the complete trigger
set, not the output set. The canonical relationship authority is unchanged.
Output references are composition bindings; no new domain edge is invented.
Transition IDs and source-state/trigger pairs must be unique. There is no hidden
priority between competing guards. Self-loops and guardless transitions are
valid; a guardless machine does not need a fabricated Rule.

Generated files live under `features/<feature>/src/domain/state-machines`:

- `<machine>.provider.ts`: closed `State`/`Trigger` unions, typed immutable facts,
  transition-specific outcome unions, `initialState` and a synchronous `reduce`.
- `<machine>.ts`: frozen descriptor-bound `transition<Name>` callable and public
  types. The descriptor binds source, contract, Events, Rule dependencies, field
  model and generated provider identities.

The immutable plan includes required Rule v8 artifacts and writes no files.
At runtime the reducer validates state/trigger symbols and all input facts,
selects the state/trigger pair, and evaluates only that transition's Rule.
Unknown symbols or malformed facts throw; a known but unavailable pair returns
`no-transition`; a false Rule returns `guard`. Rejections preserve the input
state and have an empty intent tuple. Successful results retain the exact
transition, target state and ordered output slots.

The checked scalar/named/optional/list/set/sum algebra is reused, including
full-width UInt64 values and Entity/Value Object distinctions. Facts are
normalized without mutating their caller. Bounded inert-data checks reject
ordinary getters, coercion hooks, hidden/symbol fields, cycles, sparse arrays
and oversized trees. This is not an arbitrary Proxy or cross-realm sandbox.
No Event payload, occurrence ID, clock, persistence, publication or retry is
invented. Inputs are explicit facts, not inferred trigger payload fields.

## Explicit compatibility and migration

`migrateLegacyStateMachine` is a non-writing helper. It requires authored
trigger and guard-argument bindings for every old transition, plus a named
output slot when an old output Event exists. It preserves legacy states,
transition IDs, targets, guard references and output Event identities. Missing
trigger information fails; the old output is never guessed to be the trigger.
The returned relationship review separates old output identities from required
trigger identities. Registering the new body still requires graph/type checks
and deliberate reconciliation of incoming `transitions` edges.

Legacy source decoding and rendering remain separate. Legacy TypeScript,
Python and Rust generators reject the new body with
`MTCLI_STATE_MACHINE_PROFILE_REQUIRED`. The legacy in-memory runtime preflights
selected steps and rejects a new State Machine before executing any step.
Legacy formalization and checked-interchange projection reject graphs containing
the new version with `MTCLI_STATE_MACHINE_FORMALIZATION_UNSUPPORTED`; they do
not erase the trigger/output distinction or crash on missing legacy fields.
Consequently a mixed graph containing this version is not supported by that
legacy proof/runtime pipeline, even when another node is the selected entry.

The parser-source selection advances explicitly through
[configuration-state-machine-v1-sources.json](configuration-state-machine-v1-sources.json).
Its predecessor is the unchanged Policy v2 selection. Earlier selection records
remain immutable and correctly reject the current parser. Enum, Rule and
factory configuration tests now explicitly select the successor, not refreshed
historical hashes. No public default or installed package is changed.

## Verification

Focused State Machine/configuration run: **23/23 PASS**, zero failures/skips,
**72.79 seconds**. Final 31-file shared regression: **364/364 PASS**, zero
failures/skips, **379.93 seconds**, with two test workers. It includes the final
mixed-graph legacy diagnostic assertion. Source typecheck passes after cleanup,
along with frozen catalog (39 cells), relationship authority (31 signatures)
and integration-profile (five definitions, three languages) checks.

The native compiler is the pinned TypeScript 7.0.2 provider, with generated
JavaScript and declarations both checked. An earlier shared run reported two
stale predecessor selections in Enum/factory tests; those consumers were fixed
explicitly, then the entire shared run was repeated against unchanged final
implementation bytes. That earlier run is not counted as final evidence.

All 24 scoped files pass the trailing-whitespace check. The canonical
relationship source and 28 tracked prior implementation/contract artifacts
retain their recorded hashes. The package edit only registers the new test.
The exact temporary `impl/node_modules` test link was removed after all test
processes terminated; the retained dependency mirror and pre-existing CLI
dependencies were left untouched. No commit, publication or default change
was made.

The focused suite covers native transitions and declarations, deterministic
replay across 30 state/trigger/value combinations, trigger/output non-collapse,
guard rejection, exact output multiplicity, immutable results, malformed source,
exact graph/Rule closure, explicit migration, stale/forged planner inputs,
guardless machines, structured values and legacy-path diagnostics.

An independent native AST observer reads the authored fixture and source nodes,
not the generator's claimed semantics. It checks trigger/state branches, Rule
arguments, validation order, outcome types, ordered intents, effect absence and
descriptor/source bindings. Nine native-compiling mutations are rejected even
after provider/descriptor hashes are refreshed. Three separately executed
mutants demonstrate changed behavior for removed guards, changed triggers and
changed output Events. The observer reconstructs scalar inputs and direct-root
path/literal guard bindings; unsupported fixture expressions fail closed.
Structured values have separate native behavior/type tests, not a claim of
universal independent observation over the entire expression language.

Legacy runtime/formalization compatibility: **22 passed, zero failed, one
skipped**, **4.83 seconds** on final source bytes. The skipped native Lean compilation requires a
Lean provider unavailable in this Node package environment. Legacy projection
and runtime behavior passed; native Lean proof compilation is not claimed.

## Remaining construction

This completes neither PCR-06 nor the working-CLI goal. Interface and Workflow
generation, shared public entry-point planning, Python/Rust parity, all 39 native
cells, the compound model, broader conformance, migration UX and clean package
installation remain. A successor formalization/checked-interchange path must
support the new contract before those entry points can promise it. There is no
reachability/liveness proof, durable workflow engine or Event delivery claim.
Interface source reconciliation is independent ready work; Workflow must honor
the still-pending portion of DEC-08 rather than reuse Operation identity as an
occurrence. No AlchLang authoring, admission, publication or default cutover is
included.

## Task-session evidence

Request `ds-cli-continuation-20260909-047`, direct `CA2-ROUTE-IMPLEMENT`.
Route receipt:
`79faff4171ee26f0303539c19b1da5989a7813e687fad4419ad82fc0b2029515`.
Context result:
`8c68fd3f07f7d65baaa9d8f8793e917f5988d08612d78d73e7aeea86f42df918`.
Initial effect assessment:
`e4687a2b99ebd5b00bbf8042ee5111fc9e8a3b6af1cf2e6b76e71d7d275274fa`.
Parent decision synchronization assessment:
`e214b58cc4e43fa710b2c1c7f676c16a99d2536ef0357a8fddf23011030550ef`.
Five-file legacy/configuration compatibility expansion assessment:
`19aab7469133f74a3440db8bce16f818d03d62c292563a187a051c1ae838823c`.
Each reported structural admissibility, not approval or product authority.
No subagent, runtime handoff, commit or publication was used.

Context-builder/task-session mode: standard, controlled by the completion ledger,
DSR-016/DEC-08/V24, the canonical transition signature, checked source decoders,
typed value/Rule contracts and configured generation profiles. The 24-file
write envelope includes the exact five-file legacy/configuration expansion.
Fallback exploration was limited to downstream consumers of the changed source
contract. Execution was local; runtime adapter and handoff pack: none; strict
handoff coverage: not applicable. Independent AST/native observation is recorded
above; a reusable-sigil experiment harness is not applicable to this compiler
unit. The decision, status and completion ledger are synchronized.

ARE continuation decision
`f5bf70dddc2a50091975c0ac9509a42d090263445c06730d6248d688f1ede2b2`
selects `configured-interface-source-reconciliation-and-generation`. It labels
the repository-write option consequential (`gate`) and structurally admissible,
with no additional owner-gate references. This is not execution authorization
from the router: the standing user construction instruction applies, and the
next exact context/write envelope must still be established before mutation.
The State Machine unit is complete; the full CLI goal remains active.

## Exact implementation identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/typed-backend/state-machine.ts` | `c4a4386b974a95b3407b173556cbcfb7bca3bc5e8838b4ebf791e58df06b47ba` |
| `impl/cli/src/typed-backend/state-machine-compatibility.ts` | `676ea9a0a617dd6dfe5adb89693e7fe0f696650866aaf06638d0eba31120f25b` |
| `impl/cli/src/input/project-model.ts` | `bd5a36dd1cb54a3a75441a2bdb2cf00283c6cc741330b3808189b76a72749057` |
| `impl/cli/src/generation/configured-state-machines.ts` | `eb6fc853e29f9fe310fb7d9f5995973ef962a7e6c40274030bf425ac04e6e781` |
| `impl/cli/src/generation/configured-state-machine-source.ts` | `d430b08ca60974a6548823cf315ad8c3d3929b46db69d538cf12ffcc6bee0758` |
| `impl/cli/test/generation/configured-state-machines.test.ts` | `cac216d81415dcbd5288488b8fdf6c8b1e34ccb5def112942153660316d99020` |
| `impl/cli/tools/observe-configured-state-machines.mjs` | `26cac895498765ec3c447548d8d59c7066e4b6b1828f6273269eb20243e9ebcb` |
| `impl/cli/src/runtime/in-memory.ts` | `1841e6bdcd1c59d76e9114cf2986b34fe085f42655e978963fa5c29cc22c61ae` |
| `impl/cli/src/formalization/projection.ts` | `eef2fe689b2b41d40b1ffb370b77aa4cee9e42cea95ccfe6d46b8dd45f81472a` |
