# Task Session Result — SWU-FPR01-003 Replay

Status: pass
Result: PASS
Evidence date: 2026-07-17
Execution mode: local bounded task session
Replay work unit: `SWU-FPR01003-REPLAY-001`

## Outcome

The FPR01-003 authority-baseline package now passes its deterministic positive
validator, all five typed negative controls, and the complete DomainSpec
implementation validation chain. The two implementation repair receipts and the
definitions reconciliation are digest-bound below. The previous blocked receipt,
SHA-256 `8d3f6c0d332d8545576bf775c97c1ac02b7cedc9530a07e345e0ce6a679ba0b2`,
is superseded by this replay result.

This is validation evidence, not ratification. The baseline remains a
`validation-candidate` and every authority, release-entry, completion, and
production flag remains false.

## Selection and dependency closure

- Parent work unit: `SWU-FPR01-003`
- Replay work unit: `SWU-FPR01003-REPLAY-001`
- Work-pack lane: `FPR-01 AUTHORITY-BASELINE`, wave W1R
- Runtime handoff/subagents: none

| Dependency | Result | Human receipt SHA-256 | Machine receipt SHA-256 |
|---|---|---|---|
| `SWU-FPR01003-GUARD-001` | PASS | `590a59052aefaed1ace5f9fc0e5bf34786977224aeacdd8f0e0506f5a20ba58f` | `324439d4e61c5ee71d4eaf8f318648060cc04c87fc375f5112d3ad47ad1e5887` |
| `SWU-FPR01003-SAMPLE-001` | PASS | `290e031fff1e28f3fad5ac3a8db59d82b544f278387f5dbb556991cfd575f375` | `26b4791470563436926d01d8c1c68106173938b2045ab1299932969b1df3bd2d` |

Definitions reconciliation receipt SHA-256:
`8c390dfbdf0e92a362874ac569903ac65f1db8d9e169e9084aa06939e8994570`.
Its recorded state was `completed-with-external-residue`; this replay proves that
the formerly external guard and sample residues are now closed.

## Strict replay context

- Human pack: `context/replay-2026-07-17/CONTEXT-PACK.md`
- Human pack SHA-256: `6fa707e3e50801bdf3ff8c4d5ad9f9a0ea57cc8c748bd01b421ca9357e2f95a9`
- Machine pack: `context/replay-2026-07-17/context-pack.json`
- Machine pack SHA-256: `1bd2e5914cc31f9c4cfd35c05b7b3ab0029500f5bf8d36093495d4a9cb7456c1`
- Obligation coverage: 8/8, 100 percent
- Construction blockers: none
- Fallback search: none

## Immutable implementation package

The replay made no change to the baseline implementation.

| Artifact | SHA-256 |
|---|---|
| `authority-baseline.yml` | `7accea7412228999575e9c6a566c01c4cfa3424ece03451fd8a8721dcdacc63a` |
| `schemas/authority-baseline.schema.json` | `159e48f83251b1e2a868a2088c8cdf22eb1c8648173c27125f1163de3adf997b` |
| `tools/validate-authority-baseline.cjs` | `daa8971074bb87dc8c471f316e6234baa995271e6d0b445dc946e655d21a0db6` |
| `fixtures/authority-baseline/changed-status.json` | `c9997d610818f7e6860cfffe62227f9630c852c0d7a91eb48f593a0989909df3` |
| `fixtures/authority-baseline/conflicting-direction.json` | `e43d0f6bbb9d2354fa64c7757b8e9b86a07a7cec6102f3a9b184b7d32b0bafdd` |
| `fixtures/authority-baseline/missing-owner.json` | `d5f888c4c49746f4cef52614c88f4a6fd696cc15e9659acef31da92ca4e53cd4` |
| `fixtures/authority-baseline/stale-count.json` | `4e409fd9f0144cf06b89f167b58ef69f18f6f9b1ad2ec51ec2443dcf31711c79` |
| `fixtures/authority-baseline/stale-source-path.json` | `16404033b300faa1e7d34240d41eae4b98522c65ebac4754db3d5af650980729` |

## Deterministic replay evidence

The canonical validator was run twice from independent clean reads:

```text
exit=0
result=PASS
normalized_sha256=91de9e042b564e1bf85582e8ac360e55e1cafde101f960cbabfb231444b9df7c
complete_output_equality=PASS
```

The live observation was:

- meta-type scheme `DS-D1`: active;
- registered backend members: 13 active;
- deferred UI candidates: 11;
- total candidates: 24;
- relationships: 30 declared, 30 recorded, 30 unique, 30 active; and
- category wording: `typed composable graph fragment`.

The mutant suite exited zero and killed all five named controls:

| Fixture | Expected code | Observed codes | Result |
|---|---|---|---|
| `changed-status` | `E_STATUS` | `E_PACKET`, `E_STATUS` | KILLED |
| `conflicting-direction` | `E_DIRECTION` | `E_DIRECTION` | KILLED |
| `missing-owner` | `E_OWNER` | `E_OWNER` | KILLED |
| `stale-count` | `E_COUNT` | `E_COUNT`, `E_LIVE_COUNT`, `E_PACKET` | KILLED |
| `stale-source-path` | `E_SOURCE_PATH` | `E_SOURCE_PATH` | KILLED |

Mutant-suite normalized SHA-256:
`530963d35564e1ebe0470ac5bd953c6acb12826ad55e0907fa7ef2b3d123e212`.

## Aggregate regression evidence

`npm run validate` passed from `projects/domainspec-v2/impl`:

- Markdown/frontmatter links: PASS;
- relationships: 3 specs, 14 checked edges, 30 canonical signatures;
- content: 20 concepts, 14 edges, 3 files, 13 schemas;
- tool tests: 101 passed, 0 failed;
- retired-reference guard tests: 6 passed; and
- post-receipt retired-reference audit: 225 matching files, 225 allowed, 0
  violations; and
- sample derivation-engine lint: 0 non-canonical tables, 0 unparseable formal
  cells, verdict CLEAN.

## Authority boundary

The live baseline retains:

| Field | Value |
|---|---|
| `status` | `validation-candidate` |
| `authority_boundary.authority_surfaces_mutated` | `false` |
| `authority_boundary.fpr_01_ratified` | `false` |
| `authority_boundary.fpr_01_complete` | `false` |
| `authority_boundary.fpr01_004_execution_authorized` | `false` |
| `authority_boundary.fpr_02_entry_authorized` | `false` |
| `authority_boundary.production_authorized` | `false` |

No baseline, definition, registry, taxonomy, sample, guard, Craft, roadmap,
work-pack, public Arcanum, or production authority surface was mutated by the
replay.

## Stop condition and handoff

`SWU-FPR01-003` is implementation-complete with replay PASS evidence. This Task
Session does not synchronize governed state or select `SWU-FPR01-004`. The next
owner boundary is a separate Invoke refresh to consume this receipt, reconcile
Work-Pack/Craft/roadmap projections, and determine whether `SWU-FPR01-004` is ready
for a new Task Session.
