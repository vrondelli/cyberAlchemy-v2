# ARE release-readiness documentation implementation status

Status date: 2026-09-17.
Plan: [`PLAN.md`](PLAN.md), revision 2.
Documentation candidate: `ARE-DOCUMENTATION-CANDIDATE-002`.
Authority effect: none.

## Outcome

All seven requested documentation families now have reachable artifacts. The
implementation finishes the work that can be supported by Candidate 018 source,
test, and package-lifecycle evidence, and gives unavailable operational or
policy documents an explicit inactive state. It does not fabricate the owners, service traffic,
trusted release signature, upgrade pair, vulnerability intake, or legal
applicability needed to activate them.

The machine-verified documentation surface currently contains 40 manual pages.
The documentation release manifest binds the manual, generators, verifiers,
release-readiness ledger, and source-distribution lifecycle evidence. The
generated API reference selects
16 package entrypoints with 510 runtime exports and five schemas with 127 field
occurrences.

## Task status

| Tasks | Status | Evidence or exact blocker |
| --- | --- | --- |
| DR-00, DR-01, DR-06 | Complete for the local candidate | Research/product facts are bound; the [documentation contract](../../../../implementation/agent-reasoning-engine/docs/DOCUMENTATION-CONTRACT.md) and all inactive first pages exist |
| DR-02 | Complete for candidate scope | Product owner selected sale and customer delivery of the full self-contained ARE software without Alch or DomainSpec; Candidate 018 materializes and tests that boundary, while exact Keld-derived legal terms remain gated |
| DR-03 | Complete for the current candidate | [`api-surface.json`](../../../../implementation/agent-reasoning-engine/docs/reference/api-surface.json) classifies all 16 selected entrypoints, their 510 enumerated exports, and five schemas as candidate-internal; generated and excluded classes are explicit, the public-supported set is empty, and a negative test prevents promotion before DR-04 |
| DR-04 | Complete as selected, not activated | [`release-policy.json`](../../../../implementation/agent-reasoning-engine/docs/release-policy.json) selects the commercial full-software download, digest-binds the latest Keld candidate license direction, and points to the verified [`license-requirements.json`](../../../../implementation/agent-reasoning-engine/docs/license-requirements.json); it selects the decision CLI and JSON-lines process adapter for support, keeps package imports internal, starts at `0.10.0-rc.1`, and fixes tag, changelog, correction, deprecation, and predecessor rules; no sale or release effect has occurred |
| DR-05 | Complete | Vladimir Rondelli owns product/release, artifact/deployment, security/incident response, privacy/retention, and compliance coordination; security and support share the supplied contact, while reliability/SLO remains not applicable without a Keld-operated service |
| DR-10, DR-12 | Complete for candidate-internal scope | Deterministic generator and drift test produce [`API-FIELDS.md`](../../../../implementation/agent-reasoning-engine/docs/reference/API-FIELDS.md) from exact selected sources |
| DR-11 | Complete for candidate-internal scope | The versioned [`api-field-annotations.json`](../../../../implementation/agent-reasoning-engine/docs/reference/api-field-annotations.json) registry covers all 127 fields with descriptions, required/default/deprecation/access/sensitivity metadata and five schema-validated examples; coverage drift fails generation |
| DR-20 | Complete for retained candidate evidence | Generated [`candidate-history.json`](../../../../implementation/agent-reasoning-engine/docs/releases/candidate-history.json) binds all retained candidate records, detects missing identity 009, and computes source-scope deltas between consecutive immutable closures; the selected DR-04 taxonomy is explicit |
| DR-21 | Partial | Product-root [`CHANGELOG.md`](../../../../implementation/agent-reasoning-engine/CHANGELOG.md) records candidate history and the selected taxonomy; accepted release history awaits the first frozen and approved `0.10.0-rc.1` successor |
| DR-22 | Complete for retained internal candidates | The current [Candidate 018 note](../../../../implementation/agent-reasoning-engine/docs/releases/0.10.0-self-contained-candidate.7.md) and retained notes bind identity, scope, evidence, limits, and approval posture |
| DR-30 | Complete for the tested successor construction | Candidate 018 remains the immutable 907-file baseline. The deterministic successor materializer removes the outer repository wrapper and legacy identity, emits ARE/Keld `0.10.0-rc.1`, and records closure digest `fddea40c…` with zero legacy identity matches |
| DR-31 | Complete for source distribution | A fresh successor materialization passed doctor and all 1,158 tests across 146 test files; [`commercial-successor-materialization-receipt.json`](../../../../implementation/agent-reasoning-engine/docs/commercial-successor-materialization-receipt.json) binds the result |
| DR-32 | Complete for the disposable local topology | The [lifecycle receipt](../../../../implementation/agent-reasoning-engine/docs/releases/0.10.0-self-contained-candidate.7-lifecycle-receipt.json) binds two identical archives plus install, health, seven gateway restart/reconnect cases, injected source failure, rollback, 0600 gateway-session and Reasoning-State backups, corruption detection, exact restore and uninstall; trusted signing is tracked separately as a release-policy gate |
| DR-33 | Complete for local source-package procedure | [`DEPLOYMENT.md`](../../../../implementation/agent-reasoning-engine/docs/DEPLOYMENT.md) reproduces the exact archive drill; managed-service and other topologies remain unsupported |
| DR-40 | Complete for the current candidate | The machine-readable [`compatibility-matrix.json`](../../../../implementation/agent-reasoning-engine/docs/compatibility-matrix.json) inventories 10 current reader/writer boundaries across artifact, configuration, credential, journal, protocol, schema, and state; its receipt verifies Candidate 018 binding and source presence. A future version pair remains DR-41. |
| DR-41, DR-42 | Blocked by missing successor | No exact supported version pair, migration implementation, fixtures, rollback, or downgrade evidence |
| DR-43 | Initial posture complete | [`MIGRATION-AND-UPGRADE.md`](../../../../implementation/agent-reasoning-engine/docs/MIGRATION-AND-UPGRADE.md) truthfully says no supported path and states the first procedure gate |
| DR-50 | Partial with owner and contact selected | Vladimir Rondelli owns security and the supplied contact is recorded; delivery/escalation verification and report-handling tabletops remain required before activation |
| DR-52, DR-53 | Blocked by unverified security intake | The [security page](../../../../implementation/agent-reasoning-engine/docs/SECURITY-POLICY.md) is `DRAFT_INACTIVE`; the first possible successor version is selected, but no public root policy, accountable intake, or tabletop exists |
| DR-51 | Partial for Candidate 018 | The [candidate threat model](../../../../implementation/agent-reasoning-engine/docs/THREAT-MODEL.md) binds the tested local package's assets, actors, trust boundaries, twelve threats, controls, residue and topology-change gates to the selected successor policy; owner review and risk acceptance remain open |
| DR-60–DR-63 | Blocked by missing operated service | There is no service identity, telemetry contract, representative traffic baseline, alerting, or game-day path |
| DR-64, DR-65 | Initial posture complete | [SLOs](../../../../implementation/agent-reasoning-engine/docs/SERVICE-LEVEL-OBJECTIVES.md) and the [runbook](../../../../implementation/agent-reasoning-engine/docs/SERVICE-RUNBOOK.md) are separate `NOT_APPLICABLE` documents with exact activation gates |
| DR-70 | Complete for product-owner classification | Intended use, prohibited uses, United States/European Union/Brazil markets, customer-controlled data roles, no-operated-service posture, and no-voluntary-certification posture are recorded |
| DR-71–DR-72 | Blocked by qualified mapping/review | Applicable market obligations still require evidence mapping and independent qualified review |
| DR-73 | Initial posture complete | [`COMPLIANCE.md`](../../../../implementation/agent-reasoning-engine/docs/COMPLIANCE.md) separates applicability, evidence, gaps, assessment, and certification |
| DR-80 | Complete | Manual paths, manifest, source map, coverage map, implementation pointer, and product README agree |
| DR-81 | Partial with passing bounded receipt | Generators, drift, metadata, reachability, selected-file digests, and local links pass; operational examples, contact tests, drills, and domain evidence remain gated with their lanes |
| DR-82 | Partial | Documentation-level cross-review is recorded in [`IMPLEMENTATION-REVIEW.md`](IMPLEMENTATION-REVIEW.md); independent product/security/reliability/compliance review remains unavailable |

The machine-readable [`release-readiness.json`](../../../../implementation/agent-reasoning-engine/docs/release-readiness.json)
accounts for all 38 plan tasks. Its verifier rejects missing tasks, unsupported
completion, missing evidence paths, and incomplete work without an owned next
gate. The current receipt records 23 complete, five partial, zero awaiting owner,
six prerequisite-blocked, and four not-applicable tasks.

## Next executable order

~~~mermaid
flowchart TD
    A[Owner decisions recorded: DR-03/04/05/70] --> R[Engineering source-rights review complete]
    R --> E[Standalone ARE/Keld 0.10.0-rc.1 passes 1,158 tests]
    E --> Q[Qualified provenance exact-license and market review]
    A --> F[Verify security contact and run tabletops: DR-50-52]
    F --> G[Activate public security policy: DR-53]
    A --> H[If a service is selected define telemetry SLIs and baseline: DR-60-62]
    H --> I[Game day and activate SLO/runbook: DR-63-65]
    Q --> K[After first release select later successor pair: DR-41]
    K --> L[Test upgrade and activate migration guide: DR-42/43]
    A --> M[Map US EU and Brazil obligations and qualified review: DR-71/72]
    M --> N[Activate compliance guide: DR-73]
    E --> Z[Final domain cross-review and new documentation receipt: DR-81/82]
    G --> Z
    I --> Z
    L --> Z
    N --> Z
~~~

The candidate-internal construction lane and local package lifecycle are now
complete. The owner-decision frontier is also complete. The next runnable work
is provenance review of the source-rights inventory followed by the standalone ARE/Keld
`0.10.0-rc.1` successor. Contact testing, qualified market review, and exact
legal-text approval remain evidence gates. The selections are recorded in the
[`OWNER-DECISION-PACKET.md`](OWNER-DECISION-PACKET.md).
Candidate 013 is excluded as the first distributable artifact by exact
preflight evidence; Candidate 018 is its tested self-contained successor.

## Verification

Run from `implementation/agent-reasoning-engine`:

~~~sh
node docs/generate-api-reference.mjs --check
node --test docs/generate-api-reference.test.mjs
node docs/verify-compatibility-matrix.mjs --check
node docs/verify-license-requirements.mjs --check
node docs/verify-release-owner-decisions.mjs --check
node docs/generate-source-rights-inventory.mjs --check
node docs/verify-release-readiness.mjs --check
node docs/verify-docs.mjs
node docs/verify-release-manifest.mjs
~~~

The current receipt is
[`release-receipt.json`](../../../../implementation/agent-reasoning-engine/docs/release-receipt.json).

## Open Questions

- Will the product owner select the first distribution and public-surface policy,
  or keep ARE as a private local candidate for another iteration?
- Should the candidate-internal annotation registry later move into public
  contract schemas when a supported API surface is selected?
