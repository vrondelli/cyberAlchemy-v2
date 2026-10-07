# G01 BugSwarm second development cohort — metadata selection protocol

Status: fixed before selecting this second, distinct development cohort.
This is **not** the reserved confirmation cohort, source/log/label admission,
a model run, ContextBench, live ARE, or superiority evidence.

Use the exact pinned BugSwarm 1.3.1 metadata, sealed failure-side source
order, original 24-case exposed cohort, r1 development/reserved split, and
r2 repaired development metadata. Apply the same metadata eligibility
predicate as graph-development r1: active and reproducible fail→pass,
code-patch classification, 1–3 changed files, a failing test, numeric failed
job ID, and 40-hex failed/passed commits. This predicate uses dataset
post-fix metadata but no patch path, file score, GLM output, or evaluator
receipt. Its possible selection bias remains a claim caveat.

Exclude every repository in the original exposed 24, the r1 development 24,
the r1 reserved-confirmation 24, and the r2 repaired development 24.
Traverse the pinned source order separately for Python and Java. Keep only
the original r1 *development* repository-hash parity, then select the first
12 remaining distinct repositories per language, 24 total. Do not inspect
the reserved cases' source, logs, diffs, or labels. Do not replace or top up
the selected 24 after scoring; any source/log 404 requires a separately
versioned, score-blind repair with a fixed denominator.

This selection is metadata-only. Exact failed commits and original logs
must pass a separate preflight; exact source projection and independent
evaluator-only gold admission must then pass before ranking or GLM. The
existing HTTP-log/diff transport caveat remains unresolved.

## Open Questions

- How many of the 24 metadata candidates will admit exact GitHub HTTPS
  failing commits and job-matched original logs?
- Can source and gold projection admit all 24 without score-dependent
  replacement?
- What authenticated or independent source will verify HTTP logs/diffs?
