# Validation receipt history

- `sha256/66b011259e7e0488ffb36bf323d771a14f32a17766f5331545dbff90d3afd081/VALIDATION-RECEIPT.json` is immutable historical output from the first validator pass. It is superseded because the material scan did not exclude the nested `ontology/receipts/` path and therefore was not stable after materialization. It is not completion evidence.
- `sha256/08e14dfe80176635bebf5730e846912ec72f6ca670a05a5249603d2a3a6c714f/VALIDATION-RECEIPT.json` is the stable epoch-001 receipt. It is superseded because publication cleanup changed a selected frozen source and required a new freeze and validation epoch.
- `sha256/56b09612e439a3ca423160f677b12dfcfb05664d8f0cb7675f40adbd36b5be19/VALIDATION-RECEIPT.json` is the current epoch-002 receipt referenced by implementation status.

Receipts are append-only. Supersession changes only which exact receipt the status record treats as current; it does not rewrite historical bytes.
