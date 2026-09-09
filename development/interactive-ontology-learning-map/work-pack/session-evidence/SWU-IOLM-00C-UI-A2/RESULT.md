# Task Session Result — SWU-IOLM-00C-UI-A2

## Task Session Result

- Task: `SWU-IOLM-00C-UI-A2` — immutable snapshot model
- Result: `PASS`
- Dependency: passed `iolm-fixture-boundary/v1` bound and revalidated
- Context pack: 13 selector-level sources, 12/12 obligations covered, all recorded hashes matched
- Handoff pack: [CONTEXT-PACK.md](./CONTEXT-PACK.md) and [context-pack.json](./context-pack.json)
- Strict coverage: `pass`
- Runtime: local (`Node 22.12.0`, `Python 3.12.3`)
- Output: `iolm-demo-snapshot/v1`
- Snapshot digest: `7133834b0bd445a279695b657b15234dccbdbd7e0b3f15095d6f92919b5f57ec`
- Files updated: the exact seven A2 implementation files plus this lifecycle evidence directory
- Validation: Draft 2020-12 schema and both instances `PASS`; A2 Node `23/23`; A1 Node `16/16`; A1 Python `8/8`; pre-bind boundary check and diff hygiene `PASS`
- Continuation: the operator authorized `invoke:refresh:apply-approved` as a sidecar so planning synchronization does not interrupt A3 development
- Subagent closeout: A1→A2 planning helper spawned 1, joined 1, closed 1, open 0, result `PASS`; owner receipt `refreshes/2026-07-22-iolm-ui-a1-a2-continuation/refresh-report.json`, handle `iolm-ui-a1-a2-refresh-applied/v1`

## Output handle

- Handle: `iolm-demo-snapshot/v1`
- Claim: the passed A1 guarded fixture bundle deterministically produces one strict, deeply immutable `DemoSnapshotV1`
- Default slice: 4 nodes / 3 relations
- Player question slice: 2 nodes / 1 relation
- Posture: `candidate`
- Authority effect: `none`

```json
{
  "ineligible_for": [
    "SWU-IOLM-00C-B",
    "SWU-IOLM-00C-C",
    "G-DSV2-SG",
    "CROSS_FEATURE_UNSUPPORTED",
    "promotion",
    "publication"
  ]
}
```

## Implemented boundary

- `DemoSnapshotV1` is strict and default-deny, preserves every stable ID, endpoint and provenance join, and carries the unchanged candidate/authority fence.
- The A1 adapter validates the passed boundary, constructs the exact 4/3 snapshot, deeply freezes it and emits deterministic JSON bytes.
- The default selector preserves the full stable-ID set. The exact Player question returns only `key-and-door.Player`, `key-and-door.UnlockDoor`, and `key-and-door.edge.player-performs-unlock-door`.
- The synthetic two-feature fixture is test-only and proves namespace handling without broadening the live single-feature claim.
- Typed negative states reject A1-handle, posture, authority, namespace, endpoint, provenance, count, default-slice and eligibility-fence drift without fallback.

## Validation evidence

| Check | Result |
| --- | --- |
| Draft 2020-12 meta-schema; generated and synthetic instances | `PASS` |
| A2 snapshot and question-slice Node suite | `PASS`, 23 tests |
| A1 binding guard regression suite | `PASS`, 16 tests |
| A1 Python boundary/server regression suite | `PASS`, 8 tests |
| `serve_demo.py --check` | `PASS`; 10 allowlisted routes, `listener_opened=false` |
| Exact A2 implementation inventory | `PASS`, 7/7 files |
| Deterministic checked-in snapshot digest | `PASS`, `7133834b...f57ec` |
| Scoped `git diff --check` and runtime residue | `PASS` |

## Residue and route

- A3 and A4 remain outside this implementation receipt. No rendered-browser, Playwright, accessibility, usability or manual-success claim is made.
- `B-IOLM-UI-MANUAL-RUNNERS` remains deferred to A4/parent overall state.
- `B-IOLM-CROSS-FEATURE` remains scoped to 00C-B and unaffected.
- The A2→A3 planning/Craft synchronization belongs to a bounded Invoke Refresh sidecar. A3 may start only after that owner selects A3 and returns its receipt.
