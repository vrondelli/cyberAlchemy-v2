# Workflow outcome and journal bridge

Date: 2026-09-09. Remaining-work task R01 / PCR-06 candidate. Authority effect: none.

## Result

The executable bridge in [workflow-outcomes.ts](../../../impl/cli/src/typed-operation/workflow-outcomes.ts)
connects the existing generated Operation outcome contract to exact Workflow
occurrence observations and the separately selected recovery policy. This is
R01 completion, not native Workflow orchestration, typed value materialization
or public CLI integration.

The [definition](workflow-outcome-contract.json), SHA-256
0a7cb5a92bbec1bc5003dd5a6ba70ebc184a8316ad617f2a362b5d9de82ba607, and
[ontology scaffold](../ontology/workflow-outcome-candidate.json) preceded code.
They reuse D36/D37 and the selected recovery policy without changing their bytes.

| Observation | Commit evidence | Bridge behavior |
| --- | --- | --- |
| Valid committed envelope | Caller reports committed | Include exact occurrence in completed prefix; payload validation remains R02. |
| Input/begin or precommit read/guard/write/Event/result failure | Known non-commit under the generated caller contract | Stop forward progress and evaluate recovery against earlier completed steps. |
| Explicit commit rejection | Known non-commit | Preserve rejection and no implicit rollback/retry. |
| Failed cleanup after precommit abort | Same known non-commit, plus cleanup failure | Retain cleanup evidence separately; never claim recovery completed. |
| Commit exception, indeterminate or invalid receipt | Indeterminate | Reconciliation required, no recovery intent. |
| Thrown dependency or malformed/unsupported returned envelope | Indeterminate | Do not guess that the Operation was never committed. |
| Explicit argument preparation failure before call | Not started / non-commit | Retain preparation origin, not a fabricated returned Operation failure. |
| Empty or committed strict prefix | No terminal failure observed | Await next step; no recovery evaluation. |
| All forward calls committed | Forward complete | Not yet a validated successful Workflow result. |
| Invalid committed result or final result materialization error | Preserve observed committed prefix | Explicit orchestration error, recovery not_evaluable under the existing selected policy; no invented failed step or intent. |

The last row exposes a policy coverage boundary, not a new compensation policy.
R02/R03 must establish safe typed value materialization for compliant generated
Operations. If a genuinely new recovery meaning is needed for those local
errors, stop the affected construction and obtain that product decision; do not
silently turn not_evaluable into not-required or recovery-required.

## API and boundaries

- inspectOperationSettlement inspects closed inert outcome metadata against the
  exact expected failure continuation and current generated stage/code combinations.
  It neither traverses nor freezes a committed value, which can contain bigint.
- observeWorkflowStep requires registered checked Workflow bindings and exact
  definition bytes. It emits a frozen, process-local registered observation
  bound to Workflow, step, Operation, action hash and settlement origin.
- evaluateWorkflowOutcomeJournal requires registered observations in the exact
  source prefix, no entry after terminal failure, and explicit failure identity.
  It delegates supported failure journals to the unchanged recovery planner.

Malformed caller event wrappers, unsupported journal versions, forged or cloned
observations, stale/cross-Workflow pins and invalid source prefixes reject.
Malformed post-call outcomes become unknown, not known non-commit. Ordinary
getters are not executed. Arbitrary Proxy isolation is not claimed.

Observations are caller-supplied evidence, not authenticated receipts.
Registration is process-local validation provenance, not durable intent storage,
deduplication, replay protection or proof that the caller executed the action.
No recovery Operation, guard, lookup, mapper, calculation, store or broker is
called by the bridge. No value ownership, result success, provider durability,
native Workflow generation or public CLI coverage is claimed.

## Verification

Five focused suites pass **48/48**, zero failures/skips, in **53.19 seconds**:
new Workflow outcomes (9 tests), Workflow recovery (11), typed bindings (9),
occurrence source/migration (8), and configured Operations (11).
Source typecheck passes, including frozen catalog (39 cells), relationship
authority (31 signatures) and integration-profile definitions (5 in 3 languages).
Those catalog counts are not the full reconciled native realization matrix.

The new native integration test compiles an actual generated Operation and uses
the existing state/outbox reference provider. Twelve scenarios compare settlement
classification with observed store state: commit, explicit rejection, throw before
commit, lost acknowledgement after commit, invalid/indeterminate receipt, begin
failure, cleanup failure, guard rejection, invalid input, factory rejection and
Event preparation failure. It proves why a thrown/unknown return cannot imply no
state change. Existing native observer/mutation tests remain in the same suite.

The new unit tests cover every generated failure stage, cleanup distinction,
every three-step failure prefix, inactive compensation projection, thrown versus
not-started calls, full-forward versus successful-result distinction, postcommit
diagnostics, exact identity, hostile metadata/journal input and stable replay
calculation without a replay guarantee. Committed payloads with bigint, cycles
or getters are deliberately untouched: metadata classification is not payload
validation. R02 owns that next check.

The shared 37-file run from the preceding recovery-policy unit is historical
evidence with two Cargo timeouts and a successful serial retry; it was not rerun
or relabeled by R01. This unit uses the directly affected five-suite regression.
No temporary dependency link or new toolchain was required.

## Task Session context, gates and scope

Local Task Session with standard Context Builder; no delegation or runtime
handoff. The controlling source selectors were:
R01 in REMAINING-WORK-PLAN; the full CLI ledger; D36/D37; the Operation generation
contract/report and generated OperationOutcome/execute branches; the configured
Operation test fixture/native helper; checked Workflow bindCall/steps; Workflow
data bounds; selected recovery definition/planSelectedWorkflowRecovery; and its
three-step direct DomainSpec fixture.

Obligations: exact outcome meaning; source/occurrence identity; completed prefix;
unknown-state retention; no unauthorized effects; inert metadata and owned
observations; compatibility; native evidence; synchronized remaining-work status.
All are covered for R01. Value normalization and orchestration remain R02/R03.
Sigil-development experiments are not applicable to this compiler bridge.

Decisions: no product choice changed. The implementation uses additive helpers,
conservative unknown classification, and explicit policy-coverage diagnostics.
Operational support was existing pinned toolchains and test roots only.
Protected legacy/source bytes remain separate from the new construction.

Ten-file scope: definition, ontology, implementation, new unit test, one added
native test in the existing Operation suite, package test registration, this
report, the two current-status ledgers and the task checklist.
No canonical definitions, existing generator, Workflow binding or recovery
implementation, default selection, output package, AlchLang source, or publication
state was changed.

ARE request ds-cli-continuation-20260909-063, preserving the user's explicit
instruction to execute until a product/previous-choice decision is needed.
Route receipt: 5705d965f522de9cb947bce70bf5a47f71e70fb970b4e35a41d8a2b227447777.
Context: f94ce8e5be2cc9851febda5da3eff34c0f072bc2e9ac6ce39e3a3055645a9d82.
Effect: eaecfd8740ba400ea36eefbb5a2b346c362c0cf5496cf79fd12c325176572656.
Assessments grant no operational authority.

Final preservation audit: all eight selected protected files retain their entry
hashes. Removing only the added native test reproduces the existing Operation
test file, and removing only the new test path reproduces package.json.
Implementation SHA-256: bbe17d130c9e76f054632b01d469e0f86fdda7b833ba8d74490add733a6a0256.
New unit-test SHA-256: 060e74e07419de69142d40c9a42c17956645dbc0ed2961b43542f2f215d5ed18.
Continuation assessment 64c533de6bf973d8cba914c0d3a7d8e72462134590fe3ab6eebae238d3ec6bde
selects R02 with no additional owner-gate reference. It is not execution or approval.

## Next

R02: typed runtime argument, Event-input and committed-result materialization,
then R03 native Workflow generation. R04 remains independently runnable.
The [complete remaining scope](REMAINING-WORK-PLAN.md) and
[CLI ledger](CLI-COMPLETION.md) remain active; the full CLI goal is incomplete.
