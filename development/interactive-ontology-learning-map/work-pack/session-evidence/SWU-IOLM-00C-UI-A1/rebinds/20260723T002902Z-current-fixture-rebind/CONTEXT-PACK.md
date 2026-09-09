# Runtime Handoff Pack — SWU-IOLM-00C-UI-A1 current-fixture rebind

## Identity

- Task/SWU: `SWU-IOLM-00C-UI-A1`
- Mode: `rebind`
- Dispatch step: `s0c-ui-fixture-boundary-rebind-20260722`
- Session/run id: `20260723T002902Z-current-fixture-rebind`
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`
- Evidence date: `2026-07-23`
- Builder mode: `standard --strict --handoff runtime`
- Strict coverage: `pass` (`12/12`)
- Fallback exploration: none

## Obligation Coverage

| ID | Status | Resolution |
| --- | --- | --- |
| `A1R-O01` | covered | The applied Refresh handle `iolm-ui-current-fixture-rebind-refresh-applied/v1` selects exactly one A1 rebind. |
| `A1R-O02` | covered | The existing `iolm-candidate-contract/v1` dependency remains passed and read-only. |
| `A1R-O03` | covered | The three literal Key-and-Door expected paths are the only DomainSpec inputs. |
| `A1R-O04` | covered | Immediately before implementation mutation, hash all three inputs twice and require the Refresh snapshot. |
| `A1R-O05` | covered | Bind current project, source-set, profile, generator and registry digests plus 4/3 counts and stable IDs. |
| `A1R-O06` | covered | Preserve realpath containment, literal allowlist and rejection of every symlinked path component. |
| `A1R-O07` | covered | Preserve validation before server construction and the loopback-only fixed GET/HEAD surface. |
| `A1R-O08` | covered | Mutation is limited to seven declared A1 files plus this new lifecycle directory; historical evidence is immutable. |
| `A1R-O09` | covered | DomainSpec, A2-A4, authority, Craft/planning and public Arcanum remain read-only. |
| `A1R-O10` | covered | Run schema, boundary, Node, Python, syntax, inventory, source-preservation and diff checks. |
| `A1R-O11` | covered | Preserve candidate posture, authority effect `none`, and the exact six-value `ineligible_for` fence. |
| `A1R-O12` | covered | Emit a fresh `iolm-fixture-boundary/v1` or a typed blocker, then stop without selecting A2. |

## Selected Evidence

- `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` (`d4a2a54b352cda8c21860a945641f9b34fad66cde2623f9885f2f9f0de929358`): current A1 selection, source snapshot, write scope, acceptance and stop.
- `WORK-PACK.md` (`c3783ab723662c855d12be05e20512adbf3892c1988c24c471612e5a8923df19`): selected lifecycle, blocker and next handoff.
- `work-pack/waves/W0C-UI.md` (`3ef0f4a822f6d7c70293e6ff4c1133f01ba58f70e0e22936e0dcbc431f10e493`): exact sequence, rebind policy and authority fence.
- `DISPATCH.json` (`a79fb2f528fcf74dd21e6eaf192f9bf5e8d98f6fdacf04dc1058bafdf8d4651f`): step `s0c-ui-fixture-boundary-rebind-20260722` and its stop conditions.
- `refreshes/2026-07-22-iolm-ui-current-fixture-rebind/REFRESH-REPORT.md` (`d8cb2cfc7f980cc90a5b3ff408c6d8d52098e529d197e67f385ca0272196daf2`) and `refresh-report.json` (`753546f6f19ec88d881cab24f2adb1043d069205f283efea082d9bd3240c0f5e`): applied selection handle and current snapshot.
- The seven A1 implementation files: reviewed to locate the four duplicated generation-pin surfaces and preserve the unchanged gateway/test contracts.
- The exact three read-only Key-and-Door expected artifacts: current graph, source manifest and build receipt truth.

Historical A1 `CONTEXT-PACK.md`, `context-pack.json`, `CODEX-GOAL-PROFILE.md`, `RESULT.md`, and `execution-receipt.json` were consulted only as output-shape references. They are stale data evidence, are not current-generation authority, and remain immutable.

## Current Fixture Contract

- Artifact hashes: graph `1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae`; source manifest `ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e`; build receipt `14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe`.
- Project: `key-and-door`.
- Source set: `33b2b650bcd5e4f4ab8c4f03c892bca8fcc660d167c9b6220a775e0b5bccdb1c`.
- Profile: `feature-with-independent-node-files@1`; digest `0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478`.
- Generator: `minted-project-tools/v1`.
- Kinds digest: `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede`.
- Relationships digest: `ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f`.
- Structure: 4 nodes and 3 edges; stable IDs and endpoint semantics remain unchanged.

## Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json`
- `cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.schema.json`
- `cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/gateway.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/binding-guard.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/binding-guard.test.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/**`

The implementation delta is expected in only the binding JSON, binding schema, Python guard/server constants and browser guard constants. The gateway and tests remain unchanged unless validation exposes a current-contract defect.

## Validation And Stop

- Draft 2020-12 meta-schema plus binding instance validation.
- `serve_demo.py --check`, with `listener_opened=false`.
- Node binding guard/gateway suite and Python path/server suite.
- Bytecode-free Python syntax validation.
- Exact A1 implementation inventory, source hash preservation, scoped diff hygiene and no runtime residue.
- Stop after a fresh `iolm-fixture-boundary/v1`; return to Invoke Refresh before any A2 selection.
