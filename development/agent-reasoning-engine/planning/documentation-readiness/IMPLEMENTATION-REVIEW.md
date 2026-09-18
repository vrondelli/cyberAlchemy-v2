# Review of the ARE release-readiness documentation implementation

Review date: 2026-09-17.
Reviewed plan: [`PLAN.md`](PLAN.md), revision 2.
Reviewed documentation candidate: `ARE-DOCUMENTATION-CANDIDATE-002`.
Reviewer posture: internal documentation and source-evidence review; no domain
owner approval, public publication, deployment, policy activation, or legal
assessment.

## Review method

The review checked every requested family against its source evidence, plan
gate, lifecycle status, manual route, local links, generated-reference drift,
candidate identity, and language that could be mistaken for an active promise.
It also checked that documentation bytes are not attributed to the older frozen
product closure.

## Findings and resolution

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| IR-01 | High | Generated API source links were one directory too shallow | Generator path calculation corrected; regeneration and link validation pass |
| IR-02 | High | The old coverage map still described every requested guide as deferred | Replaced with links, exact lifecycle status, and evidence-based activation triggers |
| IR-03 | High | Documentation bytes were outside the product closure with no separate integrity record | Added an 85-file Candidate 018-bound documentation release manifest and bounded verification receipt |
| IR-04 | Medium | Product entrypoints did not expose the new history and lifecycle pages | Updated the manual index, implementation documentation pointer, product README, source map, API guide, and release guide |
| IR-05 | Medium | A combined “runbook and SLO” page would mix policy targets with operator procedures | Preserved the reviewed plan's two-document split and separate owners/gates |
| IR-06 | Medium | A combined “release notes and changelog” output would mix cumulative history with one-candidate communication | Added a product-root changelog and a separate versioned Candidate 013 note |
| IR-07 | Medium | Inactive pages could appear active if their status labels drifted | Main verifier now checks the exact lifecycle value and all six metadata fields for every release-readiness document |
| IR-08 | Medium | The generated field reference could drift silently | Main verifier regenerates it in memory; generator test verifies deterministic selected counts and the release receipt binds its bytes |
| IR-09 | Low | Candidate history has no retained Candidate 009 | Changelog states only that the identity is absent and makes no causal inference |
| IR-10 | High | The first generated reference exposed 127 fields with no descriptions or field-level handling metadata | Added a closed annotation registry, validated examples, exact coverage enforcement, and an explicit negative coverage test without modifying frozen Candidate 013 schemas |
| IR-11 | Critical | Candidate 013's stated workspace-input limitation did not prove whether exact artifact reconstruction remained possible | Added an exhaustive preflight. The latest explicit snapshot finds 465 frozen files unresolved, including 457 DomainSpec compiler outputs, six Alch compiler outputs and two additional DomainSpec records; the closure contains no corresponding DomainSpec compiler sources, so Candidate 018 supplies the corrected construction chain |
| IR-12 | High | The documentation release verifier still bound Candidate 013 after the manifest selected Candidate 018 | The verifier now resolves the candidate from the documentation manifest and binds Candidate 018's exact candidate and closure digests |
| IR-13 | High | Candidate 018 had no reproducible archive, install, failure-recovery, rollback, or uninstall evidence | Added a two-build deterministic archive drill and a closure-bound receipt; later extended it with two-store recovery while keeping trusted signing as a separate remaining gate |
| IR-14 | Medium | Candidate 018's release note linked Candidate 015 test and canary receipts | Corrected both links to Candidate 018 and added the lifecycle receipt |
| IR-15 | High | The selected local distribution had no exact threat model and generic security prose could not expose topology-specific residue | Added a Candidate 018 model with assets, actors, trust boundaries, twelve threats, current controls, residual gaps and explicit re-modeling triggers; risk acceptance and public policy remain owner-gated |
| IR-16 | High | Main documentation verification recomputed a historical Candidate 013 audit against mutable sibling workspaces, so unrelated changes could create minute-to-minute documentation drift | Kept the explicit refresh tool and its deterministic test, but changed the main verifier to validate the stored historical record's exact candidate binding and internal accounting; Candidate 018 current evidence remains a strict release gate |
| IR-17 | High | Markdown status could omit a DR task, lose the original objective/method, or mark work complete without machine-checkable evidence | Added a Candidate 018-bound 38-task ledger and negative-tested verifier requiring exact plan coverage, evidence paths, owner roles, blockers and next gates; the documentation release verifier now runs and binds it |
| IR-18 | High | Source rollback did not prove recovery of the two durable local stores named by the topology | Extended the exact installed-artifact drill to back up gateway sessions and Reasoning State with mode `0600`, inject corruption into both, require fail-closed detection, restore exact bytes, and verify event heads and the recovered checkpoint |
| IR-19 | High | The release path named trusted signing as a gap but had no tested mechanism ready for an owner-managed identity | Added Ed25519 statement signing and verification bound to Candidate 018, archive bytes and key fingerprint, with negative tests for tampering, wrong keys and permissive private-key modes; identity and key distribution remain owner decisions |
| IR-20 | Medium | Current compatibility-boundary inventory and future predecessor/successor migration evidence were conflated, leaving DR-40 open for evidence owned by DR-41 | Added a Candidate 018-bound matrix covering 10 reader/writer boundaries in all seven required categories, plus a negative-tested verifier; the matrix explicitly claims no supported version pair |
| IR-21 | High | The API guide labeled candidate-internal package files as public entrypoints, and DR-03 current classification was conflated with DR-04 public promotion | Renamed the table, made the empty public-supported set and export inheritance rule machine-readable, added a negative promotion test, and left public support exclusively gated by DR-04 |
| IR-22 | High | The release frontier had recommendations but no closed decision record for version semantics, supported contracts, tag form, changelog corrections, deprecation, or the first-version predecessor posture | Added a Candidate 018-bound release policy and negative-tested verifier selecting `0.10.0-rc.1` while explicitly preventing the decision from being presented as an activated release |
| IR-23 | Critical | ARE documentation still treated distribution as a private package after the owner clarified that customers buy the complete software under Keld's license direction; Keld sources also contain an older Apache-2.0 position that conflicts with the latest custom-license intent | Updated the commercial boundary, digest-bound the latest Keld license research, preserved the full source closure, separated sold software from supported interfaces, and made exact legal text plus rights/notice review an activation gate |
| IR-24 | High | The candidate resale rule left bug fixes, hosted access, and paid support open to conflicting interpretations | Recorded the owner decision: fixes alone do not qualify a redistributed copy for resale, while hosted access and paid support are service activities outside the redistributed-copy resale rule; added negative verifier coverage |
| IR-25 | High | Keld's historical notice audit covered a different 3,000-plus-file archive and could be mistaken for clearance of the 907-file Candidate 018 closure | Added a Candidate 018-bound commercial-license requirements specification and negative-tested verifier that inventories the current closure, labels the old audit `HISTORICAL_DIFFERENT_CLOSURE`, and binds eight resolved owner decisions while preserving qualified-review and evidence gates |
| IR-26 | High | Commercial identity, markets, accountable owners, contacts, data posture, and license directions were scattered or unresolved, and the sellable successor could retain an unwanted repository-wrapper identity | Added a negative-tested owner-decision record selecting ARE/Keld identity, Vladimir Rondelli ownership and accountability, United States/European Union/Brazil markets, local customer control, license directions, and a no-legacy-identity rule for `0.10.0-rc.1` |
| IR-27 | High | Package-manifest counts could not show file-level ownership, embedded rights markers, or notice candidates across the 907-file closure | Added a deterministic file-level and 134-family source-rights inventory that verifies every bound digest, records the owner assertion, scans SPDX/copyright/license signals, and keeps provenance and qualified clearance explicit |
| IR-28 | High | The technical source-rights inventory had no explicit disposition for its 134 families or sole notice signal | Added a verified engineering review covering every family. The only signal is policy prose instructing future vendored-source disclosure, not an embedded license or current vendored-source notice; qualified provenance and license clearance remain explicit gates |
| IR-29 | Critical | The sellable successor existed only as a hand-transformed prototype and retained untested path, digest, and legacy-identity risks | Added a deterministic Candidate 018 successor materializer, rebound derived identities, removed the outer wrapper and legacy product identifiers, and reproduced a clean ARE/Keld `0.10.0-rc.1` closure with doctor PASS and all 1,158 product tests passing |

## Negative claim review

- Deployment is `READINESS_ONLY`; its local package command is backed by the
  lifecycle receipt, while production service commands remain absent.
- Migration is `NO_SUPPORTED_PATH` and contains prerequisites rather than a
  claimed migration implementation.
- Security policy is `DRAFT_INACTIVE` and contains no fabricated contact, safe
  harbor, response promise, or supported-version claim. The separate threat
  model is `CANDIDATE_INTERNAL` and makes no risk-acceptance claim.
- SLOs and runbook are `NOT_APPLICABLE` and contain no numerical target, pager,
  dashboard, or escalation contact.
- Compliance is `DRAFT_INACTIVE` and contains no applicability conclusion,
  conformity claim, or certification.
- Candidate history and the API inventory are `CANDIDATE_INTERNAL`; neither is
  described as a supported public release or stable SDK.

## Verification result

The bounded documentation checks pass. They verify deterministic API generation,
selected-source availability and digests, required manual structure, lifecycle
metadata, index reachability, local links, the Candidate 018-bound documentation
manifest, and the source-package lifecycle receipt. They do not substitute for
the missing domain-owner decisions, trusted signing, production-profile recovery or
live service evidence listed in [`IMPLEMENTATION-STATUS.md`](IMPLEMENTATION-STATUS.md).

## Review conclusion

The implementation is accepted as a truthful **candidate-internal documentation
baseline**. It is not accepted as a production deployment, upgrade procedure,
public security policy, service commitment, or compliance statement. The local
source-package procedure is accepted as reproducible candidate evidence.
Activation remains blocked at the specific plan gates rather than at
documentation authoring.

## Open Questions

- Who will perform the first independent domain review after the product owner
  selects a distribution?
- Should inactive status rendering also receive a future website-level visual
  regression test when the manual has a renderer?
