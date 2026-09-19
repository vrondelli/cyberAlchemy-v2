---
module: backend-type-test-engine-completeness
version: 2026-07-23-l0a-repair-receipt-sync
status: validated-waiting-independent-validation-freeze
updatedAt: 2026-07-23
docType: work-pack
semanticAuthority: none
---

# Work Pack — Backend Graph Composability And Test Derivation

## Control Fields

| Field | Value | Meaning |
| --- | --- | --- |
| `workPackGateStatus` | `waiting-validation-owner-freeze` | Current L0A proof is green; L0B remains blocked on an independent matching red manifest/freeze. |
| `complexity` | `high` | Crosses versioned source contracts, compiler/graph, six catalogues, execution/replay, and two consumer lanes. |
| `outputMode` | `split` | Active task and wave files own unique dependencies and boundaries. |
| `activeLayerWindow` | `L0B-owner-freeze` | L0A implementation and repair receipts pass; no Task Session may start before the independent freeze exists. |
| `candidateSWU` | `none` | No dependency-ready execution candidate exists. |
| `selectedSWU` | `none` | Refresh cannot select execution work. |
| `distillValidationStatus` | `skipped-receipt-synchronization` | The receipt sync changes no architecture or SWU boundary. |
| `dispatchStatus` | `pass` after validator receipt | See `EXECUTION-DISPATCH.json` and current refresh validation. |
| `readinessProfile` | `l0a-green; validation-owner-gated; non-admitting` | Historical and repair evidence are preserved; no profile, catalogue, release, or production promotion. |

## Objective And Completion Boundary

Build a fail-closed graph-to-proof bridge for six exact backend structural
catalogues, then independently replay two downstream consumer proofs. BTE is
complete only when every required coverage key has exact TestCase,
ExecutionResult, primary MutationResult, ProofReceipt-scope, and ReplayResult-
scope evidence and both aggregate commands reject every absence or substitution.

Counts are diagnostic. Stable IDs, governing handles/digests, exact joins, raw
artifacts, and independent replay establish the bounded result.

## Active Delivery Board

| Layer | Task | Unique responsibility | Entry state | Status |
| --- | --- | --- | --- | --- |
| L0A/L0B | [TASK-BTE-L0-PROOF-PRIMITIVES](work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md) | preserve green L0A receipt parity, then independently freeze and execute semantic validation | L0A implementation and repair receipts pass; L0B requires owner freeze | L0A completed-green; L0B owner-gated |
| L1 | [TASK-BTE-L1-FORMATION-V2](work-pack/tasks/TASK-BTE-L1-FORMATION-V2.md) | YAML-owned formation-v2 plus exact current-v1 retirement/compatibility | L0B ValidationReceipt | planned |
| L2 | [TASK-BTE-L2-SUCCESSOR-SOURCES](work-pack/tasks/TASK-BTE-L2-SUCCESSOR-SOURCES.md) | versioned project/feature/node/edge/source-set resolver | L1 receipt | planned |
| L3 | [TASK-BTE-L3-COMPILER-GRAPH](work-pack/tasks/TASK-BTE-L3-COMPILER-GRAPH.md) | hard version route, graph/manifest/build and replay | L2 receipt | planned |
| L4 | [TASK-BTE-L4-CATALOGUES](work-pack/tasks/TASK-BTE-L4-CATALOGUES.md) | six freezes plus node/relationship selections and admissions | L3 exact handles | planned-owner-gated |
| L5 | [TASK-BTE-L5-PROOF-UNIT](work-pack/tasks/TASK-BTE-L5-PROOF-UNIT.md) | one complete obligation-to-replay proof unit | one stage-eligible L4 member | planned |
| L6 | [TASK-BTE-L6-CORE](work-pack/tasks/TASK-BTE-L6-CORE.md) | six-catalogue breadth and `verify:bte:core` | L5 mechanism plus all freezes/admissions | planned-owner-gated |
| L7A | [TASK-BTE-L7A-IOLM](work-pack/tasks/TASK-BTE-L7A-IOLM.md) | repaired IOLM schema, consumer run, BTE replay | exact green core | planned-consumer-owned |
| L7B | [TASK-BTE-L7B-BODY-WAR](work-pack/tasks/TASK-BTE-L7B-BODY-WAR.md) | Body War machine package, run, BTE replay | exact green core | planned-consumer-owned |
| L8 | [TASK-BTE-L8-AGGREGATES](work-pack/tasks/TASK-BTE-L8-AGGREGATES.md) | consumer and terminal exact aggregates | both fresh L7 replays | planned |

Task files define implementation detail. Later tasks intentionally contain no
SWU IDs yet; their smallest executable boundaries are instantiated only after
predecessor receipts make exact handles and write scopes knowable.

## Completed Repair And Current Selection State

| Field | `SWU-BTE-L0A-REPAIR-001` |
| --- | --- |
| Parent | `TASK-BTE-L0-PROOF-PRIMITIVES` |
| Primary behavior | Restore the current L0A published byte set to the immutable receipt handles and prove the existing verifier passes without replacing historical run evidence. |
| Consumes | immutable L0A Task Session receipt, continuation handoff, run publication receipt and write manifest; current nine schemas, `diagnostics.ts`, verifier source, and this applied contract |
| Emits | repaired exact bytes on nine mismatching surfaces plus one Task Session receipt; no new publication receipt |
| Allowed writes | exactly eight mismatching schemas and `impl/test-derivation-engine/src/bte/validation/diagnostics.ts`; one append-only repair Task Session evidence directory |
| Forbidden writes | the already-matching `contract-publication-receipt.v1.schema.json`; all historical receipts; `validation-inputs/`; semantic validators; later BTE layers; consumers; Craft; Inventory; UI; public Arcanum |
| Independent boundary | Repair restores byte identity only; it does not author expectations, execute red cases, emit a new publication receipt, or grant admission. |
| Done evidence | all nine repaired handles equal immutable receipt SHA-256 values; existing publication verifier, focused test, engine tests, typecheck, docs, JSON/link/write-scope, and diff checks pass; historical receipt/manifest bytes remain unchanged |
| Validation | `npm --prefix projects/domainspec-v2/impl run verify:bte:contract-publication`; `npx vitest run src/bte/contract-publication.test.ts`; `engine:test`; `typecheck`; `validate:docs`; exact digest/write-scope checks |
| Stop | any relation is not one additional LF; any undeclared path changes; any historical evidence would change; verifier still fails; formatter or commit strips restored bytes |
| State | `completed-pass-receipt-synchronized` |

No SWU is active, selected, or currently dependency-ready.
`SWU-BTE-L0A-001` is historical implementation evidence and
`SWU-BTE-L0A-REPAIR-001` is completed current-proof evidence.
`SWU-BTE-L0B-001` is a named successor, not a current candidate; current
publication verification passes, but the validation-owner freeze is absent.

## L0 Output Contract

The historical L0A Task Session materialized these exact contract files under
`impl/test-derivation-engine/src/bte/contracts/`:

- `artifact-handle.v1.schema.json`;
- `logical-identity.v1.schema.json`;
- `authority-class.v1.schema.json`;
- `diagnostic.v1.schema.json`;
- `exact-set.v1.schema.json`;
- `red-fixture-manifest.v1.schema.json`;
- `red-fixture-freeze-receipt.v1.schema.json`;
- `validation-receipt.v1.schema.json`;
- `contract-publication-receipt.v1.schema.json`.

It must materialize this closed registry under
`impl/test-derivation-engine/src/bte/validation/`:

- `diagnostics.ts` for one closed diagnostic-code registry.

L0B later materializes `validate-shape.ts` and `validate-semantics.ts` for IDs,
digests, authority classes, exact sets, containment, producer separation, and
manifest/result recomposition.

The validation-owned precondition paths are:

- `validation-inputs/l0/red-fixture-manifest.v1.json`;
- `validation-inputs/l0/red-fixture-freeze-receipt.json`.

Historical L0A writes only to `runs/<run-id>/l0a/` and include
`contract-publication-receipt.json` plus an output/write manifest. L0B writes
raw case results, an output/write manifest, and `validation-receipt.json` only
to `runs/<run-id>/l0b/`.

## Admission And Freeze Ledger

| Handle | Owner | Required at | State | Failure effect |
| --- | --- | --- | --- | --- |
| current L0A publication verification | BTE repair Task Session | before validation-owner routing or L0B | pass | immutable handles restored; repair receipt synchronized |
| L0 red-fixture freeze | validation owner | after L0A receipt and before L0B | open | no L0B selection or execution; L0A unaffected |
| formation-v2 admission | formation-contract owner | L1 activation/core formation catalogues | open | candidate/local formation evidence only |
| successor profile admission | profile owner | L3 build entering core | open | compile experiment remains non-admitting |
| node-pattern selection/admission | node-pattern owner | L4/L6 node causality | open | affected catalogue excluded from core |
| exact 16 relationship admission | relationship/profile owners | L4/L6 relationship and edge catalogues | open | affected catalogues excluded from core |
| six catalogue freezes | validation owner | before each L5 TestCase | open | no corresponding TestCase emission |
| IOLM contract/run | IOLM owner | L7A/L8 | schema repair and run open | consumer/terminal red; core unchanged |
| Body War contract/run | Body War owner | L7B/L8 | machine package and run open | consumer/terminal red; core unchanged |

These are target-lifecycle gates, not Refresh-authoring failures.

## SWU Instantiation Rules

After the two explicitly defined L0 SWUs, a new SWU may be added only when:

1. exactly one primary behavior and one parent task are named;
2. all consumed handles and predecessor receipts exist;
3. outputs, allowed writes, forbidden writes, fixtures, positives, reason-specific
   negatives, stop conditions, and verification commands are exact;
4. the unit is independently reviewable and cannot be split without hidden glue
   or loss of meaning;
5. recomposition into its layer exit and the next layer input is mechanical;
6. the user selects it after Plan/Refresh validation.

No predetermined SWU count exists. A task label is never execution authority.

## Validation Strategy

1. Contract shapes fail on every unsupported keyword rather than silently
   accepting a partial JSON-Schema dialect.
2. Semantic validators enforce canonical IDs, SHA-256 content digests, authority
   classes, exact sets, containment, producer independence, and code precedence.
3. Formation-v2 proves exact retirement bijection, migration, current-v1
   compatibility, and the Entity reason-specific false-green rejection.
4. Source/compiler proof rejects v1/v2 fallback, root/path/endpoint/order drift,
   and graph/manifest/source-bijection defects.
5. Every catalogue rejects empty, missing, extra, duplicate, stale, mismatched,
   overlapping, or incompatible members and scopes.
6. Test materialization rejects absent freeze, exact-set mismatch, unsupported
   scope, skip/todo/orphan/unrunnable residue, or an extra required projection.
7. Binding rejects zero, two, wildcard, first-match, stale, or incompatible
   records before execution.
8. Evaluator isolation is checked mechanically through imports/dependencies.
9. Mutation accepts only a fresh child lineage killed for its declared phase,
   code, or observable delta; base-receipt staleness and wrong-reason death fail.
10. Replay resolves raw allowlisted artifacts and recomputes everything without
    trusting producer counts/status.
11. Core requires exact recomposition of all six catalogue ReplayResult scopes.
12. Consumer and terminal gates reject missing/parity-drift/private-leak/
    schema-only/self-authored/stale consumer evidence.

## Command Status

| Command | Current status |
| --- | --- |
| `npm --prefix projects/domainspec-v2/impl run tools:test` | runnable regression |
| `npm --prefix projects/domainspec-v2/impl run engine:test` | runnable regression |
| `npm --prefix projects/domainspec-v2/impl run typecheck` | runnable regression |
| `npm --prefix projects/domainspec-v2/impl run validate:content` | runnable regression |
| `npm --prefix projects/domainspec-v2/impl run instances:validate` | runnable regression |
| `npm --prefix projects/domainspec-v2/impl run verify:bte:contract-publication` | runnable; current receipt-sync verification passes twice |
| `verify:bte:contracts` | planned L0B |
| `verify:bte:formation-v2` | planned L1 |
| `verify:bte:build` | planned L2–L3 |
| `verify:bte:catalogue <catalogue-id>` | planned L4–L6 |
| `verify:bte:core` | planned L6 |
| `verify:bte:consumers` | planned L8 |
| `verify:bte` | planned L8 |

## Preserved And Historical Evidence

- `SWU-BTE-001` and `SWU-BTE-003` remain completed with their exact receipt
  bytes and hashes. They are prerequisites/evidence, not active route nodes.
- `SWU-BTE-L0A-001` remains a selected historical pass receipt.
  `SWU-BTE-L0A-REPAIR-001` restored all nine recorded handles and current
  publication verification passes; neither historical receipt nor run manifest
  was rewritten.
- All earlier uncompleted task, SWU, and wave definitions are historical and
  non-executable. Their exact replacements are in
  [HISTORICAL-MAP.md](work-pack/HISTORICAL-MAP.md).
- Legacy test-engine IR/rules/binding/emitter remains compatibility-only until a
  mechanical isolation check proves it has no BTE proof-route imports.

## Blocker And Gap Summary

| Scope | Count | Items |
| --- | ---: | --- |
| Refresh authoring | 0 | atomic package is exact and validated |
| Apply authorization | 0 | explicit `--apply-approved` received |
| Target lifecycle | 8 | L0B freeze; formation, profile, node-pattern, relationship admissions; catalogue freezes; IOLM; Body War |
| Audit | 0 | repair receipt proves exact publication verification and unchanged immutable evidence |

The optional key-and-door Rule semantic fixture remains separately blocked by
`DEC-GCP-001`; it does not block this structural route.

## Current Continuation Result

```yaml
completed_swu: SWU-BTE-L0A-REPAIR-001
result: pass
selected_swu: none
candidate_swu: none
next_owner: independent BTE validation owner
required_owner_outputs:
  - validation-inputs/l0/red-fixture-manifest.v1.json
  - validation-inputs/l0/red-fixture-freeze-receipt.json
successor_swu: SWU-BTE-L0B-001
successor_selected: false
admission_granted: false
production_authorized: false
```

## Handoff Gate

No Task Session may start from the current state. The independent validation
owner must first return the package-local red manifest/freeze with governing
digests matching the current passing L0A publication proof. A later Invoke
Refresh must validate those inputs, expose at most `SWU-BTE-L0B-001`, and leave
it unselected until the approved selection policy admits it.
