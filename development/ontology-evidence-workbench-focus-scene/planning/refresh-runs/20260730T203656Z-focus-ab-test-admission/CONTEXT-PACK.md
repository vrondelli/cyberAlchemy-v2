# Strict Context Pack — SWU-OEW-FOCUS-TEST-001 Admission

Status: pass  
Mode: standard, strict  
Authority effect: none

## Task

Refresh `WP-OEW-FOCUS-001` from the verified blocker notice
`HN-75D3CBED57D2`, add and select one bounded automated A/B test SWU, and
materialize its browser runner without changing the accepted focus
implementation or either ontology.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Preserve completed FOCUS-001 and FOCUS-002 evidence and consume the passing FOCUS-002 receipt. | `planning/WORK-PACK.md`; `planning/work-pack/session-evidence/SWU-OEW-FOCUS-002/receipt.json` | covered |
| O2 | Declare one selected SWU with exact material and execution-output partitions. | `planning/work-pack/swu-manifest.json`; `HN-75D3CBED57D2` | covered |
| O3 | Materialize only the new A/B runner; do not edit the accepted browser validator or focus source. | `scripts/validate-body-war-browser.mjs`; handoff boundaries | covered |
| O4 | Pin the immutable build, fixed viewport, structural counts, portal semantics, pointer/keyboard equivalence, Back restoration, request/error isolation, and cleanup. | accepted FOCUS-002 receipt, build handle, browser acceptance, current validator | covered |
| O5 | Emit three named screenshots and `result.json` in one absent create-only attempt directory. | approved A/B plan and handoff notice | covered |
| O6 | Keep novice comprehension evidence separate and pending until three real participants are recorded. | Work Pack claim ceiling and handoff notice | covered |
| O7 | Preserve package manifests, accepted run directories, product focus source, Body War ontology, and CyberAlchemy ontology. | Work Pack protected scopes and FOCUS-002 receipt | covered |
| O8 | Predeclare closeout synchronization over only the Work Pack and manifest. | Task Session closeout contract | covered |

## Selected sources

- `.arcanum/handoff-notices/notices/HN-75D3CBED57D2.json` — exact blocker,
  requested continuation, boundaries, and next actions.
- `planning/WORK-PACK.md` — current outcome, completed SWUs, and claim ceiling.
- `planning/work-pack/swu-manifest.json` — current selection and authorization
  state.
- `planning/work-pack/session-evidence/SWU-OEW-FOCUS-002/receipt.json` —
  passing dependency and accepted output identities.
- `generated/runs/SWU-OEWTP-002/20260730T193725Z/thin-prototype-build-handle.json`
  — immutable build and toolchain identity.
- `generated/runs/BODY-WAR-ONTOLOGY-BROWSER-001/20260730T194136Z/browser-acceptance.json`
  — accepted browser baseline.
- `scripts/validate-body-war-browser.mjs` — current single-witness behavior and
  safe gateway/browser patterns.

## Exact refresh targets

1. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/WORK-PACK.md`
2. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/swu-manifest.json`
3. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/validate-body-war-focus-ab.mjs`

The refresh is direct-user `apply-approved` for exactly those paths. The
subsequent Task Session is execution-output-only.

## Constraints and non-goals

- Do not edit `validate-body-war-browser.mjs`, accepted FOCUS-001/002 receipts,
  accepted generated run directories, package manifests, focus source/patch
  bindings, either ontology, or the user's existing live viewer.
- Do not claim human comprehension, accessibility conformance, ontology
  promotion, release, deployment, production readiness, score authority, or
  source-backed geometry.
- A passing automated result means the A/B evidence harness ran as declared.
  The human comparison remains `pending`.

## Validation surface

- Invoke material-package schema and handoff validation.
- Task Session mutation-readiness validation in `execution-output-only` mode.
- Node syntax check and one live isolated Chromium run.
- Exact JSON assertions for counts, node IDs, portals, semantics, interaction
  equivalence, isolation, and cleanup.
- PNG existence, dimensions, and hashes.
- Protected-path before/after digests and scoped `git diff --check`.

Strict obligation coverage: 8/8.

