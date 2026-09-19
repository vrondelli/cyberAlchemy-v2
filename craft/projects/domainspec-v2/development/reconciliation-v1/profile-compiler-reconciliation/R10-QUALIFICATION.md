# R10 Python qualification

2026-09-15. Request235. Product construction; authority effect none.
R10 is qualified and complete. R11–R18 and the complete CLI goal remain required.

## Controlling scope

The [R10 exit](REMAINING-WORK-PLAN.md#l2-python-rust-and-the-complete-realization-matrix)
requires all13 native Python metatypes, independent observation, package imports,
and shared positive/hostile behavior. The [original verification contract](PLAN.md#7-verification-contract)
also retains non-collapse, orthogonality, provenance and composition obligations.
The current [Python selection](../../../impl/cli/src/generation/reconciled-python-selection.ts)
is opt-in; it does not replace legacy CLI behavior or select a TypeScript numeric
profile. This audit describes that selection, not every historical generator.

The [projection contract](python-verification-projection-contract.json) supersedes
the earlier staging inference about Python HTTP composition. The accepted
[support matrix](../contracts/support-matrix.json) explicitly has no Python target
for project-composition/v1. Domain relationships, multiple features, Workflow
composition and stronger public verification are still required. No new HTTP
target, bridge, source language, relationship or product decision is introduced.

## Supported-input accounting

The [whole-project planner](../../../impl/cli/src/generation/reconciled-python-project.ts)
dispatches every selected source node. Each Entity/Value Object, Operation and
Workflow requires its exact authored binding; a selected node is an import-closure
view of that same whole checked project. Unsupported versions, absent bindings,
unsafe names, conflicting files and graph/source mismatches reject, not fall back.

The following rows map accepted input families to actual native generation and
tests. They are not new contracts or waivers. The referenced decoders and existing
checked field/action/public-boundary contracts own the exact grammar and bounds.
All test paths below are relative to `impl/cli/test/`.

| Metatype | Accepted source family and native behavior | Qualification tests |
| --- | --- | --- |
| Entity | typed-record/v1 plus declared identity, factory validators and extensions. Factory-created frozen dataclass snapshots; equality/hash follow identity, not all fields. Nested owned values and explicit reference bindings retain separate meanings. | `generation/configured-python-factories.test.ts`, `configured-python-references.test.ts`; `verification/reconciled-python-factory-semantics.test.ts` |
| Value Object | typed-record/v1 plus factory bindings. Frozen snapshots with complete value equality/hash; creation and transitions validate declared Rules, including extension order and nested ownership. Not a database table. | Same factory/reference tests; `verification/reconciled-python-value-context.test.ts`, `reconciled-python-owned-observer.test.ts` |
| Enum | typed-sum/v1, both payload-free nominal Enum and payload-bearing sum. Inline/named sums, nested optional/list/set values and record dependencies; explicit wire identity, no payload erasure or structural clone admission. | `generation/configured-python-enums.test.ts`, `configured-python-algebraic-enums.test.ts`; `verification/reconciled-python-enum-semantics.test.ts`, `reconciled-python-sum-semantics.test.ts` |
| Rule | typed-rule/v1/v2 checked closures. Scalar/collection and structured facts; Boolean result, declared Rule references, identity versus complete-value equality, quantifiers and occurrence semantics. | `generation/configured-python-rules.test.ts`, `configured-python-structured-rules.test.ts`; `verification/reconciled-python-decision-semantics.test.ts` |
| Calculation | typed-calculation/v1/v2. Exact UInt64 input/output, full-width v2 authored decimal literals, checked arithmetic and declared division rounding. Bool and float are not integers at this boundary. | `generation/configured-python-calculations.test.ts`; `verification/reconciled-python-semantics.test.ts` |
| Query | typed-query/v1 over an actual Entity field model. Typed scalar/nested parameters, equality and scalar ordering, all/any/not predicates, projections, stable order, duplicate preservation and limits. Immutable detached read results; no factory construction or write. | `generation/configured-python-queries.test.ts`; `verification/reconciled-python-data-semantics.test.ts` |
| Mapping | Domain v1/v2 and public v3. Explicit supplied values, checked paths, list images and explicit to_set; total/partial/empty projections where permitted. Preserve v1 presence fallback versus v2/v3 null-only fallback. Public endpoints retain qualified Interface identity/imports. Projection never runs a Calculation or constructs its target Entity. | `generation/configured-python-mappings.test.ts`, `configured-python-public-mappings.test.ts`; `verification/reconciled-python-data-semantics.test.ts`, `reconciled-python-public-mapping-semantics.test.ts` |
| Policy | Rule-backed typed-policy/v2 with ordered declared cases and default target. Scalar or structured inputs, pure selection of target identity. Legacy inline-predicate v1 is explicitly rejected by this opt-in profile, not silently migrated. | `generation/configured-python-policies.test.ts`; `verification/reconciled-python-decision-semantics.test.ts` |
| Event | Existing checked Event generation/value contract. Exact declared scalar carriers, optional absence, reference identity and supplied/generated time. Frozen occurrence data; explicit clock ordering; no occurrence publication. | `generation/configured-python-events.test.ts`; `verification/reconciled-python-event-semantics.test.ts` |
| Operation | typed-operation/v1 with checked action bindings, existing factory dependencies, scalar/Enum/record results and explicit Event inputs. Awaited atomic read/write/outbox behavior, failure boundaries, cancellation and uncertain commit outcomes remain distinct. | `generation/configured-python-operations.test.ts`; `verification/reconciled-python-operation-semantics.test.ts` |
| State Machine | typed-state-machine/v1, authored states, initial state, transition/trigger matrix and optional declared guards. Nominal state/trigger Enums; pure transition or rejection with ordered unexecuted output intents. | `generation/configured-python-state-machines.test.ts`; `verification/reconciled-python-state-machine-semantics.test.ts` |
| Workflow | workflow-occurrences/v1 plus checked call/result/Event bindings and recovery selection. Distinct step occurrences, immutable argument capture, awaited Operations, ordered or unconstrained compensation dependency graphs over needed prefixes. Recovery is prepared, not automatically executed; no invented enclosing transaction. | `generation/python-workflow-materialization.test.ts`, `configured-python-workflows.test.ts`; `verification/reconciled-workflow-shared-cases.test.ts`, `reconciled-python-workflow-semantics.test.ts` |
| Interface | typed-interface/v1 with named public contracts, internal/external boundary, typed async members and exact/backward version policy. Protocol/structural types, immutable normalizers and qualified identity; normalization executes neither members, transport nor domain invariants. | `generation/configured-python-interfaces.test.ts`; `verification/reconciled-python-interface-semantics.test.ts` |

Shared field algebra is String/Bool/UInt64, named declared values, optional,
list, set and sum, with nesting and explicit field-reference bindings. Lists keep
occurrences/order; sets use declared canonical value semantics. A reference is
neither embedded target state nor a database/existence lookup. Individual Event
carriers and public structural inputs retain their own declared contracts; the
field algebra does not silently widen those boundaries.

Native observations include full-source AST checks, imports, immutable/detached
values, source-predicted outcomes, hostile inputs and compiling substitutions.
Python-specific error normalization remains explicit in the per-family semantic
contracts; shared source cases are not rewritten to hide native differences.
Those transports require the later cross-language join, not byte-equality claims.

## Verification limits, not source exclusions

The [semantic control builder](../../../impl/cli/src/verification/reconciled-python-semantic-controls.ts)
has bounded case/byte budgets. Missing satisfiable factory witnesses, excessive
extension/case enumeration and Policies without distinct-target witnesses can
remain wholly not_evaluable even when their source compiles. A subset of passing
cases is not a replacement for the missing row. Aggregate capacity rejection is
also not qualification. The suite includes these outcomes as deliberate controls.

The [native executor](../../../impl/cli/src/verification/reconciled-python-native.ts)
keeps native-only and semantic-only results not_evaluable while required execution
is incomplete. Its complete successor mode requires every projection check,
including exact output, shared-source outcome agreement and finite Lean execution,
to pass. Failed final source/toolchain/workspace/cleanup checks invalidate the
whole result. A generated receipt or one passing standard fixture still does not
prove the full supported source space.

## Fresh cumulative evidence

Ran the exact 37-file `test:python` list from
[package.json](../../../impl/cli/package.json), with Node26.8.1, Python3.14.4,
Lean4.33.1 and test concurrency1. Terminal session41394: **140/140 passed,
exit0**, no failures, cancellations, skips or todos; 272,500.341087ms (about
4m33s). This is one final fresh cumulative run, not a sum of historical slices.
The preceding [138-test TAP](evidence/r10-python-qualification.tap) remains
preserved as predecessor evidence rather than being relabeled as this run.

The standard integration case freshly reports21 executed nodes across13
metatypes, 3,035 cases, 2,509,629 control bytes and147,176 copied workspace bytes.
Additional fixtures cover nested values, multiple features, relocated packages,
both output layouts, actual CLI calls, independent mutants and explicit pending
cases. Expected rejection and deliberate unevaluable controls are test successes,
not claims that those domain inputs have passed full verification.

Strict source typecheck passed with pinned TypeScript7.0.2 and Node declarations.
All six materializer checks passed:39 catalogue rows,31 relationship signatures,
5 definitions/3 languages,116 bundled compiler sources,18 cross-generator sources
and14,408 native publication bytes. The source capsule is
`0d28cff4ce984e2a3a738a621cf2ba2401b724908a54aad6da036ac7d17ee8e6`;
excluding the new successor leaves the exact prior115-source capsule
`1ee4d9fb10771b5d81d71e9a75a3c1fd9f960d4ba695301a2eb87134d3a1fe44`.

Exact closure identities (SHA-256):

| Artifact | Digest |
| --- | --- |
| `evidence/r10-python-qualification.tap` | `c0c21d36b3065b1a70b41d1a1ffeb2812a6c8346cb22979fdf2d5865f1078bcc` |
| `impl/cli/package.json` | `577dc17dfac42dacd8add488ea408415ed734e91ebee0efc6fe3e7ed3f4faa85` |
| `src/generation/reconciled-python-project.ts` | `36e3107ee2a52088298cdb8a96cdbf9c47bcb7ad064ac4908a43e9a07960a99f` |
| `src/verification/reconciled-python-native.ts` | `2814a3bbfbf3462394c88b2d36c7e781dbe0ee0a910b045086a3561631554ce2` |
| `src/verification/reconciled-python-semantic-controls.ts` | `b518cf04bd22aec817e4e90208dd62124a78dfc1e0664541251fd3685be293a9` |
| `src/formalization/reconciled.ts` | `7cf336655351cf47ab13b86d3b6aeecf6014b9ac46141e3d900ecc3ee9d6f08c` |
| `python-complete-verification-contract.json` | `18bb7fc6d90db1bc4470fb4b46ee698d26210a0ea93198f7e33e61ba5dccd8d2` |

Source paths in the last three rows are relative to `impl/cli`. These are exact
closure pointers, not a claim of a complete transitive environment attestation.

## Complete verification and remaining product work

The public selected `verify-project` path now accepts Python's explicit
`--python-executable`, `--temporary-parent`, `--lean-executable` and existing
target/layout options. It executes all native and semantic controls, binds Python
outcomes to compiler-owned shared cases, verifies source and selection through
the shared formalization, runs the Lean kernel, rechecks tool/source/output/workspace
currentness and removes only its owned workspace. Plain output passes through the
direct API test; application layout passes through the actual CLI test. TypeScript
tool options and legacy entrypoints retain their behavior.

The complete receipt has its own schema and successor contract. The earlier
native and CLI contracts remain byte-identical. Its cross-generator check is
deliberately scoped to Python-versus-shared-source outcomes; R12 still owns the
three-language comparison. The accepted absence of a Python HTTP target remains
unchanged and does not waive Workflow/domain relationships or public verification.

One compatibility batch initially failed because the Elan shim tried to create
`/home/node/.elan` inside a read-only container. The unchanged test passed with
the direct pinned Lean binary (48,851.485095ms). One attempted cumulative command
failed all37 files before module loading because bare `tsx` was unavailable in
this dependency-less checkout; the exact registered list was rerun with the
pinned external loader. These failures are preserved as infrastructure evidence,
not included in the final140/140 result.

R10's exit is satisfied. R11 Rust adapters are next; R12–R18, installed
qualification and final product review remain open. All owned processes finished.
The final12MiB `/dev/shm/ds-r10-python-complete-YyJ0rg` cache was removed after
real-path, device65/inode130418 and exact-child checks, then verified absent. This
reclaimed tmpfs allocation, not physical Windows disk space. No unrelated
temporary repository was removed.

Task-session/context-builder: complete for R10; local execution, no delegation or
adapter. Context expanded from the R10/verification contracts to per-family
planner dispatch, shared type/rendering boundaries, public entrypoints and finite
formalization. Existing user authorization; no changed product choice. Runtime
handoff and experiment harness are not applicable. This record is test evidence,
not admission.
