# Runtime Handoff Pack — SWU-IOLM-00C-UI-A2

## Identity

- Task/SWU: `SWU-IOLM-00C-UI-A2`
- Source task/work-pack: `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` / `WORK-PACK.md`
- Session/run id: `20260722T-a2-demo-snapshot`
- Session evidence path: `work-pack/session-evidence/SWU-IOLM-00C-UI-A2/`
- Runtime handoff: `local Task Session`
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`
- Evidence date: `2026-07-22`
- Builder mode: `standard --strict`; 13 files selected
- Selection authority: the operator selected the next dependency-ready coding unit, A2; the separate sidecar has synchronized A1 pass/A2 selection across the planning surfaces and is closing its owner receipt

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `A2-O01` selection and dependency | covered | current operator instruction; A1 receipt; synchronized task/Work-Pack/wave rows | `iolm-fixture-boundary/v1` passed and A2 alone is selected |
| `A2-O02` exact write scope | covered | task A2 table; Work-Pack A2 row; Dispatch A2 outputs | seven A2 implementation files plus this A2 lifecycle directory only |
| `A2-O03` versioned strict snapshot contract | covered | findings architecture/data boundary; task A2 acceptance | one default-deny Draft 2020-12 `DemoSnapshotV1` schema and matching guard |
| `A2-O04` deterministic immutable adapter | covered | findings recommended architecture; A1 binding guard/binding | adapt only the guarded A1 bundle, deep-freeze the result, and make serialization/digest stable |
| `A2-O05` exact default model | covered | graph, manifest, receipt; findings guarded core | exactly four nodes, three relations, stable IDs, endpoint namespaces, one provenance join per ID, candidate posture and authority effect none |
| `A2-O06` exact Player question slice | covered | task recomposition; findings observable default | exact two-node/one-relation induced slice for Player -> UnlockDoor with no replacement graph |
| `A2-O07` explicit feature namespaces | covered | findings architecture and future seam | every node and both relation endpoints name feature namespaces |
| `A2-O08` synthetic cross-feature conformance only | covered | findings architecture/acceptance; task A2 file boundary | one test-only, non-served synthetic snapshot may prove shape compatibility but is never compiler or 00C-B evidence |
| `A2-O09` typed negative controls | covered | findings red checks; Dispatch A2 gate | posture, authority effect, namespace, endpoint, provenance, count, slice and fence drift fail with typed codes |
| `A2-O10` runtime and validation | covered | task runtime floor and A2 acceptance | Node 22+ built-in tests and Python JSON Schema validation; no package installation |
| `A2-O11` authority and claim fence | covered | task result fence; findings authority limits | preserve all six `ineligible_for` values and emit only candidate generated-read-model/demo evidence |
| `A2-O12` receipt and non-goals | covered | task A2 output; wave sequence; Execution Pack stop rules | emit `iolm-demo-snapshot/v1`; no UI, browser, manual, accessibility, promotion or publication claim |

Strict coverage: `pass` (`12/12`).

## Selected Sources

- `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
  - Selectors: mapping/status, A2 table, data path/recomposition, question slice, fence
  - Obligations: `A2-O01`–`A2-O12`
  - SHA-256: `1fae29a378aaf9cc9baf7f500e449efe2c12867a05a4d9a82d4c5bfd9c604d7a`
- `WORK-PACK.md`
  - Selectors: A2 handoff row, execution rules, technique trace, next handoff
  - Obligations: `A2-O01`, `A2-O02`, `A2-O12`
  - SHA-256: `9fa51f7ec9df012e563e4ea5d1942f43b03c63ef15203a0851b07d70757febd0`
- `work-pack/waves/W0C-UI.md`
  - Selectors: receipt sequence, merge/repair policy, authority and stop
  - Obligations: `A2-O01`, `A2-O11`, `A2-O12`
  - SHA-256: `6eb0724f0925203ee5e4b77e4f2bee54e98d70896dd2d45c6ae4e2eeda07c30b`
- `cyberAlchemy-v2/development/research/2026-07-22-iolm-workable-example/findings.md`
  - Selectors: recommended architecture, data flow/default, exact boundary, acceptance/red checks, authority limits
  - Obligations: `A2-O03`–`A2-O12`
  - SHA-256: `8acf9ba6341f2d01734f00bcb2d6aef1927cdd6ec1b2ee067321fdb53581d2e0`
- `EXECUTION-PACK.md`
  - Selectors: W0C-UI schedule, stop conditions, recomposition
  - Obligations: `A2-O01`, `A2-O02`, `A2-O11`, `A2-O12`
  - SHA-256: `dec7e1078f8de65f447c01204c7e152da053f7050e84f3a1270dfbfc834b68c1`
- `IMPLEMENTATION-LAYERING.md`
  - Selectors: L0C-demo decision, active window, non-regression guardrails
  - Obligations: `A2-O03`, `A2-O07`, `A2-O11`, `A2-O12`
  - SHA-256: `68f1c82933f4e947dbe205b29530c5deb8bf8da25371e303dcd362143e7e5597`
- `DISPATCH.json`
  - Selectors: `s0c-ui-demo-snapshot`, `g0c-ui-demo-snapshot`, A2 outputs and predecessor handle
  - Obligations: `A2-O01`–`A2-O03`, `A2-O09`, `A2-O12`
  - SHA-256: `b0bf9603b95ed265357ae9b12db84a49f13bd4d1ace2499220cc15a8a22720bd`
- `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/execution-receipt.json`
  - Selectors: pass status, output handle, artifacts, acceptance, fence
  - Obligations: `A2-O01`, `A2-O04`, `A2-O11`
  - SHA-256: `a7730f7128b35def8a8a5929770caf1504b3f41a3d1b6adddd16ed68b7768c44`
- `cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json`
  - Selectors: pinned source/binding expectations and fence
  - Obligations: `A2-O04`, `A2-O05`, `A2-O11`
  - SHA-256: `4fd1ababdbc72fdf4ad099a9e597faafb4573a0fe8d292b1509178f6b2f311a7`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/binding-guard.mjs`
  - Selectors: `validatePinnedBundle`, `validateBundleStructure`, A1 handle and constants
  - Obligations: `A2-O04`, `A2-O05`, `A2-O09`
  - SHA-256: `2b547638abcb3aeb56811994fb692cc128020a60d4e1441fe86d41e09ebef8e7`
- pinned `graph.json`
  - Selectors: four nodes and three edges
  - Obligations: `A2-O05`–`A2-O07`
  - SHA-256: `66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65`
- pinned `source-manifest.json`
  - Selectors: inputs and seven provenance records
  - Obligations: `A2-O05`, `A2-O09`
  - SHA-256: `3d5db5ae885b93b4c490057597624c96ff53d3061d33af7ba289878d1eded831`
- pinned `build-receipt.json`
  - Selectors: source/language/artifact digests and generator
  - Obligations: `A2-O04`, `A2-O05`
  - SHA-256: `1a5be10941d8342451d71e80dacc3bdd9ecfbe39412b22ffde617cd04370e20d`

## Architecture Guidance

`DemoSnapshotV1Adapter -> DemoSnapshotV1Guard -> QuestionSliceSelector` is A2's
entire product boundary. The adapter consumes only an already-passed A1 guarded
bundle. The generated snapshot is the only layer that introduces
`artifact_role: generated-read-model`, `posture: candidate`, and
`authority_effect: none`; renderers remain outside A2.

## Constraints And Non-Goals

- The current operator instruction is the selection authority. The sidecar refresh synchronizes mirrors but is not a parent execution dependency.
- A2 does not edit A1 files, add renderer/UI assets, open a server, run a browser, create manual/run evidence, or update planning/Craft surfaces.
- The synthetic two-feature fixture is test-only, absent from served data, and cannot satisfy or challenge `CROSS_FEATURE_UNSUPPORTED`.
- No package installation, compiler run, authority transition, promotion or publication.

## Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/contracts/demo-snapshot.v1.schema.json`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/demo-snapshot-v1.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/assets/question-slice.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/demo-snapshot-v1.test.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/question-slice.test.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/fixtures/demo-snapshot-v1-cross-feature.synthetic.json`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/**`

## Validation Surface

- Draft 2020-12 meta-schema and generated-instance validation with Python `jsonschema`.
- `node --test cyberAlchemy-v2/development/iolm-workable-example/tests/demo-snapshot-v1.test.mjs cyberAlchemy-v2/development/iolm-workable-example/tests/question-slice.test.mjs`
- A1 Node/Python regression suites.
- deterministic serialization/digest replay, deep-freeze checks, exact file inventory, pinned source hashes and `git diff --check`.

## Gaps And Blockers

- `G-A2-SELECTION-MIRROR`: resolved; the operator selected A2 and the sidecar synchronized A1 pass/A2-only selection across planning surfaces. Its close receipt remains a Task Session closeout obligation, not an implementation gate.
- `B-IOLM-UI-MANUAL-RUNNERS`: deferred to A4/parent overall state; does not block A2.
- `B-IOLM-CROSS-FEATURE`: active for 00C-B only; the synthetic test remains explicitly ineligible.
- Runtime gate: pass — Node `22.12.0`, Python `3.12.3`, A1 handle pass, exact write scope and validation available.

## Authority Precedence

1. Current operator selection of the next dependency-ready coding unit.
2. Applied split task/Work-Pack/wave/Dispatch contract, with asynchronous status synchronization owned by Invoke Refresh.
3. Passed A1 execution receipt and exact A1 implementation boundary.
4. Accepted workable-example findings where compatible with the later split.
5. Three pinned fixture artifacts as read-only data truth.

## Fallback Exploration Rule

No fallback exploration is authorized. If an obligation cannot be met from this
pack, stop with the named gap; do not widen into A3/A4, compiler, authority,
public Arcanum, or package-installation surfaces. Any extra source must be named
and justified in the Task Session receipt.

## Output Paths

- Markdown: `work-pack/session-evidence/SWU-IOLM-00C-UI-A2/CONTEXT-PACK.md`
- JSON/index: `work-pack/session-evidence/SWU-IOLM-00C-UI-A2/context-pack.json`
