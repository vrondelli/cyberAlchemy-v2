# Bounded production composition R2

R2 retains the reviewed production verifier, launcher R3, generation process/storage R2 and scorer R2. The additive composition awaits qualification before directory creation and executes qualification/scoring in dedicated supervised processes. Qualification is limited to 120 seconds; scoring to one hour. Each uses one second cancellation grace and the supervisor's five-second local group-settlement check. Generation remains limited to 150 minutes with its existing cancellation grace.

The scoring child receives serializable arguments only. It verifies the frozen request, generation metadata/manifest/settlement hashes, successful local generation settlement and absence of the generation process group before and after evaluation. It retains the scorer's own reconciliation and prediction checks, per-evaluator bounds, private-source cleanup, and fresh storage admission. The parent rechecks its original settlement callback before and after the scoring child and rejects any drift. A child report alone does not establish parent acceptance; the final launcher report owns acceptance.

Every stage attempts process settlement on success and failure. Failures retain the returned stage result and settlement on error.result. The launcher still recovers token costs from sealed/raw outcomes and ledgers after scoring failure; no timeout becomes successful zero-cost evidence. Model generation occurs only in the existing generation child.

The command environment must include `NODE_OPTIONS=--experimental-vm-modules` so the dedicated children can verify static module closure. The final source freeze must bind R2 composition, stage wrapper and the dynamically selected worker in addition to original required files.

Fourteen offline tests pass: nine production composition/qualification tests and five actual subprocess tests. They cover asynchronous preflight rejection before directory creation, exact review, settlement despite drift, parent post-score rejection, child failure preservation, deadline termination and malformed worker input before provider/evaluator access. They do not constitute a twelve-outcome model run or evaluator composition result.

## Construction and operations

Product frontier: independent review of R2 stage composition, then exact production freeze and live command. Coordinator owns serializable stage binding and source freeze; reviewer owns technical review. Fresh D:/WSL capacity and existing benchmark credentials are required at invocation. All three arms, twelve fixed outcomes, two generation workers, 8K requests, 96K/96-call per-arm caps and quality/+15% criteria remain unchanged.

## Open Questions

Independent review is pending. Real preflight qualification already passed; actual bounded production qualification must consume those exact audited artifacts. Full model generation, native scoring, research observation/decision and untouched confirmation remain required. The radical retrieval-first branch remains a proposal outside this frozen comparison.
