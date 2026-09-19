# Context Pack: SWU-FSTG-003

- mode: standard, strict
- coverage: 9/9
- source: contained Financial Settlement feature directory
- source census: 10 nodes, 9 kinds, 7 edges, 6 families
- write scope: new feature projector and focused tests only
- decision: adapters consume anchored tables, explicit labels, headings, and
  graph evidence; absent facts become diagnostics
- prohibited: source edits, header guessing, path escape, dropped sibling rows
- expected red: `maps` from `SettlementRequestToInput` to `SettlementResult`
- validation: focused projector Vitest plus full `verify:bte`

This is Task Session evidence, not planning authority.
