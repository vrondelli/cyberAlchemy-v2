# Task Session Context Pack — SWU-OEW-FOCUS-TEST-001

Status: runnable  
Mode: standard, strict  
Write profile: execution-output-only  
Authority effect: none

## Contract

Execute exactly the selected `SWU-OEW-FOCUS-TEST-001`. The material runner
already exists as a passing Invoke Refresh output. Task Session may create only
the four fixed browser artifacts and the nine fixed session-evidence files.

## Controlling artifacts

- `planning/WORK-PACK.md` — task contract and acceptance.
- `planning/work-pack/swu-manifest.json` — sole selected SWU, exact output
  inventory, validation, protected scopes, and closeout inventory.
- this context pack — strict execution contract.
- `scripts/validate-body-war-focus-ab.mjs` — validated runner.
- `planning/work-pack/session-evidence/SWU-OEW-FOCUS-002/receipt.json` —
  passing dependency.

## Dependencies

- `SWU-OEW-FOCUS-002`: pass, receipt SHA-256
  `76c1770d966630d360dd435d55cde851ebd518f8d4d4775215b06051f31cb5e1`.
- accepted build handle SHA-256
  `2f3fbf7b8ecc2fd2b242d049df2c18464da847a28200a7db90d035660ebbae9b`.
- accepted prior browser receipt SHA-256
  `0b5a5267ed0b20d311a38da767b8544e101cbdfe178abd08ca876845ababb87a`.

## Material writes

None.

## Execution outputs

1. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/baseline.png`
2. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/focus-scene.png`
3. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/portal-pivot.png`
4. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/result.json`
5. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/CONTEXT-PACK.md`
6. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/CONTEXT-PACK.json`
7. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/closeout-preflight.json`
8. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/mutation-admission-request.json`
9. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/mutation-admission-receipt.json`
10. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/NOVICE-TEST.md`
11. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/validation.json`
12. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/receipt.json`
13. `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/TASK-SESSION-RESULT.md`

The allowed-write set equals this execution-output set. It may not expand.

## Acceptance-critical validation

- `node --check scripts/validate-body-war-focus-ab.mjs`.
- Run the runner once with the accepted build handle and fixed output path.
- Require baseline `237/231`, focus `4/0/6`, exact four node IDs and six portal
  tuples, no `SuggestedTrack`, literal `related/owns/forward/none` with evidence
  refs, pointer/Enter/Space equivalence, Back restoration, one loopback origin,
  zero outbound/failed/error counts, and complete teardown.
- Require three valid PNG files with recorded hashes.
- Require the result to keep `human_test.status=pending`.
- Require protected file and tree digests to equal the preflight.
- Require scoped diff whitespace validation.

## Closeout

On automated pass, Invoke Refresh may update only `planning/WORK-PACK.md` and
`planning/work-pack/swu-manifest.json` with `evidence_added`,
`status_changed`, and `route_changed`. It must mark this SWU completed, select
no successor, retain the human test as pending, and return a separate owner
receipt.

Strict obligation coverage: 100%.  
Unresolved execution blockers: none.

