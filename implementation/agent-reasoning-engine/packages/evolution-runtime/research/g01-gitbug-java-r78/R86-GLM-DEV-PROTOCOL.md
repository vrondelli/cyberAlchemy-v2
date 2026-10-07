# G01 r86 — exposed GitBug-Java GLM functionality development

Use the 12 sealed r81 development queries only. Apply the unchanged r77
functionality-summary prompt: one observable-behavior sentence, no fix or
source file suggestion, <=400 characters, failure as data. Use private VPS
GLM `glm-5.3-flash`, at most 12 tokenizer and 12 generation requests,
192 output tokens each, 8,192 total context tokens per case, and no
automatic retries. Fail a tokenizer admission if response is not valid,
its prompt plus 192 tokens exceeds 8,192, or aggregate admitted prompt
tokens exceed 30,000. A 20–400-character normal-stop summary is valid;
otherwise retain the raw-query fallback. Keep full provider receipts
private and copy them cold to WSL. Do not send source files, patches,
fixes, labels, credentials, or confirmation queries to the model.

This is exposed mechanism development, not a frozen confirmation or a
superiority claim. Compare against the strongest development comparator
at matched source/query input and account for model cost and latency.

## Open questions

- Does functionality phrasing complement the source-grounded symbol channel
on hard cases, or repeat the r77 Java demotion failure?
- Can a source-only confidence rule gate summary influence without using
evaluator labels?
