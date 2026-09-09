# TASK-OEWSN-VERIFY: Recomposition and Claim Audit

## Smallest Working Unit Exemption

Allowed because the task ID includes `VERIFY` and it is read-only closure.

## Checks

- all 17 mutation SWU owner receipts validate and follow exact successor order;
- W0 profile digest matches every dependent run;
- relation record is the sole semantic renderer input;
- all CR-01–CR-12 trace rows have accepted evidence or explicit residue;
- baseline/current/delta digests and runtime/teardown records revalidate;
- protected ontology/authority and historical package bytes are unchanged;
- authority, human, accessibility, promotion, release and production ceilings
  are preserved.

## Output

One read-only recomposition receipt. It may close the Body War candidate-local
prototype work pack but cannot authorize L3, promotion, release or production.
