# Context Pack: WP-OEWTP-001 Execution Preflight Repair

- Run: `20260729T155245Z-preflight-refresh`
- Goal: execute `WP-OEWTP-001` through four distinct Task Sessions and one
  read-only verification close
- Context mode: standard, strict for this refresh proposal
- Runtime handoff: none
- Authority: private planning evidence only
- Mutation mode: proposal-only

## Obligations

| ID | Obligation | Status | Evidence |
| --- | --- | --- | --- |
| O-01 | Bind one exact finite frontier | covered | `SWU-MANIFEST.json`; `EXECUTION-PACK.md` |
| O-02 | Prove SWU-001 is uniquely ready and narrow | covered | `TASK-OEWTP-01-TYPED-ADMISSION.md`; `chain-state.json` |
| O-03 | Preflight the current Task Session mutation gate | block | installed `task-session` Step 5A requires a staged material package, producer receipt, and mutation-admission receipt that the work pack does not declare |
| O-04 | Preflight the current Invoke closeout owner gate | block | closeout route and delta vocabulary do not exactly match installed Task Session Step 8; material and owner-receipt contracts are incomplete |
| O-05 | Preserve source/package boundaries | covered | no implementation or package mutation is admitted by this proposal |
| O-06 | Keep the browser and production claim ceilings explicit | covered | runtime remains unwitnessed; release, deployment, production, and ontology correctness remain out of scope |

## Selected Evidence

| Path | Selector | Why selected |
| --- | --- | --- |
| `planning/SWU-MANIFEST.json` | selected SWU, write scopes, done criteria | finite frontier and per-SWU contract |
| `planning/EXECUTION-PACK.md` | control, waves, ordering, failure policy | serial execution route |
| `planning/CLOSEOUT-SYNC-INVENTORY.json` | lifecycle route, common rules, SWU rows | closeout admission contract |
| `planning/WORK-PACK.md` | gates and SWU table | planning authority |
| `planning/work-pack/chain-state.json` | current selector and mutation flag | live chain state |
| `planning/work-pack/tasks/TASK-OEWTP-01-TYPED-ADMISSION.md` | write scope, validation, closeout | first Task Session boundary |
| `.agents/skills/task-session/SKILL.md` | Steps 4, 5A, and 8 | installed execution contract |
| `.agents/skills/task-session-until-blocker/SKILL.md` | preconditions and stop rules | whole-work-pack serial controller |
| `.agents/skills/invoke/refresh.md` | apply-approved material-package gate | installed lifecycle-owner contract |
| `.agents/skills/invoke/schemas/material-package*.json` | producer package and receipt shapes | exact staging contract |
| `.agents/skills/task-session/schemas/mutation-admission-*.json` | consumer request and receipt shapes | exact pre-write admission contract |

## Live Baselines

| Artifact | SHA-256 |
| --- | --- |
| `planning/CLOSEOUT-SYNC-INVENTORY.json` | `45df96399ee1c17d0a9925f7d78306b0f8c8b830eab7c56c6f9ef180f80eb201` |
| `planning/SWU-MANIFEST.json` | `66a9f49344e0856e51436b068284b311e5ce507c2e6cd8e6731231686cfc6cd9` |
| `planning/EXECUTION-PACK.md` | `b75a36d4a0198b56985037b3c1901249ffa643c25519727204c3e20a68397f75` |
| `planning/WORK-PACK.md` | `9b015734c24a11d76e9d900f7db5ae641d3a54e0edbd80579bd8a71e9ee2ddde` |
| `planning/work-pack/chain-state.json` | `13c7f6461b2f12c9b70419b003a2a7fc880c4b657b1987d52f859018b426e266` |

## Findings

1. The route string `invoke:refresh:apply-approved-closeout-only` is not the
   exact tuple admitted by Task Session. The restriction belongs in a
   closeout-only scope/authorization ceiling, while the route must be
   `invoke:refresh:apply-approved`.
2. `result_file_created`, `receipt_file_created`,
   `receipt_reference_added`, and `successor_selected` are not admitted delta
   classes. They normalize to `evidence_added` and `route_changed`.
3. No SWU declares the staging root, material package, validator receipt,
   producer receipt schema, mutation-admission request, or admission receipt
   required before canonical writes.
4. The expected Invoke owner receipt has a path but no required-field/outcome
   contract.
5. The implementation worktree already contains user-owned/uncommitted OEW
   changes, including a modified `package.json`. Future Task Sessions must bind
   those bytes as baselines and prove they do not change; they must not erase or
   adopt them.

## Strict Coverage Result

Coverage is complete for an Invoke Refresh proposal. It is deliberately
`BLOCK` for Task Session mutation until the proposed planning repair is
materialized, validated, applied by Invoke Refresh, and revalidated by Plan and
Distill owners.

