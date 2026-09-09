# Task Session Closeout Contract

Applies to every mutation-capable `SWU-OEW-*`.

## Preflight Baseline Binding

Task Session must record before mutation:

- selected SWU ID and parent task;
- current Design result digest
  `5326089bad0c06931508a4243385a36fcd78482ac008d73a6e869f0c2468a2e3`;
- predecessor receipt path/digest, or `none` only for SWU-OEW-001;
- existence and SHA-256 of every target-inventory file, recording `absent` for
  create-only targets;
- protected-set contract/compiler digests and a fresh source-only snapshot;
- clean diff limited to known existing user changes plus the selected scope;
- lifecycle owner and validation commands.

Any drift in a bound source, predecessor, target baseline, contract/compiler,
or protected set blocks before mutation.

## Source-Only Protected-Set Proof

`PROTECTED-SET-CONTRACT.json` is the closed selector and exclusion authority
for isolation proof. `snapshot-protected-set.py` must compile both snapshots.
It hashes ordinary tracked or untracked source/evidence bytes, hashes symlink
text without following the link, deduplicates overlapping scopes, and rejects
special files.

Only the contract's named volatile VCS metadata, dependency trees, caches, and
runtime residue are excluded. An operator may not add an exclusion during an
attempt. Closeout requires exact equality of compiler digest, contract digest,
canonical entries, per-scope digests, entry count, required-path membership,
and aggregate set digest.

## Admitted Delta Classes

- `create` for target inventory entries recorded `absent`;
- `modify` only for existing entries explicitly listed by the selected SWU;
- new run/session evidence under the selected SWU ID;
- no delete, rename, broad generated cleanup, dependency lock drift outside the
  declared target, or upstream/public/private boundary change.

## Terminal Synchronization Inventory

Every SWU must synchronize exactly:

1. its source target inventory from `swu-manifest.json`;
2. `work-pack/session-evidence/<SWU-ID>/receipt.json`;
3. the parent task's execution-state row;
4. the matching `swu-manifest.json` state/receipt fields;
5. `WORK-PACK.md` current-state/eligible-successor summary;
6. the active wave receipt row.

These planning/evidence targets are allowed only at closeout after source
validation passes. They must not rewrite acceptance or expand scope.

## Lifecycle-Owner Validation

- Task Session validates scope/baseline/receipt structure.
- The SWU's named component owner validates its behavior.
- The isolation verifier validates protected equality.
- Ontology/authority owners are not invoked by ordinary SWU closeout; any
  authority-effecting artifact blocks.

## Expected Owner Receipt

`work-pack/session-evidence/<SWU-ID>/receipt.json` must conform to
`oew.task-session-receipt.v1` and contain:

- SWU/task/layer/wave identity;
- capability and execution owner;
- baseline and predecessor digests;
- exact files touched;
- validation commands/results;
- protected-set before/after equality;
- specialized output handle and evidence ceiling;
- blockers/residue;
- deterministic successor eligibility;
- `authority_effect: none`.

## Successor Policy

Stop after the selected SWU. A passing receipt may name dependency-ready
successors, but none is selected or executed automatically. A flag/block
preserves residue and returns to the named owner.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
