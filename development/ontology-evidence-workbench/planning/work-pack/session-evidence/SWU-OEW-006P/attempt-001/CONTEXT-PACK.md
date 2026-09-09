# Context Pack — SWU-OEW-006P Attempt 001

Mode: standard strict context  
Selector: `SWU-OEW-006P`

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| P6-01 | Bind the selected split-build frontier and current chain cursor | covered |
| P6-02 | Bind the retained passing L0 predecessor receipt and upstream bytes | covered |
| P6-03 | Bind all eleven declared target baselines | covered |
| P6-04 | Bind exact Node and pnpm 10.6.2 bytes without Corepack fallback | covered |
| P6-05 | Prove a fresh external workroot, effective frozen lock, and declared mode | covered |
| P6-06 | Prove fixture patch preimage, postimage, single apply, and reapply rejection | covered |
| P6-07 | Bind fresh protected-set baseline and cleanup/residue checks | covered |
| P6-08 | Preserve private scope, no final feature-build claim, and `authority_effect:none` | covered |

The implementation scope is exactly the eleven paths declared by
`SWU-OEW-006P`. The existing OEW `package.json` is the sole package root and is
modified once to register the complete L1 command surface; this session does
not create another package manifest. The retained L0 source archive is consumed
read-only. Final feature byte binding remains owned by `SWU-OEW-013B`.
