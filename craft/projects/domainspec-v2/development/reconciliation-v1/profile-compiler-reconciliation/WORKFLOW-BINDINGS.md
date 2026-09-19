# Typed Workflow occurrence bindings

Date: 2026-09-09. PCR-06 / DSR-017 construction candidate. Authority effect: none.

## Implemented

`compileWorkflowBindings` consumes a registered unchanged graph, composition
boundary, exact field compilation, checked Operation actions, explicit binding
data and the exact definition bytes. It returns an owned immutable registered
artifact, not callable code or an execution receipt.

Each source step and compensation has exactly one call binding. The source
occurrence chooses the qualified Operation; the binding pins its `action_sha256`.
The action set must exactly cover the Workflow's distinct Operation targets.
Different occurrences of the same Operation retain separate result identities.

Ordinary parameters use the existing exact TypedType vocabulary. Event
constructor inputs are separately declared and passed whole to matching Event
parameters. Their source-bound constructor schemas retain occurrence identity,
payload, reference metadata, signed Event integers and required/generated time;
they are not flattened into domain records or coerced into UInt64.

Compiler-input example (not a new AlchLang syntax):

```json
{
  "step_id": "reserve-secondary",
  "action_sha256": "<exact checked action hash>",
  "arguments": [
    {"parameter": "order", "value": {"op": "step-result", "step_id": "reserve-primary", "properties": []}},
    {"parameter": "amount", "value": {"op": "input", "name": "secondary_amount", "properties": []}}
  ],
  "events": [{"parameter": "reserved_input", "input": "secondary_reserved_event"}]
}
```

Forward calls can read ordinary inputs and strictly earlier step success values.
Compensations can read the guaranteed prefix through their own `for_step`.
Dependencies on later compensations do not make later forward results available.
The final Workflow result is checked against the complete forward-success scope.
Failure and indeterminate outcomes are not successful values.

Exact parameter coverage, exact type equality, checked ontology property paths,
explicit literals/variants/list-to-set conversion, Event coverage, immutable
source evidence, definition drift and hostile inert-data boundaries are enforced.
No calculation, query, mapper or provider is secretly called by a value binding.

## Construction and compatibility

The [definition](workflow-binding-contract.json), SHA-256
`8a6d9f928696c263137edb8a53d3c87c0cc5394090fd1268e02699e2860eac2a`, and
[ontology scaffold](../ontology/workflow-binding-candidate.json) precede the new
compiler. No authored Workflow v1 source schema, canonical relationship, prior
Operation binding, generator, default or source-selection configuration changed.
The package registers the added test suite; unrelated owner bytes are preserved.

Product construction: static callable binding and prerequisite policy analysis.
Operational support: the existing temporary dependency symlink only for the
shared test corpus. No provider installation, deployment or release. The full
CLI goal, Interface/Mapping work and later PCR stages remain incomplete.

## Verification

Final focused Workflow binding, source and Operation binding suites:
**27/27 PASS**, zero failures/skips, **2.81 seconds**. Nine new tests cover
ownership, brands, exact source/action/field identity, cross-graph rejection,
complete argument/Event coverage, availability, optional/list/set/sum and exact
UInt64 distinctions, occurrence non-collapse, canonical graph orthogonality,
valid legacy-source rejection and the recovery dependency decision reproduction.

Source typecheck and frozen checks pass: 39 catalog cells, 31 relationship
signatures and five integration-profile definitions across three languages.
The 36-file shared regression passed **402/402**, zero failures/skips, in
**397.89 seconds**. That run loaded the eight-test binding fixture before its
final legacy-source strengthening and ninth recovery-evidence case. The final
27-test focused run above verifies both test-only additions against unchanged
implementation bytes. This is not a claim that one final 403-test aggregate ran.
Final source typecheck passed again after dependency-link cleanup. These checks
do not establish executable Workflow or public CLI completion.

Seventeen predecessor source/configuration/test artifacts retain their exact
recorded hashes. Removing only the new test path from the package in memory
reproduces its exact pre-change hash. All ten scoped files pass whitespace and
applicable JSON checks. The verified temporary test dependency symlink was
removed; its target and user-owned dependencies were not changed.

During development the source typecheck caught a descriptor-map typing error;
the explicit descriptor record fixes it. The new recovery evidence test initially
matched an error's message instead of its separate `code`; it now checks the
actual code without changing runtime behavior. The final focused suite passes.

## Task Session context and evidence

Arcanum Orchestrate / Task Session with a bounded Context Builder pack. Sources:
the CLI ledger and selected occurrence decision; source decoder and graph
certificate; composition and exact field models; action bindings and generated
Operation/Event signatures; shared value typing; current tests; D36/D37 and their
reference recovery contract. These cover identity, exact types, availability,
ownership, compatibility and the recovery boundary. No handoff or delegation.
Dedicated sigil-development experiment telemetry is not applicable.

The ten-file scope comprises the new binding compiler/test, definition/ontology,
this report and the dependency decision, package registration, source report and
status/completion ledgers. ARE request `ds-cli-continuation-20260909-058`, raw text
`continue until other decision`. Route receipt:
`38d7abfbb9d9b9ea5848ab424b99ee144ffc72b703cd4aef64a2e53d971079c1`.
Context result: `25f85646ec558a740a3340c26927ee99f88b9604a299d838b3b03c9362f4515d`.
Initial effect result: `d69d0e1dfac2c9883436fc6575c871db80615d9f8332f03ce70acef1e7dbb838`.
The decision-record effect is recorded in its own artifact. These non-executing
assessments grant no execution, admission or publication authority.

Completed-binding continuation assessment:
`e38c4c2d6f89b4039d8718e6fc39c60f023d3a0fd833d4642b91864504eccc36`.
It records the generator option as blocked on the caller-declared missing
dependency choice, not on the completed static-binding unit. Independent
Interface/Mapping work remains runnable; the user requested this decision return.

## Remaining work

The [inactive recovery dependency decision](WORKFLOW-RECOVERY-DEPENDENCY-DECISION.md)
is now resolved by the user. The additive [selected recovery policy](WORKFLOW-RECOVERY-POLICY.md)
implements ordering among needed compensations, with exact failure-prefix checks
and a separate reconciliation-required outcome for indeterminate commits.
The existing contract already prohibits automatic compensation inside Workflow;
that is not an open policy choice. The checked binding intentionally records
`execution: not-performed` and `recovery_policy: not-selected`; the policy is
selected separately against this unchanged checked binding's exact hash.

Native generation, recovery outcome handling, public CLI integration,
Interface/Mapping integration and all later [CLI requirements](CLI-COMPLETION.md)
remain incomplete. No user-facing product documentation is changed by this
internal decision/evidence report.
