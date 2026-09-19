# EVF L1 Cross-Task Gaps

| Gap | Effect | Owner | Closure |
| --- | --- | --- | --- |
| `GCP-L1-B-000` Design validator/selection absent | normal Plan handoff is blocked | Invoke Design validator / owner | return exact `design-validator-pass` and selected Design binding; regenerate Plan if Design changes |
| `GCP-L1-B-001` independent plan review absent | planning package cannot be accepted or applied | independent reviewer | review exact postimage inventory and issue pass/flag/block |
| `GCP-L1-B-002` exact-byte acceptance/apply absent | canonical planning state remains unchanged | user then Invoke Refresh | accept exact bytes and separately authorize canonical apply |
| `GCP-L1-B-003` activation/readiness absent | execution entry remains blocked | Work Pack Readiness / Implementation Readiness | validate applied bytes and a separately accepted activation transition |
| `GCP-L1-G-001` fresh P4 proof absent | R4 and composite closure blocked | P4 Task Session | complete P4 and terminal closeout |
| `GCP-L1-G-002` fresh R4 proof absent | composite closure blocked | R4 Task Session | complete R4 and terminal closeout |
| `GCP-L1-G-003` independent composite receipt absent | L2 remains blocked | independent verifier | validate two receipts and one frozen handle |
| `GCP-L2-B-001` L1 prerequisite absent | C0 request cannot be execution-ready | owner/later plan | retain C0 only as a nonselected proposal |
| `GCP-L2-B-002` Datalog runtime/provider admission absent | C1 cannot run | external owner gate | acquire and admit separately after L1 |
| `GCP-L2-G-001` formal tower claim surfaces drift | prior Alloy bytes are not a clean admitted dependency | formal tower owner | reconcile README/ledger/example claims before provider reuse |

None of these gaps may be converted into a skip, todo, expected result, or
claim-ceiling exception.
