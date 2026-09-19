# W6 — L5 One Complete Proof Unit

## Question

Can one stage-eligible frozen member traverse O_gen, exact join, TestCase,
binding, raw execution, evaluation, fresh mutation, receipt, and replay?

## Entry, Work, Exit

Entry requires L0, W4, and one eligible W5 member. Exit requires one complete
ReplayResult with exact roles, one-per-key projections, evaluator independence,
fresh reason-specific mutation, raw-handle receipt, and independent replay.
This proves mechanism only; it cannot open consumers or claim breadth.
