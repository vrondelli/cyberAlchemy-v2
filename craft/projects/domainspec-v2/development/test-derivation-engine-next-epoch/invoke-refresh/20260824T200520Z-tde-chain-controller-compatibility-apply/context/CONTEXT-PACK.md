# Runtime context pack: TDE chain-controller compatibility apply

This run applies one exact proposal inventory. It does not authorize acceptance, selection, product execution, Git, or authority changes.

## Obligations

- `O01` covered — Bind the exact proposal and accepted source hashes.
- `O02` covered — Prove all 84 staged postimages are exact and non-symlinked.
- `O03` covered — Prove all 84 canonical targets are absent before create-only apply.
- `O04` covered — Require exact equality of target, material-change, and approval scopes.
- `O05` covered — Validate a standard material package and file-bound handoff before apply.
- `O06` covered — Apply only the declared 84 targets and prove live byte equality.
- `O07` covered — Rerun live WPRA, implementation readiness, and controller structural checks.
- `O08` covered — Preserve accepted @2, proposal, product, authority, Git, and unrelated dirty bytes.
- `O09` covered — Do not create acceptance, selection, epoch approval, or product execution evidence.
- `O10` covered — Return a closed helper receipt with remaining owner gates.

## Selected evidence

- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/REFRESH-REPORT.md` — Result, Exact bindings, Authority and blockers — O01, O08, O09
- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/proposal/TARGET-INVENTORY.json` — canonical_target_root, entries — O02, O03, O04, O06
- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/proposal/PROPOSAL-PATCH-MANIFEST.json` — full_target_mapping, proposal_material_digest — O01, O04
- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/proposal/CANDIDATE-MANIFEST.json` — candidate_id, readiness_evidence, claim_ceiling — O01, O07, O09
- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/validation/CONTROLLER-COMPATIBILITY-VALIDATION.json` — controller, wpra, implementation_readiness — O07, O09
- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/validation/SOURCE-PRESERVATION.json` — source_entries, preserved_forbidden_surfaces — O08
- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/HELPER-RECEIPT.json` — required_revalidation, blockers, next_route — O07, O09, O10
- `arcanum/spells/invoke/schemas/material-package.schema.json` — materialized allOf and exact scope fields — O04, O05
- `arcanum/spells/invoke/schemas/material-package-receipt.schema.json` — PASS/ready receipt fields — O05
- `arcanum/spells/invoke/scripts/material_package_validator.py` — validate_material_package — O05
- `arcanum/spells/invoke/scripts/refresh_material_handoff.py` — resolve_file_bound_refresh_handoff — O05

## Boundary

- Writable: `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply/**` and the 84 create-only paths under `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3/**`.
- Forbidden: accepted @2, proposal bytes, product implementation, authority, Craft, telemetry, Git, and public Arcanum.
- Strict coverage: pass (10/10).
