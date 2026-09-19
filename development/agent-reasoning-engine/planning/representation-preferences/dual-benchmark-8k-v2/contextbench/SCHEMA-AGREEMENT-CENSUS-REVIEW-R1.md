Not approved: partial known model cost is discarded.

A dispatched receipt with input_tokens=123 and output_tokens=null produces known_model_tokens=0. It correctly marks unknown usage and null rates, but loses the known lower bound. Accumulate valid components independently, retain unknown/ineligible status and test both partial directions. Preserve R1.

All five existing tests passed. Read-only replay exactly reproduced 58 search calls, 50 ranked calls, 30 rejections, zero unresolved calls and 337,030 known tokens. Receipt/capture/call bindings and local-versus-historical schema labeling are sound for the exercised cases. All 2,311 prior bindings remain unchanged. No provider or evaluator calls were made.

## Open Questions

- Repair partial known-cost preservation before integration.
- Keep local census eligibility separate from native validity, authoritative reconciliation and confirmed ranked-use gates.
