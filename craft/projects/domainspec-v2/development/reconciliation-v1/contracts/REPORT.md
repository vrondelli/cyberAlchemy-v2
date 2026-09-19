# DSR-003 — candidate support matrix completed

Result: **PASS for candidate matrix authoring and V04 validation**.
Authority effect: none. Final product support-contract closure and DEC-01 owner
selection remain unestablished. No DomainSpec compiler behavior changed.

Read the [reconciliation charter](reconciliation-charter.md) for the explanation
and [support matrix](support-matrix.json) for exact rows and evidence.

## Delivered

- Seven independent states: authored, canonical, implemented, tested, accepted,
  packaged and published. No global PASS or version-based acceptance.
- 13 backend types, 39 language realizations, all 31 relationship signatures,
  24 dispatched commands, 25 selected profiles and 247 normalized support cells.
- 48 digest-bound source selectors and ten concrete gaps linked to later tasks.
- Separate exact successor acceptance, current-tree comparison, archive member
  counterparts and output-layout candidate state.
- A deterministic materializer, source/structure validator, total combination
  lookup, negative tests and immutable-predecessor preservation checks.

## Findings that affect the next work

The accepted successor's 199-file manifest has 13 changed members in current
source. Matching package version 1.0.0 is not current-tree acceptance. Newly
added source is outside that old manifest.

`application-check` and `application-build` are dispatched but missing from
capability/help metadata. Four candidate test files are absent from the default
test aggregate. Typed/untyped Query, typed/static Policy, State Machine trigger
versus effect, Workflow occurrences, graph multiplicity and composition assurance
must retain distinct rows instead of one reassuring support flag.

The candidate charter preserves the Entity/Value Object/Enum distinctions.
Records are a shared representation, not automatically database tables. It also
keeps domain relationships, composition references and value bindings separate.

## Validation

Eleven tests passed, with zero failures/skips. They verify source-bound
regeneration, exact denominators, missing rows, missing state fields, false
acceptance/publication claims, stale evidence, exact UInt64 language restrictions,
composition/certification boundaries and command metadata gaps. All 39,000
selected Cartesian lookup queries resolve explicitly; that is lookup coverage,
not 39,000 executable domain tests.

See [validation.json](validation.json), [tests.log](tests.log) and
[preservation verification](preservation-verification.json).

```sh
node development/reconciliation-v1/contracts/matrix.mjs check
node --test development/reconciliation-v1/contracts/matrix.test.mjs
node development/reconciliation-v1/contracts/preservation.mjs development/reconciliation-v1/contracts/synchronizations.json
```

Early authoring checks rejected two incorrect source-selector/path assumptions;
both were corrected before materialization. No passing source identity was
manufactured and no prior recovery artifact was rewritten. Future changes to
human-authored behavior notes require semantic review, not a hash refresh alone.

No current compiler, semantic/non-collapse, runtime or installed-package product
suite was run. Tests here exercise the matrix and its evidence boundaries.

## Preservation and Task Session result

Task: DSR-003. Runtime: native local. Adapter/handoff/delegation: none.
Context Builder: lean, eight controlling context sources; strict coverage PASS.
Decisions: no owner decision selected; additive candidate authoring requires no
blocker-level choice. Gate: exact user-directed local scope. Experiment harness:
not applicable; no reusable skill lifecycle changed. Fallback search: only named
CLI/profile/package evidence gaps.

All 1,298 predecessor snapshot paths were checked, allowing only exact new
PLAN.md/WORK-ITEMS.json synchronization digests. All 11 DSR-001 recovery files and
26 HEAD/index preimages remain unchanged. The other 42 work-item records, 61
validation records and 13 decision recommendations remain unchanged. Both planning
before-images are preserved in [preservation-before.json](preservation-before.json).

Only the contracts directory and DSR-003/V04/frontier planning records were
written. No compiler source, canonical definition, original archive, frozen
baseline, Git index/HEAD, commit, publication or external state was changed.
The older DSR-001 verifier describes its earlier epoch; use this unit's successor
preservation check after these authorized additions, not rewritten old receipts.

## Next frontier

**DSR-006: candidate Definition Pack**, grounded in this matrix and existing
definitions, followed by DSR-007's minimum Entity/Query end-to-end proof.
DSR-002 inventory and DSR-004/005 recovery remain separately visible. Neither
this unit nor the broader phase is product acceptance or canonical reconciliation.

## Open Questions

Owned by [DECISIONS.md](../DECISIONS.md). DEC-01 remains required before closing
the final support contract; semantic alternatives belong to their named later
tasks and are not silently selected by this matrix.
