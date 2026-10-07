# G01 r84 — source-grounded symbol retrieval development

This is exposed development only. Bind the 12 r83 source trees, r81 failure
queries, and complete r83 ARE rankings. Build the unchanged 120-line-chunk
full-source BM25 file ranking. Independently derive a partial symbol ranking
from failing test class names in the sealed query: strip conventional test
suffixes, rank exact production filename stems, then token and package
overlap, returning at most 30 positive-score files. No gold path, diff,
patch, fixed-side code, or model call may be read by this source-side script.

Seal full-universe rankings for ARE, raw BM25, A=ARE+BM25 RRF(k=60),
B=BM25+positive-symbol RRF(k=60), and C=ARE+BM25+positive-symbol RRF(k=60).
Also seal C-safe, which starts from C but restores the A position of any
file appearing in both ARE and BM25 top three if C demoted it. This
consensus safeguard addresses the exposed r77 loss mode without using the
development labels. Report all variants; choose one fixed treatment and
strong comparator before confirmation. Do not infer a product or
superiority claim from this development experiment.

## Open questions

- Does a symbol channel add rank information beyond ARE and full-source
BM25, or merely duplicate their high-ranked files?
- Does consensus protection recover demotions without blocking genuine
improvements on ambiguous failures?
