# Source Claim Ledger

| Claim ID | Claim | Kind | Sources | Integration decision |
| --- | --- | --- | --- | --- |
| CLM-001 | Structured evidence conditions can outperform an equivalent natural-language summary in bounded bug-repair agents. | primary-source | SRC-ARXIV-ECL | `borrow-carefully` |
| CLM-002 | Agents often act when no code change is needed unless non-action and verification are explicit. | primary-source | SRC-ARXIV-ACT | `borrow-carefully` |
| CLM-003 | Narrow, semantically well-defined agentic tasks have higher and more stable mergeability in the inspected PR corpus. | primary-source | SRC-ARXIV-APR | `borrow-carefully`; do not convert association into causation |
| CLM-004 | Generic repository context files do not reliably improve correctness and can add cost. | primary-source | SRC-ARXIV-CTX1, SRC-ARXIV-CTX2 | `block` generic-documentation rationale |
| CLM-005 | Intent, rule, scope, implementation, execution, and progress-reporting failures create repeated user correction. | primary-source | SRC-ARXIV-MIS | `borrow-carefully` as metric taxonomy |
| CLM-006 | Human cleanup can hide agent deficiencies from PR-level success measures. | primary-source | SRC-ARXIV-LOG | `borrow-carefully` as burden metric |
| CLM-007 | Faster initial completion can coexist with weaker human understanding and continuity. | primary-source | SRC-ARXIV-COMP | `borrow-carefully`; population limit retained |
| CLM-008 | Executable tests can connect issue meaning to affected implementation more strongly than prose matching alone. | primary-source | SRC-ARXIV-ISSUE | `borrow-carefully` as verification route |
| CLM-009 | More tests, larger PRs, or faster merges do not by themselves prove semantic quality or productivity. | local-inference | SRC-ARXIV-APR, SRC-ARXIV-LOG, SRC-ARXIV-METR | `promotion-candidate` only as experiment guardrail |
| CLM-010 | A Definition Pack must be tested against an information-matched prose condition, not only ticket-only baseline. | local-inference | SRC-ARXIV-ECL, SRC-ARXIV-CTX1, SRC-LOCAL-PACK | `borrow-carefully` |
| CLM-011 | The pack and runtime evidence gate are separate interventions and need separate conditions. | operator-reading | SRC-ARXIV-ECL, SRC-LOCAL-PACK | `block` combined-attribution design |
| CLM-012 | Define should treat implement, abstain, ask, and escalate as possible valid outcomes. | operator-reading | SRC-ARXIV-ACT, SRC-LOCAL-DEFINE | `future-work` for runtime design; experiment records all four |
| CLM-013 | Current evidence justifies a pilot, not a claim that Define improves planning or implementation. | local-inference | complete corpus | `block` product-effectiveness claim before live evidence |
| CLM-014 | No direct Jira, Linear, epic, story, or sprint comparison was found in the inspected arXiv corpus. | open-residue | bounded search record | `future-work`; use a separate historical/project-management corpus |

## Misuse Blocks

- Do not call context-file null results evidence that definitions never help.
- Do not call ECLoop a validation of CyberAlchemy Define.
- Do not treat mergeability, test count, or document length as semantic quality.
- Do not attribute evidence-gate outcomes to the Definition Pack condition.
- Do not claim general developer productivity from a prepared or synthetic run.
