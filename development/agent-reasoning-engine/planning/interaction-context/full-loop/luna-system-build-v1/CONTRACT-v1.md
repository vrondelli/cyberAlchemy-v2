# Memory Observatory — complete local system contract v1

Build a complete working Node.js 26.8.1 system using only standard-library modules.
Deliver package.json, src/core.mjs, src/store.mjs, src/server.mjs, src/cli.mjs,
test/system.test.mjs and README.md. Additional src/*.mjs or test/*.mjs files allowed.
No external dependency, network client, external service, authentication secret,
repository import, UI framework or installed tool is available. All source is ESM.

Product: let a developer create and revise retained instructions, disable reuse,
ask which instructions apply to a request and inspect durable history. The system
is local and single-writer per store. HTTP binds only 127.0.0.1. CLI operations
run while the server for that store is stopped; concurrent independent writers
are outside this prototype. Both interfaces share behavior and persistent state.

Identity: (product_id, participant_id, lesson_id); every operation requires an
explicit product and participant. No list, explain, export or history operation
may include another scope. IDs and source_ref and instruction are nonempty strings.
Conditions/exclusions are arrays of nonempty strings, default []; duplicates may
be rejected or deduplicated. Use exact identity equality and case-insensitive
substring matching for conditions/exclusions. No semantic classifier is needed.

Store: --store is an exact JSON file path; create parent directories if needed.
Persist {schema_version:1,lessons:[...],events:[...]}. Atomic replace-on-write is
required. Each lesson stores its identity, instruction, conditions, exclusions,
source_ref, revision (starting at 1), disabled (starting false). Events are
append-only records with unique increasing integer event_id, kind (created,
revised, disabled), identity, revision, source_ref. Preserve immutable prior event
content. A completed success must survive process restart. A malformed existing
store must cause startup/CLI failure and must not be overwritten or reset.
There is no delete or enable endpoint. Disabling does not increment content
revision; revising increments revision and preserves disabled state.

HTTP launch: node src/server.mjs --store FILE --port 0
Print one JSON startup line containing {"port":ACTUAL_PORT}; use 127.0.0.1.
All responses are JSON. Errors have {"error":{"code":STRING,"message":STRING}}.
Reject malformed JSON with HTTP 400. GET unknown path -> 404. Bodies >65536 bytes
-> 413. Validation errors -> 400; missing scoped lesson -> 404; duplicate create
or expected_revision mismatch -> 409. Do not write data on failed operations.

Endpoints:
GET /health -> {ok:true,schema_version:1}
POST /lessons, body lesson fields -> 201 {lesson:RECORD}
GET /lessons?product_id=P&participant_id=U -> 200 {lessons:[...]}, sorted lesson_id
POST /lessons/ID/revise, body {product_id,participant_id,expected_revision,
instruction,source_ref,conditions?,exclusions?} -> 200 {lesson:RECORD}; omitted
conditions/exclusions preserve their prior values. expected_revision is required.
POST /lessons/ID/disable, body {product_id,participant_id,expected_revision}
-> 200 {lesson:RECORD}; repeated disable is idempotent, adding no duplicate event.
GET /history?product_id=P&participant_id=U&lesson_id=ID -> {events:[...]}
GET /export?product_id=P&participant_id=U -> {schema_version:1,product_id:P,
participant_id:U,lessons:[...],events:[...]}, scoped and deterministically ordered.
POST /explain, body {product_id,participant_id,text,invalidated_refs?,override_ids?}
-> {items:[{lesson_id,instruction,revision,source_ref}],assessments:[{lesson_id,
revision,disposition}]}. Only same-scope lessons are assessed, sorted lesson_id.
Disposition priority: disabled; inapplicable (a condition missing or an exclusion
present); unsupported (source_ref in invalidated_refs); overridden (lesson_id in
override_ids); applicable. items contains exactly applicable lessons. This is a
projection, not a mutation: invalidation/override must not persist or erase a lesson.

CLI: node src/cli.mjs --store FILE COMMAND --json JSON_OBJECT
COMMAND is create, revise, disable, list, history, export or explain. Inputs match
HTTP bodies/query fields; revise/disable/history also require lesson_id in input.
Success writes exactly one JSON result to stdout and exits 0. Failure writes one
JSON error to stderr and exits nonzero. No extra banners. State must interoperate
with server-created stores and vice versa. --help exits 0 and explains commands.

Testing/docs: model-authored tests should import core/store functions directly,
use temporary data and need no subprocesses. Tests run with node --test
--test-isolation=none. Document launch, every command, persistence, single-writer
scope, error handling and sample create/revise/explain/history workflows. Tests
and documentation are part of the delivered system. The evaluator separately
launches the real server and CLI and validates behavior, including restarts.
