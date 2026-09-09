# SWU-OEWTP-002 Result

- Result: pass
- Attempt: `20260729T184000Z`
- Source receipt:
  [receipt](../session-evidence/SWU-OEWTP-002/20260729T184000Z/receipt.json)
- Build handle:
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-002/20260729T184000Z/thin-prototype-build-handle.json`

The admitted dependency-free Node producer verified SWU-OEWTP-001, the pinned
archive/toolchain, all overlay bindings, the entry patch, and the unchanged
42-file package-manifest inventory. In one fresh isolated workroot it completed
the frozen install, core build, 6/6 explicit typed OEW tests, strict TypeScript,
and Vite build.

The retained dashboard dist has 19 files, 2,771,716 bytes, and canonical tree
digest
`7a1ab28b0e4d3701a75a0c2c1db285629faf89e21543fce8b8cfa11e063023ad`.
The copied tree reverified byte-for-byte, the scratch root and isolated store
were removed, and the retained artifact remains available to SWU-OEWTP-003.

This establishes a repeatable local build artifact only. It does not establish
the evidence gateway, browser acceptance, deployment, or production readiness.
