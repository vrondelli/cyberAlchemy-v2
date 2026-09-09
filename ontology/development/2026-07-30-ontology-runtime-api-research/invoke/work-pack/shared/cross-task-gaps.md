# Cross-task Gap Ledger

| Gap | Scope | Effect | Route |
| --- | --- | --- | --- |
| runtime-contract owner absent | all | blocks all mutation | decision-gate |
| implementation owner/root absent | all | candidate paths inactive | decision-gate |
| transition owners absent | all runtime states | blocks lifecycle implementation | decision-gate |
| fixture caps unapproved | SWU-001,009 | config/measurement contract not admitted | decision-gate |
| isolation mechanism unselected | SWU-008–011 | acceptance-critical security gap | decision-gate |
| no fixture package/adapter | SWU-002+ | no runnable witness | future implementation owner |
| no executed Plan witness | all | plan-evidence-pending | Task Session only after gates |
| Augmentor race residue | future adapter | adapter remains inadmissible | Augmentor owner route |
| CAV2/Body War adapters absent | L3 | deferred | exact retained owner routes |

