---
title: CRABS partial-knowledge EVF implementation repair plan
status: planning-candidate
updatedAt: 2026-09-04
scope: bounded evidence-runner repair and product testing
authority_effect: none
---

# CRABS partial-knowledge EVF implementation repair plan

The repair must make EVF distinguish three things reliably: a successful
bounded check, a real problem in CRABS, and an experiment that could not be
evaluated. Today, the receipt validator can accept unsupported success, the
runner can lose genuine failures, and execution has an unconditional blocker.

This plan repairs the evidence mechanism. It keeps the same CRABS subject,
operation histories, 48-case matrix, visible-order oracle, and two CBMC
representatives. It does not weaken an obligation to obtain a passing result.

## 1. Scope, status, and current construction frontier

Target package: this directory, `crabs-partial-knowledge-move-candidate-v1`.
The directory name remains a stable locator; new evidence contracts and the
repaired candidate receive version 2 identities inside it.

Controlling scientific scenario:
[partial-knowledge-move-run-plan.md](../crabs-convergence-repair-candidate-v1/partial-knowledge-move-run-plan.md).
That original document remains unchanged. This repair plan is an additive
engineering specification. Both document hashes must bind the repaired
candidate. Where the engineering details change, the explicit changes in
section 3 take precedence for the new candidate only.

Current state, based on the preceding implementation review and the current
files:

- The implementation exists, including native and sanitizer harnesses, case
  generation, CBMC construction outputs, schemas, and a runner.
- The 12 existing receipt fixtures and compiler preflight passed in the review.
- Both retained CBMC construction outputs report success. These are historical
  construction rehearsals, not a completed live matrix run.
- Additional in-memory review tests accepted empty or contradictory raw
  evidence, wrong provenance, and a cross-run case row. They also reproduced
  rejection of an honest divergence receipt, loss of a CBMC counterexample,
  and unhandled process launch/interruption errors.
- There are zero terminal live-run rows. The reviewed implementation is not
  established as a trustworthy evidence producer.
- Existing `C0`–`C2` completion labels describe the earlier construction attempt;
  they do not close the repairs below or prove the new candidate tested.

The current product-construction frontier is **L0: prove evidence
interpretation with an independent fixture bundle**. It has no missing
Task Session, ontology-runtime, publication, or product-approval prerequisite.
An implementation request can start that work without resolving those
unrelated operational concerns.

This document is a planning candidate under `CA2-ROUTE-PLAN`. The present
request creates the plan; it does not run the repair or the experiment. A later
request to implement this complete plan should cover L0–L4, including the
bounded product tests explicitly described in section 11. If the user instead
selects one layer or excludes a subject run, honor that narrower scope.
Product tests supply evidence for later product approval; neither a test nor a
command-line flag supplies that approval or operational authority.

The repository's construction-order requirement is preserved explicitly:

| Construction stage | Repair-specific artifact or check |
| --- | --- |
| Prototype definitions | This plan's meanings for evidence, subject findings, incomplete checks, and candidate identity; v2 schema prototypes in R00. |
| Agent-facing ontology scaffold | A local `construction-map.json` in the new R00 epoch, linking obligation, candidate, command, observation, validator, and report to exact files and owners. It is navigation data, not registered/admitted ontology or a new canonical definition. |
| Product and business prototypes | The five decision questions and outcome truth table: users can tell whether CRABS failed, checks succeeded within scope, or evidence is missing. |
| DomainSpec intent prototype | The unchanged provider-neutral `obligation.json` and its exact matrix/oracle, mapped to v2 evidence consumers. No new DomainSpec admission is claimed. |
| Compiled-system prototype | The dependency graph, resolved command records, schemas, and source-to-provider bindings. |
| Implementation prototype | The repaired parser, supervisor, lifecycle, and harness code in R01–R08. |
| Exact product candidate and current tests | The final immutable candidate and R09 evidence, followed by independent replay. |
| Product approval and later operational decisions | Separate owner decisions after current test evidence; neither is inferred or requested as an early construction prerequisite. |

The local map must enumerate only these selected artifacts and their direct
bindings. No registered ontology record or ambient ontology epoch is selected
as an admission dependency for this repair.

## 2. Findings and repair traceability

| Finding | Observed defect | Required repaired behavior | Primary layer |
| --- | --- | --- | --- |
| F1: unsupported PASS | Receipt fields are trusted despite empty/contradictory logs, wrong hashes, or cross-run rows. | Reconstruct results from bound raw evidence; compare every declared result and provenance reference. | L0, completed with L1/L3 |
| F2: permanent execution blocker | Construction always adds `task-session-request-schema-not-bound`. | Construction reports actual check results; a scoped native product test selects one exact candidate independently. | L1 |
| F3: lost CBMC counterexample | A failed convergence assertion also fails the complete check, so its target failure becomes not evaluable. | Separate unwind sufficiency, auxiliary checks, target result, and process health. | L0, integrated in L1/L4 |
| F4: incomplete drift detection | Only manifests, not the actual external dependencies, participate in the final snapshot check. | Bind and check the selected source/tool/runtime bytes actually consumed. | L1 |
| F5: honest failure invalidates receipt | Reported divergence is itself added to receipt errors. | An accurate counterexample receipt passes receipt validation and has subject verdict BLOCK. | L0 |
| F6: missing interrupted terminal record | Launch errors and interruption escape before finalization. | Preserve partial evidence, classify unfinished work, and finalize or recover the attempt without rerunning it. | L2 |
| F7: unenforced output ceiling | Output is buffered without a limit and truncated after process completion. | Enforce each stream's byte ceiling while the process runs. | L2 |
| F8: discarded merge observations | Before/after operand snapshots are discarded; only booleans and the final normal form survive. | Retain per-call snapshots, return values, and concrete invariant witnesses. | L3 |

The integration work also closes directly connected gaps: generated header/JSON
equivalence, launch dependencies, complete command binding, exact fixture
inventory, truthful incomplete summaries, immutable construction epochs, and
duplicate-safe terminal recording. These support the eight repairs; they are
not a new general-purpose governance or workflow platform.

## 3. Decisions fixed by this plan

### 3.1 Preserve the experiment

The subject is CRABS commit
`477799721668652988bf98a4a9067d08f5bdaebf` in the existing read-only checkout.
The experiment remains:

```text
2 full-replica insertion orders
× 2 move-version orders
× 6 permutations of R_AB, R_AC, R_FULL
× 2 parenthesizations
= 48 native cases and the same 48 sanitizer cases
```

The visible oracle remains `BAC` when the B move is newer and `CAB` when the C
move is newer. Every configuration still requires all 12 complete normal forms
to agree. CBMC still checks two fixed representatives against actual selected
C code and the declared dependency shim. No position maps, allocation-failure
proof, serialization, or whole-project integration is added.

### 3.2 Separate readiness from running the test

`validate-construction` becomes a truthful, non-subject readiness check. It
returns success when its required construction checks pass. It must not add a
Task Session requirement, consult the suspended ontology runtime as a gate, or
manufacture a canonical Work Pack audit result.

The runner remains a bounded native product-test tool. Its `execute` entry
requires an exact candidate digest and matching files. The user's selected
task provides permission to invoke it; the digest argument identifies the
bytes and is not an authorization token. Missing or mismatched candidate input
is a technical prerequisite failure, not a demand to install Task Session.

Report these separately:

- `construction_status`: pass or block, derived from actual checks;
- `candidate_digest`: the selected, immutable product-test candidate;
- `run_status`: not-started, running, completed, interrupted, or failed-to-start;
- the evidence outcome axes and aggregate verdict;
- product approval and operational admission: no claim granted by this tool.

The earlier statement that missing Task Session necessarily blocks C3 is
superseded for the repaired candidate. Do not recreate the deleted skill or
replace it with another unrelated lifecycle prerequisite.

### 3.3 Version the evidence contract and preserve history

Keep the existing v1 schemas, manifests, fixtures, raw construction outputs,
readiness reports, and any prior attempts. Add v2 contracts and new construction
epochs. The v1 parser may remain available for explicitly labeled historical
diagnostics; it cannot silently promote a v1 record into trusted v2 evidence.

Implementation may revise active code and README/profile guidance within the
allowlist in section 12. Before doing so, retain an exact, private baseline
bundle of the reviewed files. Do not overwrite old CBMC discovery receipts to
make them appear current after harness or parser changes.

### 3.4 Avoid digest cycles

Use an explicit, acyclic binding order:

```text
source files + plans + profile + tests/schemas
    -> source manifest
tool/runtime identities -> tool manifest
source/tool bindings + command templates -> command manifest
CBMC rehearsal evidence + its input bindings -> bound manifest
the four manifests -> candidate digest
candidate digest + UTC start -> run ID
run ID -> resolved command arrays and attempt paths
candidate + resolved commands + captured inputs -> attempt snapshot digest
raw evidence + ledgers -> derived results and validation
snapshot + all retained artifact hashes -> terminal record
```

The run-ID suffix changes from the original plan's snapshot-prefix proposal to
the candidate-digest prefix. This removes the cycle in which resolved commands
contain a run path derived from a snapshot that itself contains those commands.
Keep the UTC timestamp with microseconds and exclusive directory creation.

No document includes its own digest as part of the bytes being hashed. No
candidate manifest includes live outputs that depend on that candidate digest.
Terminal evidence manifests exclude themselves and their terminal envelope.

### 3.5 Scope the assurance honestly

The validator proves consistency and provenance within a captured local bundle.
It does not provide cryptographically authenticated proof that a hostile host
actually executed a process. Host attestation, signed releases, and a sandbox
against malicious compiler code are outside this repair.

Offline validation checks retained bytes against a caller-selected candidate
digest. It must still work after the current checkout or host tool installation
changes. Live currentness checks are separate and inspect the selected host
dependencies before and during a new run.

## 4. Outcome rules: evidence integrity and subject behavior

Keep evidence errors separate from subject findings. Use stable diagnostic
codes with the affected case, command, stream, and evidence reference.

| Situation | Receipt status | Subject interpretation | Promotion verdict |
| --- | --- | --- | --- |
| All required checks complete successfully, with bound evidence | pass | No counterexample within the declared scope | PASS |
| Valid merge rejection, wrong order, or different complete normal forms | pass | Convergence counterexample | BLOCK |
| Bound source mutation, illegal ownership alias, or broken links/counts | pass | Implementation-invariant violation | BLOCK |
| Attributable recognized sanitizer diagnostic | pass | Safety violation | BLOCK |
| Named CBMC failure with valid trace and prerequisites | pass | Bounded counterexample | BLOCK |
| Honest timeout, launch failure, or skipped dependent unit | pass if fully and consistently represented | Affected checks not evaluable | PARTIAL_NOT_EVALUABLE unless another valid finding requires BLOCK |
| Missing raw file, hash mismatch, cross-run row, or contradictory claimed result | block | Affected claim unsupported; preserve unaffected valid observations | PARTIAL_NOT_EVALUABLE unless an independently valid finding requires BLOCK |
| Interrupted run with an intact classified partial ledger | pass if its partial state is accurately represented | Unfinished checks not evaluable | PARTIAL_NOT_EVALUABLE unless an earlier valid finding requires BLOCK |

Derive the promotion verdict from validated observations, never from untrusted
status fields. A fabricated failure field cannot force BLOCK any more than a
fabricated success field can force PASS. Do not invalidate every observation
because one unrelated row is malformed; preserve dependency-specific findings.

Receipts have two validation products: the derived expected result and the list
of differences from the supplied result. A self-reference such as "receipt
passes because its receipt_status says pass" is forbidden. The runner asks the
validator to derive a result, writes it once, and then independently checks the
written bundle. A truthful terminal BLOCK is successful evidence collection,
not a crashed runner.

Define CLI exit codes explicitly: 0 for a completed trustworthy bundle with
PASS, 10 for a completed trustworthy bundle containing a subject BLOCK, and 2
for incomplete, invalid, or failed-to-start evaluation. Retain the interruption
signal in the record even when the CLI uses the defined incomplete exit code.
Preflight and standalone receipt validation use 0 for pass and 2 for block.

## 5. Five implementation layers

The layering method starts with the smallest useful proof and adds one
assurance theme at a time. Layer value is the decision enabled, the useful
result, and the risk removed. Layer cost is implementation, verification, and
coordination effort. Later layer acceptance preserves every earlier guarantee.
Independent coding work may proceed once its exact interface dependencies are
ready; layer acceptance is not a reason to idle unrelated work.

| Layer | Decision question | Smallest useful result | Main risk removed | Main cost | Exit decision |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether the validator can distinguish supported success, supported failure, and unusable evidence. | One complete synthetic attempt accepted from actual fixture bytes, plus adversarial variants. | False PASS and lost failures. | Evidence schemas, parsers, independent fixture design. | Continue when every outcome rule is reproduced correctly. |
| L1 | After this layer, we know whether a candidate and attempt bind the exact selected inputs and can be selected without the artificial blocker. | A frozen v2 candidate, valid readiness report, and tested drift rejection. | Wrong-byte attribution and permanently unreachable execution. | Dependency capture, command closure, fresh CBMC rehearsal. | Continue when identity checks and CBMC binding pass. |
| L2 | After this layer, we know whether execution remains bounded and recoverable when processes fail. | A supervised synthetic run covering launch failure, timeout, overflow, interruption, and recovery. | Lost evidence, resource exhaustion, orphan children. | Process supervision and crash-safe lifecycle tests. | Continue when failure paths produce truthful terminal evidence. |
| L3 | After this layer, we know whether each measured merge leaves enough evidence to explain its result. | One real native case with complete per-call observations, plus controlled invariant faults. | Unexplainable failures and unchecked boolean claims. | C observation format, safe traversal, normalization, independent parsing. | Continue when retained observations support all declared native checks. |
| L4 | After this layer, we know whether the repaired mechanism works across the complete declared experiment. | One frozen final candidate, complete regression suite, and one bounded 48/48/2 product-test attempt. | Integration gaps and stale claims. | Full verification, independent replay, documentation. | Ready for review only when all mechanism checks pass; report the actual CRABS result. |

## 6. L0 — Establish a trustworthy evidence interpretation path

Minimum working unit: a synthetic fixture directory containing actual raw
files and a complete logical 48/48/2 receipt. Synthetic fixture results are
clearly labeled test data and cannot enter the live run ledger. The production
validator operates on file contents; tests do not mock raw-file reads as their
only verification technique.

### L0.1 Define v2 records and interfaces

Add closed v2 JSON schemas for process records, native events, case records,
run records, summaries, snapshots, command manifests, CBMC bounds, and terminal
records. Check duplicate JSON keys, invalid encodings, unknown fields, trailing
garbage, invalid numeric ranges, and unsupported schema versions.

Each process record carries:

- run ID, command ID, unit ID, and candidate/snapshot bindings;
- executable identity and exact argv/cwd/environment reference;
- monotonic duration, configured deadline, exit code or termination signal;
- termination reason: completed, timeout, output-limit, launch-failed,
  interrupted, or not-run, with a typed causal dependency when applicable;
- stdout and stderr references with byte size, SHA-256, and complete/truncated
  state; an empty but genuine stderr is allowed;
- separate supervisor diagnostics, never appended to raw subject output.

Case records point to evidence and derived checks. Run summaries carry fixed
expected counts separately from observed, completed, skipped, and not-evaluable
counts. An interrupted run must not falsify its observed totals to satisfy a
schema that requires 48 completed processes.

Count individual case counterexamples separately from divergent configurations.
Two individually well-formed results can disagree without either row alone
identifying the divergence. Record the differing case pair and increment the
configuration counterexample count; do not report a misleading zero-finding
summary when the aggregate convergence result is counterexample.

Every logical case still has exactly one native and one sanitizer outcome row,
including typed not-run outcomes. A missing row is malformed evidence; an
explicit row explaining why its command did not run is valid incomplete
evidence. CBMC has exactly two representative rows with references to all four
commands per representative: loop discovery, property discovery, complete
check, and target check.

### L0.2 Make the validator derive rather than trust

Refactor `validate_semantics.py` so it:

1. Loads one explicitly selected candidate and attempt snapshot, with an
   expected digest supplied by its caller.
2. Verifies reference containment, file types, hashes, sizes, run/command IDs,
   and the closed record schemas before interpreting content.
3. Independently enumerates the 48 cases from the obligation's dimensions and
   checks them against the generated JSON and header. It must not call the
   production generator as its independent oracle.
4. Parses native observations, sanitizer diagnostics, and CBMC outputs.
5. Derives per-case outcomes, four configuration comparisons, all aggregate
   counts, receipt integrity, and the promotion verdict.
6. Compares the derived result with every supplied row and summary.

Sharing low-level parsing and canonical encoding between consumers is allowed.
The runner must not provide authoritative classifications to the validator.
Test expected results come from reviewed fixture facts, not the same summary
function under test.

Explicitly reject wrong plan/obligation/bound hashes, unknown commands,
unexpected executable/argv/environment, duplicate representatives, foreign
run IDs, extra cases, zero merge calls reported as full success, and a nonzero
rejection count paired with a successful-merge claim.

### L0.3 Correct the CBMC decision procedure

Keep four separate facts per representative:

- process/output completeness;
- unwind sufficiency;
- auxiliary C checks, including pointer, bounds, overflow, and conversion;
- the exact named convergence property's result and trace.

The complete check remains unfiltered and uses the frozen unwind set with
unwinding assertions enabled. Parse its entire property-result inventory and
terminal result. The target property may fail without invalidating unwind
sufficiency. A counterexample is accepted only when the exact target fails,
its trace is present, both invocations bind the same source and bounds, and
the required unwind and auxiliary checks are established.

Do not require a fabricated list of explicit unwind SUCCESS lines: the current
stored complete output has no lines containing `unwind`. Some checks may be
discharged before appearing in the result list. Establish the pinned CBMC
output contract with a deliberately insufficient-bound test. A completed,
fully accounted check whose only failure is the named target can establish
that no unwind/auxiliary check failed; an empty list alone cannot do so.

Require unique, unambiguous property results, consistent terminal counts where
the tool emits them, and the exact frozen assertion identity. Timeout,
output-limit, parser failure, missing trace, wrong property, unknown exit, or
unwinding failure makes the affected representative not evaluable. Preserve
the observed target failure as diagnostic data if its prerequisites cannot be
proved. Apply this same procedure to `freeze_cbmc.py` and live validation.

### L0.4 Test genuine failures as valid evidence

Add positive fixtures for valid merge rejection, oracle mismatch,
configuration divergence, source mutation, sanitizer violation, CBMC target
failure, and honest incomplete execution. They must pass receipt validation
with the correct subject result. The complete success fixture must also pass.

Add negative variants for empty required stdout, contradictory logs, changed
hashes, cross-run joins, wrong commands, status contradictions, and missing
required observations. Keep the original 12 fixture intents and add an exact
fixture inventory: deleting an adversarial fixture cannot make the suite pass.

Exit evidence: fixture inventory report with each expected reason, parser
tests, independent expected counts, and a complete bundle-validation example.
Defer process supervision, real native snapshots, and live source checks to
later layers. L0 results prove the interpretation mechanism on fixtures only.

## 7. L1 — Bind exact inputs and make construction readiness truthful

### L1.1 Freeze a candidate without rewriting history

Add separate v2 source, tool, command, and CBMC-bound manifests. Record the
original and repair plan digests, unchanged obligation, generator, parsers,
normalizer, shared CBMC header, dependency shim, schemas, and test inventory.
The source manifest has an explicit allowlist, not an unbounded repository
scan. Include all relevant local includes and resolve their dependency closure.

Record actual tool bytes, not just version strings: Python and its selected
validation dependencies, GCC and invoked compiler/binutils helpers, CBMC,
selected preprocessing dependencies, linked sanitizer libraries, libc, and the
loader. Record symlink spelling and resolved target. Probe compiler dependency
output and linked runtime paths using the exact commands intended for the run.
An unexpected selected include, helper, or library requires a refreshed
construction candidate, not silently expanded live scope.

The claim is the declared local toolchain and selected dependencies, not a
general hermetic-host proof. Do not collect unrelated ontology epochs or
repository paths as prerequisites.

### L1.2 Capture the actual inputs used by each attempt

Stage the selected subject and harness source bytes under the new attempt's
input directory, preserving include relationships. Verify copied hashes
before use and compile/check those staged bytes. Include the dependency shim
and shared CBMC header; hashing only the two tiny wrapper files is insufficient.

Source-byte provenance and host currentness are separate observations. Recheck
the original selected dependency bytes and the staged inputs before phase
launches and at terminal recording. Recheck tool/runtime identities before
their dependent commands. A selected dependency change stops new affected
launches and records drift; completed observations stay attached to their
captured inputs and are not relabeled as evidence for new bytes.

For toolchains that open further files during preprocessing/linking, compare
the discovered dependency closure with the frozen one and retain the produced
preprocessed/dependency artifacts or equivalent deterministic compiler evidence.
Do not claim that hashing a manifest proves what the compiler consumed.

### L1.3 Resolve and bind every command before launch

Use the frozen case list and new run ID to materialize all per-case and CBMC
commands as concrete argv arrays. Freeze `resolved-commands.json` before any
child launch. Each record includes cwd, exact environment, timeout, output
limits, parser identity, expected exits, input dependencies, and allowed outputs.

Make the only substitution an explicitly typed attempt-directory token. Reject
unresolved tokens and unsupported command fields. Validate exact absolute
executable paths and canonical output destinations. Generated case IDs never
become arbitrary paths or free-form command fragments.

Set an attempt-private temporary directory and record it in the environment.
All children run serially. Preserve the no-network requirement with a tested,
bound Linux network-isolation launcher available on the host. If this cannot
be realized without new privileges or installation, record that exact live
prerequisite as not evaluable; offline fixture and process tests remain runnable.
Do not silently claim isolation from a `network: forbidden` string.

### L1.4 Fix readiness and refresh CBMC evidence

Remove the unconditional Task Session blocker. Derive construction status
from actual schema, fixture, source/tool, command, compilation, and CBMC-binding
checks. Name the output a package construction-readiness report unless an
actual separate Work Pack audit was run. Do not synthesize that audit's status.

Run fresh CBMC discovery and bound rehearsals into a new construction epoch.
The bound manifest binds the full ordered source list, every source/header/shim
digest, command and CBMC identity, loops, property identity, numeric bounds,
justifications, and all four raw process records. Keep existing depths only
if rediscovery and the repaired sufficiency check support them. Never enlarge
bounds merely to conceal an unwinding failure without documenting a new epoch.

Exercise candidate creation with immutable rehearsal descriptors after the
selected rehearsal inputs are final. During L1, keep them in that epoch and
label their tested scope explicitly. Reserve the package-level final descriptor
for R09, after the remaining repairs are integrated. A rehearsal descriptor
does not enable the full matrix, and an accurate readiness report may still
name missing L2/L3/L4 checks as real prerequisites. An existing frozen path is
not overwritten; a later change requires a new candidate epoch. `execute`
checks the selected full candidate and digest using the actual required
readiness checks. Schema-valid status or kind fields cannot grant eligibility.

Compare parsed CBMC discovery inventories using logical source identities,
loop IDs, property IDs, and assertion text. Preserve each raw output's own
hash, but do not require construction and live stdout hashes to be identical:
staging changes absolute source paths without changing the selected source
bytes. Path normalization is confined to the inventory comparison and must
not hide a different source digest or property.

Exit evidence: current construction report, new CBMC construction bundle,
candidate digest, and drift/identity tests for real files in temporary test
directories. Preserve all L0 guarantees. Defer full live execution until L2–L4.

## 8. L2 — Bound processes and preserve attempts through failure

### L2.1 Supervise processes while they run

Extract process execution from `run.py` into a focused supervisor. Use a new
process group/session and concurrent nonblocking draining of stdout and stderr.
Write raw bytes incrementally to new exclusive files. Hash incrementally and
keep memory bounded by fixed buffers; never collect whole output in RAM.

Preserve the existing ceilings:

- native: 5 seconds per case, 60 seconds per phase;
- sanitizer: 10 seconds per case, 120 seconds per phase;
- CBMC: 180 seconds per discovery, complete, or target command;
- stdout and stderr: 4 MiB each per process;
- one active child process at a time.

Use monotonic deadlines. A case receives the smaller of its own allowance and
the remaining phase budget. Zero remaining budget produces a not-run record.
Document a separate small, bounded cleanup grace period; it cannot allow more
subject work to count as within the execution deadline.

On overflow, retain only the allowed prefix, mark the stream truncated, stop
the process group, drain/close pipes within the cleanup budget, and reap every
owned child. Check stdout and stderr independently. Exactly the allowed byte
count passes; the next byte causes overflow. Do not inject timeout text into
the subject's stderr, because that would alter the raw evidence being parsed.

On timeout, cancellation, SIGINT, or SIGTERM, stop launches and terminate the
owned process group, escalating from TERM to KILL after the cleanup grace.
Never signal an unrelated PID. A descendant that keeps a pipe open must not
hang the supervisor indefinitely.

### L2.2 Separate ordinary failure from interruption

Handle missing/non-executable tools, bad cwd, process startup errors, malformed
output, and ordinary exceptions as typed failure records. A process that exits
abnormally is not automatically a CRABS counterexample. Recognized sanitizer
diagnostics remain their own evidence; a timeout alone proves no safety bug.

After an ordinary infrastructure failure, only dependent commands are skipped.
For example, native compile failure skips native cases but does not skip a
successfully built sanitizer phase or independent CBMC checks. A global user
interruption stops all new launches and records the unfinished units explicitly.

### L2.3 Make attempt finalization idempotent

Create a small durable start record immediately after exclusive attempt
creation. Append command-start and command-finish events around every launch,
with fsync at lifecycle boundaries. Record every process before deriving the
case/representative outcomes. Keep code and final reports separate from this
append-only lifecycle journal.

Use a finalization path for completed, failed, and interrupted attempts:

1. Reconcile started/finished commands and preserve all available raw prefixes.
2. Append explicit incomplete/not-run outcomes for uncompleted logical cases
   and representatives, with causal reasons.
3. Recheck dependency currentness and validate the retained ledger.
4. Derive the results once; write summary, receipt, validation, and report using
   exclusive final writes with fsync and directory fsync.
5. Hash the complete retained artifact index and append one terminal run row.

Protect shared ledger append with a lock and a duplicate run-ID check. Handle
short writes correctly. A retry of finalization verifies existing terminal
bytes and does not append a second row or rewrite a case result.

Write an exclusive, durable `terminal.json` inside the attempt before indexing
it in the shared ledger. It is the authoritative terminal object; the shared
row references its digest. A crash between those two writes can be recovered
by indexing that same object. A torn shared append is preserved and identified
by byte range in an append-only correction record; consumers must distinguish
that recorded damaged range from a complete terminal row. Do not silently
discard arbitrary malformed lines or count a partial append as a terminal.

Use the logical case ledger as the source for summaries rather than an
unverified in-memory duplicate. The terminal artifact index binds snapshot,
resolved commands, captured inputs, generated artifacts, binaries, process
ledger, case ledger, raw outputs, summaries, and report.

### L2.4 Recover without silently rerunning

SIGKILL, power loss, and an unwritable disk cannot be made to execute Python
finally blocks. Add an explicit `recover --attempt <run-id>` operation that
reads a durable incomplete attempt, confirms its previous supervisor is no
longer active using an identity stronger than a reused PID, and only finalizes
its evidence. It never launches CRABS or turns a partial run into a rerun.

Preserve torn ledger tails as evidence; construct a separate recovery record
from the verified complete prefix rather than rewriting history. If terminal
storage is impossible, retain whatever is already durable, return incomplete,
and report the storage error. Do not promise a terminal row across irrecoverable
storage loss. A later recovery records what could actually be recovered.

Validate attempt/rerun IDs with an anchored grammar. Reject absolute paths,
separators, traversal, symlinked attempt directories, and references lacking a
real prior attempt identity. New runs remain new directories; corrections
append separately. Use exclusive creation and no-follow path handling for
runner-owned outputs where supported by the host.

Exit evidence: process and lifecycle tests using small fixture executables,
bounded capture measurements, child-reaping assertions, and crash/recovery
tests. These tests do not depend on a live CRABS result. Preserve L0/L1 checks.

## 9. L3 — Retain and independently interpret every merge observation

### L3.1 Emit an incremental native event stream

Replace the single end-of-process JSON result with a versioned NDJSON event
stream. Each event has run/case identity and a strictly increasing sequence
number. Flush critical boundaries so a later crash does not discard earlier
observations. Required events are:

1. Case identity, matrix parameters, and operation trace.
2. Each input-construction operation and its result.
3. The constructed states and construction checks.
4. Before each merge: operand identities and both snapshots.
5. After each merge: actual return kind, both snapshots, and check witnesses.
6. Final state, visible order, and case-completion event.
7. Cleanup outcome if it completes; cleanup failure remains visible through
   the process record and sanitizer evidence.

Pass the run ID and candidate digest to the native executable as explicit
arguments alongside `--case-id`, and include those exact arguments in the
resolved command record. Reject missing, unknown, or conflicting identity
arguments. The arguments bind observations to the invocation; they do not
authenticate the host or expand the experiment's authority.

Emit post-call observations before destroying any set. A later cleanup crash
must not erase an already observed merge rejection or source mutation. Complete
positive coverage still requires all required phases, including successful
cleanup. An incomplete event stream cannot produce no-counterexample.

### L3.2 Separate semantic normal forms from ownership observations

The semantic normal form uses a versioned binary encoding rendered as hex in
JSON. Use fixed-width big-endian integers, explicit collection/payload lengths,
strict boolean values, and a specified element order. Include every original
normal-form field: full operation IDs, payload bytes/length, deletion, anchor
presence/ID, placement version, total/visible counts, and link validity.

Ownership observations are separate: case-local object identifiers for nodes
and payload storage, pointer relationships, and owned byte ranges where
needed. They support source/destination preservation and alias checks within
one case. They never enter cross-process semantic normal-form equality, where
different allocation addresses would create false divergence.

Invalid structures must retain a partial snapshot and a specific failure
witness rather than serialize as an indistinguishable empty string. Bound all
traversal by the declared state limit, track visited nodes, reject cycles, and
bound payload reads/output. Do not repair links while observing them. If a
pointer cannot be safely inspected, stop that observation and mark its check
not evaluable; retained pre-call events and sanitizer output remain available.

Source preservation means the checked state and owned storage agree at the
call boundaries. It is not a claim that no transient internal write occurred.
On a rejected merge, check the destination too. Check storage disjointness
across all three independently reconstructed sets after relevant calls, not
only the immediate source/destination pair.

### L3.3 Derive invariant checks in Python

The native harness reports observations, not final authority over the verdict.
`parse_native.py` validates event order, identities, declared operation history,
call count, and return values. It reconstructs the canonical normal form and
compares snapshots independently for:

- source preservation on success and rejection;
- destination preservation on rejection;
- owned-storage aliasing;
- count, visible count, head/tail, and reciprocal-link validity;
- visible-order oracle and final semantic equality.

Keep explicit per-check evaluability. A later missing observation does not
erase an earlier complete, supported violation. It also cannot make the
unfinished checks pass. A successful case requires two successful measured
merges, zero rejections, and complete observations of every required check.

Use local test-only fake merge implementations or constructed observations to
exercise rejection, source mutation, aliasing, broken links, cycles, and
cleanup failure. Never mutate the selected CRABS checkout to inject faults.
Test fixtures must not claim that those synthetic faults were found in CRABS.

Exit evidence: a retained real native-case event stream, independent parser
reconstruction, matching sanitizer case, and controlled-fault tests. Preserve
the exact matrix/oracle and every earlier-layer guarantee. Broader schedules
and new formal tools remain deferred.

## 10. L4 — Integrate, freeze, test, and explain the repaired candidate

### L4.1 Make the unit graph explicit in the runner

Use the original U0–U9 meanings with typed dependency results. Run ordering is:

```text
candidate selection + exclusive attempt + durable start
  -> snapshot and resolved commands
  -> fixture/schema checks
  -> generate and verify JSON/header
  -> native build -> native cases
  -> sanitizer build -> sanitizer cases
  -> CBMC discovery -> complete/target checks for each representative
  -> derive and validate results -> terminal bundle
```

Generation failure prevents both builds. A successful generator process is not
enough: independently compare exact case membership, order, parameters, oracle,
JSON digest, and header entries before compiling. Do not use a fallback case
list to conceal broken generation. Binary existence is not build success;
require a successful, bound compile receipt and verified output digest.

Native, sanitizer, and CBMC evidence are independent once their own prerequisites
are ready. Execute them serially, collecting all admitted non-effectful checks.
A subject finding does not stop collection. A tool failure skips only dependent
work. Drift, unsafe output destinations, global interruption, or loss of the
selected execution identity stops new affected launches as defined above.

Validate the result-summary schema as well as the run/case schemas. Verify the
generated files, executable outputs, linked runtime observations, process and
case ledgers, and final artifact index—not just the two final JSON files.

### L4.2 Freeze before the final product test

Finish code, tests, schemas, command templates, and explanatory README before
minting the final candidate digest. Run the full mechanism regression suite
and fresh construction checks. If a change follows, create a new candidate
epoch and repeat the checks affected by the change; do not refresh old receipt
hashes and call the old test current.

The final evidence run uses exactly the selected candidate digest. It launches
48 native cases, 48 matching sanitizer processes, and the two CBMC
representatives with discovery and complete/target checks. Every logical slot
gets a recorded outcome, even if its command cannot launch.

After the attempt, independently replay receipt validation from retained bytes
in a fresh process. The replay must reproduce the run's classifications,
counts, and verdict without relying on current mutable source files or the
runner's in-memory state. A separate currentness report may compare the
current host with the captured snapshot.

### L4.3 Document what happened in plain language

Update README guidance to explain:

- TDE supplies the unchanged formal obligation; EVF translates it into concrete
  native, sanitizer, CBMC, schema, and semantic checks.
- Native C checks 48 declared cases; sanitizers check those executions for
  recognized memory/undefined-behavior problems; CBMC checks two actual-C
  representatives at recorded bounds.
- A valid receipt can report failure. No-counterexample is bounded evidence,
  not a general proof of convergence.
- How to validate construction, select a candidate, execute the bounded test,
  inspect the smallest counterexample, validate a retained bundle, and recover
  an interrupted attempt.
- What the test does not cover, including position maps, allocation failure,
  serialization, other schedules, and operational admission.

The generated report must give actual completed/expected counts, each evidence
axis, blockers, candidate/subject identities, and the lexically smallest
reproducing case or differing pair per configuration. Link directly to raw
events, before/after operand states, sanitizer diagnostics, and CBMC traces.
If there is a CRABS finding, explain the operation history and expected versus
observed result. Do not present synthetic regression failures as subject findings.

Exit evidence: all mechanism tests pass, an immutable current candidate exists,
the bounded attempt is completely and truthfully recorded, independent replay
agrees, and the report is understandable without reading the implementation.
A supported CRABS counterexample does not mean the evidence mechanism failed;
it sets the subject verdict to BLOCK and leaves CRABS diagnosis/repair separate.

## 11. Required verification matrix

These are acceptance tests for the repair, not optional examples. Group related
variants into table-driven tests where useful. Every test has an explicit
expected diagnostic or outcome; do not assert only that an exception occurred.

| Test group | Required cases | Expected evidence |
| --- | --- | --- |
| V01: complete positive bundle | Full fixture matrix, real fixture raw files, exact commands and bindings. | Receipt pass; bounded PASS; exact 48/48/2 expected coverage. |
| V02: raw evidence disagreement | Empty required stdout; ASan/UBSan failure hidden by a success field; CBMC FAILURE hidden by success; native JSON/events disagree with row. | Reject unsupported fields with precise raw/row references. |
| V03: provenance joins | Wrong plan, obligation, source, tool, bounds, command, run ID; duplicate representative; extra/missing case. | Reject affected joins; no inherited PASS. |
| V04: honest negative results | Merge rejection, wrong oracle, complete-state divergence, source mutation, alias, sanitizer finding. | Receipt pass; supported subject BLOCK. |
| V05: partial results | Timeout, failed launch, incomplete observations, dependent not-run rows, one broken branch with others complete. | Truthful counts and not-evaluable outcomes; preserve independent findings. |
| V06: CBMC outcomes | Complete target-only failure plus successful target failure/trace; all-success pair; insufficient unwind; other-property failure; wrong property; duplicate/conflicting result; missing trace/footer; output-limit containing FAILURE. | First is counterexample, second is no-counterexample-at-bound; remaining unsupported cases not evaluable. |
| V07: drift | Change selected source, shared header, shim, tool, runtime, symlink target, or generated input after capture in a temporary test environment. | Stop affected launches; record old/new digests and dependency-specific invalidation. |
| V08: offline replay | Move/copy a retained fixture bundle; change current checkout/tool test locations. | Captured-evidence validation remains reproducible; currentness is separately reported. |
| V09: generated equivalence | Duplicate/missing/reordered case, edited header parameter with unchanged advertised digest, wrong oracle, generation exit failure with leftover files. | Reject before subject launch. |
| V10: streaming limits | Zero bytes, exactly 4 MiB, 4 MiB + 1, simultaneous noisy streams, endless output, child retaining pipes. | Exact caps, bounded memory, bounded cleanup, output-limit distinct from subject failure. |
| V11: deadlines | Per-case timeout, phase budget nearly exhausted, exhausted budget before a case, child ignores TERM. | Correct remaining allowance, not-run rows, owned process group reaped. |
| V12: launch/interruption | Missing/non-executable tool, bad cwd, SIGINT, SIGTERM, parser exception. | Partial raw evidence retained and one truthful terminal result where storage permits. |
| V13: recovery/idempotency | Kill supervisor after start, during command, before terminal append, after append; repeat recovery; torn journal tail. | No subject rerun, no duplicate terminal, intact historical bytes, explicit recovery evidence. |
| V14: paths/concurrency | Existing run ID, traversal/absolute rerun ID, symlinked raw output/attempt, concurrent terminal append. | Reject unsafe scope; no overwrite, foreign write, or ledger corruption. |
| V15: native observations | Two real merge calls; rejected first/second call; source/destination mutation; cycle; alias; cleanup failure after post-call flush. | Independent check witnesses; bounded observation; earlier evidence survives later failure. |
| V16: normalization | Equivalent state at different addresses; changed payload, deleted flag, anchor, placement, count, or reciprocal link; non-ASCII/invalid byte inputs. | Address-independent equality for semantic states and exact detection of changed semantic fields. |
| V17: fixture integrity | Remove one named adversary; alter expected reason; reuse production generator as test oracle. | Inventory/test-design check prevents a false green suite. |
| V18: full candidate test | Real 48 native + 48 sanitizer logical cases + two CBMC representatives; fresh-process replay. | One immutable complete attempt with the actual subject verdict and exact claim ceiling. |

Test commands proposed for the repaired implementation, to be materialized and
verified during implementation:

```text
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 -m unittest discover -s tests -v
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 run.py validate-construction
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 run.py execute --candidate candidate.v2.json --candidate-sha256 <actual-digest>
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 scripts/validate_semantics.py --attempt-root <retained-attempt> --expected-candidate-sha256 <actual-digest>
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 run.py recover --attempt <actual-run-id>
```

The angle-bracket values above are explanatory CLI notation, not executable
manifest placeholders. Construction must produce exact command arrays with
real values before a run. No full matrix or CBMC command is launched while
authoring this plan.

## 12. Exact implementation surface

All paths below are relative to this package. This is the proposed future
allowlist. A new file not listed here requires an explicit scope update before
implementation; broader repository discovery is not implied.

| Files | Intended changes |
| --- | --- |
| `run.py` | Thin orchestration, real readiness, candidate selection, explicit dependencies, finalization/recovery entry points. |
| `scripts/validate_semantics.py` | Independent raw-evidence interpretation, provenance joins, correct outcomes and summaries, offline validation. |
| `scripts/validate_schema.py` | Explicit v1 diagnostic/v2 validation dispatch and closed schema resolution. |
| `scripts/parse_cbmc.py`, `scripts/parse_sanitizer.py` | Strict evidence parsing and process-aware classification under the recorded provider contract. |
| `scripts/freeze_cbmc.py` | New immutable construction epochs, complete bindings, corrected bound/target handling through the common supervisor. |
| `generator/cases.py` | Preserve the exact matrix; expose deterministic header/JSON outputs and candidate bindings without changing the oracle. |
| `harness/partial_knowledge_move.c` | Incremental observations, retained snapshots, explicit return values, bounded traversal and normalized state. |
| `README.md`, `profile.json` | Accurate v2 usage, construction frontier, claim ceilings, and removal of the obsolete Task Session gate. |
| New `scripts/evidence_io.py` | Strict JSON, canonical encoding, contained/exclusive file IO, hash/reference utilities. |
| New `scripts/snapshot.py` | Candidate input closure, staged-byte checks, command resolution, currentness comparisons. |
| New `scripts/process_runner.py` | Bounded streaming, deadlines, signals, process-group cleanup, typed process evidence. |
| New `scripts/attempt.py` | Start/journal/finalization, terminal locking, recovery, and immutable attempt handling. |
| New `scripts/parse_native.py` | Event protocol, independent normal-form reconstruction and invariant interpretation. |
| New `harness/observation.h`, `harness/observation.c` | Native observation/serialization helpers only; no changes to CRABS merge semantics. |
| New `schemas/process-record.v2.schema.json`, `schemas/native-event.v2.schema.json`, `schemas/case-record.v2.schema.json` | Typed process, native event, and case evidence. |
| New `schemas/run-record.v2.schema.json`, `schemas/result-summary.v2.schema.json`, `schemas/terminal-record.v2.schema.json` | Honest complete/incomplete outcomes and terminal lifecycle records. |
| New `schemas/snapshot.v2.schema.json`, `schemas/commands.v2.schema.json`, `schemas/cbmc-bound-manifest.v2.schema.json`, `schemas/candidate.v2.schema.json` | Exact input, command, bound, and candidate contracts. |
| New `source-manifest.v2.json`, `tool-manifest.v2.json`, `commands.v2.json`, `cbmc-bound-manifest.v2.json`, `candidate.v2.json` | Initial repaired candidate inputs, finalized before its evidence run; no overwrite after freeze. |
| New `tests/test_receipt_evidence.py`, `tests/test_cbmc_results.py`, `tests/test_provenance.py`, `tests/test_process_runner.py`, `tests/test_attempt_lifecycle.py`, `tests/test_native_observations.py`, `tests/test_run_integration.py` | The verification groups above, with independent expected facts. |
| New `tests/fixture_child.py`, `tests/native_faults.c` | Small test-only process and native-fault producers; never used by live subject commands. |
| New `fixtures/receipt-semantics-v2/index.json`, `fixtures/receipt-semantics-v2/scenarios.json`, `fixtures/receipt-semantics-v2/build_fixtures.py` | Exact scenario inventory and independent fixture builder producing actual temporary bundles; reviewed expected outcomes remain separate from production code. |

Construction outputs are limited to newly created directories under
`construction/repair-v2/`: a reviewed-baseline bundle, numbered/identified test
epochs, CBMC rehearsal bundles, and immutable candidate snapshots. Resolve
their exact paths before writing and never reuse an occupied epoch path.
Fixture subprocesses write only their newly created test output directories.

The candidate schema includes closed definitions for its source/tool manifests,
construction-readiness records, and fixture inventory references. Resolve
schema references from the local allowlisted registry only; validation must
not retrieve schemas over the network. Tests cover the schema definitions as
well as the consumer that resolves them.

Live outputs are limited to a new `evidence/attempts/<run-id>/`, a duplicate-safe
append to `evidence/runs.jsonl`, and explicit append-only recovery/correction
records where required. No prior attempt or historical construction file is
rewritten. New recovery records live under the affected attempt's new
`recovery/` entries and identify the old immutable bytes they interpret.

Preserve `obligation.json`, `case-manifest.json`, the original run plan, the
selected CRABS checkout, both CBMC wrapper C files, the shared CBMC C header,
and the dependency shim unless a concrete implementation issue requires a
separately explained scope amendment. Observation helpers belong to the native
build; they do not silently broaden the CBMC model.

## 13. Work units, dependencies, and construction/operations separation

Each unit records its input digests, output paths, tests, findings closed,
remaining blockers, and claim ceiling in its construction epoch. A successful
status field without the listed evidence does not complete a unit.

| Unit | Lane / layer | Work and artifact | Depends on | Done condition |
| --- | --- | --- | --- | --- |
| R00 | Product construction / L0 | Capture baseline; define v2 records, outcome truth table, and local construction map. | This plan and reviewed bytes. | Baseline reconciled; navigation bindings, contracts, and independent expected scenarios reviewed. |
| R01 | Product construction / L0 | Implement raw-driven validator and real fixture bundles. | R00 | V01–V05, V17 pass, including accurate negative receipts. |
| R02 | Product construction / L0 | Correct CBMC parsing and classification. | R00 | V06 passes; insufficient-bound behavior explicitly covered. |
| R03 | Product construction / L1 | Input/tool closure, staged snapshots, concrete commands. | R00 | V03, V07–V09 pass for identity and generation boundaries. |
| R04 | Product construction / L1 | Real readiness and immutable CBMC/candidate construction. | R01, R02, R03, R05 | No artificial blocker; fresh supported bounds and candidate bindings. |
| R05 | Product construction / L2 | Streaming process supervisor. | R00 | V10–V12 process cases pass within resource/cleanup limits. |
| R06 | Product construction / L2 | Durable attempts, finalization, and recovery. | R01, R03, R05 | V05, V12–V14 lifecycle cases pass; no duplicate terminal records. |
| R07 | Product construction / L3 | Native event observations and independent parser. | R00, R01 | V15–V16 pass with retained before/after observations. |
| R08 | Product construction / L4 | Integrate unit scheduling, failures, generation checks, and reports. | R02, R04, R06, R07 | Full mechanism tests pass, including independent branch completion. |
| R09 | Product construction / L4 | Finalize docs, freeze final candidate, run complete bounded product test and replay. | R08; exact available local runtimes. | V18 complete and replay agrees; current mechanism evidence and truthful subject report. |

The dependency graph is acyclic. After R00, R01, R02, R03, R05, and R07's
interface/design work can advance independently; R07 integration waits for
R01. R04 needs R05 because fresh construction rehearsals must use the repaired
supervisor. This scheduling dependency does not make unrelated operational
work a construction gate. Native helper delegation is not selected by this
plan; implementation remains inline unless separately requested and routed.

Recommended implementation order for one worker:

```text
R00 -> R01 -> R02 -> R03 -> R05 -> R04 -> R06 -> R07 -> R08 -> R09
```

| Operational item | Owner | Exact affected stage | Handling |
| --- | --- | --- | --- |
| Existing dirty files or active writer overlap | Implementing agent reconciles; user owns existing changes. | R00 or the overlapping file's unit only. | Capture exact bytes, preserve unrelated changes; do not reset or broadly stage. |
| Required existing tool/runtime unavailable or changed | Local environment owner, reported by implementing agent. | Its compile/CBMC/live dependent checks only. | Name exact missing identity; continue independent fixture/parser/supervisor work. |
| Network-isolation launcher unavailable | Local environment owner. | Real child execution requiring isolation. | Report a concrete prerequisite; no privileged workaround or invented PASS. |
| Formal product approval | Product owner. | After R09 evidence; no construction stage is blocked by its current absence. | Supply exact tested candidate and evidence; do not set approval fields. |
| Governed operational admission | Applicable future owner. | No repair/product-test stage. | Deferred; no replacement runtime or Task Session installation. |
| Commit, push, pull request, publication | User-selected publication owner. | No repair/product-test stage. | Deferred and separately scoped under the publication route. |
| CRABS algorithm diagnosis or repair after a finding | User-selected CRABS repair task. | No EVF mechanism stage. | Preserve the counterexample and stop at the requested subject scope. |

## 14. Completion, stop conditions, and deferred scope

The implementation of this plan is complete only when:

1. Every F1–F8 defect has a passing regression and its changed implementation
   path has been exercised, including code previously hidden by the hard gate.
2. The fixture inventory and v2 schemas are closed and independently checked.
3. Readiness can pass for a correct construction and blocks for real missing
   dependencies; it never depends on the removed Task Session package.
4. Actual selected source/tool/runtime bytes and all resolved commands bind
   the tested candidate and attempt.
5. Bounded process supervision, interruption handling, and recovery pass their
   fault tests without rewriting old evidence.
6. Native snapshots and CBMC traces support both positive and negative results.
7. A full candidate test is recorded and independently reproducible from the
   retained bundle, when that test is included in the implementation request.
8. Documentation states actual results and limits in ordinary language; there
   is no implied product approval, general proof, or operational admission.

If a mechanism regression fails, repair that mechanism and mint new evidence
for affected bytes before claiming the candidate ready. If the real experiment
finds a CRABS counterexample, retain and report it; do not alter the subject,
matrix, or oracle inside this repair. If a live prerequisite is unavailable,
finish independent construction work and report the exact untested remainder.

Deferred scope: CRABS algorithm changes, larger matrices, position maps,
allocation-failure exploration, serialization migration, whole-project builds,
TLA+/TLC, Alloy, Lean, deployment, publication, and a general evidence-runner
platform. None is required to close the eight reviewed EVF defects.

## 15. Reviewed input hashes

These hashes identify the files inspected when this plan was written. They
are an implementation baseline, not approval or evidence that the repairs have
already been applied. Reconcile selected drift before starting R00.

| Input | SHA-256 |
| --- | --- |
| Original run plan | `1260d7a3b4170a5a8e01f219df9b407826932db6cb9ec3bba2888292ea4fecb3` |
| `run.py` | `5639896b47358132b1075ff3b8464d0dbc4554fae173660657b79292ad1e69de` |
| `scripts/validate_semantics.py` | `03a111fd9e3f214c6d6e7fd46d17fe5a18b55fc4496f3321d2b629a37b652f38` |
| `scripts/parse_cbmc.py` | `ae04fe9f8b07b53f00acd6a1c4599419a1345325b347217ca3ae8d48b2762feb` |
| `scripts/freeze_cbmc.py` | `40304cf7a44663be07195340dae66d8f8d0bc1ae5afc72a88d8fe26da3560288` |
| `harness/partial_knowledge_move.c` | `45c51aaae97a8f1d982b62018b4dfd006471dba44f30a013715a41ab838bd71c` |
| `harness/cbmc_partial_knowledge.h` | `43860d8d88eaf487b9e37e0d31eed03df8634716954b463820d7b9fb0a9de131` |
| `profile.json` | `a0e87ff68ee0178a9752632a4578e74966c938b226a64156d3e45efb7b188f97` |
| `source-manifest.json` | `c099d56aa76bf49cf58733e906e1dc3a26e0355d8d84eba50d88b4482f301ff3` |
| `cbmc-bound-manifest.json` | `ff878ad6ea65bdd6bd76bd358acaf920ed8f0f97d09d7c3d2d2f945ea0f88360` |
| `obligation.json` | `665dd6912e57b55b565f2b41ad3bffb695427bfe403243502bd35ded05357877` |
| `case-manifest.json` | `5f668e1c869a01d18c7ddbee7c0db5ee65e98421ee0787de29669a6485fe98bd` |

Planning validation: check finding coverage, unit dependencies, layer exit
criteria, file allowlist, outcome consistency, historical-evidence preservation,
and the product-construction/operational-support split. Implementation tests
and new subject runs are future work; this planning document cannot count them
as passed.
