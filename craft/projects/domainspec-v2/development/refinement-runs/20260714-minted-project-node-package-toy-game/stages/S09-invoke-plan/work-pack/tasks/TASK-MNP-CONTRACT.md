# TASK-MNP-CONTRACT — Machine Source Contract

Layer: L0  
Status: `SWU-MNP-001` completed; Task Session receipt passed

## Purpose and Decision Owned

Define the production machine contracts for project manifest, feature manifest, canonical node, embedded source-owned connection, normalized graph, source manifest, and build receipt. This task owns form only; it must not preload consumer domain meaning or decide release support from kind-name existence.

## Inputs

- `stages/S08-distill-repair/selected-design.json`
- current kind/relationship registries and owner-approved supported profile
- `projects/domainspec-v2/authority/decisions/2026-07-14-minted-project-node-package.md`
- current schema conventions in the chosen implementation module

## Outputs

- `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml`;
- source/generated schemas and `INDEX.md` under `projects/domainspec-v2/impl/spec/minted-project/`;
- positive minimal Key and Door contract fixture;
- distinct negative fixtures for missing machine field, duplicate ID, external path, wrong language/profile binding, and illegal generated-authority fields;
- human documentation generated from or mechanically checked against the machine contracts.

## Implementation Detail

1. Define stable version identifiers for project, feature, node, graph, source manifest, and receipt records.
2. Require project-local relative feature paths and a contained generated root.
3. Require one node file per node with `node_id`, `feature_id`, `kind`, `intent`, typed `body`, and `connections[]`.
4. Require every embedded connection to own stable `edge_id`, `type`, and `to`; derive `from` only from its containing canonical node.
5. Bind language/profile authority by resolvable version/digest fields, not copied consumer semantics.
6. Model graph and source manifest as generated outputs with authority posture and source-set binding.
7. Reject fields or statuses that allow generated graph/Markdown to claim authored authority.
8. Generate or validate human docs from the machine contract; do not maintain a divergent prose schema.

## Edge Cases and Failure Modes

- absolute or escaping paths;
- empty IDs/intent/body;
- a connection with an explicit conflicting `from`;
- duplicate node or edge IDs;
- generated inverse edge represented as authored;
- kind registered but outside supported profile;
- unsupported schema version;
- fixture-specific domain IDs embedded in a mint template.

## SWU-MNP-001

- Goal: author the complete machine contract and red/green fixture set.
- Dependencies: `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE` remains `PASS`.
- Write scope: `projects/domainspec-v2/definitions/minted-project/`; `projects/domainspec-v2/impl/spec/minted-project/`; contract-only red/green fixtures below `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/`; tool-test integration only at `projects/domainspec-v2/impl/tools/tests/minted-project-contract.test.ts`.
- Done criteria: every record has a machine schema; layout A is expressible; graph/source/view authority flags cannot be confused; negative fixtures fail distinctly; human docs cannot drift.
- Acceptance evidence: schema validator receipt, fixture matrix, generated-doc parity check, no consumer semantics in template scan.
- Verification: `npm --prefix projects/domainspec-v2/impl run tools:test` and `npm --prefix projects/domainspec-v2/impl run typecheck`.
- Source anchors: S08 selected design, S06 candidate A, current kind/relationship authorities, Decision Gate receipt.
- Execution owner: local fallback after explicit SWU selection.
- Handoff: result must name exact schema paths/digests and supported profile before SWU-MNP-002/003.

## SWU-MNP-001-R2 — Empty Project Contract Repair

- Status: completed; receipt pass.
- Decision: Option 1 in
  `authority/decisions/2026-07-15-empty-minted-project-contract.md`.
- Goal: admit a compile-valid zero-feature/zero-node consumer project without
  weakening populated path validation or generated authority boundaries.
- Handoff: current schema/resolver digests and empty compile/view proof to
  SWU-MNP-005.
- Evidence: `task-sessions/20260715-swu-mnp-001-r2/`; targeted `24/24`,
  full tools `95/95`, TypeScript and diff pass.

## Completion Evidence

- Task Session result: `../../../../task-sessions/20260714-swu-mnp-001/TASK-SESSION-RESULT.md`.
- Machine receipt: `../../../../task-sessions/20260714-swu-mnp-001/receipt.json`.
- Fixture matrix: `../../../../task-sessions/20260714-swu-mnp-001/fixture-matrix.json`.
- Validation: targeted contract `5/5`; full tools suite `76/76`; TypeScript and
  `git diff --check` pass.
- Authority posture: experimental profile only; release admission remains
  ungranted.

Repair evidence: `../../../../task-sessions/20260715-swu-mnp-001-r1/receipt.json`
adds the operator-selected per-kind machine body schemas and supersedes the
original profile/fixture digests without rewriting the historical receipt.
