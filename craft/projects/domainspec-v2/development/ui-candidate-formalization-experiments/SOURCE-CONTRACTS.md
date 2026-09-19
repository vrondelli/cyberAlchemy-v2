# Source Contracts

| Source | Use | Mutation policy |
| --- | --- | --- |
| `../ui-meta-type-repair/audit/integrated-001/result.json` | Mechanical baseline and active gaps | read-only |
| `../ui-meta-type-repair/evidence/results/dossier-policy/generation-001/evaluation.json` | Fixed policy and current counts | read-only |
| `../ui-meta-type-repair/evidence/results/dossier/generation-002/dossier.json` | Hard-conjunct states and DEFER baseline | read-only |
| `../ui-meta-type-formalization/adjudication/VERDICT-MATRIX.md` | Nine-candidate scope and prior dispositions | read-only |
| `../ui-meta-type-formalization/replication/REPLICATION-MATRIX.md` | Candidate-specific evidence limits | read-only |
| `../ui-meta-type-formalization/candidate-meta-types/ui/form/form.md` | Form candidate law source | read-only |
| `../../definitions/DEFINITIONS.md` | Existing DS-D1 alternatives | read-only |
| `../../definitions/relationships/relationships.yml` | Existing DS-D8 signatures | read-only |

Execution may append only inside this package until an explicit owner handoff
is accepted. External corpus material remains in its owning repository; this
package stores pinned handles and bounded excerpts/receipts.
