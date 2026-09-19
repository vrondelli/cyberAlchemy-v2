# One-target ontology-v2 validator repair live apply

## Outcome Brief

The exact owner-accepted validator repair was applied to its single canonical target and passed the declared post-apply replay. The repair restores distinct classification of the wrong-generation and stale-reference hostile cases, which removes the validator defect that previously blocked the WP-RMT-002 execution-entry refresh.

- Objective: apply the exact accepted one-target validator postimage and validate it against current live ontology bytes.
- Result: pass; the target is byte-identical to the accepted staged postimage, the live replay kills 37/37 hostile controls, and the ordinary validator passes 24/24 checks.
- Why it matters: the parent can independently audit this evidence and then refresh the Work Pack execution entry without stretching the repair acceptance into admission or promotion authority.

## Boundary and Next Decision

- Changed: one canonical validator target and this isolated evidence root.
- Unchanged: all five live ontology targets, repair-package bytes, candidates, admission state, PromotionRecords, promotion state, publication, release, deployment, Git, and external systems.
- Open questions: none inside the accepted one-target apply; parent audit and execution-entry refresh remain outside this helper scope.
- User decision: none.
- Next action: parent independently audits the terminal receipt, then owns the execution-entry refresh and Task Session continuation.

## Technical Details

- Mode: `invoke refresh`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `gated` on parent audit and execution-entry refresh
- Accepted repair receipt: `dda3c156f86f3813311892bc8f04e969f669b65171f7a16d79da41cf1a2beb18`
- Accepted pre-receipt inventory: `f215bfcc08ac47c70e11ab0a27c32dc23ed04a48788ef1dae76ff4442e1ecfb7`
- Target inventory: `817ef12b2ae3261b578b82570423ca984fd786363cd1488becabf1e9f3f04bb0`
- Installed target: `985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c` / 149370 bytes
- Live replay: exit 0, result pass, 37/37 hostile controls, exact distinct diagnostics
- Ordinary validator: exit 0, verdict pass, 24 checks
- Protected live targets: 5/5 unchanged
- Authority effect: none
- Claim ceiling: local exact-byte repair apply and post-apply validation only; no SWU execution, admission, PromotionRecord, promotion, publication, release, deployment, or production-readiness claim.
