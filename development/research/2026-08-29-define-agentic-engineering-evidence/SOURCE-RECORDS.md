# Source Records

Checked: `2026-08-29`

All external records below are arXiv records. Unless a venue is explicitly
stated on arXiv, treat the work as a preprint rather than settled consensus.

| Source | Method and population | Load-bearing finding | Important limit |
| --- | --- | --- | --- |
| SRC-ARXIV-ECL | 500 SWE-bench Verified tasks; two models and two scaffolds | evidence-conditioned execution improved Pass@1 by 4.8–11.8 points; structured conditions beat equivalent prose; tokens fell by up to 12.1% | bug repair benchmark; generated conditions can inherit issue or model blind spots |
| SRC-ARXIV-ACT | 200 human-verified already-resolved tasks; five models and four harnesses | agents made undesirable code changes in 35–65% of cases; non-action must be a valid success path | primarily Python issue repair; verification prompts can also cause over-abstention |
| SRC-ARXIV-APR | 220,612 closed PRs in 489 popular Python repositories; 9,428 agentic PRs | narrow, semantically well-defined tasks had higher and more stable mergeability | observational; merge and SZZ defect proxies do not establish causality or product value |
| SRC-ARXIV-CTX1 | controlled context-file evaluation across SWE-bench and repository tasks | context files generally did not improve task success and increased cost by more than 20% | repository overviews are not the same intervention as a task-specific Definition Pack |
| SRC-ARXIV-CTX2 | 288 evaluated runs; two agents; 17 tasks; three repositories | generic context strategy did not measurably move correctness in this sample | small Python-only task set; purpose-built task-specific context remains open |
| SRC-ARXIV-MIS | 20,574 real IDE/CLI sessions from 1,639 repositories | seven misalignment forms; 91.49% of visible resolutions required user correction | opt-in observable sessions; failures without visible pushback are missed |
| SRC-ARXIV-LOG | 4,550 agentic PRs from 81 repositories | 67% non-compliance with constructive logging requests; humans performed 72.5% of later repairs | one non-functional requirement; observational comparison |
| SRC-ARXIV-COMP | between-subjects study; 54 students; two web tasks | agents aided initial completion but harmed comprehension and later extension | in-progress preprint; students, constrained interface, narrow tasks |
| SRC-ARXIV-ISSUE | 18 repositories plus SWE-bench Lite system evaluation | test execution provided a stronger issue-to-code bridge and improved localization/resolution | depends on executable tests and traceable coverage; Python-specific mechanism |
| SRC-ARXIV-REVIEW | 31,073 CodeRabbit review/feedback pairs across 239 repositories | 56.3% of reviews were rejected; false positives, redundancy, scope, and intent mismatch were common | one review product; feedback is a proxy for usefulness |
| SRC-ARXIV-AIDEV | 932,791 agentic PRs across 116,211 repositories | establishes a large real-world research substrate | dataset contribution; no causal Define or productivity result |
| SRC-ARXIV-HUMAN | position paper | proposes alignment, verifiability, steerability, and adaptability | proposal, not empirical outcome evidence |
| SRC-ARXIV-READMES | 2,303 context files from 1,925 repositories | functional instructions dominate; security and performance are uncommon | characterizes content and maintenance, not downstream effectiveness |
| SRC-ARXIV-PRO | field observations N=13 and survey N=99 | experienced developers retain control and use expertise to bound agent work | qualitative 2025 use study; not a Define comparison |
| SRC-ARXIV-METR | randomized trial; 16 experienced developers; 246 tasks | early-2025 AI increased measured completion time by 19% despite perceived speed gains | older tools, small expert population, mature repositories |

## Version Boundary

The URLs and findings were checked at the stated cutoff. A future refresh must
inspect the arXiv version history before replacing these records.
