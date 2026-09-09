# Memory Observatory v2

Memory Observatory is a local, single-writer retained-instruction store using only Node.js standard-library modules. Data is scoped by the exact `(product_id, participant_id, lesson_id)` identity. The HTTP server binds only to `127.0.0.1`.

## Launch and persistence

```sh
node src/server.mjs --store ./data/memory.json --port 0
```

The server creates parent directories and prints one startup JSON line such as `{"port":43127}`. The persistent store uses `schema_version: 2`, contains `lessons` and append-only `events`, and is written using an atomic temporary-file replacement. Successful writes survive restart. Existing v1 stores are migrated once: every lesson receives `expires_at: null`, event objects are retained, and the migrated file is persisted as schema 2. A malformed existing file causes startup or CLI failure; it is never reset or overwritten. Use one writer for a store and stop the server before using the CLI for that same file.

Lessons have `expires_at: null` or a nonnegative safe integer UTC epoch millisecond value. Create defaults it to null. Revise preserves it when omitted and clears it with explicit `null`. Expiry is a projection decision: it never deletes a lesson or event.

## HTTP API

All responses are JSON. Validation errors and malformed JSON return `400`; bodies larger than 65536 bytes return `413`; missing scoped lessons return `404`; duplicate identities and revision conflicts return `409`.

```sh
# Health
curl http://127.0.0.1:43127/health

# Create
curl -X POST http://127.0.0.1:43127/lessons -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","instruction":"Review the rollout","conditions":["deploy"],"source_ref":"runbook:7","expires_at":4102444800000}'

# Revise; omitted conditions, exclusions, and expires_at are preserved
curl -X POST http://127.0.0.1:43127/lessons/deploy/revise -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","expected_revision":1,"instruction":"Review the staged rollout","source_ref":"runbook:8"}'

# Explain at a deterministic time; invalidation and override are request-only
curl -X POST http://127.0.0.1:43127/explain -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","text":"We will deploy today","now":4102440000000,"invalidated_refs":[],"override_ids":[]}'

# List, history, and export are scope-specific
curl 'http://127.0.0.1:43127/lessons?product_id=demo&participant_id=alice'
curl 'http://127.0.0.1:43127/history?product_id=demo&participant_id=alice&lesson_id=deploy'
curl 'http://127.0.0.1:43127/export?product_id=demo&participant_id=alice'

# Disable; revision stays unchanged and repeated disable is idempotent
curl -X POST http://127.0.0.1:43127/lessons/deploy/disable -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","expected_revision":2}'
```

`/explain` assesses all lessons in the requested scope, sorted by `lesson_id`. Disposition priority is `disabled`, `expired`, `inapplicable`, `unsupported`, `overridden`, then `applicable`. Only applicable lessons appear in `items`. Conditions and exclusions use case-insensitive substring matching. `invalidated_refs` and `override_ids` are transient projections and do not persist or erase lessons.

## CLI

The CLI uses the same store and behavior. Every command takes a JSON object and writes exactly one JSON result to stdout on success. Errors are one JSON object on stderr and have a nonzero exit status. Run it only while the server for that store is stopped.

```sh
node src/cli.mjs --store ./data/memory.json create --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","instruction":"Review the rollout","source_ref":"runbook:7","expires_at":4102444800000}'
node src/cli.mjs --store ./data/memory.json revise --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","expected_revision":1,"instruction":"Review the staged rollout","source_ref":"runbook:8","expires_at":null}'
node src/cli.mjs --store ./data/memory.json explain --json '{"product_id":"demo","participant_id":"alice","text":"deploy now","now":4102440000000}'
node src/cli.mjs --store ./data/memory.json history --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy"}'
node src/cli.mjs --store ./data/memory.json list --json '{"product_id":"demo","participant_id":"alice"}'
node src/cli.mjs --store ./data/memory.json export --json '{"product_id":"demo","participant_id":"alice"}'
node src/cli.mjs --store ./data/memory.json disable --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","expected_revision":2}'
node src/cli.mjs --help
```

## Errors and scope

Every operation explicitly validates `product_id` and `participant_id`. List and export never include another scope. History requires an existing lesson in the requested exact scope. Failed validation, duplicate creation, revision conflicts, and missing lessons do not write data. Store events contain immutable identity, revision, source reference, kind, and increasing event IDs.

## Tests

Model-authored tests import `src/core.mjs` and `src/store.mjs` directly, use temporary data, cover v1 migration, expiry projection, persistence, history, scope isolation, and malformed storage, and do not spawn subprocesses:

```sh
node --test --test-isolation=none
```
