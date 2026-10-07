# DSH objective continuity: implementation analysis

Status: private gateway objective/preflight path wired and two native turns tested;
remaining P3 and F1 work open.
Parent scope: [complete UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md) and
[integration DAG](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/REVISED-CODEX-DSH-INTEGRATION-DAG-2026-10-04.md),
P3 followed by F1. No installation, activation or authority change.

## Reproduced gap

Historical diagnostic: the unowned stateless helper below intentionally remains
available for bounded tests. The qualified Host's journal-worker path now uses
the owned runtime described at the end of this document; a caller label alone
still must not become ownership or recovered context.

Calling [Web preparation](../../../packages/dsh-gateway-backend-adapter/src/web-prompt-permit.mjs)
twice with the same disposable caller session label produced:

- `explain this architecture`: `CA2-ROUTE-UNDERSTAND`.
- `continue`: `dsh-web.are-route-not-direct`.

The label is not durable objective state. The function builds every request
from the new raw text with `objective_kind: null`; it neither restores the
active objective nor preserves requirements or a parent plan. The preparation
correlation work proves which context was dispatched, not that this context
contained the continuing objective.

## Reusable implementation and boundaries

[Objective lifecycle](../../../packages/codex-app-server-wrapper/src/objective-lifecycle.mjs)
already owns objective transitions, duplicate/conflicting request rejection,
meaning selection, requirement continuity, and append/seal/checkpoint ordering.
Its transport facade is Codex-specific: `params.threadId`, `params.input`,
`clientUserMessageId`, a `codex-objective:` request reference, and Codex-named
context fragments. Reusing those wire packets for DSH would hide the boundary.

[Requirement continuity](../../../packages/codex-app-server-wrapper/src/objective-requirements.mjs)
already verifies the predecessor and derives every successor snapshot on
replay. Continuing an objective must retain its complete requirement set;
refinement requires an accounted delta. A new objective requires a verified,
synchronous Host-only seed. Raw browser metadata cannot supply that trusted
seed. Do not create a second, less strict DSH requirement tracker.

[Reasoning State](../../../packages/reasoning-state-runtime/index.mjs)
already supports durable records and single-writer recovery. Its checkpoint
selector rejects an uncheckpointed tail. Do not silently truncate such a tail
or infer dispatch from a restored interpretation. The existing
[Codex tests](../../../packages/codex-app-server-wrapper/test/objective-lifecycle.test.mjs)
cover continuation before routing, thread isolation, restart, duplicate
dispatch denial and unchanged user text; preserve those behaviors during
extraction and add DSH-native tests.

The [DSH gateway process](../../../packages/dsh-gateway-backend-adapter/src/web-are-gateway-process.mjs)
is the existing owner of the binding/dispatch journal and preparation calls.
It is the integration point, not an additional browser-owned writer or a new
text-replay store. A distinct private Reasoning State ledger may persist
interpretation through this same process; native DSH history remains owned by
DSH, and the existing gateway journal remains the ownership/dispatch authority.

## Required construction sequence

1. Extract a transport-neutral objective lifecycle within the existing shared
   ARE runtime. Accept normalized consumer, stable conversation scope, opaque
   backend-thread and exact request references. Keep the Codex normalization
   and context serialization in its facade, preserving existing event/digest
   compatibility. A physical package rename is not needed for this first step.
2. Bind DSH normalization to the actual active Host-owned journal binding,
   not the browser cookie, RPC ID or caller session label alone. Preserve the
   stable scope across a verified released-session resume; do not use an
   ephemeral Host process epoch as the objective's continuity identity.
3. Recover and checkpoint objective/requirements before preparing dispatch.
   Represent queue edits as distinct, bound requests; never overwrite the
   original prompt's interpretation or preparation identity. An interpretation
   checkpoint is not acceptance, completion, permission or safe redispatch.
4. Feed the verified continuing objective into route **and** context
   evaluation without rewriting raw user input or calling inferred fields
   explicit. Extraction alone is insufficient: the
   [CLI context path](../../../src/decision-cli.mjs) currently creates only a
   request-context hint and a Codex-shaped preflight packet; it does not carry
   recovered objective/requirement state. Use a neutral internal preflight
   boundary, retaining the CLI facade separately.
5. Qualify first prompt, continuation, refinement, replacement, suspended
   objective return, missing referent, cross-thread/Host replay, queue edit,
   rejected admission, lost ACK, restart, and failed checkpoint. Verify that
   every route/context/model-entry receipt agrees on the same predecessor,
   objective and request. Extend the closed source pins deliberately for new
   active modules; do not relax unknown-source rejection.
6. Project only bounded, source-bound continuity/frontier metadata into
   Threads, independently of native turn state. Preserve all seven parent UI
   obligations. Then join trusted correction attribution and candidate
   Evolution signals for F1; an observed candidate signal is not an executed
   Evolution cycle or an automatic improvement.

## Open questions

- Which explicit Host configuration selects a trusted requirement/parent-plan
  seed for a new conversation? No ambient default plan or untrusted browser
  field should make that decision.
- What existing neutral preflight input can carry the recovered objective,
  or what additive contract is required while keeping CLI/Codex compatibility?
- How should an objective checkpoint that precedes subsequently rejected
  admission be exposed, without implying the prompt was executed?
- Exact Host-bound public frontier fields and later privacy/retention policy
  remain owned by the parent plans. The running Windows build uses its frozen
  staging copy and does not include the later kernel extraction. The DSH suite
  does not import or source-pin the extracted lifecycle; its inputs remain
  unchanged.

## Step 1 construction evidence

The shared implementation is now
[objective-session-lifecycle.mjs](../../../packages/codex-app-server-wrapper/src/objective-session-lifecycle.mjs).
Its default entry accepts only normalized consumer/scope/thread/request
references and request text. These references still require a trusted Host
join; this factory does not authenticate them. The
[Codex facade](../../../packages/codex-app-server-wrapper/src/objective-lifecycle.mjs)
retains its existing wire normalization, request namespace, context fragment
schemas and durable transition material.

The focused objective, requirement, meaning-selection and entry suites pass
50/50 with zero failures/cancellations. The
[new normalized-entry tests](../../../packages/codex-app-server-wrapper/test/objective-session-lifecycle.test.mjs)
cover continuation without Codex fields, replay/conflicting bytes, isolated
conversation scopes, malformed/oversized input, identical Codex transition
material, and recovery of all seven explicitly seeded UI obligations. They
also cover an additive per-scope in-flight guard and a shared ledger-fault
check before append: a different scope already being interpreted cannot
write a successor after another scope faults the ledger. Requirement order
is canonicalized by the existing runtime; the test checks the complete set
and exact retained snapshot, not navigation order.

This completes extraction evidence, not P3. Actual DSH Host-bound recovery,
trusted requirement/plan seeding, neutral preflight/context integration, native
dispatch joins and read-only frontier projection are still required. The raw
DSH `continue` gap remains until those steps are connected and tested.

## Step 2 boundary construction evidence

[web-objective-binding.mjs](../../../packages/dsh-gateway-backend-adapter/src/web-objective-binding.mjs)
adds the private gateway-process normalization boundary. It replays the
gateway's complete conversation binding chain and joins the exact active,
unexpired local Host writer, generation and native Session-derived thread.
Principal, workspace and conversation identifiers come from that journal,
not browser fields. Its stable consumer/scope survive a verified released-
session handover while the old writer is rejected. Original text is retained;
distinct Host queue-edit request IDs preserve earlier interpretation identity.
The returned binding head is evidence, not an admission or dispatch grant.

Seven focused tests passed, including journal tampering, inactive/faulted
ownership, exact identity negatives, verified handover, queue-edit identity,
and journal-derived inputs through restored shared objective lifecycle.
The boundary is not yet invoked by the active preparation process. Trusted
Host IPC attachment, durable ledger ownership and neutral preflight remain
required; these focused tests do not close the raw DSH continuation gap.

The earlier full serial DSH suite completed with 157 passed, zero failures,
cancellations or skips (39m53s). Its already-selected input set predates this
new boundary and tests; this verdict covers preparation-correlation/native
ownership work, not P3 continuity.

## Neutral preflight construction evidence

[owned-request-context.mjs](../../../packages/codex-app-server-wrapper/src/owned-request-context.mjs)
verifies a normalized request against its resolved objective's consumer,
conversation, exact request reference and text digest. The original request
remains separate from the effective routing description; recovered objective
text is marked inferred rather than passed off as new explicit user input.
[preflight.mjs](../../../packages/codex-app-server-wrapper/src/preflight.mjs)
now shares context composition between its preserved Codex facade and
`evaluateOwnedRequestPreflight`. The native entry consumes no Codex packet
and emits no Codex fragment or forwarded message. It returns a prepared
envelope and neutral directive, not a dispatch grant.

The focused objective/requirements/meaning/entry/wrapper and native-preflight
run passed 138 tests, zero failures/cancellations. Native entry tests cover
route agreement with Codex, continuing objective route/context preparation
without changing original text, and cross-request/consumer/scope/text refusal.
The research continuation correctly routes to RESEARCH; an initial test's
UNDERSTAND expectation was corrected, not the router. The full wrapper suite
terminated with exit 0: 853 tests, 824 passed, zero failures/cancellations,
29 skipped. Durable log:
`/tmp/are-wrapper-neutral-preflight-20261006.ZeIcfy.log` (54 seconds).
The skips are 16 opt-in browser checks without configured browser resources,
eight native Windows checks on POSIX, and five tests whose pinned Codex
fixture binary is unavailable at the configured/default path. They remain
unverified here; exit 0 is not qualification of those skipped features.
This native entry is not yet invoked by DSH preparation.

### Additional source-freeze gap

The current DSH canary graph manifest pins `web-prompt-permit.mjs`, which
imports `src/decision-cli.mjs`, but does not pin that decision entry or the
shared preflight module. A read-only relative-static-import traversal from
the decision entry found 133 MJS files, 127 absent from that manifest's ARE
source pins. This is an import-closure upper bound (barrel exports include
code not necessarily exercised); dynamic imports and non-MJS data are not
covered by this count. Runtime policy/data verification is a different check
and does not pin executable code. Existing graph qualification must not be
described as full ARE executable closure qualification.

Before qualifying P3, extend the deliberate source freeze to the actual ARE
decision/preflight/objective executable dependency closure and data selectors,
with changed/unknown-source negatives. Do not merely refresh existing listed
digests or disable drift rejection. This gap predates the neutral extraction;
the older 157-test verdict remains limited to its tested manifest contract.

## Gateway-owned runtime construction: 2026-10-07

[web-owned-preparation.mjs](../../../packages/dsh-gateway-backend-adapter/src/web-owned-preparation.mjs)
now connects the journal-derived input to the shared objective lifecycle and
native preflight. The existing private gateway process owns a separate
single-writer, file-fsync Reasoning State ledger adjacent to its gateway
journal (`<journal>.objectives.jsonl`). Startup recovers only a checkpointed
tail; no truncation or automatic redispatch is performed. Interpretation is
checkpointed first, and a separate native-preflight record/checkpoint binds
the exact ownership evidence, objective, requirements and context envelope
before returning preparation. The Host's existing inbox/model-entry permit
still owns actual admission and dispatch.

The Host supplies binding ID, writer and generation from its private records,
not browser fields. The broker accepts a closed v2 prepared model-context
projection with verified digest joins while preserving its legacy stateless
test surface. No Codex packet is fabricated. An explicit synchronous startup
`requirement_seed` selects tracking; absent configuration does not invent a
seven-feature plan. CLI/UI selection of a trusted requirement/parent-plan
artifact is still required for complete product behavior.

Verification so far:

- Seven normalization/shared-lifecycle tests plus six new owned-runtime tests
  passed (13 total). The real private IPC/file-ledger tests cover reopen,
  all seven explicitly seeded requirements, continued route/context, replay,
  foreign/inactive ownership, unresolved first references, checkpoint failure
  and startup rejection of uncheckpointed history. A fault returns no prepared
  context and prevents successor writes.
- Existing journal worker, Host-owner and prompt-permit tests passed 53/53.
- The qualified disposable native DSH Web test passed with **two actual model
  requests**: explicit `explain ARE routing architecture`, then `continue`.
  The local provider received v2 ARE context, retained objective identity and
  a successor state digest; no tools were advertised. Public observation
  remained content-free and linked the latest preparation to model entry.
  The first-turn `explain this architecture` is correctly refused by the owned
  lifecycle when no referent exists; the old stateless route result is not a
  reason to guess one.
- Source freeze expanded to the relative-static-import closure from the ARE
  decision entry and gateway process, plus selected policy/runtime/schema
  files and new test witnesses: 326 read-only, 338 Host-owned and 337 canary
  pins. Only known changed source/test rows were re-pinned. This closes the
  previously observed static executable pin gap, not every possible dynamic
  import/data/deployment qualification question. The first expanded graph
  test run failed on two obsolete hard-coded `182` expectations; actual source
  verification succeeded. The test now expects 326 and checks new core-code
  drift negatives. Its re-run completed with seven passed, zero failures or
  cancellations (140 seconds), including complete installed-package checks.
- Lost-ACK/released-session restart native verification passed (one test,
  zero failures/cancellations, 101 seconds). It verifies the v2 first model
  entry, terminal reconciliation, released Session resume through a fresh
  Host, and retained public outcome. A second model turn after that fresh
  Host resume remains a separate required continuity witness.

Remaining product frontier: verify all transition/refinement/queue-edit paths
under the owned runtime, bind exact objective checkpoint metadata into the
dispatch journal/observer/UI, expose interpreted-but-not-admitted state
without an execution claim, provide explicit trusted requirement/parent-plan
selection, and complete F1's attributed feedback/Evolution join. The previous
Windows package predates this runtime and needs later rebuilt qualification;
the complete parent UI and integration DAG remain in scope.

### Final guard revision and running verification

The worker-backed Host now refuses a downgrade to the stateless v1 preparation
format. Both prompt and queue-edit permits compare the v2 preparation's exact
binding ID, writer and generation with the current private Host witness.
An additional test proves a valid prepared objective cannot borrow another
Host binding's permit and never reaches native invocation. The latest focused
owned-runtime/journal/Host-owner/prompt-permit run passed 60/60 with zero failures
or cancellations. Together with the separate normalization suite, current
owned-runtime tests cover seven normalization and seven preparation cases.

Only the two known changed source files and the changed owned-preparation test
were re-pinned for `owned-objectives3`; pin counts remain 326/338/337.
The final guard native two-turn plus lost-ACK/restart re-run completed: session
`34768`, two passed, zero failures/cancellations/skips (234 seconds).
The expanded graph re-run also completed: session `2636`, seven passed,
zero failures/cancellations/skips (202 seconds).

### Objective checkpoint journal retention: 2026-10-07

The Host now retains a closed, content-free `objective_checkpoint` alongside
each v2 preparation observation. It contains scope, objective-state, resolution,
preflight-event, checkpoint and binding digests, plus the nullable requirement
continuity digest. These are references projected from an already validated
owned preparation, not an independently replayed objective ledger, dispatch
grant, completion frontier, or hidden model reasoning.

The journal validates the closed shape and request/thread binding before append.
Its observation digest covers the new fields. Compaction/reopen preserves them;
legacy v1 preparations remain readable without a fabricated checkpoint. A
retained checkpoint alone leaves the prompt outcome unknown. The existing
model-entry preparation bindings remain the separate dispatch relationship.
At this journal-only stage the observer, native bridge and dashboard did not
expose these new fields. The subsequent construction slice below adds that
propagation; interpreted-but-not-admitted projection remains required work
under the full seven-panel plan.

Verification: gateway-session-store suite 42 passed; Host-owner plus owned
preparation suites 38 passed; zero failures/cancellations/skips in both.
The full wrapper suite completed with 825 passed, zero failures/cancellations,
and 29 unverified skips (browser prerequisites, native Windows checks on POSIX,
and unavailable pinned Codex schema fixture); 854 tests total, 99 seconds.
Negative checks cover malformed digests, unknown/content-bearing fields, foreign
requests and invalid nullable continuity metadata. The native model test now
compares the retained objective-state, resolution and binding digests with the
actual v2 context received by its loopback provider.

Source freeze `owned-objectives4` re-pins only the changed journal, Host,
native test and its private probe; counts stay 326/338/337. Final verification:
native two-turn/lost-ACK suite session `72312` passed both tests with zero
failures/cancellations/skips (186 seconds). Both normal-ACK and lost-ACK tests
compare the first provider context with its retained journal checkpoint; the
normal path additionally verifies a continuing model turn, and the lost-ACK
path verifies released-session restart. A checkpoint comparison for the
second model turn and a new turn after fresh-Host resume remain to be added.
Graph suite session `31385` passed seven tests with zero failures/cancellations/
skips (162 seconds), including the complete installed-package tree and drift
negatives. Both handles are terminal; neither run launched a new Windows GUI.

Open questions remain owned by the parent integration DAG and whole-UI plan:
trusted requirement/parent-plan selection, full owned transitions and queue
paths, read-only checkpoint UI, feedback/Evolution attribution, fresh Windows
and Linux package qualification, and separately authorized installed lifecycle.

### Checkpoint observer and Threads display: 2026-10-07

The content-free checkpoint contract now lives in
[`dsh-objective-checkpoint-observation.mjs`](../../../packages/codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs).
Journal validation is unchanged by the extraction. The Host observer projects
a closed six-field summary: schema, `host-retained-reference` status,
checkpoint/state/binding digests and requirement-reference posture. The client,
Rust bridge and dashboard validate the same closed shape. A worst-case 16-Agent
response remains below the existing 16 KiB transport ceiling. No objective,
requirement, prompt or reply text is exported.

Threads shows the checkpoint reference separately from the preparation's
latest-model-entry relationship and native turn state. Missing legacy fields
do not fabricate a checkpoint. Malformed or execution-claim metadata makes
the reading incompatible; unavailable reads hide the current DSH display.
A short first-view limit remains visible; fuller limits are adjacent in a
keyboard-operable disclosure. This is a Host-retained reference, not independent
objective-ledger replay, live model reasoning, dispatch permission or completion.

Final verification for source freeze `owned-objectives5`:

- Dashboard/observer/client/journal focused run: 119 passed, no failures,
  cancellations or skips. The final disclosure-only HTML revision separately
  passed all 69 dashboard source tests.
- Offline native Rust build and unit suite: ten passed. The plain compiler
  invocation lacked pkg-config; the existing repository desktop overlay supplied
  dependencies without installing or replacing a compiler or system library.
- Native DSH suite: two passed, zero failures/cancellations/skips, 141 seconds.
  Both branches complete two model turns. The normal branch compares the second
  checkpoint summary with the second actual provider context. The lost-ACK
  branch releases the old writer, resumes the same native Session in a fresh
  Host at generation two, then submits `continue`. Objective identity survives,
  the new checkpoint matches the second provider context, and there are exactly
  two model requests rather than an old-prompt redispatch.
- Graph suite: seven passed, no failures/cancellations/skips, 121 seconds.
  Pin counts are now 327 read-only, 339 Host-owned and 338 canary. Only selected
  changed files were re-pinned; the new pure checkpoint module is in the static
  executable closure. Installed-package pins are unchanged.
- Full wrapper suite: 825 passed, zero failures/cancellations, 29 unverified
  skips; 854 total, 73 seconds. Browser prerequisites, Windows-on-POSIX and the
  unavailable pinned Codex schema fixture remain skipped, not qualified.
- Isolated current-source Chromium journey: checkpoint/model-entry/native-turn
  labels, a newer preparation distinct from model entry, requirement-reference
  posture, source-loss withdrawal and invalid execution-claim rejection passed.
  At 340 × 740 the page has no document overflow; limits start collapsed and
  expand/collapse with Enter. The retained
  [narrow capture](../../../../../output/playwright/dsh-checkpoint-20261007/page-2026-10-07T03-27-56-351Z.png)
  was visually inspected. This uses a disposable no-model renderer fixture,
  not a packaged Windows/WebKitGTK UI or a live task-control proof.

No Windows Companion was launched in this slice. The prior tested extracted
Windows package predates these changes; fresh Windows/Linux packaging and native
UI qualification remain. Open questions are still owned by the parent plans:
all owned transitions and queue paths, explicit trusted requirement/parent-plan
selection, interpreted-but-not-admitted visibility, attributed feedback and
Evolution, resource acceptance, installed lifecycle and separately authorized
deployment. The full seven-feature goal is not complete.

### Owned transition and multi-prompt dispatch: 2026-10-07

The newly owned queue fixtures initially exposed a real runtime gap:
`modelContextForDispatch` still merged only stateless v1 contexts. A prompt could
be admitted and steered into the active native turn, yet the next model request
was refused once two owned v2 contexts had to be composed. This was not a
provider, installer or UI rendering failure.

The broker now emits `are.dsh-web-model-context-batch/v1` for multiple owned
preparations. Each ordered request-context row retains its source schema,
prepared-string digest, route/envelope digest, complete objective/requirement
projection, and selected-item digests. Shared source items are deduplicated;
every row reconstructs the exact original v2 prepared string. A batch is not
one merged objective or a completion frontier. Mixed v1/v2 batches reject,
and the existing 16-context/32-KiB ceilings and legacy v1 behavior remain.

The private provider witness now joins actual model-facing bytes to every
model-entry preparation binding, including queue edits. A removed prompt or
its edit must never become a later model-entry binding. Native cancellation
must not generate another model request. The graph probe also exposes only
interpretation/preflight counts for race tests, not reasoning or prompt text.
Those private counts are not yet a public Threads projection.

Focused verification: 63 passed, zero failures/cancellations/skips across
owned preparation, prompt permits, Host ownership and gateway worker suites.
The ten owned preparation tests include explicit requirement add/remove,
interruption, suspended return, replacement and restart; the original seven
requirements survive, latency is added as an eighth and explicitly removed.
The batch test reconstructs the actual owned preparation bytes and retains
both seven- and eight-requirement snapshots. The earlier test incorrectly
expected a free-form refinement without requirement accounting to succeed;
that case now separately proves refusal without changing stored requirements.

Unlabeled follow-up requests also need transition evidence when an objective
already exists. The qualified production DSH runtime currently has no bounded
objective provider configured. Mutation fixtures explicitly declare new work
instead of guessing it, but this does not solve natural-language fallback or
the generic preparation-denied diagnostic in the product. Those remain open
requirements, not successful qualification by narrowing the tests.

Source freeze `owned-objectives9`: 333 read-only, 345 Host-owned and 344 canary
pins. Six selected native-test/helper sources were deliberately added; only
known changed runtime/test rows were refreshed. Installed DSH package pins
remain unchanged. Native mutation job `5538` completed: five passed, zero
failures/cancellations/skips, 499 seconds. The actual local provider received
all three owned prompts in the steering turn, including bounded v2 batches;
every consumed preparation reconstructs from model-facing bytes and joins
its retained model-entry/checkpoint record. Edited-prompt dispatch and removal,
cancel/lost-cancel-ACK recovery, and cancellation after steering also passed.
Serial job `78454` completed: nine passed, zero failures/cancellations/skips,
585 seconds, covering clean handover, preparation races, and settings/tool/
loader/preset drift. Settings changes during preparation retain one interpreted
objective and one preflight checkpoint, but no admitted preparation observation,
native inbox/message/model event, or model-entry observation. A drained binding
and preparation outage record neither interpretation nor preflight. This proves
the private distinction that the later public rejected-interpretation view must
preserve, not that the public view exists already.

The final graph run `19419` completed with seven passed, zero failures/
cancellations/skips, 96 seconds. It verifies every current pin and the unchanged
complete installed DSH package tree, plus graph/source drift negatives. All
three native/graph handles are terminal. The 63 focused, 14 native and seven
graph tests have no skips; they are selected-suite evidence, not a new full
serial-package or rebuilt Windows/Linux UI verdict. No external model, installer,
live profile or current-chat handover was used in this slice.

Next product work remains explicit trusted requirement/parent-plan selection,
interpreted-but-not-admitted observation, bounded semantic fallback, and F1.
The existing [Reasoning Plan Context](../../../packages/reasoning-state-runtime/plan-context.mjs)
already binds a thread, verified parent/source digests, all feature obligations,
the active slice, unresolved decisions and a predecessor. Reuse that record
for Host-selected plan packaging; startup requirement names alone must not be
claimed as complete parent-DAG context. The current Host CLI does not select
either artifact. Feedback/Evolution must reuse the existing learning lifecycle
behind a native owned-input/terminal boundary, not fabricate Codex packets or
treat prompt admission/ACK as a completed, answered episode.

### Explicit Host parent-plan selection: 2026-10-07

The later construction step implements optional Host startup
`--plan-selection /absolute/selection.json`. The
[closed selection loader](../../../packages/dsh-gateway-backend-adapter/src/web-host-plan-selection.mjs)
verifies bounded workspace-relative regular source files and their declared
SHA-256 bytes, then reuses the existing Reasoning Plan Context shape. The
configuration explicitly names the parent, all feature obligations, active
slice and unresolved decisions. It is not ambient repository discovery, a
Markdown-to-plan parser, or browser-supplied identity/context selection.
The [adapter instructions](../../../packages/dsh-gateway-backend-adapter/README.md#explicit-host-parent-plan-selection)
describe the exact startup and size contracts.

The production CLI passes only its digest-bound private startup descriptor to
the existing ARE process. Before recording anything, the owned normalizer
matches the selected canonical workspace/preset to the conversation journal's
workspace binding. Foreign workspace, writer or generation cannot borrow a
valid plan. The process rechecks selection/source bytes before interpretation
and again after its asynchronous boundary. Omitting a previously retained plan
on restart is refused. A changed existing active slice/plan template also
refuses before a new interpretation; safe advancement is still future work.

The shared `plan-context-recorded` event is thread-bound and separately sealed
and checkpointed before interpretation. An unresolved first `continue` may
retain the explicitly selected plan but never counts as prompt admission or
model execution; its ledger remains recoverable. Successful native preparation
then seals the plan event alongside the preflight event. The checkpoint subject
binds plan context, selection, objective, requirements and native binding.
Selected preparations use closed `are.dsh-objective-binding/v2` with a
`plan_context_digest`; their bounded v2 model projection carries the complete
plan context. Unselected binding v1 behavior remains. The validator checks
plan integrity and exact backend-thread association; stripping, transplanting
or forging a plan invalidates the preparation. Owned steering batches retain
and reconstruct the selected plan along with each preparation's requirements.
Declared obligation statuses are context, not a completion verdict.

Verification after workspace-binding hardening: 80 focused tests passed,
zero failures/cancellations/skips (16.463 seconds), covering selection,
normalization, owned preparation, broker, worker and Host ownership. The
existing shared plan-context suite also passed two tests. The final native
selected-plan rerun passed two cases (111.152 seconds): actual local-provider
requests retain all seven UI obligations, their active slice and unresolved
decision through ordinary continuation and lost-ACK/fresh-Host resume. The
original request is not redispatched. A prior four-case run (209.658 seconds)
also covered unselected/selected ordinary and fresh-Host paths before this
last workspace check; it is not substituted for the final selected rerun.
The final graph/CLI run passed nine tests, zero failures/cancellations/skips
(156.315 seconds): all pins and installed package bytes, graph drift negatives,
explicit selection CLI preflight, and real production Host startup/shutdown/
release-index resume with the same selection. Every test handle is terminal.

The `owned-objectives11` source freeze has 337 read-only, 349 Host-owned and
348 canary pins. Four selected loader/test/helper inputs were added; only
known changed rows were refreshed. Installed package pins remain unchanged.
No external provider, Windows GUI, installer, live profile or current chat
handover was used. These are candidate construction checks, not a fresh OS
package or a complete P3/full-goal verdict.

The opt-in [full-plan selection candidate](../../../packages/dsh-gateway-backend-adapter/config/are-integration-plan-selection.candidate.json)
retains the integration DAG and all seven UI features in 30 bounded obligations,
including alternative/operational branches explicitly marked deferred rather
than erased. Its source references bind the DAG, whole UI plan, seven UX briefs,
their index and session-control contract. Its summaries and statuses are an
assistant-authored candidate packaging, not owner approval or execution state.
No Host chooses this file implicitly. After either parent document changes,
the owner must review and regenerate its source digests; never refresh them
automatically to conceal drift.

The candidate itself was checked through a disposable private gateway with a
journal-bound canonical repository workspace, not merely parsed as JSON. It
retains 30 requirements, 30 obligations, 11 verified sources and seven open
decisions in a valid owned preparation: 31,006 model-context bytes, below the
32,768-byte ceiling. No native Agent/provider or live Host was involved in that
candidate-package check. Its attempt via `node --input-type=module -e` first
failed because Worker inherited the file-incompatible flag; the ordinary Node
evaluation rerun succeeded. Both attempts closed/removed their disposable homes.

A second real private broker/Session contract reproduction consumed this exact
30-obligation preparation and a continuing successor. Dispatch refused with
`dsh-web.model-context-too-large`: the current batch repeats the full plan and
requirement projections even though source items are deduplicated. This is a
newly reproduced full-scope runtime gap, not resolved by the passing seven-panel
native fixture or the selected-plan batch unit. **The next implementation
frontier is lossless shared plan/requirement projection in owned batches**, with
each original preparation reconstructible and the existing 32-KiB ceiling.
Do not narrow the package, drop obligations, silently truncate or merely raise
the ceiling to obtain a passing fixture. Both private probe runs are terminal;
no model request or live native mutation occurred in the failed batch probe.

#### Open questions and next frontier

- Keep the complete Codex/DSH DAG and seven UI features, not just Adapters.
  A human-authored selection must actually list the chosen parent's obligations;
  file hashes alone cannot prove semantic completeness of that list.
- The later full-plan batch section below supersedes the reproduced overflow;
  keep the full 30-obligation candidate in subsequent qualification.
- Add explicit selection advancement/replacement with a checked predecessor,
  and content-free parent-plan plus interpreted-but-not-admitted UI projection.
- Configure bounded semantic transition fallback without guessing unlabeled
  requests, silently changing requirements, or adding an implicit model call.
- F1 still needs the existing learning lifecycle behind an owned native input/
  terminal boundary and trusted corrections before Evolution attribution.
- Rebuild and qualify current-source Windows/Linux UI, installed lifecycle and
  resource limits; security remains last and operational effects stay separate.

### Lossless full-plan batch dispatch: 2026-10-07

The preceding two-prompt overflow is repaired, not hidden by a smaller plan or
a higher resource limit. The
[planned batch composer](../../../packages/dsh-gateway-backend-adapter/src/web-model-context-batch.mjs)
emits closed `are.dsh-web-model-context-batch/v2` with a complete shared plan,
source dictionary, ordered context template and separate request rows. Each
row has the original model-context digest and a bounded replacement tree
relative to the template, never to the preceding row. Plan requirements use
readable `[obligation_id]` references to exact shared summaries; extra
requirements remain literal text. The full plan, all inactive obligations and
open decisions stay readable. No compression tool, dropped text or merged
objective is introduced. Key order is retained or the whole changed object is
replaced, and every original model-context string must reconstruct byte-for-byte
before dispatch. The existing 32,768-byte context and 16-request ceilings remain.
Invalid references, source collisions, unknown replacement keys/shapes, altered
plan/request digests and genuinely oversized unions reject. Unselected owned
batches remain v1; single selected preparations remain v2.

The full-candidate fixture copies only the eleven declared source files and
verifies their original bytes before private selection. An independent native
provider witness implements reconstruction separately from the production
decoder. It joins each exact reconstructed digest to the retained private
preparation checkpoint and verifies the actual model-entry context digest.
The full native case consumes three explicitly distinct objectives, preserving
all 30 obligations/requirements, eleven sources and seven decisions. After
clean release and fresh Host resume, a genuinely new `continue` reaches the
local provider with the last objective and complete plan; no old request is
redispatched. This is actual native dispatch evidence, not a batch parser alone.

Verification for the `owned-objectives12` snapshot, all terminal:

- Six focused owned preparation/permit/owner/worker/selection/binding files:
  82 passed, zero failures/cancellations/skips; 31.300 seconds.
- Graph manifest suite: seven passed, zero failures/cancellations/skips;
  150.165 seconds, including source and installed-package drift checks.
- Serial native queue-remove and queue-steering suites: four passed, zero
  failures/cancellations/skips; 351.411 seconds. These include full-plan dispatch
  and resume, unselected compatibility, queue-edit/removal and cancellation.
- Disposable private three-objective full-candidate contract reproduction:
  single context 31,006 bytes, batch 32,700 bytes; exact reconstruction of all
  three original strings under 32,768 bytes. These exact byte counts are from
  the private probe; native-provider assertions separately enforce the ceiling.

The deliberate source freeze adds the new composer and refreshes only known
changed inputs: 338 read-only, 350 Host-owned and 349 canary pins. Installed
package pins remain unchanged: 25,509 files, 523 package instances and
224,470,546 bytes. No live profile, external provider, installation or current
chat handover was used for this repair. The later approved repeat Windows GUI
smoke passed two tests in 78.719 seconds on the earlier preparation-correlation
executable; it does not qualify the new checkpoint UI/source package.

#### Open questions and next frontier

The complete Codex/DSH DAG and all seven Companion features remain the goal.
Next P3 work is explicit checked selection advancement/replacement and a
content-free parent-plan/interpreted-but-not-admitted read projection. Bounded
semantic fallback and cross-harness proof remain open; local-provider fixtures
do not qualify an external model's understanding of the shared projection.
F1 needs neutral owned input/terminal evidence and trusted corrections before
Evolution attribution. Fresh Windows/Linux package UI, installed lifecycle and
resource acceptance remain unqualified; security stays last. Low physical D:
free space is operational residue distinct from Linux free blocks and grants
no cleanup, installation or restart authority. Declared candidate statuses are
not completed work, and updating candidate source digests is an explicit
construction operation, never automatic runtime acceptance of drift.

### Content-free selected-plan reference: 2026-10-07

The successful owned preparation's existing plan-context digest now survives
the Host journal and observer in closed
`are.dsh-objective-checkpoint-observation/v2` and
`are.dsh-objective-checkpoint-summary/v2`. Each adds only
`plan_context_digest`; no file path, plan text, question, obligation text or raw
identity is exported. The digest comes from the already validated native
objective binding, not browser metadata. The summary remains a Host-retained
reference, not independent objective-ledger replay. Legacy v1 observations and
summaries are unchanged; a legacy summary cannot prove absence of a selected
plan because previous producers omitted that field.

The native bridge accepts both closed versions and serializes the optional
`planContextDigest` to the dashboard. Threads displays a short selected-plan
reference with `(not verified progress)`, separately from requirement continuity,
model-entry correlation and native turn state. Legacy summaries say `plan
selection not reported`. Unknown shapes, invalid digests, null selected-plan
references and v1/v2 field mismatches are rejected; incompatible readings hide
the current DSH display. A retained selection is not plan advancement, verified
obligation completion or an interpreted-but-not-admitted checkpoint.

Verification for `owned-objectives13`, all terminal:

- Dashboard source suite: 69 passed, zero failures/cancellations/skips.
- DSH observer suite: eight passed, including authenticated socket round-trip
  of the v2 plan reference and malformed-source rejection.
- Focused journal compaction/reopen cases: two passed, one per checkpoint
  version, preserving the selected-plan digest without resolving dispatch.
- Owned preparation/Host owner/observer run: 57 passed in 11.248 seconds.
- Wrapper observer suite: eighteen passed, including unchanged Codex behavior.
- Selected-plan native continuation and lost-ACK/fresh-Host recovery: two
  passed, zero failures/cancellations/skips; 115.001 seconds. The actual first
  model plan digest equals the public retained reference.
- Graph suite: seven passed, zero failures/cancellations/skips; 98.914 seconds.
  Source counts remain 338/350/349, installed-package pins unchanged.
- `tools/toolchain/run-desktop cargo check --offline --locked --manifest-path
  implementation/agent-reasoning-engine/apps/desktop-companion/src-tauri/Cargo.toml
  --tests` succeeded in 68 seconds. The first plain-toolchain invocation
  failed at missing pkg-config/GUI prerequisites; the existing desktop overlay
  supplied them without installing packages. One existing incremental-cache
  permission warning remains. This type-check compiled the test source but did
  not execute Rust unit tests, link a fresh executable or run a native GUI.

#### Open questions and next frontier

Checked Host plan advancement/replacement, full plan-progress projection and
interpreted-but-not-admitted display remain open. The short selected-plan
reference does not close them. Current-source rendered/narrow/native package
verification is still required; the prior Windows GUI build cannot qualify this
new field. Bounded semantic fallback, F1 trusted corrections/Evolution attribution,
the other seven-panel obligations and OS/lifecycle/resource/security qualification
remain the full parent scope. No install, release, live profile or chat handover
occurred. Large builds remain deferred under low physical D: space.

### Checked Host plan advancement: 2026-10-07

The [selection loader](../../../packages/dsh-gateway-backend-adapter/src/web-host-plan-selection.mjs)
now accepts closed `are.dsh-host-plan-selection/v2`: all v1 fields plus an
explicit `plan_transition` with kind `advance` and up to 32 unique exact
backend-thread/predecessor digest rows. The unchanged selection size is 16 KiB.
This remains private Host startup configuration; browser/observer data cannot
select a predecessor. The existing journal-derived workspace/writer/generation
binding is checked before plan lookup. An advancing profile cannot initialize
a new thread or borrow a foreign predecessor.

The [owned runtime](../../../packages/dsh-gateway-backend-adapter/src/web-owned-preparation.mjs)
requires the selected predecessor to equal the retained thread plan head before
changing a template. Parent reference and ordered obligation IDs/summaries must
remain unchanged; no requirement is reseeded, renamed or dropped. Verified source
bytes, selected slice, declared statuses and unresolved questions may change.
The existing shared plan-context chain supplies the checked predecessor append.
The successor is sealed and fsync-checkpointed before interpretation. An applied
transition reopens idempotently only with its recorded predecessor and matching
template. Replaying an earlier transition after another advancement is refused.
Declared statuses still do not prove completion or question resolution.

The seven-panel and complete 30-obligation private-worker cases preserve all
requirements, including an explicit additional latency requirement, through
advancement, worker restart and a second checked advancement. Stale replay,
foreign/missing heads, silent obligation changes and no-op transitions reject
without recording a new interpretation. A real sink checkpoint-write failure
returns no preparation, records no interpretation, faults successor preparation
and leaves recovery explicitly rejecting the uncheckpointed tail rather than
silently truncating it.

The new native case uses the existing lost-ACK/released-Session path. After
the first Host releases and exits, its fresh successor starts with the explicit
v2 descriptor, resumes generation two and admits a new `continue`. The actual
local-provider projection has the new active slice, exact predecessor, original
objective identity and all seven requirements; the observer plan digest joins
that projection. Exactly two model requests occur, with no old redispatch.
This one native case passed in 101.526 seconds on `owned-objectives14`.
The same snapshot's graph plus production Host CLI suite passed nine checks
in 128.352 seconds, with no failures/cancellations/skips. The later
`owned-objectives15` freeze changes only the corrected fault-test pin; production
source is identical and source counts remain 338/350/349. Its four-file focused
selection/owned preparation/permit/worker suite passed 50 tests in 37.892 seconds,
with zero failures/cancellations/skips.

Two diagnostic failures were corrected, not counted as passes: the first
advancement fixture used an unsupported unaccounted requirement phrase (the
existing bounded form is `Add latency to the requirements.`); the first fault
fixture wrapped the ledger and therefore lost its verified identity before it
could reach the checkpoint path. The corrected fault injects a write failure
into the real registered ledger sink. A pre-refresh CLI attempt separately
failed at expected source-pin drift; only six known changed inputs were frozen,
with installed-package pins unchanged.

The final `owned-objectives15` graph suite passed seven tests, zero failures,
cancellations or skips, in 109.987 seconds. All launched test handles are
terminal. After parent documentation synchronization and explicit refresh of
only those two candidate source digests, the full-plan private three-objective
probe again reconstructed all original strings exactly: 30 obligations,
30 requirements, 31,006 single-context bytes and 32,700 batch bytes. This
probe uses the initial candidate selection, not an advanced-plan batch; the
advancement cases separately verify requirement and predecessor preservation.

#### Open questions and next frontier

Replacement of parent identity or requirement/obligation sets still needs an
explicit accounted migration; advancement intentionally does not implement it.
Interpreted-but-not-admitted projection, full plan-progress semantics, bounded
natural-language fallback, cross-harness proof and F1 feedback/Evolution remain
required. Current-source rendered/narrow/native package qualification and the
seven-panel/lifecycle/resource/security work remain open. These source/private
tests advanced no live profile or current chat and launched no Windows GUI.
Low physical D: space still defers large builds; it does not authorize cleanup.

### Interpretation retained without admission: 2026-10-07

The shared normalized objective lifecycle now returns the digest of its actual
manual fsync checkpoint only after that checkpoint succeeds. The private DSH
runtime immediately retains a closed `dsh-objective-interpretation-observed`
Host journal record, before the second source verification and native preflight.
Its generation/binding/thread, interpreted scope/state/resolution, event and
checkpoint references are digests only; requirements and selected-plan references
remain separate. Journal append failure faults preparation. Unresolved requests,
pre-interpretation binding/source refusal and plan selection alone produce no
interpretation record. The record creates no dispatch intent, model context or
native turn. Journal append/replay/compaction checks the exact DSH binding and
generation; a foreign, inactive or duplicate conflicting reference is refused.

The observer matches the latest interpretation to a retained admission
preparation on the same thread by exact scope/state/resolution. Without that
match it returns `are_interpretation`, a closed content-free
`are.dsh-objective-interpretation-summary/v1`, alongside any older preparation.
A later matching admission removes this separate summary. The authenticated
client, Rust bridge and Threads source reject unknown/private fields, invalid
digests and invented completion/execution/rejection statuses. Threads labels
`no admission retained for this interpretation at observation`, explicitly not
a rejection verdict or model execution. This can be observed in flight or
after refusal. A Host-reported reference is not independent private-ledger replay;
older producers' omission is not proof that no interpretation occurred.

The wire response retains its 16-KiB ceiling and maximum 16 rows. The projected
Agent list uses at most 12 KiB, leaving response metadata headroom; oversized
dual-evidence rows are omitted whole with an exact omitted count, not truncated
or merged. Synthetic maximum-length/16-Agent tests verify the response ceiling.

Verification so far: the owned-preparation and complete dashboard source suite
passed 93 tests in 31.109 seconds. These include actual manual checkpoint/event
joins after a failed preflight checkpoint, gateway journal compaction/reopen,
selected-plan source drift during interpretation, unresolved-first-prompt absence,
and UI invalid-claim withdrawal. The observer/shared lifecycle/session-store
suite passed 61 tests in 1.830 seconds, including authenticated read-path
validation and exact active-binding negatives. One initial observer test failed
because its fixture tried to canonicalize `undefined` before reaching the
validator; passing the malformed field directly fixed the fixture, not production
admission behavior. Offline Rust `cargo check --tests` through the existing
desktop overlay passed in 5.50 seconds; its existing incremental-cache permission
warning remains. Rust unit source was type-checked, not linked or executed.

On `owned-objectives16`, the three real Host preparation-race cases plus seven
graph checks passed in 132.795 seconds, and the advanced selected-plan fresh-Host
lost-ACK recovery case passed in 97.264 seconds. The `owned-objectives17` freeze
changes only the preparation-race test pin: that test additionally reads the
actual authenticated Host observer after refusal. Production source and installed
package pins are unchanged, with source counts 338/350/349. The final authenticated
race/graph suite passed ten checks (three races plus seven graph checks) in
104.078 seconds, zero failures/cancellations/skips. After actual settings drift
refuses insertion, the real Host observer read returns the exact interpretation
summary, no preparation, no native turn start and zero retained model entries;
pre-interpretation old-agent and outage cases return no interpretation summary.
The full 30-obligation native queue/steering and fresh-Host continuation case
passed in 70.416 seconds, zero failures/cancellations/skips. All launched test
handles are terminal; no owned fixture/Host process remains. Physical D: free
space was 242 MiB at completion, separately from Linux filesystem free blocks.
After synchronizing the parent DAG and whole-UI evidence, only their two
explicit candidate source digests and parent digest were refreshed. The final
private full-plan probe retained all 30 obligations/requirements: a 31,006-byte
single context and 32,700-byte three-objective batch, reconstructing every
original preparation exactly. This probe calls no provider and selects no live
Host; advanced-plan batch qualification remains separate work.
The final shared observer/private gateway-worker suite also passed 22 tests in
8.245 seconds, including nonce/stale-source withdrawal, single-writer recovery,
private-process loss and bounded IPC admission. All current test handles are
terminal, with no owned gateway-process or native Host fixture remaining.

#### Open questions and next frontier

This closes source transport/display of interpretation retention without a
matching retained admission, not a definitive rejection log or full plan-progress
semantics. Parent/requirement-set replacement, bounded configured semantic
fallback, cross-harness proof, trusted feedback/F1 and Evolution attribution
remain required. The complete seven-panel UI, fresh Windows/Linux rendering and
packaging, installed lifecycle/resource qualification and security-last work
remain the parent scope. No live Host profile, installation, release, Windows
GUI or current-chat handover occurred in this construction slice. Physical
D: space remains low; no large build or cleanup was attempted.

### Accounted plan replacement: pure requirements primitive, 2026-10-07

The shared
[`objective-requirements.mjs`](../../../packages/codex-app-server-wrapper/src/objective-requirements.mjs)
now exposes `materializePlanRequirementMigration` and exact recomputation through
`verifyPlanRequirementMigrationReplay`. A migration is explicitly not a prompt,
objective transition, admission, authority grant, ledger write, or model call.
Both plan records must pass closed-shape/digest verification and form an exact
same-thread successor chain. File-source verification and actual ledger/thread
ownership remain the caller's responsibility; hashes alone do not grant trust.

Every active and suspended snapshot needs one closed accounting row bound to its
exact predecessor digest. Retained and removed entries must exhaust the prior
snapshot without overlap; additions cannot recycle existing entries. Every new
plan obligation summary must occur in every resulting snapshot. Manual/non-plan
requirements survive unless explicitly removed. The objective state and prior
resolution digest remain unchanged; the next continuity links to the exact
previous continuity, with a separate `are.plan-requirement-migration/v1` receipt
explaining the change. The existing 32-KiB aggregate ceiling remains in force.
No synthetic request or fake Codex wire packet is generated.

The focused new migration tests and normalized lifecycle regression initially
passed 12 checks, with zero failures/cancellations/skips. They cover suspended
objectives, unchanged input/no ledger effects, deterministic replay and tampering,
missing/duplicate/foreign accounting, stale and foreign-thread plan links,
unaccounted loss, duplicate/add-remove laundering, full successor obligations,
and a subsequent real continuation derived from the migrated continuity.

The broader requirements, normalized lifecycle, migration, plan-ledger and DSH
owned-preparation suite passed 59 checks in 36.089 seconds. One additional
migration test explicitly removes a manual requirement and exercises the
unchanged 32-KiB receipt ceiling with two retained objectives: the final migration
suite passed all six checks in 0.232 seconds. The first graph run found only two
stale fixture assertions expecting 338 pins rather than 339; its parent test also
failed as a consequence (4 passed, 3 failed total). The fixture now explicitly
requires the new migration test pin and expects 339. Only the known primitive,
migration test and graph test source pins changed across snapshots 18/19; the
final read-only/owned/canary counts are 339/351/350. Installed package pins and
live profiles are unchanged. Physical D: has 210 MiB free, separately from
763 GiB of Linux filesystem free space; no large executable build was attempted.
The final graph rerun passed all seven checks in 89.811 seconds, with zero
failures/cancellations/skips, verifying every source pin, the complete installed
package tree and the real restricted disposable Host before/after session creation.
Syntax and whitespace checks for the changed shared primitive also passed.
All test handles are terminal. This is not full-30-obligation multi-objective
migration qualification: the receipt repeats accounted requirement text and may
hit its aggregate ceiling before an otherwise valid continuity does. A compact,
exact-predecessor accounting representation needs separate resource analysis
before claiming whole-plan replacement support; the ceiling must not be raised
or requirements truncated to hide that case.

### Shared atomic plan/requirements migration lifecycle: 2026-10-07

[`objective-session-lifecycle.mjs`](../../../packages/codex-app-server-wrapper/src/objective-session-lifecycle.mjs)
now exposes a private normalized `migratePlanRequirements` method. Its closed
input supplies the exact consumer/scope/thread, predecessor continuity digest,
source-verified successor plan input, accounting and trusted Host selection ref.
The scope's recorded thread binding must match; an in-flight real request blocks
migration. Accounting and source materialization finish before the first write.
The method appends the actual successor plan and a separate
`plan-requirements-migrated` event, seals exactly those two events and succeeds
only after their manual checkpoint. No fabricated prompt, objective transition,
provider request, dispatch intent or authority grant is involved. Current
requirements are published only after checkpoint success; objective state is
unchanged. A write failure faults the lifecycle and refuses further preparation.

Recovery walks plans and migrations in event order, verifies each historical
same-thread plan frontier, rederives the complete accounting from its exact
state/continuity predecessor, and requires the matching two-event epoch and
checkpoint. Duplicate or altered identity is refused. An exact retry can return
its historical receipt after later real prompts or later replacements without
rewinding current state or requirements. The content-free inspection surface
continues to expose only references and counts.

The ledger now offers an immutable `checkpoints()` read view. Live entries need
a successful flush; verified file recovery exposes retained checkpoint records,
not proof of a prior caller ACK. A surviving log cannot establish a historical
fsync outcome. Failure tests therefore distinguish live flush refusal from
event/epoch/checkpoint persistence failures leaving an uncheckpointed file tail.
No automatic truncation or repair was introduced.

Nine new lifecycle tests passed in 0.385 seconds, including active/suspended
migration, real append-only-file-fsync recovery, two successive replacements,
old idempotent retries after later requirement changes, exact binding/race
refusals, and event/epoch/checkpoint/flush injection. Initial retries failed
because the fixture used an unsupported add-requirement form and then an
uppercase label; the fixture now uses the existing canonical lowercase label.
Production intent grammar and its bounded-provider gap are unchanged. The
broader shared/Codex requirements, migration, reasoning-state and DSH owned
preparation suite passed 104 tests in 23.533 seconds, with zero failures,
cancellations or skips. Source snapshots 20/21 changed only the shared lifecycle,
reasoning ledger, new lifecycle test and known graph-count assertion pins.
Read-only/owned/canary counts are now 340/352/351, with unchanged installed
package pins and no live profile selection.
The final snapshot-21 graph suite passed all seven checks in 93.294 seconds,
with zero failures/cancellations/skips. It verifies every source pin and the
complete installed package tree, and exercises the real disposable restricted
Host before/after empty session creation with negative drift probes. Syntax and
whitespace checks passed. The parent DAG and whole-UI plan now link this shared
frontier; only their two explicit candidate source digests and parent digest were
refreshed. Such pin synchronization is not Host activation or extra qualification.
After that synchronization, the private full-plan three-objective probe still
retains all 30 obligations and requirements: the single context is 31,006 bytes
and the lossless batch 32,700 bytes, without a provider call or live Host. This
qualifies the existing batch composer, not the separate migration request/receipt
budget. All launched test/probe handles are terminal, with no owned Host or
gateway fixture remaining.

#### Open questions and next frontier

This closes the shared atomic lifecycle, not DSH startup replacement. The DSH
private selection schema still needs an explicit replacement operation and
exact compact accounting over all retained objectives. Full-30-obligation
multi-objective migration must fit the existing request/receipt/continuity
ceilings without text loss or a limit increase before native Host qualification.
Plan-progress read semantics, configured semantic fallback, cross-harness
control proof, F1/Evolution provenance, all seven UI features and fresh native
OS/lifecycle/resource/security-last qualification remain the full parent scope.
No executable build, GUI launch, installation, deployment, release or current-chat
handover occurred in this slice.

### Compact accounting and private DSH replacement: 2026-10-07

This supersedes the preceding startup-wiring and compact-accounting open items.
Private startup selection v3 now names `replace`, the exact backend thread,
previous plan and continuity digests, and one closed compact accounting row per
retained objective. Retained/removed indices resolve only in the digest-bound
old snapshot; added obligation IDs resolve only in the source-verified successor
plan. Manual additions remain literal. Missing, overlapping, foreign, stale or
unaccounted rows refuse. Shared migration receipt v2 retains compact accounting
and full resulting snapshots, with the existing 32-KiB aggregate ceiling. Legacy
full-text receipt v1 and checked advancement v2 remain supported.

DSH calls the shared atomic migration before interpreting the next real prompt.
It neither synthesizes a prompt nor publishes requirements before the joint
checkpoint. Private-worker restart and a second restart preserve the successor;
an exact retry cannot duplicate the migration or rewind later work. The full
candidate test keeps all 30 integration/UI obligations across three distinct
objectives, explicitly replaces one summary, and retains the manual latency
requirement. The private selection stays within 16 KiB. A DSH checkpoint-fault
test verifies no interpretation/preparation, no successor writes, and refusal of
the uncheckpointed recovery tail.

Research contexts also exposed a separate transport gap: one expanded context
was 36,234 bytes; an initial two-research-context batch exceeded 42 KiB. Selected
single context v3 now shares exact source values and plan requirement references.
Batch v3 shares ordered object shapes, backward-only dictionary references,
literal text fragments and field-index deltas. Every source value remains in
the readable JSON; no binary compression, source omission, requirement
truncation, merged objective or larger wire limit is used. Reconstruction must
recover every original model-context byte string and digest. Literal strings
such as `@0`, reserved marker objects and prototype-like JSON keys are escaped.
Cycle/forward/missing references, duplicate fields/indices, altered rules and
unknown roots refuse. Internal expansion verification has its own 64-KiB bound;
this is not a larger 32-KiB transport allowance. Over-budget unions still refuse,
and this bounded fixture does not prove arbitrary prompts fit.

The current four-suite migration/DSH regression passed 48 tests in 38.760
seconds; shared requirements/lifecycle/DSH binding passed 35 in 8.975 seconds;
reasoning-state/plan-context passed 37 in 0.470 seconds. The subsequently added
DSH replacement-checkpoint fault check passed separately in 0.915 seconds.
There were no failures, cancellations or skips in these final runs. Intermediate
codec versions failed the real research batch; a new literal-collision fixture
also exposed overly recursive fragment splitting, now bounded to one fragment
decomposition per string. Neither failure was hidden by a smaller prompt or a
larger budget. Source snapshot 48 retains 340/352/351 source pins with unchanged
installed-package pins. Final graph/native regressions are not yet recorded
here. No GUI launch, executable build, live profile, provider spend, installation,
release, deployment or current-chat handover occurred.

#### Open questions and next frontier

Native replacement/restart/model-observer proof is recorded below; that case
covers one active objective, not the separate three-objective Research batch.
Plan-progress read semantics, configured semantic fallback, cross-harness
ownership, trusted F1-to-Evolution provenance, all seven UI panels, fresh native
Windows/Linux rendering and numerical lifecycle/resource qualification remain
the full parent scope. Security remains last. The readable codec needs native
model-entry qualification and broader bounded-resource stress coverage; local
lossless reconstruction is not proof of model comprehension or semantic quality.

### Native full-plan replacement and fresh-Host resume: 2026-10-07

The dedicated installed-DSH Host test now selects the complete 30-obligation
candidate, completes a real local-mock model turn after an injected lost ACK,
drains/releases the Agent, and kills that disposable Host. It then explicitly
replaces the private parent file and one obligation summary, derives compact
accounting from the actual retained continuity, and resumes in a fresh Host.
The next real `continue` completes once, with the same objective identity, the
verified successor plan and every successor requirement in the outgoing model
request. The authenticated observer's latest-model-entry checkpoint binds the
same plan, state and objective-binding digests. The private ledger retains exactly
one v2 migration. There are exactly two model requests and two user messages;
neither migration nor restart redispatches the first prompt or creates a fake
user turn. This no-tool native test passed in 116.618 seconds, without failures,
cancellations or skips, on source snapshot 49.

The existing five native ACK/lost-ACK/retained-plan/advancement regressions also
passed, separately, in 268.479 seconds on snapshot 48. Its graph suite passed
seven checks in 86.074 seconds. After documentation/candidate synchronization,
the seven-panel and full-30 replacement, full-plan three-objective batch and
replacement-checkpoint fault checks passed again: four tests in 5.764 seconds.
A separate private two-Research-context probe reconstructed both wire strings
exactly: 32,707/31,164-byte singles and a 32,732-byte batch. These sizes belong
to that probe's short caller IDs, not all possible host identities or prompts.

Final snapshot-49 graph verification passed all seven checks in 140.631 seconds,
with zero failures/cancellations/skips. This verifies every source pin and the
complete installed package tree, plus the restricted disposable Host graph and
negative drift/no-Entry probes. Source counts remain 340/352/351; installed
package pins are unchanged. All native and graph handles are terminal, and an
exact fixture-process query found no surviving native Host or graph witness.
Only the two explicitly edited plan-document digests and parent digest were
resynchronized in the unactivated candidate selection; no live selection changed.

#### Open questions and next frontier

The native replacement case uses model-context v2 and one retained objective.
Native v3 Research model-entry and multi-objective replacement still need direct
qualification. Full plan-progress read semantics, configured semantic fallback,
cross-harness ownership, trusted F1/Evolution provenance, all seven UI panels and
fresh Windows/Linux/lifecycle/resource/security-last qualification remain open.
There was no GUI launch, executable build, external provider call, live profile,
installation, release, deployment or current-chat handover in these tests.

### Native v3 Research batching and continuation: 2026-10-07

The full-30 native queue/steer Research test now passes on source snapshot 59
(92.664 seconds; one test, zero failures/cancellations/skips). Three actual
authenticated Web prompts become three distinct owned objectives in one native
turn. The independent provider witness reconstructs each prepared wire string,
checks its retained preparation/model-entry digest, and checks all 30 obligations.
After gateway compaction and clean writer release, a fresh Host resumes the same
Session; only the newly requested `continue` dispatches, with the retained active
objective and full selected plan. No external provider or tools are used.

Earlier snapshots reached all three models but failed continuation: the native
request produced 36,341 expanded bytes and 32,803 compact bytes against the
unchanged 32,768-byte ceiling. A first private probe differed in request IDs and
had an extra initial objective; it was insufficient to prove this native case.
The closer reproduction now fits at 32,756 bytes. The repair shortens projection
instructions, not context content, and omits only a string-part instruction for
output the nonrecursive single encoder never emits. Legacy single rule strings
and mixed old/new rows reconstruct their exact original wire bytes. Legacy batch
rules do not reinterpret literal digest-looking strings as the newer fingerprint
notation. Reserved-marker and noncanonical digest tests refuse corruption.

Final source preparation tests: 27 passed in 29.571 seconds. Final graph tests:
7 passed in 130.021 seconds, including every source pin and the complete installed
package tree. Counts remain 340/352/351; installed-package pins are unchanged.
The single-active-objective native v3 Research replacement/lost-ACK/fresh-Host
regression also passed on snapshot 59 in 127.925 seconds (one test, zero
failures/cancellations/skips), using independent single-context reconstruction.
This still does not prove replacement across several retained native objectives.
The native fixture now reports only validated numeric size diagnostics on failure,
never prompt/source content. The passing recovery has only 12 bytes of headroom:
broader bounded-resource stress and genuinely oversized contexts remain open.

#### Open questions and next frontier

This qualifies native v3 Research batching/continuation, not multi-objective parent
replacement, semantic quality, or a newly built Companion. Full plan-progress read
semantics, configured bounded semantic fallback, cross-harness ownership,
trusted F1-to-Evolution provenance, all seven panels and fresh Windows/Linux
lifecycle/resource qualification remain the parent scope. Security stays last.
No live profile, package build, installer, release, deployment or current-chat
handover changed during this codec repair. A separate explicitly approved GUI
test of the older extracted Windows package passed two Host CLI tests; that older
executable does not qualify these new codec bytes.

After synchronizing only the two edited plan-source digests and parent digest in
the unactivated candidate, four full-plan advancement/replacement/batch/checkpoint
regressions passed in 14.779 seconds. The closer independent private reproduction
still measured 32,756 bytes. All native/graph test handles are terminal; an exact
fixture-process query found no surviving test Host. The full parent goal remains
active, not complete.

### Native replacement across three retained objectives: 2026-10-07

The full-30 Research queue/steer case now has a separate replacement variant.
Three real authenticated prompts resolve to distinct owned objectives and are
consumed in one native turn. After draining, releasing, compacting and closing
that disposable Host, the fixture reads the verified private Reasoning State
continuity and accounts every retained objective. It explicitly changes the
private parent file and one Appearance obligation summary, then starts a fresh
Host with the checked replacement descriptor. This is not browser-supplied plan
metadata and does not alter a live startup selection.

The new continuation reaches the local mock provider with the successor parent,
all 30 successor obligations and the same active objective. Independent provider
reconstruction binds each historical and successor prepared wire string to its
retained model-entry digest. Exactly one migration-v2 record contains all three
original objective IDs and updated requirement snapshots; each snapshot exactly
matches the successor requirement set. There are four model requests and four
native user messages: migration does not manufacture a turn or redispatch any
earlier prompt.

Source snapshot 60: native replacement variant passed one test in 116.671 seconds;
graph verification passed seven checks in 141.465 seconds, including every source
pin and the complete installed package tree. Shared migration/migration-lifecycle
regressions passed 16 checks in 0.449 seconds. All runs had zero failures,
cancellations and skips. Source counts remain 340/352/351; installed pins did not
change. This is native no-tool/local-provider contract proof, not model semantic
quality, physical power-loss validation or a rebuilt Companion.

#### Next implementation frontier: plan-progress reads

Current DSH checkpoint observations and summaries expose a plan digest, not the
declared plan's obligation counts, active slice or open decisions. The existing
Codex thread projection already derives those bounded fields from verified typed
plan contexts; DSH must not substitute model/terminal counts for plan progress.
The next slice must join the retained same-thread plan/checkpoint in the owning
runtime, expose a bounded content-free projection, carry it through the journal,
observation client, native bridge and Threads view, and test legacy/missing,
unavailable/stale, advancement, replacement and restart cases. Declared completed
statuses must remain distinct from independently verified product completion;
there is no percentage inferred from successful turns, no hidden reasoning text
and no new model/tool call on a read.

#### Open questions and remaining parent scope

Plan-progress read semantics and configured bounded semantic fallback remain P3
work. Cross-harness ownership, trusted human correction and complete F1-to-Evolution
episode provenance, every seven-panel UI/OS/lifecycle/resource requirement and
security-last qualification remain open. Wider resource stress remains necessary;
this test is not an all-input size guarantee. No installation, live profile,
external provider, package build, release, deployment or current-chat handover
occurred. The full parent goal remains active.

After the exact two edited plan-source digests and parent digest were synchronized
in the unactivated candidate, four full-plan advancement/replacement/batch/fault
checks passed in 14.364 seconds. The independent unreplaced Research-resume
reproduction still fits at 32,756 bytes. All native/graph handles are terminal;
the exact fixture-process check found no surviving tested Host.

### Checkpointed admitted-plan progress read path: 2026-10-07

Selected preparations now derive a closed ten-field content-free progress
projection from the verified typed plan context. The counts cover all obligation
statuses and open decisions; the active slice is an ordinal/status, not a private
ID. Preparation validation independently recomputes the projection from the
exact model-context plan, refusing tampered counts before admission. Model-context
bytes and objective binding material are unchanged. The metadata follows the
fsync checkpoint into retained preparation observation v3, public summary v3,
the shared observation client validator, Rust native bridge and Threads source.
The display explicitly calls these checkpointed declarations, not independently
verified product completion. Legacy v1/v2 remain readable without fabricated
counts. Counts are not inferred from model requests or terminal events.

Source snapshot 62 verification: 27 preparation checks passed in 26.485 seconds;
141 combined dashboard/observer/observation-store checks passed in 4.398 seconds;
native full-30 three-objective Research replacement passed in 95.645 seconds;
native public-observer replacement/lost-ACK/fresh-Host proof passed in 68.516
seconds; seven graph checks passed in 112.273 seconds. Every run had zero failures,
cancellations or skips. The existing desktop toolchain overlay compiled the native
bridge; all 12 Rust tests passed. A first plain-toolchain attempt lacked GTK
pkg-config setup; no package/compiler was installed to repair it. Source counts
remain 340/352/351 and installed-package pins are unchanged.

#### Open questions and next frontier

This projection describes the latest retained successful preparation, not the
latest plan head. Interpreted-but-unadmitted observations remain digest-only;
plan selection without a resolved interpretation has no interpretation record.
Those cases require an explicit owning-runtime read projection and cannot be
filled from old preparation counts. Full P3 plan-progress semantics remain open.
The approved Windows visual check could not start because Computer Use rejected
the WSL filesystem URI during initialization. No GUI launched in that attempt;
fresh packaged Windows/Linux rendering remains unverified. No installer, live
selection, external provider, release, deployment or current-chat handover changed.
Semantic fallback, cross-harness ownership, trusted F1/Evolution provenance, all
seven UI panels and OS/lifecycle/resource/security-last work remain in scope.

### Checkpointed unadmitted-plan counts: 2026-10-07

The owning preparation runtime now derives plan counts immediately after a
resolved interpretation is durably sealed, before later source/preflight/admission
checks. The private journal accepts the optional closed projection only alongside
non-null plan and requirement-continuity digests. Public interpretation summary v2
passes the same bounded projection through the observation client, Rust bridge
and Threads view. v1 remains readable without invented counts. The display says
these are declarations at the interpretation checkpoint, not independently
verified completion or current source state. A later matching admission still
removes the separate interpretation summary; an older admission cannot hide it.

New negative tests refuse null plan/continuity references, malformed counters,
extra prompt fields and schema downgrade with retained counts. A private journal
test verifies exact-binding enforcement and count preservation through compaction
and reopen without creating a request. Source-drift testing confirms the counts
survive only as checkpoint-time evidence. The response-budget fixture now covers
both progress-bearing preparation and interpretation on 16 Agents, omitting whole
rows while preserving the total count under the existing 16-KiB response ceiling.

The full-30 native Host race variant holds preparation, changes the default,
then releases it. The authenticated prompt loses admission; the actual public
observer still carries all 30 obligations, the exact open-decision count and the
declared-completed count. Native user-message and model-request counts remain zero.
This local native/public-client proof passed in 43.055 seconds. The combined
preparation/dashboard/journal/observer suite passed 169 checks in 34.959 seconds;
all 12 native Rust tests passed. Source snapshot 63 graph verification passed seven
checks in 81.694 seconds; snapshot 64 changes only the additional native test pin
and passed the same seven graph checks in 91.552 seconds. Installed-package pins
and source counts are unchanged.

#### Open questions and implementation frontier

No new model/tool call is triggered by these reads, but they still read retained
observations rather than the latest owning-runtime plan head. An unresolved first
prompt can retain a sealed plan with neither interpretation nor admission. The
next implementation must add an exact-binding read in `web-owned-preparation.mjs`,
carry it through the private gateway process/worker and Host observer, and project
the last same-thread plan event only after matching it to a retained checkpoint's
epoch. `getLatestReasoningPlanContext` alone returns a tail event, not durable-read
proof. Reads must not create a synthetic prompt, append an objective or advance a
selection. Current source re-verification and checkpoint-time plan evidence need
separate postures; missing/faulted/drifted reads cannot fall back to older admitted
counts as if they were current. Binding renewal/release, startup advancement,
replacement, restart and unresolved-first-prompt cases remain required tests.

Fresh Windows/Linux packages and visual qualification remain unverified, as do
semantic fallback, cross-harness ownership, F1/Evolution provenance and the full
seven-panel OS/lifecycle/resource/security-last scope. No GUI launch, installer,
live profile, external provider, release, deployment or current-chat handover
occurred in this slice. The entire parent goal remains active.

After synchronizing only the two edited plan-source digests and parent digest in
the unactivated selection candidate, four focused replacement/batch/source-drift
regressions passed in 5.246 seconds. The independent private continuation probe
still retains three original contexts and all 30 obligations at 32,756 bytes;
this is a unit witness, not fresh native model evidence. Every test/probe handle
is terminal, and the exact native-fixture process query found no surviving Host.

### Latest owning-plan read and verification accuracy: 2026-10-07

The active Host binding now reads the latest private plan head through the gateway
worker/process and matches it to its retained checkpoint. The Host observer,
shared observation validator, native bridge and Threads view carry that closed
projection. An unresolved first prompt can display the selected plan without an
interpretation or admission. An unsealed latest head is rejected rather than
replaced by older admitted counts. These reads do not append objectives, advance
selection, admit a prompt or claim model execution or product completion.

Source snapshot 67 replaces the misleading `drifted-at-read` posture with
`unverified-at-read`: missing, unreadable and changed sources all mean that current
verification failed, not that a particular kind of drift was proven. The UI keeps
the counts explicitly checkpoint-time evidence. The preparation runtime reuses
the selection loader's source verification when the checkpoint has identical
source references, and separately verifies differing predecessor references.
Missing-source and changed-source regressions preserve the private ledger and
checkpoint. The three graph manifests have matching updated source pins; package
pins and graph membership are unchanged. Only the two parent-document digests and
parent digest were refreshed in the unactivated plan-selection candidate.

Current local verification: 99 preparation/dashboard checks, 13 Rust bridge
checks, six plan-selection checks, 35 graph/observer checks and both full-plan
native Host race checks passed with no failures, cancellations or skips. The two
native race cases deny admission after settings-default or unresolved-first
changes while retaining the full selected-plan projection. This is local source
and native-fixture evidence, not fresh packaged Windows visual qualification.

After the parent-source digest refresh, four focused full-candidate composition,
three-objective replacement/restart and source-drift regressions passed in
17.945 seconds with no failures, cancellations or skips.

#### Open questions and remaining parent scope

The authorized Windows GUI smoke could not initialize: Computer Use rejected
the WSL `sandboxCwd` URI before any app launch. No new GUI pass is claimed; no
installer, deployment, live selection or current-chat handover occurred. Windows
build staging also remains constrained by low D: free space. Fresh visual and
package qualification, semantic fallback, cross-harness ownership, trusted
F1/Evolution attribution, the whole seven-panel UI, and OS/lifecycle/resource work
remain open. Security remains last as requested. This completes a bounded slice,
not the parent integration/UI plan.
