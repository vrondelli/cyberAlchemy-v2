---
task: SWU-APE-ONT-001
mode: standard
status: block
createdAt: 2026-08-04T17:54:54Z
sessionId: 20260804T175454Z-invoke-refresh-required
semanticAuthority: none
---

# Context Pack — SWU-APE-ONT-001 Preflight

## Context Pack Summary

- Task: `SWU-APE-ONT-001` — add one reciprocal canonical-bound candidate Enum implementation realization.
- Resolution: `resume-nearest` from visible session context; one candidate.
- Mode: standard, strict, runtime-handoff shape.
- Files selected: 14.
- Snippets selected: 16 selector-level sections.
- Obligation coverage: 8 covered, 4 blocked; 66.7% executable coverage.
- Noise ratio: low; only current APE, Enum, ontology, validation, and admission evidence.
- Output index: `context-pack.json`.
- Strict coverage: `block`.
- Implementation mutation: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| `APE-CTX-001` | Resolve one nearest incomplete SWU. | `WORK-PACK.md#Selection rule`; manifest root. | covered — `SWU-APE-ONT-001` is unique. |
| `APE-CTX-002` | Require satisfied dependencies. | SWU manifest row. | covered — dependency set is empty. |
| `APE-CTX-003` | Bind the current canonical Enum meaning. | DS-D1.3 registry row; Enum criterion schema/card. | covered — fixed finite named values, no identity, typed fields, or transitions. |
| `APE-CTX-004` | Confirm the current realization gap. | projection DS-D1.3 row; ontology realization classes. | covered — Enum is `unsupported` and has no architecture type. |
| `APE-CTX-005` | Bind exact write-target baselines and dirty overlap. | Git status plus direct SHA-256. | covered — both targets are clean and present with recorded digests; adjacent canvas files are excluded. |
| `APE-CTX-006` | Preserve exact behavior, write scope, done criteria, and validation. | L0 task and SWU manifest. | covered — two material targets and one validator command are explicit. |
| `APE-CTX-007` | Consume a current Invoke Refresh result before mutation. | `WORK-PACK.md#Selection rule`; `IMPLEMENTATION-PLAN.md#Preconditions`. | **block** — no current APE Refresh receipt exists. |
| `APE-CTX-008` | Consume a closed Plan Semantic Manifest and selection receipt. | Task Session plan-once admission contract; APE package inventory. | **block** — neither artifact exists. |
| `APE-CTX-009` | Consume an Invoke-owned material package and producer receipt. | Task Session material-bound admission contract; APE package inventory. | **block** — neither artifact exists. |
| `APE-CTX-010` | Select the exact SWU after strict context succeeds. | `WORK-PACK.md#Selection rule`. | **block** — this strict context is blocked, so post-context selection cannot be issued. |
| `APE-CTX-011` | Preflight closeout inventory and successor policy. | closeout contract plus SWU manifest row. | covered structurally — targets, owner, validation, expected receipt, deltas, and unique successor are named; final frozen preflight awaits Refresh. |
| `APE-CTX-012` | Establish a passing read-only baseline. | Dispatch, Design selection, and ontology validators. | covered — all three pass on current bytes. |

## Selected Sources

- `WORK-PACK.md` — Control fields, Selection rule, Open blockers — `APE-CTX-001`, `007`, `010`, `011`.
- `work-pack/tasks/TASK-APE-L0-ENUM-ONTOLOGY.md` — SWU-001, Failure modes, Closeout — `APE-CTX-002`, `006`, `011`.
- `work-pack/shared/SWU-MANIFEST.json` — root and SWU-001 row — `APE-CTX-001`, `002`, `005`, `006`, `011`.
- `work-pack/shared/CLOSEOUT-CONTRACT.md` — required receipt fields and successor policy — `APE-CTX-011`.
- `SPEC.md` — Authority and ownership, Existing realization cycle, First cycle Enum — `APE-CTX-003`, `004`, `006`.
- `architecture-bundle.md` — low-level components, workflow, dependency boundary — `APE-CTX-004`, `006`.
- `IMPLEMENTATION-PLAN.md` — Preconditions and Coverage projection — `APE-CTX-003`, `004`, `007`.
- `INVOKE-RESULT.md` — produced/not-produced/next-route boundary — `APE-CTX-007..010`.
- `DESIGN-SELECTION-RESULT.json` — fixed-point Design result — `APE-CTX-012`.
- `definitions/meta-types/meta-types.yml` — DS-D1.3 row — `APE-CTX-003`.
- `impl/spec/meta-types/structural/enum.schema.yml` — formal machine criterion — `APE-CTX-003`.
- `ontology-experiment/ontology.json` — current realization vocabulary — `APE-CTX-004`, `005`.
- `ontology-experiment/domain-meta-types.projection.json` — DS-D1.3 unsupported row — `APE-CTX-004`, `005`.
- `ontology-experiment/validate-ontology.mjs` — acceptance-critical validation surface — `APE-CTX-006`, `012`.

## Architecture Guidance

Add only `architecture.EnumImplementation` plus the reciprocal current DS-D1.3 projection binding. Keep `authority_effect: none`; do not add properties/operators, profile policy, task state, or BTE behavior in this SWU. DS-D1.10 and UI candidates remain excluded.

## Constraints And Non-Goals

- Canonical Enum meaning remains owned by definitions-governance.
- The ontology realization is candidate evidence, not canonical admission.
- `SWU-APE-ONT-001` may not absorb the operators or fixtures owned by `SWU-APE-ONT-002`.
- Adjacent unified-canvas modifications and BTE changes belong to other work and are excluded.
- No source mutation is allowed until Invoke supplies the exact plan-once admission chain.

## Write Scope

Blocked execution permits session evidence only under this run directory. Intended future material scope remains:

- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json`

Baselines:

- `ontology.json`: present, `4b67ba1d631b11a09ab073a1e8003ccc0367a3c49e625693c54b2a7ddf3bbcd3`
- `domain-meta-types.projection.json`: present, `6fefba0c005f91010063f16a114e77cbe837546b75862783525c8fe9ea1df5e8`

## Validation Surface

- `python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py .../architecture-pattern-enforcement.dispatch.json`
- `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`
- fixed-point check for `DESIGN-SELECTION-RESULT.json`
- exact target status/digest comparison
- required admission-artifact existence checks
- session-evidence JSON Schema, Markdown link, and scoped whitespace checks

## Gaps And Blockers

- `GATE-APE-REFRESH`: current Invoke Refresh receipt absent.
- `GATE-APE-PLAN-SEMANTICS`: Plan Semantic Manifest and selected-unit receipt absent.
- `GATE-APE-MATERIAL`: Invoke material package and producer receipt absent.
- `GATE-APE-SELECTION`: strict coverage blocks post-context selection.

## Authority Precedence

1. Current DS-D1.3 registry and Enum criterion.
2. Validated APE Design and Work Pack.
3. SWU-001 and shared closeout contracts.
4. Current ontology/projection baselines.
5. Task Session execution and admission contracts.
6. This non-authoritative session evidence.

## Fallback Exploration Rule

Further exploration is allowed only inside an Invoke Refresh for the four named gates. It may not edit ontology targets until its exact material and producer receipts pass Task Session admission.

## Next Action

Run `invoke:refresh` in `proposal-only` mode for this exact Work Pack and `SWU-APE-ONT-001`. The proposal must close the Plan Semantic Manifest, selected-unit contract, material package/producer receipt, target inventory, baselines, validation digest, and closeout preflight. Then obtain exact apply authorization and rerun Task Session.
