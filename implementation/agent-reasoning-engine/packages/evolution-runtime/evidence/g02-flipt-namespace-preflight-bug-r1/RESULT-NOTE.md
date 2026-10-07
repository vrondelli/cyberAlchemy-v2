# G02 Flipt namespace pre-model ranker failure r1

## Result

The source-only Flipt namespace/ETag task `SWE-Bench-Pro__go__maintenance__bugfix__ebadd40b` passed named-source binding (`FileInfo`, `GetVersion`), but the ARE arm failed during ranking before any model dispatch. It recorded `orchestration_error`, zero model calls and zero tokens. The concurrently started DSH arm was stopped once the ARE failure was known; its partial transport is not a valid control. No native score was opened, and this root has no matched result.

The failure reproduced locally against the pinned base source: the task contains `constructor`, and ranker token expansion used `EXPANSIONS[token]` on an ordinary object. The inherited `constructor` function was spread as if it were an array. A SHA-pinned overlay changes the lookup to `Object.hasOwn(EXPANSIONS, token) ? EXPANSIONS[token] : []`; the same source-only ranking then completes. The pair is being restarted in a distinct frozen root.

Full failed-run evidence remains at `/opt/are-benchmark-runs/g02-cross-layer-flipt-namespace-gofunc-pair-r1/`; the pre-model debug reproduction and patched overlay are at `/opt/are/evolution-runtime/g02-namespace-debug-r1/`. The two DSH containers were stopped, not deleted, after the ARE zero-call failure.

## Open Questions

- Does the corrected pair complete and improve all four metrics?
- Should the own-property guard be promoted to every active ranker variant using the inherited expansion table?
