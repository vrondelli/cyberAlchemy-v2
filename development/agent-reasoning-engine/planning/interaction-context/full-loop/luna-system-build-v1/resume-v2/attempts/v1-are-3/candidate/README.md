# Memory Observatory v1

A local, single-writer retained-instruction store implemented with Node.js standard-library modules. It supports creating and revising lessons, disabling reuse, explaining which lessons apply to text, and inspecting durable history.

## HTTP service

```sh
node src/server.mjs --store ./data/memory.json --port 0
```

The service binds only to `127.0.0.1` and prints one startup JSON line, for example `{"port":43217}`. Port `0` selects an available port. Parent directories and a new store file are created automatically. Existing malformed stores fail rather than being reset.

Endpoints:

- `GET /health`
- `POST /lessons`
- `GET /lessons?product_id=P&participant_id=U`
- `POST /lessons/ID/revise`
- `POST /lessons/ID/disable`
- `GET /history?product_id=P&participant_id=U&lesson_id=ID`
- `GET /export?product_id=P&participant_id=U`
- `POST /explain`

Every operation is explicitly scoped by product and participant. Request bodies are limited to 65536 bytes. All responses are JSON. Validation errors return 400, oversized bodies return 413, missing scoped lessons return 404, conflicts return 409, and unknown routes return 404.

### Create, revise, explain, and history

```sh
node src/cli.mjs --store ./data/memory.json create --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone","instruction":"Use concise wording","source_ref":"guide:v1","conditions":["release"],"exclusions":["legal"]}'
node src/cli.mjs --store ./data/memory.json revise --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone","expected_revision":1,"instruction":"Use very concise wording","source_ref":"guide:v2"}'
node src/cli.mjs --store ./data/memory.json explain --json '{"product_id":"demo","participant_id":"alice","text":"Prepare the release notes"}'
node src/cli.mjs --store ./data/memory.json history --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone"}'
```

## CLI

Stop the server for the selected store before running a CLI command. The commands are `create`, `revise`, `disable`, `list`, `history`, `export`, and `explain`:

```sh
node src/cli.mjs --store FILE COMMAND --json JSON_OBJECT
node src/cli.mjs --help
```

`create` accepts the full lesson identity and content. `revise` accepts `lesson_id`, `expected_revision`, `instruction`, `source_ref`, and optional replacement `conditions` and `exclusions`; omitted arrays are preserved. `disable` accepts `lesson_id` and `expected_revision`. `list` needs `product_id` and `participant_id`. `history` additionally needs `lesson_id`. `export` needs the product and participant. `explain` needs the product, participant, and text, with optional `invalidated_refs` and `override_ids`.

Each successful command writes exactly one JSON result to stdout. Failures write one JSON error object to stderr and exit nonzero. There are no authentication secrets or external services.

## Persistence and behavior

The store is persisted as:

```json
{"schema_version":1,"lessons":[],"events":[]}
```

Writes validate a candidate state, write a unique temporary file, and atomically rename it over the selected store path. A completed write survives process restart. Existing malformed or structurally invalid stores are never reset.

Lessons use the exact identity `(product_id, participant_id, lesson_id)`, start at revision 1, and retain their disabled state across revisions. Revisions add an immutable `revised` event. Disabling does not increment the content revision and repeated disable calls do not add duplicate events. Event IDs increase monotonically.

Conditions and exclusions use case-insensitive substring matching. Explain assessments are sorted by lesson ID and use this priority: `disabled`, `inapplicable`, `unsupported`, `overridden`, `applicable`. Only applicable lessons appear in `items`. Invalidations and overrides are transient request projections and never mutate storage.

This prototype assumes one writer per store. Independent stores may be used concurrently.

## Tests

The authored tests import core and store functions directly, use temporary files, and do not spawn subprocesses:

```sh
npm test
```
