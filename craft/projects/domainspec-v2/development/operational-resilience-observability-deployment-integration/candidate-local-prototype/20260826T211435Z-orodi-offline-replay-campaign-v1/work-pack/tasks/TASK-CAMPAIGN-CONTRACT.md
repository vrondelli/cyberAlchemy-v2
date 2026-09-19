# TASK-CAMPAIGN-CONTRACT

## Objective and mapping

- Layer: L0
- Slice/wave: campaign contract / W0
- SWU: `SWU-ORODI-WP7-001`
- Objective: make multi-item replay composition representable without creating one shared evaluation binding, one aggregate control result, or a runtime-eligible state.

## Source contracts

- `../../WORK-PACK.md` — fixed composition decisions, contract shapes, and exact product manifest.
- `../../IMPLEMENTATION-LAYERING.md` — L0 question and non-regression guardrails.
- Existing `contracts/tool-evidence-profile-replay.ts` — WP6 input/result types.
- Existing `contracts/tool-evidence-profile-replay-result.schema.json` — nested closed result shape.
- Existing `contracts/evidence-eligibility.ts` — replay-only receipt and derived-result types.

## Dependencies and blockers

- Dependencies: none inside WP7; pinned WP6 sources must match the Work Pack hashes.
- Current blocker: exact Work Pack and manifest acceptance is unapproved.
- Stop if any existing contract must be modified or if a cross-binding aggregate-derived result is requested.

## Smallest Working Unit

### `SWU-ORODI-WP7-001`

- Primary behavior: define the closed campaign input, test fixture, item receipt, per-binding derived partition, finding, and result shapes.
- Independent acceptance boundary: schemas can prove composed/rejected projection cardinality and authority closure before behavior exists.
- Candidate child units: TypeScript types; fixture schema; result schema.
- Retained-boundary rationale: all three encode the same identity, cardinality, rejection, and authority invariants; accepting only one would leave the execution boundary ambiguous.
- Write scope:
  - `projects/domainspec-v2/impl/operational-resilience/contracts/tool-evidence-replay-campaign.ts`
  - `projects/domainspec-v2/impl/operational-resilience/contracts/tool-evidence-replay-campaign-fixture.schema.json`
  - `projects/domainspec-v2/impl/operational-resilience/contracts/tool-evidence-replay-campaign-result.schema.json`
- Done criteria:
  - all objects are closed and use absolute offline schema IDs;
  - campaign items are bounded to two through seven;
  - rejected outputs require all evidence projections empty;
  - composed outputs require two through seven item receipts;
  - per-binding derived partitions are explicit and no aggregate-derived field exists;
  - admitted observations and eligible controls are typed as empty;
  - runtime admission, referent trust, and authority literals are closed.
- Acceptance evidence: TypeScript compile; JSON schema self-parse; at least one composed-valid, one rejected-valid, one open-object-invalid, one partial-rejection-invalid, and one aggregate-derived-invalid synthetic check.
- Validation surface: commands 1 and 4 in `../../VALIDATION-STRATEGY.md` plus focused negative schema assertions.
- Execution owner: local fallback after exact acceptance.
- Handoff note: use only the pinned WP6 types/schemas; do not generalize or edit them.

## Synchronization

Return the SWU result, three final path digests, exact compile/schema checks, blockers, and `SWU-ORODI-WP7-002` as the only dependency-ready successor. No lifecycle state is synchronized.
