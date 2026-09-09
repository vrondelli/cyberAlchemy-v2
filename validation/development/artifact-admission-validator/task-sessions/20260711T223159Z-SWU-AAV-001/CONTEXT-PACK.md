# Context Pack: SWU-AAV-001

Status: ready
Mode: lean
Built: 2026-07-11T22:31:59Z
Selected unit: `SWU-AAV-001`

## Objective

Define the candidate JSON admission-record and receipt contracts for C18 before
any policy parser or validator implementation begins.

## Controlling Sources

1. `work-pack/tasks/TASK-AAV-001.md` - task objective, conditional fields, write scope, and done criteria.
2. `WORK-PACK.md` - selected SWU, L0 boundary, authority exclusions, and expected receipt.
3. `work-pack/shared/context.md` - JSON/standard-library posture, verdict precedence, and exit codes.
4. `work-pack/shared/cross-task-decisions.md` - input format, policy-source, phase, and rollout decisions.
5. `authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#CAV2-C18` - working/governed admission rule.
6. `authority/definitions/DEFINITIONS.md#CAV2-D51` and `#CAV2-D52` - canonical-artifact record and durability boundary.
7. `ontology/canonical-kinds/CANONICAL-KINDS.md` - kind/process/rollup/durability contract and unresolved OQ-3.

Paths above are relative to `cyberAlchemy-v2/` except the task-session package paths.

## Hard Constraints

- Write only the four SWU outputs under `cyberAlchemy-v2/validation/artifact-admission/` plus Task Session evidence and work-pack synchronization.
- Do not implement the CLI, policy parser, evaluator, fixture corpus, or tests from later SWUs.
- Do not edit definitions, Canonical Kinds, constitutions, disciplines, or public Arcanum.
- Canonical classification must remain independent from authority.
- Working material must not carry canonical metadata, D52 durability, authority claims, a new repository-area claim, or a load-bearing claim.
- Governed non-canonical material may carry C7/C14 governance without being assigned D52 durability.
- Promotion or demotion requires an explicit owner decision reference.
- Schema validation is documentary at this SWU; later runtime evaluation owns semantic/path checks that JSON Schema cannot prove safely.

## Write Scope

- `cyberAlchemy-v2/validation/artifact-admission/README.md`
- `cyberAlchemy-v2/validation/artifact-admission/admission-record.schema.json`
- `cyberAlchemy-v2/validation/artifact-admission/admission-record.example.json`
- `cyberAlchemy-v2/validation/artifact-admission/receipt.schema.json`

## Decisions

| Decision | Selection | Class |
| --- | --- | --- |
| Schema dialect | JSON Schema Draft 2020-12 | assumption fixed by plan |
| Example coverage | governed JSON example plus working README example | non-blocking implementation choice |
| Unknown fields | reject in stable record subobjects | non-blocking safety choice |
| Runtime-only checks | document path containment, inheritance, registry membership, and link checks; do not fake them in schema | boundary-preserving choice |

No blocker decision remains.

## Done Criteria

- all three JSON files parse;
- schema conditionals represent working/governed, canonical/non-canonical, promoted/demoted, C7, and C14 obligations;
- README maps every field group to C18, D42, D51, D52, C7, or C14;
- examples do not invent a canonical kind or imply authority;
- `git diff --check` passes for scoped files.

## Validation Surface

- `python3 -m json.tool` on each JSON file;
- optional installed JSON Schema engine check when available, otherwise structural review;
- focused contract matrix review in the Task Session result;
- scoped status and `git diff --check`.

## Related Synchronization

After validation, update only the SWU-AAV-001 status/evidence in `WORK-PACK.md`
and write the Task Session result. SWU-AAV-002 remains unexecuted.
