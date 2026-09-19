# Versioned Workflow occurrence source

Date: 2026-09-09. PCR-06 / DSR-017 construction candidate. Authority effect: none.
The user selected option A with `yes apply it` after the current/new comparison.
This is implementation evidence, not release documentation or product approval.

## Applied source shape

`domainspec.workflow-occurrences/v1` is an opt-in version under `typed_contract`.
The envelope name does not claim typed callable inputs/results: this first unit
checks occurrence structure and canonical graph closure.

```json
{
  "description": "Reserve two shipments independently.",
  "typed_contract": {
    "schema_version": "domainspec.workflow-occurrences/v1",
    "ontology_workflow": "COMMERCE-SHIPMENT-WORKFLOW",
    "steps": [
      {"step_id": "reserve-primary", "operation_ref": "inventory:reserve"},
      {"step_id": "reserve-secondary", "operation_ref": "inventory:reserve"}
    ],
    "compensations": [
      {"compensation_id": "release-primary", "for_step": "reserve-primary", "operation_ref": "inventory:release", "depends_on": ["release-secondary"]},
      {"compensation_id": "release-secondary", "for_step": "reserve-secondary", "operation_ref": "inventory:release", "depends_on": []}
    ]
  }
}
```

One canonical `orchestrates` edge to `inventory:reserve` and one to
`inventory:release` cover these four occurrences. Repeated references are
deliberate uses of the same Operation, not repeated concept-level edges.
`inventory:reserve` and `shipping:reserve` remain different qualified targets.

The [definition](workflow-occurrence-contract.json), SHA-256
`44e7e7bae39d0694b771639706a0c6471aed3a9139d0df0232a19f1c6b31ec7d`, and
[ontology scaffold](../ontology/workflow-occurrence-candidate.json) were authored
before code. They distinguish step, compensation and Operation identities.

## Validation and compatibility

- Step order is preserved; step IDs are unique. Repeated Operation refs are lawful.
- Each compensation has its own ID and addresses one exact step. At most one
  compensation is declared per step; repeated compensation Operations are lawful.
- Dependencies name compensation IDs, reject unknown/self/cyclic dependencies,
  and do not infer reverse order or execute recovery.
- Canonical outgoing `orchestrates` targets must exactly match the distinct
  qualified Operation refs. Missing, extra and non-Operation targets fail closed.
- Closed bounded inert-data decoding rejects getters, hidden/symbol fields,
  sparse arrays, unsupported versions and duplicate occurrence identities.
- Old Workflow parsing/generation remains separate. Old generators for all three
  languages, runtime and formalization explicitly reject the new version rather
  than interpreting occurrence objects as legacy Operation strings.

Source `lint` uses the actual checked graph and accepts the new version. This is
not executable Workflow generation or a new public migration command.

## Explicit migration

`planWorkflowOccurrenceMigration(graph, selector, selection)` requires a registered
unchanged checked legacy graph plus explicitly authored `ontology_workflow`,
`step_ids` and `compensation_ids`. Both ID arrays align with their respective
legacy arrays; a legacy `none` compensation uses null in the ID selection.

The helper resolves qualified Operation refs from the graph's existing exact
edges, translates compensation dependencies to occurrence IDs, binds the source
hash and graph certificate, and returns an owned immutable candidate body. It
does not rewrite files, invent step names or register a checked replacement graph.
Materializing the candidate requires normal graph validation. Tests demonstrate
that the replacement retains exactly the same canonical relationships.

## Verification

Focused Workflow/configuration/project-model/Operation-relationship tests:
**38/38 PASS**, zero failures/skips, **1.66 seconds**. Eight new tests cover
definition binding, ownership, hostile data, actual cross-feature graph/lint,
duplicate concept reuse, exact closure, ordering and recovery non-collapse,
legacy rejection and explicit no-write migration with forged-input controls.
Source typecheck and frozen checks pass: 39 catalog cells, 31 relationship
signatures and five integration-profile definitions across three languages.
Final 35-file shared regression: **394/394 PASS**, zero failures/skips, in
**345.65 seconds**. Separate legacy runtime/formalization compatibility:
**22 PASS**, zero failures, one unavailable Lean-provider skip, in **22.32 seconds**.
This does not establish native execution of the new Workflow source.

All 21 scoped files pass JSON/whitespace checks. The four integration files
(project decoder, generator dispatcher, runtime and formalization) reproduce
their exact pre-change hashes when only the new Workflow branches are removed
in memory. The package adds exactly one test; the three preview fixtures change
only their explicit source-selection filename. Six prior Interface source/test/
definition artifacts retain exact hashes. The temporary test dependency symlink
was removed after tests; its target and user-owned dependencies were preserved.

Configuration [v6](configuration-workflow-v1-sources.json) binds the changed
parser and new Workflow decoder/definition through exact immutable v5. Existing
v1-v5 selections retain their bytes and reject stale live parser sources. Only
positive live-preview fixtures move to v6; historical drift controls remain.

## Task Session context and scope

Product construction: occurrence source, graph validation and explicit migration.
Operational support: temporary dependency link solely for established tests;
no deployment/provider setup is required by this source unit. No publication,
default cutover, admission, automatic file migration or AlchLang change.

Arcanum Orchestrate/Task Session with a standard bounded Context Builder pack:
DEC-08 and its selected decision, full CLI ledger, Workflow body/relationship
decoder, canonical `orchestrates` signature, graph certificate, legacy runtime/
formalization/generators, migration and hostile-input tests, and configuration
predecessor chain. These cover identity, order, recovery, scope, legacy preservation
and exact source evidence. No handoff, subagent or alternate router was used.
Dedicated sigil experiment telemetry is not applicable to this compiler unit.

The 21-file effect scope contains the decoder, migration helper and tests;
definition, ontology, report and decision record; project/legacy compatibility
branches; package test registration; configuration successor/loader/tests and
three positive preview fixtures; DEC-08 and the status/completion ledgers.

ARE request `ds-cli-continuation-20260909-057`, raw user text `yes apply it`.
Route `CA2-ROUTE-IMPLEMENT`; receipt
`4b8716a7daf1f5f5bcceaf8315b8f6add43024c63e7cbecb3c8745b8270748db`.
Context result `0de52ea7b4c99226c07e899c5b628f1bd4436f7d5b9f4cf2e1f519c2a82bce9b`.
Effect result `397769d94a3d9418a17c8eca65650e5242dd305b35f3516375e0239af5df2a74`.
These non-executing assessments grant no authority; user authorization controls
construction. No existing owner changes were reverted or committed.

## Remaining work

The successor [typed argument/result bindings](WORKFLOW-BINDINGS.md) now address
exact step occurrences and check pinned Operation signatures, including Event
constructor inputs. Native orchestration and recovery still need implementation,
behavior/mutation tests and explicit effect boundaries. The next policy boundary
is [inactive recovery dependencies](WORKFLOW-RECOVERY-DEPENDENCY-DECISION.md).
No durable execution, retry or automatic compensation guarantee is claimed.
Interface/Mapping integration and PCR-07..14 remain incomplete in
[CLI-COMPLETION.md](CLI-COMPLETION.md). The source-format choice itself is resolved.
