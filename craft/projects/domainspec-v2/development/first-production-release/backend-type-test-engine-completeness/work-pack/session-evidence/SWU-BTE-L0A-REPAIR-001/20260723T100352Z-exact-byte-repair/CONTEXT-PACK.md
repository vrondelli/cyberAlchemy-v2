# Runtime Handoff Pack — SWU-BTE-L0A-REPAIR-001

## Identity

- Task/SWU: `SWU-BTE-L0A-REPAIR-001`
- Parent task:
  `TASK-BTE-L0-PROOF-PRIMITIVES`
- Source work-pack:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md`
- Session/run id: `20260723T100352Z-exact-byte-repair`
- Session evidence path:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/session-evidence/SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/`
- Runtime handoff: `runtime`
- Repository revision at selection:
  `8e349484dd9f18ae1464dd91d06801aa831b4ea6`
- Evidence date: `2026-07-23`
- Builder mode: `standard --max-files 24 --strict --emit both --handoff runtime`

This is session evidence, not canonical planning authority.

## Obligation Coverage

| ID | Obligation | Status | Selected evidence |
| --- | --- | --- | --- |
| `R1` | Bind the unique selected candidate and approval without widening its scope. | covered | Work Pack candidate manifest; Goal approval record |
| `R2` | Prove all nine mismatches have the recorded current-plus-one-LF relation. | covered | refresh `context-pack.json#byte_handles` |
| `R3` | Preserve the already-matching ninth schema and every historical receipt/manifest. | covered | publication receipt; output manifest; task forbidden writes |
| `R4` | Limit implementation writes to exactly eight schemas and `diagnostics.ts`. | covered | task allowed writes; Dispatch mutation target |
| `R5` | Bind every postimage to the immutable receipt SHA-256. | covered | publication receipt contracts and diagnostics registry |
| `R6` | Run every acceptance-critical verifier and preservation check. | covered | task acceptance evidence; Work Pack validation |
| `R7` | Emit one append-only Task Session receipt with no admission or production claim. | covered | Work Pack expected result and goal boundary |
| `R8` | Route a passing result to receipt-bound Invoke Refresh; do not begin L0B. | covered | task handoff; goal iteration rule |

Strict coverage: `8/8 pass`.

## Selected Sources

- `.../WORK-PACK.md`
  - Selectors: Candidate SWU Manifest; Admission And Freeze Ledger; Handoff Gate
  - Obligations: `R1`, `R3`, `R4`, `R6`, `R7`, `R8`
  - Evidence: one candidate is dependency-ready; L0B remains independently
    gated.
- `.../work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md`
  - Selectors: `SWU-BTE-L0A-REPAIR-001`
  - Obligations: `R1`–`R8`
  - Evidence: exact nine-path repair, done criteria, stop rules, and Invoke
    handoff.
- `.../EXECUTION-DISPATCH.json`
  - Selectors: candidate state; explicit-selection gate; repair mutation target
  - Obligations: `R1`, `R4`, `R8`
  - Evidence: Dispatch validates one local Task Session candidate.
- `.../goals/bte-l0a-repair-through-l8-one-shot/APPROVAL-RECORD.json`
  - Selectors: conditional sequential selection
  - Obligations: `R1`, `R7`, `R8`
  - Evidence: campaign approval selects only a sole exact candidate and grants
    no owner, admission, publication, or production authority.
- `.../refreshes/2026-07-23-l0a-evidence-reconciliation/context-pack.json`
  - Selectors: `byte_handles`, `byte_drift`, preserved receipts
  - Obligations: `R2`, `R3`, `R4`, `R5`
  - Evidence: eight contract schemas and `diagnostics.ts` differ by exactly one
    additional LF; the ninth schema matches.
- `.../SWU-BTE-L0A-001/20260723T020759Z-contract-publication/execution-receipt.json`
  - Selectors: emitted handles; selection; validation; non-admission
  - Obligations: `R3`, `R5`, `R7`
- `.../runs/20260723T020759Z/l0a/contract-publication-receipt.json`
  - Selectors: nine contract handles; diagnostic registry handle; admission
  - Obligations: `R3`, `R5`, `R7`
- `.../runs/20260723T020759Z/l0a/output-write-manifest.json`
  - Selectors: immutable receipt digest and allowed output paths
  - Obligations: `R3`, `R6`
- Nine implementation targets under
  `projects/domainspec-v2/impl/test-derivation-engine/src/bte/`
  - Selectors: complete file bytes
  - Obligations: `R2`, `R4`, `R5`
- `.../contracts/contract-publication-receipt.v1.schema.json`
  - Selectors: complete file bytes
  - Obligations: `R3`
  - Evidence: already matches and is forbidden to change.
- `.../contract-publication.ts`, `.../contract-publication.test.ts`, and
  `projects/domainspec-v2/impl/package.json`
  - Selectors: verifier implementation, focused test, package scripts
  - Obligations: `R6`
  - Evidence: read-only validation surface.

Selected file count: `21`; every selected source closes at least one obligation.

## Exact Byte Matrix

All paths below are relative to
`projects/domainspec-v2/impl/test-derivation-engine/src/bte/`.

| Target | Current SHA-256 | Required SHA-256 | Relation |
| --- | --- | --- | --- |
| `contracts/artifact-handle.v1.schema.json` | `0896da1d236c22e82c18658fd4bc4b3bea28d1bd85efe87d515183ebac46a328` | `e1014a95836210d3785ba68578755cc7c8c73b3057833ea171da3ae0302ca5ff` | current + one LF |
| `contracts/logical-identity.v1.schema.json` | `8840ac17bf8eda9e0332b8c6a693b0f9addb0e6b33cf63eaea26ccf147f10ceb` | `07eb1b68c15d36282972722d6ea29ac8e9b41592b73c4d3fc4177dede2139d7e` | current + one LF |
| `contracts/authority-class.v1.schema.json` | `59a1a9e233d0ebe79db97854117a90d16426ae2cb1ac9300080cb2c821188a20` | `23b4e2f25391cc6ad173b836de15efe76b258cd5c4fcf2cf94693bfbfa6a74be` | current + one LF |
| `contracts/diagnostic.v1.schema.json` | `5194816682ea358a07d10baa6c2393f6363aad5ad9bd3314d0199a336cf39ea4` | `a240ee03f6a73dae16a2ecca3697f134e9a330a5066a7ca47e5f69a812986eda` | current + one LF |
| `contracts/exact-set.v1.schema.json` | `7efdb610cf69eb6cb688e65c37302aa8cf67826b24f594912bc49a457ecd2e62` | `8064438df1281fe52e7e626a988039a9bd743b96eb1388c13ef7c3d3ec1ff0c0` | current + one LF |
| `contracts/red-fixture-manifest.v1.schema.json` | `4929658224e75fb4f445a19ff8b68748a6030c65f7a9d757573b1998626161d5` | `6e47f89202fea223f5b5d6d8aa326a677bf2a42ef34fec44668fc63e7e2fb656` | current + one LF |
| `contracts/red-fixture-freeze-receipt.v1.schema.json` | `275cc9d3796263b852ed72b2c74c337d76d6be6537333bf614dabc481e525c76` | `7dcc2e1394f2d4f18c0559fb9011534c3ecddd1a285d0e2b1ad82b4cf30f018c` | current + one LF |
| `contracts/validation-receipt.v1.schema.json` | `facdde31de5cd0d8aff3f7037b60da5d3d052007cc631593e0188f930bb2210c` | `c3d362b835e8e257a7f68e587ab076cd7bd9ed541f6e118363a7328611159121` | current + one LF |
| `validation/diagnostics.ts` | `039146394ee70a2a775637faf0fa529856867c604aa66da368bad38506aa3912` | `b132388c968723d55761950001df32783ef1f581bb81ded396b6f22122732e0d` | current + one LF |

Forbidden matching control:
`contracts/contract-publication-receipt.v1.schema.json` =
`daaae83422e38c3af1df4d99cfa5e0609edfbcc898b3138624d7b18a0b1a2950`.

## Architecture Guidance

This repair restores executed bytes only. It does not redesign serialization,
change the publisher, normalize files, create a new publication receipt, author
red expectations, or advance semantic validation.

## Constraints And Non-Goals

- Append exactly one `0x0a` byte to each of the nine targets.
- Do not run a formatter over the targets.
- Do not change any preimage before appending.
- Do not touch the matching ninth schema.
- Do not rewrite historical session or run evidence.
- Do not create `validation-inputs/` or begin L0B.
- Do not mutate planning, Craft, Inventory, visibility, UI, public Arcanum,
  admission, release, or production state inside this Task Session.

## Write Scope

- exactly the nine paths in the byte matrix;
- this append-only session evidence directory.

## Validation Surface

1. exact preimage relation and postimage SHA-256 for all nine targets;
2. immutable execution receipt, continuation handoff, publication receipt, and
   output manifest SHA-256 preservation;
3. `npm --prefix projects/domainspec-v2/impl run verify:bte:contract-publication`;
4. from `projects/domainspec-v2/impl/test-derivation-engine/`:
   `npx vitest run src/bte/contract-publication.test.ts`;
5. `npm --prefix projects/domainspec-v2/impl run engine:test`;
6. `npm --prefix projects/domainspec-v2/impl run typecheck`;
7. `npm --prefix projects/domainspec-v2/impl run validate:docs`;
8. JSON parsing, exact changed-path allowlist, forbidden-path preservation, and
   `git diff --check`.

Every item is acceptance-critical.

## Gaps And Blockers

- The active byte-drift blocker is resolved only by a passing receipt and later
  Invoke Refresh.
- The independent L0 red manifest/freeze remains absent and blocks L0B, not
  this repair.
- Mutation admission must bind an Invoke-owned material package to this exact
  context before the first implementation write.

## Authority Precedence

1. Immutable L0A receipt handles and historical receipt bytes.
2. Current live preimages and the exact one-additional-LF relation.
3. Applied task and Work Pack contract.
4. Campaign approval for sole-candidate selection.
5. Task Session for bounded repair execution.
6. Invoke Refresh for receipt-backed closeout synchronization.

## Fallback Exploration Rule

Extra sources are allowed only for `MUTATION-PACKAGE-BINDING` or
`VALIDATOR-COMMAND-RESOLUTION`. Report each path, gap, and effect. Any source
that changes the byte relation, write scope, or owner boundary blocks execution.

## Output Paths

- Markdown: this file
- JSON/index: `context-index.json`
