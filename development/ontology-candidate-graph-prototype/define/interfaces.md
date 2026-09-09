# Interfaces

## PrototypeCLI

Proposed command shape:

```text
ontology-prototype validate --case <fixture> --policy <policy> --out <new-run-dir>
ontology-prototype inspect --receipt <receipt> --format json|text|html
```

The CLI is an interface contract, not a command currently present.

## Input Boundary

- repository-relative files only;
- explicit fixture and policy paths;
- exact digests resolved before evaluation;
- governed input roots mounted or opened read-only;
- no environment-derived authority or promotion target.

## Output Boundary

- caller supplies a new directory beneath the prototype-generated root;
- create-only behavior;
- canonical JSON is the machine surface;
- text and static HTML are pure projections from canonical JSON;
- no network, database, queue, browser storage, or external publication.

## Exit Contract

| Exit | Meaning |
| ---: | --- |
| 0 | Evaluation completed; inspect disposition in the receipt |
| 2 | Fixture or policy contract failure |
| 3 | Write-isolation or output-path failure |
| 4 | Internal determinism/binding failure |

A `policy-fail` or `policy-indeterminate` can still be a successfully completed
evaluation and therefore need not be a process error.
