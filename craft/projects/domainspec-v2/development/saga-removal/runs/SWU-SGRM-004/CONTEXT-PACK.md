# SWU-SGRM-004 Context Pack

## Envelope

- mode: standard-strict
- task: `SWU-SGRM-004`
- runtime: local
- delegation: none
- dependencies: SGRM-002 PASS; SGRM-003 PASS
- destructive authority: accepted SGRM-001 migration packet deletion table
- write scope: behavioral Workflow/Saga schema/cards, Workflow/Saga mt fixtures,
  generated Workflow/Saga instances named by the packet, and run/status evidence

## Selected Sources

| Source | Controlling obligation |
|---|---|
| `work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md#swu-sgrm-004-schema-and-fixture-migration` | Ordered migration rules, done criteria, validation. |
| `WORK-PACK.md` | Ready state, dependencies, declared implementation scope. |
| `runs/SWU-SGRM-001/MIGRATION-PACKET.md#active-deletion-table` | Explicit owner approval to delete Saga card/schema/fixtures/generated instance in SGRM-004. |
| `runs/SWU-SGRM-003/TASK-SESSION-RESULT.md` | Proves `attribute-one-of`, deterministic generation, tests, and typecheck are green. |
| `workflow.schema.yml` and `workflow.md` | Live authoring contract to widen and reconcile. |
| Workflow and Saga mt fixtures | Positive/negative replacement and deletion corpus. |
| `saga.md`, `saga.schema.yml`, generated Saga instance | Exact active files approved for deletion. |
| `instances.ts` behavior from SGRM-003 | Generation chooses the first admitted value and validation uses exact membership. |

## Scope Drift Resolution

The task shorthand says behavioral files and mt fixtures only, while its ordered
rule 8 requires generated-instance handling and the accepted migration packet
explicitly assigns `saga.example.instance.yml` deletion to SGRM-004. The packet
is the owner-reviewed destructive contract, so generated Workflow/Saga outputs
are included narrowly. No generator source or unrelated generated file is in
scope.

## Execution Obligations

1. Change Workflow criterion to `attribute-one-of` with exact values
   `[intra-feature, cross-feature]`.
2. Widen Workflow card/code pattern and remove the retired-type distinguisher.
3. Correct the card's DS-D8 slice to SOURCE of `orchestrates`.
4. Preserve the existing intra-feature positive fixture.
5. Add a cross-feature positive Workflow fixture.
6. Make the negative fixture fail on unknown scope, not cross-feature scope.
7. Prove both positives pass and the negative fails before deleting Saga files.
8. Delete only the approved Saga card, schema, positive/negative fixtures, and
   generated instance.
9. Regenerate/validate instances after deletion; generated Workflow must choose
   `intra-feature` deterministically.

## Gates

- Pre-deletion Workflow fixture proof must pass.
- No unsupported rule may be reported or skipped.
- File census must show no active Saga implementation file in the owned corpus.
- `validate:content`, instance generation/validation, and `validate:docs` must pass.
- Failure restores deleted files and Workflow edits as one unit.

## Coverage Result

PASS. Dependencies, destructive approval, exact files, staged proof, rollback,
and validation are all explicit; no unresolved decision remains.
