# G01 BugSwarm selective-GLM r37 — unchanged failure-query protocol

Status: fixed before query projection, ranking, labels, or GLM calls.

Transfer the exact development-r2 query rule at SHA-256
`6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872`:
use at most the first 256 UTF-8 bytes of failure-side failed-test names, then
the ANSI-stripped tail of the authenticated failed-job log, redact the same
sensitive-looking patterns, and enforce a final 1,024-byte UTF-8 cap.

Inputs are:

- r34 source/log population result SHA-256
  `fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c`;
- r36 code-only projection SHA-256
  `14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395`;
- failure-side metadata SHA-256
  `5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686`.

Resolve each log only through its r34 evidence binding. Reverify slot, image
tag, repository, language, job ID, failed commit where present, uncompressed
byte count, and SHA-256 against the admission receipt. Stop on any mismatch;
do not substitute another log or shrink the 24-case denominator.

Store only the 24 bounded query rows and a hash-bound source seal in private
WSL storage. This stage makes zero network or model calls and opens no passing
source, patch, evaluator label, or score.

## Open Questions

- Do all 24 authenticated logs reproduce non-empty queries under the unchanged
  rule?
- What is the pre-gold top-1 disagreement between unchanged ARE and graph-r2?
- How many GLM calls will the frozen selective router avoid on this transfer?
