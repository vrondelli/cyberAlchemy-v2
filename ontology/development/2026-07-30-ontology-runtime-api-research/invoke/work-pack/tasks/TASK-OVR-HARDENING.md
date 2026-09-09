# TASK-OVR-HARDENING

## Objective

Prove the L0 runtime fails closed under the selected local isolation boundary,
every approved resource cap, and controlled complete-identity mutation.

## Mapping

L1, S-004, W3. Depends on SWU-OVR-007.

## Smallest Working Units

### SWU-OVR-008 — security boundary

Build the owner-selected enforcement mechanism around existing L0 behavior:
loopback/token, method allowlist, logical IDs, path containment, minimal child
environment, closed stdin/no shell, outbound denial, redaction, exact owned
targets. Run one matrix covering every allowed and forbidden boundary.

Failure mode: if filesystem/outbound/memory enforcement cannot be proven on
the selected platform, block; do not substitute application intent.

### SWU-OVR-009 — resource caps

Instrument each approved `ResourceCapsV0` field. For each cap:

1. prove measurement exists;
2. run an under-cap positive;
3. run an over-cap negative;
4. assert the exact typed failure;
5. prove no publication and owned cleanup;
6. bind values and units into the receipt.

Missing measurement is a failed witness, not zero.

### SWU-OVR-010 — controlled race/isolation

Use synchronization barriers to mutate a declared source and stored native
receipt between pre/post identity phases. Assert `PACKAGE_IDENTITY_CHANGED`,
zero publication, source restoration, and byte-identical clean replay. Do not
claim this closes Augmentor’s separate residue.

## Detailed Contracts

See [`SWU-MANIFEST.json`](../shared/SWU-MANIFEST.json) for exact scopes,
atomicity, evidence, validation, and closeout.

