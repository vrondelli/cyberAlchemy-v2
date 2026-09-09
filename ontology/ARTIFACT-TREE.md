# Ontology Artifact Tree

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

This artifact tree orients the CyberAlchemy v2 source tree into ontology package
views. It is an interpretation aid, not a replacement for
[../SOURCE-MAP.md](../SOURCE-MAP.md), inventory indexes, authority maps, or
promotion records.

## Orientation Map

| Source area | View role | Allowed reading | Forbidden reading |
| --- | --- | --- | --- |
| [../authority/](../authority/README.md) | ontology + bridge | Local authority owners, definitions, constitutions, promotion policy, boundaries. | Ontology may not rewrite authority files. |
| [../authority/imports/](../authority/imports/README.md) | bridge | Candidate source paths and source posture. | Import rows are not local canon. |
| [../development/research/](../development/research/) | bridge | Evidence, findings, open blockers, and accepted design constraints. | Research findings are not automatic specs. |
| [../inventory/](../inventory/README.md) | bridge | Project-local exported read models and evidence links. | Inventory is not source authority. |
| [./](README.md) | ontology | Candidate authority model, views, crosswalks, projections, and promotion requests. | Ontology is not owner verdict. |
| [../../projects/ontology/](../../projects/ontology/) | bridge | Private-parent witness/incubator material for ontology materialization, node eligibility, PromotionRecord fixtures, and glossary collision evidence. | Not current CAV2 ontology authority, not a promotion owner, and not public Arcanum source. |
| [../architecture/](../architecture/README.md) | system + bridge | Architecture candidates or promoted maps after owner review. | Architecture cannot promote terms by usage. |
| [../capabilities/](../capabilities/README.md) | system | Capability contracts after promotion. | Capability folders are not canonical definitions. |
| [../specs/](../specs/README.md) | system | Promoted or candidate contracts after promotion routes. | Specs cannot bypass definition/constitution owners. |
| [../implementation/](../implementation/README.md) | system | Code and package work after task-session. | Implementation does not redefine source intent. |
| [../validation/](../validation/README.md) | bridge + system | Fixtures, reports, and evidence snapshots. | Validation evidence is not a promotion verdict. |
| [../observability/](../observability/README.md) | bridge | Signals and run traces. | Signals are not authority unless promoted. |
| [../ops/](../ops/README.md) | bridge | Work-packs, extraction plans, and handoffs. | Ops docs are not canonical meaning by proximity. |
| [../.craft/ledger.yml](../.craft/ledger.yml) | bridge | Work state and residue. | Craft state is not definition authority. |

## Tree-To-View Rule

Each source area may appear in more than one view, but each citation must state
the role it plays:

- meaning source
- evidence source
- owner route
- runtime evidence
- boundary rule
- blocker or residue
- projection target

If a source area is cited without a role, the citation is candidate context only
and cannot influence promotion.

## Current Gaps

| Gap | Owner route | Status |
| --- | --- | --- |
| Exact standalone extraction tree | decision-gate | open |
| Public/private artifact split | decision-gate | open |
| Live schema placement for future node/relation/lifecycle schemas | schema governance | deferred |
