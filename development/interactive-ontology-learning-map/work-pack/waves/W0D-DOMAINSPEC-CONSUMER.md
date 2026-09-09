# W0D — DomainSpec Evidence Consumer

- Sequence: `SWU-IOLM-DSC-A`, then later `SWU-IOLM-DSC-B`; stop after every receipt.
- Selected unit: none.
- Entry for DSC-A: passing candidate-substrate handle plus exact successful
  `SWU-GCP-001` / `evf-l0-core` receipt.
- Entry for DSC-B: DSC-A pass plus exact fresh green `SWU-BTE-008` /
  `verify:bte:core` receipt.
- Purpose: prove real private-application consumption independently from the
  core that produced the evidence.
- Machine boundary:
  `cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml`
  and `receipt.schema.json`; Markdown is explanatory only.
- Merge policy: sequential by receipt identity, but W0D is a sibling lane and
  does not gate EVF or BTE core closure.
- Exit: one fresh narrow EVF consumer receipt and one later distinct BTE breadth
  receipt; the narrow receipt is never eligible for `SWU-BTE-010`.
- Recomposition: EVF core plus DSC-A supports the accepted narrow two-proof
  claim. BTE core plus DSC-B and the separately owned Body War receipt may feed
  BTE terminal consumer verification.
- Current handoff: blocked/unselected. First close the candidate substrate and
  obtain the exact applicable upstream core receipt.
