# TASK-IOLM-000 — Select Projection Contract Owner

## Objective and mapping

- Slice/layer/wave: S-000 / L0 / W0.
- Objective: select the legitimate owner for the combined projection contract and state what that owner may approve.
- Status: completed — G-OWNER passed on 2026-07-14.
- Mutation exemption: this is a decision unit, not prototype implementation.

## Source contracts

- [SPEC — Authority and lifecycle](../../SPEC.md#authority-and-lifecycle)
- [Accepted findings — Open Questions](../../../research/2026-07-14-interactive-ontology-learning-map/findings.md#open-questions)
- [CAV2 package model — Authority Law](../../../../ontology/PACKAGE-MODEL.md#authority-law)
- [DomainSpec ontology — Promotion Path](../../../../../projects/domainspec-v2/ontology/README.md#promotion-path)

## SWU-IOLM-000-A

| Field | Contract |
|---|---|
| Dependencies | none |
| Source anchors | source contracts above; findings OQ-1 and OQ-3 |
| Related context | [cross-task gaps](../shared/cross-task-gaps.md) G-OWNER/B-VOCAB |
| Write scope | decision artifact selected by Decision Gate; then status-only sync in this package |
| Done criteria | names projection schema owner, approval posture, allowed candidate version, definitions obligations, challenge/appeal route |
| Acceptance evidence | [G-OWNER decision](../shared/G-OWNER-DECISION.md) plus explicit “does not own source-local meaning” clause |
| Validation surface | human gate review against CAV2 and DomainSpec owner boundaries |
| Execution owner | Decision Gate + human authority owner |
| Handoff | G-OWNER handle is [recorded](../shared/G-OWNER-DECISION.md); select SWU-IOLM-001-A only after G-DSV2-SG also passes |

## Decision questions

1. Is the owner CAV2 authority, a new bounded private-product owner, or a composed route?
2. Can it approve only projection fields, or also enum values?
3. Which terms must route to definitions-governance and source owners?
4. What version may be called approved, and what remains candidate?
5. Who may challenge, supersede, or retire the projection contract?

## Recomposition

The decision closes G-OWNER only. It cannot approve DomainSpec meanings or relations, select a DomainSpec profile or precedence rule, close an FPR node, define or waive quotient/retraction evidence, certify graph conformance, validate schemas, implement the prototype, or authorize publication.

## Result

- Owner: `private-learning-map-product-owner`.
- Scope: projection fields and projection-local enums.
- Handback: authority-relevant discoveries route to definitions governance and affected source owners.
- Version: `0.1.0-candidate` until L0 contract/manifest validation; then eligible for `0.1.0-private`.
- Projection lifecycle: the private-product owner alone adjudicates challenges, supersession, and retirement within projection scope.
