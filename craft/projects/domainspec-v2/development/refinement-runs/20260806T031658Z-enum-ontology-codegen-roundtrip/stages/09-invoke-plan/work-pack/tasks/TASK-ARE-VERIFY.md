# TASK-ARE-VERIFY — Independent Closeout and Scope Audit

## Objective

Verify the completed Work Pack without changing product code. Layer L2/L3 exit,
wave W3.

## Smallest Working Unit Exemption

This `VERIFY` task is closure-only and mutation-exempt. It may read sources,
rerun declared commands, compare receipts/digests, and write only its verification
receipt under the Work Pack evidence path.

## Checks

1. Join all fifteen terminal and closeout receipts; reject missing/duplicate or
   superseded-unaccounted entries.
2. Re-run W3 focused and legacy validation from a clean process.
3. Validate forbidden imports and exact raw-handle reachability.
4. Confirm only declared write scopes changed and unrelated dirty work remains
   unattributed.
5. Confirm claim ceiling excludes canonical promotion, composition, other Enum
   obligations, Python/Rust, release, and deployment.
6. Emit `work-pack/receipts/TASK-ARE-VERIFY.json` with pass/block and residue.

## Validation surface

All commands declared by SWU-ARE-014 plus JSON validation for the receipt set and
scoped whitespace checks. Any mismatch blocks closeout; verification never edits
the implementation to make checks pass.

## Next route

If pass: stop and return the bounded prototype proof for inspection. A follow-up
Invoke package may select direct obligation breadth, composition, Python, or Rust.
If block: route the exact failed owner boundary; do not reopen unrelated SWUs.
