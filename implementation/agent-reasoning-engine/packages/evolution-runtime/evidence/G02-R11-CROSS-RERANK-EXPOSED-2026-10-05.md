# G02 r11 local cross-encoder rerank — exposed development, 2026-10-05

## Objective and boundary

Test whether a pinned local MiniLM pointwise cross-encoder can select useful
additional files from the previously sealed source-only multi-view top-24 pool.
This is a counterfactual on the 12 already exposed r11 development pairs, not
new independent benchmark evidence or a change to the terminal r11 score.

The source-only [sealer](../research/g02-product-r4/seal-g02-r11-cross-rerank-exposed-r1.py)
consumed the pinned issue packets, exact base worktrees, sealed multi-view
ranking, and local ONNX model. It scored issue/path/source-preview pairs with
a 256-token limit and sealed three new file choices per task before gold
access. Private source seal SHA-256:
`66b16ee81080138faef55ec8bfc598bf6b0ff087484ec301872313e6aa274428`.
No DSH trace, gold label, or actual ARE-read result entered the sealer.

The separate [evaluator](../research/g02-product-r4/audit-g02-r11-cross-rerank-exposed-r1.py)
used the pinned native gold and score files only after sealing. Private
evaluator audit SHA-256:
`b7f945ac7aa4671851e71022a494d34e6daf379fad4491a73803a5ff8f10d97d`.

## Result

Across 12 tasks, 36 proposed additional files contained **one** previously
missed gold file and 35 false positives (2.78% precision), in one repository.
Counterfactual mean ARE File-F1 fell from **0.53597** to **0.33182**; the frozen
DSH mean was **0.56359**. No task improved and ten regressed. The predeclared
advancement gate failed (at least five gold hits, two repositories, 20%
precision, and nonnegative mean File-F1 change). Reject this exact reranker.

This test has a material diagnostic limitation: several 1,800-character
issue prefixes exceeded the shared 256-token pair budget, sometimes leaving
little or no file-card content after truncation. It establishes failure of
this exact implementation, not of every balanced-budget cross-encoder. Any
revision requires a new named, predeclared exposed study and then independent
transfer; it must not be scored as if this exposed cohort were fresh.

## Claim ceiling and open questions

No actual new reads, Span-F1, end-to-end cost, independent transfer, G02
superiority, or general ARE superiority is supported. The r11 terminal
12-pair comparison remains adverse to ARE on average. The next G02 mechanism
must improve both precision and candidate coverage under a fixed read budget
before consuming fresh pair supply.

Open questions: Can balanced query/card token allocation improve *selective*
read precision on exposed cases without sacrificing source-only reach? Can a
subsequent frozen rule beat DSH on a fresh, budget-admissible cohort rather
than on an exposed counterfactual?
