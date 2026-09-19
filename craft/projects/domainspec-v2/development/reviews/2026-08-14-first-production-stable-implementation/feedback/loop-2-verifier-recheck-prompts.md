# Verifier recheck prompts — loop 2 of 2

## Counterexample verifier

Recheck only the final loop-2 revisions in attacks.md and findings.md against
your prior receipt, the system-boundary receipt, the exact feedback prompt, and
the updated receipts/synthesis.json. Confirm the frozen aggregate first. For
CR-01, CR-05, CR-07, CR-08, CR-09, CR-11, CR-14, CR-15, and the candidate
shortlist, return CLOSED or BLOCKED with exact line citations and a concise
reason. Confirm that every previously unexecuted campaign is now labeled as an
obligation/risk rather than a verified defect, and that no previously supported
finding was lost. Do not start new broad exploration or tests. Return ACCEPT
only if all requested fixes are closed; otherwise return one bounded BLOCKED
ledger. No file writes.

## System-boundary verifier

Recheck only the final loop-2 revisions in attacks.md and findings.md against
your prior receipt, the counterexample receipt, the exact feedback prompt, and
the updated receipts/synthesis.json. Confirm the frozen aggregate first. For
CR-01, CR-05, CR-07, CR-08, CR-09, CR-11, CR-14, CR-15, and the candidate
shortlist, return CLOSED or BLOCKED with exact line citations and a concise
reason. Confirm authority direction remains separate, surface ownership is
partitioned, schema/profile/runtime/release claims do not collapse, and the
shortlist is not described as current, minimum-proven, coherent, stable, or
authorized. Do not start new broad exploration. Return ACCEPT only if all
requested fixes are closed; otherwise return one bounded BLOCKED ledger. No
file writes.
