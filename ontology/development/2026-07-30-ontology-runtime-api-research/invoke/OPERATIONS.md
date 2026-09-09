# Operations: Ontology Vault Runtime API

## Verify Configured Registration

**Actor:** local operator at startup  
**Input:** logical registration document selected outside the runtime

Rules:

1. Validate the frozen schema and exact profile/manifest/adapter digests.
2. Resolve the package root once; reject escape, symlink, directory, URL, and
   undeclared file access.
3. Preserve role-bearing owner references as opaque values.
4. Reject absent owner selection with `OWNER_ROUTE_UNRESOLVED`.

Postcondition: a verified registration receipt exists or nothing is admitted.

## Compile Snapshot

**Actor:** authenticated local client  
**Input:** one configured `package_id` and `profile_id`

Ordered algorithm:

1. acquire registration lock;
2. calculate complete pre-identity;
3. extract twice in independent owned clean roots;
4. construct and canonicalize runtime envelopes;
5. compare canonical outputs;
6. calculate post-identity and source-preservation digests;
7. fail closed on any mismatch or cap breach;
8. create-only publish runtime bytes; write receipt last.

Errors: `PACKAGE_IDENTITY_CHANGED`, `SOURCE_DRIFT`,
`NONDETERMINISTIC_ADAPTER`, `SNAPSHOT_COLLISION`, typed cap errors.

## Run Native Validation

Invoke the adapter-declared native validator in a minimal child environment.
Wrap its exact result and diagnostics. A completed child with native rejection
is runtime `succeeded`; child/process failure is runtime `failed`.

## Run Same-Adapter Diff

Require two snapshots with equal adapter identity. Compare only added, removed,
unchanged local IDs, changed payload hashes, and source-binding byte changes.
Cross-adapter and semantic comparison return `OPERATION_UNSUPPORTED`.

## Construct Draft Proposal Artifact

Construct create-only immutable bytes from one completed run and exact source
snapshot handles. Set `draft_status:"draft-request"` and
`runtime_authority_effect:"none"`. Do not deliver, review, accept, reject,
apply, promote, publish, or release.

## Stop Owned Service

Stop only the exact process-owned handle and prove port release, zero owned
PIDs, zero temp bytes, source preservation, and zero outbound requests.

