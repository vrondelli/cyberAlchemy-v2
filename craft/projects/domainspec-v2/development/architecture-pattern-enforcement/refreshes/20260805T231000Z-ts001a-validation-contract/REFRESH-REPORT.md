# Invoke Refresh: TS001A structured validation contract

The TS001A plan is now machine-auditable. Its verification is three distinct
contracts: focused Vitest runtime behavior, a focused TypeScript project that
covers provider and type-level test paths, and the existing parent package
typecheck as regression evidence.

The focused TypeScript contract is necessary because the current parent
`tsconfig.json` includes only `tools/**` and governance tag tooling. Treating
the passing parent typecheck as provider proof would have been false.

This refresh changed only the Work Pack, the TypeScript task contract, and the
shared SWU manifest. It did not create provider code, tests, or the future
focused `tsconfig.json`; all remain inside TS001A execution scope.

The exact material package passed before and after apply, Vitest 2.1.9 is
available under Node 22.13.0, the current parent typecheck passes, all staged
postimages equal their live targets, and scoped whitespace validation passes.

Next route: fresh Work-Pack Readiness Audit for
`SWU-APE-ENUM-TS-001A`. No successor is selected by this refresh.
