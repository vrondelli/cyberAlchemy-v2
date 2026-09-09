# Plan Transport

Status: ready for human review; mutation handoff withheld

## Transported Artifacts

- [`PLANNING-CONTEXT.md`](PLANNING-CONTEXT.md)
- [`IMPLEMENTATION-LAYERING.md`](IMPLEMENTATION-LAYERING.md)
- [`WORK-PACK.md`](WORK-PACK.md)
- [`EXECUTION-PACK.md`](EXECUTION-PACK.md)
- [`VALIDATION-STRATEGY.md`](VALIDATION-STRATEGY.md)
- [`DISTILL-VALIDATION.md`](DISTILL-VALIDATION.md)
- [`work-pack/swu-manifest.json`](work-pack/swu-manifest.json)

## Receiving Owner

The human project owner receives a Plan menu, not an execution session. Task
Session may receive exactly one SWU only after an explicit selection.

## Recommended Next Route

If implementation is desired:

```text
task-session SWU-OCGP-001
```

That phrase is a recommendation, not a selection or current authorization.
Task Session must still bind current source and closeout baselines before any
write.

## Withheld Routes

- automatic execution of `001–009`;
- L3 HTML/report implementation;
- IOLM or Poker Team integration/repair;
- ontology or authority mutation;
- public Arcanum transport;
- promotion, publication, deployment, or production-readiness claims.

## Re-entry

Use `invoke:refresh:proposal-only` when source Design, policy ownership, runtime
assumptions, dependencies, or protected selectors drift. Use
`invoke:refresh:apply-approved` only for the exact closeout deltas approved and
baseline-bound by a selected Task Session.
