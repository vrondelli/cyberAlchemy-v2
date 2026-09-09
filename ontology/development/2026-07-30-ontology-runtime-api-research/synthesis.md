# Exact-binding candidate: Ontology Vault runtime and API

Citation notation pairs the preserved explorer anchor/receipt with its exact underlying repository selector:

- **A1** — `research.md#agent-1--authority-contract`; `receipts/explorer-authority-contract.json`
- **A2** — `research.md#agent-2--runtimeapi`; `receipts/explorer-runtime-api.json`
- **A3** — `research.md#agent-3--package-interoperability`; `receipts/explorer-package-interoperability.json`

## 1. Decision and non-goals

**Decision — designed, not implemented:** build the smallest Ontology Vault runtime as a private, loopback-only, explicit-registration service with five separated planes:

1. immutable snapshot/query;
2. profile-gated evidence operations;
3. create-only proposal handoff;
4. bounded observability;
5. CLI-only administration.

The runtime is an adapter and read-model compiler. It is not an ontology, schema, source registry, generic vocabulary owner, project validator, authority ledger, dispatch engine, promotion engine, or application runtime. This split follows the existing runtime-profile distinction between refs, runtime modes, allowed/blocked outputs, owner gates, residue, and observability, while the CAV2 candidate package expressly cannot define runtime contracts, live schemas, movement edges, or promotion verdicts. [A1; `arcanum/arcana/ontology-vault/templates/runtime-profile.md:11-73`; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`]

**Current posture:** OEW implements useful admission, immutable-output, gateway-isolation, and teardown precedents; IOLM specifies but has not implemented its immutable GET API; the generic registry, adapters, snapshot service, run service, handoff service, and combined witness do not exist. `TASK-IOLM-004` remains `not-started` and `SWU-IOLM-004-A` remains blocked. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md:80`; `:106`; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:22-150`]

**Non-goals:**

- no source, node, relation, profile, schema, or authority CRUD;
- no owner decision, approval, promotion, release, publication, deployment, or runtime-conformance verdict;
- no crawling, arbitrary filesystem access, uploaded adapter/extractor, URL import, or outbound network;
- no universalization of project-local types, predicates, statuses, branches, confidence values, or lifecycle semantics;
- no replacement of Inventory, IOLM, OEW, native project validators, Dispatch Spec, Orchestrate, or owner workflows;
- no claim that deterministic bytes, validation success, a proposal, or a projection establish truth or authority. [A1; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-29`; `:122-133`; `cyberAlchemy-v2/ontology/projections/README.md:6-10`; A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/SPEC.md:59-70`]

## 2. Retained owners

| Concern | Retained owner | Runtime ceiling |
|---|---|---|
| Canonical/private source bytes | Declared source owner | Verify and read declared refs; never mutate |
| Runtime profile permission | Profile owner / Ontology Vault contract | Admit modes and outputs, default deny |
| Project ontology meaning | CAV2 or minted-project ontology owner | Preserve local payload and aliases |
| Validation semantics | Native project validator | Invoke and wrap attributable receipt |
| Definitions | `definitions-governance` | Emit definition request only |
| Structural/schema change | Schema governance / `decision-gate`, then `task-session` | Reject mutation; stage request |
| Implementation | `task-session` after owner gates | Handoff only |
| Promotion/authority decision | Narrowest named owner | No decision endpoint |
| Immutable projection/query precedent | IOLM design owner | Reuse contract, do not claim implementation |
| Admission/gateway precedent | OEW owner | Reuse mechanics, do not absorb OEW |
| Dispatch lifecycle | Dispatch Spec / Orchestrate | Outside runtime |

The runtime owns only configured registration projection, adapter execution containment, immutable snapshot bytes, bounded request processing, run receipts, and non-authority proposal artifacts. Authority movement remains an owner-routed review, never an automatic transition. [A1; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:31-61`; `cyberAlchemy-v2/ontology/promotion-requests/README.md:30-51`; A2; `cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:321-336`]

## 3. Package registration and adapter model

Registration is supplied only through a repository-owned startup document or CLI command:

```ts
type PackageRegistrationV0 = {
  schema_version: "ontology-runtime.registration.v0";
  package_id: string;
  profile_id: string;
  adapter: { id: string; version: string; code_sha256: string };
  package_root_ref: string;       // startup-only logical config reference
  manifest_sha256: string;
  profile_sha256: string;
  allowed_operations: string[];
  owner_routes: string[];
  privacy_class: string;
  lifecycle_policy: string;
  caps: { files: number; bytes: number; records: number };
};
```

Admission resolves configured roots with `realpath`, proves containment under a startup allowlist, rejects symlinks/non-regular/undeclared files, and stores logical identities and hashes rather than exposing physical paths. HTTP never accepts a package path. This derives from OEW’s implemented contained source admission and IOLM’s default-deny manifest contract. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs:35-152`; `cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:3-5`]

Adapters are installed code, never uploaded scripts:

```ts
interface PackageAdapterV0 {
  descriptor(): AdapterDescriptor;
  inspectProfile(): GenericPackageEnvelope;
  enumerate(kind: LocalKind, cursor?: string, limit?: number): Page<LocalRecordEnvelope>;
  get(kind: LocalKind, localId: string): LocalRecordEnvelope | NotFound;
  listViews(cursor?: string, limit?: number): Page<LocalViewEnvelope>;
  listSources(cursor?: string, limit?: number): Page<ImmutableSourceBinding>;
  listResidue(cursor?: string, limit?: number): Page<LocalResidueEnvelope>;
  validate(): NativeValidationReceiptEnvelope;
  validateTransition?(request: unknown): NativeDiagnosticEnvelope;
  compileSnapshot(): SnapshotManifest;
}
```

The descriptor binds adapter hash, supported profile/schema versions, exact input inventory, canonicalizer version, validator command identity, caps, capabilities, and `authority_effect:"none"`. Unknown adapters or incompatible versions fail closed. Existing profiles remain unchanged; the adapter owns physical enumeration and lossless wrapping. [A3; `projects/augmentor/ontology/unified-agent/profile.json:2-8`; `projects/body-war/ontology/business/profile.json:2-10`; A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/adapter-run-writer.mjs:198-274`]

## 4. Generic envelope and opaque project-local payloads

```ts
type LocalRecordEnvelopeV0 = {
  schema_version: "ontology-runtime.record.v0";
  package_id: string;
  profile_id: string;
  snapshot_id: string;
  local_kind: string;
  local_id: string;
  label?: string;
  aliases: string[];                 // exact local labels/predicates
  owner_route?: string;
  source_bindings: ImmutableSourceBinding[];
  authority_effect: "none" | "staging" | "projection" | "blocked" | null;
  confidence?: {
    evidence_confidence?: unknown;
    commitment_confidence?: unknown;
  };
  local_status?: { axis: string; value: unknown };
  payload: {
    media_type: string;
    schema_ref?: string;
    payload_sha256: string;
    value: unknown;                  // lossless opaque project-local record
  };
  residue?: unknown;
};
```

Global identity is `(profile_id, snapshot_id, local_kind, local_id)`. The envelope standardizes addressing, provenance, bounds, and authority ceiling only. It does not define ontology meaning. Evidence confidence and commitment confidence remain separate; challenge state and workflow status are not collapsed into either. [A1; `cyberAlchemy-v2/ontology/NODE-MODEL.md:14-55`; `:78-89`; A3; `projects/body-war/ontology/business/profile.json:64-70`]

Branch IDs and `business_kind`, Augmentor `runtime_posture`, relation predicates, lifecycle states, and local statuses remain opaque aliases/facets. A branch remains an interpretive view, not a namespace, type, lifecycle state, owner route, or promotion route. [A1; `cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-47`; A3; `projects/augmentor/ontology/unified-agent/nodes/nodes.json:5-50`]

## 5. Immutable snapshots and source binding

Compilation must:

1. acquire a package admission lock;
2. record a pre-enumeration identity over registration, profile, manifest, declared files, and stored native receipt;
3. enumerate manifest-declared regular files only;
4. stream-hash raw bytes and retain exact source bindings;
5. run the admitted adapter with minimal environment, fixed cwd, closed stdin, timeout, memory/output caps, and outbound denial;
6. compile twice in clean temporary roots and compare canonical bytes;
7. re-enumerate and recompute the complete package identity before publication;
8. verify source digests and protected source bytes are unchanged;
9. publish atomically into a create-only directory, writing the receipt last.

```text
snapshot_id =
sha256(
  envelope_version ||
  registration_digest ||
  adapter_code_digest ||
  canonicalizer_version ||
  profile_digest ||
  ordered_complete_package_identity ||
  canonical_output_digest
)
```

An identical identity returns the existing snapshot. Same ID with unequal bytes is a fatal collision. Changed bytes yield `SOURCE_DRIFT`; unequal double-compilation yields `NONDETERMINISTIC_ADAPTER`.

The pre/post identity check is a load-bearing admission rule, not an optimization. Augmentor transiently failed its stored-receipt digest check, then its direct validator and repeat test passed. Because its validator compares stored counts/digests, the event demonstrates a concurrent package-byte/stored-receipt hazard. Package locking plus pre/post complete-identity equality is therefore mandatory; the runtime must still preserve **unresolved replay/isolation residue** until repeated concurrent compilation proves that this rule closes the race. [A3; `projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`]

A snapshot is a read model, not a source, truth claim, owner decision, or authority artifact. Identity-bearing input changes always create a new snapshot. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:85-108`]

## 6. Planes and endpoint/command catalog

### Query plane

- `GET /v1/packages`
- `GET /v1/packages/{package_id}`
- `GET /v1/profiles/{profile_id}`
- `GET /v1/snapshots/{snapshot_id}`
- `GET /v1/snapshots/{snapshot_id}/records`
- `GET /v1/snapshots/{snapshot_id}/records/{kind}/{local_id}`
- `GET /v1/snapshots/{snapshot_id}/relations`
- `GET /v1/snapshots/{snapshot_id}/views`
- `GET /v1/snapshots/{snapshot_id}/sources`
- `GET /v1/snapshots/{snapshot_id}/residue`
- `GET /v1/snapshots/{snapshot_id}/search`
- `GET /v1/snapshots/{snapshot_id}/neighborhoods/{local_id}`

The families adapt IOLM’s designed immutable snapshot/entity/neighborhood/claim/search/journey/source-anchor contract without claiming its implementation. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`]

### Operation plane

- `POST /v1/snapshots` — create immutable snapshot from registered logical IDs
- `POST /v1/runs` — only `profile.validate`, `snapshot.diff`, and explicitly profile-allowed evidence/report operations
- `GET /v1/runs/{run_id}`
- `GET /v1/runs/{run_id}/artifacts`
- `GET /v1/runs/{run_id}/artifacts/{artifact_id}`

Run states are `queued|running|succeeded|failed|cancelled`; terminal state is immutable. Runs consume snapshot IDs, never raw paths. A passing validation receipt remains evidence bounded by the native validator’s claim ceiling. [A1; `arcanum/arcana/ontology-vault/SKILL.md:156-214`; A3; `projects/body-war/ontology/business/receipts/validation-receipt.json:1-54`]

### Proposal-handoff plane

- `POST /v1/runs/{run_id}/proposal-handoffs`
- `GET /v1/proposal-handoffs/{handoff_id}`

The create-only handoff binds observations, exact package/snapshot/run/receipt/record selectors, semantic delta, conflicts, confidence axes, unresolved residue, suggested owner, and `authority_effect:"none"`. It neither calls the owner nor applies a change. [A1; `cyberAlchemy-v2/ontology/promotion-requests/README.md:12-28`; `:41-51`]

### Observability plane

- `GET /healthz`
- `GET /readyz`
- `GET /v1/metrics`
- `GET /v1/events?cursor=...`

Events bind request/run/snapshot IDs, versions, counts, durations, verdict posture, residue, and artifact digests, but remain evidence rather than decisions. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:177-179`]

### Admin plane

CLI only:

```text
ontology-runtime verify-registry --registry <configured-file>
ontology-runtime serve --registry <configured-file> --store <owned-store>
ontology-runtime inspect-package --package-id <logical-id>
ontology-runtime gc --store <owned-store> --content-id <exact-id>
ontology-runtime stop --handle <owned-handle>
```

No HTTP register, upload, delete, garbage-collect, shutdown, approve, promote, publish, or deploy endpoint.

## 7. Typed contracts

```ts
type RequestV0 = {
  schema_version: "ontology-runtime.request.v0";
  request_id: string;
  expected_profile?: string;
  snapshot_id?: string;
  operation?: string;
  parameters?: unknown;
};

type ResponseV0<T> = {
  schema_version: "ontology-runtime.response.v0";
  request_id: string;
  result: T;
  identity?: {
    snapshot_id: string;
    content_sha256: string;
    etag: string;
  };
  bounds: { truncated: boolean; next_cursor: string | null };
  authority_effect: "none";
};

type ErrorV0 = {
  schema_version: "ontology-runtime.error.v0";
  request_id: string;
  error: {
    code:
      | "REQUEST_INVALID" | "PATH_FORBIDDEN" | "AUTH_REQUIRED" | "FORBIDDEN"
      | "PACKAGE_NOT_FOUND" | "SNAPSHOT_NOT_FOUND" | "RUN_NOT_FOUND"
      | "METHOD_NOT_ALLOWED" | "IDEMPOTENCY_CONFLICT"
      | "OUTPUT_ALREADY_EXISTS" | "PRECONDITION_FAILED"
      | "PAYLOAD_TOO_LARGE" | "QUERY_CAP_EXCEEDED"
      | "TOO_MANY_REQUESTS" | "ADAPTER_UNSUPPORTED"
      | "OPERATION_UNSUPPORTED" | "SOURCE_DRIFT"
      | "PACKAGE_IDENTITY_CHANGED" | "NONDETERMINISTIC_ADAPTER"
      | "VALIDATION_FAILED" | "RUN_CAPACITY_EXHAUSTED"
      | "INTERNAL_FAILURE";
    message: string;
    retryable: boolean;
    details: unknown[];
    owner_route?: string;
  };
  authority_effect: "none";
};

type ReceiptV0 = {
  schema_version: "ontology-runtime.receipt.v0";
  receipt_id: string;
  kind: "snapshot" | "run" | "proposal-handoff";
  package_id: string;
  profile_id: string;
  adapter: { id: string; version: string; code_sha256: string };
  snapshot_ids: string[];
  registration_sha256: string;
  pre_identity_sha256: string;
  post_identity_sha256: string;
  source_bindings_sha256: string;
  native_receipt_sha256?: string;
  command_identity?: string;
  exit_status?: number;
  diagnostics: unknown[];
  artifacts: { id: string; media_type: string; bytes: number; sha256: string }[];
  source_preservation: { before_sha256: string; after_sha256: string; unchanged: boolean };
  elapsed_ms: number;
  authority_effect: "none";
  claim_ceiling: string;
  residue: unknown[];
};
```

Errors never echo tokens, stack traces, physical paths, private excerpts, or protected bytes. `OPERATION_UNSUPPORTED` names the retained owner route where known; it is never converted to empty success. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-oew-prototype.mjs:404-589`; A3; `projects/augmentor/ontology/unified-agent/profile.json:64-73`]

## 8. Isolation, lifecycle, idempotency, concurrency, caching, teardown

- Bind `127.0.0.1` only; use an ephemeral 256-bit bearer token; never persist it.
- Permit GET/HEAD plus the three enumerated create-only POST families.
- Reject upgrades and all mutation verbs elsewhere.
- No outbound network; acceptance records zero requests.
- No arbitrary filesystem input; reject lexical and encoded traversal, symlinks, directories, undeclared files, and containment escapes.
- Snapshot/run/handoff directories are create-only; artifacts are content-addressed.
- Idempotency keys are mandatory for POST. Same key and canonical body returns the existing object; different body returns `IDEMPOTENCY_CONFLICT`.
- One compiler per registration; identical compilation coalesces only after matching complete pre-identity.
- One active run per `(snapshot IDs, operation/version, parameter hash)`.
- v0: two global workers, one worker per package, queue cap 16.
- Cache only immutable canonical response bytes by complete snapshot identity plus normalized query; ETag is quoted SHA-256 of those bytes. `If-None-Match` returns 304.
- Suggested v0 caps: page 100, depth 2, nodes 250, relations 500, search 256 UTF-8 bytes, excerpt 8 KiB, response 2 MiB, request target 8 KiB. These are design targets, not measured acceptance budgets.
- Failed temporary roots are removed in `finally`; snapshots persist until explicit offline GC policy.
- Teardown may close only the process-owned PID, port, handle, and temporary/store paths. It must release the port and prove protected source bytes unchanged.

OEW currently proves these isolation mechanisms separately, including create-only writes, token-gated GET/HEAD, zero outbound requests, and port release; it does not prove the combined generic runtime. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/adapter-run-writer.mjs:281-327`; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:44-150`]

## 9. Profiles and adapters

### CAV2 base profile

**Absent today; owner decision required before creation.** Proposed adapter: `cav2-markdown-model/v0`.

Record families: `model_document`, selector-addressed `concept_table_row`, `relation_table_row`, `branch_table_row`, `projection_rule`, `promotion_request`, and `residue`.

Allowed: inspect, snapshot, list/get documents and rows, bounded search, validate source bindings. Unsupported: JSON node-schema validation, lifecycle transition validation, mutation, promotion, release, or conformance verdict.

It must expose Markdown and selector-addressed rows; it must not fabricate Augmentor/Body War JSON records. CAV2’s model shape is explicitly not a live schema. [A3; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:32-54`; `:90-123`; `cyberAlchemy-v2/ontology/NODE-MODEL.md:57-76`]

### Augmentor adapter

Proposed adapter: `augmentor-unified-agent-json/v0`.

It enumerates aggregate node/relation files, four JSON views, source IDs joined through `sources.json`, and residue. Native validation remains the existing validator. `validate_transition` is unsupported. The adapter preserves `branches`, `runtime_posture`, predicate scope, and unresolved ResonantOS projection as local semantics. Admission must enforce package locking and complete pre/post identity equality because of the stale-receipt event. [A3; `projects/augmentor/ontology/unified-agent/profile.json:31-73`; `projects/augmentor/ontology/unified-agent/relations/relations.json:5-25`; `projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`]

### Body War adapter

Proposed adapter: `body-war-business-json/v0`.

It streams the 237 per-file nodes through the manifest, relations, business view, 11 lifecycle policies, residue, and inline source selectors/digests. It may expose `validate_transition` because the native package owns that diagnostic contract. `business_kind`, lifecycle state, prototype availability, and presentation assets remain local; SVG/HTML/Markdown are projections, not graph records. [A3; `projects/body-war/ontology/business/receipts/validation-receipt.json:4-9`; `projects/body-war/ontology/business/profile.json:64-70`; `projects/body-war/ontology/business/README.md:17-37`]

## 10. No-direct-CRUD and no-promotion laws

1. No `POST|PUT|PATCH|DELETE` for packages, profiles, sources, nodes, relations, views, schemas, or source anchors.
2. No uploaded adapter, extractor, validator, or arbitrary command.
3. No `approve`, `admit`, `promote`, `demote`, `publish`, `release`, `deploy`, `make-authoritative`, or owner-decision operation.
4. Snapshot creation writes only runtime-owned immutable read models.
5. Validation success cannot alter status, maturity, confidence, authority, release admission, or promotion state.
6. Proposal creation cannot contact an owner system or apply its proposed delta.
7. A projection cannot become canonical because it is useful, deterministic, or served by the API.
8. Any adapter asking for these powers fails admission.

These are architectural rejection conditions, not optional profile settings. [A1; `cyberAlchemy-v2/ontology/README.md:12-18`; `cyberAlchemy-v2/ontology/promotion-requests/README.md:6-10`; A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`]

## 11. Smallest local-fixture vertical witness

**Designed; no such witness currently exists.**

Start with one tiny, repository-owned, read-only fixture and one admitted fixture adapter:

```bash
ontology-runtime serve \
  --registry fixtures/registry.json \
  --store "$EXACT_TEMP_STORE"
```

The acceptance path is:

1. create snapshot with package/profile logical IDs and idempotency key;
2. repeat creation and prove identical snapshot ID, manifest, receipt, and bytes;
3. inspect snapshot and list/get records, relations, views, sources, residue;
4. query neighborhood at depth 2 and bounded search;
5. prove route ETag and 304;
6. run `profile.validate` and retrieve native-plus-wrapper receipt;
7. create a second fixture snapshot and run deterministic `snapshot.diff`;
8. create and retrieve one owner-routed, non-authority proposal handoff;
9. prove source digests unchanged;
10. terminate and prove port release and owned-temp-only cleanup.

Representative requests:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-snapshot-1" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:$PORT/v1/snapshots" \
  -d '{"package_id":"fixture:poker","profile_id":"fixture-readonly@1"}'

curl -i -sS \
  -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/v1/snapshots/$SNAPSHOT_ID/neighborhoods/F1?depth=2&limit=50"

curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-validate-1" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:$PORT/v1/runs" \
  -d "{\"snapshot_id\":\"$SNAPSHOT_ID\",\"operation\":\"profile.validate\",\"parameters\":{}}"
```

Only after that local fixture passes should the Augmentor adapter be admitted, then Body War, then an owner-approved CAV2 base profile. A component diagram or schema-only prototype does not satisfy this witness. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md:16-28`; A3; `projects/body-war/ontology/business/tests/business-ontology.test.mjs:43-107`]

## 12. Negative fixtures and tests

### Negative fixtures

- unknown or wrong-version adapter;
- undeclared package root, file, symlink, directory, lexical traversal, encoded traversal;
- file or stored receipt changed between pre/post identity;
- duplicate local ID;
- nondeterministic double compilation;
- invalid cursor, oversized page, depth 3, oversized response;
- same idempotency key with different body;
- Augmentor `validate_transition`;
- CAV2 `validate_node_schema`;
- cross-adapter diff without an admitted bridge;
- any direct CRUD, `promote`, `approve`, `release`, or authority operation;
- local alias/predicate/status normalization into canonical vocabulary;
- passing receipt recast as authority;
- attempted outbound request;
- teardown targeting an unowned PID, port, or path.

Existing native controls should be retained, not copied: Augmentor invalid authority effect and dangerous value cycle; Body War dangling endpoint, dangerous value cycle, direct promotion transition, executable node fragment, and legal-transition control. [A3; `projects/augmentor/ontology/unified-agent/tests/unified-agent-ontology.test.mjs:59-70`; `projects/body-war/ontology/business/tests/business-ontology.test.mjs:57-107`]

### Test layers

- **Unit:** canonical serialization, ID derivation, ETag, cursor validation, caps, containment, symlink rejection, alias preservation, error redaction, idempotency.
- **Adapter contract:** capability discovery, lossless payload round-trip, stable enumeration, native receipt attribution, unsupported-operation behavior, source binding.
- **Deterministic replay:** double compile, reordered filesystem enumeration, unchanged repeat, changed-byte new identity, create-only collision.
- **Race/isolation:** mutate a fixture or stored receipt between passes and require `PACKAGE_IDENTITY_CHANGED`; run concurrent admission and prove no mixed snapshot. This is mandatory before closing Augmentor residue.
- **Security:** auth failures, method rejection, traversal variants, no URL import, no uploaded code, minimal child environment, time/memory/output limits, zero outbound, no secret/path leakage.
- **HTTP/curl:** all witness steps, 304, query caps, typed failures, artifact retrieval.
- **Browser:** loopback-only navigation, CSP, zero outbound/errors, no authority controls, teardown. Browser success proves presentation/runtime behavior only, not ontology correctness or production readiness. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json:24-89`; `:130-173`]

## 13. Delivery slices

### v0 — runnable local-fixture proof

- CLI registration/start/stop;
- one fixture adapter;
- package admission lock plus pre/post complete-identity check;
- immutable double-compiled snapshots;
- records/relations/views/sources/residue/search/neighborhood GETs;
- one native validation operation and deterministic same-adapter diff;
- create-only proposal handoff;
- typed receipts/errors, ETags, caps, token, zero outbound, teardown;
- full negative and race witness.

### v1 — live minted-project interoperability

- admit Augmentor and Body War adapters without changing their profiles;
- streaming enumeration and explicit file/byte/record caps;
- preserve local facets and native diagnostics;
- Body War-only transition validation;
- measured repeated-snapshot, concurrency, latency, RSS, storage, and replay receipts;
- keep stale-receipt residue open until the race suite passes repeatedly.

### v2 — owner-approved base and broader operations

- owner-approved CAV2 base profile and Markdown adapter;
- profile-listed Ontology Vault report operations;
- admitted bridge adapters for explicitly owned cross-adapter comparisons;
- explicit offline retention/GC policy;
- optional UI consuming only immutable APIs.

No slice includes direct CRUD, authority decisions, promotion, or release.

## 14. Migration and rollback

Migration is additive:

1. do not rewrite current package profiles or records;
2. add external registration envelopes;
3. negotiate adapter and envelope versions explicitly;
4. store raw payload digests plus lossless opaque payloads;
5. wrap native receipts rather than translating their diagnostic semantics;
6. create a new snapshot for every identity-bearing input/version change;
7. reject unsupported versions instead of silently upgrading.

Rollback stops the loopback process, removes only the exact runtime-owned temporary/store objects for the failed candidate version, and restores the prior registry/adapter selection. Source packages require no rollback because they were never mutated. Published snapshots are immutable; rollback changes selection, not bytes. Adapter downgrade may read only snapshots whose descriptor version it explicitly supports. Proposal artifacts remain non-authority evidence and cannot require source reversal.

## 15. Unresolved owner decisions

1. Who owns approval and lifecycle of the absent CAV2 base runtime profile?
2. Which repository owns the runtime implementation and registration documents?
3. Is the generic envelope merely implementation-local v0, or will an owner later admit it as a reusable runtime contract?
4. Which exact operations beyond native validation and deterministic diff are permitted per profile?
5. Which process-level sandbox enforces outbound denial and memory limits?
6. What measured v0 latency, RSS, file, byte, record, queue, and retention budgets become acceptance gates?
7. Who owns offline garbage collection and retention decisions?
8. Can any bridge adapter own cross-package semantic comparison, and through which gate?
9. What repeated concurrency/replay evidence is sufficient to close the Augmentor stale-receipt residue?
10. Does proposal handoff remain artifact-only, or may a future separately authorized adapter deliver it to an owner-controlled system?
11. Which privacy classes may expose excerpts, and under what per-profile cap?
12. What exact owner route approves browser/UI work after the API witness?

Until resolved, these remain blocked or default-denied, not implementation discretion.

## 16. Verdict matrix

| Element | Current evidence | Candidate verdict |
|---|---|---|
| Owner-preserving plane split | Profile/authority law observed | **Accept design** |
| Explicit registration | OEW/IOLM precedent, generic form absent | **Accept for v0** |
| Generic envelope | Designed only | **Accept implementation-local; no schema claim** |
| Opaque project payloads | Two packages prove semantic differences | **Required** |
| Immutable snapshot compiler | IOLM designed; OEW mechanics implemented | **Accept after witness** |
| Pre/post package identity | Stale Augmentor receipt is real hazard evidence | **Mandatory admission rule** |
| Generic query API | IOLM planned, not implemented | **Accept bounded subset for v0** |
| Native validation wrapper | Project validators observed | **Accept; validator remains owner** |
| Diff/drift | Generic service absent | **Accept hash/local-ID diff; no semantic verdict** |
| Proposal handoff | Authority route observed; API absent | **Accept artifact-only** |
| Direct ontology CRUD | Conflicts with retained owners | **Reject** |
| Promotion/approval API | Conflicts with authority law | **Reject** |
| CAV2 base profile | Absent | **Block pending owner decision** |
| Augmentor adapter | Package observed; adapter absent | **v1 after race proof** |
| Body War adapter | Package observed; adapter absent | **v1 after fixture proof** |
| Three-package witness | Absent | **Do not claim** |
| Performance budgets | Two package measurements only | **Open; measure in v1** |
| Replay/isolation closure | Transient inconsistency unresolved | **Open, load-bearing blocker for atomicity claim** |
| Production/release readiness | No evidence or authority | **Reject claim** |

Overall status: **pass as a bounded, exact-binding research design; blocked from implementation-readiness, admission, or release claims.** The smallest credible next proof is the runnable v0 local-fixture witness with package locking, pre/post identity equality, deterministic replay, security negatives, source preservation, and teardown.

```yaml
action_id: spawn-0004
status: pass
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/dispatch-sheet.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/research.md
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/explorer-authority-contract.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/explorer-runtime-api.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/explorer-package-interoperability.json
validation: pass
blockers:
  - no current CAV2 local runtime profile
  - generic runtime, adapters, registration, diff, proposal handoff, and combined witness are absent
  - transient Augmentor stored-receipt consistency hazard lacks repeated concurrency and replay closure
started_at: 2026-07-30T06:22:09Z
finished_at: 2026-07-30T06:29:17Z
```
