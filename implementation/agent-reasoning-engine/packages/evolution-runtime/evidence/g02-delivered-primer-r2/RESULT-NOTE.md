# G02 delivered ranked primer — exposed-task screen rejected

The credential was present on the VPS; the run used it without printing or
copying the secret. The R1 slot stopped before any model request because the
generated episode overlay was mode `0600` and the benchmark container ran as
UID 65532. Its pre-model failure remains at
`/opt/are-benchmark-runs/g02-delivered-primer-r1`. R2 used a separately
labeled slot and a hash-pinned `0644` overlay.

The underlying compact prompt builder replaces the system message after the
ranked-source primer was appended. Earlier diverse-primer/no-archive captures
show that the primer was absent from the model request. R2 restored the
appendix after compaction while preserving the pinned VPS episode snapshot.
The first actual R2 prompt capture contains `Deterministic pinned-base source
hints`; all 27 captures are retained in the [receipt archive](G02-DELIVERED-PRIMER-R2-RECEIPTS.tar.gz).

R2 completed with `final_context_selected`, 27 model calls, 345,060 known
model tokens, zero unknown-usage requests, and 317.83 seconds. Native
Span/File-F1 is `0.4141253706`/`0.2758620690`. Against the pinned DSH row
`0.3960750270`/`0.4000000000`, 482,228 tokens and 223.41 seconds, Span-F1
rose and tokens fell, but File-F1 fell and wall time rose. The
[native screen](native-screen/screen.json) rejects the predeclared joint
quality gate; the wall-time condition also fails. No fresh matched control or
generalization claim follows from this now-exposed task.

Receipt archive SHA-256:
`f673d10d77dcd20ada17f3903c37edc7dc0df6b36bd391eb35303b6ff94b5080`.
The archive includes the pinned task/code, captured requests, transport
ledger, and settlement, but excludes source checkouts and credentials. VPS
run root: `/opt/are-benchmark-runs/g02-delivered-primer-r2`.

Decision: reject primer delivery as a sufficient G02 candidate. Keep the
delivery fix and test; future source-acquisition hypotheses should use
prospective tasks and verify actual prompt content before interpreting a
prompt intervention.

## Open Questions

Which acquisition or selection mechanism can preserve semantic support-file
coverage while meeting both native quality metrics and the token/time gates
on an untouched cohort?
