# Memory Observatory v1

A local, single-writer retained-instruction store built only with Node.js standard-library modules. It supports creating and revising lessons, disabling reuse, explaining which lessons apply to text, and inspecting durable history.

## Run the HTTP service

```sh
node src/server.mjs --store ./data/memory.json --port 0
```

The service binds to `127.0.0.1` and prints one startup JSON line such as `{"port":43217}`. Port `0` selects an available port. The parent directory and a new store file are created automatically. Existing malformed stores fail rather than being reset.

Endpoints:

- `GET /health`
- `POST /lessons`
- `GET /lessons?product_id=P&participant_id=U`
- `POST /lessons/ID/revise`
- `POST /lessons/ID/disable`
- `GET /history?product_id=P&participant_id=U&lesson_id=ID`
- `GET /export?product_id=P&participant_id=U`
- `POST /explain`

Every operation is explicitly scoped by product and participant. JSON request bodies are limited to 65536 bytes. Validation errors return 400, missing scoped lessons return 404, conflicts return 409, unknown paths return 404, and oversized bodies return 413. Responses and errors are JSON.

## CLI

Stop the server for the selected store before running a write command:

```sh
node src/cli.mjs --store ./data/memory.json create --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone","instruction":"Use concise wording","source_ref":"guide:v1","conditions":["release"],"exclusions":["legal"]}'
node src/cli.mjs --store ./data/memory.json revise --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone","expected_revision":1,"instruction":"Use very concise wording","source_ref":"guide:v2"}'
node src/cli.mjs --store ./data/memory.json explain --json '{"product_id":"demo","participant_id":"alice","text":"Prepare the release notes"}'
node src/cli.mjs --store ./data/memory.json history --json '{"product_id":"demo","participant_id":"alice","lesson_id":"tone"}'
```

Commands are `create`, `revise`, `disable`, `list`, `history`, `export`, and `explain`. Each successful command writes one JSON result to stdout; failures write one JSON error to stderr and exit nonzero. Use `node src/cli.mjs --help` for the command summary.

## Persistence and behavior

The store is `{schema_version:1,lessons:[],events:[]}`. Writes use a temporary file followed by an atomic rename. Lessons have revision 1 initially; revision preserves disabled state and disabling does not increment revision. Disable is idempotent and adds only one disable event. Events have increasing IDs and retain their original source references.

`/explain` assesses only the requested scope. Conditions and exclusions use case-insensitive substring matching. Assessments are ordered by lesson ID and use the priority `disabled`, `inapplicable`, `unsupported`, `overridden`, `applicable`; only applicable lessons appear in `items`. Invalidation and overrides are request projections and are not persisted.

This prototype assumes one writer per store. Independent stores may be used concurrently.

## Tests

The authored tests import `src/core.mjs` and `src/store.mjs` directly and use temporary directories:

```sh
npm test
```
