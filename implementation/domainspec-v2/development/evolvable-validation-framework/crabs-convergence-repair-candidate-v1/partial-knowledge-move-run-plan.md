# Partial-knowledge concurrent-move run plan

Status: repaired planning candidate; implementation not started; execution not authorized

Plan ID: `crabs.ordered-set.partial-knowledge-move.r3.v2`

Subject: CRABS commit `477799721668652988bf98a4a9067d08f5bdaebf`

Authority effect: none

## What this plan is for

This plan defines one bounded experiment against the CRABS ordered-set merge
implementation. It asks a narrow question:

> When three replicas know different subsets of the same list and two partial
> replicas concurrently move different elements before `A`, do all declared
> three-way merge orders produce the same complete state?

The experiment may show a counterexample or may find no counterexample in the
declared matrix and CBMC bounds. It cannot prove the algorithm correct in
general. It does not approve the product, authorize a source repair, accept a
candidate, open or merge a pull request, publish, release, or deploy anything.

## Plain-language scenario

The three replica roles are fixed:

- `R_AB` knows `A` and `B`, then moves `B` before `A`;
- `R_AC` knows `A` and `C`, then moves `C` before `A`;
- `R_FULL` knows `A`, `B`, and `C` and performs no move.

`R_FULL` can learn `B` then `C`, or `C` then `B`. Either the `B` move or the
`C` move can have the newer operation ID. The experiment varies those two
facts, the order in which the three fixed roles are merged, and the way the
three merges are grouped.

The role names are semantic identities, not interchangeable labels. There is
no separate "choice of full-observer replica" dimension: the six role
permutations already cover every operand position. Counting an additional
three label rotations would duplicate cases.

## TDE obligation and EVF consumption

TDE supplies the provider-neutral obligation. EVF binds each part of that
obligation to a concrete evidence producer and preserves what each result can
and cannot claim.

The obligation is:

> For every case in the exact finite matrix, rebuild the three valid replica
> states independently from the immutable operation trace. Every declared
> operand permutation and parenthesization must merge successfully, preserve
> every source operand, satisfy the implementation invariants, and produce the
> same normalized result and the stated visible-order oracle.

The obligation is materialized as `obligation.json`. The consumers are:

| Obligation part | Consumer | How it is consumed | Maximum claim |
| --- | --- | --- | --- |
| All 48 finite cases | Python manifest generator plus native C harness built with pinned GCC 13 | Python emits the canonical cases; C rebuilds each case and calls the actual ordered-set merge code. | Counterexample, or no counterexample in these 48 cases. |
| Source preservation and list structure | Native C assertions and canonical normalization | The harness snapshots both merge operands, checks allowed mutation, and validates links and counts after each merge. | Invariant failure, or no detected failure in these calls. |
| Memory and undefined behavior | GCC AddressSanitizer and UndefinedBehaviorSanitizer build | One fresh subprocess consumes each of the same 48 case IDs. | Violation, or no detected violation for this instrumented run. |
| Two bounded actual-C projections | CBMC 6.11.0 | One harness per move-version regime asserts convergence and the explicit order, using a frozen property ID and proved unwind manifest. | Counterexample, or no counterexample at the recorded bounds. |
| Receipt shape | JSON Schema | Validates the structure and closed fields of inputs and evidence records. | Structure only. |
| Receipt meaning | Python semantic validator plus adversarial fixtures | Recomputes denominator, identities, totals, outcome axes, hashes, and promotion verdict. | Receipt consistency only. |
| Exact identity | Git and SHA-256 | Binds the subject, plan, obligation, sources, generators, commands, tools, runtimes, and raw output bytes. | Provenance only. |

TLA+/TLC, Lean, and Alloy are not used in this run. If this rule survives the
bounded implementation evidence, TLA+/TLC is the next candidate for exploring
more delivery schedules. Lean becomes useful only after the abstract merge
algebra and the C-to-model correspondence obligation are stable. Alloy could
later explore relational state shapes, but it would not replace either the C
checks or that correspondence proof.

## Exact finite matrix

The native and sanitizer denominators are each exactly 48 case observations:

```text
2 R_FULL insertion-delivery orders
x 2 move-version regimes
x 6 permutations of the fixed roles R_AB, R_AC, R_FULL
x 2 merge parenthesizations
= 48
```

The delivery orders are `B-then-C` and `C-then-B`. The version regimes are
`move-B-newer` and `move-C-newer`.

For operands `(X,Y,Z)`, the parenthesizations are:

```text
left:  merge(merge(X, Y), Z)
right: merge(X, merge(Y, Z))
```

Each stable case ID carries all four dimensions, for example:

```text
delivery-bc__version-b-newer__perm-rab-rac-rfull__assoc-left
```

The generator sorts IDs bytewise under `LC_ALL=C`, rejects duplicates, and
must produce exactly 48 records. The semantic validator independently
re-enumerates the Cartesian product. A missing, duplicate, additional, or
renamed record makes the run not evaluable; it never expands the claim.

## Complete input construction

Every operation object is zero-initialized before any field is assigned. This
prevents padding or unused fields from becoming accidental input.

### Insert operations

| Element | Operation ID | Position | Payload | Delivery |
| --- | --- | --- | --- | --- |
| `A` | `(A,1)` | `0` | one byte `0x01` | all roles |
| `B` | `(B,1)` | `1` | one byte `0x02` | `R_AB` and `R_FULL`; `R_FULL` order follows its delivery regime |
| `C` | `(C,1)` | `1` | one byte `0x03` | `R_AC` and `R_FULL`; `R_FULL` order follows its delivery regime |

For each insert, the harness sets the insert operation kind, operation ID,
visible position, payload pointer, and payload size. Timestamp, priority,
dependency count, and transform-function ID are zero. Unused dependency slots
and every other field remain zero.

### Move operations

| Role | State before move | Move | State after move |
| --- | --- | --- | --- |
| `R_AB` | `[A,B]` | visible position `1` to `0` | `[B,A]` |
| `R_AC` | `[A,C]` | visible position `1` to `0` | `[C,A]` |
| `R_FULL` | all three elements | none | delivery-dependent |

Move operations are also zero-initialized. They set only the move kind,
operation ID, source position, and destination position. Their payload pointer
is null and payload size is zero.

The two version regimes are:

- `move-B-newer`: `move-B=(M,2)`, `move-C=(M,1)`;
- `move-C-newer`: `move-B=(M,1)`, `move-C=(M,2)`.

Timestamps are zero and do not decide ordering. Allocation failure is outside
this run. Position maps are absent. The native build compiles the actual CRABS
`ot_ordered_set.c` selected by the source manifest with the minimal
`harness/crabs_dependencies.c` dependency model. That dependency model returns
no `ot_data` position map. The claim therefore covers this exact no-position-map
dependency surface, not the whole CRABS integration.

### Reachability trace

Inputs are built only through this immutable operation trace:

```text
R_AB:   insert A; insert B; move B from 1 to 0
R_AC:   insert A; insert C; move C from 1 to 0
R_FULL: insert A; insert B; insert C    # delivery-bc
R_FULL: insert A; insert C; insert B    # delivery-cb
```

The harness must check every operation return value while building a state. A
construction failure makes that case not evaluable; it is not a convergence
counterexample because the required valid input was not produced.

## Independent rebuild and mutation boundary

No experiment input may be cloned with `crabs_ot_ordered_set_merge`, with the
existing regression `clone_set` helper, with materialization, or with any other
function under test. Such a clone could normalize or corrupt the input before
the measured merge.

For every case, including each parenthesization, the harness reconstructs
`R_AB`, `R_AC`, and `R_FULL` from the immutable operation trace in fresh
allocations. No result or allocation from one case is reused by another.

Immediately before every merge call the harness records canonical snapshots of
both operands. It then enforces:

- the source operand is unchanged whether the merge succeeds or rejects;
- on success, only the destination may change;
- on rejection, the destination is also unchanged;
- no source or destination shares owned payload or node storage with another
  independently rebuilt input.

A source mutation or illegal alias is an implementation-invariant failure. A
rejection of these successfully constructed valid states is a convergence and
availability counterexample. The before/after snapshots are retained.

## Normalization and explicit oracle

The normal form serializes, with explicit length prefixes and fixed byte order:

- every internal element ID, including a tombstone if one exists;
- payload length and payload bytes;
- deletion flag;
- `has_anchor` and anchor ID;
- placement-version ID;
- total count and visible count;
- head and tail boundary-link validity;
- for every adjacent pair, both `next` and reciprocal `prev` validity.

Normalization also emits the visible element order. It must not repair the
structure it observes.

For each of the four delivery/version configurations, all 12 permutation and
parenthesization results must be byte-identical. The independent visible-order
oracle is:

- `move-B-newer` -> `[B,A,C]`;
- `move-C-newer` -> `[C,A,B]`.

The oracle is stored in `obligation.json`; it is never inferred from the first
result produced.

## Outcome axes

Convergence, implementation invariants, safety, CBMC, and receipt validity are
separate axes. No parser may turn a tool problem into a subject failure.

`convergence_status`:

- `counterexample`: a valid native input merge rejects, results diverge within
  a configuration, or the explicit visible-order oracle is wrong;
- `no-counterexample-in-matrix`: all 48 native cases satisfy those checks;
- `not-evaluable`: required valid inputs or native execution evidence could not
  be produced.

`implementation_invariant_status`:

- `violation`: source mutation, illegal aliasing, forbidden destination
  mutation on rejection, broken linkage, or inconsistent count is observed;
- `no-detected-violation`: all declared native invariant checks pass;
- `not-evaluable`: the required checks did not complete.

`safety_status`:

- `violation`: a recognized ASan, LeakSanitizer, or UBSan diagnostic is present;
- `no-detected-violation`: all 48 sanitizer subprocesses exit successfully and
  contain no recognized diagnostic;
- `not-evaluable`: compilation, launch, timeout, output-limit, or unrecognized
  abnormal-exit failure prevents classification.

Each CBMC representative has `cbmc_status`:

- `counterexample`: the frozen named convergence assertion fails and CBMC
  produces its trace;
- `no-counterexample-at-bound`: bound sufficiency is proved and the named
  assertion succeeds at the frozen bound;
- `not-evaluable`: the bound, property identity, preprocessing, execution, or
  output cannot be validated.

`receipt_status` is `pass` or `block`. It says only whether the evidence bundle
is structurally and semantically trustworthy.

The aggregate `promotion_verdict` is:

- `PASS` only when convergence has no counterexample, invariants and safety
  have no detected violation, both CBMC representatives have no counterexample
  at their bounds, and receipts pass;
- `BLOCK` when any subject axis contains a counterexample or violation;
- `PARTIAL_NOT_EVALUABLE` when no subject failure is established but any
  required tool, case, bound, or receipt is not evaluable or is blocked.

`PASS` means only that this candidate may be considered for the next separately
authorized R3 decision. It is not product approval or operational authority.

## Planned evidence package

Implementation creates this sibling package without changing the existing
successful two-singleton evidence package:

```text
crabs-partial-knowledge-move-candidate-v1/
  README.md
  profile.json
  obligation.json
  case-manifest.json
  commands.json
  source-manifest.json
  tool-manifest.json
  cbmc-bound-manifest.json
  generator/cases.py
  harness/partial_knowledge_move.c
  harness/crabs_dependencies.c
  harness/cbmc_move_b_newer.c
  harness/cbmc_move_c_newer.c
  schemas/case-record.schema.json
  schemas/run-record.schema.json
  schemas/result-summary.schema.json
  schemas/cbmc-bound-manifest.schema.json
  scripts/validate_schema.py
  scripts/validate_semantics.py
  scripts/parse_sanitizer.py
  scripts/parse_cbmc.py
  fixtures/receipt-semantics/passing/complete-run.json
  fixtures/receipt-semantics/failing/wrong-denominator.json
  fixtures/receipt-semantics/failing/duplicate-case-id.json
  fixtures/receipt-semantics/failing/missing-case.json
  fixtures/receipt-semantics/failing/pass-with-rejected-merge.json
  fixtures/receipt-semantics/failing/wrong-expected-order.json
  fixtures/receipt-semantics/failing/sanitizer-violation-as-pass.json
  fixtures/receipt-semantics/failing/wrong-cbmc-property.json
  fixtures/receipt-semantics/failing/missing-raw-output-hash.json
  fixtures/receipt-semantics/failing/wrong-subject-digest.json
  fixtures/receipt-semantics/failing/inconsistent-summary-totals.json
  fixtures/receipt-semantics/failing/timeout-as-subject-failure.json
  run.py
  construction/fixture-validation.json
  construction/cbmc-discovery/
  construction/readiness-audit/
  evidence/runs.jsonl
  evidence/corrections.jsonl
  evidence/attempts/
```

`generator/cases.py` is the only matrix generator. It writes both
`generated/cases.json` and `generated/cases.h` from one in-memory canonical
list. The header contains the same ordered case IDs and parameters used by the
C harness. The semantic validator recomputes both forms and proves their
shared content digest. The C harness consumes the header; it does not generate
or reinterpret the matrix.

During a live attempt, generated files go under that new attempt directory.
They are compared with the frozen expected case-manifest digest before any
subject call. Generation uses a temporary file in the same attempt directory,
fsyncs it, and atomically renames it. No package material is rewritten by a
live run.

## Command and runtime contract

The package root is the command working directory. `commands.json` stores every
child process as a JSON argv array, never as shell text. It binds the concrete
absolute executable path, arguments, cwd, timeout, output limit, environment,
expected exits, parser, risk class, and allowed outputs.

Construction is not complete, and execution remains blocked, until
`commands.json` contains resolved paths with no glob, environment-variable,
shell, command-substitution, or placeholder expansion. The runner creates a
new attempt directory first, resolves the single typed attempt-directory token
used in output paths, writes `resolved-commands.json`, and freezes its digest
before launching a child process. Only `run.py` performs that typed
substitution; all executed argv arrays are concrete and retained in receipts.

The declared top-level invocation is:

```json
["/usr/bin/python3", "run.py", "execute", "--profile", "profile.json", "--commands", "commands.json"]
```

The Python executable and its bytes are also bound in `tool-manifest.json`.
`LANG=C`, `LC_ALL=C`, a package-private temporary directory, and a minimal
explicit `PATH` are recorded. Network access is forbidden. All subprocesses
run serially.

The compile contracts use:

```text
-std=c11 -O0 -g3 -Wall -Wextra -Werror -pedantic
```

The sanitizer build adds exactly:

```text
-fsanitize=address,undefined
-fno-omit-frame-pointer
-fno-sanitize-recover=undefined
```

The sanitizer environment is exactly:

```text
ASAN_OPTIONS=abort_on_error=1:detect_leaks=1:symbolize=0
UBSAN_OPTIONS=halt_on_error=1:print_stacktrace=0
```

After linking, the tool manifest records the resolved path, version, and
SHA-256 of GCC, `libasan`, `libubsan`, `libgcc_s`, libc, and the dynamic loader.
Changing any identity creates a new evidence epoch.

The sanitizer runner starts one subprocess per stable case ID so an abort in
one case cannot hide later cases. It recognizes only the parser-versioned
signatures `ERROR: AddressSanitizer:`, `ERROR: LeakSanitizer:`, and
`runtime error:`. A recognized diagnostic is a safety violation. An abnormal
exit without one of those signatures is not evaluable, not a safety finding.

## CBMC binding contract

Two CBMC harnesses call the actual ordered-set merge implementation:

- `cbmc_move_b_newer.c` fixes `R_FULL` delivery to `B-then-C` and the
  `move-B-newer` regime;
- `cbmc_move_c_newer.c` fixes the same delivery and the `move-C-newer` regime.

Each compares:

```text
merge(merge(R_AB, R_AC), R_FULL)
merge(R_AB, merge(R_AC, R_FULL))
```

Each harness has one uniquely worded convergence assertion that requires both
results to be equal and to match its explicit order oracle.

This plan deliberately does not invent numeric unwind depths or property IDs.
They depend on the completed harness and selected CRABS bytes. Package
construction must produce `cbmc-bound-manifest.json` before a live run. Until
that file passes semantic validation, CBMC and the aggregate run are
`not-evaluable`.

For each harness, construction performs and retains two discovery commands:

- an argv-array invocation of CBMC 6.11.0 with `--function main --show-loops`;
- the same closed source list with `--function main --show-properties`.

The bound manifest binds:

- CBMC executable path, version, and SHA-256;
- subject, dependency-shim, harness, and command-manifest digests;
- the full ordered source argv;
- every discovered loop ID;
- one positive integer unwind depth for every loop ID;
- a source-level explanation for each depth based on the three-element state;
- the exact named convergence property ID and assertion text;
- SHA-256 hashes of raw discovery stdout and stderr;
- the exact complete-check and target-property argv arrays.

No wildcard unwind, unnamed property, or unmatched discovered loop is allowed.
The semantic validator reruns discovery during preflight and requires an exact
loop/property match.

Each representative then has two required CBMC executions using
`--bounds-check`, `--pointer-check`, signed and unsigned overflow checks, and
conversion checks:

1. a complete bound-sufficiency run uses the frozen `--unwindset` and
   `--unwinding-assertions` without filtering to the target property; every
   unwinding assertion must succeed;
2. a target run uses the same bounds plus `--property` with the exact frozen
   convergence property ID and retains the counterexample trace when it fails.

Target success cannot compensate for an unproved unwind. Exit zero, the exact
named property marked `SUCCESS`, `VERIFICATION SUCCESSFUL`, and a successful
bound-sufficiency run mean `no-counterexample-at-bound`. A nonzero result with
the exact named target marked `FAILURE` means `counterexample`. A timeout,
output-limit breach, preprocessing or parser failure, loop drift, unwinding
failure, missing property, other-property-only failure, or ambiguous output is
`not-evaluable` and remains visible separately.

## Receipt semantics and adversaries

JSON Schema rejects malformed structure and unknown fields. The semantic
validator independently reconstructs meaning. It must reject every named
failing fixture and accept the complete passing fixture before generation,
compilation, or subject execution.

At minimum it proves:

- subject commit, source bytes, plan snapshot, tool identities, commands,
  obligation, and generator digests match the captured run snapshot;
- there are exactly 48 unique native rows and 48 matching sanitizer rows;
- stable case IDs cover the exact Cartesian product and no other cases;
- each row's oracle and reported classification agree with raw facts;
- the two CBMC rows use the frozen harness, bounds, and property IDs;
- all referenced raw stdout/stderr files exist and match their size and hash;
- summary counts are recomputed from the immutable case ledger;
- `receipt_status` and `promotion_verdict` follow the outcome rules;
- timeouts, output overflow, and tool failures are never labeled as subject
  failures;
- no PASS contains a rejection, divergence, invariant or sanitizer violation,
  missing case, unproved CBMC bound, or receipt blocker.

Schema success alone can never set `receipt_status: pass`.

## Attempt, rerun, and correction lifecycle

At run start, `run.py` captures the subject commit and source hashes, the plan
SHA-256, all package material hashes, tool/runtime identities, and the resolved
command manifest. The snapshot digest is rechecked before the terminal record.
Any drift makes unfinished dependent checks not evaluable.

The run ID is:

```text
<UTC-start-with-microseconds>__<first-12-hex-of-snapshot-digest>
```

The runner atomically creates `evidence/attempts/<run-id>/`. If that directory
already exists, it blocks before any child process. It never overwrites or
deletes an earlier attempt. An explicit rerun uses `--rerun-of <prior-run-id>`,
gets a new UTC start and run ID, and records the prior run as provenance; it
does not mutate the prior run.

Each attempt owns:

```text
snapshot.json
resolved-commands.json
generated/cases.json
generated/cases.h
build/native-harness
build/sanitizer-harness
raw/<phase>/<case-or-representative>.stdout
raw/<phase>/<case-or-representative>.stderr
cases.jsonl
tool-runs.jsonl
result-summary.json
receipt-validation.json
REPORT.md
```

Rows inside an attempt are append-only. After final semantic validation, U9
appends one terminal record to `evidence/runs.jsonl`. Interpretive corrections
append to `evidence/corrections.jsonl` with the original run ID, corrected
field, reason, owner, timestamp, and evidence reference. They never rewrite a
case, raw output, summary, or historical terminal record.

On success, all attempt evidence is retained. On failure or interruption,
partial evidence and a terminal interruption/not-evaluable receipt are
retained; only an unreferenced package-private temporary file may be removed.

## Normalized construction and run graph

There are two authority-separated layers. Construction materializes and tests
the experiment package. A later live run consumes that immutable package.

### Construction units

| Unit | Work | Dependencies | Material writes | Done condition |
| --- | --- | --- | --- | --- |
| `C0` | Materialize obligation, schemas, generator, harnesses, parsers, runner, and manifests. | none; the repaired plan is the frozen controlling input | only the planned sibling package, excluding `evidence/attempts` | All planned files exist; source CRABS remains unchanged. |
| `C1` | Prove the semantic validator with the passing fixture and every named adversarial fixture. | `C0` | fixture-validation receipt in the package | Passing fixture accepted; every failing fixture rejected for its intended reason. |
| `C2` | Discover and freeze concrete tool identities, concrete argv arrays, CBMC loop IDs, property IDs, numeric unwind depths, and their justification. | `C0` | `commands.json`, `tool-manifest.json`, `cbmc-bound-manifest.json` | No placeholder or unmatched loop/property remains; bound-sufficiency rehearsal passes. |
| `C3` | Run a non-subject package preflight and readiness audit. | `C1`, `C2` | construction validation receipt only | Plan contract passes; runtime admission remains separately pending explicit selection. |

The current product-construction frontier is `C0`. This repaired plan does not
authorize it. `C2` is the exact causal blocker to calling the CBMC portion
executable; it must record real values rather than guessed ones.

### Live-run units

| Unit | Work | Dependencies | Execution outputs | Done condition |
| --- | --- | --- | --- | --- |
| `U0` | Create the unique attempt, capture and freeze inputs, and recheck the construction receipts. | `C3`; explicit run authorization is a separate admission gate | new attempt snapshot only | Snapshot and runtime admission pass. |
| `U1` | Re-run schema and semantic adversarial fixtures. | `U0` | fixture results in attempt | Passing fixture accepted; all adversaries rejected. |
| `U2` | Generate `cases.json` and `cases.h`; compare their common digest with the frozen expected digest. | `U1` | attempt generated files | Exactly 48 unique cases and header/JSON equivalence pass. |
| `U3` | Compile native and sanitizer harnesses and verify linked runtime identities. | `U2` | attempt binaries and compile logs | Both builds succeed with exact flags and identities. |
| `U4` | Run all 48 native cases and append every row. | `U3` | native raw logs and case rows | Every case has one classified native result. |
| `U5` | Run all 48 sanitizer subprocesses and append every row. | `U3` | sanitizer raw logs and case rows | Every case has one classified sanitizer result. |
| `U6` | Re-run CBMC loop/property discovery and compare it with the frozen bound manifest. | `U0` | discovery raw logs and comparison receipt | Exact match, or CBMC is not evaluable. |
| `U7` | Run bound-sufficiency and named-property checks for both representatives. | `U6` | CBMC raw logs, traces, and rows | Both representatives are classified. |
| `U8` | Validate all records, recompute axes and totals, and perform final snapshot-drift check. | `U4`, `U5`, `U7` | attempt summary and validation receipt | One truthful aggregate verdict; no omitted dependent check. |
| `U9` | Append the terminal run record and write the natural-language report. | `U8` | one `runs.jsonl` row and attempt report | Record hashes the complete retained attempt and states the claim ceiling. |

The complete edge set is:

```text
C0 -> C1
C0 -> C2
C1 -> C3
C2 -> C3
C3 -> explicit selection/admission gate -> U0
U0 -> U1
U0 -> U6
U1 -> U2 -> U3
U3 -> U4
U3 -> U5
U6 -> U7
U4 -> U8
U5 -> U8
U7 -> U8
U8 -> U9
```

The combined graph is acyclic and has one initial ready unit, `C0`. The live
subgraph begins only at `U0` after the separate gate. After `U3`, native and sanitizer
checks are independent; CBMC discovery is also independent after `U0`. The
runner schedules ready units in the table order and uses one process at a time.
A subject finding does not suppress other already-admitted non-effectful checks:
each phase collects all of its cases. A tool/infrastructure failure makes only
its dependent checks not evaluable while independent checks continue. U8
records every dependent check, including `not-evaluable`; it never omits one.
These are completion dependencies, not PASS dependencies: a classified failure
or inherited blocker completes its unit and is carried into U8 and U9. A unit
whose prerequisite did not produce usable inputs emits a typed
`not-evaluable` row without launching its subject command.

Construction material writes and live execution outputs are disjoint. Live
units may write only the newly created attempt directory until U9, when the
runner may append exactly one terminal row to `evidence/runs.jsonl`. Package
sources, manifests, prior attempts, the plan, and CRABS are immutable during a
live run.

## Resource ceilings

- Native: 5 seconds per case and 60 seconds aggregate.
- Sanitizers: 10 seconds per case and 120 seconds aggregate.
- CBMC: 180 seconds for each discovery, bound-sufficiency, or target command.
- Captured stdout and stderr: 4 MiB each per process.
- Parallelism: one child process at a time.
- Network: forbidden.

An individual timeout or output overflow does not terminate collection of
independent cases. It is retained and classified as not evaluable. Failure to
create the immutable attempt, snapshot drift, an unsafe write target, or an
invalid runtime identity stops launches because later evidence would not bind
to the declared experiment.

## Counterexample preservation

For every subject finding, retain:

- stable case ID and complete matrix parameters;
- operation trace and pre-merge normal forms;
- each merge return value and both post-call operand normal forms;
- the smallest lexical reproducing permutation and parenthesization;
- expected and actual visible orders;
- invariant name and failing bytes when applicable;
- sanitizer signature, or CBMC property ID and counterexample trace;
- raw stdout/stderr size and SHA-256.

Minimization, diagnosis, and CRABS repair are separate later work. This run may
not change source, omit a case, retry into PASS, or weaken the oracle.

## Product construction and operational residue

Product construction:

- current stage: repaired definition/run-plan prototype;
- next runnable stage after separate authorization: `C0`, the evidence-package
  implementation prototype;
- later stages: fixed product-test candidate, current run evidence, then a
  separate owner product decision;
- product approval: absent.

Operational support:

- the CRABS topic branch is already pushed; this does not affect experiment
  readiness or grant merge/publication authority;
- exact GCC, sanitizer-library, Python, and CBMC identities must be frozen by
  `C2`; this directly blocks live execution but not independent package coding;
- opening a pull request, initializing OpenABE, whole-project builds,
  publication, migration, release, and deployment are outside this plan and
  remain unauthorized.

Pending operational work cannot hide runnable construction work. Only the
exact tool/command/bound identities in `C2` may block the live experiment,
because those bytes and bounds are part of its evidence claim.

## Promotion and stop rules

- A convergence counterexample, invariant violation, sanitizer violation, or
  named CBMC counterexample sets `promotion_verdict: BLOCK` and routes to a
  separately planned diagnosis/repair from the preserved smallest case.
- With no subject failure but any unavailable tool, unproved CBMC bound,
  incomplete case, drift, or receipt blocker, report
  `PARTIAL_NOT_EVALUABLE`. Repair only the evidence mechanism unless a subject
  finding exists.
- `PASS` permits only a later owner to consider the next R3 candidate:
  serialization migration plus position-map and failure-path testing.
- Do not begin TLA+/TLC or Lean formalization until a separately selected owner
  decides this concrete rule and its abstraction are stable enough.
- No result from this plan grants implementation, acceptance, product approval,
  publication, release, deployment, or external-effect authority.
