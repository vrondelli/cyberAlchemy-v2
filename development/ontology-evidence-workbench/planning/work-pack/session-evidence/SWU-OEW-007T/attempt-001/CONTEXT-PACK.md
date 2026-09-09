# Context Pack — SWU-OEW-007T Attempt 001

Mode: deep, strict  
Authority: private Task Session evidence  
Target: `SWU-OEW-007T`

## Runnable boundary

Only `SWU-OEW-007T` is selected and implementation-authorized. It owns one
six-path repair: three completed-007 overlay source files plus the overlay
manifest, first-working-version manifest, and `L1-BUILD.lock.json`. It does not
own package metadata, tsconfig, generated builds, 013B execution, browser work,
authority, or publication.

## Obligations

| ID | Obligation | Evidence |
| --- | --- | --- |
| CTX-01 | Prove live selected/current selector is only 007T, authorization is true, runtime readiness is false, and budget is 4/8. | live manifest, chain, frontier readiness, continuity, typed-overlay Refresh receipt |
| CTX-02 | Bind exactly six target preimages and reject any expanded write scope. | 007T manifest object, target bytes, package registry |
| CTX-03 | Preserve completed 007/008F receipts and completed-007 historical ownership while rebinding only current bytes. | completed receipts, 007 closeout, two manifests |
| CTX-04 | Preserve plain-JavaScript parseability of all three `.ts` files. | `ui-store.test.mjs` copies them verbatim to `.mjs`; `view-parity.test.mjs` imports `types.ts` as a data JavaScript module |
| CTX-05 | Repair strict typing without explicit/implicit `any`, TypeScript-only syntax, tsconfig weakening, or behavior drift. | attempt-003 diagnostic plus current sources |
| CTX-06 | Update both manifests to exact post-repair hashes/sizes while retaining historical receipt/preimage bindings. | overlay and first-working-version manifest contracts |
| CTX-07 | Update the build lock to name 007T only as mutation/binding owner while retaining 013B as owner, consumer, build owner, and runtime owner. | 007T lock-role contract, frontier validator, current build lock |
| CTX-08 | Admit mutation only through a schema-valid six-target material package and Task Session mutation-admission receipt. | Task Session mutation-admission contract and typed-overlay Refresh route |
| CTX-09 | Pass the existing `npm run test:ui-store` without changing its runner or transitive fixture inputs. | package registry and focused runner |
| CTX-10 | Pass the exact fresh digest-named locked-workroot dashboard build, expanding to `tsc -b && vite build`. | L1 build lock, pinned workspace metadata, attempt-003 build evidence |
| CTX-11 | Preserve the single package root, protected-set equality, target parity, and cleanup; emit no final-build claim. | package registry, lock/protected contract, work-pack ceiling |
| CTX-12 | Preflight and join one separate receipt-bound closeout owner; on PASS consume 4→5 and report 013B eligible without selecting it. | Task Session closeout contract, work-pack/task/wave/chain/continuity |

Coverage: 12/12 obligations covered. No contradiction or unresolved decision
remains. The implementation is intentionally JS-valid JSDoc plus runtime
narrowing because TypeScript interfaces, annotations, assertions, or other
TS-only syntax would break the existing acceptance runners.

## Validation surface

1. Canonical mutation admission: exact six writes, private/internal boundary.
2. `npm run test:ui-store`.
3. Plain-JavaScript parse/import checks exercised by `test:ui-store` and
   `test:view-parity`.
4. Fresh locked workroot:
   `pnpm --filter @understand-anything/dashboard build`
   (`tsc -b && vite build`).
5. Current manifests, file hashes/sizes, lock roles, 70-check build-lock
   contract, and role/target/history negatives.
6. Package registry equality, protected-set equality, workroot/store cleanup,
   exact six-target live/staged parity, and scoped diff check.
7. Separate Invoke Refresh owner closeout over the frozen nine projections.

## Evidence ceiling

Passing proves only the 007T strict typed-input repair, its exact current
bindings, the focused store tests, and one fresh typed dashboard build. It does
not prove or execute the 013B final build/verifier, 014/014V browser acceptance,
manual UX, L2, authority, promotion, publication, deployment, release, or
production.
