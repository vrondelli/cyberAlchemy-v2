# Shared Execution Context

## Authority order

1. Current selected Task/SWU contract in this package
2. Passing Design selection and architecture/UX contracts
3. Auditor-approved runtime rebuild findings
4. Current exact implementation source and predecessor receipts
5. Inventory lookup as non-authoritative discovery only

## Global invariants

- no `package.json` or dependency topology changes;
- no write under the old OEW development package;
- one selected SWU and one write scope at a time;
- exact predecessor receipt required for every successor;
- no browser claim before SWU-OEWTP-004 closes and TASK-OEWTP-VERIFY completes;
- independent immutable browser-receipt verification is deferred L2;
- `authority_effect: none`;
- cleanup failure blocks;
- Context Builder runtime packs are session evidence, not canonical plan docs.

## Fixed Poker witness

- opening: F1
- grounding: F1 → R1 → D1
- visible conflict residue: D2
- views: graph, outline, table
- adapter receipt SHA-256:
  `d60fe2048800a1c376dc9d7f04afbfed314f619783d0cb0059059597704ebb01`
- upstream commit: `2cda14e89535049e49120198886bc0b82e9e630f`

## Fallback exploration

Explore only when a declared obligation is uncovered. Search the existing OEW
implementation package first; do not broaden into the old work pack,
ontology/authority, upstream source, or package manifests without a blocking
receipt and new owner decision.
