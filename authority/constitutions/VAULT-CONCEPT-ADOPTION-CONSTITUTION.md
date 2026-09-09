# Vault Concept Adoption Constitution

Status: candidate
Owner: constitution-governance
Authority level: project-local constitution
Selectors: `cyberAlchemy-v2/authority/imports/**`, `cyberAlchemy-v2/authority/definitions/**`, `.arcanum/inventory/entries/evidence-*/*house-project-vault*`
Definition cluster: [../definitions/source-clusters/house-project-vault.md](../definitions/source-clusters/house-project-vault.md)

## Scope

This constitution governs how high-value concepts surfaced from imported vaults
or source collections become CyberAlchemy v2 definitions, constitutions, axioms,
disciplines, schemas, ontology projections, or implementation obligations.

It is intentionally about adoption, not copying. Imported source terms remain
source evidence until the relevant CyberAlchemy v2 authority owner re-authors
them into the narrowest responsible authority surface.

## Rules

### CAV2-VC1. Source Concept Is Evidence First

Validation mode: hybrid

An imported concept cluster must remain evidence until it has:

- a source import or source manifest
- an Inventory card, source cluster, or equivalent selector-level summary
- source-local vocabulary preserved or explicitly translated
- an owning authority route for the target surface

Examples:

- `house-vault-orthogonal-ontology-basis` supports
  [CAV2-D22](../definitions/DEFINITIONS.md#cav2-d22-orthogonal-classification)
  without importing the house_project label system as CAV2 authority.
- `house-vault-ledger-idempotency-event-rules` supports
  [CAV2-D26](../definitions/DEFINITIONS.md#cav2-d26-append-only-event-ledger)
  without resolving generic `ledger`.

Non-examples:

- Treating an Inventory evidence card as if it promoted a definition.
- Copying a source constitution into CAV2 without re-authoring its scope,
  examples, non-examples, and validators.

### CAV2-VC2. Four-Facet Adoption Surface

Validation mode: review

Every adopted value concept must satisfy
[CAV2-D21](../definitions/DEFINITIONS.md#cav2-d21-four-facet-action-method):
classification or taxonomy, schema, human-continuation view, and
machine-checkable view must be bound, created, or carried as typed residue.

Examples:

- A promoted definition states which classification role it serves and which
  artifacts can consume it.
- A candidate constitution names its validation mode and current missing
  validator as residue.

Non-examples:

- Adopting a concept because it "sounds generally useful" without saying what
  kind of authority surface it belongs to.

### CAV2-VC3. Lifecycle Axes Must Stay Separate

Validation mode: review

Adoption must preserve
[CAV2-D23](../definitions/DEFINITIONS.md#cav2-d23-authority-lifecycle-axis).
Role, maturity, evidence, commitment, provenance, and owner cannot silently
substitute for one another.

Examples:

- A source-local proposed constitution can be useful evidence while remaining
  unpromoted.
- A mature source index can shorten search without becoming CAV2 ontology
  authority.

Non-examples:

- Treating confidence as promotion.
- Treating source maturity as local canonical status.

### CAV2-VC4. Classification Adoption Must Preserve Orthogonality

Validation mode: review

Any adopted classification, taxonomy, node-type, status, or authority-type
concept must satisfy
[CAV2-D22](../definitions/DEFINITIONS.md#cav2-d22-orthogonal-classification).
If the adopted classifier depends on another axis, the dependency must be a
typed coupling or typed residue.

Examples:

- Keeping `authority type` separate from `authority posture`.
- Representing unavoidable dependence between schema shape and validation
  behavior through a typed relation.

Non-examples:

- Adding a new status label that merely duplicates maturity, confidence, or
  promotion.

### CAV2-VC5. Provenance-First Search Before Adoption

Validation mode: review

Adoption reviews must use
[CAV2-D24](../definitions/DEFINITIONS.md#cav2-d24-provenance-first-navigation):
start from manifests, definition indexes, source clusters, Inventory cards,
constitutions, and graph/index surfaces before relying on session material or
raw conversation history.

Examples:

- Use the house_project import manifest and evidence cards before opening the
  copied vault tree.
- Use sessions only when the review needs rationale or unresolved residue.

Non-examples:

- Promoting a term because it appears repeatedly in session text.

### CAV2-VC6. Shape Changes Need Amendment Witnesses

Validation mode: hybrid

Any adoption that changes schema, frontmatter, taxonomy, ontology node shape,
ledger row shape, event catalog, machine-view envelope, or validation behavior
must carry
[CAV2-D25](../definitions/DEFINITIONS.md#cav2-d25-schema-amendment-witness).

Examples:

- A new machine-checkable view names its schema delta and validator or review
  witness.
- A future ontology node-type addition records source evidence, compatibility,
  and missing validator residue.

Non-examples:

- Adding a new node field to a projection without an owner, source, compatibility
  note, or witness.

### CAV2-VC7. Adoption Movements Are Append-Only

Validation mode: hybrid

Authority adoption movements should follow
[CAV2-D26](../definitions/DEFINITIONS.md#cav2-d26-append-only-event-ledger):
record imports, promotions, amendments, corrections, and reversals as additive
events or additive artifact updates rather than silent overwrites.

Examples:

- A definition promotion updates the canonical definition, index, source
  cluster, drift audit, and Inventory note with an explicit trace.
- A correction is added as a new rule, note, or event instead of erasing the
  earlier source posture.

Non-examples:

- Rewriting a source-local meaning into local authority without preserving the
  adoption trace.

### CAV2-VC8. Read Models Cannot Promote Themselves

Validation mode: review

Inventory, ontology, source clusters, generated indexes, and projection files
may shorten search and carry candidate meaning, but they cannot promote
definitions, constitutions, axioms, disciplines, schemas, runtime contracts, or
public claims by themselves.

Examples:

- Inventory cards route a concept to definitions-governance.
- Ontology projections request or represent adoption after a PromotionRecord or
  owner decision exists.

Non-examples:

- Treating an ontology node or Inventory EvidenceSet as the promotion event.

## Validation Adapters

| Rule | Adapter |
| --- | --- |
| CAV2-VC1 | Source manifest plus source-cluster/evidence-card check. |
| CAV2-VC2 | Four-facet action review. |
| CAV2-VC3 | Lifecycle-axis review. |
| CAV2-VC4 | Orthogonal classification and typed-coupling review. |
| CAV2-VC5 | Provenance-first selector review. |
| CAV2-VC6 | Schema amendment witness review; future validator when schemas exist. |
| CAV2-VC7 | Append-only adoption trace review; future event-ledger validator. |
| CAV2-VC8 | Inventory/ontology non-promotion review. |

## Current Adopted Vault Concepts

| Definition | Source evidence | Constitution effect |
| --- | --- | --- |
| [CAV2-D22 orthogonal classification](../definitions/DEFINITIONS.md#cav2-d22-orthogonal-classification) | `house-vault-orthogonal-ontology-basis` | Governs classifier adoption. |
| [CAV2-D23 authority lifecycle axis](../definitions/DEFINITIONS.md#cav2-d23-authority-lifecycle-axis) | `house-vault-authority-lifecycle-and-confidence` | Governs authority posture separation. |
| [CAV2-D24 provenance-first navigation](../definitions/DEFINITIONS.md#cav2-d24-provenance-first-navigation) | `house-vault-provenance-navigation-indexes` | Governs search order before adoption. |
| [CAV2-D25 schema amendment witness](../definitions/DEFINITIONS.md#cav2-d25-schema-amendment-witness) | `house-vault-schema-amendment-runtime-witness` | Governs authority-affecting shape changes. |
| [CAV2-D26 append-only event ledger](../definitions/DEFINITIONS.md#cav2-d26-append-only-event-ledger) | `house-vault-ledger-idempotency-event-rules` | Governs additive adoption traces and event-ledger candidates. |

## Promotion Boundary

This constitution is project-local to CyberAlchemy v2. It may become a broader
CyberAlchemy adoption protocol only after another source vault or repository
import uses the same rules successfully and the public/private boundary is
reviewed.

## Split Triggers

Split this constitution if any of these become independently enforceable:

- schema amendment validator
- event-ledger or promotion-record validator
- ontology node-type adoption validator
- public/private source-vault adoption policy

## Open Questions

### OQ-1. Which rule should become deterministic first?

Recommendation: start with CAV2-VC1 and CAV2-VC5 because source manifests,
definition links, and evidence cards are easiest to check before runtime
schemas exist. Status: OPEN.

### OQ-2. Should this become the general promotion constitution?

Recommendation: no. Keep this as the imported-concept adoption constitution and
let the broader authority movement protocol own promotion records, owner gates,
and lifecycle envelopes. Status: OPEN.
