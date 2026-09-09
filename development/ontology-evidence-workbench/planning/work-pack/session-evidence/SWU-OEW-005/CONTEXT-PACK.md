# SWU-OEW-005 Context Pack

Status: **BLOCK**
Mode: Context Builder lean, strict
Artifact class: private session evidence

## Objective

Build the exact pinned Understand-Anything viewer and retain a digest-bound
handoff without exceeding SWU-OEW-005's exact target inventory.

## Covered Obligations

- exact repository and commit;
- MIT license and inspected file digests;
- lockfile install, upstream tests/build, negative pin witnesses;
- private, authority-free, generated evidence;
- current package validation interface;
- exact source/viewer handoff to SWU-OEW-006.

## Contradiction

The task requires `npm run verify:upstream`, but `package.json` is not in the
six-target inventory and does not define that script. The task also requires a
retained source cache and viewer artifact path/digest, while the only generated
target is `build-receipt.json`. A receipt cannot serve as the native viewer
artifact, and writing an unlisted cache/dist would violate the closeout
contract.

Strict coverage cannot resolve this as not applicable because both requirements
are acceptance-critical. Runtime handoff: **BLOCK**.

## Zero-Mutation Result

No network fetch, installation, build, or implementation write occurred.
Decision Gate `DG-OEW-005-UPSTREAM-OUTPUT-SCOPE` owns the next route.
