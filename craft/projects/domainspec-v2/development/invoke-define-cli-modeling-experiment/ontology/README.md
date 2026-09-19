# Invoke Define CLI System Runtime Ontology

Status: private candidate; non-authoritative.

This package models the real Invoke Define CLI as a system-runtime ontology. It
reuses WIR-WP-001 and SWU-WIR-006 as planning evidence, but it does not execute,
select, admit, or close that Work Pack.

## What the ontology contains

- one CLI component and Interface;
- the six current Define stages and their operation verbs;
- the ordered semantic-context to status Workflow;
- authored sources, candidate bundle, producer receipt, independent admission
  receipt, and status result;
- eligibility, atomicity, independent replay, receipt-pair, axis-independence,
  and authority-ceiling Rules;
- separate `artifact_authored`, `registry_released`, and
  `mutation_runtime_ready` axes;
- source identities, open residue, schema bindings, deterministic validation,
  and append-only receipts.

The machine state is split across [PROFILE.json](PROFILE.json),
[SOURCES.json](SOURCES.json), [NODES.json](NODES.json),
[RELATIONS.json](RELATIONS.json), and [VIEWS.json](VIEWS.json). This README is a
human projection and does not own node or relation identity.

## Type decision

`TYPE-SELECTION.json` selects `system-runtime` with high confidence because the
target is a CLI system with interfaces, operations, queries, events, data, and
runtime constraints. `business-system-bridge` is deferred: this experiment does
not yet claim any concept-to-code realization or implementation traceability.

## Lifecycle model

```text
semantic-context -> semantic-closure -> source -> bundle -> admission -> status
       source             receipt        source    bundle +       receipt      result
                                                    stage receipt
```

The important non-shortcut is at the end: the bundle stage produces candidate
bytes and producer evidence, while the independent admission stage produces the
admission receipt. Status requires both receipts. Neither a candidate bundle nor
a passing selected-profile graph implies admission.

## Relationship to the DomainSpec-v2 JSON experiment

The complete ontology can represent Interface, Workflow, Query, evidence joins,
and independent status axes. The currently selected JSON profile can only
approximate the artifact-producing subset with `Rule`, `Operation`, `Event`,
`enforces`, and `produces`.

That projection is intentionally lossy. Its positive fixture may prove
structural compilation; its source-shortcut hostile fixture demonstrates that
the selected profile cannot enforce the current semantic-closure prerequisite.
Open mismatches are preserved in `RESIDUE.jsonl`.

## Validate

From the repository root:

```sh
/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node \
  projects/domainspec-v2/development/invoke-define-cli-modeling-experiment/ontology/scripts/validate-ontology.mjs
```

The validator is dependency-free and read-only. It checks schema shapes, source
digests and sizes, stable identity, endpoint closure, view references, live CLI
stage equality, workflow order, receipt dependencies, axis independence,
forbidden shortcuts, the WIR boundary, and the authority ceiling.

## Claim ceiling

A PASS means this private candidate ontology is internally consistent and bound
to the exact source versions recorded in `SOURCES.json`. It is not acceptance of
the blocked WIR Work Pack, execution of SWU-WIR-006, aggregate Invoke acceptance,
canonical DomainSpec vocabulary, an Arcanum publication, or runtime readiness.
