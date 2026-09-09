# TASK-OVR-TEARDOWN

## Objective

Close one repeatable private runtime lifecycle with exact-owned teardown and
zero residue. Do not implement retention/GC.

## Mapping

L2, S-005, W4. Depends on SWU-OVR-010.

## SWU-OVR-011

Inputs: admitted config, exact process handle, free loopback port, immutable
fixture store. Outputs: two lifecycle receipts.

Algorithm:

1. start and record exact PID/port/temp/store handles;
2. wait for liveness and bounded service readiness;
3. execute the complete L0/L1 fixture scenario;
4. request stop through the exact handle;
5. reject a deliberately unowned target;
6. wait for owned child/process termination and port release;
7. measure residual owned PIDs, ports, temp bytes, outbound requests, and
   source before/after digests;
8. repeat from a clean owned root and compare stable contract fields.

Acceptance: every zero-residue field is zero and unowned cleanup is rejected.
Scope, split analysis, validation, and closeout are in
[`SWU-MANIFEST.json`](../shared/SWU-MANIFEST.json).

