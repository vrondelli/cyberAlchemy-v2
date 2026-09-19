# L0 — Corpus and Evidence Boundary

Status: `closed-with-explicit-residue`

Cutoff: `2026-08-20`

## Cohort Rule

The final cohort must cover distinct market shapes rather than simply collecting
popular coding assistants. Include a product only when current evidence shows at
least one of: autonomous repository work, specification-to-implementation flow,
multi-agent or delegated execution, managed enterprise operation, end-to-end app
construction, or an open execution harness suitable as a control comparator.

The intended representative cohort is:

| Stratum | Candidate products | Why the stratum matters |
| --- | --- | --- |
| software-factory/control plane | Factory.ai, Devin | persistent work, managed fleets, enterprise operation |
| cloud/PR coding agents | OpenAI Codex, GitHub Copilot agents, Cursor | asynchronous repository work, isolation, review, APIs |
| specification-led development | Kiro | requirements/design/tasks projected into execution |
| app-generation platform | Replit Agent | idea-to-running-app product experience |
| programmable/open harness | Claude Agent SDK or OpenHands | replaceable runtime and extension boundary |

The explorer may replace or add a candidate only by recording the selection rule,
the displaced candidate, and the reason. Breadth without a distinct stratum is not
a reason to expand the cohort.

## Product Evidence Required Per Candidate

- current product status and date checked;
- target user and advertised work unit;
- intent/specification and planning model;
- context, memory, repository, and knowledge model;
- task graph, agents, delegation, and concurrency;
- sandbox, permissions, secrets, network, and protected actions;
- implementation, test, review, security, and recovery loop;
- human approval, intervention, takeover, and rollback;
- API, integrations, observability, and structured output;
- deployment, enterprise administration, and pricing unit where public;
- explicit preview/beta/GA qualifiers and missing evidence.

## Market-Signal Corpus

Use a bounded set of sources that expose adoption, trust, realized delivery
effects, or enterprise buying criteria. Candidate anchors are DORA, Stack
Overflow, GitHub Octoverse, JetBrains Research, and one independent enterprise
market analysis. Preserve sampling method and vendor conflicts of interest.

No statistic may appear without its year, population, sample size or denominator
when available, measured question, and source caveat. Vendor-reported usage is a
vendor claim, not an independent market share estimate.

## Local Corpus

- `projects/domainspec-v2/README.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- the selected Inventory entries recorded in `strategy-inventory-packet.json`
- `sessions/2026-08-20-1150-factory-ai-vladimir-handoff.md`
- `sessions/2026-08-20-1150-factory-ai-vladimir-review/review.md`

Current bytes override older Inventory summaries for status. Inventory can find
evidence but cannot grant authority or prove the absence of repository knowledge.

## Negative-Claim Rule

The research must say “not found in the inspected sources” rather than “the
product lacks X” unless an authoritative source explicitly states the absence.
Proprietary internal behavior remains an open-world unknown.

## Volatility Rule

Pricing, limits, preview status, supported models, integrations, concurrency, and
deployment options are snapshot facts. They require a checked date and must not
be projected forward as stable contracts.

## Exclusions

- generic autocomplete-only tools unless they provide a necessary baseline;
- marketing listicles, affiliate rankings, SEO comparison pages, and anonymous
  market-size estimates;
- benchmark leaderboard scores without task-set and contamination caveats;
- source code or private repository material sent to external products;
- unbounded product enumeration that does not change a market stratum.

## Closure Record

The final comparison bound Factory, Codex, GitHub Copilot, Cursor, Replit,
Devin, and Kiro at exact official selectors. Claude Agent SDK/OpenHands remained
a stratum-level comparator without complete authoritative selector closure. The
cohort is representative by operating-model stratum, not exhaustive, and the
source freeze remains incomplete. No product was executed. These limits are
carried into `findings.md` and `residue/open-residue.md`.
