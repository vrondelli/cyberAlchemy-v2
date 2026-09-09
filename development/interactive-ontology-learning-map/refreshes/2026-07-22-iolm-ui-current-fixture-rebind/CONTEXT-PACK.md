# Context Pack — IOLM current-fixture rebind refresh

## Identity

- Target: `SWU-IOLM-00C-UI-A1` rebind planning route
- Mode: standard, strict
- Mutation mode: `apply-approved`
- Evidence date: `2026-07-22`
- Repository head: `6b691fe11d35403a92f52eb8a138e524ca67a265`
- Authority: private IOLM planning and Craft owner
- Coverage: `10/10`, no fallback exploration

## Obligations

| ID | Obligation | Status | Evidence |
|---|---|---|---|
| RB-01 | Bind explicit option-1 authorization. | covered | decision receipt and continuation route |
| RB-02 | Resolve the three paths A1 actually serves. | covered | source-binding contract and A4 block |
| RB-03 | Select a stable current fixture snapshot without mutating DomainSpec. | covered | two-read Key-and-Door hashes and current generated values |
| RB-04 | Preserve historical A1–A4 evidence. | covered | historical A1 receipt and replay receipt |
| RB-05 | Select only a fresh A1 rebind. | covered | Work-Pack, task, wave, Dispatch, Craft ledger |
| RB-06 | Gate A2 regeneration, A3 revalidation, and A4 replay sequentially. | covered | task, wave, Dispatch |
| RB-07 | Constrain A1 writes and require immediate pre-mutation drift check. | covered | task, Dispatch, source-binding |
| RB-08 | Preserve the six-value authority/publication fence. | covered | Work-Pack, task, receipts |
| RB-09 | Synchronize canonical planning and Craft projections. | covered | target inventory and Craft ledger |
| RB-10 | Validate dispatch, syntax, hashes, selection cardinality, and write boundary. | covered | declared validation loop |

## Selected context

1. `decision-receipt.json` — option 1, constraints, and apply-approved route (`RB-01`, `RB-04`, `RB-08`).
2. `post-decision-continuation-route.json` — exact owner handoff and fresh-hash gate (`RB-01`, `RB-05`, `RB-06`).
3. A4 replay `execution-receipt.json` — pre-bind drift gate and no-browser truth (`RB-02`, `RB-04`).
4. `contracts/source-binding.v1.json` — authoritative A1 allowlist and prior pins (`RB-02`, `RB-07`).
5. historical A1 `execution-receipt.json` — old handle and immutable lifecycle (`RB-04`).
6. Key-and-Door `graph.json` — current 4-node/3-edge semantic read model (`RB-03`).
7. Key-and-Door `source-manifest.json` — current provenance records (`RB-03`).
8. Key-and-Door `build-receipt.json` — current profile, source, generator, and artifact digests (`RB-03`).
9. `WORK-PACK.md` — selected-unit and blocker state (`RB-05`, `RB-06`, `RB-08`).
10. `TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` — exact contracts and write scopes (`RB-05`, `RB-06`, `RB-07`).
11. `W0C-UI.md` — one-at-a-time wave rule (`RB-05`, `RB-06`).
12. `DISPATCH.json` — receipt sequence and owner boundaries (`RB-06`, `RB-07`, `RB-10`).
13. `cross-task-gaps.md` — typed target-lifecycle gate (`RB-08`, `RB-09`).
14. `cyberAlchemy-v2/.craft/ledger.yml` — canonical project next moves (`RB-05`, `RB-09`).

## Fixture snapshot

The actual A1 allowlisted paths are under
`projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/`.
The `ui-profile-create-player/generated` outputs are nearby DomainSpec evidence but are not A1 inputs.

| Input | Refresh snapshot SHA-256 |
|---|---|
| `graph.json` | `1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae` |
| `source-manifest.json` | `ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e` |
| `build-receipt.json` | `14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe` |

The trio was stable across two consecutive reads. A1 must repeat this check
immediately before mutation; any change blocks rather than silently rebinding a
third generation.

## Target inventory

- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- `IMPLEMENTATION-LAYERING.md`
- `DISTILL-VALIDATION.md`
- `DISPATCH.json`
- `work-pack/shared/context.md`
- `work-pack/shared/cross-task-gaps.md`
- `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
- `work-pack/waves/W0C-UI.md`
- `cyberAlchemy-v2/.craft/ledger.yml`
- `cyberAlchemy-v2/.craft/index.json`
- `cyberAlchemy-v2/CRAFT.md`

## Exclusions and boundary

- No DomainSpec output, source, or generator mutation.
- No IOLM implementation or historical session-evidence mutation.
- No A2, A3, A4, 00C-B, or 00C-C execution.
- No authority, promotion, publication, or public Arcanum mutation.
- Inventory was used only as a non-authority lookup surface.

## Handoff

Apply the exact planning/Craft delta, validate it, then route one fresh A1
rebind through Context Builder, a compact Goal profile, and Task Session. Stop
after `iolm-fixture-boundary/v1`; selection of A2 requires another owner refresh.
