# DSR-007 — DomainSpec path proved; Alch deferred

Status: DomainSpec-only pass; original task partially complete. Authority effect: none.

The user requested DomainSpec focus and Alch reconciliation later. This run therefore proves only direct
DomainSpec JSON -> typed graph -> generated TypeScript -> compiled JavaScript -> observed behavior.
It does not relabel deferred Alch comparison or frontend-negative cases as passed.

## Result

Eighteen checks pass in [domain-vertical.json](domain-vertical.json):

- Exact Entity/Query kinds and `order_id` identity survive the normalized graph.
- CLI compile certificate contains two nodes, one reads edge, DS-D1.1 and DS-D1.5.
- CLI build and independent verify agree; two builds are byte-identical.
- Generated TypeScript compiles with the pinned TypeScript 7.0.2 toolchain; emitted JavaScript executes.
- FindOrder returns exactly the declared projection, empty for no match, with frozen input snapshots unchanged.
- Different values with the same identity compare as the same Entity; different IDs do not.
- Wrong endpoint, absent projected field, absent field type, undeclared Query write, missing parameter,
  unsupported type constructor, missing reads edge and malformed JSON fail before target creation.
- Changing a declared projection changes graph and generated Query identities without changing semantic kinds.
- The source remains byte-identical after all tests.

The [runnable example](../../verticals/entity-query/README.md), [compiled graph](compiled-graph.json),
[compile certificate](compile-certificate.json), generated files and original build receipt are retained.
The saved generated directory was separately reverified with the CLI after materialization.

## Toolchain and observed repairs

The host has no local TypeScript installation at the legacy package path or on PATH. The current parent
toolchain keeps dependencies in Docker. This run uses the already-present image selected by
`toolchains/node-typescript/toolchain.json`; its exact image ID and compiler version are in the report.
The container has no network, no added capabilities, and only the fresh temporary build directory mounted.
No compiler, dependency lock, toolchain installation, application code or Alch file was changed.

Initial harness attempts exposed an incorrect fixture edge envelope, legacy compiler-path assumptions and
a too-broad text check matching the word `requires`. Those were corrected in the new fixture/runner only.
The existing transitional tsx loader emits Node's DEP0205 deprecation warning; it is not a product test failure.
These repairs do not claim to have fixed a DomainSpec compiler bug.

## Scope and preservation

Task Session / Context Builder selected one bounded work item, eight sources and five covered obligations.
The DSR-006 owned meanings are inputs; its unresolved proposed language and formalization choices are not
compiled or implicitly approved. The preceding Workflow explanation remains a semantic distinction, not
authorization to implement all Workflow runtime concerns in this slice.

Only new `verticals/entity-query/`, `evidence/l0/`, and exact PLAN/DSR-007/V08/V09/current-frontier bookkeeping
are written. [Preservation evidence](preservation-verification.json) checks 1,298 prior selected paths,
45 prior reconciliation files, 73 compiler source files, 48 matrix bindings and 26 HEAD/index preimages.
Prior epoch receipts and checkers remain unchanged; their old frontier checks remain historical.

V08/V09 are recorded as partial-pass-alch-deferred. Three work items are complete, DSR-007 is partial,
and 39 work items remain unexecuted. Recommended next DomainSpec-only work: DSR-009, field types,
identity and references. DSR-008 still depends on missing-receipt reconciliation in DSR-004.

## Recheck

```sh
# From the DomainSpec root:
node development/reconciliation-v1/evidence/l0/preservation.mjs
# From impl/cli:
node --import tsx ../../development/reconciliation-v1/verticals/entity-query/run.ts
```

The runner prints candidate evidence and leaves the stored fixture/generated files unchanged. These checks
do not certify the complete product, all supported languages, general runtime input-type validation,
database IO, concurrency, Workflow execution, provider durability, packaging, admission or publication.
Experiment harness: not applicable. No runtime delegation or legacy lifecycle adapter was used.

## Open Questions

Alch equivalence and unsupported frontend constructs are explicitly deferred by the user. DomainSpec-only
work can proceed using owned contracts. Proposed field/reference semantics remain DSR-009; Workflow
occurrence and execution work remains DSR-017/024. No new owner decision or canonical promotion is inferred.
