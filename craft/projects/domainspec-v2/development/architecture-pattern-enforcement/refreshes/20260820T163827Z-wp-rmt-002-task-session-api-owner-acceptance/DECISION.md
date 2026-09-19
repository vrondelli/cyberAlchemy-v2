# WP-RMT-002 Task Session API exact-byte owner acceptance

## Decision

The owner accepted proposal
`wp-rmt-002-task-session-transient-output-api-proposal-20260816T160301Z`
as the exact 33-target candidate bound by the three supplied SHA-256 values.

This closes only the exact-byte owner-acceptance gate. It does not authorize
live apply, Task Session admission, selection of `RMT-OP-001`, or SWU execution.

## Exact source

> I accept proposal wp-rmt-002-task-session-transient-output-api-proposal-20260816T160301Z, bound by APPLY-PROPOSAL.json SHA-256 5b6eb57fe1f8cebffb54c39fabd5ab1c5488e167a74f1584d5e4e83ed40c2ee1, PROPOSAL-RECEIPT.json SHA-256 067b1b497673bca23e5e8ac26bab5f4aad234da62efad8f04cca8f077d3455d4, and frozen inventory SHA-256 f2b318255e35cdc5ffe5d37586e1d90ebd4d6a38224f42580f9a6345b84c3ec3.

- Recorded at: `2026-08-20T16:38:27Z`
- Selected option: `ACCEPT-EXACT-33-TARGET-PROPOSAL-BYTES`
- Authority effect: none

## Bound evidence

- `APPLY-PROPOSAL.json`: SHA-256
  `5b6eb57fe1f8cebffb54c39fabd5ab1c5488e167a74f1584d5e4e83ed40c2ee1`,
  37,394 bytes
- `PROPOSAL-RECEIPT.json`: SHA-256
  `067b1b497673bca23e5e8ac26bab5f4aad234da62efad8f04cca8f077d3455d4`,
  131,953 bytes
- frozen pre-receipt inventory: SHA-256
  `f2b318255e35cdc5ffe5d37586e1d90ebd4d6a38224f42580f9a6345b84c3ec3`,
  120 files, 9,326,016 bytes
- current live targets: 33 preimages, zero postimages, zero drift, zero missing

## Governance-only verification flag

The frozen byte inventory replays exactly, but the receipt verifier currently
exits with `terminal receipt was not written last`. The unchanged receipt has
an August 16 mtime while 81 byte-identical receipt-bound materials have restored
August 19 mtimes. This is a filesystem-metadata ordering defect, not byte drift.

The apply edge remains stopped. No timestamp was changed and no accepted byte
was repaired or rewritten. A repair that changes any acceptance-bound byte must
receive a new inventory and fresh owner acceptance.

## Remaining gates

1. Resolve the terminal-receipt order-proof defect without fabricating mtimes or
   stretching this acceptance across changed bytes.
2. Obtain a distinct authorization for the exact 33-target live apply.
3. Rehash all 33 live targets immediately before apply and stop on any drift.
4. Apply only the accepted postimages and run validation against the installed
   bytes.
5. Produce fresh readiness, selection, and Task Session admission evidence.
