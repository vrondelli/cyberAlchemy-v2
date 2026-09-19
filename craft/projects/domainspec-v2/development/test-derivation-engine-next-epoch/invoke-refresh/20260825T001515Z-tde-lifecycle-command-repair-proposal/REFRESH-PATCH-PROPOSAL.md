# TDE @4 lifecycle and command repair proposal

The fresh `dsv2-tde-multiformalism-profile-epoch@4` proposal repairs the two governance defects that stopped applied @3. It creates an exact 84-file successor in staging only; no canonical or product files are changed.

## Exact repairs

- All 34 invalid current-lifecycle references across 20 files now bind @4.
- All eight stale current identity labels now bind @4/r4.
- @2 appears only in explicitly historical, non-transferable provenance.
- `--contracts` binds `plan/work-pack/shared/validation-contracts/`, never `VALIDATION-CONTRACTS.json`.
- The exact ten-contract directory passes; aggregate, missing, empty, and nine-contract fixtures fail.
- Candidate/material planning surfaces carry the same future apply argv.

## Preserved semantics

The ten SWUs, dependency/successor graph, TypeScript/Python/Rust/extension/Lean-EVF boundaries, write scopes, validation contracts, claim ceilings, Rondelli ownership, and Victor pre-merge-only timing are unchanged.

## Frozen identity

- Candidate manifest SHA-256: `655e56a9e6798695652789a4147e9ecf57539eeae637bb524c4937f5225dc078`
- Target inventory digest: `e450921cbe2072c9142b992289db3e49564040cda54bc9727fba6a85a89ef565`
- Material proposal digest: `e53224d9cade91854acfb9fa4435c38c59b56d06aa3ec6e39098f422b512ca05`
- Canonical semantic digest: `61aea5107edca198f4dddd67e316af5e8c9a6fcb8c5cdb8f6826f3d5bea8122f`

## Next boundary

Fresh exact apply authorization is required. After apply, validate live equality and all gates, complete v2 preacceptance closure plus independent review and adoption, emit and validate the v2 owner request, obtain Rondelli acceptance, then create real selection and separate chain approval. Task Session and Victor review remain later.
