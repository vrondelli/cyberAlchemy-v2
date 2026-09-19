# Invoke Refresh Result — Local Prototype Without Checksums

- Mode: `refresh`.
- Phase status: `pass`.
- Activation: direct user; default `apply-approved`.
- Source signals: two (`evidence_added`, `status_changed`, `route_changed`).
- Context Builder: strict `8/8`, no runtime handoff.
- Inventory: one relevant non-authority strategy entry; direct user decision
  controls the applied route.
- Targets: eight exact planning artifacts.
- Material package: `pass`, digest
  `106ea1dddf037a975874aebfb40178991515527ad5c644466390db8d492d440e`.
- Handoff: `ready`.
- Applied delta: preserve historical 004 BLOCK; add and select 004P; define the
  prototype-only fixed-ID/no-generated-checksum exception; keep 005 blocked on
  a passing 004P Refresh.
- Skipped: product implementation, old result rewriting, Node server, later
  SWUs, authority, publication, and Git.
- Dispatch techniques: `sequence`, `owner_boundary_check`,
  `artifact_contract_bridge`, `concrete_path_evidence`, `residue_ledger`, and
  `execution_receipt_handoff`; full dispatch not required.
- Distill: skipped because 004P is already one independently accepted corrective
  behavior with an explicit 005 recomposition edge.
- Target-lifecycle blocker: still open until Task Session proves 004P.
- Next route: `task-session:execute:SWU-UOC-004P`.
