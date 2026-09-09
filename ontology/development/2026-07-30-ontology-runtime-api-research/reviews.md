# Runtime/API Adversarial Reviews

The following reviewer returns are preserved verbatim.

## Reviewer 1 — Precedent and duplicate ownership

# Precedent and duplicate-ownership review

**Verdict: NEEDS_FEEDBACK**

The candidate is directionally owner-preserving: it rejects ontology/source CRUD, promotion endpoints, generic vocabulary ownership, copied project validators, and UI authority. However, it cannot pass to the writer until four runtime-owned lifecycles are bound to named owners. The synthesis currently lists those owners as unresolved while simultaneously accepting registration and the runtime design for v0 (`synthesis.md:477-500`).

## Mandatory repairs

1. **Do not accept the registry until its owner and authority ceiling are named.**  
   The proposed startup registry is not an Inventory replacement if it remains a configured, implementation-local projection: Inventory owns compiled discovery indexes and source-backed lookup (`arcanum/arcana/inventory/SKILL.md:129-147`, `:179-182`), while the runtime registry merely binds already-selected package/profile/adapter identities. But the synthesis says the implementation and registration-document owner is unresolved (`synthesis.md:479-481`) while declaring explicit registration “Accept for v0” (`synthesis.md:498-500`). Repair the verdict to **blocked pending runtime-contract owner**, and label the registry `[ABSENT ADAPTER: implementation-local configured registration projection]`; it must not discover, ingest, index, or select ontology truth.

2. **Bind snapshot, run, retention/GC, and service transitions to an implementation owner before admitting their APIs.**  
   The synthesis proposes snapshot creation/publication/reuse/collision, runs with `queued|running|succeeded|failed|cancelled`, offline GC, and serve/stop lifecycle (`synthesis.md:180-216`, `:293-308`) but leaves implementation ownership, GC/retention, and operation permission unresolved (`synthesis.md:479-485`). CyberAlchemy v2 assigns runtime contracts to `task-session` after owner gates, not to research or useful precedent (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:50-61`). Require a named owner for each transition:
   - registration configured → verified/rejected;
   - package locked → compiled → published/reused/failed;
   - run queued → running → terminal;
   - snapshot retained → GC-eligible → deleted;
   - service stopped → ready → stopped.  
   Until then, these are `[DESIGNED, OWNER-ABSENT]`, not accepted runtime behavior. Remove `cancelled` unless a concrete cancellation command, actor, and transition owner are specified.

3. **Constrain the run plane so it cannot duplicate Dispatch Spec or Orchestrate.**  
   `POST /v1/runs` permits unspecified “profile-allowed evidence/report operations” (`synthesis.md:178-186`). Ontology Vault explicitly routes agent-backed execution through the governed subagent strategy and treats returns as non-authority evidence (`arcanum/arcana/ontology-vault/SKILL.md:156-177`). Dispatch Spec owns route validation and gated lifecycle shape (`arcanum/formulae/dispatch-spec/SKILL.md:65-101`); Orchestrate owns preflight, native scheduling, joins, gates, and closeout (`arcanum/runtime/orchestrate/SKILL.md:63-68`, `:77-129`). Repair v0 to an exact allowlist of **in-process adapter compilation, native project validation, and deterministic same-adapter diff only**. Any delegated/agent-backed operation must return `OPERATION_UNSUPPORTED` with the Orchestrate owner route; the runtime must not queue, spawn, join, retry, interrupt, gate, or close agents.

4. **Reuse the existing promotion-request artifact and lifecycle; do not create a second handoff owner.**  
   The proposed handoff fields closely duplicate the existing promotion-request shape, whose lifecycle is already `draft-request -> owner-review -> accepted-for-review|deferred|blocked|rejected -> owner decision` (`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-28`, `:30-51`). Rename or explicitly type the runtime output as a **PromotionRequest-compatible draft artifact** owned by the existing ontology promotion-request route. The runtime may create and retrieve immutable bytes, but must own no “handed off,” accepted, deferred, blocked, rejected, or owner-response state. The synthesis already correctly forbids contacting the owner or applying a delta (`synthesis.md:188-193`, `:336-345`); make the object model match that ceiling.

## Positive precedent findings

- `[BUILD-FROM-OWNED: ONTOLOGY-VAULT-PROFILE]` Profile refs, allowed/blocked outputs, owner gates, residue, and local aliases already belong to Ontology Vault; reuse them without minting a generic vocabulary (`arcanum/arcana/ontology-vault/SKILL.md:98-117`, `:156-177`).
- `[BUILD-FROM-DESIGNED: IOLM-IMMUTABLE-READ]` Immutable snapshots, bounded GETs, stable IDs, ETags, source-manifest containment, and read-only API posture have an IOLM design owner, but are not implemented precedent (`synthesis.md:159-176`; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:64-83`, `:99-108`, `:129-131`).
- `[BUILD-FROM-IMPLEMENTED: OEW-ADMISSION-GATEWAY]` Contained admission, deterministic create-only adapter output, loopback GET/HEAD serving, and teardown have OEW precedent; the generic runtime must compose rather than absorb OEW (`synthesis.md:293-310`; `cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:167-190`, `:239-253`, `:321-336`).
- `[RETAINED OWNER: AUGMENTOR VALIDATOR]` The adapter may invoke and wrap Augmentor validation but cannot reinterpret its status or digests (`synthesis.md:324-328`; `projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`).
- `[RETAINED OWNER: BODY-WAR VALIDATOR/POLICY]` Body War owns its validator and lifecycle-transition diagnostics; the runtime may expose the diagnostic result but not become the transition-policy owner (`synthesis.md:330-334`; `projects/body-war/ontology/business/README.md:17-37`; `projects/body-war/ontology/business/receipts/validation-receipt.json:11-27`, `:37-54`).
- `[ABSENT ADAPTER: CAV2-MARKDOWN]` Correctly blocked pending an owner-approved CAV2 profile; do not treat Markdown model documents as a live schema (`synthesis.md:314-322`, `:510-510`).

## Optional simplifications

- For v0, collapse the query catalog to snapshot metadata, record list/get, sources, and validation receipt retrieval. Add search, neighborhoods, relations, views, and residue only when the admitted adapter declares the capability. IOLM’s broader API is design precedent, not a requirement to reproduce every family immediately (`synthesis.md:161-176`).
- Remove `/v1/metrics` and `/v1/events` from v0 unless an observability owner and retention contract are named; health/readiness plus immutable receipts are sufficient for the first witness.
- Replace the generic `owner_routes: string[]` registration field with exact typed references already present in each profile. Augmentor already distinguishes package, meaning, runtime, dispatch, execution, memory, and authority owners (`projects/augmentor/ontology/unified-agent/profile.json:15-23`); flattening them risks creating a weak second owner directory.

```yaml
action_id: spawn-0005
status: fail
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/runtime-api-synthesis.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/synthesis.md
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/research.md
  - arcanum/arcana/ontology-vault/SKILL.md
  - arcanum/arcana/inventory/SKILL.md
  - arcanum/formulae/dispatch-spec/SKILL.md
  - arcanum/runtime/orchestrate/SKILL.md
  - cyberAlchemy-v2/authority/AUTHORITY-MODEL.md
  - cyberAlchemy-v2/ontology/promotion-requests/README.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md
  - cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md
  - projects/augmentor/ontology/unified-agent/profile.json
  - projects/augmentor/ontology/unified-agent/scripts/validate.mjs
  - projects/body-war/ontology/business/profile.json
  - projects/body-war/ontology/business/README.md
  - projects/body-war/ontology/business/receipts/validation-receipt.json
validation: fail
blockers:
  - runtime registration and implementation owner absent
  - snapshot, run, retention/GC, and service transitions lack named owners
  - generic run operations could duplicate Dispatch Spec and Orchestrate
  - proposal-handoff lifecycle duplicates the existing promotion-request owner
started_at: 2026-07-30T06:29:00Z
finished_at: 2026-07-30T06:36:12Z
```

## Reviewer 2 — Non-vacuity and overhead

## Non-vacuity and operational-overhead review

**Verdict: NEEDS_FEEDBACK**

The synthesis is non-vacuous as a research design: it states that no combined witness exists, supplies a concrete loopback request path, deterministic snapshot/ETag rules, artifact retrieval, negative fixtures, source-byte preservation, teardown, and an explicitly staged v0/v1/v2 route. It does not claim the literal three-package witness is complete (`synthesis.md:349-396,430-459,513-518`). That staging is acceptable under the briefing.

However, two load-bearing gaps need repair before this can be treated as an exact executable research contract.

### Mandatory repairs

1. **Bind operation admission per profile, rather than leaving `snapshot.diff` and proposal handoff implicitly generic.** The operation plane permits `profile.validate`, `snapshot.diff`, and profile-listed operations (`synthesis.md:178-186`), while the v0 witness requires validation, diff, and proposal handoff (`synthesis.md:361-370`). Yet Augmentor’s live profile permits validation/report/residue outputs and explicitly blocks authority/promotion effects, but does not name drift or proposal operations (`projects/augmentor/ontology/unified-agent/profile.json:53-73`). The reusable runtime profile lists `drift-report` as an allowed output category but requires profile-specific owner gates (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:40-71`). Add an exact CAV2/Augmentor/Body War/fixture capability matrix distinguishing runtime-owned byte/local-ID diff from profile-owned semantic drift, and state whether artifact-only proposal creation is a runtime capability or a profile operation. Every unsupported combination must deterministically return `OPERATION_UNSUPPORTED` with an owner route. Without this, the witness cannot falsify “permitted by each profile.”

2. **Turn resource bounds into executable v0 acceptance gates.** Query caps and worker/queue caps are concrete, but latency, RSS, storage/retention, and the process sandbox are explicitly unmeasured or owner-open (`synthesis.md:293-308,477-492,514-515`). v1 postpones measurement (`synthesis.md:444-451`), although v0 claims a full negative/race witness and runnable proof (`synthesis.md:432-442`). Specify conservative v0 fixture ceilings for peak RSS, wall-clock compile/query/run latency, maximum store/temp bytes, per-run artifact bytes, child timeout, and teardown residual bytes; define the measurement receipt fields and fail-closed outcomes. Values may be provisional design thresholds, but they must be executable and revisable. Existing IOLM done criteria already require caps and rejection evidence (`cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md:16-28`), while OEW only proves isolation/teardown separately, not these combined runtime budgets (`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:44-56,130-150`).

### Findings that pass

- The smallest witness is a real HTTP path, not schemas or diagrams: snapshot creation and repeat identity, record/relation/view/source/residue queries, neighborhood/search, ETag/304, validation receipt, deterministic diff, proposal retrieval, source preservation, and teardown are enumerated (`synthesis.md:349-396`).
- Determinism is falsifiable through double compilation, complete pre/post package identity, content-derived snapshot IDs, route-byte ETags, and explicit failure codes (`synthesis.md:126-157,243-288,301-306`).
- Negative coverage directly attacks paths, symlinks, unsupported operations, direct CRUD, promotion/authority, outbound access, and unowned teardown (`synthesis.md:398-428`). Body War’s existing tests provide concrete deterministic receipt and forbidden-promotion precedents (`projects/body-war/ontology/business/tests/business-ontology.test.mjs:43-107`).
- The three-package claim is honest: Augmentor and Body War are v1, the absent owner-approved CAV2 profile is v2, and the combined witness is explicitly absent (`synthesis.md:314-334,444-459,510-515`).

### Later implementation gates

- Implement and run v0; then admit Augmentor and Body War without profile mutation.
- Repeated concurrency/replay closure remains required for the Augmentor stale-receipt hazard (`synthesis.md:153-155,425,450-451`).
- CAV2 profile creation remains blocked on an owner decision (`synthesis.md:314-322,479-492`).
- No implementation-readiness, production, promotion, or release claim is available (`synthesis.md:494-518`).

```yaml
action_id: spawn-0006
status: fail
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/runtime-api-synthesis.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/synthesis.md
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/research.md
  - projects/augmentor/ontology/unified-agent/profile.json
  - projects/body-war/ontology/business/profile.json
  - projects/body-war/ontology/business/tests/business-ontology.test.mjs
  - arcanum/arcana/ontology-vault/templates/runtime-profile.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json
validation: fail
blockers:
  - per-profile operation admission for diff/drift and proposal handoff is not exact
  - v0 memory latency storage and sandbox acceptance gates are not executable
started_at: 2026-07-30T06:32:00Z
finished_at: 2026-07-30T06:35:59Z
```

## Reviewer 3 — Definitional and authority non-collapse

# Definitional and authority non-collapse review

## Verdict: NEEDS_FEEDBACK

The design preserves the major owner boundaries, but four load-bearing contracts still permit semantic collapse. These are bounded repairs; the architecture does not need to be discarded.

## Mandatory repairs

### 1. Separate adapter output from runtime snapshot authority

`synthesis.md:75-87` gives `PackageAdapterV0` both project-local enumeration and `compileSnapshot(): SnapshotManifest`, while `synthesis.md:126-157` assigns snapshot identity, publication, and lifecycle to the runtime. That leaves two apparent owners for snapshot materialization.

OEW’s precedent keeps parsing/mapping/canonicalization/writing as distinct components (`cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:169-182`), and CAV2 says ontology cannot define a runtime contract (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`).

Required repair:

- Replace `compileSnapshot()` with a lossless adapter-owned extraction result, such as `emitLocalRecords()` plus source bindings, native receipt, diagnostics, and residue.
- Make the runtime compiler the sole owner of generic envelope construction, canonicalization, snapshot identity, publication, and collision behavior.
- State that adapter admission never admits ontology meaning, schema authority, or snapshot lifecycle authority.

Collapse test:

> Given an adapter that returns a caller-chosen `snapshot_id` or `SnapshotManifest`, admission must fail; no adapter-returned identity or publication instruction may influence runtime-owned snapshot identity except through hashed content and declared adapter identity.

### 2. Remove canonical authority semantics from the generic record envelope

`synthesis.md:94-119` gives every record a generic `authority_effect` union of `none|staging|projection|blocked|null`. Those are CAV2 candidate-relation semantics, not evidenced universal package semantics: the CAV2 relation contract defines the local axis (`cyberAlchemy-v2/ontology/RELATION-MODEL.md:13-26`), while both live project profiles currently declare package-level `authority_effect:"none"` (`projects/augmentor/ontology/unified-agent/profile.json:2-8`; `projects/body-war/ontology/business/profile.json:2-10`).

The runtime itself has only one authority posture: none. Importing CAV2 values into the transport envelope makes the envelope a generic authority vocabulary owner and can recast a project-local value as runtime truth.

Required repair:

- Replace the envelope field with invariant `runtime_authority_effect: "none"`.
- Preserve any source-owned `authority_effect` only inside the opaque payload or a typed local facet carrying `axis_owner`, `schema_ref`, raw value, and source selector.
- Do not normalize `blocked`, `staging`, `projection`, or `owner-decision` across packages.
- Apply the same rule to `candidate_status`, lifecycle state, release admission, runtime posture, and other local axes.

Collapse test:

> Two packages using the lexical value `blocked` on different axes must round-trip byte-for-byte without becoming filter-equivalent, transition-equivalent, or authority-equivalent in the generic API.

### 3. Preserve aliases, predicates, branches, and statuses as distinct local facets

`synthesis.md:103` defines one flat `aliases: string[]`, and `synthesis.md:124` says branch IDs, `business_kind`, runtime posture, relation predicates, lifecycle states, and local statuses remain “opaque aliases/facets.” “Aliases/facets” is not exact enough: predicates are relations, branches are views, and lifecycle/status axes are state semantics—not aliases.

The Ontology Vault requires local labels to remain aliases without becoming canonical vocabulary (`arcanum/arcana/ontology-vault/SKILL.md:98-117`, `:156-164`). CAV2 separately defines a branch as an interpretive view, not namespace, lifecycle state, schema namespace, or promotion route (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-24`, `:36-47`). Augmentor explicitly marks predicates `project-local` (`projects/augmentor/ontology/unified-agent/relations/relations.json:5-21`).

Required repair:

- Replace the flat alias array with structured, owner-bound local facets, minimally `{facet_kind, local_axis, raw_value, owner_route?, schema_ref?, source_selector}`.
- Keep human aliases separately as lossless alias bindings; do not place predicates, branch IDs, statuses, or lifecycle values in that collection.
- Make query filters axis-qualified and package/profile-qualified.
- Neighborhood traversal must use adapter-declared local relation semantics and must not infer a universal predicate catalog.
- Branch filtering must address a view record, never synthesize a namespace or ownership boundary.

Collapse tests:

> A branch ID must never prefix or rewrite record identity.

> Equal predicate strings from different profiles must not become interoperable without an owner-admitted bridge.

> A local label must round-trip with role and source binding intact; it must not enter a canonical vocabulary index by default.

### 4. Split execution success from native validation result and conformance

`synthesis.md:178-186` uses generic run states and says a passing validation receipt remains bounded evidence, but `synthesis.md:243-257` provides only `VALIDATION_FAILED`, and the receipt contract at `synthesis.md:266-288` has `exit_status` plus untyped diagnostics. This cannot distinguish:

- runtime execution failure;
- validator process failure;
- successfully executed validator returning a negative finding;
- positive native validation;
- runtime-conformance verdict, which is forbidden.

CAV2 explicitly says successful validation does not redefine the exercised term or rule (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`). Body War’s native receipt separately carries an authority ceiling, diagnostics, ontology status, release admission, and accepted/rejected transition controls (`projects/body-war/ontology/business/receipts/validation-receipt.json:1-27`, `:37-54`).

Required repair:

- Give runs an `execution_status` only.
- Wrap the native result separately as `{validator_id, validator_version, native_result, native_diagnostics, native_receipt_sha256, claim_ceiling, authority_effect:"none"}`.
- Reserve errors for inability to execute or preserve the validator contract. A native negative result is a successfully completed run containing negative evidence, not automatically `VALIDATION_FAILED`.
- Explicitly forbid deriving ontology conformance, runtime conformance, promotion eligibility, maturity, release admission, or authority from either execution success or native validation result.

Collapse tests:

> A validator that executes correctly and rejects a transition must produce `execution_status:succeeded` with an unmodified native rejection, not runtime failure and not a canonical conformance verdict.

> A zero exit status without a claim ceiling must not be rendered as “valid,” “conformant,” “approved,” or “ready.”

### 5. Make both confidence axes mandatory wherever confidence is emitted

The record envelope makes both fields optional (`synthesis.md:107-110`), while proposal handoff merely promises “confidence axes” without a field-level contract (`synthesis.md:188-193`). The proposal shape and receipt schema therefore do not prove that generic `confidence`, a single score, or one axis copied into the other will be rejected.

CAV2 requires top-level node confidence to contain separate evidence and commitment confidence and explicitly excludes challenge state as a confidence axis (`cyberAlchemy-v2/ontology/NODE-MODEL.md:14-34`, `:36-55`). Ontology Vault likewise requires the axes to remain separate (`arcanum/arcana/ontology-vault/SKILL.md:188-197`).

Required repair:

- If confidence is absent locally, emit explicit `not_provided` independently for each axis; do not omit one and infer it.
- Every proposal observation that states confidence must carry both named axes, each with owner/schema/source provenance.
- Keep challenge state, workflow status, validation result, and commitment outside both axes.
- Reject a scalar `confidence` field at the generic boundary.

Collapse test:

> Raising evidence confidence must not modify commitment confidence, proposal lifecycle, run state, local status, or owner decision; the reverse must also hold.

## Optional hardening

- Namespace run states as runtime-owned, for example `runtime_execution_state`, so `queued|running|succeeded|failed|cancelled` cannot be mistaken for package lifecycle status (`synthesis.md:180-186`; `cyberAlchemy-v2/ontology/NODE-MODEL.md:78-89`).
- Rename `proposal-handoff` to `proposal-artifact` until a separately authorized delivery adapter exists. The current endpoint correctly does not contact an owner (`synthesis.md:188-193`), but “handoff” can imply delivery or owner receipt. Promotion requests remain local staging and do not replace the owner lifecycle (`cyberAlchemy-v2/ontology/promotion-requests/README.md:41-51`).
- Make `owner_route` in generic records an opaque source assertion, distinct from the runtime’s routing target. Authority moves only through the narrowest actual owner (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-29`, `:90-103`).
- Add negative fixtures proving API convenience never creates permission: a profile-listed name alone must not authorize an operation unless the profile owner, adapter capability, output permission, and relevant owner gate all bind the same exact operation/version.

```yaml
action_id: spawn-0007
status: fail
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/runtime-api-synthesis.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/synthesis.md
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/research.md
  - arcanum/arcana/ontology-vault/SKILL.md
  - cyberAlchemy-v2/authority/AUTHORITY-MODEL.md
  - cyberAlchemy-v2/ontology/PACKAGE-MODEL.md
  - cyberAlchemy-v2/ontology/NODE-MODEL.md
  - cyberAlchemy-v2/ontology/RELATION-MODEL.md
  - cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md
  - cyberAlchemy-v2/ontology/projections/README.md
  - cyberAlchemy-v2/ontology/promotion-requests/README.md
  - cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md
  - projects/augmentor/ontology/unified-agent/profile.json
  - projects/augmentor/ontology/unified-agent/relations/relations.json
  - projects/body-war/ontology/business/profile.json
  - projects/body-war/ontology/business/receipts/validation-receipt.json
validation: fail
blockers:
  - adapter and runtime compiler ownership overlap
  - generic envelope imports CAV2 authority-effect semantics
  - aliases predicates branches and statuses are not structurally separated
  - execution result validation evidence and conformance remain under-typed
  - confidence axes are not mandatory at every confidence-bearing boundary
started_at: 2026-07-30T06:17:03Z
finished_at: 2026-07-30T06:36:24Z
```
