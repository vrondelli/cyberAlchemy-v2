# N44 architecture bundle

## 1. Context view

An evaluator consumes one exact N43 envelope plus exact graph, manifest, registry, profile, and policy receipts, then emits one immutable N44 receipt.

## 2. Structure view

Identity, evaluator, inputs, predicate, evaluation summary, result, diagnostics, digests, currentness, claim ceiling, and authority are separate closed groups.

## 3. Integration and versioning view

Every consumed artifact is path/digest/size bound. Schema or evaluator drift requires a new receipt and never rewrites a historical one.

## 4. Persistence and concurrency view

Receipts are immutable snapshot results. Parallel receipts coexist; external currentness may point to one but cannot mutate another.

## 5. Authority and trust view

The evaluator owns its evidence, not canonical semantics, consumer completeness, packet acceptance, profile admission, or release.

## 6. Validation-contract view

Four positive fixtures cover `pass`, `invalid`, `not-evaluated-incomplete-closure`, and `error`; hostile probes test precedence, binding drift, unknown fields/results, claim inflation, and currentness inference.
