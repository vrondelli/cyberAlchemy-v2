# TASK-UOVA-07 — Full Prototype Acceptance

Goal: decide whether the unified Body War prototype is actually testable, using machine-observed semantics and browser geometry rather than screenshots or counts alone.

Write scope: OEW and Body War owned test/fixture/receipt paths, browser evidence under the SWU attempt, and only minimal source corrections admitted by the preflight. No contract relaxation, network, deployment, or Git publication.

## SWU-UOVA-021 — Deterministic, browser, and performance matrix

Primary behavior: execute the complete acceptance contract against the source-owned full Body War build.

Execution algorithm:

1. Bind Node `22.12.0`, pnpm `10.6.2`, React Flow `12.10.1`, ELK `0.9.3`, Playwright `1.59.1`, Chromium `1217`, locks, sources, fixtures, and build digest.
2. Run schema, mapping, membership, partition, portal, Path, navigation, encoding, geometry replay, full-index, build replay, and zero-surgery validators.
3. Run all thirteen toy-game mutations plus every UI-profile formation, representation, authority, action-bijection, snapshot, and runtime-dependency negative; require their exact failure codes.
4. Serve the exact generated artifact on loopback and use the shared browser runtime.
5. Assert one nonzero path per scene relation, endpoint/marker distance ≤4px, exact label/color/pattern/direction, icons plus text, Grouped Portal expansion, same-ID Path/inspector behavior, frame restoration, and zero browser/page errors.
6. Repeat at desktop, 390px, 200% text, forced colors, reduced motion, keyboard-only, renderer failure, and static/no-JS output.
7. Record raw Path/layout/transition/input/long-task/heap measurements and fail any prototype cap: 250ms, 2,000ms, 500ms, 100ms, zero >200ms post-layout long tasks, ≤150 MiB heap delta.

Independent acceptance: every clause in `ACCEPTANCE-CONTRACT.md` passes on exact 276/301/39/577 inputs; all 57/57 UI instance and Mapping contracts with `realization_swu` through 021 are implemented and pass formation/conformance. A failed critical assertion blocks activation and leaves the already-proven SWU-011 linear/index fallback available; it cannot be waived inside this unit.

Dependency: 020. Required commands include OEW test/build/verify, Body War deterministic test, Body War browser validator, toy-game replay, and scoped `git diff --check`. Closeout synchronizes 021, this task, W3, and Work Pack; select 022 only on full pass. Expected result: consolidated prototype validation report plus machine-readable receipt and raw measurements. Ceiling: local testable prototype, not release/deployment/formal accessibility/human comprehension proof.
