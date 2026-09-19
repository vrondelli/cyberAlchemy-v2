---
node_type: refresh
is_session: false
status: applied — deltas T1–T7 applied to DEFINE/DESIGN/WORK-PACK/implementation-layering 2026-07-02
created: 2026-07-02
authored_by: invoke (mode=refresh)
target_artifact: meta-type-formalization package (DEFINE / DESIGN / WORK-PACK / implementation-layering)
note: Paths repo-root-relative from domainspec-core/. Adds a per-validator automated-test requirement.
---

# Meta-Type Formalization — REFRESH REPORT (tests) (invoke mode=refresh)

Every delta maps to a typed source signal. Applied on owner directive ("refresh the artifacts").

## Source signals (typed)
- **S1 · owner-intent (2026-07-02):** "we need to have automated tests for each validator added." The
  per-SWU deliverable must include an **automated test** of the validator's accept/reject, not only a
  manual fixture run.
- **S2 · session evidence:** MT0 shipped `impl/tools/validate-content.ts` proven by manual fixture runs
  (`--file entity-ok/bad`) but **no test file** — a real coverage gap against the repo's own test culture
  (`tags:test` = `node --import tsx --test governance/tags/tools/tests/*.test.ts`).

## Build-from-owned test convention (the pattern all deltas bind to)
Precedent: `governance/tags/tools/tests/*.test.ts`. Idiom = **black-box CLI test**:
`node:test` + `node:assert/strict`; `spawnSync(process.execPath, ["--import","tsx", <script>, ...args], {cwd})`
over fixtures written to `mkdtempSync(tmpdir())`; assert on `.status` (exit code) + `.stdout`; clean up.
- **Location:** `impl/tools/tests/<validator>.test.ts`.
- **Runner (new script):** `tools:test` = `node --import tsx --test tools/tests/*.test.ts` (mirrors `tags:test`).
- **Gate:** `npm run tools:test` joins the per-SWU global gate (with `validate` + `engine:test`).

## Target artifact inventory
DEFINE.md · DESIGN.md · WORK-PACK.md · implementation-layering.md.

## Proposed + applied typed deltas

### DEFINE.md
- **T6 · revise · S1** — the SURVIVED criterion gains clause **(e)**: an automated test asserts the
  validator's accept/reject over fixtures (not only a manual run).

### DESIGN.md
- **T5 · add · S1/S2** — new **§7 Validator testing convention** (the build-from-owned pattern above):
  location, idiom (spawn-CLI + tmpdir fixtures + exit/stdout asserts), the `tools:test` runner, the gate.

### WORK-PACK.md
- **T1 · revise · S1** — the per-SWU **contract** gains **(e)** an automated test of the validator behavior.
- **T2 · revise · S1** — the per-SWU **global gate** adds `npm run tools:test` RC 0 (every validator added
  carries a test).
- **T3 · revise · S2** — **MT0** status gains the one residue: `tools/tests/validate-content.test.ts` +
  the `tools:test` script are **owed** (immediate backfill — this refresh's execution target).
- **T4 · revise · S1** — **MT4** (content validator) write scope adds the completed validator test + folds
  `tools:test` into the validation aggregate.

### implementation-layering.md
- **T7 · revise · S1** — promotion evidence (all layers): each new/extended validator's automated test is
  green (`npm run tools:test`) before the layer promotes.

## Scope boundary (not applied here — surfaced, not silently expanded)
"each validator added" is scoped to **this package's** validator(s) (`validate-content`, extended MT0→MT4).
The **pre-existing** `impl/tools/validate-relationships.ts` and `validate-doc-links.ts` also lack tests —
retrofitting them is a **v2-wide testing-discipline** follow-up, tracked separately (not this package's SWUs).

## No-op assessment
Not a no-op: S1 adds an acceptance requirement absent from the 2026-07-01 plan and the 2026-07-02 refresh;
S2 identifies a concrete shipped gap (MT0 validator untested).

## Dispatch technique trace
`artifact_contract_bridge` (each delta binds a signal to a target section/gate) · `owner_boundary_check`
(invoke proposes/refreshes the plan; task-session owns writing the test + script; the validator stays a
public shape-checker, no δ-rules) · `concrete_path_evidence` (the owned test precedent + exact paths named)
· `residue_ledger` (MT0 test backfill + the v2-wide retrofit are the open items). No full dispatch JSON —
single-package refresh.

## Next route
**task-session (MT0 test backfill):** add `impl/tools/tests/validate-content.test.ts` (spawn-CLI over
temp Entity-ok/bad fixtures, assert exit 0 / exit 1 + stdout) + the `tools:test` npm script; gate green.
Then MT1 onward each ship their validator test per the refreshed contract.
