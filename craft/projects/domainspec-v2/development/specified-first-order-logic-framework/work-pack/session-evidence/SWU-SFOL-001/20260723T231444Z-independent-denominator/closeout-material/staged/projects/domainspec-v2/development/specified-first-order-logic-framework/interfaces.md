---
module: specified-first-order-logic-framework
version: 0.2.0
status: approved-for-design
updatedAt: 2026-07-23
docType: interfaces
---

# Interfaces

## Programmatic Interfaces

| Interface | Input | Output | Failure Boundary |
| --- | --- | --- | --- |
| `projectNodeLogic` | graph, source manifest, build receipt, profile | exact node logic envelopes or diagnostics | no Markdown/direct-node fallback or second graph |
| `compileLogicModule` | node logic envelopes, profile | normalized module or diagnostics | no partial accepted module |
| `buildClauseDenominator` | independent rule manifest, node/build handles | frozen exact denominator | cannot consume generator output |
| `typecheckLogicModule` | normalized module, type environment | typed module or diagnostics | unknown/ambiguous types fail |
| `evaluateTerm` | typed term, finite environment | value or indeterminate | no throw/guess |
| `evaluatePredicate` | typed predicate, finite environment | Boolean or indeterminate | no truth from implementation |
| `deriveLogicCases` | typed module, denominator, fixture universe | exact pre-run cases or residue | must exact-match denominator |
| `resolveLogicBindings` | cases, binding registry | exact role bindings | zero/multiple/stale bindings fail |
| `runPureCase` | case, pure binding | raw return observation | no correctness judgment |
| `runEffectCase` | case, harness binding | raw effect trace | no correctness judgment |
| `evaluateObservation` | clause, environment, raw observation | evaluation result | evaluator cannot import target |
| `replayLogicReceipt` | allowlisted artifacts | replay result | ignores authored pass summaries |

## Runner Interfaces

Pure bindings declare:

- module and symbol;
- argument projection;
- result projection;
- runtime/version digest.

Effect harness bindings declare:

- adapter ID/version;
- setup and teardown contract;
- pre/post-state projections;
- call/write/event/error capture;
- containment and resource limits.

Neither interface may declare an expected result.

## Planned CLI

```text
domainspec logic compile --proof-context <build-root> --profile <profile>
domainspec logic denominate --proof-context <build-root> --manifest <owner-manifest>
domainspec logic generate --proof-context <build-root> --bindings <registry>
domainspec logic verify <run-root>
```

The CLI delegates source resolution to the canonical minted-project process,
writes only to declared generated/run roots, and returns nonzero for
missing, extra, duplicate, stale, skipped, todo, unbound, unsupported without
admitted residue, indeterminate, or failed evaluation.
