# L00 legacy migration baseline

L00 is complete for the declared source-inventory scope: **33 import-ledger rows, two additional notes, and six consumer families** have explicit dispositions. This is an inventory result, not migration implementation or product approval. UI remains deferred.

## Findings that change the next plan

1. The TDE is actively used and has expanded beyond its historical imported-verbatim label. It handles aspect Markdown, normalized SPEC.md, BTE/SFOL consumers and separate machine-input modules. Retiring the entire package would exceed a legacy-input cleanup.
2. Relationship validation already defaults to spec/features and the project-root relationships.yml. The manifest's old retarget-to-RELATIONSHIPS.md instruction is stale.
3. Document validation is only partly retargeted: its normal root is spec/features but its changed-only filter still requires docs/features (validate-doc-links.ts:228). Both project-relative and repository-relative v2 feature paths fail that predicate.
4. The old impl/spec/DEFINITIONS.md location is absent. The current definitions index locates DS-D1/DS-D2 in their domain-owned homes. This is stale navigation, not absent vocabulary.
5. Four AEO code-tag waivers are present and consumed. An old instruction to reset v1 waivers does not establish that these current entries should be deleted.
6. The library deriveFeature entry point drops parser violations, while CLI derive rejects them. L01 must specify the intended compatibility/error contract explicitly.

The CLI default financial-settlement path resolves to the existing validation/poker-team fixture. Its old layout comment does not establish a path defect.

## What the ledger rows mean now

The core implementation and validator rows have concrete current consumers. Specification documents remain present guidance; their existence or changed bytes do not prove reformulation approval. All 14 backend-card rows resolve to the current staging matrix (5 evidence-ready, 8 staged-review, 1 rejected/superseded); staging is not promotion. Recorded DROP rows remain excluded without an unsupported repository-wide absence claim. Four Batch3 rows use generic skill/harness/directory destinations and remain explicitly unresolved for exact implementation scope. The historical DCB not-built note lacks a current exact deliverable binding and is not reused as a current completion verdict.

Each row's source line, recorded verdict, current destination/consumer, evidence and closure limit is in inventory.json. Source file digests are in source-manifest.json.

## Evidence and limits

Fresh read-only probes parse and derive the sample fixture (1 node, 1 obligation) and normalized AEO fixture (42 nodes, 39 obligations), with no parser violations and identical repeated derivation. Source hashes match before and after these probes. These are deterministic structural checks, not runtime behavior or obligation completeness proofs.

The July R3C-003 result is recorded evidence of bounded composability retargeting. The E05 product description establishes the scope of an existing separate JSON owns-reachability slice. Neither is a newly rerun full migration test or proof of general JSON/Markdown parity.

Caller discovery is bounded to the declared local implementation roots with test/generated/vendor outputs excluded. Dynamic imports, external consumers and all historical owner decisions are not exhaustively audited. Unresolved rows are visible; they are not marked missing code or completed migration.

## Next construction step

L01 should define retain/adapt/retire dispositions, starting with the active Markdown CLI/library/BTE consumers, preserving the existing machine-obligation denominator. Specify mixed-input precedence, parser failure handling, consumer compatibility and rollback before any retirement. Reconcile generic Batch3 destinations and waiver ownership. This baseline does not authorize deletion, shared-contract changes or acceptance-bound source edits.

Operational residue keeps its previous owners and affected stages in progress.json. UI deferral does not block L01. The original full-program join still needs its separately resolved completion scope.
