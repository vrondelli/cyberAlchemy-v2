# TASK-MNP-COMPILER — Resolver, Validation, and Normalization

Layer: L0  
Status: `SWU-MNP-002` and `SWU-MNP-003` completed; L0 compiler pass

## Purpose and Decisions Owned

Implement project-root-safe discovery and deterministic compilation from selected layout-A sources to layout-neutral graph plus source manifest. The compiler owns validation/normalization behavior, not consumer semantics or owner admission.

## Data Flow

`project manifest → contained feature paths → contained node files → schema/profile validation → unique node/edge tables → typed endpoint validation → canonical graph + source manifest + source-set digest`

## SWU-MNP-002 — Safe Source Resolver

- Goal: resolve every declared source under the consumer project root and calculate the canonical input set.
- Dependencies: SWU-MNP-001.
- Write scope: `projects/domainspec-v2/impl/tools/minted-project/resolver.ts`, shared local types/helpers below that directory, and `projects/domainspec-v2/impl/tools/tests/minted-project-resolver.test.ts`.
- Algorithm:
  1. canonicalize project root;
  2. reject absolute paths before filesystem access;
  3. resolve each relative path and verify it remains under root;
  4. reject missing, duplicate, non-file, and unsupported-extension entries;
  5. sort paths by normalized project-relative form;
  6. hash bytes and derive one canonical source-set digest;
  7. preserve path/digest records for receipt generation.
- Failure modes: symlink escape, case/canonicalization collision, `..` escape, duplicate reference aliases, vanished file, unreadable file, unsupported version.
- Done criteria: positive project resolves deterministically; every escape/collision/missing mutation fails before parsing domain semantics.
- Evidence: resolver unit tests, platform/path fixtures, repeat digest proof.
- Verification: `npm --prefix projects/domainspec-v2/impl run tools:test` and `npm --prefix projects/domainspec-v2/impl run typecheck`.
- Execution owner: local fallback.
- Handoff: return ordered source records and explicit failure classes to SWU-MNP-003.

Completion evidence: `../../../../task-sessions/20260714-swu-mnp-002/receipt.json`.

## SWU-MNP-003 — Formation, Edge, and Graph Compiler

- Goal: validate admitted node formation/profile and active typed edges, then emit deterministic semantic graph and provenance manifest.
- Dependencies: SWU-MNP-001 and SWU-MNP-002.
- Write scope: compiler/validator/normalization modules below `projects/domainspec-v2/impl/tools/minted-project/` and `projects/domainspec-v2/impl/tools/tests/minted-project-compiler.test.ts`.
- Algorithm:
  1. parse every node against the machine contract;
  2. resolve kind through the owner-approved supported profile;
  3. execute the kind's formation/criterion validation over `body`;
  4. index unique node IDs and their canonical source owners;
  5. lift each embedded connection into `{edge_id,type,from,to}`;
  6. reject duplicate edge IDs before endpoint inference;
  7. resolve both endpoints;
  8. resolve only active authored relationship signatures and enforce exact endpoint kinds/scope;
  9. sort semantic nodes/edges canonically and emit `graph.json`;
  10. emit `source-manifest.json` mapping every graph ID to exactly one canonical source and hash;
  11. verify graph IDs and manifest record IDs are equal sets.
- Edge cases: kind exists but unsupported; formation failure; generated/deprecated/deferred relationship authored; inverse duplicate; missing target; wrong endpoint; cross-feature edge without authorized resolver; same ID from two files.
- Done criteria: graph/source manifest deterministic, source navigation total, and each failure returns a distinct stable class.
- Evidence: all S06/S08 controls plus formation/profile matrix and generated/deprecated/deferred relationship cases.
- Verification: `npm --prefix projects/domainspec-v2/impl run tools:test`, `npm --prefix projects/domainspec-v2/impl run typecheck`, and the test-owned two-clean-run byte comparison.
- Execution owner: local fallback with definitions/validation review.
- Handoff: bind output schemas and compiler digest to SWU-MNP-004.

Completion evidence: `../../../../task-sessions/20260715-swu-mnp-003-retry-001/receipt.json`.
