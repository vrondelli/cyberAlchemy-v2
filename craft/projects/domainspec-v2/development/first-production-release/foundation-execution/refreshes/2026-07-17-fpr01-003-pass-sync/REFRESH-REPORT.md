---
mode: refresh
phaseStatus: pass
mutationMode: apply-approved
refreshed_at: 2026-07-17
---

# Invoke Refresh Report: FPR01-003 PASS Synchronization

## Result

The approved refresh consumed the superseding `SWU-FPR01-003` PASS receipt,
completed W1R and its remediation task, resolved all three receipt-backed blockers,
and selected but did not execute `SWU-FPR01-004`.

FPR-01 remains open and unratified. FPR-02, later waves, and production remain
unauthorized. The canonical `ROADMAP.md` and every authority/implementation artifact
remain unchanged; only the two disposable visibility views were regenerated from
Craft.

## Source And Approval

- Approval: explicit user `apply approved` on 2026-07-17.
- Proposal:
  `refreshes/2026-07-17-fpr01-003-pass-sync-proposal/REFRESH-PATCH-PROPOSAL.md`.
- Proposal human report SHA-256:
  `6045e84b6fe7fd5d594cf401005f3ec15a3cd3cc93d9987f6d08f9e21af4d5a9`.
- Proposal machine report SHA-256:
  `78e74bc910675272013d687fd779026ee5b855f7447b65cb966b74850b5ef102`.
- Strict context human SHA-256:
  `025a5cccffe99447cc7e4da39e56e745c8336b3b2da40b6d3ed915a3794a9b30`.
- Strict context machine SHA-256:
  `2d4920aec3264b408f4c2a63c7df6937f475a085f961810c8c9605e9bd6d14b6`.
- FPR01-003 PASS receipt SHA-256:
  `ad4064f890fb3445de642b8a2096a0de6961f89b011cf45e3d43caeed17d68a3`.
- Replay machine result SHA-256:
  `d83bda420e426a0fda4b9381852e72f9154529a8253dfc387d4019e3e1f5fa8f`.

## Applied Changes

| Artifact | Post-apply SHA-256 | Applied delta |
|---|---|---|
| `WORK-PACK.md` | `10b0da8736e663d5517c1491cf42c7f63f79d3b42a1f17e696918b4fc7fe60f6` | W1R complete; FPR01-004 selected |
| `EXECUTION-PACK.md` | `f140e55fa48b7e431622ff15186233b31dc70788d92ba38b333e0cae2146cec6` | W1 ratification active |
| `IMPLEMENTATION-LAYERING.md` | `cd73d89390c71d7570ce1cf1d423c14296246000cb8ce27963efe5c6dcd75469` | W1R recomposed; next L1 unit selected |
| `TASK-FPR-01-AUTHORITY-BASELINE.md` | `ddc42d625b3eaf3dbd37fef431a43097688cad85dcae641607e79becd3942d1b` | current route is FPR01-004 |
| `TASK-FPR01-003-REMEDIATION.md` | `035bb71236a4515518573719bc5a137074d430fb188fe655b7b298f983b2302d` | completed with bound receipts |
| `W1-AUTHORITY-BASELINE.md` | `1de7a9625aeeafdccbfda4ea4f730539ed4503038c3ee470e42449c3a68ff40f` | ratification-ready |
| `W1R-FPR01-003-REMEDIATION.md` | `53c8f25a20cc874abae9e4dc4fc6e56244fe6e9cd5193a4911d46d35bf8312cc` | completed |
| `projects/domainspec-v2/.craft/ledger.yml` | `831d1f6da3829e2094538be0a489f474689e02e63820fd3e19a87a4f59babbdd` | blockers resolved; next move and artifacts synchronized |
| visibility `roadmap-data.json` | `1b4598a442c54dbe108b8d20025ad46e7482e365278fc51f1af906ce8b88ce8d` | regenerated from Craft |
| visibility `roadmap.html` | `f5330311b94036b06ade78621e555e43f883709100ae4514bb45bf303c5d70b7` | regenerated from Craft |

Canonical `ROADMAP.md` stayed byte-identical at
`bf7b90c242e62029887d68f961d0a6b41074beb7e78560332bdbb07bf4d7248b`.

## Validation

- All 11 proposal preimage digests matched before mutation.
- Roadmap builder generation: PASS.
- Roadmap deterministic `--check`: PASS.
- Visibility tests: 30 passed, 0 failed.
- Craft YAML/build consumption: PASS.
- Canonical authority validator: two exit-zero runs with complete output equality.
- Canonical normalized SHA-256:
  `91de9e042b564e1bf85582e8ac360e55e1cafde101f960cbabfb231444b9df7c`.
- Five-mutant suite: PASS, 5/5 killed.
- Mutant normalized SHA-256:
  `530963d35564e1ebe0470ac5bd953c6acb12826ad55e0907fa7ef2b3d123e212`.
- Full DomainSpec implementation validation: 101 passed, 0 failed; lint CLEAN.
- Post-refresh retired-reference audit: 225 allowed files, 0 violations.

## Dispatch And Authority Boundary

The proposal’s `execution_receipt_handoff`, `concrete_path_evidence`,
`state_namespace_boundary`, `owner_boundary_check`, `authority_split_gate`,
`approval_semantics_map`, `artifact_contract_bridge`, `validation_loop`, and
`residue_ledger` techniques remain satisfied.

This refresh synchronizes continuation state only. It does not create the FPR01-004
receipt, ratify FPR-01, select FPR-02, change the baseline authority flags, execute a
Task Session, or authorize production.

## Next Route

Task Session for the single selected unit `SWU-FPR01-004`. Its PASS receipt must
return to a separate Invoke refresh before FPR-01 completion or any FPR-02 selection.
