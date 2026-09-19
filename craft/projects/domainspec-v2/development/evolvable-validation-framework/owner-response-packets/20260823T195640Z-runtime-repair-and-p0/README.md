# Runtime repair and P0 owner-response packet set

This directory contains 23 deliberately incomplete, digest-bound packet templates. It is collaboration evidence only. No packet is an owner receipt, no owner decision has been inferred, and the bundle has `authority_effect: none`.

## Completion and return procedure

1. The named owner independently reviews the source request and every bound digest.
2. The owner copies the applicable template outside this template bundle and fills every required response field. Do not edit the template in place.
3. The owner validates the completed response against the source request, materializes it at the real target response locator when one is declared, and returns the path, SHA-256, and size.
4. A receiving validator rehashes the completed response and its bound inputs before treating it as evidence.

A template remains invalid as a receipt until independently completed, validated, and materialized by the named owner. The bundle does not accept the runtime candidate, admit BTE inputs, decide the IOLM predecessor, adopt dirty baselines, accept or apply proposal bytes, establish readiness, select U1, authorize Task Session, or authorize a retry.

The next route is `stop:user-input` for actual owner completion and return of independently authored receipts.
