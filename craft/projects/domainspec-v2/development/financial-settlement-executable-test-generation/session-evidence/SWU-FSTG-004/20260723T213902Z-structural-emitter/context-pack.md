# SWU-FSTG-004 Context Pack

- Mode: standard, strict
- Coverage: 11/11 obligations
- Decision: `expected-red-harness`
- Authority: private, internal, owner `projects/domainspec-v2`

## Controlling Constraints

Generate exactly 52 runnable structural cases from the six declared catalogues.
Every case carries a stable coverage key and source anchor and invokes the
relevant evaluator independently. The generated raw suite remains red only for
`edge-instance-conformance@1::financial-settlement.edge.007.maps`.

The selected verifier is a meta-harness: it succeeds only when raw Vitest
reports 52 total, 51 passing, one failing with that exact coverage key, and no
todo or skipped structural cases. Any missing, extra, or newly failing case is a
verification failure.

The output writer is contained to
`projects/domainspec-v2/impl/generated-tests/`. It must not edit Financial
Settlement source. Behavioral evidence remains separate at 79 total
obligations, 12 assertions, one property, and 67 coverage gaps.

## Validation

Run focused emitter tests, the expected-red verification command, and the full
engine suite. Existing BTE verification is also required before closeout.
