# Exported source coverage decomposition R2

This corrects the claim ceiling of R1, whose immutable evidence is preserved.
The scored mean recall gap consists of 58.4011% absent from the exported,
confirmed source union and 7.8569% present in that union but not selected.
The arithmetic is unchanged. Missing exported coverage does not prove that raw
reads/search/recovery never returned the source. Delivery filtering, archives
and source projection may also account for missing exported coverage.

For this fixed exported union, ideal selection with perfect precision has a
51.2799% mean F1 ceiling. This is conditional: recovering further evidence changes
the union and its ceiling. It does not prove that retrieval alone is the required
fix or that all available runtime evidence is represented in the union.

[Machine report](SELECTION-LOSS-ANALYSIS-R2.json) pins reviewed score and task
sources. Reproduce with `python3 analyze-selection-loss-r2.py`. Two executions
were byte-identical and all decomposition/source-review checks passed.

## Open Questions

A complete raw-output -> confirmed-delivery -> base-projection census is required
to localize missing union coverage. The independent ledger visibility audit
still motivates H-L, but repetition and omission alone do not establish causality.
