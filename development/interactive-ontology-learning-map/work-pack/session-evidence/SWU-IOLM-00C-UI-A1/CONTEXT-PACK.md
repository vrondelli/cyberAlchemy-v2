# Runtime Handoff Pack — SWU-IOLM-00C-UI-A1

## Identity

- Task/SWU: `SWU-IOLM-00C-UI-A1`
- Source task/work-pack: `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` / `WORK-PACK.md`
- Session/run id: `20260722T-a1-fixture-boundary`
- Session evidence path: `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/`
- Runtime handoff: `runtime`
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`
- Evidence date: `2026-07-22`
- Builder mode: `standard --strict`; 12 files selected

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `A1-O01` selection and dependency | covered | task `#mapping-and-status`, Work-Pack A1 row, 00C-A receipts, apply receipt | A1 alone is selected; `iolm-candidate-contract/v1` and the split apply handle pass |
| `A1-O02` exact binding manifest | covered | findings `#pinned-input-contract`, three fixture artifacts | bind three canonical paths, nine pinned values, 4/3 counts, four node IDs and three edge IDs |
| `A1-O03` path trust boundary | covered | findings path guard, task binding acceptance, Dispatch A1 gate | explicit repo root, strict realpaths, containment, literal allowlist and no symlinked component before reading/serving |
| `A1-O04` structural and receipt joins | covered | findings guarded core, graph, source manifest, build receipt | exact IDs, endpoints, one provenance record per graph ID, input digest joins and receipt digests must agree |
| `A1-O05` loopback server | covered | task server acceptance, findings server contract, Dispatch A1 | bind only `127.0.0.1`; GET/HEAD only; fixed fixture/application routes; 404/405; no mutation or arbitrary repository exposure |
| `A1-O06` exact write scope | covered | task A1 table, shared runtime rule, Dispatch state namespace | seven implementation files plus this A1 lifecycle directory only |
| `A1-O07` runtime and dependencies | covered | task runtime floor, findings verdict | Python 3.11+, Node 22+, ES2022; no package installation |
| `A1-O08` boundary validation | covered | task acceptance, findings red controls | Python and Node suites cover positive binding plus hash, field, join, endpoint, path, symlink, pre-bind, route and method negatives |
| `A1-O09` authority and claim fence | covered | task result fence, shared consumer rule, Dispatch boundary | candidate fixture only; authority effect none; preserve all six `ineligible_for` values |
| `A1-O10` receipt and stop | covered | task output, wave stop, Work-Pack handoff, Dispatch A1 stop | emit `iolm-fixture-boundary/v1`, return exact evidence, do not select A2 automatically |

Strict coverage: `pass` (`10/10`).

## Selected Sources

- `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
  - Selectors: mapping/status, source contracts, A1 table, binding/server acceptance, recomposition and fence
  - Obligations: `A1-O01`–`A1-O10`
  - SHA-256: `d5cb2ca64ea3f6a0ebd7c8dab723e98f8d5c3c92c35b1f7c4c4a862172e4e1d2`
- `WORK-PACK.md`
  - Selectors: control fields, A1 handoff row, blockers, next handoff
  - Obligations: `A1-O01`, `A1-O06`, `A1-O10`
  - SHA-256: `05def60e3a9774233f83d9ea18f051a4fcae6c114c38ffec50a934c3a61118fc`
- `work-pack/waves/W0C-UI.md`
  - Selectors: selected unit, sequence, authority and stop
  - Obligations: `A1-O01`, `A1-O09`, `A1-O10`
  - SHA-256: `e765bcb1f928841a3f299ad74f5a982793f02d45129e1d1d11800b68afec8b5a`
- `work-pack/shared/context.md`
  - Selectors: DomainSpec consumer rule and A1 runtime handoff rule
  - Obligations: `A1-O06`, `A1-O09`
  - SHA-256: `3d4585313b2045b003d9524053bf5a62cafafc13fc4376fdc2e78bb77d9c3a99`
- `refreshes/2026-07-22-iolm-ui-swu-split/refresh-report.json`
  - Selectors: `applyReceipt`, result and next route
  - Obligations: `A1-O01`, `A1-O10`
  - SHA-256: `5230eea12067d401ff502c898d400956a0321496d7f2d018d2577ec36d2bccc6`
- `work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md`
  - Selectors: candidate-contract handle, acceptance and authority effect
  - Obligations: `A1-O01`, `A1-O09`
  - SHA-256: `89d3d19a9f7069699234b6f9e9575a503114a264461e05cfcecd2a5e13fe5a63`
- `work-pack/session-evidence/SWU-IOLM-00C-A/execution-receipt.json`
  - Selectors: result, candidate contract handle and subagent closeout
  - Obligations: `A1-O01`
  - SHA-256: `b815cbb217eb89e62571e07766008da1c0d9bf837510c92527ccb4f878d8be0a`
- `cyberAlchemy-v2/development/research/2026-07-22-iolm-workable-example/findings.md`
  - Selectors: recommended architecture, exact boundary, pinned contract, commands, server contract, acceptance/red checks, authority limits
  - Obligations: `A1-O02`–`A1-O10`
  - SHA-256: `8acf9ba6341f2d01734f00bcb2d6aef1927cdd6ec1b2ee067321fdb53581d2e0`
- `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json`
  - Selectors: root binding fields, nodes and edges
  - Obligations: `A1-O02`, `A1-O04`
  - SHA-256: `66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65`
- `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json`
  - Selectors: source-set digest, inputs and records
  - Obligations: `A1-O02`, `A1-O04`
  - SHA-256: `3d5db5ae885b93b4c490057597624c96ff53d3061d33af7ba289878d1eded831`
- `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json`
  - Selectors: status, language, source digest, artifact digests and generator
  - Obligations: `A1-O02`, `A1-O04`
  - SHA-256: `1a5be10941d8342451d71e80dacc3bdd9ecfbe39412b22ffde617cd04370e20d`
- `DISPATCH.json`
  - Selectors: `s0c-ui-fixture-boundary`, `g0c-ui-fixture-boundary`, `r0c-ui-fixture-boundary`, `fixture-workable-example`
  - Obligations: `A1-O03`, `A1-O05`, `A1-O06`, `A1-O09`, `A1-O10`
  - SHA-256: `1a2ef81cd14293fdfd31ae86fc2983d71edac8de3f462694e8c0b48f7b1cce40`

## Architecture Guidance

`PinnedMintedFixtureGateway -> MintedFixtureBindingGuard` is A1's entire product
boundary. It validates and exposes a guarded bundle; it does not build
`DemoSnapshotV1`, render UI, or aggregate browser/manual evidence.

## Constraints And Non-Goals

- The later split task and applied Dispatch override stale aggregate execution language in the older findings.
- A1 does not create snapshot, UI, generated-run, manual, Playwright, Craft, Work-Pack, Dispatch, DomainSpec, authority, or public Arcanum artifacts.
- Application routes are explicit and containment-checked; routes for future A2/A3 files may remain 404 until those files exist.
- No package installation, compiler run, candidate build receipt, authority claim, promotion or publication.

## Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json`
- `cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.schema.json`
- `cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/gateway.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/binding-guard.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/binding-guard.test.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A1/**`

## Validation Surface

- `python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py --repo-root "$PWD" --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json --check`
- `node --test cyberAlchemy-v2/development/iolm-workable-example/tests/binding-guard.test.mjs`
- `python3 -m unittest cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py`
- `python3 -c 'from pathlib import Path; [compile(p.read_text(), str(p), "exec") for p in map(Path, ["cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py", "cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py"])]'` (syntax validation without bytecode residue)
- scoped file inventory, source-fixture hash preservation and `git diff --check`

## Gaps And Blockers

- `G-A1-OLD-AGGREGATE`: resolved. The 2026-07-22 split assigns snapshot/UI/run-result work to A2–A4; A1 follows the later task and Dispatch.
- `B-IOLM-UI-MANUAL-RUNNERS`: deferred to A4/parent overall state; it does not block A1.
- `B-IOLM-CROSS-FEATURE`: active for 00C-B only and excluded from this execution.
- Runtime gate: pass — Python `3.12.3`, Node `22.12.0`, exact handles/hashes/paths and clear write locations.

## Authority Precedence

1. Applied split task, Work-Pack, wave and main Dispatch.
2. Applied Refresh receipt and passed 00C-A execution receipt.
3. Accepted workable-example findings where compatible with the later split.
4. Three pinned fixture artifacts as read-only data truth.

## Fallback Exploration Rule

No fallback exploration is authorized. If an implementation obligation cannot be
met from this pack, stop with the named gap and do not widen into A2–A4 or other
repository surfaces. Any extra source would have to be named and justified in the
Task Session receipt before use.

## Output Paths

- Markdown: `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/CONTEXT-PACK.md`
- JSON/index: `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/context-pack.json`
