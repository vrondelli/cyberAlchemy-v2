# W8 — L7 Parallel Consumer Proofs

## Question

Do IOLM and Body War independently consume the same exact green core handle and
return replayable evidence without becoming DomainSpec authorities?

## Parallel Lanes

- L7A writes only the IOLM consumer package/run plus BTE replay output.
- L7B writes only the Body War consumer package/run plus BTE replay output.

Both start after W7, share no writable path, and join only after each returns a
fresh ReplayResult citing the same core. Failure in either leaves core intact
and blocks W9.
