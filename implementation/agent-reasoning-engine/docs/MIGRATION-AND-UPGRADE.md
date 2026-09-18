# Migration and upgrade guide

**Lifecycle status:** NO_SUPPORTED_PATH

**Audience:** Runtime owners and operators preparing a future ARE successor.

**Owner:** ARE runtime owner. No migration owner is assigned.

**Last reviewed:** 2026-09-17.

**Applies to:** Candidate 018 as the current private baseline. Candidate 013 is historical.

**Claim ceiling:** Documents compatibility identities and prerequisites. No predecessor-to-successor migration or downgrade is currently supported.

## Current position

Candidate 018 is an immutable tested candidate, but it is not an installed public
baseline. No successor pair has a tested migration across configuration,
gateway sessions, Reasoning State, runtime journals, credentials, or generated
artifacts. The evolution runtime's upgrade recommendation is not a persisted-data
migration.

## Compatibility identities

The machine-readable [`compatibility-matrix.json`](compatibility-matrix.json)
inventories the current artifact, configuration, credential, journal, protocol,
schema, and state boundaries. Its
[`compatibility-matrix-receipt.json`](compatibility-matrix-receipt.json) verifies
all referenced readers and writers against Candidate 018. This completes the
current-boundary inventory. It does not create a supported upgrade path.

| Boundary | Current identity or rule |
| --- | --- |
| Product | `0.10.0-self-contained-candidate.7` and `ARE-PRODUCT-CANDIDATE-018` |
| Runtime | Node.js `26.8.1` |
| Decision CLI | Versioned request/result and route-receipt schemas |
| Repository profile | `are.codex-wrapper-repository-profile/v4` plus selected-source digests |
| Reasoning State | Append-only records, content-bound epochs, checkpoints and recovery validation |
| Gateway sessions | Runtime epoch, stable request identity, authenticated resume and acknowledgement records |
| Package records | Explicit `schema_version` constants or JSON Schema identifiers |
| Product closure | Exact source modes, bytes and closure digest |

Matching a filename or JavaScript export name is insufficient compatibility
evidence. Readers and writers must agree on record meaning, required fields,
source identities, failure behavior, and authority posture.

## Before any future upgrade

1. Stop new work at a known completed-turn boundary.
2. Record the exact running product, profile, state, journal and session-store
   identities.
3. Back up immutable source bytes and all durable stores without rewriting them.
4. Verify the backup can be read independently.
5. Run the successor's compatibility preflight without mutating the original.
6. Migrate a copy, verify every record count/digest and restart behavior, then
   exercise rollback.
7. Proceed only under a separately approved operational change.

These are requirements for a future tested procedure, not commands that claim a
migration implementation exists.

## First supported migration gate

The guide becomes procedural when two exact supported versions exist and the
following pass:

- version-pair compatibility matrix.
- configuration and secret-reference translation.
- state, journal and gateway-store forward migration.
- post-migration restart and completed-request replay.
- unknown-outcome preservation.
- downgrade or explicit irreversible-change handling.
- rollback from injected failures at every mutation boundary.
- backup/restore verification in a disposable copy.

Until then, start the successor with new storage or remain on the current
candidate. Do not point an unverified successor at Candidate 013 durable state.

## Open Questions

- Which successor will form the first supported version pair?
- Which persisted records will promise forward readability?
- Will upgrades be offline only, or will a later service require rolling
  compatibility?
