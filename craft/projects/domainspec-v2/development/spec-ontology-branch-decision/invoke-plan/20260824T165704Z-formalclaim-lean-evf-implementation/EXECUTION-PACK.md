# Execution Pack

## Entry

The machine-readable entry is `EXECUTION-ENTRY.json`. Its frontier contains all
14 units in canonical order but selection remains null. Execution is blocked
until Rondelli accepts the exact final candidate manifest.

After acceptance, the execution owner selects only the current successor and
opens one fresh Task Session with the matching task file and validation
contract. A successful terminal receipt routes to `invoke:refresh` for closeout;
it does not automatically execute the next unit.

## Required execution evidence

Each session must record:

- exact Plan candidate digest and owner acceptance;
- exact task/SWU/validation-contract hashes;
- preimage target inventory including absent/create targets;
- preserved unrelated dirty bytes;
- command argv, cwd, timeout, exit code, and retained output;
- postimage target inventory and scoped diff;
- acceptance checks and claim ceiling;
- rollback or compensation inventory;
- governance terminal receipt and next route.

## Stop conditions

Stop at the first semantic ambiguity, scope expansion, target drift, failed
critical validation, stale digest, unsafe or `sorry` finding, missing axiom
closure, path-only identity, theorem/runtime conflation, authority request,
destructive/irreversible effect, credential/network/external effect, or C12
pre-merge gate incompleteness.

## Pre-merge boundary

The last unit may assemble and mechanically validate a freeze package. It must
not invent a response, treat the validator as principal authentication, merge,
or claim readiness after any candidate drift.
