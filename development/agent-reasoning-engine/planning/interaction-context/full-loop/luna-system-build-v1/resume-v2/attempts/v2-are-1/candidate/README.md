# Memory Observatory v2

Memory Observatory is a local, single-writer retained-instruction store using only Node.js standard-library modules. It supports creating and revising lessons, disabling reuse, expiry projections, explaining which lessons apply to text, and inspecting durable history.

## HTTP service

```sh
node src/server.mjs --store ./data/memory.json --port 0
```

The service binds only to `127.0.0.1` and prints one startup JSON line such as `{"port":43217}`. Parent directories and a new store file are created automatically. Existing malformed or structurally invalid stores fail rather than being reset.

Endpoints:

- `GET /health`
- `POST /lessons`
- `GET /lessons?product_id=P&participant_id=U`
- `POST /lessons/ID/revise`
- `POST /lessons/ID/disable`
- `GET /history?product_id=P&participant_id=U&lesson_id=ID`
- `GET /export?product_id=P&participant_id=U`
- `POST /explain`

All responses are JSON. Request bodies are limited to 65536 bytes. Validation errors return 400, oversized bodies return 413, missing scoped lessons return 404, conflicts return 409, and unknown routes return 404.

## CLI

Stop the server for the selected store before running a CLI command:

```sh
node src/cli.mjs --store FILE COMMAND --json JSON_OBJECT
node src/cli.mjs --help
```

Commands are `create`, `revise`, `disable`, `list`, `history`, `export`, and `explain`.

Examples:

```sh
node src/cli.mjs --store ./data/memory.json create --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone","instruction":"Use concise wording","source_ref":"guide:v1","conditions":["release"],"expires_at":4102444800000}'
node src/cli.mjs --store ./data/memory.json revise --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone","expected_revision":1,"instruction":"Use very concise wording","source_ref":"guide:v2","expires_at":null}'
node src/cli.mjs --store ./data/memory.json explain --json '{"product_id":"demo","participant_id":"alice","text":"Prepare the release notes","now":4102444800000}'
node src/cli.mjs --store ./data/memory.json history --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone"}'
```

`create` accepts identity, instruction, source_ref, optional conditions/exclusions, and optional `expires_at`. `revise` requires lesson_id, expected_revision, instruction and source_ref; omitted arrays and expiry preserve previous values, while `expires_at:null` clears expiry. `disable` requires lesson_id and expected_revision. `list` needs product_id and participant_id. `history` additionally needs lesson_id. `export` needs product_id and participant_id. `explain` needs product_id, participant_id and text, with optional now, invalidated_refs and override_ids.

Each successful command writes exactly one JSON result to stdout. Failures write one JSON error object to stderr and exit nonzero. There are no authentication secrets or external services.

## Persistence and behavior

The current store format is:

```json
{"schema_version":2,"lessons":[],"events":[]}
```

Writes validate a candidate state, write a unique temporary file, and atomically rename it over the selected store path. Completed writes survive process restart. A v1 store is validated, migrated once to schema 2, and atomically replaced; lessons receive `expires_at:null` and existing event objects remain unchanged. Reopening the migrated store does not add history or migrate again.

A lesson is identified exactly by `(product_id, participant_id, lesson_id)`. Revisions increment content revision and preserve disabled state. Disabling does not increment revision, and repeated disable calls do not add duplicate events. Event IDs increase monotonically. Conditions and exclusions use case-insensitive substring matching.

Explain is a transient projection. Expiry occurs when `now >= expires_at`; omitted `now` uses the current UTC epoch milliseconds. Assessment priority is `disabled`, `expired`, `inapplicable`, `unsupported`, `overridden`, `applicable`. Only applicable lessons appear in `items`. Expired lessons remain stored and inspectable. Invalidations and overrides never mutate storage.

Every operation requires an explicit product and participant. Reads and exports are scope-filtered and deterministically ordered. This prototype assumes one writer per store; independent stores may be used concurrently.

## Tests

The authored tests import core and store functions directly, use temporary files, and do not spawn subprocesses:

```sh
npm test
```
