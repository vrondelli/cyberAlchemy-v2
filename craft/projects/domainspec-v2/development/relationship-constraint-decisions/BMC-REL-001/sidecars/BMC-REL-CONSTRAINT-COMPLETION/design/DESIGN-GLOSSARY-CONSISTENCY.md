# Design Glossary Consistency

## Result

Status: `pass-with-open-policy`; authority effect: `none`.

| Define term | Design use | Consistency |
| --- | --- | --- |
| Relationship Signature Authority | exact active `creates` signature remains the source tuple | pass |
| Canonical Single Responsibility | one canonical proposition is authored once; no global application is inferred | pass |
| Concept degree | distinct endpoints remain separate from exact duplicate authorship | pass |
| Declared step count | repeated step occurrences remain separate from edge duplicates | pass |
| Declared role count | outside this `creates` unit | pass |
| Typed fact qualifier | D06/D07 only; outside this unit | pass |
| Runtime cardinality | explicitly excluded from concept duplicate detection | pass |
| Partial-view behavior | later unresolved nonnumeric axis | pass |
| Approval closure | Define approval admits Design but does not select this decision | pass |

Candidate-local working label: `exact duplicate authored canonical
proposition`. It means the same verb and canonical endpoints in the same
admitted authority context are authored more than once. This label is not
promoted into Definitions and does not decide rejection versus coalescence.

No source conflict or silent vocabulary promotion was found.
