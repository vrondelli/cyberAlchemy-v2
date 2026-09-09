# Ontology Runtime/API Explorer Returns

The following three explorer returns are preserved verbatim. This file does not
promote their designed contracts or change any retained owner.

## Agent 1 — Authority contract

# Authority and Reusable-Contract Lane

## Verdict

**[designed]** A three-plane Ontology Vault API is compatible with the current authority model only if it is a non-authoritative adapter over explicitly registered, owner-bounded profiles:

1. an immutable query plane returning source-bound snapshots and read models;
2. a profile-gated operation plane producing evidence artifacts and reports;
3. an owner-routed proposal-handoff plane that stages requests but cannot decide them.

The split is justified because runtime profiles already distinguish readable refs, permitted runtime modes, allowed outputs, blocked outputs, owner gates, residue, and observability (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:11-19`, `arcanum/arcana/ontology-vault/templates/runtime-profile.md:21-38`, `arcanum/arcana/ontology-vault/templates/runtime-profile.md:40-73`). It remains a design, not an existing runtime contract: the CAV2 ontology package explicitly excludes runtime-contract definition, schema amendment, movement edges, and promotion verdicts (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`).

## Exact owner/movement matrix

| Movement or effect | Retained owner | Runtime/API effect | Status |
|---|---|---|---|
| Read registered source/profile refs | Source owner plus profile boundary | Query an immutable, source-bound snapshot; never discover beyond registered refs | **[designed]**, grounded in profile refs as the execution boundary (`arcanum/arcana/ontology-vault/SKILL.md:98-117`) |
| Source evidence → import candidate | Authority import | Return evidence or prepare a handoff; no automatic movement | **[observed]** review flow, not automatic pipeline (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:31-46`) |
| Inventory evidence → ontology candidate | Inventory supplies discovery evidence; ontology route owns candidate modeling | Query/report/propose only | **[observed]**: Inventory can seed context but cannot promote (`cyberAlchemy-v2/SOURCE-MAP.md:23-33`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-128`) |
| Candidate term → local definition | definitions-governance | Emit a `definition-request` handoff | **[observed]** (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:61-68`; `cyberAlchemy-v2/ontology/promotion-requests/README.md:30-39`) |
| Candidate structural rule → constitution | constitution-governance | Emit a `constitution-request` handoff | **[observed]** (same selectors) |
| Candidate recurring practice → discipline | discipline-governance | Emit a `discipline-request` handoff | **[observed]** (same selectors) |
| Contested scope, ownership, naming, public/private posture | decision-gate | Emit a `decision-request`; await human decision record | **[observed]** (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:90-103`; `cyberAlchemy-v2/authority/promotion-policy.md:20-29`) |
| Schema, edge, vault type, lifecycle, or movement change | schema governance / decision-gate, then task-session | Reject mutation; emit `schema-request` | **[observed/blocked]** (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:61-68`; `cyberAlchemy-v2/ontology/RELATION-MODEL.md:60-71`) |
| Ready implementation mutation/runtime contract | task-session after owner gates | Emit `implementation-request`; no execution through ontology API | **[observed/blocked]** (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:50-61`; `cyberAlchemy-v2/ontology/promotion-requests/README.md:30-39`) |
| Candidate → reviewed candidate | Profile-named owner route | Operation may assemble required evidence and handoff | **[observed]** profile gate slot (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:61-68`) |
| Candidate → promotion request | Profile-named owner route | Create/stage a request, not a verdict | **[observed]** (`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-10`, `cyberAlchemy-v2/ontology/promotion-requests/README.md:41-51`) |
| Owner-approved state → projection | Ontology route plus source owner, within decision scope | Generate immutable read model only when permission exists | **[observed]** (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:50-60`; `cyberAlchemy-v2/ontology/projections/README.md:47-50`) |
| Promotion/authority decision | Narrowest relevant owner | No API decision endpoint | **[blocked]**: authority moves by owner route, never usefulness or proximity (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-29`) |

## Reusable runtime-profile obligations

**[observed]** A reusable implementation must require, at admission:

- stable profile identity, lifecycle status, repository, owner route, and date (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:3-9`);
- base ontology, local ontology, local owner, source-spine, and implementation refs, each with allowed and blocked uses (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:11-19`);
- allowed runtime modes and an explicit default (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:21-30`);
- for an agent backend, its owner plus trigger, tension/review, explicit confirmation, registration/closeout, and delegated-evidence treatment (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:30-38`);
- enumerated allowed and blocked outputs (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:40-59`);
- movement-specific owner routes, evidence, and blocking gates (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:61-68`);
- residue, observability, and Inventory/read-model routes (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:69-73`).

**[inferred]** Profile admission should default-deny missing obligations. The sigil already requires at least ontology refs, owner refs, evidence refs, allowed modes/outputs, blocked outputs, owner gates, and residue route, and it requires blocked attempts to be recorded (`arcanum/arcana/ontology-vault/SKILL.md:156-177`).

## Effect contract

### Allowed effects

- **Read — [observed]:** read only profile-named refs within their allowed uses. Local ontology refs are candidates/aliases, owner refs decide, source refs establish evidence posture, and implementation refs support bridge checks (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:11-19`).
- **Run — [observed]:** `map`, `distill-sessions`, `promote-confidence`, `premise-review`, `convention-update`, and `validate` are reusable modes (`arcanum/arcana/ontology-vault/SKILL.md:22-29`), but “promote-confidence” evaluates or recommends; it does not execute promotion (`arcanum/arcana/ontology-vault/SKILL.md:188-197`).
- **Report — [observed]:** ontology maps, validation, confidence-action, premise, drift, delegated-evidence, and permitted projection outputs are valid evidence artifacts (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:40-52`).
- **Proposal — [observed]:** convention and promotion requests may state delta, evidence, conflicts, blocking questions, owner, and residue, but must remain proposals (`arcanum/arcana/ontology-vault/SKILL.md:199-206`; `cyberAlchemy-v2/ontology/promotion-requests/README.md:12-28`).
- **Handoff — [observed]:** route to the narrowest owner and preserve accepted/deferred/blocked/rejected or owner-decision outcomes without replacing the owner lifecycle (`cyberAlchemy-v2/ontology/promotion-requests/README.md:41-51`).

### Blocked effects

- **Source mutation — [blocked]:** canonical-source mutation is a blocked profile output (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:53-59`).
- **Schema mutation — [blocked]:** node concepts are not live `node_type` values and do not amend schemas (`cyberAlchemy-v2/ontology/NODE-MODEL.md:6-10`); candidate relations are neither executable edge additions nor movement edges (`cyberAlchemy-v2/ontology/RELATION-MODEL.md:6-11`).
- **Spec mutation — [blocked]:** explicitly blocked by the reusable profile (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:53-59`).
- **Runtime-contract creation/conformance — [blocked]:** ontology cannot redefine runtime contracts (`cyberAlchemy-v2/ontology/README.md:12-18`), and profile output cannot itself be a runtime-conformance verdict (`arcanum/arcana/ontology-vault/README.md:93-111`).
- **Authority movement — [blocked]:** evidence, ontology, Inventory, implementation, and validation cannot decide or redefine authority (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`).
- **Promotion — [blocked]:** a request is neither verdict, decision, nor authority artifact (`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-10`).
- **Generated projection as authority — [blocked]:** projections aid search/review/construction but create no authority (`cyberAlchemy-v2/ontology/projections/README.md:6-10`, `cyberAlchemy-v2/ontology/projections/README.md:37-50`).

## Identity and confidence non-collapse

**[observed]** The minimum stable identity is local and qualified: profile identity identifies an admission boundary (`arcanum/arcana/ontology-vault/templates/runtime-profile.md:3-9`); `concept_id` and `relation_id` are explicitly local identifiers (`cyberAlchemy-v2/ontology/NODE-MODEL.md:14-27`; `cyberAlchemy-v2/ontology/RELATION-MODEL.md:13-26`). Therefore a runtime must not treat an unqualified project-local ID as globally canonical.

**[designed]** Snapshot record identity should be the tuple:

`profile_id + package-local record kind + local_id + immutable snapshot_id`

The generic runtime owns only the tuple and source binding. It does not reinterpret `local_id`.

**[observed]** Evidence confidence and commitment confidence are separate axes; the challenge contract is not a third confidence axis (`cyberAlchemy-v2/ontology/NODE-MODEL.md:29-55`). Candidate workflow status must not collapse into vault maturity status (`cyberAlchemy-v2/ontology/NODE-MODEL.md:78-89`). Runtime responses must therefore expose these fields independently or leave them opaque; no aggregate “confidence” score is admissible.

**[blocked]** Do not collapse:

- evidence confidence into commitment confidence (`arcanum/arcana/ontology-vault/SKILL.md:188-197`);
- validation into authority;
- challenge state into confidence;
- package workflow status into canonical maturity;
- snapshot identity into source identity;
- deterministic serialization into deterministic truth or authority.

## Branch and local-vocabulary boundaries

**[observed]** A branch is an interpretive view, not a canonical branch, node type, lifecycle state, schema namespace, or promotion route (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-24`). Branch names, membership, maps, and bridge views cannot determine owner, type, promotion, source authority, or movement edges (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:36-47`).

**[observed]** Generic business/system/bridge catalogs are starters, not a universal taxonomy (`arcanum/arcana/ontology-vault/SKILL.md:217-225`). Project labels must remain aliases and cannot enter canonical Arcanum vocabulary by default (`arcanum/arcana/ontology-vault/SKILL.md:98-117`, `arcanum/arcana/ontology-vault/SKILL.md:156-164`).

**[inferred]** The query API may filter by an opaque project-local branch identifier or a reusable view role, but must not manufacture a universal branch namespace.

## Smallest generic envelope

**[designed]**

```yaml
record:
  profile_id: string
  snapshot_id: string
  record_kind: node | relation | view | source | residue | local
  local_id: string
  owner_route: string | null
  source_refs: [opaque-ref]
  authority_effect: none | staging | projection | owner-decision | blocked | null
  local_labels: [string]
  confidence:
    evidence_confidence: opaque | null
    commitment_confidence: opaque | null
  status:
    axis: project-local-string
    value: opaque
  payload:
    media_type: string
    schema_ref: opaque-ref | null
    value: opaque-project-local-record
  residue: opaque | null
```

This is intentionally an addressing/provenance envelope, not an ontology schema. It borrows only already evidenced cross-package concepts: local identity and owner/source bindings (`cyberAlchemy-v2/ontology/NODE-MODEL.md:14-27`), explicit authority effect (`cyberAlchemy-v2/ontology/RELATION-MODEL.md:13-26`), separate confidence axes (`cyberAlchemy-v2/ontology/NODE-MODEL.md:29-55`), and projection/residue boundaries (`cyberAlchemy-v2/ontology/projections/README.md:21-35`). The opaque payload preserves project-local records losslessly.

**[blocked]** The envelope must not standardize local node types, relation predicates, statuses, lifecycle policies, aliases, payload schemas, or branch IDs. The package-level candidate shape itself is explicitly not a live schema (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:90-123`).

## Split API evaluation

### Immutable query plane

**[designed: accept]** Permit only reads against an immutable admitted snapshot: list/get records, sources, views, residue, relations, and report artifacts. Responses must identify profile and snapshot and retain source refs. A snapshot is a read model, not a source or authority artifact; generated projections may support navigation but cannot become canonical (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:74-88`).

### Profile-gated operation plane

**[designed: accept with default deny]** An operation request names profile, snapshot, sigil mode, runtime mode, requested output, and output route. Admission checks profile mode permission, output permission, owner-gate coverage, and backend gate. Results are evidence artifacts, including blocked-attempt evidence—not verdicts (`arcanum/arcana/ontology-vault/SKILL.md:156-177`, `arcanum/arcana/ontology-vault/SKILL.md:208-214`).

### Owner-routed proposal handoff

**[designed: accept]** The API may construct a typed request with candidate, requested transition, owner, sources, semantic delta, conflicts, posture, questions, and residue (`cyberAlchemy-v2/ontology/promotion-requests/README.md:12-28`). Its terminal API state is “handed off” or a faithfully represented owner-route response. It cannot expose `approve`, `promote`, `make-authoritative`, or equivalent endpoints.

## Explicit residue

- **[open]** CAV2 has no evidenced admitted runtime profile in the selected sources; a base profile remains future owner-approved work.
- **[open]** The generic envelope is designed, not a promoted schema or runtime contract.
- **[open]** The authority-kind closure is review-mode; deterministic enforcement is pending (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:63-72`, `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:153-165`).
- **[open]** Generated projection runtime remains gated by schema, validation, and task-session (`cyberAlchemy-v2/ontology/projections/README.md:52-57`).
- **[blocked]** Live schemas, movement edges, append-only authority-ledger validation, and standalone extraction are not admitted by the candidate package (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:147-153`).
- **[blocked]** Inventory findings cannot authorize this design; Inventory is discovery and evidence lookup only (`cyberAlchemy-v2/SOURCE-MAP.md:23-33`).

```yaml
action_id: spawn-0001
status: pass
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/strategy-inventory-packet.json
  - arcanum/arcana/ontology-vault/SKILL.md
  - arcanum/arcana/ontology-vault/README.md
  - arcanum/arcana/ontology-vault/templates/runtime-profile.md
  - cyberAlchemy-v2/SOURCE-MAP.md
  - cyberAlchemy-v2/authority/AUTHORITY-MODEL.md
  - cyberAlchemy-v2/authority/promotion-policy.md
  - cyberAlchemy-v2/ontology/README.md
  - cyberAlchemy-v2/ontology/PACKAGE-MODEL.md
  - cyberAlchemy-v2/ontology/NODE-MODEL.md
  - cyberAlchemy-v2/ontology/RELATION-MODEL.md
  - cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md
  - cyberAlchemy-v2/ontology/projections/README.md
  - cyberAlchemy-v2/ontology/promotion-requests/README.md
validation: pass
blockers: []
started_at: 2026-07-30T06:17:03Z
finished_at: 2026-07-30T06:21:15Z
```

## Agent 2 — Runtime/API

# Runtime/API lane research

## Verdict

The smallest defensible runtime is a private, loopback-only process with three sharply separated planes:

1. an immutable query plane over content-addressed snapshots;
2. a profile-gated run plane that creates reports and validation/diff artifacts but cannot mutate ontology sources or authority state;
3. an owner-routed proposal-output plane that emits a non-authority handoff artifact rather than applying a change.

This is a designed contract, not a current generic runtime. Current repository evidence is split:

- **Implemented and witnessed:** OEW has contained source admission, deterministic create-only adapter runs, a token-gated GET/HEAD loopback gateway, zero-outbound browser evidence, and verified teardown.
- **Designed but not implemented as IOLM:** the seven-family immutable GET API, semantic snapshot/ETag contract, query caps, and manifest-only source-anchor resolution.
- **Planned and blocked:** `TASK-IOLM-004` is `not-started`; `SWU-IOLM-004-A` is blocked on compiler work.
- **Absent:** a generic package registry, adapter-admission registry, Ontology Vault profile-run service, generic snapshot/diff store, generic proposal handoff API, concurrency controller, and one three-package witness.

## Evidence posture

### IOLM

The exact IOLM read contract is seven GET families—snapshot, entity, neighborhood, claim, search, journey, and source anchor—and explicitly excludes POST/PUT/PATCH/DELETE, owner-decision, and publication endpoints (`cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`). Its source manifest is explicit and default-deny, binding source ID, owner namespace, allowed path, revision/hash, extractor, excerpt policy, and privacy class (`cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:3-5`). Snapshots expose versioned records, relations, separately stored views/layouts, unresolved references, receipts, hashes, and ETags with stable-ID canonical ordering (`interfaces.md:7-9`).

This remains **designed/planned**, not implemented IOLM service evidence. The work-pack records `TASK-IOLM-004` as `not-started` and `SWU-IOLM-004-A` as `blocked` (`cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md:80-80`, `WORK-PACK.md:106-106`). Its done criteria require all seven routes, snapshot identity/ETags, depth/facet/page caps, manifest-only anchors, arbitrary-path rejection, and a static absence-of-mutation scan (`work-pack/tasks/TASK-IOLM-004-READ-API.md:16-28`). The dependency sequence ends in `004-A`, so the API cannot honestly precede deterministic compiler output (`work-pack/waves/W2.md:1-6`).

IOLM’s strongest reusable design constraints are:

- source owners stay upstream; compiler ownership stops at projection bytes and build receipt (`ARCHITECTURE-BUNDLE.md:27-64`);
- snapshot identity binds posture, contract/compiler/extractor versions, source digests/revisions, and source-local identity material; deterministic projection bytes do not grant ontology authority (`ARCHITECTURE-BUNDLE.md:85-89`);
- source-local IDs/namespaces survive normalization and identity-bearing input changes force a new snapshot (`ARCHITECTURE-BUNDLE.md:99-108`);
- GET responses carry snapshot identity, ETag, stable IDs, and explicit truncation/pagination; no endpoint accepts a filesystem path (`ARCHITECTURE-BUNDLE.md:129-131`);
- default-deny manifests, no crawling, and no query-to-path/extractor conversion are required (`ARCHITECTURE-BUNDLE.md:156-163`);
- build observation includes manifest/source/compiler identities, hashes/ETags, counts, residue, verdicts, duration, and artifact paths, while logs remain evidence rather than decisions (`ARCHITECTURE-BUNDLE.md:177-179`);
- source editing, ontology authoring, authority mutation, promotion/demotion, challenge adjudication, and owner decisions are excluded (`SPEC.md:59-70`);
- candidate evidence cannot masquerade as an owner-issued authoritative graph (`SPEC.md:101-118`).

### OEW

OEW’s architecture assigns fail-closed source admission, loss-aware mapping, canonical serialization, create-only immutable adapter writes, and loopback/token/path-contained serving to distinct components (`cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:167-190`). The presentation graph is explicitly not the evidence graph, and the sidecar preserves exact source relations and mapping loss (`ARCHITECTURE.md:192-227`). The intended workflow verifies source receipts, maps and validates, compares two canonical builds, writes a new adapter run, verifies its receipt, then starts a token-gated viewer (`ARCHITECTURE.md:239-253`).

Unlike the older Inventory synthesis, the current implementation now supplies live runtime evidence:

- source admission resolves real paths inside the repository, rejects escapes/symlinks/non-regular files, verifies exactly four expected artifacts, and emits an `authority_effect:none` verified handle (`cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs:35-97`, `source-admission.mjs:100-152`);
- adapter output is built twice and rejected unless graph and sidecar bytes match; its receipt binds artifact hashes, counts, read-only protected-source checks, and a no-authority claim ceiling (`src/adapter-run-writer.mjs:198-274`);
- adapter output directories are create-only, mode `0700`; artifacts are `wx`, mode `0600`; an existing directory is `OUTPUT_ALREADY_EXISTS` (`src/adapter-run-writer.mjs:281-327`);
- the gateway admits only contained verified adapter runs and rechecks receipt/artifact identities before serving (`scripts/serve-oew-prototype.mjs:304-356`);
- it binds only `127.0.0.1`, accepts GET/HEAD, rejects mutation methods, requires explicit tokens for evidence bytes, contains static paths after realpath, rejects symlinks, and records request counters/ledger (`scripts/serve-oew-prototype.mjs:404-589`);
- its retained gateway handle reports 15/15 probes passed, zero outbound requests, explicit 401/403/404/400/405 negatives, server closure, and port release (`generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:22-27`, `gateway-handle.json:44-56`, `gateway-handle.json:57-150`);
- browser evidence reports one local Poker journey, zero outbound requests/errors, no authority actions, and complete browser/context/page/gateway teardown, but explicitly does not claim ontology correctness, human acceptance, release, deployment, production, or general runtime validity (`generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json:24-89`, `browser-acceptance.json:130-145`, `browser-acceptance.json:164-173`).

Thus OEW is an **implemented precedent for admission, adapter outputs, gateway isolation, and teardown**, not a generic Ontology Vault runtime or generic package API. Its own architecture keeps authority owners on a separate no-direct-write route (`design/ARCHITECTURE.md:321-336`).

## Designed minimal process model

All contracts in this section are **proposed/design-only**.

1. **Explicit package registration**
   - Operator supplies a repository-owned registration document by server startup argument or an admin command, never an arbitrary HTTP path.
   - Registration binds `package_id`, `profile_id`, `adapter_id@version`, declared package root, manifest digest, allowed operations, owner route, privacy class, and lifecycle policy.
   - Server resolves every configured root once with `realpath`, proves containment under a startup allowlist, rejects symlinks and undeclared files, then stores only normalized logical identities and hashes.
   - No filesystem discovery, glob crawling, URL registration, or runtime path parameter exists.

2. **Adapter admission**
   - Adapter descriptors are startup-installed code, not uploaded scripts.
   - Admission binds adapter code hash, supported profile/schema versions, exact input inventory, output envelope version, deterministic canonicalizer, validator command identity, resource caps, and `authority_effect:none`.
   - Unknown versions/types fail `ADAPTER_UNSUPPORTED`; adapters must preserve opaque project-local payloads and aliases rather than universalize them.

3. **Immutable snapshot compilation**
   - Lock package registration; enumerate only manifest-declared regular files; hash raw bytes; invoke the admitted adapter with outbound networking disabled.
   - Emit canonical generic envelope plus opaque project-local records, residue, validation receipt, and source-byte before/after digest set.
   - Compile twice in a clean temporary root. Byte mismatch is `NONDETERMINISTIC_ADAPTER`.
   - Snapshot ID is `sha256(envelope_version + registration_digest + adapter_digest + profile_digest + ordered_source_digest_set + canonical_output_digest)`.
   - Publish atomically into a create-only snapshot directory; receipt is written last. Existing identical identity returns the existing snapshot, while identity collision with unequal bytes fails closed.

4. **Bounded query**
   - Query only already-published immutable snapshots.
   - Every response binds `snapshot_id`, `content_sha256`, `etag`, `profile_id`, `adapter_id`, `truncated`, `next_cursor`, and `authority_effect:"none"`.
   - ETag is the quoted SHA-256 of canonical response bytes for that route plus normalized query parameters. `If-None-Match` returns 304.
   - Suggested hard v0 caps: `page_size<=100`, neighborhood `depth<=2`, `nodes<=250`, `relations<=500`, search query `<=256` UTF-8 bytes, source excerpt `<=8 KiB`, response body `<=2 MiB`, request target `<=8 KiB`.

5. **Profile-allowed run creation**
   - `POST /v1/runs` is the only general state-creating endpoint. It accepts a snapshot ID, an operation name present in the package profile, canonical parameters, and `Idempotency-Key`.
   - Allowed v0 operations: package-owned validation, deterministic diff/drift, and explicitly profile-listed Ontology Vault report operations.
   - A run consumes snapshots; it never consumes raw paths and never writes a package.
   - Run ID derives from snapshot IDs, operation/version, parameter hash, and idempotency key. Same key/same body returns the existing run; same key/different body is `IDEMPOTENCY_CONFLICT`.

6. **Run/status/artifact retrieval**
   - `GET /v1/runs/{run_id}`
   - `GET /v1/runs/{run_id}/artifacts`
   - `GET /v1/runs/{run_id}/artifacts/{artifact_id}`
   - States: `queued|running|succeeded|failed|cancelled`; terminal states are immutable.
   - Artifacts are content-addressed and expose digest, media type, size, operation/profile versions, source snapshot IDs, receipt ID, and authority ceiling.

7. **Drift/diff**
   - `POST /v1/runs` with `operation:"snapshot.diff"` and two explicit snapshot IDs.
   - Compare canonical envelopes and adapter-supplied local identity/meaning fields separately.
   - Output `added`, `removed`, `changed`, `unchanged`, `residue`, and `unsupported_comparisons`; never infer promotion, regression severity, or owner approval.
   - Cross-adapter diff is rejected unless an admitted bridge adapter explicitly owns that comparison.

8. **Proposal handoff**
   - `POST /v1/runs/{run_id}/proposal-handoffs` emits a create-only, content-addressed proposal artifact containing observations, exact snapshot/run/receipt digests, suggested owner route, confidence, unresolved residue, and explicit `authority_effect:none`.
   - It does not call an owner system, mutate a source, register an authority decision, or promote anything.
   - Retrieval is GET-only. Applying the proposal is outside this runtime.

## Endpoint families

| Plane | Designed endpoints | Mutation ceiling |
|---|---|---|
| Discovery | `GET /v1/packages`, `GET /v1/packages/{id}`, `GET /v1/profiles/{id}` | startup registration projection only |
| Snapshots | `POST /v1/snapshots`, `GET /v1/snapshots/{id}`, `GET /v1/snapshots/{id}/records`, `/relations`, `/views`, `/sources`, `/residue`, `/search`, `/neighborhoods/{record_id}` | create immutable compiled snapshot only |
| Runs | `POST /v1/runs`, `GET /v1/runs/{id}`, `GET /v1/runs/{id}/artifacts[/{artifact_id}]` | profile-allowed report artifacts only |
| Handoff | `POST /v1/runs/{id}/proposal-handoffs`, `GET /v1/proposal-handoffs/{id}` | create non-authority proposal artifact only |
| Observability | `GET /healthz`, `GET /readyz`, `GET /v1/metrics`, `GET /v1/events?cursor=` | bounded operational evidence |
| Admin | no HTTP registration, adapter upload, delete, promotion, or shutdown route in v0 | process CLI owns start/stop |

Reject conditions are any `/nodes`, `/relations`, `/sources` POST/PUT/PATCH/DELETE route; arbitrary extractor upload; arbitrary filesystem path; remote URL import; `/promote`, `/approve`, `/admit`, owner-decision, publication, release, or deployment endpoint.

## Envelopes and failures

Request envelope:

```json
{
  "schema_version": "ontology-runtime.request.v0",
  "request_id": "client-stable-id",
  "snapshot_id": "sha256:...",
  "operation": "profile.validate",
  "parameters": {},
  "expected_profile": "profile-id@version"
}
```

Response envelope:

```json
{
  "schema_version": "ontology-runtime.response.v0",
  "request_id": "client-stable-id",
  "result": {},
  "identity": {
    "snapshot_id": "sha256:...",
    "content_sha256": "...",
    "etag": "\"sha256:...\""
  },
  "bounds": {"truncated": false, "next_cursor": null},
  "authority_effect": "none"
}
```

Error envelope:

```json
{
  "schema_version": "ontology-runtime.error.v0",
  "request_id": "client-stable-id",
  "error": {
    "code": "PATH_FORBIDDEN",
    "message": "stable public message",
    "retryable": false,
    "details": []
  },
  "authority_effect": "none"
}
```

Taxonomy: `REQUEST_INVALID` 400, `PATH_FORBIDDEN` 400, `AUTH_REQUIRED` 401, `FORBIDDEN` 403, `PACKAGE_NOT_FOUND`/`SNAPSHOT_NOT_FOUND`/`RUN_NOT_FOUND` 404, `METHOD_NOT_ALLOWED` 405, `IDEMPOTENCY_CONFLICT`/`OUTPUT_ALREADY_EXISTS` 409, `PRECONDITION_FAILED` 412, `PAYLOAD_TOO_LARGE` 413, `QUERY_CAP_EXCEEDED` 422, `TOO_MANY_REQUESTS` 429, `ADAPTER_UNSUPPORTED`/`OPERATION_UNSUPPORTED` 422, `SOURCE_DRIFT`/`NONDETERMINISTIC_ADAPTER`/`VALIDATION_FAILED` 422, `RUN_CAPACITY_EXHAUSTED` 503, and opaque `INTERNAL_FAILURE` 500. Errors must not echo physical paths, tokens, excerpts, stack traces, or private source bytes.

## Concurrency, lifecycle, and security

- One compiler per package registration; concurrent identical compilation coalesces by content key.
- One active run per `(snapshot, operation, parameter_hash)`; global v0 worker cap 2, per-package cap 1, bounded queue 16.
- Snapshots/runs are create-only. Temporary roots are owner-PID-scoped and removed in `finally`; only the process’s own roots/PIDs/ports may be torn down.
- v0 retention should be explicit: snapshots retained until operator garbage collection; failed temporary runs removed immediately; terminal receipts/artifacts retained by policy. Garbage collection must be an offline CLI over known content IDs, not an HTTP delete endpoint.
- Bind only `127.0.0.1`; use a 256-bit ephemeral bearer token; do not persist the token; GET/HEAD for reads, narrowly enumerated POST routes for snapshot/run/handoff creation; reject upgrades.
- Child adapter processes receive a minimal environment, closed stdin, fixed cwd, timeout, memory/output caps, and no shell interpolation.
- No outbound network: adapter/runtime workers run with outbound-deny enforcement where available, and acceptance receipts must observe zero requests. CSP is `default-src 'self'` with `connect-src 'self'`, following OEW’s implemented boundary (`scripts/serve-oew-prototype.mjs:218-239`).
- No arbitrary filesystem: physical paths exist only in startup registration; HTTP bodies and query parameters accept logical IDs only. Resolve lexical and canonical containment, reject symlinks and non-regular files, and never serve a directory.

## Local-fixture vertical witness

**Designed witness; not yet executed.**

Use one explicitly registered local fixture package and an admitted fixture adapter:

```bash
node ontology-runtime.mjs serve \
  --registry fixtures/registry.json \
  --store /tmp/ontology-runtime-witness-store
```

Then:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-snapshot-1" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:$PORT/v1/snapshots \
  -d '{"package_id":"fixture:poker","profile_id":"fixture-readonly@1"}'

curl -i -sS \
  -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/v1/snapshots/$SNAPSHOT_ID/neighborhoods/F1?depth=2&limit=50"

curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-validate-1" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:$PORT/v1/runs \
  -d "{\"snapshot_id\":\"$SNAPSHOT_ID\",\"operation\":\"profile.validate\",\"parameters\":{}}"

curl -sS -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:$PORT/v1/runs/$RUN_ID/artifacts
```

Witness acceptance requires: repeat compilation yields the same snapshot ID and bytes; `If-None-Match` yields 304; depth 3 is rejected; `../../` and encoded traversal are rejected without protected bytes; POST to record/relation/source routes is 404/405; `promotion` is `OPERATION_UNSUPPORTED`; source digests before/after match; zero outbound requests are observed; one proposal handoff names an owner route but changes no source; process termination releases its port and removes only its temporary root. OEW demonstrates each underlying isolation mechanism separately, but no current receipt proves this combined generic witness.

## Bottom line

Build from IOLM’s immutable query design and OEW’s implemented admission/gateway mechanics, but do not merge their owners or claim either already supplies the generic runtime. The first implementation should be explicit-registration, one adapter, one fixture, immutable snapshots, bounded GET queries, one profile validation run, one deterministic diff, and one non-authority proposal handoff. Direct ontology CRUD and promotion APIs are architectural rejection conditions.

```yaml
action_id: spawn-0002
status: pass
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/strategy-inventory-packet.json
  - .arcanum/inventory/entries/oew-runtime-rebuild-lessons-research-result-synthesis.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/SPEC.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/waves/W2.md
  - cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/traceability.md
  - cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/adapter-run-writer.mjs
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-oew-prototype.mjs
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/oew-prototype-gateway.test.mjs
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json
  - cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json
validation: pass
blockers:
  - IOLM TASK-IOLM-004 is not started and SWU-IOLM-004-A is blocked
  - generic package registry, adapter admission, profile-run service, diff service, and proposal handoff are absent
  - no combined generic local-fixture witness has run
started_at: 2026-07-30T06:17:03Z
finished_at: 2026-07-30T06:22:01Z
```

## Agent 3 — Package interoperability

# Package-interoperability research result

## Verdict

**Pass, with one important constraint:** the two minted-project packages evidence a common *package substrate*, but not a common ontology record schema.

The runtime should therefore use explicit package adapters that expose a small generic envelope while retaining each package’s records as immutable, opaque project-local payloads. It must preserve local labels and predicates as aliases, never translate them into canonical CyberAlchemy vocabulary, and return `unsupported_operation` when an adapter lacks a capability.

CyberAlchemy v2 can be registered as a third package through a local profile and a Markdown-document adapter. It cannot honestly masquerade as either project’s JSON node/relation family: its candidate record shape is explicitly “a package-level model shape” and “not a live schema” (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:90-123`), and its node concepts are explicitly not live vault types or schema amendments (`cyberAlchemy-v2/ontology/NODE-MODEL.md:6-10`).

## Evidence classification

- **Observed:** current repository bytes, schemas, validators, receipts, tests, counts, and local package behavior.
- **Inferred:** performance and migration consequences directly implied by those observed shapes.
- **Designed:** adapter/runtime contracts proposed below; none are implemented.
- **Blocked:** any source mutation, canonicalization, authority decision, promotion, release, or claim that validation proves runtime behavior.
- **Open:** exact CAV2 local profile bytes, adapter implementation, runtime caps, snapshot format, and a literal three-package witness.

## Common substrate actually evidenced

Both packages provide:

1. **A local package identity and non-authority ceiling.**  
   Augmentor declares `candidate-local`, `authority_effect: none`, and `release_admission: not-granted` (`projects/augmentor/ontology/unified-agent/profile.json:2-8`). Body War declares the same posture (`projects/body-war/ontology/business/profile.json:2-10`).

2. **Digest-bound immutable sources.**  
   Augmentor uses named repository roots, source IDs, paths, digests, postures, and owners (`projects/augmentor/ontology/unified-agent/sources.json:2-21`); Body War uses path/digest source rows (`projects/body-war/ontology/business/sources.json:1-18`). Both validators compare current bytes with bound SHA-256 values: Augmentor rejects traversal and digest mismatch (`projects/augmentor/ontology/unified-agent/scripts/validate.mjs:106-126`); Body War checks declaration, reference digest, existence, and current bytes (`projects/body-war/ontology/business/scripts/validate.mjs:518-573`).

3. **Typed candidate nodes, directed relations, interpretive views, residue, owner routes, confidence, challenge contracts, and forbidden collapses.**  
   Augmentor’s representative node carries a local ID/label, project branches, runtime posture, split confidence, challenge contract, owner route, residue, and forbidden collapses (`projects/augmentor/ontology/unified-agent/nodes/nodes.json:5-50`). Body War carries analogous CAV2 fields plus its local `business_kind` and branch role (`projects/body-war/ontology/business/nodes/actor.runner.json:2-42`).

4. **Relation endpoints, evidence, owner, effect, and cycle controls.**  
   Augmentor adds local `predicate_scope`, runtime posture, and description (`projects/augmentor/ontology/unified-agent/relations/relations.json:5-25`). Body War embeds full source selectors/digests in each relation and has its own schema version (`projects/body-war/ontology/business/relations/relations.json:4-24`).

5. **Views that do not confer authority.**  
   Augmentor exposes four populated plane-specific views (`projects/augmentor/ontology/unified-agent/profile.json:31-51`); Body War exposes one business meaning branch whose allowed readings and forbidden movements are explicit (`projects/body-war/ontology/business/views/business.json:27-47`). CAV2’s underlying law says a branch is not a canonical branch, type, lifecycle state, namespace, or promotion route (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-24`).

6. **Read-only validation receipts with claim ceilings.**  
   Augmentor’s receipt records counts, artifact digests, checks, ceiling, and violations (`projects/augmentor/ontology/unified-agent/receipts/validation-receipt.json:1-36`). Body War additionally records a stable diagnostic contract, negative controls, source bindings, and non-promotion posture (`projects/body-war/ontology/business/receipts/validation-receipt.json:1-54`, `:173-174`).

## Irreducible local differences

| Capability | Augmentor unified-agent | Body War business | Runtime implication |
|---|---|---|---|
| Physical node layout | One aggregate `nodes/nodes.json` | 237 individual node files plus manifest | Adapter owns enumeration; runtime must not prescribe layout. |
| Scale | 18 nodes, 21 relations, 4 views, 7 residue, 21 sources (`receipts/validation-receipt.json:6-11`) | 237 nodes, 231 relations, 11 lifecycle policies, 6 residue, 34 sources (`receipts/validation-receipt.json:4-9`) | Snapshot compilation must be streaming/bounded and content-addressed. |
| Local semantic axis | `branches`, `runtime_posture`, project-local predicate scope | 17-value `business_kind`, lifecycle state, prototype availability | Preserve as aliases/facets; never universalize. |
| Views | Four JSON views: meaning/system/evidence/bridge | One JSON meaning branch plus generated SVG/HTML/Markdown projections | Adapter declares view media and authority posture. |
| Lifecycle | No lifecycle-policy record family | 11 closed lifecycle policies; transition admission | `validate_transition` supported only by Body War adapter. |
| Source reference form | Indirect `source_id` joined through manifest | Inline `{path,selector,sha256}` | Adapter resolves to a generic source envelope without rewriting originals. |
| Validation | Compact closed-schema/reference validator | Diagnostic-code validator, coverage thresholds, executable-logic rejection, deterministic canonicalization | Native validator remains owner; runtime wraps result, never replaces it. |
| Runtime claims | Explicit observed/absent postures and unresolved ResonantOS projection | Product meaning graph and fixture-vs-real-provider ceilings | Search/filter facets remain package-local. |

These are semantic differences, not migration defects. For example, Body War explicitly says `business_kind` is project-local and not a CAV2 `node_type`, while lifecycle state is separate from candidate status (`projects/body-war/ontology/business/profile.json:64-70`). Augmentor explicitly blocks ResonantOS projection and authority outputs (`projects/augmentor/ontology/unified-agent/profile.json:64-73`).

## Designed adapter interface

```text
PackageAdapter {
  adapter_id
  adapter_version
  supports(): CapabilitySet

  inspect_profile() -> LocalProfile + GenericPackageEnvelope
  enumerate(kind, cursor, limit) -> LocalRecordEnvelope[]
  get(kind, local_id) -> LocalRecordEnvelope | not_found
  list_views(cursor, limit) -> LocalViewEnvelope[]
  list_sources(cursor, limit) -> ImmutableSourceBinding[]
  list_residue(cursor, limit) -> LocalResidueEnvelope[]
  validate() -> NativeValidationReceiptEnvelope
  validate_transition?(local_request) -> NativeDiagnosticEnvelope
  compile_snapshot() -> SnapshotManifest
}
```

Generic envelopes should contain only interoperability metadata:

```text
GenericPackageEnvelope:
  package_id, adapter_id, local_schema_id, posture,
  authority_effect, release_admission, owner_route(s),
  claim_ceiling, supported_operations

LocalRecordEnvelope:
  package_id, local_kind, local_id,
  label, aliases[], source_bindings[],
  owner_route, authority_effect,
  payload_media_type, opaque_payload, payload_sha256
```

Rules:

- `label` and predicate strings are retained unchanged in `aliases`; no canonical term is inferred.
- `opaque_payload` is byte-faithful or deterministically decoded without field loss.
- source bindings are immutable and source bytes are never copied back or rewritten.
- native diagnostics and receipts remain nested and attributable to the package validator.
- absent capabilities return a typed `unsupported_operation`, not an empty success or guessed normalization.
- direct node/relation/source CRUD, promotion, authority decisions, canonical writes, and release admission are unsupported globally. CAV2 itself says ontology may model and stage but cannot promote or redefine schemas/runtime contracts (`cyberAlchemy-v2/ontology/README.md:12-18`).

## CyberAlchemy v2 as a package

**Designed and feasible:** register the folder through a local profile such as:

```text
package_id: cyberalchemy-v2.ontology-base
adapter_id: cav2-markdown-model/v0
status: candidate
authority_effect: none
owner_route: cyberalchemy-v2-ontology-route
record_families:
  model_document, concept_table_row, relation_table_row, branch_table_row,
  projection_rule, promotion_request, residue
supported_operations:
  inspect, snapshot, list_documents, get_document, search, validate_bindings
unsupported_operations:
  validate_node_schema, validate_transition, mutate, promote
```

The adapter should expose Markdown documents and selector-addressed table rows, not manufacture Augmentor or Body War JSON. CAV2’s package boundary includes candidate models, crosswalks, views, projection rules, and promotion-request staging, while explicitly excluding live types, schema amendments, runtime contracts, and verdicts (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:32-54`). Its initial node concepts are compact model rows that require expansion before moving beyond candidate modeling (`cyberAlchemy-v2/ontology/NODE-MODEL.md:57-76`).

## Exact fixture catalog

### Positive fixtures

- Augmentor: `profile.json`, `sources.json`, `nodes/nodes.json`, `relations/relations.json`, all four `views/*.json`, `residue.json`, three closed schemas, stored validation receipt.
- Body War: `profile.json`, `sources.json`, `nodes/manifest.json`, all 237 node records, `relations/relations.json`, `views/business.json`, all 11 lifecycle policies, `residue.json`, four closed schemas, stored validation receipt.
- CAV2: `README.md`, `PACKAGE-MODEL.md`, `NODE-MODEL.md`, `RELATION-MODEL.md`, `BRANCH-AS-VIEW.md`, `ARTIFACT-TREE.md`, three Markdown views, projection and promotion-request readmes.

### Existing negative controls

- Augmentor invalid authority effect and dangerous value cycle; tests require fail-closed behavior (`projects/augmentor/ontology/unified-agent/tests/unified-agent-ontology.test.mjs:59-70`).
- Body War dangling endpoint, dangerous value cycle, direct promotion transition, and executable node fragment (`projects/body-war/ontology/business/tests/business-ontology.test.mjs:57-107`).
- Body War legal transition control distinguishes permitted evidence submission from forbidden direct promotion (`projects/body-war/ontology/business/tests/business-ontology.test.mjs:57-70`).

### Required runtime negative controls

- unknown adapter;
- undeclared package path / path traversal;
- changed source byte after registration;
- duplicate local ID;
- invalid cursor or limit over cap;
- Augmentor `validate_transition`;
- CAV2 `validate_node_schema`;
- any package `mutate_source`, `put_node`, `delete_relation`, `promote`, or `release`;
- attempted normalization of `business_kind`, Augmentor runtime posture, or local predicates into canonical vocabulary;
- receipt claiming authority from `status: pass`.

## Operator journeys

1. **Register and inspect:** operator explicitly selects profile and adapter; runtime reports package identity, local schema IDs, supported/unsupported capabilities, owners, and claim ceiling.
2. **Compile immutable snapshot:** adapter enumerates declared artifacts, verifies bound sources, hashes raw payloads, and emits a content-addressed manifest without changing source bytes.
3. **Query losslessly:** operator lists or retrieves nodes, relations, views, sources, or residue; response includes generic routing metadata plus opaque local payload.
4. **Validate:** runtime invokes the native read-only validator, preserves native diagnostics, and wraps the result with snapshot and adapter identity.
5. **Attempt unsupported work:** Augmentor lifecycle validation or any promotion request returns `unsupported_operation` with the retained owner route.
6. **Compare snapshots:** runtime reports added/removed/changed local IDs and payload hashes; semantic equivalence is explicitly not inferred.
7. **Handoff:** runtime may emit a non-authority proposal containing exact source/snapshot/record selectors; only the named owner can decide or mutate.

## Validation observations and performance

Commands executed read-only:

```bash
node --test projects/augmentor/ontology/unified-agent/tests/unified-agent-ontology.test.mjs
node projects/augmentor/ontology/unified-agent/scripts/validate.mjs
node --test projects/body-war/ontology/business/tests/business-ontology.test.mjs
du -sb <package roots>
find <package root> -type f | wc -l
```

Observed:

- Augmentor’s first test run transiently reported stale stored digests, while a direct validator run immediately returned `status: pass`, and a repeat test run passed all 6 tests. Because the validator explicitly compares stored receipt counts/digests (`projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`), this is evidence of a concurrent-byte/stored-receipt consistency hazard; snapshot admission should lock or recheck package identity.
- Stable Augmentor repeat: 6/6 pass, about 0.18 seconds. Measured package: 110,702 bytes, 21 files.
- Body War: 6/6 pass, about 1.52 seconds, peak measured RSS about 94 MB. Measured package: 6,434,169 bytes, 309 files.
- Body War’s deterministic receipt test validates order-insensitive digests/bytes (`projects/body-war/ontology/business/tests/business-ontology.test.mjs:43-55`).

**Inferred scale pressure:** file-count and source-hash cost dominate before graph size does. A v0 runtime should impose explicit per-adapter file/byte/record caps, stream hash work, cache only by complete snapshot identity, and never reuse a receipt across a changed package digest.

## Migration pressure and residue

- Profiles need a common registration envelope, but existing profiles should not be rewritten.
- Adapters need explicit schema-version negotiation and capability discovery.
- Augmentor’s aggregate shape and Body War’s per-file shape need different enumeration strategies.
- Source manifests need a lossless union of source ID, repository root, path, selector, digest, posture, and owner.
- Receipt wrappers need adapter version, snapshot digest, native receipt digest, command, exit status, diagnostics, elapsed time, and source-preservation check.
- CAV2 still lacks a local runtime profile; creating one is future owner-authorized work.
- There is no literal three-package immutable-snapshot witness.
- The transient Augmentor stale-receipt observation needs isolation/replay investigation before claiming atomic admission.
- Performance budgets remain designed, not measured under repeated snapshots or concurrent packages.
- Generated Body War presentation assets are projections; nodes and relations remain the declared graph records (`projects/body-war/ontology/business/README.md:17-37`).

```yaml
action_id: spawn-0003
status: pass
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/strategy-inventory-packet.json
  - projects/augmentor/ontology/unified-agent/
  - projects/body-war/ontology/business/
  - cyberAlchemy-v2/ontology/{README.md,PACKAGE-MODEL.md,NODE-MODEL.md,RELATION-MODEL.md,BRANCH-AS-VIEW.md,ARTIFACT-TREE.md}
validation: pass
blockers:
  - no current CAV2 local runtime profile
  - no implemented adapter interface or three-package witness
  - transient Augmentor stored-receipt consistency hazard requires replay/isolation evidence
started_at: 2026-07-30T06:17:03Z
finished_at: 2026-07-30T06:22:08Z
```
