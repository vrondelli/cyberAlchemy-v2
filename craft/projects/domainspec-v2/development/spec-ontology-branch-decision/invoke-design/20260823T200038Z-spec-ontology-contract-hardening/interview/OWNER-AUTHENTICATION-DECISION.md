# Specification-Ontology Owner Authentication Decision

Status: selected; dependent owner-role assignment pending.

Decision ID: `DEC-DSV2-SPEC-ONTOLOGY-OWNER-AUTH-001`

Selected option: `A-repository-local-l1-exact-role-receipts`

Selected by: direct user selection `A` at `2026-08-23T20:07:16Z`, with the repository owner acting as the DomainSpec v2 authority-model owner under the existing TOP-03 repository-local precedent.

## Decision

Candidate Design owner admission may use repository-local L1 identity evidence. Each protected response must still bind one exact current role assignment, exact candidate bytes and digests, exact scope and non-scope, and an independently checked receipt. A single ambient approval cannot cover several roles or several contract slices.

External L2 identity, signing, key custody, and third-party verification remain separate higher-assurance gates. This decision neither satisfies nor cancels them.

## Rejected alternatives

- `B-external-l2-attested-role-receipts`: not selected; it would block all candidate admission on currently absent external identity infrastructure.
- `C-separate-principals-repository-local-l1`: not selected at the assurance-posture gate; separate principals remain available as a role-assignment topology.
- `D-defer-owner-authentication`: not selected.
- `E-stop-owner-admission-route`: not selected.

## Claim ceiling

This accepts an authentication posture only. It assigns no semantic owner, accepts no contract slice, admits no schema, and authorizes no implementation, migration, promotion, publication, Git operation, release, deployment, or production effect.

Next gate: `DEC-DSV2-SPEC-ONTOLOGY-ROLE-ASSIGNMENT-001`.
