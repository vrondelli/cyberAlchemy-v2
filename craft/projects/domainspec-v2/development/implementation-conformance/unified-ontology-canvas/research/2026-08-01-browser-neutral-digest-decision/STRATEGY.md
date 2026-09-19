# Unified Canvas Browser-Neutral Digest Research Strategy

## P1 Trigger Decision

Dispatch. The decision requires synthesis across the current model/layout APIs,
their validators and receipts, browser-runtime behavior, and at least five repair
alternatives. The removal and preservation questions are independently testable
and benefit from explicit tension rather than one sequential opinion.

## Lanes, Groups, And Subagents

| Group | Agent | Role | Angle / expected output | Scheduling |
| --- | --- | --- | --- | --- |
| explorers | Abramsky, Samson | explorer | Formal dependency trace for complete digest removal; exact breakage and migration matrix. | Parallel with Shannon. |
| explorers | Shannon, Claude | explorer | Computational comparison of pure-JS SHA-256, Web Crypto, non-crypto hash, injected/precomputed hash, and removal. | Parallel with Abramsky. |
| synthesizer | Noether, Emmy | synthesizer | One exact-bound option matrix and smallest-repair recommendation. | After explorers. |
| reviewers | Capucci, Matteo | skeptic | Non-vacuity: require a browser-plus-Node witness and explicit regression surface. | Parallel with Gödel after synthesis. |
| reviewers | Gödel, Kurt | skeptic | Definitional soundness: separate security, fingerprints, local-only scope, evidence, and authority. | Parallel with Capucci after synthesis. |
| writer | Turing, Alan | writer | Persist cited `findings.md` only after evidence closure. | After reviewer convergence. |
| auditor | Brandenburg, Martin | auditor | Audit `findings.md` against the exact goal and claim ceiling. | After writer; one bounded revision route. |

Explorer anti-bias axis: composite `methodology + source-corpus`. Reviewer
anti-bias axis: `attack-vector`. The digest-owned pair predictions live in
`dispatch-sheet.json`.

## Dependency Flow

```text
explorers (parallel)
  -> synthesizer
  <-> reviewers (one zig-zag)
  -> writer
  -> auditor

synthesizer -> explorers: one feedback route for missing source/probe evidence
auditor -> writer: one revision route
parent: final approval
```

The evidence-closure contract is `exact-binding`: every load-bearing recommendation
must identify the current consumer or test location and classify proof as observed,
probed, inferred, proposed, killed, or unverified.

## Inventory Preflight

- Machine index: `.arcanum/inventory/index.json`.
- Lookup readiness: `ready`; validator passed with 136 uncontrolled-tag warnings.
- Selected evidence: the accepted implementation-structure result, the earlier
  ontology-prototype browser-evidence residue, and the verified strategy-preflight
  contract.
- Excluded evidence: broad CAV2 authority/deterministic-retrieval entries because
  they do not establish a need for SHA-256 in this presentation model.
- Gap: no indexed precedent covers the fresh `node:crypto` failure or compares
  all five repair choices.
- Design consequence: the explorer group is divided into a genuine removal lane
  and a contract-preserving portability lane; neither may assume the conclusion.

Inventory is a discovery read model, not proof or dispatch authority. Current
repository bytes and live browser evidence remain load-bearing.

## Gate And Ledger State

- Candidate schema: `0.8.0`.
- Confirmation readiness: `PASS`; deterministic validation reported
  `SHEET_VALIDATION=pass` and `LEDGER_MUTATION=none`.
- Frozen sheet SHA-256:
  `83bcf1ea10af37c3ca266f98557a44b042f15a355d0a052076367d9431e5e98e`.
- Tension gate: `PASS + PASS` from two independent read-only checks bound to
  the frozen digest.
- Human confirmation: required after both checks pass; only exact `confirmed`
  on the frozen digest launches the research.
- Registration: not appended.
- Closeout expectation: exactly one dispatch row after confirmation and one
  close row at termination, followed by Inventory and observability updates.

## Next Human Action

Reply exactly `confirmed` to authorize registration and launch of the frozen
sheet, or request a revision. Any sheet-byte change invalidates this digest and
requires deterministic revalidation plus two fresh tension checks.
