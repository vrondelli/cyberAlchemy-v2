# G01 r14 partial observations — private development only

Status: the frozen 24-task campaign is [terminal failed](G01-R14-TERMINAL-NOTE.md) after 12 scored pairs, one unscored pair, and 11 unattempted tasks. This note is not a native aggregate analysis, a protocol amendment, a replacement task selection, or a superiority claim. The authoritative receipts remain under `/opt/are/evolution-runtime/g01-product-replication-r14/` with a checksum-matched private WSL cold copy.

At the five-pair checkpoint, five pairs had scored. Pairs 2–4 passed all four per-pair directional checks. Pair 1 missed Span-F1. Pair 5 (`python-langchain-a18cb311`) lost to control on native Span-F1 (**0.2392 vs 0.6486**), known model tokens (**41,762 vs 17,238**), and arm duration (**148.71 vs 85.24 seconds**); both arms had File-F1 1. The candidate made 13 calls and control seven. These are partial exposed-development observations only; the prospective gate requires 24/24 valid scores and origin-clustered paired intervals.

Pair 5's sealed prediction provides a concrete follow-up hypothesis: both arms selected `langchain/document_loaders/web_base.py`, but the candidate's four final spans cover 155 unique lines after overlap coalescing, versus one 40-line control span. Its `span-refinement.json` records zero changes. This is consistent with overly broad terminal span selection and repeated acquisition increasing both token cost and false-positive span mass. It does **not** prove causation or justify changing the active frozen candidate. After terminal campaign accounting, test a separately versioned source-only span-coalescing/narrowing policy on exposed development cases before any fresh unexposed confirmation.

A read-only six-pair comparison qualifies that hypothesis: the Ansible candidate covered 121 unique final-span lines versus the control's 11 and nevertheless gained 0.9774 Span-F1 while using 0.39 times the control's known tokens. Scikit-learn covered 30 versus 60 and also gained Span-F1. Width alone is therefore not a reliable relevance or cost surrogate in this small exposed set. Any successor policy must use source-grounded relevance signals and test false negatives, not merely impose a smaller span cap. These diagnostics do not change the frozen r14 protocol or its aggregate gate.

## Open Questions

- What source-level cause made the candidate exhaust non-tool corrections on the unscored Sphinx pair?
- What do the 12 scored pairs show after independent audit, strictly as development diagnostics?
- Can source-grounded terminal span selection reduce pair-5-style false-positive mass without losing pair-2-style true coverage, before a separately frozen successor?
