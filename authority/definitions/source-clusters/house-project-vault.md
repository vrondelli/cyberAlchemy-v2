# House Project Vault Value Concept Cluster

Status: promoted source cluster
Owner: definitions-governance
Tower: T4. Knowledge governance stack
Source import: [../../imports/house_project/IMPORT-MANIFEST.md](../../imports/house_project/IMPORT-MANIFEST.md)
Inventory cards: [../../../../.arcanum/inventory/entries/evidence-cards/2026-06-21-house-project-vault-cards.md](../../../../.arcanum/inventory/entries/evidence-cards/2026-06-21-house-project-vault-cards.md)
Canonical local definitions: [../DEFINITIONS.md](../DEFINITIONS.md)

## Authority Rule

This cluster maps value concepts surfaced in the imported house_project vault.
It does not make house_project source vocabulary canonical. CyberAlchemy v2
authority exists only in the promoted local definitions below and in any
separate constitution, axiom, discipline, or decision that re-authors the source
material through its owner route.

## Promoted Local Definitions

| Source concept cluster | Promoted CAV2 term | Definition | Adoption posture |
| --- | --- | --- | --- |
| Orthogonal ontology labels, unique-node admission, retrieval entropy | orthogonal classification | [CAV2-D22](../DEFINITIONS.md#cav2-d22-orthogonal-classification) | Adopt the classification invariant, not the source-local full label system. |
| `node_type`, `status`, evidence confidence, commitment language | authority lifecycle axis | [CAV2-D23](../DEFINITIONS.md#cav2-d23-authority-lifecycle-axis) | Adopt axis separation, not a complete status taxonomy. |
| Agent navigation, graph edges, session index, constitution-first lookup | provenance-first navigation | [CAV2-D24](../DEFINITIONS.md#cav2-d24-provenance-first-navigation) | Adopt search sequence and provenance posture. |
| Schema amendment ledgers, frontmatter owner, acyclic edges, runtime witness | schema amendment witness | [CAV2-D25](../DEFINITIONS.md#cav2-d25-schema-amendment-witness) | Adopt amendment-plus-witness rule for authority-affecting shape changes. |
| Event-system constitution, idempotency, stream hierarchy, event catalog | append-only event ledger | [CAV2-D26](../DEFINITIONS.md#cav2-d26-append-only-event-ledger) | Adopt narrow event-ledger pattern; generic `ledger` remains unresolved. |

## Evidence Map

| Evidence card | Main source paths | Consumed by |
| --- | --- | --- |
| `house-vault-orthogonal-ontology-basis` | `ontology-conventions.md`, `axiom/ontology-axioms.md` | `CAV2-D22` |
| `house-vault-authority-lifecycle-and-confidence` | `ontology-conventions.md`, `premise/ontology-premises.md`, `confidence-levels.md`, `ontology-architecture-draft.md` | `CAV2-D23` |
| `house-vault-provenance-navigation-indexes` | `agent-navigation.md`, `graph-edges.md`, `graph-session-index.md` | `CAV2-D24` |
| `house-vault-schema-amendment-runtime-witness` | framework constitution files under `constitution/framework/` | `CAV2-D25` |
| `house-vault-ledger-idempotency-event-rules` | `constitution/event-system-constitution.md` | `CAV2-D26` |

## Source Terms Preserved As Source-Local

- `veracidade`
- `conviccao`
- house_project node-type vocabulary
- source-local status names
- source-local event catalog
- source-local graph schema and edge catalog

## Residue

- `orthogonality` as a primordial invariant is still not identical to
  `orthogonal classification`; it remains open in
  [primordial.md](primordial.md).
- Generic `ledger` is still not promoted as a universal primitive; only the
  narrow append-only event-ledger pattern is promoted here.
- Runtime validators for schema amendment witness and append-only event ledger
  do not exist yet. Current validation is review or hybrid until specs are
  promoted.
