# SWU-OEWTP-001 Result

- Result: pass
- Attempt: `20260729T182033Z`
- Source receipt:
  [receipt](../session-evidence/SWU-OEWTP-001/20260729T182033Z/receipt.json)
- Typed-admission handle:
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-001/20260729T182033Z/typed-admission.json`

The three owned overlay modules are strict-TypeScript clean while remaining
directly executable by the existing Node-focused runners. The admitted loader
resolves OewApp's relative `/oew-data/` base against the page origin, produces
three same-origin absolute tokenized requests with `credentials: "omit"`, and
rejects malformed or cross-origin inputs before fetch.

Validation passed with 21/21 focused Node tests, 6/6 explicitly discovered
typed OEW tests, zero strict TypeScript diagnostics, the read-only OewApp digest
unchanged, and the 42-file package-manifest path and byte inventories unchanged.

The historical `L1-BUILD.lock.json` intentionally remains bound to predecessor
bytes. SWU-OEWTP-002 owns the fresh build producer and may use this source
receipt; this result does not establish a retained build, gateway, browser
acceptance, deployment, or production readiness.
