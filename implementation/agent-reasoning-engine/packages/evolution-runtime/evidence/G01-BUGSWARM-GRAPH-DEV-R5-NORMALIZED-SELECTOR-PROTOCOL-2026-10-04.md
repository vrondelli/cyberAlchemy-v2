# G01 BugSwarm graph development r5 — normalized selector protocol

Status: **fixed before r5 model calls or r5 evaluator access**. This is a
new 24-call private development run on the *same exposed* 24-case cohort;
it is not fresh confirmation, ContextBench, live ARE, or superiority. The
reserved repository-disjoint confirmation cohort remains unopened.

R5 reuses the exact sealed r4 packets and their 24/24 same-account
`glm-5.3-flash` tokenizer admissions. Candidate IDs, prompt text, source
evidence, 8K window, 512-token output reserve, and r2-then-r3 candidate
union are unchanged. R4 generation responses are **not carried or rescored**
as r5 predictions. R5 makes exactly one new GLM call per case, no automatic
retries. HTTP/provider failure stops dispatch; a parse-invalid response is
counted invalid and dispatch continues.

The only change is the response contract. The entire model text must parse
as a JSON object with exactly one key, `candidate_ids`, holding an array of
at most eight values. Each value may be (1) a JSON integer candidate ID,
(2) a canonical nonzero decimal string with no leading zero, or (3) an exact
candidate path string from that case's packet. Paths are compared byte-for-byte
to listed paths; no fuzzy matching or path normalization. After conversion,
all IDs must be in range and distinct. Booleans, floats, signs, whitespace
within values, extra keys, unlisted paths, duplicates, and other output fail.
Valid selected paths are ordered as returned, followed by unselected r2
paths in r2 order; this complete ranking is sealed before evaluator access.

The generation freeze binds the r4 packet SHA-256, source-only packet seal,
r4 tokenizer result and all 24 case admissions, this protocol, runner,
transport, model, and endpoint. Cost bounds: 24 model calls maximum, 512
output tokens per call, <=130,000 summed prompt tokens, no retries. All 24
must be valid. The unchanged quality gate then requires MRR@8 >=0.43234,
>=16/24 wins versus the unchanged ARE baseline, a positive repository-unit
20,000-draw paired bootstrap 95% lower bound versus ARE, and >=20/24
top-30 gold reach. Report r5-minus-r2 separately. Any failed component
fails r5; no post-hoc parser relaxation or denominator repair.

A pass would justify considering the unopened confirmation cohort only after
source provenance/admission is independently resolved. It would not itself
establish product superiority. Original BugSwarm logs/diffs remain
HTTP-transport-provisional.

## Open Questions

- Will the frozen parser yield 24/24 valid selections on a new one-shot run?
- Will r5 preserve r2's existing wins while converting extra candidate reach?
- How will source evidence be authenticated or reproduced for fresh claims?
