# Finding reference candidate: measured correction headroom

R1 real-tokenizer qualification failed on the first two measured branches:
initial requests were3994/3965 tokens, but feedback raised them to4056/4027.
Qualification stopped early with zero model calls. The original evidence and
implementation remain unchanged in finding-prompt-qualification-r1/.

R2 measures initial catalog prompts and a minimal correction feedback frame before
choosing the catalog. Both must fit; the reserve frame has10tokens additional
headroom. Catalog sizes descend through64,48,32,24,16,12,8,4,2,1,0 rather than
probing every integer. During correction, exact tokenizer measurements determine
how many diagnostic issues fit, down to zero explicit issues plus omitted count
and resubmission instruction. Every full diagnostic remains in durable evidence.
The catalog and native evidence mapping stay identical across both attempts.
Every actual dispatch still requires at most4K; if no correction fits, fail honestly.

All phase, task, worker and campaign budgets remain unchanged. R1 registration
remains the prospective interface hypothesis; this is a pre-live implementation
revision driven by tokenizer counterevidence, not a new quality claim.

Product frontier: real-tokenizer qualification and R2 integration tests, followed
by an exact live freeze and review. Operational owner: research operator;
D:/WSL disk and process checks apply. No fresh controls or release.

## Open Questions

Does the smaller catalog reduce quality? How often does feedback need truncation?
Can full task completion and native quality improve under unchanged budgets?
Untouched confirmation and the original15%token target remain unproven.
