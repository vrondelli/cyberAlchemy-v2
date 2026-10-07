# G01 r55 result

Status: stopped after frozen feasibility gates failed  
Claim ceiling: exposed feasibility evidence only

## Outcome

R55 tested the operational feasibility of structured query expansion and
full-universe CodeRankEmbed retrieval over all 48 exposed BugsInPy r1+r2b
cases. It did not reach label scoring because two predeclared feasibility
requirements failed first.

### Structured expansion

- Tokenizer admission: 48/48
- Generation transport: 48/48 attempts
- Strictly valid expansions: 26/48
- Known usage: 20,689 prompt tokens and 8,305 completion tokens
- Provider elapsed time: 193.169 seconds

Invalid classifications were 12 closed-schema shape failures, four
non-verbatim identifiers, two non-verbatim error types, and four provider
finish/status failures. JSON mode eliminated non-JSON response handling but did
not enforce the application schema.

### Full-universe CodeRankEmbed

The pinned model and environment loaded successfully offline. The first atomic
case (`r1/black/19`) ranked 80 files through 156 nonoverlapping 120-line windows
in 726.252 seconds. R2b alone contains 42,106 projected file instances. The
resulting multi-day CPU projection was incompatible with the accelerated
benchmark workflow, and r55 could no longer advance because its mandatory
48/48 expansion gate had already failed. Execution was stopped after the first
complete case; that checkpoint was preserved and no partial second-case output
was admitted.

## Decision

R55 is rejected as a production-feasible formulation. This does not reject the
semantic model's ranking signal, which was not scored. The next exposed cycle
tests CodeRankEmbed as a bounded reranker over the existing ARE/chunk top-20
union, using one deterministic query-matched 80-line window per candidate and
a 512-token ceiling. Candidate-generation expansion remains a separate future
hypothesis rather than being silently removed from r55.

Structured expansion should become an optional channel with a prospectively
defined raw-query fallback; JSON mode is formatting control, not schema or
semantic validation.

## Open questions

- Does bounded CodeRankEmbed reranking improve early-rank metrics enough to
  justify its CPU cost?
- Can tool/function calling provide stronger schema adherence than JSON mode?
- Should full-universe semantic retrieval move to a GPU execution profile?
