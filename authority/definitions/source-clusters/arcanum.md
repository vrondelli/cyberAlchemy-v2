# Arcanum Source Definition Cluster

Status: active source cluster
Owner: Craft + definitions-governance
Tower: T1. Arcanum capability framework
Route: [../DEFINITION-LOCALIZATION-ROUTE.md](../DEFINITION-LOCALIZATION-ROUTE.md)
Source authority: Arcanum
Source file: [../../../../arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md)
Canonical local definitions: [../DEFINITIONS.md](../DEFINITIONS.md)

## Authority Rule

This cluster represents Arcanum definitions inside the CyberAlchemy v2 project
space. It does not redefine Arcanum-wide terms and does not promote them into
CyberAlchemy v2 canon.

Use this file for Craft execution, search reduction, dedupe, tower assignment,
and local adaptation review. Promote only explicit CyberAlchemy v2 adaptations
through [../DEFINITIONS.md](../DEFINITIONS.md) and definitions-governance.

## Cluster Rows

| Source ID | Source term | Source authority | V2 tower | Local posture | Local action |
| --- | --- | --- | --- | --- | --- |
| `DEF-ARC-CONTRACT` | contract | Arcanum `definitions/DEFINITIONS.md` | T1. Arcanum capability framework | `external-authority-represented` | Use as the external authority for v2 contract language; promote only if v2 needs a local adaptation. |
| `DEF-ARC-SCHEMA` | schema | Arcanum `definitions/DEFINITIONS.md` | T1. Arcanum capability framework | `external-authority-represented` | Use as the external authority for structure and validation shape; keep distinct from proof or promotion. |
| `DEF-ARC-GOAL-SPELL` | goal spell | Arcanum `definitions/DEFINITIONS.md` | T1. Arcanum capability framework | `external-authority-represented` | Keep as Arcanum-wide workflow authority; consider later only for v2 execution-loop design. |
| `DEF-ARC-STAGED-DELTA` | staged delta | Arcanum `definitions/DEFINITIONS.md` | T1. Arcanum capability framework | `external-authority-represented` | Use for proposal-before-mutation semantics in future Craft or authority promotion flows. |
| `DEF-ARC-APPROVAL-TOKEN` | approval token | Arcanum `definitions/DEFINITIONS.md` | T1. Arcanum capability framework | `external-authority-represented` | Use for protected mutation approval semantics; do not treat as ambient permission. |

## Local Notes

### `DEF-ARC-CONTRACT`

Representation note: an Arcanum contract is the authority and behavior promise
around an artifact, capability, route, stage, or handoff. In v2, use it to keep
definition clusters, promotion queues, handoffs, and future task slices bounded
by explicit ownership, evidence, and stop conditions.

Local adaptation need: none yet.

### `DEF-ARC-SCHEMA`

Representation note: an Arcanum schema is the structural shape an artifact or
runtime state must fit. In v2, use it as shape evidence only; a schema does not
by itself prove execution, promotion, or authority transfer.

Local adaptation need: none yet.

### `DEF-ARC-GOAL-SPELL`

Representation note: an Arcanum goal spell routes a bounded goal across a
governed work graph with owner selection, delegated execution, audit, staged
delta proposal, and approval-gated promotion.

Local adaptation need: possible later if CyberAlchemy v2 defines its own stable
repository goal stream.

### `DEF-ARC-STAGED-DELTA`

Representation note: an Arcanum staged delta is a proposed source-of-truth
change held for review before mutation. In v2, it is relevant to Craft-backed
authority changes, promotion batches, and future extraction work.

Local adaptation need: none yet.

### `DEF-ARC-APPROVAL-TOKEN`

Representation note: an Arcanum approval token is explicit authorization for a
named reviewed batch or operation. In v2, it is useful for protected promotion,
publication, extraction, commit, push, or parent gitlink operations only when
those operations are explicitly included.

Local adaptation need: none yet.

## Excluded From This Cluster

The same source file also contains DomainSpec wedge definitions and properties.
Route those rows to a DomainSpec or bridge cluster rather than this Arcanum
framework cluster.

Known DomainSpec IDs in the source file include:

- `DS-D1`
- `DS-D2`
- `DS-D3`
- `DS-D7`
- `DS-D8`
- `DS-D10`
- `DS-P1`
- `DS-P2`
- `DS-P3`
