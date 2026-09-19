# Hardening Risks and Gaps

| ID | Risk | Containment | Closure owner/evidence | Status |
| --- | --- | --- | --- | --- |
| `HG-01` | many Rondelli-held roles collapse into one ambient permission | distinct role-assignment records, scopes, non-scopes, and OAR responses | exact Rondelli responses under each current role | blocked |
| `HG-02` | Victor's verification is treated as semantic approval or veto | verifier schema forbids semantic effects and limits checks | direct Victor role/policy acceptance | blocked |
| `HG-03` | owner and verifier are the same principal | candidate schemas fix separate principals; negative witness requires block | identity and role validator | planned-unexecuted |
| `HG-04` | a package is assigned below its hazard floor | assignment validator and under-floor fixtures | future V1 checker/V2 verifier | planned-unexecuted |
| `HG-05` | a level or byte changes after freeze without restart | manifest invalidation rule and superseding-package fixture | lifecycle and verifier receipts | planned-unexecuted |
| `HG-06` | V1 checker becomes an invented policy authority | exact Victor-owned policy and checker digest bindings | Victor policy acceptance plus later checker implementation | blocked |
| `HG-07` | stale identity, digest, role, scope, or ceiling passes | fail-closed conditions and negative fixtures | future checker/direct Victor result | planned-unexecuted |
| `HG-08` | Design-local schema validation is reported as protected verification | separate Design validation and future V1/V2 receipt schemas | parent claim review | contained |
| `HG-09` | external L2 is inferred from repository-local identity | V3 explicitly unavailable | separate external L2 gate | blocked |
| `HG-10` | private Design bytes cross into public Arcanum | all writes stay in the private run root | parent path/publication audit | contained |

Protected blockers remain: exact Rondelli owner admission, Victor's direct
identity/verifier-role/policy/receipt-contract acceptance, V2 receipts for
high-impact slices, and future V1 checker implementation and execution for
ordinary protected slices. These do not prevent Design candidate authorship,
but they prevent owner admission and normal Plan continuation.
