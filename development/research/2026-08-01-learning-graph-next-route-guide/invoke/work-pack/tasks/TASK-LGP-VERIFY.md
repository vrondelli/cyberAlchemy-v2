# TASK-LGP-VERIFY: Independent Closure Audit

## Smallest Working Unit Exemption

This is a closure-only `VERIFY` task. It performs no product mutation and is
exempt from SWU decomposition.

## Objective

Independently reconcile source bindings, product artifacts, task/owner
receipts, learner-loop traceability, negative fixtures, browser observations,
and claim ceilings after SWU-LGP-010.

## Read Scope

- all exact product paths declared by SWU-LGP-001 through 010;
- current Plan/Design/source contracts;
- all session evidence and owner receipts;
- current repository/subproject status limited to the declared roots.

## Checks

1. No undeclared product or plan path was mutated.
2. Every SWU has one terminal Task Session receipt under `session-evidence`
   and one separately produced lifecycle-owner receipt under `owner-evidence`,
   both bound to its baseline and validation.
3. Generated snapshot matches current source digests and expected fixture.
4. All killed/authority/stale/endpoint mutants fail closed.
5. Learner loop recomposes with identical IDs/classes/proof tiers across views.
6. Existing host mechanics regressions are absent.
7. Browser receipt binds runtime, inputs, observations, and teardown.
8. No claim exceeds candidate fixture/browser mechanics.
9. A-004/A-005 remain open unless separate owner evidence exists; no automatic
   L3 or adapter route is created.

## Output

Write a read-only audit receipt under
`work-pack/session-evidence/TASK-LGP-VERIFY/` with verdict `pass`, `flag`, or
`block`, exact evidence references, residue, and owner decision options:
`revise`, `hold`, or `propose-separate-human-research`.

The audit cannot promote, publish, release, deploy, select another task, or
contact the candidate adapter route.
