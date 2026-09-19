# Bounded archive/frontier live run result

Generation session98797 is terminal with clean child2668960 exit0, no forced
termination and absent process group. Four tasks used226,272 known model tokens
across64calls, zero unknown usage. All dispatched requests passed8K checks.

| Task | Outcome | Calls | Tokens |
| --- | --- | ---: | ---: |
| 1 | glm.incomplete-output | 4 | 16,638 |
| 2 | final_context_selected | 20 | 65,796 |
| 3 | final_context_selected | 20 | 68,075 |
| 4 | final_context_selected | 20 | 75,763 |

Task1's final HTTP200 receipt has finish_reason:length and2048output tokens at
the2048cap. The original response failure remains counted. Tasks2–4 finish with
conservative tokenizer charges144/144/142 versus actual request-tokenizer
receipts39/37/39. The exploration headroom cutoff can end discovery while both
model-token and actual tokenizer capacity remain. Its quality effect is unproven.

The all-or-none scorer preflight rejected task1 and skipped native evaluation of
all tasks. Zero F1 summary fields are placeholders, not measured quality scores.
No perfect-quality, matched savings or full-goal success claim. Next: exact result
review, descriptive native evaluation of completed slots1/2/3 with all costs kept,
and evidence census before selecting competing response-budget/accounting hypotheses.

## Open Questions

See ../BOUNDED-ARCHIVE-FRONTIER-R1.md. How much does conservative cache/index
measurement charging shorten useful exploration? Would different response
reservation prevent truncation without reducing evidence too much? What native
quality did the three completed outputs achieve?
