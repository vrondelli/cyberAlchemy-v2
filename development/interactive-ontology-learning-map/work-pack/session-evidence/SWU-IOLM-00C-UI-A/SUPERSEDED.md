# SWU-IOLM-00C-UI-A — Superseded Before Execution

- Status: `superseded-before-execution`
- Applied: `2026-07-22`
- Replacement: `SWU-IOLM-00C-UI-A1` -> `A2` -> `A3` -> `A4`
- Execution receipt: none

The original UI-A contract never executed and never passed. It is not a parent,
dependency, or reusable capability receipt. The parent remains
`TASK-IOLM-00C-UI`; the four replacement SWUs recompose its unchanged runnable
fixture-demo outcome through typed handles.

The historical preparation artifacts remain immutable for provenance but are
not runnable after the split:

| Artifact | Frozen SHA-256 |
|---|---|
| `CONTEXT-PACK.md` | `7602815f9dc96a9660fd00e8d709f40a8386aa0e825c4ae2c956c8f3358165ff` |
| `context-pack.json` | `d405cf16fb90779ace275c02d5c5822a55a87120fe17428ff754ce1533502054` |
| `CODEX-GOAL-PROFILE.md` | `4a3979dd7a2e05e8c60ba1cb44e5a8566f4eb8b7116bced6fac511395f1dee25` |

The only valid next route is Context Builder and a compact Goal profile for
`SWU-IOLM-00C-UI-A1`, followed by one Task Session that stops at
`iolm-fixture-boundary/v1`.
