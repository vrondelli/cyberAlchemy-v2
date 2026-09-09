# Memory Observatory v1

A local, single-writer retained-instruction store using only Node.js standard-library modules. Data is scoped by the exact `(product_id, participant_id, lesson_id)` identity. The HTTP server binds only to `127.0.0.1`.

## Launch

```sh
node src/server.mjs --store ./data/memory.json --port 0
```

The server creates parent directories and prints one startup JSON line such as `{"port":43127}`. The JSON store contains `schema_version`, `lessons`, and append-only `events`. Successful mutations use an atomic temporary-file replace, so a completed write survives restart. A malformed existing file causes startup failure and is never reset. This prototype assumes one writer per store; stop the server before using the CLI for that store.

## HTTP API

All responses are JSON. Validation and malformed JSON return `400`; oversized bodies return `413`; missing lessons return `404`; duplicate identities and revision conflicts return `409`.

```sh
# Health
curl http://127.0.0.1:43127/health

# Create
curl -X POST http://127.0.0.1:43127/lessons -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","instruction":"Review the rollout","conditions":["deploy"],"source_ref":"runbook:7"}'

# Revise, preserving omitted conditions/exclusions
curl -X POST http://127.0.0.1:43127/lessons/deploy/revise -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","expected_revision":1,"instruction":"Review the staged rollout","source_ref":"runbook:8"}'

# Explain a request without mutating state
curl -X POST http://127.0.0.1:43127/explain -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","text":"We will deploy today"}'

# Scope-specific list, history, and export
curl 'http://127.0.0.1:43127/lessons?product_id=demo&participant_id=alice'
curl 'http://127.0.0.1:43127/history?product_id=demo&participant_id=alice&lesson_id=deploy'
curl 'http://127.0.0.1:43127/export?product_id=demo&participant_id=alice'

# Disable (revision remains unchanged; repeated disable is idempotent)
curl -X POST http://127.0.0.1:43127/lessons/deploy/disable -H 'content-type: application/json' \
  -d '{"product_id":"demo","participant_id":"alice","expected_revision":2}'
```

`/explain` assesses every lesson in the requested scope, sorted by `lesson_id`. Priority is `disabled`, `inapplicable`, `unsupported`, `overridden`, then `applicable`; only applicable lessons appear in `items`. Conditions and exclusions use case-insensitive substring matching. `invalidated_refs` and `override_ids` are request-only projections and are not persisted.

## CLI

The CLI uses the same store and behavior. Every command takes a JSON object and writes exactly one JSON result to stdout on success. Errors are one JSON object on stderr and have a nonzero exit status.

```sh
node src/cli.mjs --store ./data/memory.json create --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","instruction":"Review the rollout","source_ref":"runbook:7"}'
node src/cli.mjs --store ./data/memory.json revise --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","expected_revision":1,"instruction":"Review the staged rollout","source_ref":"runbook:8"}'
node src/cli.mjs --store ./data/memory.json explain --json '{"product_id":"demo","participant_id":"alice","text":"deploy now"}'
node src/cli.mjs --store ./data/memory.json history --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy"}'
node src/cli.mjs --store ./data/memory.json list --json '{"product_id":"demo","participant_id":"alice"}'
node src/cli.mjs --store ./data/memory.json export --json '{"product_id":"demo","participant_id":"alice"}'
node src/cli.mjs --store ./data/memory.json disable --json '{"product_id":"demo","participant_id":"alice","lesson_id":"deploy","expected_revision":2}'
node src/cli.mjs --help
```

## Tests

Model-authored tests import `src/core.mjs` and `src/store.mjs` directly and use temporary stores:

```sh
node --test --test-isolation=none
```
