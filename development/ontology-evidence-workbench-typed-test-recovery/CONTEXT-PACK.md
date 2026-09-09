# Context Pack

## Intent

Turn the accepted SWU006 failure research into a bounded development package
that makes future typed-test failures inspectable after mandatory cleanup.
Author Define, Design, and Plan only; do not execute or retry the build.

## Evidence selected

- Accepted findings:
  `../ontology-evidence-workbench-semantic-navigation/research/2026-08-03-swu006-typed-test-failure-prevention/findings.md`.
- Private builder and its current tests under
  `../../implementation/ontology-evidence-workbench/`.
- Bound patch0004 and binding006, used as immutable failure context.
- Invoke Define, Design, Plan, Distill, Implementation Layering, Dispatch Spec,
  and Signal Observer contracts.

## What the evidence proves

1. DOM-using tests entered a generated Vitest configuration that declares a
   Node environment, producing `document is not defined`.
2. The builder had access to command streams, but the terminal receipt retained
   only hashes before the workroot was removed.

## What remains unproved

- That the product behavior is defective.
- Whether test-side isolation or a config-side DOM environment is the correct
  compatibility repair.
- Whether another build/import/runtime failure appears after that repair.
- Any runtime, release, deployment, or production-readiness claim.

## Authority ceiling

This package may author private failure-evidence contracts and a non-selecting
compatibility decision packet. It may not choose the compatibility branch,
mutate public Arcanum, retry SWU006, perform a generalized build, use network,
or claim execution success.

## Selected continuation

After every authoring gate passes, the only selected implementation unit is
`SWU-OEWFR-001`, deterministic diagnostic sanitization. Task Session must
perform a fresh preflight before any mutation.
