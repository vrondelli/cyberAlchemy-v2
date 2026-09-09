# Proposal-only refresh patch: FPR-02B integrated consumer proof

This is a proposed patch set, not an applied change. It is deliberately scoped
to the artifacts below. Every row is a typed refresh signal from
`REFRESH-REPORT.md`; unrelated dirty-worktree changes are outside scope.

## 1. Backend type-test-engine completeness

Signal: `RS-FPR02B-REFRESH-001` (`status_changed`) and
`RS-FPR02B-REFRESH-002` (`artifact_drift`).

Target root:
`projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/`

Proposed updates:

- `PLAN.md`: set the gate narrative to “decision gate passed; implementation
  pending separate authorized Task Session”; retain production false and no
  implicit mutation. Replace the old connection ownership and relationship-
  deferred boundary with:
  `feature-with-independent-node-and-edge-files@1`, exact 13 backend kinds,
  exact 16 backend signatures, YAML formation authority, node JSON plus edge JSON
  source roots, and generated read models.
- `WORK-PACK.md`: close B-BTE-001/B-BTE-002 as decision dependencies; keep no
  SWU selected; add edge-proof and integrated-consumer slices; make the next
  route one dependency-ready Task Session rather than a decision gate.
- `IMPLEMENTATION-LAYERING.md`, `EXECUTION-PACK.md`, `EXECUTION-DISPATCH.json`,
  `DISTILL-VALIDATION.md`, `transport-report.json`, and `observability.json`:
  rebind waves and validation receipts to the successor profile, independent
  edge roots, exact causal proof, and integrated manifest. The dispatch must
  remain proposal/plan choreography, not execution.
- `work-pack/shared/CONTEXT.md`, `DECISIONS.md`, `GAPS.md`, and
  `TRACEABILITY.md`: replace resolved decision blockers with explicit residue:
  no `O_spec` artifact yet, edge schema/resolver not yet witnessed, IOLM gates
  not run, Body War adapter not yet created, and Craft/inventory pointers not
  yet synchronized.
- Existing task contracts: extend the contract, node-coverage, obligations,
  derivation, integration, and verify tasks so that each names the 13/16
  denominators, causal node/edge removal, provenance, and integrated consumer
  handoffs. Do not claim execution from a plan edit.
- New task contract proposed:
  `work-pack/tasks/TASK-BTE-EDGE-COVERAGE.md` for the one edge schema, same-
  feature/project-level roots, root-scope resolver negatives, and 16 causal
  composition/removal witnesses.
- New task contract proposed:
  `work-pack/tasks/TASK-BTE-INTEGRATED-CONSUMER-MANIFEST.md` for the exact
  BTE/IOLM/Body War/Craft manifest, posture field, digest comparison, declared
  writes, and fail-closed aggregate.

Non-goals: no schema/profile/compiler/fixture implementation, no generated
`O_spec`, no test execution, no production admission.

## 2. Interactive ontology learning-map consumer

Signal: `RS-FPR02B-REFRESH-004` (`route_changed`) and
`RS-FPR02B-REFRESH-003` (`evidence_added`).

Target root:
`cyberAlchemy-v2/development/interactive-ontology-learning-map/`

Proposed updates:

- `SPEC.md`: add the BTE handoff as an allowed read-only input with explicit
  `candidate`/`authoritative` posture, source/profile/graph/obligation/receipt
  identity, and the integrated-manifest reference. Preserve `G-DSV2-SG:
  BLOCKED`; no IOLM gate is closed by the FPR decision.
- `ARCHITECTURE-BUNDLE.md`, `WORK-PACK.md`, `IMPLEMENTATION-LAYERING.md`,
  `EXECUTION-PACK.md`, `INVOKE-PLAN.md`, and `DISPATCH.json`: route the IOLM
  proof as an independent consumer lane. It verifies unchanged semantic bytes,
  projection hash/invariance, graph/hierarchy/table/GET parity, and negatives;
  it cannot define `O_spec`, admit a profile, close FPR, or authorize release.
- `work-pack/tasks/TASK-IOLM-000B-DOMAINSPEC-SG-READINESS.md` and
  `TASK-IOLM-002-COMPILER.md`: add the BTE handoff identity and integrated
  manifest fields while keeping writes limited to the existing prototype scope.
- Shared work-pack context, decision, gap, and traceability files: record that
  the consumer proof is required by the integrated manifest but executable
  proof remains blocked until the IOLM-owned gate and its exact input posture
  pass.

Historical refresh receipts stay immutable.

## 3. Body War consumer contract

Signal: `RS-FPR02B-REFRESH-005` (`evidence_added`).

New proposed files under this working home:

- `BODY-WAR-CONSUMER.md`: private read-only consumer contract; source/profile/
  graph/receipt identity; candidate/authoritative posture; exact redacted-field
  allowlist; no callback, deployment, external origin, or provider dependency;
  future mutation requires explicit consent/CSRF decision.
- `body-war-consumer/fixture.json`: a redacted SuggestedTrack /
  ActivityEvidenceCandidate fixture referencing Body War source anchors without
  copying raw provider payloads or moving Body War app authority.
- `body-war-consumer/ADAPTER-CONTRACT.md`: maps only the declared read-only
  projection and fails closed on undeclared fields, private-path leakage,
  mismatched digests, unknown IDs, or stale receipts.

The source contracts in `projects/body-war/docs/features/parque-taquaral-online-mvp/`
remain authoritative for Body War behavior. These files are consumer proof,
not a replacement application spec.

## 4. Integrated evidence manifest

Signal: `RS-FPR02B-REFRESH-006` (`route_changed`) and
`RS-FPR02B-REFRESH-003` (`evidence_added`).

New proposed file:
`INTEGRATED-EVIDENCE-MANIFEST.yml` under this working home.

Required fields:

- manifest/profile/source/registry/schema/graph/generated-root digests;
- independent `O_spec`, engine `O_gen`, generated `T_gen`, and executed `E_run`
  identities and exact-set comparison;
- BTE receipt plus IOLM consumer receipt plus Body War consumer receipt;
- candidate/authoritative posture and the IOLM gate state;
- required commands, declared writes, generated outputs, and stable negatives;
- Craft continuation pointer and accountable role IDs;
- revocation rule for any source, rule, consumer-posture, or receipt-input drift.

The manifest must fail closed for missing, extra, duplicate, stale, skipped,
unrunnable, wrong-root, wrong-scope, unknown-ID, redaction, or surviving-mutant
evidence. It must not imply UI-lane completion or production authorization.

## 5. Craft and inventory continuation

Signals: `RS-FPR02B-REFRESH-006` (`route_changed`) and
`RS-FPR02B-REFRESH-007` (`artifact_drift`).

Propose, but do not apply, the following pointer changes:

- `projects/domainspec-v2/.craft/ledger.yml`: add a child context for the
  FPR-02B integrated consumer-proof route, artifact mappings for this refresh,
  the BTE plan, the IOLM consumer handoff, Body War consumer contract, and the
  integrated manifest; update the backend next move to consume the accepted
  decision and choose a Task Session SWU.
- `cyberAlchemy-v2/.craft/ledger.yml`: add an umbrella pointer to the scoped
  consumer-proof context and keep the working-home files as candidate/working
  artifacts only.
- `.arcanum/inventory/`: after applied artifacts pass validation, add reviewed
  entries for the BTE integrated-proof plan, IOLM consumer handoff, Body War
  consumer contract, and integrated manifest. Record the existing partial
  source coverage as a gap until that backfill is complete.

No Craft row or inventory index is changed in proposal-only mode.

## 6. Engine path/authority review

Signal: `RS-FPR02B-REFRESH-008` (`artifact_drift`).

Before apply, the owner must choose and document the canonical v2 engine path
for the successor profile. The legacy
`implementation/domainspec/tools/test-derivation-engine/` skeleton and the v2
`projects/domainspec-v2/impl/test-derivation-engine/` engine must not be merged,
copied, or treated as interchangeable. Any local Craft source-of-truth drift is
an explicit blocker to implementation handoff, not a reason for this refresh to
rewrite the ledger.

## Apply gate

Application requires an explicit `apply-approved` Invoke refresh or a separately
authorized Task Session. On apply, validate JSON/YAML, dispatch, Craft pointers,
inventory entries, source/profile/consumer schema digests, and scoped whitespace;
then select exactly one dependency-ready SWU. Until then, this proposal is the
only output beyond the dated refresh package itself.
