# G01 r68 authenticated failure-log preflight

Status: frozen before r68 log requests. Source population is the exact
24-case r67 source-side cohort; no labels, rankings, or provider outputs may
be read by this preflight.

For each case, obtain the BugSwarm HTTPS artifact page and raw-log HEAD at
the exact failed-job ID from pinned 1.3.1 metadata. The page must identify
the repository and job. The raw endpoint must advertise a positive length
at most 8 MiB. Fetch the raw log once, zero automatic retries, and require
HTTP 200, exact declared length, strict UTF-8, and a byte receipt. Retain
the raw log only in mode-700 private WSL storage. No raw log goes to the VPS.

All 24 must pass for this exact cohort. Any failure is terminal for r68; a
separate source-order replacement or transport study would be required.
No metric, ranking, or superiority claim follows from log admission.

## Open questions

- Does the HTTPS log endpoint deliver 24/24 byte-complete logs within cap?
- Can a frozen query projection safely bound every authenticated log for the
  unchanged 8K r61 transfer?
