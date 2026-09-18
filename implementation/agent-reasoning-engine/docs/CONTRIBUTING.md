# Contributing

## Before changing ARE

1. Identify the exact product, research, authority, or integration boundary.
2. Route the objective according to the repository router.
3. Read the package tests and source contract that own the behavior.
4. State the claim the change should establish and the evidence that can
   falsify it.
5. Keep unrelated dirty work outside the change set.

## Product changes

Add or change behavior in the smallest owning package. Update directly owned
tests when the contract changes. If a new component or integration becomes
required, add it to `product.json` and ensure the generated test plan assigns it
a suite. Run focused tests first, then the complete product suite once.

A changed product closure requires a successor candidate identity and fresh
isolated evidence. Do not rewrite an existing candidate record.
Use [Compatibility and lifecycle](COMPATIBILITY-AND-LIFECYCLE.md) to determine
which evidence boundary a change crosses.

## Research changes

Keep model-fitting and ContextBench work outside the runtime closure. Each new
experiment must name its mechanism, control, treatment, gates, token accounting,
and stopping rule. Bind reviewed decisions before removing reconstructible
caches.

## Documentation changes

Update the document that owns the reader's question, preserve links to exact
source evidence, include an `Open Questions` section, and run:

```sh
node docs/verify-docs.mjs
```

Do not copy large upstream contracts into the manual. Link them and explain
their practical consequence.

## Validation order

1. Syntax and focused package tests.
2. Documentation integrity if docs changed.
3. `doctor` and candidate inspection when the product boundary is relevant.
4. Complete product tests for closure-changing work.
5. Release verification for a candidate or release change set.

## Review checklist

- The diff has one coherent objective.
- New claims point to current evidence.
- Authority and effect boundaries remain explicit.
- Failure, timeout, restart, duplicate, and stale-state paths are considered.
- Generated files are either reproducible or explicitly content-bound.
- Open questions have an owner or next decision route.

## Open Questions

- Should contributor tooling generate a successor-candidate checklist from the
  staged diff automatically?
