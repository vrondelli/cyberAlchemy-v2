# Implementation Layering — Minted Project Node Package

## Global Boundary

The composability path is `work-pack → wave → task → SWU → evidence`. No layer promotion is authorized by this document. Authority homes are bound by `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE`; individual source files are created only inside one selected SWU.

| Concern | Bound home |
| --- | --- |
| experimental profile registry | `projects/domainspec-v2/definitions/minted-project/` |
| source/generated contracts and navigation index | `projects/domainspec-v2/impl/spec/minted-project/` |
| resolver/compiler/views/receipts/minter/template | `projects/domainspec-v2/impl/tools/minted-project/` |
| conformance witnesses | `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/` |

| Layer | Decision unlocked | Included work | Promotion evidence | Deferred |
| --- | --- | --- | --- | --- |
| L0 Contract and compiler proof | Can an owner-approved logical module compile the selected per-node package into deterministic graph/provenance outputs while enforcing admitted form and typed edges? | TASK-MNP-CONTRACT; TASK-MNP-COMPILER; SWU-MNP-001..003 | schema positive/negative fixtures; exact kind/profile checks; graph equality; source/navigation binding; deterministic receipt | Markdown generator, minter, cross-feature, release |
| L1 Repeatability and project creation | Can generated views and a minter reproduce the contract for a second same-feature fixture without authority leakage? | TASK-MNP-VIEWS; TASK-MNP-MINTER; SWU-MNP-004..005 | stale source/graph/view failures; output containment; clean minted-project rebuild; no DomainSpec fixture paths | compatibility governance, cross-feature, migration |
| L2 Governance and conformance | Can the contract fail closed across supported profile states, deprecated/generated/deferred relationships, damaged sources, and degraded generation? | TASK-MNP-CONFORMANCE; SWU-MNP-006 | conformance corpus; 10 controls carried; formation/profile matrix; degraded-mode receipts; second independent fixture | cross-feature only if separately authorized; release rollout |
| L3 Admission and migration | Can owners ratify exact artifacts and safely classify/migrate existing fixtures without creating consumer authority in DomainSpec? | TASK-MNP-ADMISSION; SWU-MNP-007 | owner-bound digest receipt; FPR alignment; migration/disposition matrix; rollback/retraction proof | website graph and ecosystem scale |

## Layer Laws

- L0 may begin only through an explicitly selected `SWU-MNP-001` Task Session using the bound directory scopes.
- L1 promotion requires L0 graph/source/formation evidence, not toy preference.
- L2 promotion requires a second independent consumer-project witness and profile-state negative controls.
- L3 promotion requires FPR/definitions/validation/layering owner receipts and does not follow automatically from passing code.
- Cross-feature support and an independent edge lifecycle are separate design triggers, not hidden L2 requirements.

## Active Layer Window

`L0 planning open; execution inactive`. `SWU-MNP-001` is the only eligible first unit, but `Active SWU` remains `none` until the operator explicitly selects it. Never start W1 as a whole by default.

## Deferred Complexity Triggers

| Mechanism | Trigger |
| --- | --- |
| separate edge files/registry | an edge owns evidence, version, review, or lifecycle independent of its source node |
| cross-feature resolver | the product claims complete traversal across more than one feature root |
| compatibility negotiation | more than one language/schema version must be accepted concurrently |
| interactive website graph | FPR-04 read-only projection is stable and the learning product has its own design |
