# TASK-CAMPAIGN-COMPOSER

## Objective and mapping

- Layer: L1
- Slice/wave: pure composition / W1
- SWU: `SWU-ORODI-WP7-002`
- Objective: recompute, verify, sort, and atomically compose two-through-seven independent WP6 replay items without I/O or evidence promotion.

## Source contracts

- `../../WORK-PACK.md` — ordered composition algorithm and fixed decisions.
- `../../IMPLEMENTATION-LAYERING.md` — L1 question and guardrails.
- W0 campaign types and schemas.
- Existing `src/replay-tool-evidence-profile.ts#replayToolEvidenceProfile` — sole replay execution dependency.
- Existing `contracts/tool-evidence-profile-replay.ts#ToolEvidenceProfileReplayInputs` and `#ToolEvidenceProfileReplayResult`.

## Dependencies and blockers

- Dependency: `SWU-ORODI-WP7-001` passed.
- Current blocker: exact Work Pack and manifest acceptance is unapproved.
- Stop for source drift, need to export private WP6 helpers, need to modify existing code, or any partial-success requirement.

## Smallest Working Unit

### `SWU-ORODI-WP7-002`

- Primary behavior: one pure function produces a canonical composed/rejected campaign result.
- Independent acceptance boundary: in-memory fixtures can prove recomputation, order independence, partition preservation, and atomic rejection before the persisted corpus is added.
- Candidate child units: supplied-result parser; item verifier; uniqueness pass; sorter/projector.
- Retained-boundary rationale: separating these units would expose unverified intermediate items or partial projections; the security property is their closed serial composition.
- Write scope:
  - `projects/domainspec-v2/impl/operational-resilience/src/compose-tool-evidence-replay-campaign.ts`
- Ordered rules:
  1. validate the top-level envelope and item cardinality;
  2. reject duplicate declared item IDs;
  3. recompute each exact item through WP6;
  4. exact-parse and hash supplied WP6 result bytes;
  5. enforce time and authority ceilings;
  6. require replayed/replay-only WP6 outcomes and semantic parity;
  7. extract item identities and per-binding partitions;
  8. reject all cross-item duplicates;
  9. sort items and compute the canonical input-manifest digest;
  10. project audit-only observations/receipts and per-binding derived results;
  11. discard all projections on any finding;
  12. return deeply immutable deterministic output.
- Edge cases: invalid UTF-8/JSON, duplicate JSON keys, empty IDs, 0/1/8+ items, future/mixed time, supplied digest drift, recomputed rejection, semantic drift, missing/rejected eligibility, forged authority/effect/eligible-control fields, and duplicate identities.
- Done criteria: all ordered rules and edge cases have deterministic findings; input permutations produce identical output; inputs remain unchanged; no aggregate-derived result; no partial rejection projection.
- Acceptance evidence: focused composed/rejected checks, reverse/shuffle equality, double-run equality, input immutability, and forbidden-surface scan.
- Validation surface: commands 1, 3, 6, and 7 in `../../WORK-PACK.md`.
- Execution owner: local fallback after exact acceptance.
- Handoff note: import only `node:crypto` and the existing WP6 pure API/types; do not import filesystem, process, network, clock, module, or dynamic-code facilities.

## Synchronization

Return the SWU result, source digest, focused validation results, blockers, and `SWU-ORODI-WP7-003` as the only dependency-ready successor. No lifecycle state is synchronized.
