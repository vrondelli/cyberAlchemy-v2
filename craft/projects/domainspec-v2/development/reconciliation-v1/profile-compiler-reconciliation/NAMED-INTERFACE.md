# Named Interface-owned public contracts

Date: 2026-09-09. PCR-06 construction candidate. Authority effect: none.
The user selected option B in [the source decision](INTERFACE-MAPPING-SCOPES.md).
This report records implementation evidence, not release documentation or admission.

## Implemented boundary

The [definition](named-interface-contract.json) precedes implementation and is
bound by SHA-256 `cfaaff5a40d3c84b128ffc572fa74652863241a8513bac8b63342fc1148fb4b5`.
The [ontology](../ontology/named-interface-candidate.json) distinguishes public
contract identity from domain Entity identity, Value Object invariants, member
request/result positions and runtime execution.

`domainspec.typed-interface/v1` owns reusable named contracts and explicitly
typed member requests/results. Members retain their exact canonical `exposes`
edges to Operations or Queries. Public contracts may contain scalars, shared
domain Value Objects/Enums, other local public contracts, optional/list/set/sum
values and explicitly named empty data. Direct or transitive Entity embedding,
unknown references and recursive embedding fail closed.

`renderNamedInterfaceSource` consumes a registered unchanged graph and, when
domain values are referenced, the same graph's registered exact field model.
It emits native TypeScript readonly structural contract types and arrow-valued
async member signatures, source-bound descriptors, version eligibility and pure
shape-normalization functions. No class, member body, transport or invariant
execution is generated. Native types are structural, not nominal: equal shapes
may be assignable while public source identities and value keys remain distinct.

Normalization preserves exact UInt64 as `bigint`, immutable owned nested data,
list occurrences, canonical unique sets and tagged sum payloads. Missing optional
fields become null; missing required fields, coercion, getters, hidden/unknown
fields, sparse arrays and duplicate set values reject. Authored descriptor text
is preserved even when it contains internal diagnostic names.

The legacy generator, in-memory runtime and formalization reject this source
version explicitly. Legacy unqualified Mappings cannot flatten a new Interface's
public contracts. Historical source formats and configuration selections are not
rewritten. The explicit [v5 source selection](configuration-interface-v1-sources.json)
binds the changed parser and new dependencies through the exact v4 predecessor.
Live configuration-preview fixtures select v5; negative historical-drift tests remain.

## Verification

Nine focused tests cover closed/owned decoding, actual graph exposure closure,
legacy rejection, shared response identity, exact native behavior, hostile input,
strict native TypeScript consumers, three compiling semantic mutants, shared
Value Object/Enum closure, forged/cross-graph snapshots and legacy Mapping failure.
Source typecheck and frozen checks pass (39 catalog cells, 31 relationship
signatures, five integration-profile definitions across three languages).

The first 34-test focused combination passed 33 and failed one positive CLI
fixture still selecting v4. It was corrected to v5 without weakening drift checks.
The broader run found the same stale positive selection in Enum/factory/Rule
preview tests; those three selections were corrected. The first 34-file full run
passed 383 and failed these three stale preview fixtures. The final rerun passes
**386/386**, zero failures/skips, in **271.75 seconds**, including the authored
descriptor-text preservation case. The package change is exactly one added test
file; nine untouched State Machine source/test/definition artifacts retain their
recorded hashes. JSON and whitespace checks pass for the 20-file bounded surface.

Separate legacy runtime/formalization compatibility passes **22 tests**, zero
failures, with **one unavailable Lean-provider skip**, in **10.13 seconds**.
The first compatibility invocation used the project root rather than the CLI
package working directory and failed three fixture/module-resolution checks;
rerunning from the package directory resolved them without changing source.
The temporary `impl/node_modules` test symlink was removed after all test jobs;
its locked dependency target and the user's CLI dependencies were preserved.

Native tests use the repository-pinned offline TypeScript container and execute
generated JavaScript. They do not substitute shape validation for domain Rule
execution or claim transport, deployment, security isolation or proof support.

## Scope and routing evidence

ARE request `ds-cli-continuation-20260909-055`, raw user text `yes`.
Route `CA2-ROUTE-IMPLEMENT`; receipt
`793e2162d0d3133feb576254684b12ea6fe46fcbd6512e5c8f70e79844cb99f2`.
Context result `1b610092634434eb3943100bf1b933c258c9891d3571529a4685d62d89dd7560`.
Initial effect result `4d1a5a31c8a09a1ab5c381a00dda2d3e514fa8d8ac4cae2df37ee36dc48f9467`;
configuration successor `4979928efd6d133ebd6eb48da04892a914005fb83b0d706a94e2acdadfe6ae3e`;
three preview-fixture updates `906860b403cc31fe31ff1d5610ff2371e30cf72f71bab368d496fec7cd182ab4`.
These non-executing receipts grant no authority. User-authorized construction
preserves unrelated dirty files; no commit, publication or default cutover occurs.

The bounded surface is the new Interface decoder, standalone renderer, test,
definition, ontology and report; the project decoder and explicit legacy
generator/runtime/formalization rejection branches; the package test list;
source-selection successor, loader and tests; three live preview selections;
and the decision/status/completion ledgers.

## Remaining work

The source-format decision is resolved. Exact named-contract Mapping source
bindings and native generation remain next. A configured Interface artifact
planner, public CLI selection and migration diagnostics are not implemented by
this standalone renderer. Workflow's separate occurrence-source decision and
PCR-07..14 remain open in [the full CLI ledger](CLI-COMPLETION.md).
Do not mark the full goal complete from these Interface prerequisite tests.

Task Session: standard bounded context, local native execution, no handoff or
subagent, no alternate router. Context covered the selected source decision,
definition, ontology, checked project/field models, shared value emitter,
configuration predecessor chain and compatibility surfaces. The named-contract
choice is resolved; no new Interface owner choice was inferred. Dedicated sigil
experiment telemetry is not applicable to this product compiler unit.
