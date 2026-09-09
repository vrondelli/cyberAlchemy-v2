# Findings: owner-preserving Ontology Vault runtime and API

## 0. Evidence posture and status vocabulary

This document is the research finding for dispatch
`2026-07-30-ontology-runtime-api`. It records a candidate architecture contract;
it does not authorize implementation, create a runtime contract, admit a
profile or adapter, execute a witness, change an owner lifecycle, or grant
promotion, release, or deployment authority.

The exact-binding packet passed its final three-lane review with
`authority_effect: none`. Its closure still records absent runtime and
transition owners, absent CAV2 profile and adapters, no v0 implementation or
measurement, and open Augmentor stale-receipt residue
(`receipts/evidence-closure.json:evidence_binding`;
`receipts/evidence-closure.json:residue`; `reviews-recheck-2.md#gate-decision`).

Status labels used throughout:

- **[OBSERVED]** — evidenced current repository behavior or contract.
- **[DESIGNED]** — candidate behavior specified here but not implemented.
- **[ABSENT]** — required artifact, owner, adapter, profile, or runtime does not
  exist.
- **[BLOCKED]** — prohibited by an owner boundary or unable to proceed until a
  named decision/owner acts.
- **[DEFERRED]** — deliberately outside the current slice.

## 1. Finding and non-goals

**[DESIGNED, BLOCKED]** The smallest defensible target is a private,
loopback-only process that:

1. losslessly extracts one explicitly configured local package through one
   admitted adapter;
2. constructs runtime-owned, content-addressed immutable snapshots and bounded
   read responses;
3. executes only native project validation and deterministic same-adapter
   byte/local-ID diff in v0; and
4. constructs and retrieves immutable `PromotionRequest`-compatible draft
   proposal bytes without delivery or owner-review lifecycle.

The runtime is blocked until a runtime-contract owner, implementation owner, and
owners for registration, snapshot, run, retention/GC, and service transitions
are selected. Runtime contracts and implementation execution remain behind
their existing owner gates
(`synthesis-revised.md` §§1-2; `research.md#agent-1--authority-contract`;
`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:50-61`;
`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`).

**[OBSERVED]** OEW is implemented precedent for contained source admission,
create-only deterministic adapter output, token-gated loopback reads,
zero-outbound observation, and teardown. **[OBSERVED]** IOLM supplies a designed
immutable GET contract, but its API task is not started and its prerequisite is
blocked. Neither is the generic runtime proposed here
(`synthesis-revised.md` §1; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md:80`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md:106`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:22-150`).

The runtime does not discover, crawl, rank, select, or index packages; replace
Inventory, IOLM, OEW, profiles, or project validators; own Dispatch Spec or
Orchestrate lifecycle; run agents; mutate package bytes or semantic state;
infer semantic equivalence, conformance, readiness, or owner approval; or expose
promotion, publication, deployment, or release actions. Inventory remains
discovery evidence only
(`synthesis-revised.md` §1; `research.md#agent-1--authority-contract`;
`cyberAlchemy-v2/SOURCE-MAP.md:23-33`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/SPEC.md:59-70`).

## 2. Retained owners and transition ceiling

| Concern | Retained or required owner | Runtime effect | Status |
|---|---|---|---|
| Source bytes and source meaning | declared source/package owner | read declared bytes; prove preservation | **[OBSERVED boundary / DESIGNED runtime]** |
| Profile permission and owner gates | exact profile owner references | default-deny admission; never infer permission | **[OBSERVED boundary]** |
| Local vocabulary, predicates, branches, statuses, lifecycle, confidence, and release posture | package owner | preserve opaque values and qualified facets | **[OBSERVED boundary]** |
| Native validation semantics | native project validator | invoke and wrap exact native result | **[OBSERVED owner / DESIGNED wrapper]** |
| Semantic drift | exact profile-named ontology owner | unsupported in v0 | **[DEFERRED]** |
| Promotion-request lifecycle | existing promotion-request route | construct draft bytes only | **[OBSERVED owner / DESIGNED constructor]** |
| Owner review and decision | narrowest actual owner | no runtime state or endpoint | **[BLOCKED]** |
| Definitions, schema, constitution, and implementation | existing governance owners | draft request only; no mutation | **[BLOCKED]** |
| Dispatch route validation | Dispatch Spec | outside runtime | **[OBSERVED owner]** |
| Agent execution lifecycle | Orchestrate | return unsupported route only | **[OBSERVED owner]** |
| Registration, snapshot, run, retention/GC, service lifecycle | owner absent | no admitted transition | **[ABSENT, BLOCKED]** |

These separations preserve the existing rule that evidence, validation,
ontology, implementation, and authority do not decide one another
(`synthesis-revised.md` §2; `research.md#agent-1--authority-contract`;
`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-29`;
`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`;
`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51`).

The candidate transition graph is **[DESIGNED, OWNER-ABSENT]**:

```text
configured registration -> verified | rejected
package locked -> extracted -> compiled -> published | reused | failed
run queued -> running -> succeeded | failed
snapshot retained -> GC-eligible -> deleted
service stopped -> starting -> ready -> stopped | failed
```

There is no `cancelled` state because no cancellation actor, permission, command,
or transition owner is evidenced. There are no runtime states named
`handed-off`, `owner-review`, `accepted-for-review`, `deferred`, `blocked`,
`rejected`, or `owner-decision`
(`synthesis-revised.md` §2;
`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51`).

## 3. Package registration and adapter model

### 3.1 Configured registration projection

**[ABSENT, DESIGNED, OWNER-ABSENT]** Registration is an
implementation-local configured projection of identities already selected
outside the runtime. It is not discovery, Inventory, a package catalog, an
ontology index, or an authority registry.

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
  configured_package_root_ref: string; // startup-only; never accepted by HTTP
  manifest_sha256: string;
  profile_sha256: string;
  profile_owner_refs: Array<{
    role: string;
    opaque_ref: string;
  }>;
  adapter_capabilities: Array<
    | "emit_local_records"
    | "native_validate"
    | "same_adapter_byte_local_id_diff"
  >;
  source_privacy_class: string;
  fixture_caps: ResourceCapsV0;
};
```

Generic flattened `owner_routes: string[]` are rejected. Role-bearing owner
references remain exact opaque profile assertions, not permissions. Roots are
resolved once at startup, checked for lexical and canonical containment, and
restricted to manifest-declared regular non-symlink files. HTTP receives only
logical IDs
(`synthesis-revised.md` §3; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs:35-152`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:3-5`;
`projects/augmentor/ontology/unified-agent/profile.json:15-23`).

### 3.2 Adapter contract

**[ABSENT, DESIGNED]** An adapter owns lossless local extraction and optional
invocation of the retained native validator. It owns neither runtime identity
nor publication.

```ts
interface PackageAdapterV0 {
  descriptor(): AdapterDescriptorV0;
  inspectProfile(): OpaqueLocalProfile;
  emitLocalRecords(input: DeclaredPackageInput):
    AsyncIterable<LocalExtractionItem>;
  emitSourceBindings(): AsyncIterable<ImmutableSourceBinding>;
  emitNativeReceipt(): OpaqueNativeReceipt | "not_provided";
  emitDiagnostics(): AsyncIterable<OpaqueNativeDiagnostic>;
  emitResidue(): AsyncIterable<OpaqueLocalResidue>;
  invokeNativeValidation?(): NativeValidationExecution;
}

type AdapterDescriptorV0 = {
  adapter_id: string;
  adapter_version: string;
  adapter_code_sha256: string;
  supported_profile_versions: string[];
  supported_local_schema_versions: string[];
  exact_input_inventory: string[];
  runtime_envelope_version: "ontology-runtime.record.v0";
  canonicalizer_id: string;
  native_validator?: {
    validator_id: string;
    validator_version: string;
    command_identity_sha256: string;
  };
  resource_caps: ResourceCapsV0;
  runtime_authority_effect: "none";
};

type ImmutableSourceBinding = {
  source_id: string;
  owner_namespace: string;
  logical_source_ref: string;
  source_selector?: string;
  content_sha256: string;
  revision?: string;
  source_posture?: string;
  owner_ref: string;
  privacy_class: string;
};

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

An adapter must not return a snapshot ID, snapshot manifest, publication path,
collision decision, retention instruction, generic ontology meaning, or generic
authority/status/lifecycle semantics. Any such output is
`ADAPTER_CONTRACT_VIOLATION`. The runtime compiler alone constructs envelopes,
canonical bytes, identity, create-only publication, reuse/collision outcomes,
and receipts
The descriptor admits extraction compatibility and code identity only. The
source binding is a logical, digest-bound union that preserves local selector,
revision, posture, owner, and privacy values without exposing a physical path
or rewriting the source
(`synthesis-revised.md` §3; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:167-190`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:3-5`;
`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:45-54`).

### 3.3 Lossless runtime envelope

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
    | "predicate" | "view_ref" | "branch_ref" | "status" | "lifecycle"
    | "runtime_posture" | "release_admission" | "source_authority_effect"
    | "business_kind" | "challenge_state" | "other";
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

**[DESIGNED]** `runtime_authority_effect` is always `"none"`. Source-owned
authority, status, maturity, lifecycle, release, runtime-posture, challenge, and
similar values remain opaque or owner-qualified local facets. Facet filtering
requires `package_id + profile_id + facet_kind + local_axis + raw_value`.
Equal strings across different tuples are not equivalent. Aliases never become
canonical vocabulary. Neighborhood traversal uses only adapter-declared local
relations within one package/profile/snapshot. A branch is a view, not an
identity namespace, type, lifecycle, owner, or promotion route. Both confidence
axes are always independently present or explicitly `not_provided`; scalar
confidence is invalid
(`synthesis-revised.md` §4; `research.md#agent-1--authority-contract`;
`cyberAlchemy-v2/ontology/NODE-MODEL.md:14-55`;
`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-47`;
`arcanum/arcana/ontology-vault/SKILL.md:98-117`;
`arcanum/arcana/ontology-vault/SKILL.md:188-197`).

## 4. Immutable snapshot pipeline

**[DESIGNED, OWNER-ABSENT]** A future admitted compiler must:

1. acquire a registration-scoped lock;
2. hash registration, profile, manifest, every declared input byte, and the
   stored native receipt into a complete pre-extraction package identity;
3. accept only lossless local extraction items from the adapter;
4. construct and canonicalize runtime envelopes itself;
5. extract twice in separate owned clean roots;
6. require byte-identical canonical outputs;
7. recompute the complete package identity after pass two;
8. require exact pre/post identity equality;
9. prove protected source digests unchanged; and
10. atomically publish create-only runtime-owned bytes, writing the receipt last.

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

Outcomes are `reused` for identical identity/equal bytes,
`PACKAGE_IDENTITY_CHANGED` for changed source or stored-receipt identity,
`NONDETERMINISTIC_ADAPTER` for unequal passes, `SOURCE_DRIFT` for pre/post source
mismatch, `SNAPSHOT_COLLISION` for equal ID/unequal bytes, and the typed resource
error when a cap is exceeded. A snapshot is a runtime read model, never a
source, ontology truth, authority artifact, conformance verdict, or owner
decision
(`synthesis-revised.md` §5; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:85-108`;
`cyberAlchemy-v2/ontology/projections/README.md:6-10`).

**[OBSERVED residue / BLOCKED admission]** Augmentor produced a transient stale
stored-receipt mismatch and then passed direct validation and replay. Locking and
pre/post complete identity are required but do not close that race. Its adapter
admission remains blocked until controlled concurrent mutation/replay proves
fail-closed behavior
(`synthesis-revised.md` §5; `research.md#agent-3--package-interoperability`;
`projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`).

## 5. Endpoint and command catalog

Every endpoint below is **[DESIGNED, OWNER-ABSENT]**. Authorization to implement
or expose it is absent.

### 5.1 Query plane

| Endpoint | Contract | Evidence binding |
|---|---|---|
| `GET /v1/packages/{package_id}` | Return the configured registration projection; no discovery or catalog semantics. | `synthesis-revised.md` §6; `cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:3-5` |
| `GET /v1/snapshots/{snapshot_id}` | Return immutable snapshot metadata, identity, source-binding digest, and receipt refs. | `synthesis-revised.md` §6; `cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`; `cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:7-9` |
| `GET /v1/snapshots/{snapshot_id}/records` | Bounded, cursor-paged local record envelopes. | `synthesis-revised.md` §6; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:129-131` |
| `GET /v1/snapshots/{snapshot_id}/records/{local_kind}/{local_id}` | Retrieve one qualified local record without globalizing its ID. | `synthesis-revised.md` §§4,6; `cyberAlchemy-v2/ontology/NODE-MODEL.md:14-27` |
| `GET /v1/snapshots/{snapshot_id}/sources` | Return immutable logical source bindings; never accept or reveal arbitrary paths. | `synthesis-revised.md` §6; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:156-163` |
| `GET /v1/runs/{run_id}` | Return execution state and exact native-result wrapper. | `synthesis-revised.md` §§6,8; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133` |
| `GET /v1/runs/{run_id}/artifacts` | List content-addressed artifacts for one run. | `synthesis-revised.md` §§6,8; `cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:177-179` |
| `GET /v1/runs/{run_id}/artifacts/{artifact_id}` | Retrieve one immutable artifact by logical identity. | `synthesis-revised.md` §§6,8; `cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:239-253` |
| `GET /v1/proposal-artifacts/{artifact_id}` | Retrieve immutable draft bytes only; expose no owner lifecycle. | `synthesis-revised.md` §6; `cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51` |
| `GET /healthz` | Report process liveness only. | `synthesis-revised.md` §§6,10; `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-oew-prototype.mjs:404-589` |
| `GET /readyz` | Report bounded service readiness only, never ontology or implementation readiness. | `synthesis-revised.md` §§6,10; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133` |

Optional adapter-declared GET families for relations, views, residue, search, and
neighborhoods are **[DEFERRED]**, not universal v0 requirements. IOLM is design
precedent, not their generic runtime owner
(`synthesis-revised.md` §6;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md:16-28`).

All successful immutable GET responses bind snapshot ID, canonical content
hash, quoted SHA-256 ETag, profile ID, adapter ID, truncation, next cursor, and
`runtime_authority_effect:"none"`. The ETag covers canonical response bytes and
normalized query parameters; matching `If-None-Match` returns `304`
(`synthesis-revised.md` §6;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/interfaces.md:7-9`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:129-131`).

### 5.2 State-creating plane

| Endpoint | Exact v0 contract | Evidence binding |
|---|---|---|
| `POST /v1/snapshots` | Extract through the configured adapter and compile one immutable runtime snapshot. No raw path is accepted. | `synthesis-revised.md` §§5-6; `cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md:167-190` |
| `POST /v1/runs` with `operation:"native.validate"` | Invoke the retained native validator and wrap its exact result; do not reinterpret it as conformance. | `synthesis-revised.md` §§6,8; `projects/body-war/ontology/business/receipts/validation-receipt.json:1-54` |
| `POST /v1/runs` with `operation:"runtime.same_adapter_byte_local_id_diff"` | Compare added/removed/unchanged local IDs, changed payload hashes, and source-binding byte changes for same-adapter snapshots only. | `synthesis-revised.md` §§6-7; `arcanum/arcana/ontology-vault/templates/runtime-profile.md:40-71` |
| `POST /v1/runs/{run_id}/proposal-artifacts` | Construct create-only `PromotionRequest`-compatible draft bytes; do not deliver, review, accept, reject, or apply them. | `synthesis-revised.md` §6; `cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51` |

No other v0 run operation is admitted. Semantic drift, lifecycle transition
validation, arbitrary profile modes, delegated reports, and agent-backed work
return `OPERATION_UNSUPPORTED`. Agent-backed requests carry the opaque route
`orchestrate`; the runtime never validates, confirms, queues, spawns, retries,
joins, gates, registers, or closes dispatches
(`synthesis-revised.md` §6;
`arcanum/arcana/ontology-vault/SKILL.md:156-177`).

There is no HTTP registration, upload, delete, GC, cancellation, shutdown,
source/profile/schema/node/relation/view CRUD, approval, promotion, owner
decision, publication, release, or deployment endpoint
(`synthesis-revised.md` §§6,12;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/queries.md:3-13`;
`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-10`).

### 5.3 Administration commands

All commands are **[DESIGNED, OWNER-ABSENT]**:

```text
ontology-runtime verify-configured-registration
ontology-runtime serve
ontology-runtime inspect-package
ontology-runtime gc --exact-content-id
ontology-runtime stop --exact-owned-handle
```

GC remains blocked until a retention owner defines eligibility and deletion.
Stop may touch only its exact process-owned handle
(`synthesis-revised.md` §§6,10;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:44-150`).

## 6. Field-level API schemas

### 6.1 Request and response

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

type SnapshotCreateRequestV0 = RuntimeRequestV0 & {
  package_id: string;
  profile_id: string;
  snapshot_ids?: never;
  operation?: never;
  parameters?: never;
};

type RunCreateRequestV0 =
  | (RuntimeRequestV0 & {
      snapshot_ids: [string];
      operation: "native.validate";
      parameters: Record<string, unknown>;
    })
  | (RuntimeRequestV0 & {
      snapshot_ids: [string, string];
      operation: "runtime.same_adapter_byte_local_id_diff";
      parameters: Record<string, unknown>;
    });

type ProposalArtifactCreateRequestV0 = {
  schema_version: "ontology-runtime.proposal-artifact-request.v0";
  request_id: string;
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
};

type RecordListQueryV0 = {
  cursor?: string;
  page_size?: number; // 1..100
  facet_filter?: {
    package_id: string;
    profile_id: string;
    facet_kind: OwnerBoundLocalFacet["facet_kind"];
    local_axis: string;
    raw_value: unknown;
  };
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
  bounds: {
    truncated: boolean;
    next_cursor: string | null;
  };
  runtime_authority_effect: "none";
};
```

These envelopes are **[DESIGNED]** addressing, provenance, and bounds contracts,
not an ontology schema. Snapshot creation is fixed to one configured
package/profile; validation consumes one snapshot; same-adapter diff consumes
exactly two; and proposal construction obtains `run_id` from its path while its
body supplies only draft content. No request field accepts a filesystem path,
owner decision, delivery state, or authority mutation
(`synthesis-revised.md` §§4,8;
`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:90-123`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:129-131`;
`cyberAlchemy-v2/ontology/promotion-requests/README.md:12-28`).

### 6.2 Error contract

```ts
type RuntimeErrorV0 = {
  schema_version: "ontology-runtime.error.v0";
  request_id: string;
  error: {
    code: RuntimeErrorCode;
    message: string;          // stable and non-sensitive
    retryable: boolean;
    details: unknown[];       // redacted structured details
    owner_route?: string;     // exact opaque route when applicable
  };
  runtime_authority_effect: "none";
};

type RuntimeErrorCode =
  | "REQUEST_INVALID" | "AUTH_REQUIRED" | "FORBIDDEN" | "PATH_FORBIDDEN"
  | "METHOD_NOT_ALLOWED" | "PACKAGE_NOT_FOUND" | "SNAPSHOT_NOT_FOUND"
  | "RUN_NOT_FOUND" | "ADAPTER_UNSUPPORTED" | "ADAPTER_CONTRACT_VIOLATION"
  | "OPERATION_UNSUPPORTED" | "OWNER_ROUTE_UNRESOLVED"
  | "IDEMPOTENCY_CONFLICT" | "PACKAGE_IDENTITY_CHANGED" | "SOURCE_DRIFT"
  | "NONDETERMINISTIC_ADAPTER" | "SNAPSHOT_COLLISION"
  | "QUERY_CAP_EXCEEDED" | "MEMORY_CAP_EXCEEDED" | "STORE_CAP_EXCEEDED"
  | "TEMP_CAP_EXCEEDED" | "ARTIFACT_CAP_EXCEEDED" | "CHILD_TIMEOUT"
  | "RUN_TIMEOUT" | "TEARDOWN_INCOMPLETE" | "RUN_CAPACITY_EXHAUSTED"
  | "INTERNAL_FAILURE";
```

Errors describe runtime inability to preserve or execute its contract. Native
negative evidence is not converted into a runtime error. Error bodies never
echo physical paths, bearer tokens, private bytes, excerpts, stack traces, or
child environments
(`synthesis-revised.md` §8; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-oew-prototype.mjs:404-589`).

### 6.3 Run and native-validation separation

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

A validator may execute successfully and return rejection or violations:
`runtime_execution_status:"succeeded"` preserves the exact negative
`native_result`. Process failure is runtime `failed`. Neither result implies
ontology conformance, runtime conformance, maturity, promotion eligibility,
release admission, readiness, or authority. A zero exit without a claim ceiling
is rendered `claim_ceiling:"not_provided"`
(`synthesis-revised.md` §8;
`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`;
`projects/body-war/ontology/business/receipts/validation-receipt.json:1-54`).

### 6.4 Draft proposal artifact

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

The runtime owns immutable byte construction and retrieval only. It does not
claim delivery, receipt, review, decision, or owner acceptance
(`synthesis-revised.md` §6;
`cyberAlchemy-v2/ontology/promotion-requests/README.md:6-51`).

### 6.5 Receipt and measurements

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

The receipt is operational evidence, never an owner decision
(`synthesis-revised.md` §8;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md:177-179`;
`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`).

## 7. Failure, security, and resource contracts

### 7.1 Provisional fixture caps

All values are **[DESIGNED, UNMEASURED]** witness gates, not implementation
defaults or production budgets:

```ts
type ResourceCapsV0 = {
  declared_input_files_max: 128;
  declared_input_bytes_max: 16_777_216;
  emitted_records_max: 1_000;
  peak_rss_bytes_max: 268_435_456;       // 256 MiB
  compile_wall_ms_max: 5_000;
  query_wall_ms_max: 500;
  native_validation_wall_ms_max: 5_000;
  diff_wall_ms_max: 2_000;
  proposal_artifact_wall_ms_max: 500;
  store_bytes_max: 67_108_864;           // 64 MiB
  temp_peak_bytes_max: 67_108_864;       // 64 MiB
  per_run_artifact_bytes_max: 8_388_608; // 8 MiB
  child_timeout_ms: 5_000;
  response_body_bytes_max: 2_097_152;    // 2 MiB
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

Missing measurements fail the witness. Cap violations publish nothing, clean
only owned temporary state, and return the typed cap/timeout error. v0 permits
one compiler, one run worker, and queue depth four; excess work returns
`RUN_CAPACITY_EXHAUSTED`
(`synthesis-revised.md` §9; `reviews-recheck-2.md#reviewer-2--non-vacuity-and-overhead`;
`research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-004-READ-API.md:16-28`).

### 7.2 Security and lifecycle

The future implementation must:

- bind only `127.0.0.1`;
- use a non-persisted, non-echoed ephemeral 256-bit bearer token;
- allow GET/HEAD and only the four enumerated POST contracts;
- reject protocol upgrades and all other mutation methods;
- accept only logical IDs over HTTP;
- default-deny undeclared paths, traversal, encoded traversal, symlinks,
  directories, URLs, uploads, extractors, and commands;
- run adapter children with minimal environment, fixed working directory,
  closed stdin, no shell interpolation, timeout/output/memory caps, and outbound
  denial;
- publish snapshot, run, and proposal bytes create-only and content-addressed;
- require `Idempotency-Key` on POST; same key/body reuses the object and same
  key/different body is `IDEMPOTENCY_CONFLICT`;
- isolate cache entries by complete snapshot, route, normalized query,
  package/profile/local-axis tuple, and complete package identity;
- leave retention and deletion blocked until their owner is selected; and
- tear down only exact owned PID, handle, port, store, and temporary root,
  proving source preservation, port release, zero residual PIDs, zero temporary
  bytes, and zero outbound requests.

These are **[DESIGNED]** combinations of implemented OEW isolation precedent;
the combined runtime contract remains unwitnessed
(`synthesis-revised.md` §10; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/adapter-run-writer.mjs:281-327`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-oew-prototype.mjs:404-589`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json:44-150`).

## 8. Package and operation verdicts

| Package/profile | Compilation | Native validation | Same-adapter byte/local-ID diff | Semantic drift | Draft proposal bytes | Owner/profile lifecycle |
|---|---|---|---|---|---|---|
| v0 fixture | **[DESIGNED, owner-gated]** | **[DESIGNED]** fixture validator | **[DESIGNED]** | **[BLOCKED]** `fixture-profile-owner` | **[DESIGNED]** only for exact compatible fixture type | **[BLOCKED]** `fixture-owner-route` |
| CAV2 base | **[ABSENT]** profile and adapter | **[BLOCKED]** `cyberalchemy-v2-ontology-route` | **[BLOCKED]** same route | **[BLOCKED]** same route | **[BLOCKED]** `cyberalchemy-v2-ontology-promotion-request-route` | **[BLOCKED]** promotion-request route |
| Augmentor unified-agent | **[ABSENT]** adapter; race gate open | **[DEFERRED]** native wrapper | **[DEFERRED]** byte/local-ID only | **[BLOCKED]** `owner-selection-required:augmentor-meaning` | **[BLOCKED]** `authority-kind-specific-named-owner` | **[BLOCKED]** same authority route |
| Body War business | **[ABSENT]** adapter | **[DEFERRED]** native wrapper | **[DEFERRED]** byte/local-ID only | **[BLOCKED]** `body-war.product-ontology-owner` | **[BLOCKED]** same route | **[BLOCKED]** same route |

The routes above are opaque profile assertions, not permissions or proof of
owner acceptance. Missing live routes return `OWNER_ROUTE_UNRESOLVED` and are
never guessed
(`synthesis-revised.md` §7; `reviews-recheck-2.md#reviewer-1--precedent-and-ownership`;
`projects/augmentor/ontology/unified-agent/profile.json:15-23`;
`projects/body-war/ontology/business/profile.json:3-10`).

**[ABSENT]** `cav2-markdown-model/v0` would expose Markdown documents and
selector-addressed local rows, not manufacture project JSON, live schema types,
movement edges, runtime contracts, or promotion verdicts
(`synthesis-revised.md` §11;
`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:32-54`;
`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:90-123`;
`cyberAlchemy-v2/ontology/NODE-MODEL.md:57-76`).

**[ABSENT, BLOCKED]** `augmentor-unified-agent-json/v0` may later expose its
aggregate records, views, sources, residue, local facets, and native validator,
but admission waits on repeatable race closure
(`synthesis-revised.md` §11;
`projects/augmentor/ontology/unified-agent/profile.json:31-73`;
`projects/augmentor/ontology/unified-agent/scripts/validate.mjs:274-318`).

**[ABSENT, DEFERRED]** `body-war-business-json/v0` may later stream
manifest-selected records and wrap its validator while preserving
`business_kind`, lifecycle, prototype posture, and presentation projections as
project-local
(`synthesis-revised.md` §11;
`projects/body-war/ontology/business/profile.json:64-70`;
`projects/body-war/ontology/business/README.md:17-37`).

## 9. Local-fixture vertical witness

**[ABSENT, BLOCKED]** No implementation or combined witness exists. After owner
selection, the minimum witness must:

1. start one loopback process from one exact configured registration;
2. verify registration without discovery or indexing;
3. compile twice in clean roots and prove identical canonical bytes;
4. repeat idempotent snapshot creation and prove identical ID and bytes;
5. query metadata, record list/get, and sources;
6. prove ETag and `304`;
7. run the fixture native validator and retrieve its unmodified wrapped result;
8. compile a second fixture snapshot;
9. run same-adapter byte/local-ID diff;
10. construct and retrieve one `PromotionRequest`-compatible draft artifact;
11. exercise collapse, capability, race, security, resource, and teardown
    negatives; and
12. prove unchanged source bytes, zero outbound requests, all exact caps, port
    release, zero residual owned PIDs, and zero temporary bytes.

Representative **designed, non-executed** requests are the exact
`POST /v1/snapshots`, `POST /v1/runs` validation, and `POST /v1/runs` diff
contracts in §5. A schema, diagram, mock response, launch, or browser rendering
alone is not a witness
(`synthesis-revised.md` §13; `research.md#agent-2--runtimeapi`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json:164-173`).

## 10. Required tests

### Contract and non-collapse

- registration without selected runtime/implementation owners fails
  `OWNER_ROUTE_UNRESOLVED`;
- adapter-returned snapshot identity, manifest, output path, publication,
  collision, or retention decision fails `ADAPTER_CONTRACT_VIOLATION`;
- generic authority is always `"none"`;
- local statuses, predicates, branches, lifecycle, `business_kind`, runtime
  posture, challenge, and release axes round-trip without cross-package
  equivalence;
- aliases never enter canonical vocabulary;
- facet filters lacking package, profile, facet kind, or local axis fail;
- scalar confidence fails; both axes remain independent;
- branch IDs never rewrite identity or ownership.

### Validation and capability

- native negative evidence remains successful execution with a negative native
  result;
- process failure and native rejection remain distinct;
- zero exit without claim ceiling never becomes “valid,” “approved,” or
  “ready”;
- CAV2 remains unsupported while profile/adapter are absent;
- Augmentor and Body War use the exact routes in §8;
- cross-adapter diff, semantic drift, arbitrary profile operations, delivery,
  owner review, promotion, release, and delegated work are unsupported;
- same-adapter diff reports only IDs, hashes, and unsupported comparisons.

### Determinism, race, security, resources, and teardown

- pre/post source or stored-receipt mutation publishes nothing and returns
  `PACKAGE_IDENTITY_CHANGED`;
- concurrent extraction cannot create a mixed snapshot;
- reordered enumeration preserves bytes;
- unequal double extraction is `NONDETERMINISTIC_ADAPTER`;
- equal snapshot ID with unequal bytes is `SNAPSHOT_COLLISION`;
- traversal, symlink, directory, undeclared file, URL, upload, outbound access,
  and direct CRUD fail without protected-byte disclosure;
- idempotency conflict is deterministic;
- unowned teardown targets are rejected;
- every limit in `ResourceCapsV0` fails closed with measurement and cleanup
  evidence;
- successful teardown proves all zero-residue fields.

Required layers are unit, adapter contract, deterministic replay,
race/isolation, native-validation separation, capability matrix, security,
resource, curl, and browser. Browser success proves only observed browser/runtime
behavior, not ontology correctness, acceptance, readiness, or authority
(`synthesis-revised.md` §§14-15;
`projects/augmentor/ontology/unified-agent/tests/unified-agent-ontology.test.mjs:59-70`;
`projects/body-war/ontology/business/tests/business-ontology.test.mjs:43-107`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json:24-89`;
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-004/20260729T185728Z/browser-acceptance.json:130-173`).

## 11. Delivery slices

### v0 — owners and one local fixture

**[BLOCKED]** First select runtime-contract and implementation owners, bind all
five transition families, admit the configured registration projection, and pin
the witness caps. Then implement only fixture extraction/compilation, the
minimum GET surface, native fixture validation, same-adapter byte/local-ID diff,
draft proposal-byte construction, and the full negative suite.

### v1 — minted-project adapters

**[DEFERRED]** Only after passing v0 receipts, consider Augmentor and Body War
adapters without rewriting their packages. Retain native validators, keep
semantic drift and proposal creation unsupported without exact added gates,
measure package-specific caps, and close Augmentor replay/isolation residue
before admission.

### v2 — CAV2 and optional owned extensions

**[DEFERRED]** Only after its owner acts, consider a CAV2 profile and Markdown
adapter, profile-owned semantic drift through a separate admitted adapter,
additional exact adapter query capabilities, or an owner-authorized delivery
adapter. Owner review never moves into this runtime.

No slice contains discovery, Inventory replacement, Dispatch Spec/Orchestrate
lifecycle, direct CRUD, authority decision, promotion, publication, release, or
deployment
(`synthesis-revised.md` §16;
`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-29`;
`cyberAlchemy-v2/ontology/README.md:12-18`).

## 12. Owner decisions required

1. Name the runtime-contract owner.
2. Name the implementation owner.
3. Bind owners for registration, snapshot, run, retention/GC, and service
   transitions.
4. Decide whether the envelope stays implementation-local or enters a governed
   reusable contract.
5. approve or revise the v0 caps before implementation;
6. select process-level filesystem, outbound, memory, and timeout enforcement;
7. define retention and exact offline GC;
8. approve the fixture `PromotionRequest`-compatible draft type;
9. decide whether Augmentor or Body War should ever admit proposal-draft or
   semantic-drift operations;
10. define sufficient repeatable evidence to close the Augmentor race residue;
11. decide whether to create a CAV2 runtime profile; and
12. select any later bridge, delivery, or semantic-drift adapter through its
    retained owner route.

Until these decisions are made and a real v0 witness produces passing receipts,
implementation readiness is blocked
(`synthesis-revised.md` §18;
`receipts/evidence-closure.json:positive_rows`;
`receipts/evidence-closure.json:residue`).

## 13. Final verdict matrix

| Element | Verdict |
|---|---|
| Research architecture | **[DESIGNED] Pass as an owner-preserving candidate** |
| Authority effect | **None** |
| Runtime-contract owner | **[ABSENT, BLOCKED]** |
| Implementation owner | **[ABSENT, BLOCKED]** |
| Registration/snapshot/run/service/GC transition owners | **[ABSENT, BLOCKED]** |
| Configured registration projection | **[ABSENT, DESIGNED]** |
| Adapter extraction boundary | **[DESIGNED] Accept; no snapshot authority** |
| Runtime envelope | **[DESIGNED] Accept with qualified local facets and invariant authority none** |
| Immutable snapshot pipeline | **[DESIGNED, OWNER-ABSENT]** |
| Native validation wrapper | **[DESIGNED] Accept only with execution/result/conformance separation** |
| Byte/local-ID diff | **[DESIGNED] Accept same-adapter only** |
| Semantic drift | **[DEFERRED] Unsupported in v0** |
| Agent-backed work | **[BLOCKED] Unsupported; Orchestrate retains ownership** |
| Draft proposal artifact | **[DESIGNED] Byte construction only; no delivery/review lifecycle** |
| Resource thresholds | **[DESIGNED, UNMEASURED] Witness gates** |
| CAV2 profile and adapter | **[ABSENT, BLOCKED]** |
| Augmentor adapter | **[ABSENT, BLOCKED] Race residue open** |
| Body War adapter | **[ABSENT, DEFERRED]** |
| Combined local-fixture witness | **[ABSENT, BLOCKED] Required before readiness** |
| Implementation readiness | **Blocked** |
| Production, promotion, release, deployment | **No claim; no authority** |

Overall, the exact-binding research contract passes as a design. The runtime is
owner-absent, unimplemented, unwitnessed, and not implementation-ready. No
source, ontology, profile, owner lifecycle, authority state, or production
system has changed
(`synthesis-revised.md` §19;
`receipts/evidence-closure.json:evidence_binding`;
`receipts/evidence-closure.json:residue`).
