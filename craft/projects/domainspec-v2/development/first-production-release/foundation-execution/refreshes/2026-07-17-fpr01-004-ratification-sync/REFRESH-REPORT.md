---
mode: refresh
phaseStatus: pass
mutationMode: apply-approved
refreshed_at: 2026-07-17
---

# Invoke Refresh Report: FPR01-004 Ratification Synchronization

## Result

The approved refresh consumed the verified `SWU-FPR01-004` Task Session receipt and
its exact-digest ratification. It closes `SWU-FPR01-004`, the FPR-01 task, W1, and
`PLAN-B2-BASELINE`; synchronizes Craft, the canonical roadmap, and generated roadmap
views; and makes FPR-02 available for a separately selected Decision Gate.

No SWU is selected. FPR-02 has not started, later foundation nodes remain open, and
production remains unauthorized. Therefore the overall first-production-release
context correctly remains `plan / block` even though FPR-01 is closed.

## Source And Approval

- Approval: explicit user `apply approved` on 2026-07-17.
- Strict context coverage: 13/13 obligations, 0 blockers.
- Strict context human SHA-256:
  `911e7432aa4ddd7eb461942f22fcf8a4893f20f995d298778deab927539d2dd8`.
- Strict context machine SHA-256:
  `4555504d921974fdad3f16d0fea5da0a6962cb21e73142a0ba8eadde4c14d00d`.
- FPR01-004 PASS receipt SHA-256:
  `19b7c2c0baf10981b807297b61c8a2849b8c2505816d85735a66c49fb194fc9e`.
- FPR01-004 machine result SHA-256:
  `57deab75f4f529c103f258416eea53108cd2100418c5036b9b5254ae176ea5de`.
- Ratification JSON SHA-256:
  `beeb8c5bd8c289c73123411630ac01752e3530849a1910c475b70e0606257f8c`.
- Inventory lookup: partial non-authority read model; the current receipt was not
  indexed, so direct receipt evidence remained authoritative.

## Typed Refresh Signals

| Signal | Type | Applied meaning |
|---|---|---|
| `RS-FPR01004-001` | `evidence_added` | verified ratification and Task Session receipts added to continuation records |
| `RS-FPR01004-002` | `status_changed` | FPR-01, W1, task, and final SWU changed to completed/closed |
| `RS-FPR01004-003` | `blocker_resolved` | `PLAN-B2-BASELINE` resolved from receipt-bound evidence |
| `RS-FPR01004-004` | `route_changed` | next eligible route changed to unselected `SWU-FPR02-001` Decision Gate |

## Applied Changes

| Artifact | Post-apply SHA-256 | Applied delta |
|---|---|---|
| `WORK-PACK.md` | `8db055b02c9dbc52424b17b013fa3a28171a6f450e95a82f1401c969424b33e4` | FPR-01/W1 closed; no selected SWU; FPR-02 ready |
| `EXECUTION-PACK.md` | `d44f08994aa57ab21d0c99ed48dc2c818b6977e8b0070f237e95668efda5d56c` | current execution idle; W2 available but inactive |
| `IMPLEMENTATION-LAYERING.md` | `a1d3c787539acf100c8f89b23f1df8778280eac8f7be44effaedccccd34bd47e` | ratification recomposed; next L1 boundary unselected |
| `TASK-FPR-01-AUTHORITY-BASELINE.md` | `936ef89a807b2129d976cddfcf56c8ea8ad8e2bf670c61846792c0b38d205571` | task completed from verified receipt |
| `W1-AUTHORITY-BASELINE.md` | `afa8bf4128f754b04f8a66a48bd78037e76fd67f003b7ac549d73cb17266dc79` | wave completed; W2 not selected |
| `projects/domainspec-v2/.craft/ledger.yml` | `eedf80c34c6dfceb3124dfcaa6a82459927eec3a96ce8ff45f232161237e951e` | continuation, indexes, artifacts, links, and visibility child synchronized |
| `projects/domainspec-v2/CRAFT.md` | `9d196d407d75df5ca61c0c3adad81e666e9a728237052fd94d27bd325131f935` | human continuation view synchronized |
| canonical `ROADMAP.md` | `3fe34a0eb691772eb6f0c2b327b1d7dd0a9e1b01ff5ac7376fe21d2820ef9918` | FPR-01 closed; FPR-02 decision-ready |
| expected node-edge manifest | `53c01ee5068e0ed62d12392e22894b561f4621e697daf9b33a90c5d119bc1dfa` | `closed-ratified` / `ready-decision-gate` states |
| visibility `roadmap-copy.json` | `954f1a7a972226ae24301770124132101aaa03e4f12751b00fc6f2ed14ba5b5d` | labels for the two current status tokens |
| visibility focused test | `7d30ca8b2746ec1b77510bc10f8ad502245bfcb371521ef114393de3ec1f7e83` | exact 68-field coverage synchronized |
| visibility valid-copy fixture | `f36c87c92c1d96dfcd16b0284b7e14a0a28b9c20302ccc17930f299bdb99f078` | valid closed-ratified status target |
| visibility `roadmap-data.json` | `6cdecbcf1804844b7f968a3d1bd299efb8cb5d21464cd81600da378e64193279` | regenerated from synchronized authority inputs |
| visibility `roadmap.html` | `ccd41b27410ab131b1c3ab08153fb1411a29d001dfc6cb13acbadf6261dc1791` | regenerated self-contained view |

## Validation

- All 14 selected source preimage digests matched before mutation.
- Craft YAML consumption and exact `by_id`, `artifacts_by_path`, and artifact-array
  pointers: PASS.
- Cross-record state assertions: PASS; FPR-01 is `closed-ratified`, FPR-02 is
  `ready-decision-gate`, and root/release/visibility contexts remain
  `build/flag`, `plan/block`, and `validated/pass` respectively.
- Roadmap generation and deterministic `--check`: PASS.
- Visibility tests: 30 passed, 0 failed.
- Canonical authority validator: two exit-zero runs with byte-identical output;
  complete-output SHA-256
  `8d9f1a15f3b6bb9e29529e3db9bb198082250d1376ec1e678811488c959458a4`.
- Canonical normalized SHA-256:
  `91de9e042b564e1bf85582e8ac360e55e1cafde101f960cbabfb231444b9df7c`.
- Five-mutant suite: PASS, 5/5 killed; normalized SHA-256
  `530963d35564e1ebe0470ac5bd953c6acb12826ad55e0907fa7ef2b3d123e212`.
- Retired-orchestration audit: 225 allowed files, 0 violations.
- Full DomainSpec implementation validation: 101 passed, 0 failed; lint CLEAN.
- Production authorization assertion: false.

## Dispatch And Authority Boundary

The refresh used `execution_receipt_handoff`, `state_namespace_boundary`,
`owner_boundary_check`, `artifact_contract_bridge`, `validation_loop`,
`concrete_path_evidence`, `residue_ledger`, `authority_split_gate`, and
`observability_grouping`. A full dispatch was unnecessary because one local Invoke
capability owned the finite synchronization.

This refresh does not change the ratified baseline bytes, execute FPR-02, select a
successor, close later foundation nodes, accept an implementation, or authorize
production.

## Next Route

After explicit selection of `SWU-FPR02-001`, run its Decision Gate to freeze the
admitted/excluded supported profile, exact claims, source roots and languages,
obligation kinds, callback/origin/redaction rules, and owners. Only an accepted gate
may hand off to the FPR-02 implementation Task Sessions.
