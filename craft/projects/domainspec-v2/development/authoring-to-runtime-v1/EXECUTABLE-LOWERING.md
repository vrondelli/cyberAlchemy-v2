# Explicit application executable lowering

Status: bounded S06 TypeScript vertical implemented. Authority effect: none.

The public Alch API now exposes:

```typescript
prepareApplicationExecutable(source, bindings, sources, interpretation, execution, compiler)
compileApplicationExecutable(prepared, compiledGraph, compiler)
```

Preparation re-forms the exact application and its explicit Rule projection.
The execution envelope selects `alchlang.application-execution/v1-candidate`,
binds the exact projection digest, and carries the existing DomainSpec
`reconciled-compilation/v1-candidate` selection. There is no replacement
operation language, generator, transaction implementation or provider default.

## Preserved contracts

- One explicit input parameter has the authored input type; the result has the
  authored output type. Missing or extra operations reject.
- Reads, writes and guard sets must match the authored Operation shape. L0
  action slots retain their qualified Entity references. Reads and explicitly
  selected create writes produce existing canonical graph relationships.
- Factories and their validators are supplied explicitly in the selection.
  No validity Rule is generated to satisfy a backend prerequisite.
- DomainSpec's existing decoder and action checker own parameter binding,
  value typing, factory coverage, guard arguments, effects and settlement.
- The compiled graph's complete source manifest must match prepared file
  paths, lengths and digests. A valid but different graph is rejected.
- The exact Rule–FormalClaim join is checked again against the executable
  graph before the public DomainSpec planner produces code.
- Prepared candidates are frozen and registered locally. A copied/edited
  candidate cannot bypass preparation by presenting refreshed hashes.

Compilation plans source artifacts only. Tests separately execute a bounded
in-memory transaction dependency; no database, broker, network, delivery,
durability or operational authorization is inferred.

## Tested native example

The fixture explicitly authors an Order, a ground eligibility claim/Rule, a
typed identity-reflexivity claim/Rule, and SubmitOrder. The latter reads an
existing order, guards on that stored order, and replaces it with the supplied
request value. Its factory uses the authored identity Rule. Identity reflexivity
adds no business restriction; the selected UInt64 representation still rejects
malformed values. All meaning/acceptance fixtures are synthetic.

Generated TypeScript is compiled and run through the public DomainSpec API.
The success case reads `accepted: true` but writes `accepted: false`; the
rejection case reads false despite a true request. This distinguishes the
declared guard binding from a plausible but incorrect request-based guard.

| Scenario | Expected result | Expected transaction calls |
| --- | --- | --- |
| Eligible stored order | committed; exact replacement and result | begin, read, commit |
| Ineligible stored order | rejected at guard | begin, read, rollback |
| Missing stored order | failed at read | begin, read, rollback |
| Read throws | failed at read | begin, read, rollback |
| Malformed input | failed at input | none |
| Commit rejects | rejected at commit | begin, read, commit |
| Commit throws | indeterminate at commit | begin, read, commit; no retry or rollback |

A guard-bypass mutant still compiles, but incorrectly commits and fails the
independent rejection oracle. Two fresh processes with different locale
settings produce identical candidate, claim-join, trace and generated-artifact
digests. Test-owned temporary source and output directories are cleaned.

## Boundaries and remaining work

This proves the L0 explicit interpretation/operation slice. It is not full
FormalClaim evaluation, a TDE projection, EVF evidence, provider durability,
or installed-package qualification. Public `.alch` check/build wiring is I07;
Event/Mapping prerequisites are I00; full language breadth is C02/C03;
installation is P02. L0's operation shape permits one typed input parameter;
multi-entry/application breadth remains in the named later nodes.
