# Constitution Import Pack

Status: candidate
Mode: compose
Target: `cyberAlchemy-v2` authority import
Created: 2026-06-19

## Source Ledgers

| Ledger | Count | Status |
| --- | --- | --- |
| [../imports/constitutions/MANIFEST.md](../imports/constitutions/MANIFEST.md) | 106 candidates | Imported as candidates, not promoted. |
| [../imports/definitions/MANIFEST.md](../imports/definitions/MANIFEST.md) | 149 candidates | Imported as candidate term sources, not promoted. |

## Selected Constitution Families

| Family | Source posture | Import use |
| --- | --- | --- |
| Arcanum framework constitutions | Public framework source | First public-safe rule pattern source. |
| Arcanum constitution-governance development | Lifecycle evidence | Validator and split-pattern evidence, not direct rule authority. |
| Private DomainSpec root/vault constitutions | Private source authority | Private pattern evidence until boundary review. |
| Private DomainSpec axioms | Private source authority | Candidate semantics and invariants; definitions-governance must handle terms. |
| Project domainspec constitutions | Project-local authority | Case evidence for future v2 extraction shape. |
| Research constitution discussions | Research evidence | Context for conflict and evolution, not rule authority. |
| Imported house_project vault value concepts | Private source evidence | First adopted value-concept cluster, re-authored through [VAULT-CONCEPT-ADOPTION-CONSTITUTION.md](VAULT-CONCEPT-ADOPTION-CONSTITUTION.md). |

## Precedence

1. CyberAlchemy v2 local constitution rules apply only inside
   `cyberAlchemy-v2/**`.
2. Public Arcanum framework constitutions may be referenced as reusable public
   patterns.
3. Private DomainSpec constitutions remain private evidence until a
   public/private decision approves derivative wording.
4. Research and task-session reports explain how rules evolved, but do not
   override active constitution sources.

## Conflicts Preserved

| Conflict | Status | Next route |
| --- | --- | --- |
| Public Arcanum rules are reusable, but private DomainSpec rules may be richer and unsafe to publish. | flag | decision-gate before public extraction. |
| Some constitution-governance development files are evidence, not active constitutions. | flag | classify source posture before promotion. |
| Domain-specific constitutions may not generalize to CyberAlchemy v2. | flag | use as examples/non-examples, not default rules. |
| Imported vault concepts are valuable but source-local. | fixed | Re-author through definitions-governance plus [VAULT-CONCEPT-ADOPTION-CONSTITUTION.md](VAULT-CONCEPT-ADOPTION-CONSTITUTION.md). |

## Validators

| Check | Result |
| --- | --- |
| Import manifest exists for constitution candidates. | pass |
| Import manifest exists for definition candidates. | pass |
| Candidate counts recorded. | pass |
| Rule-level extraction and conflict validation. | not run |

## Result

Status: flag.

The import layer now exists and can support real consolidation. It remains
flagged because most candidates are path-level imports only, but the
house_project vault slice has its first re-authored adoption pack:
[VAULT-CONCEPT-ADOPTION-CONSTITUTION.md](VAULT-CONCEPT-ADOPTION-CONSTITUTION.md)
plus [CAV2-D22 through CAV2-D26](../definitions/DEFINITIONS.md#cav2-d22-orthogonal-classification).

## Next Route

Use constitution-governance `select` or `compose` to extract the next active
CyberAlchemy v2 constitution pack from these ledgers. The current next slice is
validator and axiom work for schema amendment witness, append-only event ledger,
and authority lifecycle axes.
