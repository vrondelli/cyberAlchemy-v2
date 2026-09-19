---
node_type: work-pack
is_session: false
status: candidate
boundary: INTERNAL — make impl/ green (invoke plan mode)
created: 2026-06-29
authored_by: invoke (mode: plan)
design: ./DESIGN.md
target_artifact: projects/domainspec-v2/impl
complexity: medium
---

# Make `impl/` Green — Work-Pack

Execute from `projects/domainspec-v2/impl/`. Each SWU is independently green-able; do L0→L3 in order
(each layer's acceptance must pass before the next). Read-only on v1.

## SWU manifest

| SWU | Layer | Title | Acceptance (green) |
| --- | --- | --- | --- |
| **G1** ✅ | L0 | Relocate engine fixtures + repoint tests | `npm run engine:test` → RC 0 — **DONE 2026-06-29 (8 files, 97/97 tests)** |
| **G2** ✅ | L1 | Fix tag tests (node:test + drop pnpm) | runner **FIXED 2026-06-29**; **GREEN 2026-06-30 (8/8)** — the 2 remaining fails were the G3 validator-path coupling, closed when G3 retargeted the defaults. |
| **G3** ✅ | L2 | Retarget validators + seed a v2 feature fixture | **DONE 2026-06-30** — `npm run validate` RC 0 (docs PASS · rels PASS, 29 edges · lint CLEAN). Retargeted 3 validators' defaults (`RELATIONSHIPS.md`/`TAXONOMY.md`/`features-root`) → `spec/`; seeded `spec/features/sample/`; `engine:lint` now direct-invokes the cli (avoids the nested-`npm -w` re-entrancy bug). **Also greened G2's 2 tag tests.** Discriminating: broken link → RC 1. |
| **G4** | L3 | Wire `validate` + the fail-closed hook into CI/pre-commit | the gate runs on write/CI; green stays green |

---

## SWU-G1 — Relocate engine fixtures + repoint tests  (L0)

- **Write scope:** `impl/test-derivation-engine/__fixtures__/**` (new); `impl/test-derivation-engine/src/grammar/l3-domain-rules.test.ts` (edit the two path consts).
- **Steps:**
  1. `mkdir __fixtures__/{financial-settlement,agent-execution-orchestrator}`; copy from v1 (read-only):
     `validation/poker-team/docs/features/financial-settlement/domain.md` → `__fixtures__/financial-settlement/`;
     `implementation/domainspec/docs/features/agent-execution-orchestrator/{domain.md,rules.md}` → `__fixtures__/agent-execution-orchestrator/`.
  2. Repoint `FS_DIR`/`AEO_DIR` (lines 13-20) to the local `__fixtures__/…` (relative to the test file).
- **Impl detail:** paths only; no logic change. The test asserts: 11 DomainField nodes, 1 Enum, 11 domain-field + 1 domain-enum obligations (FS); ≥3 policy-decision, valid-transition `run-started`, ≥1 rules.md invariant/needs-formal (AEO). Fixtures must be the *same* corpora the assertions encode.
- **Validation strategy:** `npm run engine:test` green; **edge case** — if fixture content drift breaks an assertion, the fixture (not the test) is wrong (it must match the asserted counts).
- **Verification:** `npm run engine:test` RC 0.

## SWU-G2 — Fix tag tests (node:test + drop pnpm)  (L1)

- **Write scope:** `impl/package.json` (`tags:test` script); `impl/governance/tags/tools/tests/code-tag-tools.test.ts` + `code-tag-composability.test.ts` (the `runTsxScript` helper).
- **Steps:**
  1. `tags:test` → `tsx --test governance/tags/tools/tests/*.test.ts` (node:test runner via tsx), not `vitest run`.
  2. In each test's `runTsxScript`, replace `spawnSync("pnpm", ["dlx","tsx", …])` → the local tsx (`spawnSync(process.execPath, ["--import","tsx", script, …])` or `node_modules/.bin/tsx`). No pnpm.
- **Impl detail — failure modes:** the tests spawn the tag CLIs against a temp features root they build (`createTempFeaturesRoot`); they need a working tsx invocation + cwd = `impl/` (`frameworkRoot` resolves to `../../../../` = impl/). Confirm that resolution after the move.
- **Validation strategy:** `npm run tags:test` green; **negative control** — the composability tests assert both pass-cases AND fail-cases (lines 240/300), so a vacuous "all pass" would itself be a red flag.
- **Verification:** `npm run tags:test` RC 0 with both pass+fail assertions exercised.

## SWU-G3 — Retarget validators + seed a v2 feature fixture  (L2)

- **Write scope:** `impl/tools/validate-doc-links.ts`, `impl/tools/validate-relationships.ts` (features-root + relationships path → configurable/default to v2); `impl/spec/features/<sample>/**` (one minimal valid feature pack fixture).
- **Steps:**
  1. Default `featuresRoot` to a v2 location (`impl/spec/features/`) + `--relationships` default to `impl/spec/RELATIONSHIPS.md` (keep the `--features-root`/`--relationships` flags).
  2. Seed one minimal **valid** feature pack under `impl/spec/features/<sample>/` (links resolve, relations conform) so the gate is **non-vacuously green** (not empty-pass).
- **Impl detail:** validators are file-scanners (node-only); the change is path defaults, not logic. Keep them total over an empty features set (empty → clean pass) so the gate never hard-errors.
- **Validation strategy:** `npm run validate` (= `validate:docs && validate:rels && engine:lint`) RC 0; the seeded fixture proves C9 (links resolve) + C11 (relations conform); C10 via the engine lint on the fixture.
- **Verification:** `npm run validate` RC 0 on the seeded fixture; flipping one link/relation in the fixture flips it to non-zero (discriminating).

## SWU-G4 — Hardening: wire the gate  (L3)

- **Write scope:** CI config / pre-commit (or the v2 settings hook) — repo-policy dependent.
- **Steps:** run `npm run validate` (+ `engine:test`, `tags:test`) on write/CI; optionally wire the owned fail-closed PostToolUse hook (assimilation A1, now in v2) so spec-doc writes re-lint.
- **Validation strategy:** a deliberately-broken spec doc makes the gate fail in CI/pre-commit.
- **Verification:** the gate blocks a known-bad change. **(Defer until L0-L2 green.)**

---

## Dispatch technique trace

- `sequence` (L0→L3, each layer's acceptance gates the next); `concrete_path_evidence` (every SWU names exact files + the green command); `validation_loop` (per-SWU acceptance = an npm command at RC 0); `owner_boundary_check` (read-only v1, copy-out fixtures, moat untouched); `residue_ledger` (below). No full dispatch JSON — single-owner execution, no fan-out.

## Distill validation (self-check)

- **pass.** Smallest-coherent-units: each SWU is one runnable green command (small enough to execute, large enough to mean "that check passes"). Recomposes into the design's target state (the 4 commands). No hidden gaps for L0-L2 (fixtures confirmed to exist; runners diagnosed). L3 is honestly deferred. No overbuild (paths/runner wiring only; no new deps, no logic rewrite).

## Residue

- The engine fixtures duplicate v1 corpora — if v1's domain.md/rules.md change, the v2 fixtures drift (acceptable: v1 is frozen). 
- SWU-G3's "minimal feature fixture" is a *test* surface, not v2's real spec corpus (that comes with real feature work).
- **C9/C11 are non-vacuous + discriminating** (29 canonical edges checked; broken link → RC 1). **C10 (engine:lint) is currently vacuous** — `spec/features/sample` has no tables and no Formal cells, so lint is CLEAN by having nothing to catch. It becomes non-vacuous when a real feature pack (canonical tables + Formal cells) lands.
- `engine:lint` lints **only** `spec/features/sample` (single path, not a glob over all features). Generalize to all features when v2 has more than one.
- Reformulation of the validators/tools to v2's mandate (beyond "runs green") remains per IMPORT-MANIFEST.

## Next route

**L0–L2 all GREEN (2026-06-30):** `engine:test` 97/97 · `tags:test` 8/8 · `validate` RC 0 · `typecheck` RC 0. Only **G4** (wire the gate into CI/pre-commit) remains — deferred. Next substantive work is reformulation of the imported docs/tools per IMPORT-MANIFEST, not more green-ing.
