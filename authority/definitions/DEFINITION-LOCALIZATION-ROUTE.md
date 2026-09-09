# CyberAlchemy v2 Definition Localization Route

Status: active route decision
Owner: Craft + definitions-governance
Craft decision: `DEC-CAV2-DEFINITION-LOCALIZATION-001`
Tower map: [DEFINITION-TOWERS.md](DEFINITION-TOWERS.md)
Canonical local definitions: [DEFINITIONS.md](DEFINITIONS.md)
Import ledger: [../imports/definitions/MANIFEST.md](../imports/definitions/MANIFEST.md)

## Decision

CyberAlchemy v2 should contain project-local representation for all imported
definition material that belongs to the stable repository consolidation.

This does not mean every imported term becomes a CyberAlchemy v2 canonical
definition. It means v2 keeps the working definition surface inside the project
space, with provenance, source authority, local posture, and a promotion route.

## Layers

| Layer | Role | Authority |
| --- | --- | --- |
| Project-local representation | Holds imported source definition cards and clusters inside v2. | Evidence and routing surface only. |
| Canonical local definitions | Holds promoted CyberAlchemy v2 definitions. | Normative only after definitions-governance promotion. |
| External authority references | Records terms owned by Arcanum, DomainSpec, research towers, or source projects. | Source authority remains outside v2 unless explicitly adapted. |

## Rule

Every imported definition should be representable inside v2 with:

- source id or stable local import id
- source term
- source path
- source authority owner
- tower assignment
- local posture
- local action
- promotion or non-promotion route

The local posture should use one of these values until definitions-governance
adds or promotes a stricter vocabulary:

- `external-authority-represented`
- `local-adaptation-needed`
- `project-canonical-candidate`
- `research-local-evidence`
- `private-evidence-requires-boundary-review`
- `excluded-or-auxiliary`

## Arcanum First Slice

The first Arcanum pass should create v2-local representations for Arcanum
definitions rather than remain reference-only. The source authority stays with
Arcanum, but v2 gets an inspectable project-local record that can be clustered,
queried, and used by Craft.

Current cluster:

- [source-clusters/arcanum.md](source-clusters/arcanum.md)

Initial source file:

- [../../../arcanum/definitions/DEFINITIONS.md](../../../arcanum/definitions/DEFINITIONS.md)

Initial Arcanum-wide source IDs:

- `DEF-ARC-CONTRACT`
- `DEF-ARC-SCHEMA`
- `DEF-ARC-GOAL-SPELL`
- `DEF-ARC-STAGED-DELTA`
- `DEF-ARC-APPROVAL-TOKEN`

DomainSpec wedge IDs inside the same source file, such as `DS-D1`, `DS-D2`,
`DS-D3`, `DS-D7`, `DS-D8`, `DS-D10`, `DS-P1`, `DS-P2`, and `DS-P3`, should route
to a DomainSpec or bridge cluster. They are not pure Arcanum framework terms.

## Recommended Cluster Files

Create source clusters before adding more canonical definitions:

- `authority/definitions/source-clusters/primordial.md`
- `authority/definitions/source-clusters/arcanum.md`
- `authority/definitions/source-clusters/domainspec.md`
- `authority/definitions/source-clusters/cyberalchemy.md`
- `authority/definitions/source-clusters/framework-unification.md`
- `authority/definitions/source-clusters/knowledge-governance.md`
- `authority/definitions/source-clusters/research.md`
- `authority/definitions/source-clusters/product-projects.md`
- `authority/definitions/source-clusters/validation-ops.md`

Each source-cluster file should be allowed to hold many local representation
rows. Promotion into [DEFINITIONS.md](DEFINITIONS.md) remains separate.

## First Execution Contract

1. Keep `authority/definitions/source-clusters/arcanum.md` synced with Arcanum
   source definitions.
2. Add one representation row for each Arcanum-wide source ID listed above.
3. Preserve the source authority as Arcanum.
4. Mark local posture as `external-authority-represented` unless v2 needs a
   local semantic adaptation.
5. Do not copy Arcanum semantics into [DEFINITIONS.md](DEFINITIONS.md) unless
   definitions-governance promotes a CyberAlchemy v2 adaptation.
6. Update the Craft ledger, index, and human view after the cluster is created.

## Boundary

This route localizes evidence for execution. It does not:

- redefine Arcanum-wide terms
- publish private DomainSpec or validation evidence
- promote research-local vocabulary
- make source-cluster rows canonical
- bypass public/private boundary decisions before standalone extraction
