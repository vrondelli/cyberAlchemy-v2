# TASK-AAV-VERIFY: Completion Audit

## Objective

Audit implementation evidence against the work-pack without adding validator
features or promoting authority.

## Layer And Slice

- Layer: L2
- Slice: S-AAV-3
- Wave: W3

## Dependencies

TASK-AAV-001 through TASK-AAV-004 complete.

## Smallest Working Unit Exemption

Closure-only verification task; exempt under the Invoke plan `VERIFY` rule.

## Checks

- every SWU has a receipt and scoped file list;
- all fixture expectations pass;
- malformed policy fails closed;
- one non-mutating live witness exists;
- JSON/text receipts are stable and source-linked;
- C18/C7/C14/D42/D51/D52 traceability is complete;
- candidate and promotion boundaries remain explicit;
- G-AAV-001 through G-AAV-004 have current owner/status;
- L3 remains deferred unless separately approved;
- work-pack state matches evidence.

## Output

Write a completion audit inside the Task Session evidence folder and synchronize
only plan/work-pack evidence. Authority mutations remain separate owner routes.
