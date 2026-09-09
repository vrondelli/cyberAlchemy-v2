# MIG-B Drift Receipt Implementation Packet

Status: planning candidate  
Work item: `ARC-SWU-08` under `CGC-G20` and `CGC-G33`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: none

## Product purpose

This packet converts the ARC-SWU-07 evidence contract into one exact future
implementation envelope. Its purpose is to let CyberAlchemy and Craft owners
observe the gap between declared MIG-B intent and current output reality without
letting a validator rewrite history, select Product meaning, or switch
authority.

The package is not an Arcanum migration. It is a private MIG-B evidence tool.
Public Arcanum has no routing, acceptance, or implementation authority here.

## Frozen planning basis

The implementation proposal binds:

- R08: `0b3d7ab3f664df93f480a5d377761f4d7897c38edf8241beb8357314b8934ba4`;
- the ARC-SWU-07 design:
  `72c64f04456f2e3a67f92e30e0591b36408e3affd976bd9e4390013949ed631a`;
- the ARC-SWU-07 machine contract:
  `40f2637f620b461d79f339bf0ffab3db79af3a96d8b4a932aaf6f120baa6fe8e`;
- 11 immutable subject manifests and 11 predecessor receipts;
- 63 currently observed mismatches per subject and 92 extra V8 outputs;
- zero actual drift receipts, owner dispositions, or successor epochs.

The exact MIG-B target directory was clean when this packet was prepared. A
fresh preflight must prove it remains clean and that no active writer owns the
proposed paths before implementation begins.

## Proposed implementation root

All implementation bytes are new and isolated beneath:

`cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/drift/`

The exact implementation write set is:

1. `README.md` — operating contract, claim ceiling, commands, and owner gates;
2. `subjects.json` — the 11 immutable subject and predecessor-receipt bindings,
   root policies, and expected current R08 counts;
3. `schemas/mig-b-epoch-drift-receipt.schema.json` — one receipt contract;
4. `schemas/mig-b-epoch-drift-observation-index.schema.json` — complete
   observation-set and receipt/delta closure;
5. `capture-mig-b-epoch-drift.mjs` — check-only preview plus separately gated
   append-only writer;
6. `validate-mig-b-epoch-drift.mjs` — independent recomputation and fail-closed
   validator;
7. `fixtures/cases.json` — the 12 required negative mutations and expected
   `BLOCK` results;
8. `fixtures/run-negative-fixtures.mjs` — isolated in-memory/temp-directory
   fixture runner that cannot target repository history.

No existing MIG-B file is in the implementation write set. The producer and
validator must reject a resolved output path outside this root.

## Protected read-only inputs

The future implementation may read, but never modify:

- the 11 subject manifests named by `subjects.json`;
- their 11 predecessor receipts;
- every declared target path and exact group root;
- repository revision and scoped Git state for provenance observation;
- the owner-authorization record supplied to an effectful command.

It may not read private scope outside those selectors merely because a parent
directory is available. Materialization's ancestor roots require explicit
nested-epoch exclusions; an exclusion must be enumerated and hashed, not
inferred from naming.

## Append-only output shape

Receipt emission, if separately authorized, writes only a new observation ID:

```text
drift/observations/<observation_id>/
  index.json
  receipts/<epoch_id>.json
  deltas/<epoch_id>.jsonl
  validation/independent-validation.json
```

`index.json` binds all 11 receipts, all 11 delta sidecars, their SHA-256 values,
the repository revision, scoped status digest, subject-set digest, tool digest,
authorization digest, and aggregate counts. Partial publication is forbidden.
The writer prepares a sibling temporary directory, validates complete closure,
then performs one rename into a previously absent observation ID. Existing
observation directories are immutable and collisions return `BLOCK`.

The validation receipt is written only by a separate validation command after
the observation exists. Receipt creation does not write owner dispositions.

## CLI contract

### Producer

Default/check-only:

```text
node drift/capture-mig-b-epoch-drift.mjs
node drift/capture-mig-b-epoch-drift.mjs --check
```

Both commands recompute and print the proposed observation JSON to stdout. They
must perform zero repository writes and return exit `0` only when all subject
bindings, denominators, and aggregate checks close. A historical mismatch is
reported as evidence, not as process failure. Binding drift, ambiguity,
omission, or an incomplete denominator returns exit `1` with `status: BLOCK`.

Effectful emission:

```text
node drift/capture-mig-b-epoch-drift.mjs \
  --write-observation \
  --observation-id <owner-approved-id> \
  --authorization <exact-authorization-record>
```

The command fails before writing unless the authorization record binds the
packet digest, implementation digest, exact 11-subject set digest, repository
revision, scoped status digest, observation ID, allowed output root, and
`authority_effect: none`.

### Independent validator

```text
node drift/validate-mig-b-epoch-drift.mjs \
  --observation drift/observations/<observation_id>
```

This is check-only and writes nothing. It rereads the live subject trees,
recomputes every denominator and delta, verifies all bound digests, and reports
dependent checks as `NOT_EVALUABLE` with causal blockers.

A separate, explicitly authorized option may append
`validation/independent-validation.json`; it may not change the observation
index, receipts, or delta sidecars.

### Negative fixtures

```text
node drift/fixtures/run-negative-fixtures.mjs
```

The runner constructs all mutants in a fresh temporary directory and proves 12
of 12 `BLOCK` outcomes. It must reject any fixture root that resolves inside a
historical MIG-B tree or outside the operating-system temporary root.

## Deterministic comparison algorithm

1. Load and validate `subjects.json`; require exactly 11 unique epoch IDs.
2. Verify every subject manifest file hash, internal digest, predecessor
   receipt hash, declared entry count, and root policy before traversing output.
3. Use `lstat` semantics. Classify regular file, directory, symbolic link, or
   other; never follow a symbolic link while hashing a member.
4. Normalize repository-relative paths to UTF-8 forward-slash form and reject
   absolute paths, `..`, duplicate normalized paths, and case-fold collisions.
5. Sort by raw normalized path bytes. Hash raw file bytes with SHA-256.
6. Emit one record for every declared member and every permitted exact-root
   extra: `equal`, `changed`, `missing`, `type-changed`, or `extra`.
7. Canonicalize denominator and delta records as one JSON object per line with
   fixed key order and LF endings; hash the complete byte stream.
8. Reconcile entry, group, delta-kind, and observation totals with zero silent
   omission.
9. Run the complete capture twice in fresh memory and require identical
   denominator, delta, and index digests before any write.
10. Preserve producing transition as literal `unknown` unless an owner supplies
    an exact transition reference and digest in a later append-only decision.

Git state is recorded as provenance only. Clean or committed bytes cannot prove
historical exactness or transition attribution.

## Root policies

Each `subjects.json` row selects exactly one policy:

- `declared-targets-plus-closed-group-roots` for rebound and V1–V9;
- `declared-targets-with-hashed-nested-epoch-exclusions` for materialization,
  whose ancestor implementation root contains later epochs.

The second policy must bind every excluded nested root and its current
denominator digest in the observation index. It cannot turn unknown extras into
ignored files.

## Authorization gates

The packet deliberately separates seven gates:

1. **A1 — implementation:** authorize only the eight new implementation files.
2. **A2 — observation emission:** authorize one immutable observation ID at one
   repository revision and scoped status digest.
3. **A3 — owner classification:** affected layer owners disposition the exact
   receipt/delta digests; no tool self-classification.
4. **A4 — successor proposal:** separately authorize a new epoch if an owner
   chooses `create-successor-epoch`.
5. **A5 — independent validation receipt:** authorize only the append-only
   validation output after check-only recomputation passes.
6. **A6 — owner acceptance:** a protected decision may accept or reject the
   verified reconciliation evidence.
7. **A7 — Definition Snapshot selection:** a later, separate owner decision may
   select one exact Craft Definition Snapshot after G05 and G33 close.

Approval at one gate never implies approval at another. Every approval token is
`null` in this planning candidate.

## Test matrix

Positive coverage must prove:

- default/check-only execution performs zero writes;
- all 11 subjects and predecessor receipts match their bound identities;
- 11 receipts and 11 delta sidecars close under one index;
- repeated 63-member counts and V8 extra-output residue are represented without
  treating those current counts as eternal expectations;
- two runs produce identical canonical bytes and digests;
- a separately authorized fresh observation ID publishes atomically;
- independent validation recomputes rather than trusts producer summaries.

Negative coverage must execute all ARC-SWU-07 mutations: historical refresh,
delta omission, latest/name selection, V8 extra omission, stale replay, wrong
subject digest, unsupported owner/transition attribution, Git-state inflation,
admission/authority inflation, `NOT_EVALUABLE` collapse, predecessor overwrite,
and second-run nondeterminism.

## Done evidence for A1

Implementation is complete only when:

- the eight exact files exist and no other repository path changed;
- all schemas and JSON carriers parse;
- check-only capture is deterministic and performs zero writes;
- the negative runner returns `PASS-12-of-12` against the real producer and
  validator code;
- path escape, symlink, collision, partial-write, and replay cases fail closed;
- current MIG-B manifests, receipts, output trees, source, authority, and
  ledgers retain their preflight hashes/status;
- an independent reviewer accepts the implementation evidence without treating
  it as permission for A2.

No actual receipt is required to close A1. A2 remains a distinct effectful gate.

## Rollback and failure behavior

Before A2, rollback is removal of only the eight new unadopted implementation
files through a separately authorized recoverable operation. After A2, an
observation is evidence and cannot be deleted or rewritten by this workflow; a
correction is another append-only observation linked to its predecessor.

On any write failure the temporary directory remains outside the observation
namespace, the final observation ID remains absent, and the command returns
`BLOCK`. No partial receipt set may appear canonical.

## Claim ceiling

This packet prepares an exact implementation and authorization envelope. It
does not authorize or create the eight implementation files, emit an
observation, run owner classification, create a successor epoch, independently
accept evidence, select a Craft Definition Snapshot or `canonical-current`,
admit a baseline, create a ConstructionBinding, switch authority, mutate
Arcanum, publish, release, deploy, integrate into master, or prove the Goal
achieved.
