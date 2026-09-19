# WP-RMT-002 mtime-only governance-sidecar disposition

## Result

`PASS` — the receipt verifier's mtime-only failure remains recorded, but it is
not a blocker for the Goal or apply process while every content-addressed and
semantic invariant remains exact.

## Owner direction

> so why we are treating this as important? this should not stop the goals and the process, only semantic and content changes should stop, this should be handled as governance sidecars

The selected disposition is
`ROUTE-MTIME-ONLY-FAILURE-TO-NONBLOCKING-SIDECAR`.

## Meaning

- Preserve the failed command and diagnostic in the governance sidecar.
- Do not rewrite the receipt, touch timestamps, or hide the failure behind a
  later passing command.
- Do not stop the product/process edge solely because byte-identical files have
  different mtimes.
- Stop on any semantic change, content hash or size change, material-set or
  file-type change, or live-target preimage change.

The permanent validator repair is deferred to governance maintenance. It is not
required before the next process gate.

## Current next gate

Exact-byte owner acceptance is complete. Distinct authorization to apply the 33
accepted postimages remains absent. This decision does not supply that
authorization and causes no live mutation, selection, admission, or SWU
execution.
