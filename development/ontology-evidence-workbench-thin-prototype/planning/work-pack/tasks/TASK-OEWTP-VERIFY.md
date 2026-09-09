# TASK-OEWTP-VERIFY: Recomposition and Claim Audit

## Objective

Review the four closed SWU receipts as one L0/L1 chain and decide whether the
bounded first-working-prototype claim is supported.

- Layer: L1/L2 boundary
- Wave: W5 close
- Dependencies: SWU-OEWTP-001 through 004 source and owner receipts pass
- Implementation mutation: none
- Planning-evidence output owner:
  `invoke:refresh:read-only-verification-close`

## Smallest Working Unit Exemption

Exempt because the task ID contains `VERIFY` and the task performs read-only
closure review. It creates one declared planning result and one owner receipt,
but no implementation behavior, and must not repair failed evidence.

## Review contract

1. Verify all four Task Session receipts and owner closeouts are present,
   terminal, current, and linked in order.
2. Prove every file touched is inside the corresponding SWU write scope.
3. Recompute the old development-package and implementation-package authoring
   baselines as applicable; distinguish intended implementation deltas from
   forbidden old-package deltas.
4. Recompose:
   typed admitted overlay → immutable Vite dist → exact loopback gateway → real
   Poker-Team browser receipt → read-only closure and claim-ceiling audit.
5. Confirm all planned witnesses have runtime evidence or remain explicitly
   unproved.
6. Confirm no package manifest was added or changed and no generalized runtime
   root exists.
7. Confirm the claim text is limited to one local automated Poker-Team journey.
8. Count like-for-like operations only over identical boundaries; otherwise
   retain the simplification measurement gap.
9. Route any failure to the owning SWU. Do not widen scope, re-run mutation, or
   mark the feature complete.
10. Record independent immutable browser-receipt verification as deferred L2;
    this audit must not simulate or claim that authority.

## Output

- [Review result](../results/TASK-OEWTP-VERIFY-RESULT.md)
- [Owner receipt](../session-evidence/TASK-OEWTP-VERIFY/20260729T185728Z/receipt.json)

The verification attempt reuses the concrete SWU-OEWTP-004 attempt bound
before browser mutation, as required by the closeout row.

Possible verdicts:

- pass: first local browser-testable prototype is evidenced;
- flag: prototype evidence passes but named non-critical residue remains;
- block: an acceptance-critical binding, assertion, closeout, or authority
  ceiling fails.

This task cannot establish ontology correctness, product acceptance, release,
deployment, production, or promotion.
