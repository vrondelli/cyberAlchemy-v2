# G01 r90 — compact Java declaration representation, exposed development

Inspired by published work on retrieval-oriented code representations,
build a deterministic, no-model file representation from the exact buggy
Java source: path, package declaration, declared type names, and up to 256
unique declaration-shaped method names. Use a pinned regular-expression
extractor; this is a lexical approximation, not a Java parser or semantic
summary. Index one representation document per source file with the pinned
BM25 implementation. Rank using the same sealed failure query and bind the
result to complete prior ARE/raw/symbol rankings. Compare raw+symbol+
structure against ARE+raw+symbol+structure, with the pre-existing
ARE/raw top-three consensus safeguard also reported. Apply any production-
file role filter equally to all arms only in the evaluator.

Run on both already exposed development populations: 12 GitBug-Java and 24
Bears repositories. No new model requests, fixes, patches, evaluator paths,
or untouched GitBug confirmation rankings. A cross-development gain would
justify a separately frozen confirmation attempt; it is not itself a claim.

## Open questions

- Does the compact declaration view recover file relevance hidden by
full-source length normalization?
- Is the gain stable across both Java development populations and stronger
matched comparators after common source-role filtering?
