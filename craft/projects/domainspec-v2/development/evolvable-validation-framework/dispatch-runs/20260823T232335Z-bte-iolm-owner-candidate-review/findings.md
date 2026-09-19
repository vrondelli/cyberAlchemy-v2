# EVF BTE/IOLM owner-candidate review findings

## BTE prerequisite surface

| # | file | evidence | severity | proposed fix |
|---|---|---|---|---|
| BTE-1 | `refreshes/20260823T124309Z-l3-17-signature-proposal-only/requests/BTE-FREEZE-ADMISSION-CATALOGUE-REQUEST.json` and its eleven `requested_outputs[].expected_path` targets | Attack A1 reports: “All eleven requested canonical output paths are absent.” Parent recheck found all eleven paths absent and all six request-bound source digests and sizes exact. | BLOCKING | Each named independent owner must materialize a real response at its requested path, with its actual post-write digest and size. A template, review candidate, or planning-owner statement cannot substitute. |
| BTE-2 | `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/PLAN.md:121` and `work-pack/tasks/TASK-BTE-L4-CATALOGUES.md:30` | The artifacts say “exact 16 admitted family identities” and “exact admitted 16”; Attack A1 verified that the live candidate profile and proof inputs use 17 and include `creates`. | MAJOR | Obtain the relationship/profile owners’ explicit denominator decision. If 17 is accepted, reconcile every authority-bearing BTE 16-family surface as a new exact candidate and revalidate; do not silently reinterpret the existing 16-family contract. |
| BTE-3 | Requested `node-instance-conformance-at-1.freeze.json` and `edge-instance-conformance-at-1.freeze.json` | Attack A1 reports: “No exact build-node-ID or build-edge-ID freeze evidence was found at the requested canonical locators.” Parent recheck confirmed both requested targets are absent. | BLOCKING | The independent validation owner must bind the exact build node and edge ID sets, materialize the two freeze artifacts, and validate their own bytes. |
| BTE-4 | `definitions/minted-project/supported-profiles.yml` and `relationship-profile-17-admission.json` | Attack A1 quotes the current profile state as `candidate` with `release_admission: not-granted`; the joint admission target is absent. | BLOCKING | Relationship and profile owners must jointly author the exact 17-member admission, including the real artifact digest and explicit non-inflating authority effect. |

Verdict: **FIX**. The review work is complete, but BTE owner prerequisites remain blocked; none of the eleven candidates is admitted.

## IOLM DSC-A prerequisite surface

| # | file | evidence | severity | proposed fix |
|---|---|---|---|---|
| IOLM-1 | `refreshes/20260823T124309Z-l3-17-signature-proposal-only/requests/IOLM-DSC-A-PREREQUISITE-REQUEST.json` | Attack A2 reports: “No fresh schema-valid SWU-IOLM-DSC-A receipt or exact receipt locator exists.” Its exact contract digest matches the request, but the expected locator remains unresolved. | BLOCKING | Run a fresh owner-controlled DSC-A Task Session after its candidate-substrate prerequisites pass; emit the receipt under `prototype/runs/domainspec-consumer/<run-id>/` and return its exact path, digest, size, upstream handle, and validation. |
| IOLM-2 | `owner-response-packets/20260823T195640Z-runtime-repair-and-p0/iolm-01-private-product-owner.json` and `decision-runs/20260823T201735Z-iolm-predecessor/DECISION.json` | Attack A2 verified that the packet is an uncompleted template and that the decision preserves DSC-A but has no receipt effect. | MAJOR | Preserve both as planning/governance evidence only. The private IOLM product owner must independently author the requested response after the real execution receipt exists. |
| IOLM-3 | `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/execution-receipt.json` | Attack A2 rehashed the receipt and reports `result: block`; therefore the required candidate-substrate handle is unavailable. | BLOCKING | Resolve the 00C-B/C substrate work under its own owner and task contract before attempting DSC-A. DSC-B remains blocked until DSC-A passes or the owner separately changes the predecessor. |

Verdict: **FIX**. The review work is complete, but the IOLM DSC-A domain gate remains blocked and no passing owner response can yet be authored honestly.

## Accepted change-request list

1. Resolve the IOLM 00C-B/C candidate-substrate blocker, then run an owner-controlled DSC-A Task Session and return the exact passing receipt.
2. Obtain an explicit relationship/profile owner decision on the BTE 16-versus-17 relationship denominator.
3. After that decision, have the named BTE owners independently materialize and validate all eleven requested freeze/admission/catalogue artifacts, including exact build node and edge sets.
4. Re-run the P0 prerequisite and immutable-frontier readiness checks only after those exact owner bytes exist.

Parent final-approver decision: **accepted as a review closeout**. Every surviving finding is cited to Attack A1 or A2 and independently rechecked where the live corpus permits. No finding was refuted, no zero-findings flag applies, and this acceptance does not accept any candidate response or open an execution gate.
