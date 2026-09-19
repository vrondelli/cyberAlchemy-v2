# Independent wrapper and shared-health amendment review

Approved as an offline implementation at the exact bindings below; no blocking implementation finding remains from this review. This is not approval of an unseen live freeze or evaluator contract. No provider, network, credential or gold access occurred.

The added regressions pass for synchronous and asynchronous settlement rejection, storage failure immediately after receiving known usage, and a second model attempt waiting for secret resolution while the first stops shared health. The combined suite passes29 tests:12 core,10 provider,7 wrapper.

Settlement uses allSettled around deferred calls, so synchronous throws and rejected promises become explicit unsettled receipts without bypassing signal-handler cleanup or the final seal. The seal's failed-status conjunction includes source revalidation, settlement and wrapper failure. Record events enter the private in-memory buffer before the storage check; the fallback therefore retains received120-token usage even when its journal write is rejected, while preserving all eight answer slots.

The core now accepts an explicitly supplied shared health object only in its initial unstopped, zero-reservation state with the exact plan budget. The wrapper passes the same object to the core and provider's actual-dispatch guard. The deterministic secret-wait regression starts two transport callbacks, permits exactly one physical model attempt, preserves its120 known tokens, then prevents the waiting second callback from dispatching after HTTP429 stops health. No unknown cost is invented for that explicitly unstarted second call.

The single-use wrapper verifies source/qualification, exact plan, native continuity/evolution records and bound review inputs before provider construction. It retains host12GiB/guest8GiB storage guards, durable non-overwriting fsynced journals, actual-dispatch guards, cancellation, bounded settlement, final source revalidation and an error-preserving generation seal. Setup failures and fallback paths retain four pairs/eight slots. Provider and core responsibilities remain as recorded in their earlier reviews.

| Source | SHA-256 |
| --- | --- |
| [live.mjs](live.mjs) | `1eb154af1ef492388f00eb98010b758892d6515759b21443b285d69a018e39f1` |
| [live.test.mjs](live.test.mjs) | `0d7c18a972a7f054a8e11ff31e08297a4b5e2f5e0f01adf7051da6080ec176b1` |
| [runner.mjs](runner.mjs) | `e4cb39940bdbdb1b45d416c22e1f0300a71bf8464b7adfd7b0a6a777bd30b854` |
| [runner.test.mjs](runner.test.mjs) | `8a2f512f249e04753ef3d70fca1a18c3d6f9311781ebd2bb4b39f5e6986ff1ab` |
| [provider.mjs](provider.mjs) | `c8d946dfc811aaf27087cfe7bbc85b6eb159374f8c6d9abc4ddd38d65d785893` |
| [provider.test.mjs](provider.test.mjs) | `e80e09f327856cb77b272debc436a580b51e8747a01044d1f7dc44ab5a5cd199` |

## Open Questions

The actual execution freeze, full imported dependency closure, prospective native records, evaluator-reference identity and transport credentials must still be verified at the live boundary. This review used injected synthetic HTTP and storage failures, not real host depletion or provider cancellation. Any unsettled transport or failed source revalidation blocks valid evaluation regardless of an otherwise completed nested core result. Campaign quality/completion and>=15% cumulative model-token savings remain empirical and unproven.
