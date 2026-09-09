# Replacement exact-binding candidate: Ontology Vault runtime and API

This is a research-only candidate contract. It does not authorize implementation, profile creation, admission, deployment, promotion, or release.

Citation notation preserves the explorer bindings:

- **A1** — `research.md#agent-1--authority-contract`; `receipts/explorer-authority-contract.json`
- **A2** — `research.md#agent-2--runtimeapi`; `receipts/explorer-runtime-api.json`
- **A3** — `research.md#agent-3--package-interoperability`; `receipts/explorer-package-interoperability.json`

## 1. Decision, posture, and non-goals

### Decision

The candidate is a private, loopback-only process with four narrowly bounded functions:

1. losslessly extract explicitly configured local packages through admitted adapters;
2. construct runtime-owned immutable snapshots and bounded read responses;
3. execute exactly three v0 operation classes:
   - local adapter extraction/compilation;
   - native project validation;
   - deterministic same-adapter byte/local-ID diff;
4. construct and retrieve immutable `PromotionRequest`-compatible **draft proposal artifacts** without delivering them or entering their owner-review lifecycle.

Every registration, snapshot, run, retention/GC, and service transition described below is **`[DESIGNED, OWNER-ABSENT]`**. No API or command may be admitted until a separately selected runtime-contract owner and implementation owner are named through the existing authority route. Runtime contracts belong behind owner gates and implementation execution belongs to `task-session`; research and useful precedent do not supply that authority. [A1; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:50-61`; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`]

### Current versus target posture

| Element | Current evidence | Candidate posture |
|---|---|---|
| Runtime-contract owner | Absent | **Blocked** |
| Runtime implementation owner | Absent | **Blocked** |
| `[ABSENT ADAPTER: implementation-local configured registration projection]` | Absent | Designed, owner-gated |
| Generic package adapters | Absent | Designed, owner-gated |
| Generic snapshot/query service | Absent; IOLM design only | Designed, owner-gated |
| Generic validation/diff service | Absent | Designed, owner-gated |
| Draft proposal artifact constructor | Absent | Designed, owner-gated |
| OEW admission/gateway mechanisms | Implemented precedent | Build from, do not absorb |
| Combined v0 fixture witness | Absent | Required before readiness |
| CAV2 runtime profile | Absent | Blocked on CAV2 owner |
| Augmentor/Body War runtime adapters | Absent | Later candidate work |
| Augmentor admission atomicity | Unresolved stale-receipt residue | Must remain open |

IOLM’s seven-family immutable GET contract remains designed and its API work remains not started/blocked; OEW proves contained admission, create-only output, token-gated loopback reads, zero-outbound observation, and teardown separately, not this generic runtime. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md:80`; `:106`; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:22-150`]

### Explicit non-goals

The runtime does not:

- discover, crawl, ingest, index, rank, or select packages, sources, profiles, truth, or work;
- replace Inventory discovery or compiled indexes;
- replace IOLM, OEW, Ontology Vault profiles, or native project validators;
- validate a Dispatch Spec or own any Orchestrate preflight, confirmation, spawn, queue, join, retry, interrupt, gate, receipt registration, closeout, or agent lifecycle;
- perform delegated or agent-backed work;
- mutate packages, profiles, sources, schemas, nodes, relations, views, status, confidence, lifecycle, authority, or release state;
- decide, deliver, review, approve, promote, publish, deploy, or release;
- own a generic ontology vocabulary, predicate catalog, branch namespace, status model, lifecycle model, confidence scalar, or authority taxonomy;
- infer semantic equivalence, semantic drift, transition validity, ontology conformance, runtime conformance, maturity, readiness, or owner approval;
- accept paths, URLs, uploaded code, uploaded extractors, arbitrary commands, or outbound networking through HTTP.

Inventory remains discovery only; the runtime receives already-selected identities. Agent-backed work returns `OPERATION_UNSUPPORTED` with the Orchestrate route. [A1; `cyberAlchemy-v2/SOURCE-MAP.md:23-33`; `arcanum/arcana/ontology-vault/SKILL.md:156-177`; A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/SPEC.md:59-70`]

## 2. Retained owners and absent runtime owners

| Concern or transition | Retained or required owner | Runtime ceiling |
|---|---|---|
| Source bytes and meaning | Declared source/package owner | Read declared refs; preserve bytes |
| Profile permission | Exact profile owner refs and owner gates | Default-deny admission |
| Local vocabulary and semantics | CAV2/Augmentor/Body War package owner | Preserve opaque values |
| Native validation | Native project validator | Invoke and wrap, never reinterpret |
| Semantic drift | Profile-named ontology owner | Unsupported unless separately admitted |
| Promotion request lifecycle | Existing ontology promotion-request route | Create draft bytes only |
| Owner review and decision | Narrowest actual owner | Entirely outside runtime |
| Definitions/schema/constitution | Existing governance owners | Draft request only; no mutation |
| Dispatch route validation | Dispatch Spec | Entirely outside runtime |
| Agent execution lifecycle | Orchestrate | Entirely outside runtime |
| Registration transitions | **Owner absent** | `[DESIGNED, OWNER-ABSENT]` |
| Snapshot transitions | **Owner absent** | `[DESIGNED, OWNER-ABSENT]` |
| Run transitions | **Owner absent** | `[DESIGNED, OWNER-ABSENT]` |
| Retention/GC transitions | **Owner absent** | `[DESIGNED, OWNER-ABSENT]` |
| Service start/ready/stop | **Owner absent** | `[DESIGNED, OWNER-ABSENT]` |

Admission is blocked until the runtime-contract and implementation owners are selected and bind each transition:

```text
configured registration -> verified | rejected
package locked -> extracted -> compiled -> published | reused | failed
run queued -> running -> succeeded | failed
snapshot retained -> GC-eligible -> deleted
service stopped -> starting -> ready -> stopped | failed
```

There is no `cancelled` run state: no cancellation actor, command, permission, or transition owner exists in this research contract.

The runtime owns no state corresponding to `handed_off`, `owner-review`, `accepted-for-review`, `deferred`, `blocked`, `rejected`, or `owner-decision`. Those belong to the existing promotion-request and owner lifecycle. [A1; `cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-29`]

## 3. Registration and adapter boundary

### Registration projection

The registry is explicitly:

> **`[ABSENT ADAPTER: implementation-local configured registration projection]`**

It binds already-selected package, profile, adapter, and exact typed owner references for one implementation. It is not a discovery source, Inventory projection owner, ontology index, selection engine, package catalog, or authority registry.

```ts
type ConfiguredRegistrationV0 = {
  schema_version: "ontology-runtime.registration.v0";
  package_id: string;
  profile_id: string;
  adapter: {
    id: string;
    version: string;
    code_sha256: string;
  };
  configured_package_root_ref: string; // startup-only
  manifest_sha256: string;
  profile_sha256: string;
  profile_owner_refs: Array<{
    role: string;
    opaque_ref: string;
  }>;
  adapter_capabilities: Array<
    "emit_local_records" |
    "native_validate" |
    "same_adapter_byte_local_id_diff"
  >;
  source_privacy_class: string;
  fixture_caps: ResourceCapsV0;
};
```

The runtime must reject flattened generic `owner_routes: string[]`; exact role-bearing owner refs remain opaque profile assertions. It resolves configured roots only at startup, proves lexical and canonical containment, rejects symlinks, non-regular files, undeclared files, crawling, and glob discovery, then exposes logical IDs only. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs:35-152`; `cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:3-5`; A3; `projects/augmentor/ontology/unified-agent/profile.json:15-23`]

### Adapter contract

The adapter owns lossless local extraction only:

```ts
interface PackageAdapterV0 {
  descriptor(): AdapterDescriptorV0;
  inspectProfile(): OpaqueLocalProfile;
  emitLocalRecords(input: DeclaredPackageInput): AsyncIterable<LocalExtractionItem>;
  emitSourceBindings(): AsyncIterable<ImmutableSourceBinding>;
  emitNativeReceipt(): OpaqueNativeReceipt | "not_provided";
  emitDiagnostics(): AsyncIterable<OpaqueNativeDiagnostic>;
  emitResidue(): AsyncIterable<OpaqueLocalResidue>;
  invokeNativeValidation?(): NativeValidationExecution;
}

type LocalExtractionItem = {
  local_kind: string;
  local_id: string;
  payload_media_type: string;
  payload_bytes: Uint8Array;
  payload_sha256: string;
  human_alias_bindings: HumanAliasBinding[];
  local_facets: OwnerBoundLocalFacet[];
  source_bindings: ImmutableSourceBinding[];
};
```

Adapters must not return:

- `snapshot_id`;
- `SnapshotManifest`;
- canonical generic envelopes;
- publication paths or instructions;
- collision decisions;
- retention decisions;
- generic ontology meanings;
- generic authority/status/lifecycle semantics.

The runtime compiler alone constructs generic envelopes, canonicalizes them, computes snapshot identity, publishes create-only bytes, handles reuse/collision, and produces receipts. An adapter-returned snapshot ID or manifest fails admission as `ADAPTER_CONTRACT_VIOLATION`; its value cannot influence identity except as rejected input. OEW’s precedent separates source admission, mapping, canonicalization, and writing; CAV2 cannot grant adapters runtime-contract authority. [A2; `cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:167-190`; A1; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`]

Adapter admission attests code identity and extraction compatibility only. It never admits ontology meaning, schema authority, validator authority, snapshot lifecycle authority, or promotion permission.

## 4. Generic envelope without semantic collapse

```ts
type HumanAliasBinding = {
  alias_role: string;
  raw_text: string;
  language?: string;
  axis_owner: string;
  schema_ref?: string;
  source_selector: string;
};

type OwnerBoundLocalFacet = {
  facet_kind:
    | "predicate"
    | "view_ref"
    | "branch_ref"
    | "status"
    | "lifecycle"
    | "runtime_posture"
    | "release_admission"
    | "source_authority_effect"
    | "business_kind"
    | "challenge_state"
    | "other";
  local_axis: string;
  raw_value: unknown;
  axis_owner: string;
  owner_route?: string;
  schema_ref?: string;
  source_selector: string;
};

type ConfidenceAxis = {
  posture: "provided" | "not_provided";
  raw_value?: unknown;
  axis_owner?: string;
  schema_ref?: string;
  source_selector?: string;
};

type ConfidencePair = {
  evidence_confidence: ConfidenceAxis;
  commitment_confidence: ConfidenceAxis;
};

type RuntimeRecordEnvelopeV0 = {
  schema_version: "ontology-runtime.record.v0";
  package_id: string;
  profile_id: string;
  snapshot_id: string;
  local_kind: string;
  local_id: string;
  runtime_record_id: string;
  runtime_authority_effect: "none";
  human_alias_bindings: HumanAliasBinding[];
  local_facets: OwnerBoundLocalFacet[];
  confidence: ConfidencePair;
  source_bindings: ImmutableSourceBinding[];
  opaque_payload: {
    media_type: string;
    bytes_sha256: string;
    bytes: Uint8Array;
  };
};
```

`runtime_authority_effect` is invariant `"none"`. Any source-owned `authority_effect`, `candidate_status`, maturity, lifecycle, release admission, runtime posture, or similar axis remains inside the opaque payload or an owner-bound local facet. The runtime does not normalize lexical values such as `blocked`, `staging`, or `projection` across packages. [A1; `cyberAlchemy-v2/ontology/RELATION-MODEL.md:13-26`; A3; `projects/augmentor/ontology/unified-agent/profile.json:2-8`; `projects/body-war/ontology/business/profile.json:2-10`]

Human aliases are distinct from predicates, branch/view refs, statuses, lifecycle values, and every other local axis. Queries that filter local facets must include all of:

```text
package_id
profile_id
facet_kind
local_axis
raw_value
```

Equal raw values from different package/profile/axis tuples are not filter-equivalent or interoperable.

Neighborhood traversal uses only adapter-declared local relation endpoints and predicates within one package/profile/snapshot. It does not infer a universal predicate catalog. Branch filtering addresses an exact local view record; a branch never prefixes identity or creates a namespace, owner boundary, type, lifecycle state, or promotion route. [A1; `arcanum/arcana/ontology-vault/SKILL.md:98-117`; `:156-164`; `cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-47`; A3; `projects/augmentor/ontology/unified-agent/relations/relations.json:5-21`]

Whenever confidence appears, both axes are present independently. Missing local confidence becomes `not_provided` on the affected axis; one axis is never copied to or inferred from the other. Scalar `confidence` is rejected at the generic boundary. Challenge state, workflow status, validation result, run state, and owner decisions remain outside both confidence axes. [A1; `cyberAlchemy-v2/ontology/NODE-MODEL.md:14-55`; `arcanum/arcana/ontology-vault/SKILL.md:188-197`]

## 5. Immutable snapshot and source-binding model

All transitions remain `[DESIGNED, OWNER-ABSENT]`.

A future owner-bound compiler would:

1. acquire one registration-scoped lock;
2. compute a complete pre-extraction package identity over registration, profile, manifest, every declared input byte, and stored native receipt;
3. permit the adapter to emit only lossless local extraction items;
4. have the runtime construct envelopes and canonicalize them;
5. execute extraction twice in clean owned temporary roots;
6. require identical canonical runtime bytes;
7. recompute the complete package identity after the second extraction;
8. require exact pre/post identity equality;
9. verify protected source digests before/after;
10. publish atomically into a create-only runtime-owned directory, with receipt last.

```text
snapshot_id =
sha256(
  runtime_envelope_version ||
  registration_digest ||
  adapter_id_and_code_digest ||
  runtime_canonicalizer_version ||
  profile_digest ||
  ordered_complete_source_identity ||
  canonical_runtime_output_digest
)
```

Only runtime-owned material enters the identity formula. Adapter content influences the result solely through declared adapter identity and hashed emitted bytes.

Outcomes:

- identical identity and equal bytes: `reused`;
- source or stored-receipt identity changed: `PACKAGE_IDENTITY_CHANGED`;
- double extraction differs: `NONDETERMINISTIC_ADAPTER`;
- pre/post source mismatch: `SOURCE_DRIFT`;
- same snapshot ID with unequal bytes: `SNAPSHOT_COLLISION`;
- cap exceeded: fail closed with the appropriate resource error.

A snapshot is a runtime read model, not source, ontology truth, authority artifact, conformance verdict, or owner decision. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:85-108`; A1; `cyberAlchemy-v2/ontology/projections/README.md:6-10`]

### Augmentor race residue

Augmentor transiently reported stale stored receipt digests; direct validation and the repeated test then passed. Its validator compares stored receipt counts/digests. This is evidence of a package-byte/stored-receipt race, not evidence that atomic admission is solved. Registration locking and complete pre/post identity equality are mandatory, but replay/isolation residue remains open until repeated controlled mutation and concurrent-extraction tests prove fail-closed behavior. [A3; `projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`]

## 6. Planes, endpoints, and commands

All state-changing families are `[DESIGNED, OWNER-ABSENT]` and unavailable until owner selection.

### Query plane

Minimum v0 fixture surface:

- `GET /v1/packages/{package_id}` — configured registration projection only;
- `GET /v1/snapshots/{snapshot_id}`;
- `GET /v1/snapshots/{snapshot_id}/records`;
- `GET /v1/snapshots/{snapshot_id}/records/{local_kind}/{local_id}`;
- `GET /v1/snapshots/{snapshot_id}/sources`;
- `GET /v1/runs/{run_id}`;
- `GET /v1/runs/{run_id}/artifacts`;
- `GET /v1/runs/{run_id}/artifacts/{artifact_id}`;
- `GET /v1/proposal-artifacts/{artifact_id}`;
- `GET /healthz`;
- `GET /readyz`.

Relations, views, residue, search, and neighborhoods are optional adapter-declared GET capabilities, not universal v0 requirements. IOLM supplies design precedent but is not an implemented generic owner. [A2; `cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`; `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md:16-28`]

Every GET response binds snapshot ID, canonical content hash, ETag, profile ID, adapter ID, truncation, next cursor, and `runtime_authority_effect:"none"`. ETags are quoted SHA-256 of canonical response bytes plus normalized query parameters; `If-None-Match` returns 304.

### Exact v0 operation plane

- `POST /v1/snapshots` — local adapter extraction plus runtime compilation;
- `POST /v1/runs` with `operation:"native.validate"`;
- `POST /v1/runs` with `operation:"runtime.same_adapter_byte_local_id_diff"`.

No other v0 run operation is admissible. In particular:

- no semantic drift;
- no lifecycle-transition validation;
- no Ontology Vault agent-backed mode;
- no delegated report generation;
- no dispatch;
- no arbitrary profile-named operation.

Agent-backed or delegated requests return:

```json
{
  "code": "OPERATION_UNSUPPORTED",
  "owner_route": "orchestrate",
  "runtime_authority_effect": "none"
}
```

The runtime does not queue, spawn, join, retry, interrupt, gate, confirm, register, or close agents. [A1; `arcanum/arcana/ontology-vault/SKILL.md:156-177`]

Runtime execution states are exactly:

```text
queued -> running -> succeeded | failed
```

They are named `runtime_execution_status` and have no relation to package workflow status, lifecycle, validation posture, or authority.

### Draft proposal-artifact plane

- `POST /v1/runs/{run_id}/proposal-artifacts`;
- `GET /v1/proposal-artifacts/{artifact_id}`.

Creation is a runtime output constructor, not a profile operation and not a handoff lifecycle. It may run only when the capability matrix admits an exact `PromotionRequest`-compatible draft type and names the existing promotion-request owner route.

The immutable artifact contains:

```ts
type DraftProposalArtifactV0 = {
  schema_version: "ontology-runtime.promotion-request-draft.v0";
  artifact_id: string;
  compatibility_target: "PromotionRequest";
  source_package_id: string;
  source_profile_id: string;
  source_snapshot_ids: string[];
  source_run_id: string;
  source_receipt_ids: string[];
  observations: Array<{
    text: string;
    exact_selectors: string[];
    confidence: ConfidencePair;
  }>;
  requested_transition: string;
  semantic_delta: unknown;
  conflicts: unknown[];
  blocking_questions: unknown[];
  suggested_owner_route: string;
  residue: unknown[];
  draft_status: "draft-request";
  runtime_authority_effect: "none";
};
```

The runtime owns immutable byte construction and retrieval only. It does not deliver the artifact, assert receipt by an owner, or enter `owner-review`, `accepted-for-review`, `deferred`, `blocked`, `rejected`, or owner-decision states. [A1; `cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51`]

### Administration

Potential future CLI, all `[DESIGNED, OWNER-ABSENT]`:

```text
ontology-runtime verify-configured-registration
ontology-runtime serve
ontology-runtime inspect-package
ontology-runtime gc --exact-content-id
ontology-runtime stop --exact-owned-handle
```

There is no HTTP registration, upload, deletion, GC, cancellation, shutdown, approval, promotion, publication, deployment, or release route.

## 7. Exact capability matrix

Legend:

- **CURRENT** — evidenced now;
- **D-ALLOW** — designed capability if runtime owner, implementation owner, registration, adapter, and profile/output gates are all admitted;
- **UNSUPPORTED(route)** — deterministic `OPERATION_UNSUPPORTED` with the named opaque owner route;
- **ABSENT** — required profile/adapter does not exist.

| Package/profile | Extraction + runtime compilation | Native validation | Same-adapter byte/local-ID diff | Semantic drift | Draft proposal artifact | Owner/profile review |
|---|---|---|---|---|---|---|
| v0 local fixture | D-ALLOW, owner-gated | D-ALLOW, fixture validator | D-ALLOW | UNSUPPORTED(`fixture-profile-owner`) | D-ALLOW only for fixture `PromotionRequest`-compatible draft | UNSUPPORTED(`fixture-owner-route`) |
| CAV2 base | ABSENT profile and adapter | UNSUPPORTED(`cyberalchemy-v2-ontology-route`) | UNSUPPORTED(`cyberalchemy-v2-ontology-route`) | UNSUPPORTED(`cyberalchemy-v2-ontology-route`) | UNSUPPORTED(`cyberalchemy-v2-ontology-promotion-request-route`) until profile admits exact draft type | UNSUPPORTED(`cyberalchemy-v2-ontology-promotion-request-route`) |
| Augmentor unified-agent | ABSENT adapter; candidate D-ALLOW only after race gate | Candidate D-ALLOW wrapping native validator | Candidate D-ALLOW; byte/local-ID only | UNSUPPORTED(`owner-selection-required:augmentor-meaning`) | UNSUPPORTED(`authority-kind-specific-named-owner`) because the current profile does not admit draft proposal creation | UNSUPPORTED(`authority-kind-specific-named-owner`) [A3; `projects/augmentor/ontology/unified-agent/profile.json:15-23`] |
| Body War business | ABSENT adapter; candidate D-ALLOW | Candidate D-ALLOW wrapping native validator | Candidate D-ALLOW; byte/local-ID only | UNSUPPORTED(`body-war.product-ontology-owner`) | UNSUPPORTED(`body-war.product-ontology-owner`) absent an exact profile gate | UNSUPPORTED(`body-war.product-ontology-owner`) [A3; `projects/body-war/ontology/business/profile.json:3-10`] |

The runtime-owned diff compares only:

```text
added local IDs
removed local IDs
changed opaque payload hashes
unchanged local IDs/hashes
source-binding byte changes
unsupported comparisons
```

It does not call the result semantic drift, regression, lifecycle change, promotion evidence, or owner-significant change. Semantic drift remains a profile-owned operation requiring an exact owner, output permission, adapter capability, and owner gate. A same-adapter diff never authorizes semantic drift merely because the reusable profile template names a `drift-report` output category. [A1; `arcanum/arcana/ontology-vault/templates/runtime-profile.md:40-71`; A3; `projects/augmentor/ontology/unified-agent/profile.json:53-73`]

Every matrix cell not explicitly D-ALLOW fails with `OPERATION_UNSUPPORTED` and the exact profile-bound owner ref. Missing owner refs fail `OWNER_ROUTE_UNRESOLVED`; they are never guessed.

## 8. Request, response, error, execution, and receipt contracts

```ts
type RuntimeRequestV0 = {
  schema_version: "ontology-runtime.request.v0";
  request_id: string;
  package_id?: string;
  profile_id?: string;
  snapshot_ids?: string[];
  operation?: "native.validate" | "runtime.same_adapter_byte_local_id_diff";
  parameters?: unknown;
};

type RuntimeResponseV0<T> = {
  schema_version: "ontology-runtime.response.v0";
  request_id: string;
  result: T;
  identity?: {
    snapshot_id: string;
    content_sha256: string;
    etag: string;
  };
  bounds: { truncated: boolean; next_cursor: string | null };
  runtime_authority_effect: "none";
};

type RuntimeErrorCode =
  | "REQUEST_INVALID"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "PATH_FORBIDDEN"
  | "METHOD_NOT_ALLOWED"
  | "PACKAGE_NOT_FOUND"
  | "SNAPSHOT_NOT_FOUND"
  | "RUN_NOT_FOUND"
  | "ADAPTER_UNSUPPORTED"
  | "ADAPTER_CONTRACT_VIOLATION"
  | "OPERATION_UNSUPPORTED"
  | "OWNER_ROUTE_UNRESOLVED"
  | "IDEMPOTENCY_CONFLICT"
  | "PACKAGE_IDENTITY_CHANGED"
  | "SOURCE_DRIFT"
  | "NONDETERMINISTIC_ADAPTER"
  | "SNAPSHOT_COLLISION"
  | "QUERY_CAP_EXCEEDED"
  | "MEMORY_CAP_EXCEEDED"
  | "STORE_CAP_EXCEEDED"
  | "TEMP_CAP_EXCEEDED"
  | "ARTIFACT_CAP_EXCEEDED"
  | "CHILD_TIMEOUT"
  | "RUN_TIMEOUT"
  | "TEARDOWN_INCOMPLETE"
  | "RUN_CAPACITY_EXHAUSTED"
  | "INTERNAL_FAILURE";
```

Errors concern runtime inability to execute or preserve the contract. A native validator’s negative evidence is not a runtime error.

```ts
type RuntimeRunV0 = {
  run_id: string;
  operation: "native.validate" | "runtime.same_adapter_byte_local_id_diff";
  runtime_execution_status: "queued" | "running" | "succeeded" | "failed";
  runtime_failure?: RuntimeErrorCode;
  native_validation?: {
    validator_id: string;
    validator_version: string;
    native_result: unknown;
    native_diagnostics: unknown[];
    native_receipt_sha256: string | "not_provided";
    claim_ceiling: string | "not_provided";
    native_authority_effect: "none" | unknown;
  };
  runtime_authority_effect: "none";
};
```

A validator may execute successfully and return negative evidence:

```text
runtime_execution_status: succeeded
native_result: rejected | violations-present | project-local-negative-result
```

Neither execution success nor native result implies ontology conformance, runtime conformance, promotion eligibility, maturity, release admission, readiness, or authority. Zero exit status without a claim ceiling is not rendered as “valid,” “conformant,” “approved,” or “ready.” [A1; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`; A3; `projects/body-war/ontology/business/receipts/validation-receipt.json:1-54`]

### Runtime receipt

```ts
type RuntimeReceiptV0 = {
  schema_version: "ontology-runtime.receipt.v0";
  receipt_id: string;
  kind: "snapshot" | "run" | "proposal-artifact" | "teardown";
  package_id: string;
  profile_id: string;
  adapter_id: string;
  adapter_version: string;
  adapter_code_sha256: string;
  snapshot_ids: string[];
  registration_sha256: string;
  pre_identity_sha256: string;
  post_identity_sha256: string;
  source_bindings_sha256: string;
  native_receipt_sha256: string | "not_provided";
  runtime_execution_status: "succeeded" | "failed";
  native_result: unknown | "not_applicable";
  claim_ceiling: string | "not_provided";
  source_preservation: {
    before_sha256: string;
    after_sha256: string;
    unchanged: boolean;
  };
  measurements: {
    peak_rss_bytes: number;
    compile_wall_ms: number | "not_applicable";
    query_wall_ms: number | "not_applicable";
    run_wall_ms: number | "not_applicable";
    store_bytes_before: number;
    store_bytes_after: number;
    temp_peak_bytes: number;
    per_run_artifact_bytes: number;
    child_wall_ms: number | "not_applicable";
    teardown_residual_bytes: number;
    residual_owned_pids: number;
    residual_owned_ports: number;
    outbound_requests_observed: number;
  };
  applied_caps: ResourceCapsV0;
  artifacts: Array<{
    artifact_id: string;
    media_type: string;
    bytes: number;
    sha256: string;
  }>;
  runtime_authority_effect: "none";
  residue: unknown[];
};
```

## 9. Provisional executable v0 fixture ceilings

These are **designed witness thresholds, not measured results, implementation defaults, or production budgets**. A selected owner may revise them before implementation, but the v0 witness must bind one exact version and fail closed.

```ts
type ResourceCapsV0 = {
  declared_input_files_max: 128;
  declared_input_bytes_max: 16_777_216;       // 16 MiB
  emitted_records_max: 1_000;
  peak_rss_bytes_max: 268_435_456;             // 256 MiB
  compile_wall_ms_max: 5_000;
  query_wall_ms_max: 500;
  native_validation_wall_ms_max: 5_000;
  diff_wall_ms_max: 2_000;
  proposal_artifact_wall_ms_max: 500;
  store_bytes_max: 67_108_864;                 // 64 MiB
  temp_peak_bytes_max: 67_108_864;             // 64 MiB
  per_run_artifact_bytes_max: 8_388_608;       // 8 MiB
  child_timeout_ms: 5_000;
  response_body_bytes_max: 2_097_152;          // 2 MiB
  page_size_max: 100;
  neighborhood_depth_max: 2;
  neighborhood_nodes_max: 250;
  neighborhood_relations_max: 500;
  search_query_utf8_bytes_max: 256;
  teardown_residual_bytes_max: 0;
  residual_owned_pids_max: 0;
  residual_owned_ports_max: 0;
  outbound_requests_max: 0;
};
```

Fail-closed behavior:

- RSS over cap: terminate owned child, do not publish, `MEMORY_CAP_EXCEEDED`;
- compile/query/run latency over cap: do not publish the affected object, `CHILD_TIMEOUT` or `RUN_TIMEOUT`;
- store/temp/artifact over cap: stop before write or remove only owned temporary output, return the corresponding cap error;
- teardown residual bytes/PIDs/ports above zero: `TEARDOWN_INCOMPLETE`;
- any outbound request: terminate the owned process, reject the witness;
- measurement unavailable: witness fails; absence is not interpreted as within cap.

One global compiler and one run worker are sufficient for v0. Queue cap is 4. Concurrency beyond this returns `RUN_CAPACITY_EXHAUSTED`. These limits avoid claiming unmeasured multi-worker behavior.

## 10. Isolation, security, idempotency, caching, lifecycle, and teardown

All behavior is `[DESIGNED, OWNER-ABSENT]`.

- Bind `127.0.0.1` only.
- Use an ephemeral 256-bit bearer token; do not persist or echo it.
- Permit GET/HEAD and only the enumerated POST endpoints.
- Reject upgrades and all other mutation methods.
- HTTP accepts logical IDs only, never filesystem paths.
- Startup roots must pass lexical and canonical containment, realpath, symlink, type, and declared-inventory checks.
- Adapter children receive minimal environment, fixed cwd, closed stdin, no shell interpolation, output caps, timeout, and outbound denial.
- Snapshot, run, and proposal-artifact outputs are create-only and content-addressed.
- Idempotency key is mandatory for POST:
  - same key and canonical body returns the same object;
  - same key and different body returns `IDEMPOTENCY_CONFLICT`.
- Immutable response cache keys include complete snapshot ID, route, and normalized query. Cache data from different package/profile/axis tuples cannot merge.
- No cache entry survives a changed complete package identity.
- Retention and GC remain owner-absent; no deletion command is admitted until a retention owner defines `retained -> GC-eligible -> deleted`.
- Teardown touches only exact process-owned PID, handle, port, store, and temporary root; it proves port release, zero owned residual processes, zero temporary residual bytes, and unchanged protected sources.

OEW proves relevant isolation mechanisms separately but does not satisfy these combined ceilings or witness. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/adapter-run-writer.mjs:281-327`; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-oew-prototype.mjs:404-589`; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:44-150`]

## 11. Package adapters

### Fixture adapter

Designed solely for a future v0 witness after owner selection. It provides small local records, exact source bindings, a native fixture validator, and two deterministic snapshots for byte/local-ID diff. It declares one exact `PromotionRequest`-compatible draft artifact target. It has no semantic drift, promotion, owner-review, dispatch, or delegated capability.

### CAV2 adapter

`[ABSENT ADAPTER: cav2-markdown-model/v0]`; its required runtime profile is also absent.

If separately authorized, it would emit Markdown document bytes and selector-addressed local rows. It must not fabricate Augmentor/Body War JSON, live schema types, runtime contracts, movement edges, or promotion verdicts. Until an owner-approved profile and adapter exist, every operation returns `OPERATION_UNSUPPORTED` with the CAV2 ontology route. [A3; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:32-54`; `:90-123`; `cyberAlchemy-v2/ontology/NODE-MODEL.md:57-76`]

### Augmentor adapter

`[ABSENT ADAPTER: augmentor-unified-agent-json/v0]`.

A later candidate may emit aggregate node/relation bytes, four view records, source bindings, residue, local predicate/runtime-posture facets, and invoke the retained native validator. It cannot provide semantic drift or proposal review. Admission remains blocked until the stale-receipt race is closed by repeatable isolation evidence. [A3; `projects/augmentor/ontology/unified-agent/profile.json:31-73`; `projects/augmentor/ontology/unified-agent/relations/relations.json:5-25`; `projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`]

### Body War adapter

`[ABSENT ADAPTER: body-war-business-json/v0]`.

A later candidate may stream manifest-selected node bytes, relations, view, lifecycle-policy records, residue, inline source bindings, and invoke the retained native validator. `business_kind`, lifecycle, prototype availability, and relation semantics remain local facets. Lifecycle-transition validation is not a v0 runtime operation even though the native project owns such diagnostics. Generated presentation assets remain projections. [A3; `projects/body-war/ontology/business/profile.json:64-70`; `projects/body-war/ontology/business/README.md:17-37`; `projects/body-war/ontology/business/receipts/validation-receipt.json:1-54`]

## 12. No-direct-CRUD, no-promotion, and no-dispatch laws

1. No source/profile/schema/node/relation/view CRUD endpoint exists.
2. No adapter-supplied snapshot identity, manifest, publication instruction, or retention instruction is admissible.
3. No generic source-owned authority, status, lifecycle, predicate, branch, or confidence value exists.
4. No validation result becomes conformance, maturity, readiness, authority, release admission, or promotion evidence by runtime interpretation.
5. No semantic drift is inferred from byte/local-ID diff.
6. No draft proposal artifact is delivered, reviewed, accepted, rejected, or applied by the runtime.
7. No promotion, approval, owner-decision, publication, release, or deployment endpoint exists.
8. No agent-backed work, Dispatch Spec lifecycle, or Orchestrate lifecycle exists in the runtime.
9. Profile-name matching alone does not grant permission; runtime owner, implementation owner, configured registration, exact adapter capability, profile output permission, and owner gate must all bind the same operation/version.
10. Any absent binding returns a typed failure, never guessed permission or empty success.

## 13. Smallest local-fixture vertical witness

The witness is designed and has not run. It remains blocked until runtime-contract and implementation owners are selected.

Required path:

1. start the loopback process from one exact configured registration;
2. verify the registration without discovery/indexing;
3. create a snapshot under an idempotency key;
4. repeat extraction in two clean roots and prove identical canonical runtime bytes;
5. repeat snapshot creation and prove the same ID and bytes;
6. query snapshot metadata, record list/get, and sources;
7. prove ETag and 304;
8. execute the native fixture validator and retrieve the wrapped native result;
9. construct a second fixture snapshot;
10. execute deterministic same-adapter byte/local-ID diff;
11. construct and retrieve one immutable `PromotionRequest`-compatible draft artifact;
12. run all collapse/security/resource/race negatives;
13. prove unchanged source bytes, zero outbound requests, all provisional ceilings, port release, zero owned residual PIDs, and zero temporary residual bytes.

Representative designed requests:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-snapshot-1" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:$PORT/v1/snapshots" \
  -d '{"package_id":"fixture:poker","profile_id":"fixture-readonly@1"}'

curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-validation-1" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:$PORT/v1/runs" \
  -d "{\"snapshot_ids\":[\"$SNAPSHOT_ID\"],\"operation\":\"native.validate\",\"parameters\":{}}"

curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: fixture-diff-1" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:$PORT/v1/runs" \
  -d "{\"snapshot_ids\":[\"$SNAPSHOT_A\",\"$SNAPSHOT_B\"],\"operation\":\"runtime.same_adapter_byte_local_id_diff\",\"parameters\":{}}"
```

A schema, diagram, mock response, server launch, or browser rendering alone does not satisfy the witness.

## 14. Exact collapse, negative, and acceptance tests

### Ownership and precedent tests

1. Startup without selected runtime-contract and implementation owner refs fails `OWNER_ROUTE_UNRESOLVED`.
2. Registration input containing discovery queries, globs, ranking, selection, or index instructions fails `ADAPTER_CONTRACT_VIOLATION`.
3. An agent-backed operation returns `OPERATION_UNSUPPORTED` with `orchestrate`; no agent process or dispatch receipt is created.
4. A proposed cancellation command or `cancelled` state fails schema validation.
5. GC without a named retention owner and exact eligible content ID fails `OWNER_ROUTE_UNRESOLVED`.
6. Proposal artifact retrieval exposes only `draft-request`; injected owner-review states fail validation.

### Adapter/runtime ownership tests

7. Adapter returning `snapshot_id`, `SnapshotManifest`, output path, publication instruction, or collision verdict fails `ADAPTER_CONTRACT_VIOLATION`.
8. Changing only adapter-returned caller-chosen identity material cannot influence a valid runtime snapshot because such material is rejected.
9. Runtime snapshot identity changes when emitted bytes or declared adapter code identity changes.
10. The adapter cannot write the runtime snapshot store.

### Authority and local-axis collapse tests

11. Generic envelope always emits `runtime_authority_effect:"none"`.
12. Source values `blocked`, `staging`, `projection`, or `owner-decision` remain opaque/faceted; none becomes runtime authority posture.
13. Two packages using `blocked` on different axes round-trip byte-for-byte but are not filter-, transition-, or authority-equivalent.
14. A branch ID never prefixes or rewrites record identity.
15. Equal predicate strings from different profiles do not interoperate or share neighborhood semantics without an owner-admitted bridge.
16. Branch filtering requires an exact view record; it cannot synthesize a namespace or ownership boundary.
17. A human alias round-trips with alias role and source binding and never enters a canonical vocabulary index.
18. Predicate, branch, status, lifecycle, runtime posture, release admission, and `business_kind` values never appear in `human_alias_bindings`.
19. Every facet filter lacking package, profile, facet kind, and local axis fails `REQUEST_INVALID`.

### Validation and conformance tests

20. A validator that executes successfully and rejects a transition yields `runtime_execution_status:"succeeded"` with unchanged native rejection.
21. Validator process failure yields runtime `failed`; a negative native result does not.
22. Zero exit with no claim ceiling is rendered as `claim_ceiling:"not_provided"`, never “valid,” “conformant,” “approved,” or “ready.”
23. Native result cannot change package status, lifecycle, release admission, maturity, authority, or snapshot identity.
24. Runtime execution success cannot become runtime-conformance evidence.

### Confidence tests

25. Scalar `confidence` fails schema validation.
26. If either local confidence axis is absent, that axis is explicitly `not_provided`.
27. A proposal observation containing confidence must contain both axes with independent provenance or `not_provided`.
28. Raising evidence confidence does not modify commitment confidence, proposal draft status, runtime execution status, local status, or owner decision.
29. Raising commitment confidence does not modify evidence confidence or any other lifecycle.
30. Challenge state and validation result never populate either confidence axis.

### Capability and operation tests

31. Fixture semantic drift returns `OPERATION_UNSUPPORTED` with fixture profile owner route.
32. CAV2 operations all return `OPERATION_UNSUPPORTED` until its profile and adapter exist.
33. Augmentor semantic drift returns `OPERATION_UNSUPPORTED` with owner route `owner-selection-required:augmentor-meaning`; the runtime does not reinterpret that opaque route.
34. Augmentor draft proposal artifact creation returns `OPERATION_UNSUPPORTED` with owner route `authority-kind-specific-named-owner` because the current profile does not admit draft proposal creation.
35. Any attempted Augmentor proposal delivery, review, decision, acceptance, rejection, promotion, publication, release, or deployment returns `OPERATION_UNSUPPORTED` with the same `authority-kind-specific-named-owner` authority route.
36. Augmentor agent-backed work returns `OPERATION_UNSUPPORTED` with `orchestrate`; route-shape validation remains with `dispatch-spec`.
37. Body War semantic drift returns `OPERATION_UNSUPPORTED` with owner route `body-war.product-ontology-owner`.
38. Body War draft proposal artifact creation returns `OPERATION_UNSUPPORTED` with owner route `body-war.product-ontology-owner` because no exact profile gate admits it.
39. Any attempted Body War proposal delivery, review, decision, acceptance, rejection, promotion, publication, release, or deployment returns `OPERATION_UNSUPPORTED` with the same `body-war.product-ontology-owner` route.
40. Route-resolution contract tests reject prose placeholders; if no live route is present they return `OWNER_ROUTE_UNRESOLVED`. Neither Augmentor nor Body War uses that fallback in this matrix.
41. Cross-adapter diff returns `OPERATION_UNSUPPORTED`.
42. Same-adapter diff reports hashes/local IDs only and never emits semantic severity or owner recommendation.
43. Profile-listed operation name without matching adapter capability, output permission, owner gate, and operation version fails closed.
44. Delegated report, lifecycle transition, promotion, approval, release, or deployment requests return `OPERATION_UNSUPPORTED`.

### Race, determinism, security, and teardown tests

45. Mutating a fixture byte or stored receipt between pre/post passes yields `PACKAGE_IDENTITY_CHANGED` and publishes nothing.
46. Concurrent extraction never creates a mixed snapshot; one lock owner proceeds and the other coalesces or receives capacity failure.
47. Reordered filesystem enumeration produces identical canonical bytes.
48. Unequal double extraction yields `NONDETERMINISTIC_ADAPTER`.
49. Snapshot ID collision with unequal bytes yields `SNAPSHOT_COLLISION`.
50. Traversal, encoded traversal, symlink, directory, undeclared file, URL, uploaded code, and outbound request all fail closed without protected-byte disclosure.
51. Direct source/node/relation/profile CRUD routes return 404/405.
52. Same idempotency key with different canonical body yields `IDEMPOTENCY_CONFLICT`.
53. Teardown targeting an unowned PID, port, or path is rejected.
54. Successful teardown records zero residual bytes, PIDs, and ports.

### Resource tests

55. Peak RSS over 256 MiB yields `MEMORY_CAP_EXCEEDED`.
56. Compile over 5 seconds or child validation over 5 seconds yields timeout and no published result.
57. Query over 500 ms, diff over 2 seconds, or proposal construction over 500 ms fails the witness.
58. Store over 64 MiB, temp over 64 MiB, or per-run artifact over 8 MiB fails before committed publication.
59. Missing measurement fields fail receipt validation.
60. Every cap failure records applied cap, observation, cleanup outcome, and zero source mutation.

Existing project-negative fixtures remain native-owner evidence rather than copied runtime semantics. [A3; `projects/augmentor/ontology/unified-agent/tests/unified-agent-ontology.test.mjs:59-70`; `projects/body-war/ontology/business/tests/business-ontology.test.mjs:43-107`]

## 15. Test layers

- **Unit:** envelope invariants, structured aliases/facets, confidence pair, canonicalization, ID and ETag derivation, cursor/cap checks, typed errors.
- **Adapter contract:** lossless extraction, forbidden snapshot/manifests, exact capability declaration, stable enumeration, native receipt attribution.
- **Deterministic replay:** clean double extraction, reordered enumeration, changed bytes, collision, idempotency.
- **Race/isolation:** pre/post mutation, concurrent package lock, stored-receipt drift, source preservation.
- **Native-validation contract:** execution/native-result split, negative evidence, missing claim ceiling, diagnostic preservation.
- **Capability matrix:** every supported and unsupported package/operation pair.
- **Security:** path containment, symlinks, methods, auth, minimal environment, outbound denial, redaction.
- **Resource:** every provisional ceiling and measurement field.
- **Curl:** full witness request path, ETags, immutable artifact retrieval, typed failures.
- **Browser:** loopback-only GET presentation, CSP, zero outbound/errors, absence of authority controls, teardown. Browser success proves only observed browser/runtime behavior. [A2; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json:24-89`; `:130-173`]

## 16. Delivery slices

### v0 — owner selection plus local-fixture witness

Before code:

- select runtime-contract and implementation owners;
- bind registration, snapshot, run, retention/GC, and service transitions;
- admit one implementation-local configured registration projection;
- pin provisional fixture ceilings.

Then implement and run only:

- fixture lossless extraction/runtime compilation;
- minimum immutable GET surface;
- native fixture validation;
- deterministic same-adapter byte/local-ID diff;
- immutable `PromotionRequest`-compatible draft artifact construction;
- all collapse, race, security, resource, and teardown tests.

### v1 — minted-project adapters

Only after v0 receipts pass:

- admit Augmentor and Body War adapters without rewriting their packages;
- retain native validators;
- keep semantic drift and proposal creation unsupported unless exact profile gates are later added;
- measure package-specific caps;
- require repeated replay/isolation closure before admitting Augmentor atomicity.

### v2 — CAV2 and optional extensions

Only after its owner acts:

- create/admit a CAV2 runtime profile and Markdown extraction adapter;
- consider profile-owned semantic drift through a separately owned adapter;
- consider additional queries per exact adapter capabilities;
- consider an owner-authorized delivery adapter, without moving owner review into the runtime.

No slice includes discovery, Inventory replacement, Dispatch Spec/Orchestrate lifecycle, direct CRUD, authority decision, promotion, release, or deployment.

## 17. Migration and rollback

Migration is additive and owner-gated:

- do not rewrite source packages or profiles;
- add implementation-local registrations only after owner selection;
- version adapters and runtime envelopes independently;
- retain raw payload bytes and source-bound local facets;
- wrap native receipts without translating their meaning;
- create a new snapshot for every identity-bearing change;
- reject unsupported versions rather than guessing migration.

Rollback stops only the exact owned process, removes only its owned temporary artifacts, and selects the previous admitted registration/adapter/runtime version. Source packages require no rollback because they are never mutated. Immutable snapshots are not rewritten; a retention owner must authorize later deletion. Draft proposal artifacts remain non-authority evidence.

## 18. Unresolved owner decisions and blockers

1. Name the runtime-contract owner.
2. Name the runtime implementation owner.
3. Bind the registration, snapshot, run, retention/GC, and service transition owners.
4. Decide whether the generic envelope remains implementation-local or enters a governed reusable contract.
5. Approve or revise the provisional v0 fixture ceilings before implementation.
6. Select the process-level sandbox for outbound, memory, timeout, and filesystem enforcement.
7. Define retention and exact offline GC policy.
8. Approve the fixture `PromotionRequest`-compatible draft type.
9. Decide whether Augmentor or Body War profiles should ever admit draft proposal creation or semantic drift.
10. Define repeated race/replay evidence sufficient to close the Augmentor stale-receipt residue.
11. Approve and create the CAV2 base profile, if desired.
12. Select any later bridge/delivery/semantic-drift adapter through its retained owner route.

Until these are resolved and an actual v0 witness produces passing receipts, the candidate is blocked from implementation-readiness.

## 19. Verdict matrix

| Element | Verdict |
|---|---|
| Research architecture | **Pass as repaired design** |
| Runtime-contract ownership | **Block: owner absent** |
| Implementation ownership | **Block: owner absent** |
| Registration projection | **`[ABSENT ADAPTER: implementation-local configured registration projection]`** |
| Registration/snapshot/run/service/GC transitions | **`[DESIGNED, OWNER-ABSENT]`** |
| Adapter extraction boundary | **Accept design; adapter has no snapshot authority** |
| Runtime envelope | **Accept design with invariant authority none and qualified local facets** |
| Native validation | **Accept only with execution/result/conformance separation** |
| Runtime byte/local-ID diff | **Accept same-adapter only** |
| Semantic drift | **Unsupported; retained profile owner** |
| Agent-backed work | **Unsupported; route to Orchestrate** |
| Draft proposal artifact | **Accept byte construction only; no delivery/review lifecycle** |
| Resource ceilings | **Executable designed witness thresholds; unmeasured** |
| CAV2 profile/adapter | **Absent and blocked** |
| Augmentor adapter | **Absent; race residue open** |
| Body War adapter | **Absent** |
| Combined v0 witness | **Absent and required** |
| Implementation readiness | **Blocked** |
| Production/release/promotion | **No claim and no authority** |

Overall: **the feedback synthesis passes as a complete research contract because all mandatory repairs are incorporated. The proposed runtime remains owner-absent, unimplemented, unwitnessed, and blocked from implementation-readiness.**

```yaml
action_id: spawn-0008
status: pass
artifacts_read:
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/synthesis.md
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/reviews.md
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/reviewer-precedent.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/reviewer-non-vacuity.json
  - cyberAlchemy-v2/ontology/development/2026-07-30-ontology-runtime-api-research/receipts/reviewer-non-collapse.json
validation: pass
blockers:
  - runtime-contract owner absent
  - runtime implementation owner absent
  - registration snapshot run retention-GC and service transition owners absent
  - configured registration projection and all package adapters absent
  - v0 fixture witness has not run
  - CAV2 runtime profile absent
  - Augmentor stale-receipt replay and isolation residue unresolved
started_at: 2026-07-30T06:40:26Z
finished_at: 2026-07-30T06:40:53Z
```
