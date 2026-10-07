# H-EN source and process repair R2

Status: local construction complete; independent review pending. Live admission
and tokenizer qualification remain false.

## Repair Boundary

This additive repair answers the two blocking findings in
[the rejected R1 review](EVIDENCE-NEIGHBORHOOD-FRONTIER-REVIEW-R1.md). It does
not revise that review or convert its rejection into approval.

- Canonical indexed content is the raw blob byte sequence named by the pinned
  Git tree. A single bounded `git cat-file --batch` process supplies those bytes;
  worktree bytes are not indexed or credited.
- The parent runs the Python worker in its own Linux process group with bounded
  stdin, stdout, stderr, deadline and termination grace. Cancellation or timeout
  signals the entire group, escalates to `SIGKILL`, waits for pipe closure and
  verifies group absence before returning.
- Parent commit and clean-worktree verification now runs after success and every
  worker failure. A post-verification failure cannot be hidden by the worker's
  result.
- The actual offline replay analyzer now uses this parent boundary and records a
  settlement receipt per task.

## Validation Evidence

The focused Node suite passes 11/11 tests. It covers ordinary multi-facet use,
dirty input, assume-unchanged substitution, skip-worktree substitution, CRLF
worktree divergence, request envelopes, deadline escalation, cancellation,
surviving descendants, post-run mutation and clean bounded success.

The immutable supervised
[R7 replay](EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R7.json) has SHA-256
`4aff86d1b72e6c872f97642dc528e4ad777ad927fe60b82fee812ba09aceae72`.
All four workers exited zero, required no force, and had absent process groups.
The replay again recovered all nine missing labeled files and projected mean
labeled-file acquisition from 46.7% to 100%. It made zero provider and model
calls. This remains exposed-cohort path-acquisition evidence, not delivered
model evidence, native quality, token savings or untouched confirmation.

The reset environment's four retained repositories were reconstructed from their
public origins at the exact frozen commits. Historical config paths were not
edited. The analyzer relocates only the known checkout and user-cache prefixes,
then verifies task-file SHA-256 and repository commit/cleanliness before use.

## D65 Construction and Operational Lanes

Product frontier: independent construction review of the exact R2 sources and R7
evidence. H-EN compression, integration and tokenizer qualification remain
blocked until that review closes both R1 findings.

Operational state: native Node, npm, Python, repository Rust/C toolchain and
Docker are available in the restarted WSL instance. The reconstructed repository
caches are user-local operational support, not published product artifacts.
Provider credentials, model dispatch, controls, release and deployment were not
used or authorized.

## Open Questions

Will independent reconstruction accept the raw-Git-byte policy and settlement
receipts? What bounded hint representation retains the nine recovered paths
inside real 8K prompts? Can the mechanism transfer beyond the exposed cohort?
Perfect native quality, matched 15% savings and untouched confirmation remain
unproven.
