# Comparison window review

Approved as a pure parsed-evidence window checker. Four tests passed independently. The exact historical replay also reproduced after verifying all four source bindings: 28 model requests, maximum projected reservation 6,768 tokens, retained reasoning in 25 requests. No provider calls occurred. Exact source and replay bindings are in the companion JSON.

Tokenizer body construction, retained-reasoning prefix and cached measurement reuse match the inspected native transport under its fixed profile. Every physical model call is checked against measured input plus configured margin/retained reasoning and reserved output; exact 8,000 passes and 8,001 rejects. No scoped blocking defect found.

Pair with ledger R2. This is a <=8K proof, not proof of a stricter recycler threshold or complete admission lifecycle. Safe file/campaign bindings, process settlement and twelve-outcome integration remain pending. Historical reconstruction establishes neither benchmark quality nor savings and grants no live admission.

## Open Questions

Owned by [COMPARISON-WINDOW.md](COMPARISON-WINDOW.md).
