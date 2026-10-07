# G01 r70 VPS HTTPS log transport probe

R68 and r69 are terminal at 19/24 and 0/5 respectively. For their same
five transport-only failures, make one TLS-verified `curl` GET each from the
approved ARE VPS over SSH, streaming stdout to private WSL receipt storage.
No log is retained on the VPS. The URL, failed-job ID, and expected length
are unchanged from r68. Cap each stream at 8 MiB, zero automatic retries,
and require remote curl exit 0, exact r68 HEAD length, and strict UTF-8.

This is a separate transport feasibility result. It cannot retroactively
pass r68 or r69. A new source admission version must join successful logs
with r68's original 19 before ranking. No labels, scores, or GLM calls enter.

## Open questions

- Does the VPS route deliver the five complete HTTPS logs?
- If not, can a larger score-blind repository supply replace the missing
  cases without weakening the fresh-cohort claim?
