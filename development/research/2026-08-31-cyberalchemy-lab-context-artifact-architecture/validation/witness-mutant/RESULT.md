# Witness And Mutant Validation Result

Status: **PASS — synthetic contract validation only**

The positive witness passed, and all eight named mutants were rejected for
their intended reason. Two accepted runs produced byte-identical JSON output at
SHA-256 `4f0d63ca6442c1a429d49907ae31e13316270c8c548ce1377e4cd9be07bbecd6`.

## Case outcomes

| Case | Expected | Observed |
| --- | --- | --- |
| Positive owner-local witness | PASS | PASS |
| Hand-edited human projection | reject `E_PROJECTION_DRIFT` | matched |
| Schema digest drift | reject `E_SCHEMA_BINDING` | matched |
| Wrong artifact-type binding | reject `E_ARTIFACT_TYPE_BINDING` | matched |
| Missing semantic owner | reject `E_OWNER_MISSING` | matched |
| Stale generator | reject `E_GENERATOR_BINDING` | matched |
| Hidden cross-context dependency | reject `E_CROSS_CONTEXT_CONTRACT` | matched |
| Recursion without stop/recomposition | reject `E_RECURSION_BOUNDARY` | matched |
| Discovery presented as admission | reject `E_SOURCE_ADMISSION_DECISION` | matched |

## What this supports

The preserved candidate is coherent enough to express one owner-local artifact
type/instance pair, one explicit typed cross-context relation, a bounded
recursive capability-instance envelope, and an exact machine-to-human
projection contract. The eight named contradictions are mechanically
distinguishable and fail closed in this research harness.

## What this does not support

The validator and fixtures are synthetic research instruments. Their PASS does
not establish that the proposed contract is complete, owner-adopted, admitted,
implemented, or enforced in CyberAlchemy-lab. It does not select a directory
structure, admit CyberAlchemy-v2 material, constitute any prospective role,
satisfy D64 or D65, publish, release, deploy, or establish `v1.0.0`.

## Rework preserved

The first execution matched eight of nine cases. The wrong-artifact-type mutant
also caused projection drift, so it was not isolated. The fixture was repaired
to keep its projection current while retaining the wrong type binding. The two
accepted post-repair runs then matched all nine cases byte-for-byte.

## Next governed route

The research validation gate is closed. The next decision is an immutable,
owner-authorized architecture-selection gate over the accepted findings and
this validation receipt. That decision remains separate from implementation.
