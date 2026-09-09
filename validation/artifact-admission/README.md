# Artifact Admission Contract

Status: candidate contract; validator not implemented
Owner: CyberAlchemy v2 validation route
Enforces: `CAV2-C18` shape only after a validator implementation exists

## Purpose

Define the machine-readable input and receipt shapes for artifact admission.
These files translate existing CAV2 rules into a validation contract; they do
not define artifact semantics, create a canonical kind, or promote authority.

## Files

| File | Role |
| --- | --- |
| `admission-record.schema.json` | Candidate shape for one pre/post admission record. |
| `admission-record.example.json` | Governed, non-canonical, load-bearing example using the validator plan itself. |
| `receipt.schema.json` | Candidate deterministic receipt shape for a future validator run. |

The future implementation plan lives at
[development/artifact-admission-validator](../development/artifact-admission-validator/WORK-PACK.md).

## Contract Boundary

- JSON Schema checks record shape. It does not prove path containment, Markdown
  links, Canonical Kinds membership, process provenance, or authority promotion.
- A future validator owns those deterministic checks and cites the policy source
  used for each verdict.
- `canonical` means D51 typed and process-born; it does not mean authoritative.
- D52 durability is valid only inside a canonical posture.
- A governed non-canonical object may satisfy C7/C14 without receiving D52
  durability.
- Validation evidence supports owner review and never promotes C18, the
  discipline, definitions, Canonical Kinds, or an artifact.

## Source Mapping

| Contract field or condition | Source |
| --- | --- |
| `classification: working | governed` | CAV2-C18 admission classification. |
| Base identity, targets, owner surface, rule refs, record location | CAV2-C18 recorded admission and traceability boundary. |
| Governed intent, parent, provenance, validation, residue, routes | CAV2-C18 governed admission requirements. |
| `canonical_posture.status` | CAV2-D51 canonical vs non-canonical distinction. |
| Canonical artifact fields | CAV2-D51 `CA(a)` schema. |
| Canonical durability | CAV2-D52 `ephemeral | perennial`. |
| Promotion reference for promoted/demoted state | CAV2-D48/D51 authority lifecycle boundary. |
| `durable_area` and `area_contract` | CAV2-C7 navigable durable area. |
| `load_bearing` and `tree_interface` | CAV2-D42 and CAV2-C14 governed tree interface. |
| `new_repository_area` | CAV2-C18 owner-gated extension selector. |
| Receipt verdict and finding groups | CAV2-C18 `pass | flag | block | defer`; tool error remains separate. |

## Phases

| Phase | Intended check boundary |
| --- | --- |
| `pre` | Validate planned classification and declared contract before target mutation; targets need not exist. |
| `post` | Validate target existence, parent entrypoint linkage, and applicable C7/C14 evidence after mutation. |

The schema records the phase. The future CLI will enforce phase-specific
filesystem behavior.

## Working Example

Working material stays inexpensive and does not claim canonical metadata,
durability, authority, a new repository area, or load-bearing status:

```json
{
  "schema_version": "1.0",
  "admission_id": "AAV-WORKING-001",
  "classification": "working",
  "phase": "pre",
  "targets": [
    "cyberAlchemy-v2/development/scratch/comparison-note.md"
  ],
  "owner_surface": "cyberAlchemy-v2/development",
  "rule_refs": [
    "CAV2-C18"
  ],
  "record_location": "cyberAlchemy-v2/development/task-session.md",
  "new_repository_area": false,
  "durable_area": false,
  "load_bearing": false
}
```

## Governed Example

See [admission-record.example.json](admission-record.example.json). It is
explicitly non-canonical while carrying the C7/C14 fields required for a
load-bearing planning area. No durability field appears under its non-canonical
posture.

## Receipt And Exit Contract

The future validator aggregates policy findings in this order:

```text
block > defer > flag > pass
```

| Outcome | Exit code | Meaning |
| --- | --- | --- |
| `pass` | 0 | All applicable policy checks pass. |
| `block` | 1 | A forbidden or unsupported claim prevents admission. |
| tool/input error | 2 | Input or policy source could not be evaluated safely. |
| `flag` | 3 | Draft may exist with named residue but cannot constrain or promote. |
| `defer` | 4 | A required owner or gate is unresolved. |

Tool/input error is represented as `tool_status: error`, `verdict: null`, exit
code 2, and at least one error check. It is not a C18 policy verdict. Normal
policy receipts use `tool_status: ok`, one of the four C18 verdicts, and the
matching exit code.

## Deferred Implementation

This SWU does not implement:

- Canonical Kinds Markdown parsing;
- path normalization or symlink containment;
- inheritance resolution or cycle detection;
- C7/C14 filesystem and link checks;
- fixture harness, CLI, text projection, observability, or CI.

Those remain owned by later SWUs in the work-pack.
