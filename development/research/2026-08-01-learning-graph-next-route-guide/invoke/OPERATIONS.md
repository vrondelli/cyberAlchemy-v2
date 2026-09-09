# Operations: Learner Projection And Next-Route Guide

## CompileLearnerProjection

**Type:** Operation (local artifact generation)

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| source bindings | ProjectionInputBinding[] | yes | Exact paths, digests, and selectors. |
| derivation contract | versioned contract | yes | Record classes, allowed relations, question rule, witness rules. |
| output path | repository-relative path | yes | Candidate generated JSON only. |

### Ordered Rules

1. Resolve every path inside the repository root.
2. Recompute every SHA-256 and reject any mismatch.
3. Resolve every required JSON pointer or DOM selector source declaration.
4. Copy only approved fields into typed projection records.
5. Evaluate the positive and abstention fixtures at their declared ceilings.
6. Apply the exact v1-to-v2 question-revision rule only when all premises hold.
7. Emit a suggestion package only for one current evidence gap and force
   `authority_effect: none`.
8. Canonicalize record ordering and write the generated snapshot atomically.
9. Emit a receipt containing input digests, output digest, verdicts, and
   unsupported/deferred claims.

### Postconditions

- Identical current inputs produce byte-identical output.
- Stale, missing, or malformed inputs produce no current suggestion.
- No output contains an execution handle or authority transition.

### Error States

| Condition | Result |
| --- | --- |
| digest/pointer drift | `STALE_INPUT`, no current projection |
| unknown record/relation class | `UNSUPPORTED_RECORD`, block |
| identity inference requested | `ABSTAIN` |
| route effect exceeds display | `AUTHORITY_COLLAPSE`, block |
| outbound request attempted | acceptance failure |
