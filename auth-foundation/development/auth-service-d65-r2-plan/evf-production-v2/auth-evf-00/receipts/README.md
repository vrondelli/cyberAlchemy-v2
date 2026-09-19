# Freeze receipt history

- `sha256/a439849056284952e0ed8a09fe773452740d84a7ffab9bf76dbb981a9d6d300d/FREEZE-RECEIPT.json` binds `AUTH-EVF-EPOCH-001`. It is historical and superseded because the selected `PLAN-DAG.md` source contained publication-invalid trailing whitespace.
- `sha256/614a9fd5891b4e39280a9fe9ce03fa4227693579d5248e7a18cb0470727d1f0f/FREEZE-RECEIPT.json` binds the current `AUTH-EVF-EPOCH-002` after those three whitespace sequences were removed and all 145 inputs were rehashed.

Receipts are append-only. The root `FREEZE-RECEIPT.json` is the current receipt and must equal the epoch-002 historical copy byte for byte.
