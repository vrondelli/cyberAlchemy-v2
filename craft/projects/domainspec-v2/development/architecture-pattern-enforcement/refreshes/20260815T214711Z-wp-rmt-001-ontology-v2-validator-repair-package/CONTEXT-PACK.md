# WP-RMT-002 Ontology Validator Repair Context Pack

This is strict run-local execution evidence for one Invoke Refresh authoring unit. It is not canonical ontology authority and does not authorize apply.

## Identity

- Goal: complete WP-RMT-002
- Prerequisite owner task: author and validate one fresh one-target validator repair package
- Dispatch: `wp-rmt-002-prerequisite-validator-repair-20260815T214711Z`
- Mode: Invoke Refresh, proposal-only until fresh exact-byte owner acceptance
- Output root: this directory

## Obligations

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| O1 | Bind the accepted package and blocked live-apply receipt exactly | accepted package receipt, live-apply receipt | covered |
| O2 | Bind the governance-only diagnosis and projected patch exactly | sidecar receipt and patch | covered |
| O3 | Change only one staged copy of `validation/validate-apply-package.mjs` | accepted validator preimage and expected candidate hash | covered |
| O4 | Preserve distinct stale-reference and wrong-generation diagnostics | sidecar regression script | covered |
| O5 | Prove the candidate against the current five live postimages | live replay plus ordinary live validator | covered |
| O6 | Produce a self-contained package, exact inventory, validation report, and terminal authoring receipt | new output root | covered |
| O7 | Keep fresh owner acceptance, apply, admission, PromotionRecords, promotion, publication, release, deployment, Git, and network outside this authoring unit | dispatch boundaries | covered |

## Selected sources

1. `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/APPLY-PACKAGE-RECEIPT.json` — accepted package identity and inventory.
2. `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/validation/validate-apply-package.mjs` — exact one-target preimage.
3. `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T192631Z-wp-rmt-001-ontology-v2-live-apply/LIVE-APPLY-RECEIPT.json` — blocked post-apply edge and unchanged live postimages.
4. `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T193612Z-wp-rmt-001-ontology-v2-validation-defect-sidecar/SIDECAR-RECEIPT.json` — root cause, projected postimage, validation requirements, and acceptance boundary.
5. `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T193612Z-wp-rmt-001-ontology-v2-validation-defect-sidecar/repair/validate-apply-package.patch` — exact four-line repair.
6. `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T193612Z-wp-rmt-001-ontology-v2-validation-defect-sidecar/regression/validate-post-apply-hostile-topology.mjs` — permanent regression contract.
7. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs` — ordinary live validation surface, read-only.

Inventory lookup readiness passed against `.arcanum/inventory/index.json`; broad ontology-authority entries were excluded because they do not close this mechanical repair obligation more precisely than the exact receipts above.

## Exact bindings

- Accepted package receipt: `ebdbb200f0df38d8cb63593ee09786cf79ca00fd648a972d9d611ab05a76e2e8`, 21,494 bytes
- Accepted validator preimage: `2b27e0861740600a46be207e72d4a385fc82081e82ed5e42e2eed486092b322e`, 149,061 bytes
- Patch: `484c1ef52b8799d93c22a8ed646e39700061391bdd7104409645cc34721028de`, 1,632 bytes
- Expected candidate validator: `985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c`, 149,370 bytes
- Live-apply BLOCK receipt: `a8d4e29bb48159a953f986d4fdb34434f0fd81467ed321bd384544bdc0d97dda`, 9,506 bytes
- Sidecar PASS receipt: `706e42dd9f0fd4ab9a220ab85e284a0b93bb9dfebc6a7b994683894c57b77f76`, 10,634 bytes
- Regression script: `db3c26bbefc430011c3db12d170fec227f3fb7ce0c878ed17114a67cd6e69c1c`, 9,894 bytes

## Write scope

Only files beneath this package root. `DISPATCH.json`, `CONTEXT-PACK.md`, and `context-index.json` are parent-authored inputs and must remain byte-identical.

## Done criteria

- Exact source/preimage rehash passes.
- Staged candidate hash and size equal the sidecar projection.
- Ordinary live validator passes without private environment overrides.
- Original validator reproduces the exact expected failure.
- Candidate validator passes the full live post-apply replay with 37/37 hostiles.
- Wrong-generation and stale-reference fixtures return their distinct expected codes.
- Package validator and all helper scripts preserve failing exit status.
- Package inventory and terminal receipt are strict JSON/UTF-8 where applicable, regular non-symlinks, final-LF, no trailing whitespace.
- Terminal authoring receipt states fresh exact owner acceptance is required and apply authority is absent.

## Fallback exploration

Only inspect files explicitly referenced by the accepted package validator when a named validation failure cannot be explained by this context. Report every extra source and the gap it closed. Stop on semantic ambiguity or scope expansion.
