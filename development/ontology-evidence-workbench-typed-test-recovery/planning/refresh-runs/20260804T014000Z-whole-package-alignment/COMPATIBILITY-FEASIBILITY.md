# SWU006 compatibility feasibility

Status: read-only local research complete. This report supports Decision Gate;
it selects no option and grants no mutation, dependency, network, retry, build
or browser authority.

## Proved boundary

- Patch0004 adds two `navigation.test.tsx` tests whose first operation uses
  `document.body.innerHTML`, focus and `activeElement`.
- The private builder generates `vitest.oew.config.mjs` with
  `test.environment: "node"`.
- Binding006 expects 7 files and 15 tests. The preceding 11-test candidate
  passed under Node; patch0004 adds one pure activation-key test, two DOM tests
  and one pure store test.
- Node 22.12.0 has no `document`; the first DOM operation necessarily raises
  `ReferenceError`.
- The frozen dashboard lockfile does not resolve `jsdom` or `happy-dom`; they
  appear only as optional Vitest peers.
- Current binding006 binds pre-recovery builder/test identities. Any successor
  must instead bind builder
  `2ae10b97a60f924c82c5da068dab23a9ad61c9c1be2f152d35dca57a93fab86e`
  and test
  `3f94699d92a0e06a0d33710cd7e8771f98055c560ba31ad9056cc5dd2bf402bd`.

This proves a test/configuration contradiction. It does not prove a product
defect, decide the repair side, or prove that no further typed failure exists.

## A — test-side repair

Keep the generated Node environment. Replace direct global-DOM setup in the
two tests with a bounded focus-root fixture implementing only the contract the
product helper already accepts: `querySelectorAll`, `querySelector`,
`activeElement`, focus success/failure, ambiguous selection and heading
fallback. Keep real DOM/tab/focus behavior as mandatory Chromium acceptance.

- Benefit: smallest dependency-free successor; no package or lockfile change.
- Risk: unit tests have less DOM realism and must remain non-vacuous.
- Acceptance guard: fixtures must fail on wrong selected count, wrong fallback,
  rejected focus, ambiguous relations and wrong returned reason; browser proof
  remains mandatory.
- Reversibility: high; patch-only successor.
- Feasibility: structurally admissible with current local evidence.

## B — config-side repair

Give only the selected DOM-dependent test file a DOM-capable Vitest environment
and bind its exact package/version, package-manifest and frozen-lockfile delta.
Keep unrelated pure Node tests isolated.

- Benefit: unit assertions exercise DOM focus and `activeElement` semantics.
- Risk: larger dependency and lockfile surface; `jsdom`/`happy-dom` is not
  currently resolved, so a separately owned manifest/lockfile change and exact
  fetch authority are prerequisites.
- Acceptance guard: per-file isolation, exact runtime identity, frozen-lockfile
  proof, no ambient environment widening and later Chromium proof.
- Reversibility: high at the candidate layer, but broader than A.
- Feasibility: structurally admissible only with the named dependency,
  lockfile and network owner gates; selecting B does not satisfy them.

## Recommendation

Choose A for the current single-owner prototype. It repairs the proved
contradiction with the smallest new surface and preserves real DOM behavior as
browser acceptance. Choose B when DOM-faithful unit coverage is worth adding
and governing a new frozen dependency/runtime surface.

