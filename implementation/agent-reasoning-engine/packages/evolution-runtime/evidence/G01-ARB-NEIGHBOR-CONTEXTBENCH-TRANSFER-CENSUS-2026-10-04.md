# G01 transfer screen for the ARB test/source-neighbor rule

The matched-input ARB trace2code development result is promising within its
own workflow, but its exact test-to-source trigger does not appear often in
the G01 ContextBench issue population. This is a **gold-blind input census**,
not a live ARE run or quality result.

The [census script](../research/g01-fast-live-v1/audit-arb-neighbor-g01-trigger-census-r1.py)
(SHA-256 `14297bbfb644bab5a003ae1ed24075460026123c089cbc8a9d0598972d9cef8b`)
used only `instance_id`, `language`, `repo`, and `problem_statement` columns
from the pinned 1,136-row ContextBench parquet. It imported the exact
[ARB neighbor rule](../research/arb-trace2code-r1/probe-trace-source-neighbor-r1.py)
at SHA-256 `dd2fc32df6621afd054d5ede52a9894a08f7bf3b0ecbd09a60d95f27c58a6db5`.
One ContextBench issue value was null and counted as no mention. The private
`CENSUS.json` SHA-256 is
`7064a2b202e174525dd20f1b20b7fb8ed67fff14f575bf6f47b46e22135da930`.

Only **18/1,136 tasks (1.58%)** explicitly mention a filename matching the
rule's test-file patterns: 17 Python and one TypeScript. No C, C++, Go,
Java, JavaScript, or Rust issue matched. Actual ARB-style promotion can
trigger on **at most** those 18 tasks when given the full issue text; it also
requires the mentioned test to appear in the candidate ranking, a matching
source counterpart, and in the ARB comparison a 1,024-byte edge-window
mention. Those conditions can only reduce coverage.

This upper bound rejects direct promotion of this mechanism as a **general
G01 ContextBench** acquisition fix. It does not reject the ARB trace2code
development result or prove the 18 eligible G01 tasks would not benefit.
No model call, VPS transfer, native score, or gold read occurred.

## Open Questions

- What more common gold-blind source-coverage signal applies to G01 issue
  resolution tasks and can be tested in live ARE episodes?
- Can the ARB rule be qualified on a fresh trace2code population against
  RepoMap without implying transfer to ContextBench?
