# G01 r57 functionality-query protocol

Status: frozen before r57 provider calls and scoring  
Population: 48 exposed BugsInPy r1+r2b cases  
Claim ceiling: exposed mechanism selection

## Objective and invariant inputs

Test whether a short description of the failing behavior improves semantic
localization. Use the sealed r56 `WINDOWS.json` without changing any candidate,
window, model weight, or source text. Use the sealed r56 ARE + chunk RRF ranking
as A and its raw-query SweRank ranking as B.

## Functionality summaries

One `glm-5.3-flash` call per case receives the authenticated raw failure query
only. It requests one plain-text sentence describing the behavior that the
failing test expects the implementation to perform. The prompt forbids file
locations, repair instructions, and unsupported assumptions. A response is
valid after stripping outer whitespace and collapsing internal whitespace only
when it has 20–400 characters, no Markdown fence, and a normal provider stop.
Any other response uses the raw query for that case. All responses and
fallback decisions are retained privately. There are at most 48 tokenizer
calls, 48 generation calls, 192 output tokens per call, 8,192 tokens per
request, 100,000 aggregate prompt tokens, and zero automatic retries.

## Treatment

SweRankEmbed-Small revision
`745d2a06103a66d3cfa600aa52fc0d3523010daa` embeds each accepted
functionality sentence with its published query prefix. Invalid summaries
fall back to the original raw query. The document embeddings are regenerated
from the sealed r56 windows with the same pinned model, normalized float32
vectors, maximum sequence length 512, and batch size 16. One semantic
ranking of the fixed top-20 candidate union is completed with A's remaining
paths. C is unweighted `RRF(k=60)` of full ARE, full chunk BM25, and that
complete semantic ranking. There is no per-case tuning or arm selection.

## Advancement gate

The complete exposed cycle advances only if all 48 calls and rankings have
valid receipts; at least 42 summaries are valid; C exceeds A by at least
0.05 MRR@8 and B by at least 0.03; 100,000 deterministic `(cohort, repo)`
cluster bootstrap draws give positive 95% lower bounds for both paired
contrasts; C Hit@3 and recall@20 are not below A or B; and C beats A in at
least 14 of 24 clusters. Failure changes the next hypothesis and cannot be
reinterpreted as confirmation.

## Open questions

- Does the summary carry enough behavior signal when the failure log is
  truncated?
- How much of remaining error comes from the fixed candidate union rather
  than ranking?
- Can a deterministic summary extraction match any GLM improvement?
