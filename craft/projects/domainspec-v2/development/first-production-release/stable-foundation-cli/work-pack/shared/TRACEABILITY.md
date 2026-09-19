# Plan traceability

| Decision family | Requirements | Design | SWUs |
| --- | --- | --- | --- |
| SF-01/13/14 | SFC-O-002/004, SFC-B-001 | package/release boundary | 002, 009, 010, 017–020 |
| P2/C2/IR1 | SFC-F-002..005 | resolver/profile/evidence interfaces | 003–004, 007–008, 018 |
| S1 | excluded from CLI runtime; shared decision binding only | authority/non-collapse | integration gate with Lane A; no CLI product SWU |
| SF-05..07/18 | SFC-B-002..006 | package/build/migration | 009–011 |
| SF-09..12/19 | SFC-F-001/006/007, SFC-I-001..005 | result contracts/state flow | 005–008 |
| SF-15/21 | SFC-S-001..005, SFC-C-003/005 | security/data lifecycle | 011–012, 016–018 |
| SF-17 | SFC-R-001..003 | quality/resource extension | 013–014 |
| SF-08/20 | SFC-C-001..004/006 | migration/immutable recovery | 015–018 |
| operator/release boundary | SFC-O-001..004 | rollout/quality/authority | 019–020 |

All 21 owner selections are represented. S1 is deliberately not implemented by
the CLI; it is checked only as a shared decision/integration identity with Lane A.

