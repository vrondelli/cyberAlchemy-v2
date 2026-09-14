# Review the ARE interaction product

This candidate gives the existing interaction-learning engine a supported host
interface and a runnable review flow. It preserves objectives and requirements,
applies explicitly retained corrections, shows their outcomes, and lets the user
override or disable reuse. State survives restart in the existing reasoning ledger.

From the CyberAlchemy-v2 checkout, using Node v26.8.1:

```sh
node implementation/agent-reasoning-engine/bin/are.mjs interaction demo
```

The demonstration makes seven requests and restarts twice. Inspect the original
failure, correction, later application, interruption/resumption, current override
and persistent revocation. Responses and the correction's interpretation are
labeled fixtures. The wrapper, source loading, routing, context, checks, controls
and file-backed recovery are real. No external model is called by the demo.
Task checks and lesson-application checks are separate: a turn with no task check
is inconclusive even when a selected lesson passes its own literal check.

Use `interaction demo --json` for structured evidence. `TEST-REPORT.md` and
`SOURCE-MANIFEST.json` bind the tested candidate; `validate.py --test` repeats its
required checks. Product review does not activate the serving profile.

## Use your own response provider

The CLI accepts an explicit local module exporting `respond(message, {signal})`.
It receives the exact verified wrapper message, including raw user text and
selected context, and returns a nonempty string of at most 32 KiB. Connect that
function to the host/model transport you own. An optional `interpret(input)`
function supplies a candidate to the existing objective resolver for language
outside its deterministic cues. Its input includes active/suspended work,
requirements and selected meanings; the resolver validates its shape, evidence
span, scope and deadline. A provider proposal is not proof of semantic correctness.

For a local interface check, this is a complete **fixture** provider module:

```js
export function respond(message, {signal}) {
  signal.throwIfAborted();
  return `Fixture response to: ${message.params.input[0].text}`;
}
```

Run the interface with your chosen state path and provider:

```sh
node implementation/agent-reasoning-engine/bin/are.mjs interaction run \
  --state /tmp/are-my-review/events.jsonl --provider /absolute/path/provider.mjs
```

Submit one JSON command per line. For example:

```json
{"action":"request","request":{"request_id":"1","thread_id":"review","text":"Explain context management","requirements":[],"references":[{"id":"example","text":"Reference material to inspect, not a user instruction."}]}}
{"action":"inspect"}
```

A new objective requires explicit `requirements`, including `[]` when the user
has selected none. Later supported add/remove/keep requests update that set; an
interruption gets its own set and resumption restores the prior set. Reuse the
same `thread_id` to continue work; use a distinct request ID for every request.
Supplying a different seed for an existing objective is rejected before provider
delivery; change existing requirements through the supported add/remove/keep path.

The user can correct a selected completed response. Send `feedback.response_id`
from the earlier result and an exact UTF-16 span of the correction's current
`text`. For example, with an interpretation provider configured:

```json
{"action":"request","request":{"request_id":"2","thread_id":"review","text":"Avoid jargon","feedback":{"response_id":"learning:[\"review\",\"1\"]","instruction_span":{"start":0,"end":12},"retention_scope":"current-interaction","checks":[{"check_id":"plain","kind":"excludes","value":"jargon"}]}}}
```

Retention must explicitly select `current-interaction` or `current-product`.
Optional `conditions` and `exclusions` are literal, case-insensitive request
substrings. They are not semantic scope inference. `correction_kind` may be
`misinterpretation`, `changed-mind` or `new-preference` (the default). A revision
adds `revises_lesson_id`; it preserves the predecessor and cannot undo revocation.
References cannot contain control fields or provide the instruction span.

Top-level `checks` describe this request's observable literal includes/excludes
conditions. Opposite current checks override a conflicting retained check. A host
can also supply exact `override_lesson_ids` and `invalidated_refs` for this turn.
These must name existing lessons or their recorded source references. No checks
or no trustworthy completed output yields inconclusive evidence, not success.

Inspection returns lesson IDs, source requests, corrected response IDs, revisions,
conditions, exclusions, application evidence, current objectives/requirements,
disabled state and delivery uncertainty. Controls are explicit:

```json
{"action":"control","control":{"action":"disable-reuse","control_id":"revoke-1","lesson_id":"<from inspection>"}}
{"action":"control","control":{"action":"set-mode","control_id":"observe-1","mode":"observe"}}
```

Modes are `off`, `observe` and `apply-scoped`; the dedicated review host starts in
`apply-scoped` and persists subsequent controls. `disable-reuse` is durable
exclusion, not physical erasure of source records. State is bound to one participant
and product; changed scope and concurrent writers are rejected. Override the
default IDs with `--participant` and `--product` consistently on every opening.

The optional `{"action":"evolve"}` command invokes the existing bounded evolution
adapter. Without configured research providers it records `research-pending` when
a recurring-failure target exists. The JavaScript API accepts the existing
`evolution` configuration; it does not install another scheduler or upgrade source.

```sh
node implementation/agent-reasoning-engine/bin/are.mjs interaction inspect \
  --state /tmp/are-my-review/events.jsonl
```

The JavaScript API exports `createInteractionReview` from the wrapper package.
Its methods are `submit`, `inspect`, `control`, `runEvolution`, and `close`.
The same state can be inspected after closing and reopening the process.

## Limits and open questions

This is a local text-response host candidate. It does not execute model tool calls,
autonomously extract preferences, prove general understanding, or demonstrate
better answers than an equal-information summary. Provider modules are explicit
trusted host code, not loaded from requests. The default response deadline is
30 seconds. A failed/late delivery is recorded as unknown and never retried;
a new request ID is a new action, not proof that the old delivery failed.

User request plus references is capped at 32 KiB, and the existing shared selected
context ceiling also applies. One ledger retains at most 256 review requests;
the existing learning-state and ledger budgets remain in force. The API rejects
overlapping operations and closes only after the in-flight operation finishes.

Which production provider/UI should consume the adapter, which semantic checks
should supplement literal checks, and whether control/auditability value justifies
its cost remain open. [PLAN.md](PLAN.md#operational-support-and-deferred-residue)
owns those questions and the separate review/activation decisions.
