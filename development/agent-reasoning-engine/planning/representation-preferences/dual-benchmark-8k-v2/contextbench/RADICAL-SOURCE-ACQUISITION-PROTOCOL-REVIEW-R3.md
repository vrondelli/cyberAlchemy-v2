# Radical source acquisition protocol review R3

Verdict: sufficient for prospective native registration and bounded candidate construction. No blocking design contradiction found. This is a design review, not implementation verification or live admission. No model, tokenizer or evaluator calls were made; prior protocols and reviews remain unchanged.

## Resolved design findings

R3 resolves the principal R2 decisions: text matches anchor disjoint windows; path-only matches yield one bounded fallback; file postings are admitted atomically in sorted order; path terms count explicitly in postings and df; query bytes and normalization order are bounded; ranking uses integer units with pinned Python arithmetic. The earliest-uncovered-anchor rule ensures each matching line belongs to one window, with context trimmed against the previous window. Matching-window counts precede response truncation.

The memory claim is now correctly virtual address space, enforced by startup-verified RLIMIT_AS, with parent timeout and process-group settlement. Inventory/manifest/output bounds and reserved failure persistence distinguish partial corpus admission from failed construction. Corpus size evidence remains a feasibility input, not proof that postings or runtime fit.

The scientific treatment is distinct from archive lookup: it searches unread pinned source but delivers only hints. Native base reads alone grant source evidence. Optional tool use, unchanged repair duties, four assignments, two workers, 8K/96K limits and suspended controls are explicit. Perfect quality, the original 15% total-model-token target and untouched confirmation are preserved without claiming them achieved.

## Concrete implementation boundaries

- Additive descendant of `receipt-budget-episode-r2.mjs`: exact toolset dependency check (line 20), available tool construction (line 47), and unknown-tool/dispatch check (line 70). Pin the index summary and schema before initial request measurement.
- Additive admission adapter based on `bounded-archive-frontier-admission-r1.mjs`: validator construction (line 9), successful-tool allowlist/unit derivation (lines 23–40), and projection (line 45 onward). Hint reduction must update omitted counts without duplicating or granting observation identity; failed results stay failed.
- Preserve the source-credit exclusion in `bounded-archive-frontier-delivery-r1.mjs` and `observationItems` in the recovery module. A hint must never become an observation merely because it contains a path/hash/range. Verify with saved prediction reconstruction.

Construction should pin exact normalizer code plus Python/Unicode version; canonical query-digest JSON shape; source line splitting matching native repository reads; and metadata-only/no-hit behavior. These are testable implementation details within R3, not reasons for another design branch. Interpret the global budget rule as stopping further admission at the first sorted budget exclusion, rather than silently skipping ahead to smaller files. Account temporary artifacts in the total output reservation and demonstrate parent failure persistence under worker memory exhaustion.

## Required evidence before execution

Native registration must bind this protocol, ancestor, schedule and unchanged budgets/criteria. Tests must cover empty files, path-only and overlapping matches, deterministic ties, partial manifests, every resource bound, hint-only zero credit, subsequent base-read credit, mutation-independent base hints and whole-hint omissions. Production reconstruction, storage, exact dependency freeze, real initial-window qualification and separate live review remain pending. Index construction must not add a third concurrent worker during another live campaign.

## Exact reviewed bindings

- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/RADICAL-SOURCE-ACQUISITION-PROTOCOL-R3.md` — `8d04ad912b4114bb737d72201ebe092d2fe9d5cc423c81ffb0666451cdb13e50`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/RADICAL-SOURCE-CORPUS-SIZES-R1.json` — `ba3e00737ba401875c4fa1255136d8a10286860ec9cfc9fb9a18dce5d12113c7`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/RADICAL-SOURCE-ACQUISITION-PROTOCOL-REVIEW-R2.md` — `72300c243f14e0b3956331672fb0d898dfce18a9aa5e2b3bc1611632027ff401`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/receipt-budget-episode-r2.mjs` — `9a9401e411d8b114597023ac772c00206a7c0d0c0d002b6893ecfc29bd0716c1`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-admission-r1.mjs` — `c11ccad82f8631112cc0e98817065a6049f7deaf3abdf60868dcc60413d63375`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-delivery-r1.mjs` — `ac2aff4dee4348dec76562331267f20a3e5a137bd9da9e0a2d957fa5c8d48e20`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-recovery-r1.mjs` — `d201ac02ac47daf28d780eb3bcd68d273e4986988ad2da62c8152aa35297683b`

## Open Questions

Will actual postings, memory and runtime fit all four corpora? Will models use the hints to acquire useful evidence, and retain it through interpretation and final selection? These require construction and prospective measurement. No causal architecture, benchmark-quality, matched-savings or full-objective conclusion follows from this design review. R3 owns these unresolved questions.
