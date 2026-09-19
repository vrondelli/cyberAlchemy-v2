# Native Workflow generation

Date: 2026-09-09. R03 / PCR-06 product-construction candidate.
Authority effect: none.

## Result

The [configured planner](../../../impl/cli/src/generation/configured-workflows.ts)
now composes actual generated Operation artifacts with a native TypeScript
Workflow, its R02 materialization module and exact source-bound descriptors.
The public facade exports one typed async Workflow callable. It awaits each
authored forward occurrence, stops on failure or uncertainty, and returns a
validated owned final value only after all steps commit.

This closes R03. It does not close public CLI integration, all TypeScript
metatypes, Python/Rust parity, the 39-cell matrix or package installation.

The [definition](workflow-generation-contract.json), hash
6b6da704b6478b66525e0b2b91240ab136fac0698ca04a57527c1f9b0c635aa2,
and [ontology scaffold](../ontology/workflow-generation-candidate.json) preceded
implementation. No selected product decision changed.

## Contract and generated behavior

The planner consumes registered graph, composition, exact fields, checked
Workflow bindings and that same Workflow's registered selected recovery policy.
It invokes the existing Operation planner with exactly the forward/compensation
action closure and factory bindings. Current definition bytes, source profiles,
Workflow role and orchestrator form are checked. Unsupported languages/versions,
stale/forged inputs, missing actions and unsafe paths reject before output writes.
Planning owns its selection snapshot rather than freezing the caller's root.

The generated callable receives typed Workflow input, explicit execution/failure
identifiers and typed forward Operation dependencies. It captures input, dependency
slots and imported callables before suspension; checks action/descriptor pins;
materializes arguments; and awaits each source-ordered Operation once.
Operation guards, result invariants, Event creation and the one atomic
state/outbox port boundary remain in the existing Operation implementation.
The Workflow opens no second transaction and performs no retry.

The native metadata classifier is a tested specialization of R01. Returned
non-commit, thrown/malformed/indeterminate outcome and not-started argument
failure stay distinct. Metadata inspection does not validate returned payloads;
R02 capture follows only a committed envelope. Cleanup evidence survives.

Generated recovery templates come from the unchanged selected planner for every
possible failure prefix. Runtime SHA-256 binds actual caller identifiers and
observed committed prefix to the same v3 Recovery Intent and invocation hashes.
Active dependencies order only needed compensations; inactive dependencies remain
evidence; reverse completion breaks unconstrained ties. Unknown commits produce
reconciliation-required without a recovery intent.

Typed compensation values use a separate
domainspec.workflow-recovery-bindings/v1-candidate carrier. Each entry retains
intent, plan, invocation, compensation, Operation and action identities, and
owned arguments from the same captured prefix. The expression-only v3 intent
is unchanged. Only forward Operations are imported by the Workflow, and no compensation is
called. Recovery Operation artifacts can exist in the dependency plan for separate consumption.

Invalid committed results and final materialization errors preserve committed
evidence with R01 orchestration-error / recovery not-evaluable. Recovery argument
preparation failure preserves the valid expression-only recovery intent but
reports bindings failed and returns no partial carrier. None of these branches
invents a failed forward Operation or claims recovery execution.

Metadata hashes and descriptors are integrity bindings, not authenticated provider
truth, signature verification, durable registration, replay protection or external
authority. Arbitrary Proxy isolation is not claimed. Node crypto is a native
hashing dependency, not a new domain service.

## Verification

Eight affected suites passed **81/81**, no failures/skips, in **146.353 seconds**.
After the final additive profile-form checks and descriptor fields, the complete
new Workflow suite passed **15/15**, no failures/skips, and source typecheck
passed again. The earlier 81-test run and final 15-test run are separate evidence
epochs, not a claimed second full regression.

Native tests compile all generated dependencies with the existing pinned
TypeScript 7.0.2 / Node 26.8.1 toolchain and execute emitted JavaScript.
Existing locked Node typings are mounted read-only for node:crypto; no package,
toolchain, provider or temporary dependency symlink was installed.

Coverage includes:
- actual generated Operations, guards, result invariants, cleanup and Event inputs;
- success, every known failure prefix and uncertainty before/after provider commit;
- repeated Operation occurrences and distinct reserve-stock, capture-payment,
  submit-order Operations with separate canonical Event producers;
- exact equality to R01 outcome evaluation and selected recovery intent/hashes;
- constrained/unconstrained recovery, inactive dependencies and no compensation;
- suspended commit ordering, caller mutation, malformed dependency returns,
  throwing dependencies, stale pins, entry accessors and invalid identities;
- typed public consumers and exact bigint compensation values;
- explicit local result and recovery-binding preparation failures.

The native classifier differential test checks 792 status/stage/code/cleanup
combinations plus hostile envelopes against R01. An independent native AST
observer derives expectations from authored occurrences, bindings, selected
recovery outputs and Operation source identities; it does not execute the
generator or accept descriptors as behavior proof.

Eight compiling source mutants reject: missing await, wrong step arguments,
wrong observation occurrence, omitted terminal stop, stale descriptor pin,
false committed-prefix filter, an actual compensation import/call, and an
ambient dispatch. A ninth compiling distinct-Operation substitution fails both
the observer and a native call-order witness.

Initial fixture corrections respected existing rules: Event batches use value;
each Event has one producer; and a deliberately introduced compensation-call
mutant needed its own correctly typed provider to be a compiling mutant.
No validation rule was weakened to make a fixture pass.

## Task Session context, scope and preservation

Local Task Session with standard Context Builder; no agents or handoff.
Source selectors: R03 plan/done criteria; R01 classification/evaluation;
R02 generated binding APIs; selected recovery planner and D36/D37;
Operation planner/source and native provider tests; current Workflow role/form;
native TypeScript observer API; direct DomainSpec fixtures.

Obligations cover exact imports/actions, awaited order, source/occurrence and
execution identity, typed capture, terminal stop, recovery equivalence,
non-dispatch, hostile inputs, native/independent verification and synchronized
completion evidence. All R03 obligations have scoped evidence. Full supported-
input closure and public command integration remain successor tasks.
Sigil-development experiments and delegated handoff are not applicable.

Twelve-file scope: definition, ontology, planner, Workflow source emitter,
settlement support emitter, native test, observer, package test registration,
this report and the three completion/status/checklist records.
Eleven protected sources retain entry hashes, including R01/R02, the existing
Operation planner/source, value/Event emitters and canonical definitions.
Removing only the new test path reproduces package entry hash
460ebd267f6f5976ddb46beeb0df0f52bbfadd0c71fe9dc694e7022115231278.

Source hashes:
- planner: 458b2e15975d185a9f6c650c29b696051c5a1804cb98b7b98750793956207738
- Workflow emitter: 1ffcc292b6f25ef48b371bc9d9fb0ce711d1edcfa2dc102c16d98dc483be610b
- settlement support: f3ddcae1faa567640e2a793d22140d4ce13d43b807f9d509bf0e9448fc3f9861
- tests: 7effa63769b040590f8387131cda6ef9e89ff1f80276a3b6cdd3aed3e1e2a4e1
- observer: 091de4422d08978dd922bc7933383e1b76ff07f4b497272b9dc8f80ef0d134d4

ARE request ds-cli-continuation-20260909-065:
route 28b35a704f5d9710bde19a2a73fff9c29b16e55cf69505ac875e9ab4bf091cf1;
context bc26260cac72888a766e802bc27c4b52375a498e74e5b84ffcd2ba710fc6561e;
effect dcccc9053c5f8a7c446e71bbc694b87fa8015f817fcaa0cfbda88b20e4984d1a.
The consequence gate reported no missing owner references; the user's explicit
bounded implementation authorization remains controlling. Assessments grant
no operational authority.

## Next construction

R04 named public-contract Mapping bindings, followed by R05 native public Mapping
and configured Interface generation. R06 closes all selected TypeScript input
obligations before shared planning and public CLI integration.
No publication, default cutover, AlchLang change or production provider effect
is performed. The complete working-CLI goal remains active.

Final 12-file JSON/whitespace check passes. ARE continuation
e353584d0ae8720100da7b47a3b70dfef4af735cfacb3a605336074619d83088
selects R04 with no missing owner references.
