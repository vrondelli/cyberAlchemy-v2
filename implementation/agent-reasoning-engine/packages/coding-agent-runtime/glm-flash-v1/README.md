# GLM-5.3-Flash coding-agent prototype

Current finish tracker: [GLM completion plan](../../../GLM-FINISH-PLAN.md). It consolidates milestones, acceptance criteria and open questions; the experiments below remain historical evidence.

## Resume checkpoint — 2026-09-06

The seven original files were saved in parent `domainspec-core` commit
`8c002e60f9bdfe8dc0f7e592fd60797064bde640`. This extracted checkout currently
has no commits. The source construction record is [CONSTRUCTION.json](CONSTRUCTION.json);
its P0 frontier is historical and does not describe the implemented files below.

The bounded implementation exists:

- [transport.mjs](transport.mjs): exact model selection, tokenizer reservation,
  native tool messages, usage checks, request limits, no automatic retries.
- [agent.mjs](agent.mjs): allowlisted inspection, checkpoint/resume, whole-exchange
  context recycling, and a patch proposal without repository mutation.
- [tools.mjs](tools.mjs): tool schemas, complete-batch argument validation, and
  duplicate-call rejection.
- [cli.mjs](cli.mjs): strict configuration and an opaque SOPS credential reference.
- [canary.mjs](canary.mjs): isolated queue implementation task and independent
  seven-test patch verification in a disposable copy.

## Current validation

The first live canary in this environment passed on **2026-09-07** after the
owner stored `model/zai-key`. ARE resolved the credential without displaying
material, then GLM-5.3-Flash produced a patch that passed all seven independent
queue tests in the disposable verification copy. The original fixture remained
unchanged. There were two model requests and two tokenizer requests, using 3080
input and 426 output tokens; summed model-request latency was 13.766 seconds.
No context recycling occurred. See the [redacted live receipt](evidence/live-canary-2026-09-07.json).
This establishes the bounded API/bridge/tool/patch path, not long-task quality,
routine activation, or provider billing attribution.

The **forced-recycling live canary failed to complete** on 2026-09-07. It read
both example files, recycled ten times, and accessed archived evidence after
recycling, but repeated inspection until the 12-model-request cap stopped it
with `glm.model-request-limit`. It produced no candidate, so queue verification
did not run. The original fixture remained unchanged. Usage was 23986 input and
1205 output tokens across 12 model and 22 tokenizer requests; summed model
latency was 78.417 seconds. See the [failed-run receipt and tool sequence](evidence/recycling-canary-2026-09-07.json).

This is evidence of a completion failure under the fixed 5000-token threshold,
not evidence that recycling is useful yet. Potential contributors require
separate tests: the failed version of `agent.mjs` projected only the latest four exchanges as progress,
the CLI's initial completed/pending state is not updated as inspection advances,
and the scenario's generation-dependent evidence instruction may encourage a
new evidence read after each recycle. Repeated reads can push earlier completed
inspections out of the four-exchange summary. No automatic live retry was made.

### Offline continuity repair — 2026-09-07

`agent.mjs` now derives `inspection_progress` from the existing verified
checkpoint history on every request, including after resume. Successful selected
file reads are deduplicated and bound to the immutable fixture's file hashes;
failed, changed-content, and out-of-scope reads do not earn completion entries.
The projection contains path, file digest, call ID, and step, never copied file
contents. It records successful archived-evidence retrieval after a recycle.
The existing 24-tool-call cap bounds its size, and normal tokenizer/request
budget checks still apply. There is no second mutable state store or claim that
reading a file proves understanding or objective completion.

Separately, the canary prompt now requires archived-evidence retrieval once per
run after recycling; a later generation does not reset that requirement.

A deterministic offline policy reproduces the four-entry forgetting mechanism:
with five files to inspect, the legacy recent-only view loops until 12 requests.
The treatment reads each file once, pauses after five reads, resumes with a fresh
client, retrieves evidence, and produces a proposal in seven requests. The test
failed before the runtime change and now passes. This is a controlled mechanism
test, not a replay of GLM reasoning or proof the next live run will complete.
The separate canary-prompt change is not needed for that regression to pass.
See the [offline repair evidence](evidence/inspection-progress-2026-09-07.json).

The runtime source binding changes, so old checkpoint epochs remain historical;
use a fresh run for successor live validation. The earlier live failure is
preserved unchanged. No paid calls were made during this repair.

### Successor live validation — 2026-09-07

The repaired scenario **passed on the twelfth and final allowed model request**.
It performed eleven recycles, read both example files, retrieved archived
evidence after recycling, and produced a patch passing all seven queue checks.
The original fixture remained unchanged. The model, scopes, context threshold,
and request/output budgets matched the failed baseline; the runtime projection
and canary instruction both changed. See the
[successor live receipt](evidence/recycling-canary-repaired-2026-09-07.json).

Usage was 29204 input and 1548 output tokens across 12 model and 23 tokenizer
requests; summed model-request latency was 86.008 seconds. Completion improved
in this single observation, but repeated inspection persisted and token usage
increased. This does not establish efficiency, repeatability, or separate causal
credit for the runtime and prompt changes. No additional live run was started.

On 2026-09-07, all **33 GLM tests passed**, with no failures or skips, using Linux
x64 Node **26.8.1**:

```bash
node --test implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/test.mjs
```

These are offline tests with loopback mock HTTP servers and temporary fixtures.
They cover proposal-only behavior, native tool exchanges, safe resume, forced
recycling, malformed responses, token overruns, billing errors, timeouts,
redirects, credential redaction, checkpoint corruption, writer locks, and
positive/negative sandboxed verification. No live credential was resolved and
no provider model call was made in this review. No prior live-canary receipt was
located in this package or the current temporary canary directories.

The portability update adds validation of optional bridge paths, a synthetic
interpreter test through the real process bridge and loopback model transport,
and a missing-interpreter test that blocks before HTTP dispatch. Synthetic
credential material remains absent from results and checkpoints.

The parent [package.json](../package.json) now includes this suite in `npm test`
and exposes `npm run test:glm` for the focused run. After restoring pinned tools
and configuring the two SOPS integration tests for this extracted layout, the
combined package run reports **137 passed out of 137**, with no failures or
skips. The real SOPS tests create isolated synthetic vaults and exercise actual
encryption, decryption, process-bridge consumption, and redacted results; they
do not read the live vault.

From the coding-agent-runtime package directory, the validated environment is:

```bash
PATH=/home/vrondelli/.local/bin:$PATH \
ARE_SECRET_PYTHON=/usr/bin/python3 \
ARE_SECRET_PROJECT=/home/vrondelli/projects/domainspec-core/projects/secret-management \
npm test
```

`ARE_SECRET_PYTHON` and `ARE_SECRET_PROJECT` configure only the integration tests.
Runtime CLI/canary deployment still uses explicit credential configuration.
Omitting the test overrides preserves their previous defaults.

The two canary tests reject invalid credential configuration before client
creation and exercise the complete canary through a synthetic bridge and loopback
provider, including seven passing queue checks and an unchanged original fixture.
This is offline wiring evidence, not a live-provider success receipt.

## Configured CLI

The credential object now accepts optional `python_command`, `project_root`,
`key_file`, and `vault_file` strings, matching the existing SOPS provider options.
Omitting them retains that provider's defaults. Supplied values must be nonempty
strings without NUL bytes; nulls, embedded credentials, and unknown fields are
rejected before client creation. Use absolute paths for an unambiguous deployment.
`project_root` must contain the `secret_management` Python package, and
`python_command` must identify its compatible interpreter. These settings do not
install Python, SOPS, age, or credentials.

Optional `model_timeout_ms` admits30000..60000 milliseconds for ordinary model requests; omission preserves30000ms. Tokenizer requests retain their separate30000ms limit, and the existing overall run deadline still applies. The client binds the setting into its identity and records the selected deadline on each receipt. Final requests use the completion policy's final deadline when present. See the [small-window deadline candidate](../../../benchmarks/glm-episodes-v1/evidence/model-deadline-qualification-2026-09-08/PLAN.md).

Optional `maximum_model_retries` is0..2, default0. The explicit recovery adapter may retry a recognized transient model transport failure once with identical request bytes; its total retry allowance is shared across the run. Every physical attempt remains in receipts and billing totals remain unknown when a timed-out attempt has no usage. Logical turns retain their original limit. Tokenizer and correction drivers keep their no-retry contracts. Crash/pending ledgers never resume blindly. See the [recovery qualification plan](../../../benchmarks/glm-episodes-v1/evidence/transient-recovery-qualification-2026-09-08/PLAN.md).

Example configuration (replace the deployment and fixture paths):

```json
{
  "schema_version": "are.glm-flash-config/v1",
  "model": "glm-5.3-flash",
  "credential": {
    "provider_kind": "local-sops-age",
    "provider_id": "local-model-secrets",
    "locator": "model/zai-key",
    "python_command": "/absolute/path/to/python3",
    "project_root": "/absolute/path/to/secret-management",
    "key_file": "/absolute/path/to/keys.txt",
    "vault_file": "/absolute/path/to/secrets.yaml"
  },
  "run_id": "glm-proposal-001",
  "request": "Inspect the source and propose the requested repair.",
  "fixture_root": "/absolute/path/to/fixture",
  "state_directory": "/absolute/path/to/run-state",
  "observation_allowlist": ["README.md", "src/example.mjs"],
  "mutation_allowlist": ["src/example.mjs"],
  "context_limit": 16384,
  "recycle_at": 12000,
  "safety_margin": 1024
}
```

After configuring live access, the command below makes bounded provider calls
and writes a proposal result. It does not apply the patch or run its verification:

```bash
node implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli.mjs /absolute/path/to/config.json /absolute/path/to/new-result.json
```

The result path must not already exist. The CLI reserves it with mode `0600`
before provider calls. Exit status is zero only for `AWAITING_APPROVAL`; inspect
the result's status and reason codes for blocked runs. Keep the state directory
outside the fixture. Resume uses the same run configuration and checkpoint with
a new output destination; ambiguous or terminal checkpoints are not blindly retried.

## Live canary command

Save only the `credential` object from the configuration example above in a JSON
file, with actual deployment paths and the same `model/zai-key` reference. Then,
from the coding-agent-runtime package directory:

```bash
npm run canary:glm -- --credential /absolute/path/to/credential.json
```

This makes live provider calls and applies the resulting patch only in a
disposable verification copy. The canary keeps its fixed model, queue task,
allowlists, and budgets; the credential file cannot override them or embed secret
material. Without `--credential`, the original provider defaults remain in use.
Invalid credential fields are rejected before a fixture or config file is written.

The command reports its temporary run directory and writes private `config.json`,
`agent-result.json`, and `receipt.json` files there. Exit status is zero only for
`PASS_BOUNDED`. Keep that receipt for review; the configured CLI's proposal alone
does not establish canary success.

### Forced recycling scenario

```bash
npm run canary:glm:recycling -- --credential /home/vrondelli/.config/are/glm-flash-credential.json
```

This scenario adds two files containing 56 FIFO, duplicate-ID, and ID-reuse
acceptance examples to the same queue task. It fixes `recycle_at` at 5000
projected tokens (including output reservation), keeping the 16384 context limit,
12 model-request cap, and 2048 output-token cap. Each example file fits the
existing read-only tool result limit. Token counts come from the provider
tokenizer; no simulated inflation is used in the live run.

`PASS_BOUNDED` requires successful reads of both example files, at least one
recycle, a dispatch in a later generation, successful `read-context-evidence`
access in that generation, seven passing queue tests, and an unchanged original
fixture. This is a controlled context-pressure test. It does not prove that a
model correctly interpreted every archived detail, or establish quality or cost
improvement on arbitrary long coding tasks.

## Next work

Product frontier: the basic canary and one repaired forced-recycling live run
pass. The latter consumed the entire request budget and still repeated reads.
Preserve the original failure and the successor success separately; efficiency
and repeatability remain unproven. Remaining work:

Normal package test integration, CLI documentation, and explicit secret-bridge
options in both CLI and canary are implemented and tested.

1. Inspect how much prompt space is consumed by instructions, progress metadata,
   and retained observations. Test a smaller progress projection or selective
   retention offline before selecting any further live experiment. Keep budgets
   fixed and measure repeated reads as well as completion.
2. Check provider request settings before freezing any broader task profile. The
   [official model guide](https://docs.z.ai/guides/llm/glm-5.3-flash.md), inspected
   on 2026-09-06, recommends `reasoning_effort: max`; this prototype uses `low`
   and caps output at 2048 tokens. Preserve explicit budgets and measure the
   tradeoff; do not silently raise the canary's limits.

Operational prerequisites for the live canary, owned by the runtime/environment
owner:

- Node 26.8.1 is installed under
  `/home/vrondelli/.local/share/are-runtimes/node-v26.8.1-linux-x64`, with
  `node`, `npm`, and `npx` launchers under `/home/vrondelli/.local/bin`.
  The official download was verified against its published SHA-256 checksum.
  Prefix PATH as shown above if the shell does not include that bin directory.
- When overrides are omitted, the provider's derived bridge root resolves to
  `/home/vrondelli/projects/projects/secret-management`, which does not exist.
  The source bridge is at
  `/home/vrondelli/projects/domainspec-core/projects/secret-management`.
- The provider defaults to `/usr/bin/python3.12`, absent in this environment.
  Set `python_command` to `/usr/bin/python3` (Python 3.14.4); it meets the secret
  package's `>=3.12` requirement and passed both real SOPS integration tests.
- SOPS 3.13.3, age 1.3.1, and age-keygen are installed under
  `/home/vrondelli/.local/bin`. Downloaded archives and all three executables
  were checked against the existing secret package's pinned SHA-256 values.
- On 2026-09-07, the owner requested fresh setup from `../domainspec-core`.
  Its `projects/secret-management` package now backs the installed
  `/home/vrondelli/.local/bin/secret-store` launcher. No existing identity/vault
  was located in the sibling checkout; a new age identity and empty encrypted
  vault were initialized at the default paths above. `doctor` reports `ready`,
  zero records, and `0600` key/vault permissions. External recovery backup is
  not verified.
- The validated reference-only configuration is
  `/home/vrondelli/.config/are/glm-flash-credential.json` (mode `0600`). It selects
  the sibling secret-management project and `/usr/bin/python3` explicitly.
  The owner entered the API key on 2026-09-07 and the bridge/live canary passed.
  For a future fresh store, the hidden-entry command is:

  ```bash
  /home/vrondelli/.local/bin/secret-store put model/zai-key --purpose model-provider
  ```

  This prompts twice with input hidden. Do not paste the key into chat or put it
  in the JSON configuration. The successful canary proves current API access;
  it does not establish which billing bundle was charged.

The basic live canary, original recycling failure, and repaired recycling success
have separate saved receipts. Validate the next efficiency candidate offline
before selecting a further live experiment. Routine activation and publication
remain separately scoped operational work; offline tests do not establish them.

## Optional recent-observation retention prototype

Set `"retention_policy": "recent-observations-v1"` in the existing JSON runner
configuration, or pass that field to `runGlmAgent`. Omit it or select `clear-v1`
for the existing comparison policy. This is an opt-in construction candidate;
it has not been evaluated with live GLM calls or approved for activation.

The projection keeps the newest two complete exchanges intact and replaces
older tool-result bodies with explicit archive references and content hashes.
Assistant tool calls, result IDs, and returned protocol reasoning are preserved.
The journal retains original observations, including bodies absent from the
active prompt. Verified progress and the existing system prompt are unchanged.

Two exchanges is a preference, not a context guarantee. If the fully rendered
request reaches the soft recycling threshold, the recycler starts a new
generation and measures, in order, the newest two exchanges, newest one, and
empty history. It dispatches only the first complete request strictly below
the threshold with output reserved. Mandatory task state is never removed.
Every candidate includes instructions, tools, state, progress, and the provider
token margin; threshold equality is refused. The shared recycler's optional
`render_candidates` hook accepts at most three candidates and does not change
the default caller behavior.

Additional measurements consume the existing tokenizer-call allowance; its
24-call ceiling is not increased. Unknown measurements, transport byte-limit
violations, oversized individual tool results, or an oversized minimum request
still block. In particular, a request exceeding the transport byte limit blocks
before token-based recovery; this prototype does not silently salvage it.

The selected policy and its source are bound into checkpoint identity. Resume
with a different policy or changed implementation fails before model access.
Selection is reconstructed from verified history rather than a second mutable
store. Existing checkpoints from before this source change are intentionally
incompatible. Use separate state directories for paired experimental arms.

Offline tests cover masking and multi-call pairing, boundaries below/at/above
the admission threshold, candidate exhaustion, unknown measurements, shrinking
recent evidence, repeated recycling/resume, and policy drift. A scripted
continuation fixture needs 12 reads and blocks under clearing, versus one read
and a proposal under retention. This is a synthetic mechanism test, not a GLM
accuracy, latency, token-cost, or provider-compaction result. The next product
frontier is paired evaluation using the repository benchmark; endpoint/spend
ownership and later activation remain separate operational tasks.

The [offline receipt](evidence/retention-offline-2026-09-07.json) pins tested
source hashes and records 148 passing coding-runtime tests, including the
shared recycler and HTTP transport regression suites.

## Paired recycling canary

Verifier limitation found during the next episode benchmark: this legacy
canary executes candidate code in the test process and trusts its TAP output.
A candidate can forge pass lines and exit early. Earlier receipts describe
observed outputs, but this mechanism is not a robust oracle for untrusted
candidate code. New episode evaluations use an independent parent oracle and
restricted candidate subprocesses; do not use this legacy verifier as evidence
that adversarial or arbitrary candidates satisfy the tests.

After reviewing the exact candidate and selecting a live pilot, invoke:

```bash
node implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/paired-canary.mjs \
  --credential /home/vrondelli/.config/are/glm-flash-credential.json \
  --output-directory /tmp/are-glm-retention-pair-UNIQUE
```

The output directory must not already exist. This command makes paid calls:
one `clear-v1` arm, then one `recent-observations-v1` arm, without automatic
retries. Both use byte-identical queue-recycling fixtures and task requests,
the 5,000-token soft threshold, 16,384 hard limit, and 2,048 output reservation.
Run IDs, state paths, and the retention policy distinguish the two executions.

Before either arm, the runner writes and fsyncs a manifest containing runtime
and secret-bridge source hashes, task/fixture identities, and fixed aggregate
ceilings: 24 model calls, 48 tokenizer calls, and 1,200,000 milliseconds. It
checks source identity before and after each arm. Started/completed records
and the final pair result remain separate, exclusively created files. Each
arm also keeps the normal private canary configuration, journal, and receipt.
Receipts include all dispatch headroom values, policy, fixture/request hashes,
and attempted/successful file-read counts.

Each provider client receives the same 580,000-millisecond deadline, reserving
20 seconds for bounded verification and evidence writes. No further arm starts
when the required call or time allowance is unavailable; an observed overrun
stops the pair. This is in-process admission and cancellation, not a hard OS
process-kill guarantee for stalled synchronous filesystem operations.

Ordinary task and explicitly classified budget failures remain comparable
results and permit the treatment arm. Transport, credential, unknown-outcome,
source-drift, and accounting failures stop the pair. An exception without a
completed arm receipt marks aggregate accounting incomplete rather than
claiming the missing work cost zero. `COMPLETED` means both arms ran, not that
both passed or retention improved. One paired run is a smoke comparison only.

The isolated paired-runner tests use injected callbacks and make no paid
calls; the existing canary test verifies real local transport configuration,
policy propagation, hashes, and headroom accounting.

## Retention v2 and context headroom

`recent-observations-v2` keeps one recent complete exchange and masks older
result bodies. When the initial complete request exceeds the soft threshold,
it measures only an empty-history fallback. This limits measurement attempts
to two per turn without raising the run's 24-tokenizer-call ceiling. V1 and
the default `clear-v1` remain available. Source and policy changes intentionally
invalidate old checkpoints; resume accounting is retained in the durable
transport ledger.

Use the optional paired flags to compare v2 under either supported threshold:

```bash
node implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/paired-canary.mjs \
  --credential /home/vrondelli/.config/are/glm-flash-credential.json \
  --output-directory /tmp/are-glm-v2-pair-UNIQUE \
  --treatment recent-observations-v2 --recycle-at 8000
```

The threshold may be 5,000 or 8,000; the hard window stays 16,384 and output
reservation stays 2,048. Both arms use the selected threshold. The command
makes paid calls under the same fixed aggregate pair limits described above.
A correct patch without a recycle is recorded separately from satisfying the
forced-recycling canary. Trace IDs differ even though task/fixture hashes match.
See the [experiment plan](evidence/RETENTION-V2-PLAN.md).

## Candidate bounded read delivery

The optional config field `delivery_policy: "bounded-reads-v1"` executes at most
one `read-file`, `read-context-evidence`, or `read-inspection-evidence` in each
validated model tool batch. Search/list tools retain their existing behavior and
complete-request admission still applies. Additional reads receive explicit
deferred results, retaining native call/result pairing and consuming the same
24-call allowance. Default delivery is `legacy-v1`; retention policy selection
is independent. Entire batches are validated before any tool executes.

The candidate records exact observation bodies in the selected dispatched
prompt, separate from successful tool execution. Completed provider responses
confirm transport-level delivery only, not model understanding. Dispatched
requests with uncertain outcomes report delivery as unknown. During overflow it attempts
the newest complete exchange; strict measurement still applies, with at most
two tokenizer requests per model turn. If that exchange cannot fit, the run
blocks and reports undelivered evidence rather than silently discarding it.

`read-inspection-evidence` retrieves a bounded archived source slice using the
original successful read call ID. It verifies run ownership, archive integrity,
source hash and native result pairing. It accepts no model-selected filesystem
path or archive digest. Full journal observations remain immutable. Delivery
of a slice does not mark the original whole file as delivered. See the
[construction and trial plan](evidence/BOUNDED-DELIVERY-PLAN.md).

## Opt-in completion guidance

Set `completion_policy: "budget-aware-v1"` with `delivery_policy: "bounded-reads-v1"`.
Omission keeps completion guidance off. The pure projection derives remaining
model/tool allowances and merged UTF-16 archive ranges from the existing
source-bound history, exact original file bytes and request ledger. It creates
no mutable state store and remains bound across resume.

The model sees inspect, synthesize (three/two responses left), finalize (one),
and exhausted phases. The upcoming response is included in the remaining count.
Guidance reserves a final patch response when evidence supports one; it cannot
force success, relax candidate validation or add calls. Ignoring guidance still
hits the same limits.

Cumulative `files_seen_or_present` combines previously confirmed delivery with
exact native tool bodies in the current rendered request. It does not claim
previously seen bytes remain in the window. Current presence is never persisted
as confirmed delivery until the selected request returns successfully. Full-file
coverage, archived ranges, gaps and EOF remain distinct. This policy replaces
verbose duplicate progress arrays in the prompt while preserving complete
checkpoint history and output delivery metrics.

See the [construction DAG](evidence/COMPLETION-CONTROL-PLAN.md).

## Opt-in exact mutation-source preservation

`source_policy: "inspected-mutation-v1"` requires bounded-reads-v1 delivery.
Omission keeps source preservation off. Only already-successful reads of files
in both observation and mutation scopes qualify. Native call/result pairing and
exact snapshot hashes are checked before inclusion. Duplicate aliases collapse
to one file, ordered by path.

Complete source files are projected within a 4,096-byte serialized JSON limit,
including escaped Unicode, metadata and omission counts. Oversized files are
omitted whole; no generated summary or truncated code is substituted. The
payload appears as labelled untrusted user-role data, never as instructions.
It is present across recycling while still subject to full-request token limits.
No additional filesystem reads or permissions are introduced.

`source_pin_refs` records source references separately from native tool-result
delivery after a successful model response. `last_confirmed_source_pins` restores
those historical references on resume, including if the resumed request fails.
These references do not prove model understanding or authorize applying a patch.
Under this policy, archive recovery uses only `read-inspection-evidence` with
validated read-call IDs; raw digest recovery is not offered. See the
[plan](evidence/SOURCE-PRESERVATION-PLAN.md) and
[pilot results](../../../benchmarks/glm-episodes-v1/evidence/source-preservation-2026-09-07/README.md).
The pilot failed; subsequent prompt and recovery fixes have only local validation.

## Budget-aware inspection guidance

The opt-in budget-aware-v1 policy now reports a reading budget, a three-response
synthesis reserve, and a suggested typed archive read when recovery has not been
seen after recycling. Suggestions use verified nonempty source reads and vanish
when no reading budget remains. These are advisory; delivery and task success
are still checked independently. See the [construction plan](evidence/INSPECTION-GUIDANCE-PLAN.md).
This version has local validation only; full-request live fit remains unmeasured.

## Completion prompt overhead

The opt-in completion instructions now use 743 fewer UTF-8 bytes. Exact evidence
bodies and request limits are unchanged. Local tests preserve both previously
observed strict-admission failures; provider token savings remain unmeasured.
See the [plan and validation](evidence/PROMPT-OVERHEAD-PLAN.md).

## Opt-in execution completion control

`completion_policy: "bounded-execution-v2"` requires bounded-reads-v1. It defers
repeated confirmed whole-file reads with a typed archive hint and offers no tools
on the final model request. Deferred calls still consume budget; unsupported
final text remains invalid. Resume and reports bind the policy explicitly.
See the [plan](evidence/EXECUTION-CONTROL-PLAN.md). Live behavior remains unverified.

## Explicit finalization candidate

`completion_policy: "explicit-finalization-v3"` inherits v2 repeat-read handling
and switches to a dedicated, tool-free patch request with three calls remaining.
It makes one attempt, preserves normal validation, and does not retry invalid
answers. Use bounded-reads-v1; source preservation remains separately opt-in.
See the [plan](evidence/EXPLICIT-FINALIZATION-PLAN.md) and
[working live tests](../../../benchmarks/glm-episodes-v1/evidence/working-loop-2026-09-07/README.md).
Both policies passed repair and continuity on both controlled tasks; repeatability
and broader context-window coverage remain unmeasured.

## V3 evidence preservation and live validation

V3 references exact duplicate task text instead of repeating it in prompt state.
After all allowlisted reads and recycling, it supplies a concrete recovery hint.
It also retains exact inspected JSON `/requirements` arrays as untrusted user data
under a separate 2048-byte serialized envelope; oversized fields are omitted whole.
No new reads, oracle input or delivery credit is introduced. These projections
remain subject to full-request admission. The [complete iteration record](../../../benchmarks/glm-episodes-v1/evidence/working-loop-2026-09-07/README.md)
includes 340 passing local tests, both final passing pairs and all earlier failures.

## Open Questions

- The runner now preserves bounded visible final text in
  `final_response_evidence`, including rejected candidates, for format diagnosis.
  `last_model_response_evidence` also records the visible tool-call envelope
  before validation/execution, so rejected calls remain diagnosable. Both fields
  are bounded to 16,384 UTF-8 bytes with original digest and truncation metadata.
  Capture does not validate or apply a candidate; provider reasoning is excluded
  from these evidence fields. Which recurring output patterns explain failures?

- Does measured GLM task success or total cost improve with this policy, given
  its extra tokenizer calls and retained action/reasoning text?
- Should a later candidate handle byte-limit overflow before the existing
  transport boundary, without weakening fail-closed behavior?

- Did the original environment retain a live receipt outside the committed tree?
- Has the owner secured an external backup of the new age identity?
- Does the funded bundle support both configured chat and tokenizer endpoints?
- Which reasoning effort and output budget are sufficient for the bounded task?
- What measurable benefit does recycling provide on a longer coding task?
- How should an owner recover a stale writer lock after hard process death?

These questions complement the unresolved items in
[CONSTRUCTION.json](CONSTRUCTION.json); neither document grants activation or
product approval.


## Opt-in patch-contract guidance

`completion_policy: "patch-contract-v4"` inherits explicit-finalization-v3 and
adds a final-answer contract reminder after all allowlisted files have executed
reads, or at the existing forced final boundary. It keeps tools available before
that boundary and explicitly preserves required archive recovery. The reminder
lists the allowed fields and placement of rationale; it never edits a candidate.
The default remains `none`, and existing policy prompt behavior is unchanged.

Invalid final candidates retain `glm.candidate-invalid` and now also include
`candidate_validation.reason_codes` from the strict parser. The checked episode
report exposes these diagnostics. Rejection does not retry or apply a patch.

The [construction plan](../../../benchmarks/glm-episodes-v1/evidence/patch-contract-2026-09-07/PLAN.md)
owns the live validation and open questions.


## Compact contract candidate

`completion_policy: "compact-contract-v5"` keeps v4 contract guidance while
shortening the final reminder and two repeated completion explanations. All
other v3/v4 behavior, parser rules, delivery accounting and defaults remain
unchanged. The [adaptive loop](../../../benchmarks/glm-episodes-v1/evidence/contract-loop-2026-09-07/README.md)
owns results, admission headroom and open questions.


## Reserved soft headroom candidate

`deduplicated-state-v6` removes duplicate digest fields only from validated
prompt progress views; it preserves the ledger, source attachments, mutation
hashes, read IDs, ranges and delivery flags. `reserved-headroom-v7` inherits
that view and recycles at the configured soft limit minus256. The configured
soft limit, tokenizer margin and output reservation remain distinct values.
Every v7 result records configured/effective thresholds in `admission_policy`;
checked episode reports reject dispatched bounds that violate this reserve.
Existing policy behavior and defaults are unchanged.

The [headroom construction](../../../benchmarks/glm-episodes-v1/evidence/headroom-generalization-2026-09-07/PLAN.md)
owns validation and open questions.


## Verified completion candidate

`verified-completion-v8` requires an explicit `completion_requirements` object:
`required_reads` (a nonempty unique subset of the observation allowlist),
`distinct_turns` and `archive_after_recycle` (booleans). Requirements are bound
into the run scope and cannot change on resume. Patch acceptance requires
confirmed whole-file delivery and the configured recovery conditions. A failed
gate returns `glm.completion-requirements-unmet` with `completion_gate`; it never
retries or rewrites the candidate. No recycle means conditional recovery is not
required, so gate success alone does not prove recycling continuity.

The CLI selects a512-token tokenizer margin for v8. Programmatic clients must
use the same margin. The soft-headroom reservation remains256; output reserve
is unchanged. Existing policies retain their256-token margin and defaults.
The prompt uses compact gate progress while the full ledger remains intact.

The [calibration and rerun plan](../../../benchmarks/glm-episodes-v1/evidence/completion-calibration-2026-09-07/PLAN.md)
owns evidence and open questions.

## Experimental paged completion

Opt-in `paged-completion-v9`, `compact-paging-v10`, and `assembled-paging-v11` retain v8 requirements and token reservations. V9 limits native file pages to 5000 UTF-16 units; v10/v11 use 5500 and a compact next-read hint. Offset arguments are offered only under these policies. Complete delivered text must match the pinned file hash. V11 reconstructs exact inspected requirement fields from complete verified page text. All retain 12 model calls, with one final response reserved.

These are experimental: v11 demonstrated one correct 10K long-workload repair but passed only 1/4 targeted repairs; 8K remains unresolved. Defaults are unchanged. See [results and open questions](../../../benchmarks/glm-episodes-v1/evidence/assembled-paging-2026-09-08/README.md).

## Window and turn budget experiment

Opt-in `budgeted-paging-v12` selects 4000-unit file pages and an explicit 16-model/32-tokenizer cap at 8K, retaining 5500-unit pages and 12/24 caps at larger windows. All token reservations and the 24-tool-call cap remain. Known remaining page turns are checked before dispatch. Separate extended-history adapters preserve pinned original retention/archive files. The fixed 8K sample passed 1/4 repairs: one complete correct repair, two turn-budget blocks and one deadline. Defaults remain unchanged; this is not a pilot-ready policy. [Evidence and open questions](../../../benchmarks/glm-episodes-v1/evidence/budgeted-paging-2026-09-08/README.md).

## Explicit next-page experiment

Opt-in `page-adherence-v13` inherits v12 budgets and adds explicit offset zero plus one exact next-read instruction after current observations. Four fixed 8K long-workload trials produced three correct repairs with full continuity and one final-attempt deadline. All traces had fourteen file reads with no repeated pages or nonzero starting offsets. The strict all-four completion criterion failed; defaults remain unchanged. [Results and open questions](../../../benchmarks/glm-episodes-v1/evidence/page-adherence-2026-09-08/README.md).

## Final deadline experiment

Opt-in `final-latency-v14` inherits v13 and gives tool-free model requests a 60-second deadline, keeping other requests at 30 seconds and each episode at 580 seconds. The deadline is bound to client identity and recorded per receipt. The fixed four-task, three-window screening run passed 8/12 repairs, with 5/5 continuity among recycled trials and zero timeouts. Neither extended-deadline call exceeded 30 seconds, so benefit from the extension is unproven. Two semantic failures and two malformed candidates remain. All 396 local tests passed; defaults are unchanged. [Results and open questions](../../../benchmarks/glm-episodes-v1/evidence/final-latency-2026-09-08/README.md).

## Final synthesis experiment

Opt-in `synthesis-adherence-v15` inherits v14 budgets and adds a last synthesis instruction with exact patch keys/hashes and requirement review. The fixed paired rerun of four prior failures passed 1/4 repairs under v15 versus 3/4 under v14. Three v15 responses omitted schema_version. Both recycled trials passed continuity; 398 local tests passed. This candidate is retained as an unsuccessful experiment and is not selected for activation; defaults remain unchanged. [Results and open questions](../../../benchmarks/glm-episodes-v1/evidence/synthesis-adherence-2026-09-08/README.md).

## Hosted schema-output diagnostic

Three direct endpoint probes found exact copying in text mode, lowercase `json` removal inside source strings in JSON mode, and an accepted but unenforced `json_schema` request. These single probes do not establish a native schema contract. No completion policy or runtime behavior changed. [Reproduction and open questions](../../../benchmarks/glm-episodes-v1/evidence/schema-output-2026-09-08/README.md).

## Native submission protocol probe

Six isolated live calls passed exact native patch submission, including required fields, scope hashes and source bytes; four local protocol tests passed. The submission adapter is not integrated into coding-agent execution or activated. Long-context behavior and repair performance remain untested. [Evidence and open questions](../../../benchmarks/glm-episodes-v1/evidence/native-submission-2026-09-08/README.md).

## Native completion with preserved example evidence

Opt-in `example-fields-v20` integrates native patch submission with strict parsing, delivery/recovery gates, terminal history and exact inspected example explanations. Across ten fixed trials it passed nine repairs; one transport failure before submission remains counted. The four prior-failure cases passed 4/4, and both long 8K retention policies passed their fixed repetition with continuity. All 414 local tests passed. Earlier v16–v19 failures remain preserved; defaults remain unchanged and this is not production reliability evidence. [Results and open questions](../../../benchmarks/glm-episodes-v1/evidence/example-fields-2026-09-08/README.md).
