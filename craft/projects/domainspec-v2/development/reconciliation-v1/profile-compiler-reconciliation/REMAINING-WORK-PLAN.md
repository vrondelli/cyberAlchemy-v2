---
title: Remaining DomainSpec CLI construction plan
status: complete-candidate-construction
updatedAt: 2026-09-15
owner: DomainSpec product owner
scope: Remaining PCR-06 through PCR-14 construction
authority_effect: none
---

# Remaining DomainSpec CLI construction plan

This is the continuation plan after the selected Workflow recovery policy, not
a restart of [PLAN.md](PLAN.md) or a claim that the CLI is complete.
The user requested the same definition-first planning for the remaining work.
The [completion ledger](CLI-COMPLETION.md) owns progress and the full denominator;
the [dependency checklist](remaining-work-plan.json) makes this plan inspectable.
Current continuation: R01–R18 have recorded completion. No construction task in
this plan remains dependency-ready.
[R10 qualification](R10-QUALIFICATION.md) closes all13 Python native cells and
the stronger selected Python verification path. [R11 qualification](R11-QUALIFICATION.md)
closes all13 Rust native cells and the selected Rust Cargo/CLI route.
[R12 qualification](R12-QUALIFICATION.md) closes the fresh 39-cell native join
without claiming compound-model coverage. [R13 qualification](R13-QUALIFICATION.md)
closes the two-feature compound corpus across all three native targets.
[R14 qualification](R14-QUALIFICATION.md) closes all 17 backend relationship
signatures, 44 frozen obligations, 12 cross-cutting properties and 11 mutation
specifications. [R15 qualification](R15-QUALIFICATION.md) closes legacy omission,
explicit three-language selection, both reconciled output views, seven public
entry points and three non-writing migration helpers. [R16 qualification](R16-QUALIFICATION.md)
binds a byte-reproducible installable archive and two passing clean-consumer
runs. [R17 qualification](R17-QUALIFICATION.md) proves the shipped guide and
complete example through installed three-language build, exact verification,
native compilation, execution, and drift rejection. [R18 review pack](R18-CANDIDATE-REVIEW.md)
binds the exact candidate and closes the planned technical denominator without
claiming separately owned review or release effects.
Historical baseline prose below describes the initial planning snapshot, not a
reason to restart completed work. The current scheduling and exact task scopes
are in [PARALLEL-EXECUTION.md](PARALLEL-EXECUTION.md).

## 1. Outcome and current evidence

Deliver an installable, opt-in DomainSpec compiler candidate that generates
working native code for all 13 backend metatypes in TypeScript, Python and Rust.
The selected meaning, profile, source roles, dependencies and output layout must
agree across supported entry points, native execution and installed use.

The denominator remains **13 metatypes × 3 languages = 39 realization cells**,
plus entry-point, compound-model, relationship, compatibility and package checks.
A supported-input contract must accompany each cell. A bounded existing renderer
cannot silently reduce the previously promised language/type surface.

| Current surface | Reuse now | Remaining construction |
| --- | --- | --- |
| Workflow source, bindings and recovery | Distinct occurrences, exact action/result bindings, ordered or unconstrained recovery over needed compensations. | Native forward orchestration, runtime binding materialization, outcome-to-journal bridge, generated recovery output and independent observation. |
| Interface | Named public contracts, pure normalizers, typed member signatures and version eligibility. | Exact public-contract Mapping endpoints, configured artifact/import planning and CLI integration. |
| Other 11 TypeScript metatypes | Existing configured data/factory, Rule, Calculation, Query, Mapping, Policy, Event, Operation and State Machine generators. | Join their supported-input contracts and dependencies; close residual promised inputs before declaring 13/13. |
| Shared generation and CLI | Checked graph snapshots, legacy instantiation/build paths, accepted layout behavior. | One reconciled selection/artifact plan through public commands and supported APIs, with exact native imports. |
| Python/Rust | Historical realization references and native test infrastructure. | Reconciled generic adapters and fresh per-cell behavior evidence; reference presence is not generator parity. |
| Distribution | Existing CLI package and archive mechanisms. | A freshly built reconciled archive, clean installation, accurate docs and installed corpus. |

Current baseline is reported evidence, not a test rerun by this planning turn:
38/38 focused Workflow checks and source typecheck passed; shared regression had
412 passes and two Cargo timeouts; the two complete affected suites passed 19/19
on serial retry. See [the exact report](WORKFLOW-RECOVERY-POLICY.md).
Never rewrite that history as an initially clean 414/414 run.

Source review also confirms that the public command parser currently exposes
legacy instantiation/build selections, while configured Operation generation and
named Interface generation remain separate helpers. They are reusable pieces,
not proof of a reconciled public command.

## 2. Decisions to preserve

- Domain concepts are not database tables or generic records. Entity identity,
  Value Object equality, Enum cases and public contract identity stay separate.
- Keep selected TypeScript factory/arrow/structural forms. Python dataclasses,
  Enum/Protocol and Rust structs/enums/traits retain their native profile forms;
  there is no universal ban on classes across languages.
- Keep scalar, named concept, optional, list, set, sum and reference distinctions.
  Do not implicitly dereference an identity, traverse an optional or flatten a
  nested concept. Selected exact UInt64 behavior is not a new owner decision.
- Policy composes declared Rules and selects declared targets; it does not
  execute a target or duplicate inline business predicates.
- Mapping accepts explicit inputs, including already-computed values. It does
  not discover or call a Calculation because a field needs one.
- Operation owns guards and its explicit atomic state/outbox boundary. Workflow
  composes Operations, not a second transaction or a hidden business-rule engine.
- Workflow step occurrence identity is distinct from Operation identity.
  Recovery dependencies order only needed compensations. Empty dependencies
  mean no semantic order, not parallel execution; reverse completion breaks ties.
  Unknown commits require reconciliation, not omitted work or premature intent.
- Interface owns named public contracts; it does not embed domain Entities or
  flatten all exposed fields into one object. Preserve selected same-major,
  provider-at-least-consumer eligibility, explicit exact mode and old policies.
- State Machine trigger Events and output intents are distinct. A transition
  reducer does not publish an Event or execute an Operation.
- Preserve selected feature-relative source roles and bounded module-root
  override. Existing numeric realization profiles and application-layout/v1
  are not aliases for the broader reconciled configuration.
- No new canonical relationship verb, SFOL revision, AlchLang syntax, default
  cutover, production provider, admission or publication is selected here.

## 3. The construction contract for every task

Each task uses the same sequence:

1. **Definition:** describe input/output, identity, preconditions, failure states,
   effects, non-effects, supported bounds and counterexamples. Reuse an existing
   exact definition unless the task really changes its meaning.
2. **Ontology scaffold:** bind those concepts to existing definitions, graph
   nodes, canonical relationships and compiler-owned references. Keep runtime
   sequencing/binding edges separate from canonical domain relationships.
3. **Direct DomainSpec example:** author the smallest positive and negative
   fixtures that exercise the definition, without relying on AlchLang.
4. **Checked graph and native prototype:** lower checked meaning into actual
   native artifacts. Retain source/profile/selection identities and imports.
5. **Independent verification:** typecheck/compile the output, observe its native
   form independently, execute it and reject causal semantic mutants.
6. **Bounded join:** run the affected regression, record exact bytes and failures,
   and update the completion ledger without promoting a partial result.
7. **Product review:** only the final exact tested candidate reaches review.
   Product approval is separate from operational authority.

Before each implementation task, capture current selected preimages, state an
exact file allowlist and test set, and verify the prior task's evidence still
applies. A proposed path below is a touchpoint, not a blanket write authorization.
New or revised semantic definitions must precede their implementing code.

Every task receipt must identify: source and contract versions, ontology selectors,
candidate/output identities, native toolchain, positive/negative/observer results,
initial failures and retries, exclusions, remaining dependencies and authority
effect. An unavailable check is not_evaluable, never PASS.

## 4. Five decision layers

These layers resume the existing PCR roadmap; they do not renumber or reset its
historically completed L0. Here L0 is the smallest proof of the **remaining**
integration gap.

| Layer | After this layer, we know whether… | Minimum proof and user outcome | Main risk and cost | Exit / advancement |
| --- | --- | --- | --- | --- |
| L0 — Native Workflow | The checked recovery model survives real forward execution. | One generated three-step Workflow with success, partial failure and unknown commit. | Outcome and occurrence collapse; typed runtime binding and native tests. | R01–R03 pass without hidden compensation execution. |
| L1 — Coherent TypeScript CLI | All 13 selected types form one usable generated project. | Named public mappings plus one shared plan through supported entry points. | Disconnected generators, wrong imports, unsupported input gaps; integration is the main cost. | R04–R09 close 13/13 and the entry-point matrix. |
| L2 — Native language parity | The same selected domain meaning survives all three native forms. | Python and Rust adapters plus a 39-cell outcome corpus. | Token translation, mutable values, precision/error drift; native observers/toolchains dominate. | R10–R12 close all 39 cells without missing lanes. |
| L3 — Composed semantics | The pieces remain correct when combined. | Multi-feature commerce model and all applicable backend relationship obligations. | Interaction bugs hidden by isolated examples; adversarial corpus is the main cost. | R13–R14 close composition and semantic controls. |
| L4 — Installable candidate | A user outside this workspace can reproduce the promised result. | Explicit migration, reproducible archive, installed commands and tested documentation. | Workspace-only success and silent breakage; packaging/installed tests dominate. | R15–R18 produce an exact candidate for review, not a release. |

Boundary heuristic: layer value is the decision unlocked, user-visible outcome
and risk reduced; cost is implementation, verification and coordination.
Stop each layer at its smallest convincing proof. Do not add production brokers,
a durable recovery service or editor work to prove a compiler layer.
Later layers preserve every earlier guarantee. Independent tasks may be prepared
before a layer closes, but cannot claim that layer's exit evidence early.

## 5. Bounded implementation backlog

### L0: generated Workflow

**R01 — Outcome and journal contract.** Reuse the selected recovery definition,
checked bindings and Operation outcome contract. Specify success, declared
rejection, known precommit failure, indeterminate commit, cleanup failure and
binding/materialization failure separately. Define which completed prefix is
retained, how execution/failure occurrence IDs enter, and when no recovery intent
may be issued. Also cover malformed or throwing Operation dependencies and
errors after all forward steps completed: do not invent a failed step to fit the
current planner. A materially new recovery meaning is a decision gate, not a
silent decoder extension.

Definition/ontology output: a candidate orchestration contract and a source map
from outcomes to observations, completed occurrences, results and recovery.
Exit: table-driven cases for every outcome and failure position, reviewed against
the actual generated Operation contract. No required user decision is known at
entry; this analysis checks the remaining boundary.

**R02 — Typed runtime binding materialization.** Depend on R01. Materialize only
checked Workflow inputs and available earlier results into ordinary Operation
arguments and Event inputs. Snapshot or normalize at the declared boundary;
preserve exact integers, nested values, optional/list/set/sum forms and occurrence
identity. Recoverable arguments must remain bound to the completed prefix and
pinned action, not to later mutable caller state.

Output: checked materialization support and tests under the Workflow/value
generation boundary. Exit: wrong type, wrong occurrence, missing input, future
result, invalid returned value, accessor/coercion, mutation and repeated-Operation
controls. No Calculation, mapper, lookup, retry or guard bypass is inferred.
If materialized recovery values need a new carrier, version it explicitly rather
than changing the meaning or hash of the existing expression-only intent.

**R03 — Native orchestration and independent observer.** Depend on R02. Emit a
configured TypeScript Workflow function with exact imports to generated forward
Operations. Await each selected forward occurrence; call no later occurrence after
failure or uncertainty. Preserve Operation guards, its one atomic port boundary,
terminal outcomes and caller-supplied execution identity. Integrate the selected
pure recovery algorithm and materialized bindings through the R01/R02 contract.

Smallest fixture: reserve stock, capture payment, submit order; two compensations
with both constrained and unconstrained variants. Test success; failure before
any commit; failure after one/two commits; indeterminate commit at each position;
same Operation in distinct occurrences; inactive dependency; no compensation;
and invalid dependency outcomes. Verify exact call order/count and no recovery
dispatch. Mutants must catch skipped awaits, reordered steps, wrong same-typed
arguments, stale action hashes, false committed prefixes and compensation calls.
No native source interpreter or copied fixture is a substitute for generation.

Likely touchpoints: new configured Workflow planner/source/observer and focused
tests, reusing [bindings](../../../impl/cli/src/typed-operation/workflow-bindings.ts),
[recovery](../../../impl/cli/src/typed-operation/workflow-recovery.ts) and
[Operation generation](../../../impl/cli/src/generation/configured-operations.ts).
Exit: native compile, independent observation, execution and focused/regression
evidence. Pure planning remains separately testable.

### L1: complete TypeScript and integrate the CLI

**R04 — Named public-contract Mapping bindings.** Runnable independently of R01.
Define an explicit endpoint identity that selects the Interface, named contract
and applicable member position without flattening source identity. Bind inputs
and output fields to exact public/domain types. Retain canonical maps-from/maps-to
and exposes closure separately from compiler-level field/call bindings.
No new domain edge or implicit calculation. Exit: positive shared-contract and
multi-input examples; rejection of ambiguous endpoints, cross-Interface swaps,
direct/transitive Entity embedding and same-shaped wrong-contract substitution.
A new authored carrier is versioned; old unqualified mappings stay unchanged.

**R05 — Native public Mapping and configured Interface artifacts.** Depend on R04.
Reuse named Interface normalization and the Mapping value emitter; generate
correct imports/exports and descriptors with selected eligibility policy.
The Interface remains a structural contract, not a transport server or generated
member implementation. Exercise exact amounts, shared Value Objects/Enums,
nested public contracts, empty data, optional/list/set/sum payloads and repeated
local names in different Interfaces. Exit: independent native observation,
compile-time request/result negatives, executable mapping/normalization tests,
no hidden calculation/transport, and legacy rejection/compatibility tests.

**R06 — Close TypeScript supported-input coverage.** Depend on R03 and R05.
Create a per-metatype obligations table from current exact source selections,
not from historical 39-cell registration. For each of the 13 types, account for
accepted constructors/operators, nesting, references, errors, output forms,
dependencies and native controls. Resolve residual promised inputs with bounded
definition-first successor tasks before marking this task complete. Specifically
audit full-width authored Calculation literals and source admission, factory/Rule
version combinations, structured Query/Mapping inputs, and newly joined Event,
Workflow and Interface boundaries. A missing obligation cannot become an
unsupported-input waiver merely because the current renderer rejects it.

Exit: 13/13 reconciled TypeScript cells with explicit supported bounds, native
form plus behavior evidence, and no unaccounted promised input. This is an
integration gate, not a numerical count of generator filenames.

**R07 — Shared resolved artifact plan.** Depend on R06; its contract design can
start earlier. Reuse checked graph snapshots and current compilation selection.
Define one immutable build record containing exact semantic/profile/language/
layout versions, qualified selectors, source dependencies, native exports,
leaf imports, support artifacts and verification obligations. Compose existing
generators rather than creating a second parser or retaining independent
conflicting path authorities. Identical shared artifacts may be deduplicated
only with matching identity/content; conflicting definitions fail before writes.

Exit: deterministic complete TypeScript project in two roots; source removal
after snapshot does not change generation; forged or stale snapshots/selections
reject; cross-feature duplicate names remain distinct. Pin the selected
definition sources needed outside the development checkout.

**R08 — Public commands and API integration.** Depend on R07. Add an explicit,
versioned reconciled selection to the existing instantiation/project build/
verification surfaces and compiled-snapshot APIs where promised. Confirm the
exact option/schema with the actual parser; do not advertise an unimplemented
flag. Numeric realization profile, architectural selection and output layout
remain separate. All entry points consume the shared plan.

Exit: single-node closure equals that node's planned closure in project mode;
whole-project, source/snapshot and supported application builds agree on
semantic selections and native modules, with envelope differences accounted for.
Unsupported entry-point/profile combinations reject explicitly; no fallback to
the legacy renderer and no default cutover. Test user-visible diagnostics and
no output writes on rejected selection.

**R09 — Artifact safety and coherent project qualification.** Depend on R08.
Verify leaf-import resolution, exported symbol collisions, architecture direction,
reserved names, path traversal, portable case/Unicode aliases, symlink escape,
conflicting support files and target overwrite behavior. Exercise the existing
atomic output mechanism with interrupted/conflicting publication to local disk;
never erase unrelated target files during rollback. Source ordering and module
root changes must not change domain meaning. Exit: public TypeScript
13-type project builds, native imports resolve, verify detects tampering, and
all supported entry points pass their positive/hostile cases.

Likely touchpoints for R04–R09: named Interface/Mapping decoders and renderers,
configured planners, shared generation contracts, project/instantiation planners,
output layout, CLI parser/public exports, observers and matching tests. Recheck
dirty preimages before touching these actively modified integration files.

### L2: Python, Rust and the complete realization matrix

**R10 — Python adapters.** Depend on R09. Implement in three bounded groups:
data/factory/Enum; pure Rule/Calculation/Query/Mapping/Policy; Event/Operation/
State Machine/Workflow/Interface. Translate selected semantics into native
dataclasses, Enum, functions and Protocol/package imports; preserve factory
validation, immutable nested values, explicit effects and await behavior.
Reject Python-specific Bool-as-integer confusion and mutable default/collection
leaks. Preserve exact numeric bounds and source occurrence order rather than
depending on a native container's incidental order. Exit: all 13 Python cells,
independent native observation, imports and shared positive/hostile behavior.

**R11 — Rust adapters.** Depend on R09, independent of R10. Use native structs,
enums, factories, functions and traits with explicit crate/module wiring.
Specify borrowed versus owned inputs, immutable returned values, error outcomes,
checked arithmetic and Eq/Hash rules appropriate to each concept. No broad derive
may substitute structural Entity equality for declared identity. Reject unsafe
narrowing, cloning that loses identity/binding, wrong enum payloads and module
visibility errors. Keep effects and async/provider dependencies explicit.
Exit: all 13 Rust cells, native structural observation, Cargo compilation and
shared behavior with Rust-specific compile-fail controls.

**R12 — Join all 39 realization cells.** Depend on R10 and R11. For every type
and language, bind a supported-input contract, generator, independent observer,
native compile/import result, semantic cases and negative controls. Compare
normalized domain outcomes, not byte-identical native source or incidental stack
traces. Normalization must preserve meaningful failures, collection order,
identity and uncertainty. Exit: complete 39/39 accounting with no hidden skip or
missing provider. A catalog check or common fixture alone cannot satisfy a cell.

### L3: compound model and semantic assurance

**R13 — All-type commerce corpus.** Depend on R12. Assemble direct DomainSpec
fixtures with multiple features and every metatype: Entity identity and embedded
entities where supported, Value Objects, Enums, nested field constructors and
references; declared Rules; explicit Calculation-to-Mapping values; Query reads;
Policy target selection; atomic Operations and Events; State Machine triggers/
output intents; Workflow failure/recovery; named public Interface mappings.
Keep reference identity separate from persistence/existence and ensure every
import has an exact graph target. Exit: generated and executed scenarios in
three languages, including failure/uncertainty paths and cross-feature names.

Preparation can start now, but corpus completion requires the actual generated
cells. It is not permission to introduce a relationship merely to make an example
look connected.

**R14 — Semantic and relationship assurance.** Depend on R13. Account for all
17 applicable backend relationship signature rows in the parent scope, using
the frozen relationship authority; distinguish them from the broader 31-signature
registry. Each row needs applicable positive/negative evidence or its exact
existing exclusion, never a new convenient exclusion.

Required families: non-collapse, orthogonality, property/oracle tests, compiling
mutants, malformed-data/resource bounds and cross-language behavior. Mutate one
meaning at a time; include same-typed field/occurrence swaps that still compile.
Layout/root/name changes must preserve outcomes where semantically irrelevant;
list order, explicit dependency order and occurrence identity must not be erased.
Exit: traceable obligation-to-test matrix, independent oracles, and no unresolved
semantic contradiction hidden by representation checks.

### L4: compatibility and installed product

**R15 — Compatibility and migration qualification.** Depend on R14. The opt-in
policy starts in R08; this task qualifies it across every supported old/new
source, profile, layout and public entry point. Reuse explicit existing
State Machine/Workflow migrations and version rejection; add precise diagnostic
paths for new public mappings/selection. Never rewrite source during a build.
Exit: old archives/default outputs preserved where promised, explicit new
selection works, stale/unknown combinations fail before writes, and migrations
produce reviewable exact changes. Consumer cutover remains separate.

**R16 — Reproducible local installation package.** Depend on R15. Build an exact
archive from selected source and pin its package/runtime dependencies. Include
every required contract, native support module, exported declaration and profile
input; eliminate dependence on development directories or absolute workspace
paths. Generate twice and explain any allowed nonsemantic metadata difference.
Install into a clean temporary consumer outside the checkout. Exit: deterministic
payload manifests, correct exported/bin surfaces, no source/dist drift, no
undeclared workspace imports and explicit required native tools.

**R17 — User documentation and installed acceptance corpus.** Depend on R16.
Write user-facing quickstart, source/type examples, profile/layout configuration,
commands, diagnostics, migration guide and supported runtime boundaries from
tested behavior. Documentation explains actual generated code; internal decision
queues remain in planning records. Run documented commands from the installed
archive, compile and execute the selected three-language corpus, test error
messages and verify modified outputs are rejected. Exit: docs and commands agree;
no hidden environment setup or private workspace source is required.

**R18 — Exact candidate review pack.** Depend on R17. Join all PCR requirements:
13 TypeScript types, 39 native cells, entry points, compound model, relationships,
semantic controls, compatibility and installed behavior. Recheck exact candidate
bytes, unresolved defects and evidence currentness; commission independent review
only through separately authorized scope. Technical preparation of the review
pack does not manufacture review, approval, admission or a release decision.
Exit: owner can inspect one reproducible candidate and its complete evidence;
actual product approval, if later requested, binds those exact bytes.

## 6. Dependency and scheduling backbone

| Task | Layer | Requires | PCR coverage |
| --- | --- | --- | --- |
| R01 | L0 | Current checked Workflow/Operation contracts | PCR-06 |
| R02 | L0 | R01 | PCR-06 |
| R03 | L0 | R02 | PCR-06 |
| R04 | L1 | Current named Interface/Mapping contracts | PCR-06 |
| R05 | L1 | R04 | PCR-06 |
| R06 | L1 | R03, R05 | PCR-06 |
| R07 | L1 | R06 | PCR-07 |
| R08 | L1 | R07 | PCR-07, PCR-13 |
| R09 | L1 | R08 | PCR-07 |
| R10 | L2 | R09 | PCR-08 |
| R11 | L2 | R09 | PCR-09 |
| R12 | L2 | R10, R11 | PCR-10 |
| R13 | L3 | R12 | PCR-11 |
| R14 | L3 | R13 | PCR-12 |
| R15 | L4 | R14 | PCR-13 |
| R16 | L4 | R15 | PCR-14 |
| R17 | L4 | R16 | PCR-14 |
| R18 | L4 | R17 | PCR-14 |

Construction sequence R01–R18 is complete. Any product-owner review, default
cutover, admission, publication, release, deployment, or AlchLang reconciliation
is a separate successor scope. The earlier parallel preparation lanes for R09, R13 and
R14 are now joined into their completed parent tasks. Their historical results
remain preparation evidence and do not replace the current R09, R13 or R14
qualifications.
DomainSpec R01–R18 remains the full objective before AlchLang reconciliation.
Do not wait on publication or historical receipts to prepare a dependency-ready
construction unit.

## 7. Verification policy and retained guarantees

- Keep focused tests fast and run native/expensive suites with an explicit
  bounded concurrency strategy. The recorded Cargo timeouts motivate measurement,
  not a claim that concurrency was conclusively the cause. Preserve first-run
  failures and separate retries; do not raise timeouts to hide a defect.
- Every generated target requires compile/import checks and execution, plus an
  observer not implemented as a call back to the same renderer.
- Positive behavior, expected rejection, semantic mutant detection and runtime
  uncertainty are separate test outcomes.
- Each unit runs its exact affected suites; each layer closes with the cumulative
  required evidence. Final package qualification uses a fresh recorded bounded
  run, not a sum of old passing counts.
- Preserve historical baseline, legacy defaults and reference fixtures. Reject
  unsupported new source in old consumers instead of silently reinterpreting it.
- Recheck graph/action/profile bindings, inert input handling and owned-value
  semantics at every new boundary. A matching digest is not semantic proof.
- No class-based TypeScript Entity replacement, hidden calculation in Mapping,
  inline Policy rule engine, State Machine effect dispatch, Workflow transaction,
  automatic compensation execution or indeterminate-to-failure conversion.
- Test obligations from [the original verification contract](PLAN.md#7-verification-contract)
  and parent DSR work remain in force. New SFOL/EVF or Alch reconciliation is not
  performed as a shortcut to close this compiler plan.

## 8. Product construction versus operational support

Product construction is R01–R18, including the software package and its installed
tests. Operational work around it has separate owners and exact blocking scope:

| Support/residue | Owner | Affected stage | Blocks only when |
| --- | --- | --- | --- |
| Dirty preimage and active-writer coordination | Implementing agent and existing file owner | Exact touched task | Overlapping bytes cannot be safely preserved. |
| Pinned toolchain and test scheduling | Toolchain/test owner | Native proof in R03, R05, R09–R17 | A required native lane is actually unavailable; independent definition/fixture work continues. |
| Temporary dependency links and test-root cleanup | Implementing agent | That task's validation | The exact dependency is required; remove only owned temporary links/roots afterward. |
| Missing historical receipts | Evidence owner | A selected historical claim | That receipt is a real prerequisite; fresh construction need not recreate history. |
| External store, broker, durable intent registration or recovery delivery | Runtime/provider owner | Separate runtime product, not these compiler tasks | Only if a later explicitly selected runtime scope actually requires it. |
| Independent final review | Product owner/reviewer | After R18 candidate preparation | Review availability affects review, not earlier construction. |
| Publication, deployment, canonical admission and consumer cutover | Respective authority owners | Separate post-review effects | Not a construction prerequisite and never inferred here. |

## 9. Genuine decision triggers and scope boundaries

No currently unresolved choice blocks R01 or R04. Previously resolved choices
remain resolved; the old plans' historical next-task labels do not reopen them.

Pause only the affected task if evidence establishes a material choice:
- Existing Operation outcomes cannot be lawfully mapped to Workflow journal or
  terminal behavior without changing the approved recovery meaning.
- New public Mapping endpoint syntax would change domain relationships, erase
  public contract identity or reinterpret an old source version.
- A promised input cannot be realized under an existing language profile without
  changing semantics; do not reduce scope silently.
- Public selection conflicts with a supported existing CLI contract. Propose an
  additive versioned form with migration consequences before changing that contract.
- A requested runtime guarantee requires real persistence, dispatch, credentials
  or new authority rather than a compiler artifact.
- Dirty owner changes conflict with the exact implementation allowlist.

Ordinary internal naming, helper extraction, oracle construction and test
organization do not require repeated owner decisions when semantics are preserved.
Keep such choices explicit in the task receipt. These are internal decision
triggers, not questions to insert into user documentation.

Outside this plan: AlchLang authoring/editor changes; new SFOL language design;
broad EVF expansion; UI metatypes; database schema design; production distributed
recovery delivery; remote release; implicit default migration. This does not
waive existing compiler semantics or the larger [parent roadmap](../PLAN.md).

## 10. Planning evidence and status

Prepared using the implementation-layering template, adapted to the current
remaining frontier. The older refinement workflow was not executed because it
conflicts with the user's selected Define process. No compiler code, existing
definitions, ontology records, source selection, toolchain or generated output
was modified; no product tests were rerun to author this document.

Exact planning scope: this file, the JSON dependency checklist, and navigation-only
additions to CLI-COMPLETION.md and STATUS.md. Original PLAN.md and
implementation-layering.md remain historical planning evidence, unchanged.

ARE request: ds-cli-continuation-20260909-062.
Route receipt: 69285cd4e65a8878b3824a2f0b945c3f082db779347f41c1a698b9dbc4498810.
Context: 2fb228d527826b8fae7fc23b5edb8abb8be0bc53cc76f7b396682e94fb1ae684.
Effect assessment: 2d36eb8d07addb0a24a0a22d4b09b1306ddf98ad533f8f35c81cc79ce0295b24.
Planning cannot be registered as admitted Goals execution state under the current
route. These assessments do not grant authority.

Plan checks passed: 18 unique tasks in topological order; five layers; every
PCR-06 through PCR-14 unit covered; 13 metatypes and three languages retained;
nine local document links resolve. Eight selected existing plan/compiler/report
files retain their entry hashes, and removing only the new navigation paragraphs
reproduces both ledger preimages. JSON and whitespace checks pass. These are
planning consistency checks, not product verification or implementation approval.
