## Agent 1 — Market structure, adoption, and maturity

{
  "action_id": "spawn-0001",
  "agent": "Porter, Michael",
  "role": "market-product-exploration",
  "capability": "research-tower",
  "target": "2026 software-factory market corpus",
  "mode": "explore",
  "cutoff": "2026-08-20",
  "status": "pass-with-explicit-residue",
  "mutation": {
    "policy": "read-only",
    "writes_performed": false,
    "output_files_written": [],
    "forbidden_scopes_touched_for_write": []
  },
  "files_read": [
    ".agents/skills/research-tower/SKILL.md",
    "projects/domainspec-v2/development/research/2026-08-20-software-factory-market/levels/L0-corpus.md",
    "projects/domainspec-v2/development/research/2026-08-20-software-factory-market/source-candidates.md",
    "projects/domainspec-v2/development/research/2026-08-20-software-factory-market/dispatch-sheet.json"
  ],
  "cohort_freeze": {
    "rule": "Retain products only when they represent a distinct work-unit or operating-model stratum; avoid breadth that merely adds another assistant.",
    "products": [
      {
        "product": "Factory.ai",
        "strata": ["enterprise software-factory control plane", "autonomous repository agent"],
        "maturity_snapshot": "Commercial product with individual, Business, and Enterprise plans; official docs describe sessions, Missions, managed fleet controls, APIs, and automated SDLC workflows.",
        "public_pricing_snapshot": "Pro $20/month; Plus $100/month; Max $200/month; Business and Enterprise custom. Enterprise advertises on-premise options, data residency, customer-managed encryption keys, and full administration.",
        "evidence_kind": "official product and pricing"
      },
      {
        "product": "Devin",
        "strata": ["enterprise software-factory control plane", "autonomous repository agent"],
        "maturity_snapshot": "Commercial managed agent with a live 2026 release stream and documented session/API surface.",
        "public_pricing_snapshot": "Commercial plans exist; exact current units should be rebound by the synthesizer from the live pricing selectors because plan packaging is volatile.",
        "evidence_kind": "official release notes and pricing"
      },
      {
        "product": "OpenAI Codex",
        "strata": ["cloud/PR coding agent", "autonomous repository agent"],
        "maturity_snapshot": "Commercial, broadly available across ChatGPT, IDE, terminal, worktrees, and cloud environments; official page advertises parallel agents and scheduled background work.",
        "public_pricing_snapshot": "Bundled access varies by ChatGPT tier and usage limits; the inspected pricing page exposes limited through maximum Codex access but did not expose stable currency values in retrieved selectors.",
        "evidence_kind": "official product and pricing"
      },
      {
        "product": "GitHub Copilot cloud agent",
        "strata": ["coding assistance", "cloud/PR coding agent"],
        "maturity_snapshot": "Commercial GitHub-native agent operating through repository issues and pull-request review surfaces.",
        "public_pricing_snapshot": "Plan and premium-request packaging is public but volatile; exact values require selector-level extraction at synthesis.",
        "evidence_kind": "official documentation and pricing"
      },
      {
        "product": "Cursor",
        "strata": ["coding assistance", "cloud/PR coding agent"],
        "maturity_snapshot": "Commercial coding agent with local/editor, cloud-agent, automation, review, SDK/API, and enterprise-control surfaces.",
        "public_pricing_snapshot": "Hobby free; Individual Pro $20/month; Teams Standard $40/user/month; Enterprise custom. Higher individual/team tiers use limit multipliers and usage-based billing.",
        "evidence_kind": "official documentation and pricing"
      },
      {
        "product": "Kiro",
        "strata": ["specification-led development", "coding assistance"],
        "maturity_snapshot": "Commercial specification-led development environment; retained because requirements/design/tasks are a distinct intent projection, not because it is another editor.",
        "public_pricing_snapshot": "Free; Pro $20/user/month; Pro+ $40; Pro Max $100; Power $200; enterprise custom. Add-on credits shown at $0.04/credit.",
        "evidence_kind": "official documentation and pricing"
      },
      {
        "product": "Replit Agent",
        "strata": ["app builder"],
        "maturity_snapshot": "Commercial idea-to-running-application experience with planning, build, testing/review, checkpoints, and deployment-adjacent product flow.",
        "public_pricing_snapshot": "Pricing is public but exact current plan/credit units were not preserved from the retrieved selectors; retain as volatility residue.",
        "evidence_kind": "official documentation and pricing"
      },
      {
        "product": "Claude Agent SDK",
        "strata": ["programmable/open harness"],
        "maturity_snapshot": "Programmable SDK/runtime comparator rather than an end-user software factory. It represents embedded agent-loop construction and extension boundaries.",
        "public_pricing_snapshot": "Underlying model/API consumption pricing; no separate stable software-factory seat price established in inspected sources.",
        "evidence_kind": "official SDK and pricing",
        "residue": "The supplied Anthropic documentation handle returned an internal retrieval error; re-resolve the current official SDK URL before exact binding."
      },
      {
        "product": "OpenHands",
        "strata": ["programmable/open harness", "self-hostable control plane"],
        "maturity_snapshot": "Active open ecosystem comprising Agent Canvas, composable Python Software Agent SDK, REST/WebSocket Agent Server, Automation Server, Sandbox Server, managed Cloud, and licensed Enterprise. Official docs mark the former local GUI as deprecated and the CLI as feature-complete/maintenance-oriented.",
        "public_pricing_snapshot": "Open-source components plus managed and enterprise offerings; no stable public price established in inspected selectors.",
        "evidence_kind": "official docs and public repository"
      }
    ],
    "excluded_or_deferred": [
      {
        "candidate": "Google Jules",
        "decision": "defer",
        "reason": "No distinct stratum demonstrated beyond the retained cloud/PR-agent group."
      },
      {
        "candidate": "Claude Code end-user product",
        "decision": "represented indirectly",
        "reason": "The bounded cohort uses Claude Agent SDK as the programmable-harness comparator; Claude Code adoption remains relevant market evidence but adding it as a tenth product would duplicate the repository-agent stratum."
      }
    ]
  },
  "market_taxonomy": [
    {
      "stratum": "coding assistance",
      "work_unit": "interactive edit, completion, chat, or bounded agent task",
      "maturity": "mainstream commercial",
      "examples": ["GitHub Copilot", "Cursor", "Kiro"],
      "boundary": "High adoption of assistance does not establish autonomous factory adoption."
    },
    {
      "stratum": "autonomous repository agents",
      "work_unit": "issue/task/session producing reviewable repository change",
      "maturity": "commercial and rapidly developing; human-supervised norm",
      "examples": ["Devin", "Codex", "Factory Droid", "Cursor cloud agents", "GitHub Copilot cloud agent"]
    },
    {
      "stratum": "specification-led development",
      "work_unit": "requirements -> design -> tasks -> execution",
      "maturity": "commercial but narrower and less independently measured",
      "examples": ["Kiro"]
    },
    {
      "stratum": "app builders",
      "work_unit": "idea -> application -> hosted result",
      "maturity": "commercial product category; semantic and operational assurance varies",
      "examples": ["Replit Agent"]
    },
    {
      "stratum": "enterprise software-factory control planes",
      "work_unit": "managed portfolio/fleet of sessions, workflows, repositories, policies, and telemetry",
      "maturity": "emerging commercial category; vendor-defined boundaries dominate",
      "examples": ["Factory.ai", "Devin"]
    },
    {
      "stratum": "programmable or open harnesses",
      "work_unit": "agent execution primitive or replaceable backend assembled by an operator",
      "maturity": "active developer infrastructure, not turnkey factory equivalence",
      "examples": ["Claude Agent SDK", "OpenHands"]
    }
  ],
  "market_signals": [
    {
      "claim": "AI-assisted development is mainstream, but this is broader than autonomous agents.",
      "measurement": "January 2026 JetBrains AI Pulse reports 90% regularly used at least one AI tool at work for coding/development and 74% used specialized developer AI tools.",
      "population_and_sample": "Over 10,000 professional developers worldwide; roughly 90% developer/programmer/SWE; eight languages.",
      "method": "Instagram-targeted developer recruitment, Zhihu in China, about 16% JetBrains panel; regional quotas and raking by region, experience, and JetBrains familiarity.",
      "conflict": "JetBrains conducts market research and sells competing AI developer tools."
    },
    {
      "claim": "Tool-level work adoption is fragmented and time-sensitive.",
      "measurement": "January 2026 JetBrains pulse: GitHub Copilot 29% used at work, Cursor 18%, Claude Code 18%, Codex 3%; Codex measurement preceded its desktop-app public launch.",
      "population_and_sample": "Same >10,000 global professional-developer pulse.",
      "method": "Respondent-reported use at work; not telemetry and not market share.",
      "conflict": "JetBrains is a competing vendor; weighting includes JetBrains familiarity."
    },
    {
      "claim": "Agent use increased, but monitored single-agent operation remained the norm in the April 2026 Stack Overflow pulse.",
      "measurement": "Among 1,100 developers and working professionals, 59% reported agent use at work at any frequency; 63% rarely or never allowed full autopilot; 60% blocked unapproved system changes; 68% preferred predictable single-agent setups. Setup question reported 69% single-agent, 17% multiple specialized, and 16% coordinated/overlapping agents.",
      "population_and_sample": "1,100 Stack Overflow developers and working professionals responding in late April 2026; detailed sampling/geography was not present in inspected article selectors.",
      "method": "Pulse survey; exact displayed question included coordination/monitoring of multi-agent activities.",
      "conflict": "Stack Overflow sells enterprise AI knowledge/data products; self-selection and a small pulse sample limit annual comparisons."
    },
    {
      "claim": "Trust remains a buyer constraint even at high assistance adoption.",
      "measurement": "Stack Overflow 2025 question 'How much do you trust the accuracy of the output from AI tools as part of your development workflow?': 46% distrusted versus 33% trusted; 3% highly trusted.",
      "population_and_sample": "33,244 respondents answered this question, stated as 67.8% of survey respondents; global Stack Overflow Developer Survey, self-selected.",
      "method": "Question-specific respondent attitudes, not observed accuracy.",
      "conflict": "Community-platform survey; question nonresponse and self-selection."
    },
    {
      "claim": "GitHub shows large platform-level AI activity, not independent product share or causal delivery improvement.",
      "measurement": "Octoverse 2025 reported >180M GitHub developers, >1.1M public repositories using an LLM SDK, and 693,867 such projects created in the prior 12 months (+178% year over year).",
      "population_and_sample": "GitHub platform/account and public-repository telemetry; denominator for all repositories is not supplied alongside the extracted LLM-SDK figure.",
      "method": "Platform-owner observational data; LLM-SDK detection is a proxy for AI projects, not autonomous-agent use.",
      "conflict": "GitHub owns Copilot and attributes some platform growth to Copilot Free."
    }
  ],
  "maturity_and_buyer_criteria_matrix": [
    {
      "criterion": "Reviewable change as the unit of value",
      "market_state": "table stakes for repository agents",
      "buyer_question": "Can a human inspect diff, tests, provenance, and unresolved failures before merge?"
    },
    {
      "criterion": "Isolation and bounded permissions",
      "market_state": "table stakes, implementation varies",
      "buyer_question": "What filesystem, network, secret, branch, and protected-action boundaries are enforceable?"
    },
    {
      "criterion": "Human approval, interruption, and takeover",
      "market_state": "table stakes because independent evidence rejects full autonomy",
      "buyer_question": "Can operators block unapproved changes, interrupt safely, resume, and attribute decisions?"
    },
    {
      "criterion": "Repository/context customization",
      "market_state": "converged around rules, skills, hooks, MCP/connectors, or repository instructions",
      "buyer_question": "Is context versioned and scoped, and can conflicting instructions be diagnosed?"
    },
    {
      "criterion": "Parallel/background execution",
      "market_state": "rapidly converging but not equivalent to safe orchestration",
      "buyer_question": "How are dependencies, conflicts, budgets, cancellation, and join state represented?"
    },
    {
      "criterion": "Enterprise administration",
      "market_state": "table stakes for control-plane claims",
      "buyer_question": "Are SSO/SCIM, audit logs, model/repository/network controls, data retention, residency, and deployment choices documented?"
    },
    {
      "criterion": "Outcome evidence",
      "market_state": "weakly standardized",
      "buyer_question": "Does telemetry prove only agent activity, or bind inputs, outputs, tests, review, and acceptance claims?"
    },
    {
      "criterion": "Specification-to-execution traceability",
      "market_state": "candidate differentiator",
      "buyer_question": "Can accepted intent and acceptance criteria be traced without treating a vendor plan or PR as semantic authority?"
    },
    {
      "criterion": "Replaceable agent/runtime boundary",
      "market_state": "candidate differentiator; visible in SDK/open-harness/control-plane products",
      "buyer_question": "Can models and agents change without moving governance or losing evidence?"
    }
  ],
  "competitive_convergence": [
    "Editor/CLI/web/mobile surfaces are converging into one account and session fabric.",
    "Local worktrees or cloud sandboxes are converging as conflict-isolation primitives.",
    "Repository instructions, rules, skills, hooks, MCP, plugins, and subagents are converging as customization vocabulary.",
    "Background agents, automations, schedules, PR review, and issue-triggered work are converging.",
    "Business tiers converge on SSO/SCIM, audit trails, privacy controls, shared context, analytics, and policy controls.",
    "Usage increasingly mixes subscription seats, credits or premium requests, and consumption overages.",
    "Convergence does not establish equivalence: a session, issue, Mission, spec, plan, and pull request retain different owners and invariants."
  ],
  "table_stakes_candidates": [
    "Reviewable diff and explicit human merge/approval edge",
    "Sandbox or worktree isolation",
    "Repository-scoped instructions and extensibility",
    "Tests/checks and failure visibility",
    "Interrupt/takeover/retry handling",
    "GitHub/GitLab plus issue/PR integrations",
    "Usage visibility and budget controls",
    "Enterprise identity, audit, privacy, model, repository, and network controls",
    "Clear preview/beta/GA and limit qualifiers"
  ],
  "differentiator_candidates": [
    "Typed, acceptance-bound intent preserved through execution",
    "Evidence that distinguishes successful execution, green tests, semantic conformance, owner acceptance, and promotion",
    "Replaceable runtime adapters with lossless field preservation",
    "Non-vacuous multi-agent dependency/join/cancellation semantics",
    "Drift invalidation and reproducible realization",
    "Open or self-hostable control plane without creating a second semantic authority",
    "Buyer-visible recovery trace rather than activity-only telemetry"
  ],
  "unproven_claim_register": [
    "Broad AI-tool adoption proves autonomous software-factory adoption.",
    "Vendor customer quotations establish representative delivery improvement.",
    "More parallel agents produce better delivery outcomes.",
    "A merged pull request proves intended semantics or promotion readiness.",
    "Structured output is equivalent to a governed receipt.",
    "Platform usage telemetry establishes market share.",
    "A polished app-builder flow provides enterprise software-factory controls.",
    "A vendor-labelled 'software factory' is a stable, shared market category."
  ],
  "volatility_register": [
    "Pricing, included credits/requests, overage rates, and model entitlements",
    "Preview/beta/GA status and product naming",
    "Concurrency and rate limits",
    "Supported models, plugins, MCP servers, and integrations",
    "Cloud versus local/self-hosted deployment options",
    "Enterprise retention, residency, encryption, and network controls",
    "Agent APIs and structured-output schemas",
    "Survey adoption values after major launches; notably the January 2026 Codex figure predates its desktop launch",
    "OpenHands architecture migration: Agent Canvas/SDK/Server are current while the former local GUI is deprecated"
  ],
  "exact_source_ledger": [
    {
      "title": "Welcome to Factory",
      "owner": "Factory.ai",
      "checked": "2026-08-20",
      "selector": "Choose a path; Explore the docs",
      "url": "https://docs.factory.ai/",
      "kind": "official product"
    },
    {
      "title": "Factory Pricing",
      "owner": "Factory.ai",
      "checked": "2026-08-20",
      "selector": "Pro; Plus; Max; Business; Enterprise",
      "url": "https://factory.ai/pricing",
      "kind": "official pricing"
    },
    {
      "title": "Codex",
      "owner": "OpenAI",
      "checked": "2026-08-20",
      "selector": "Built to drive real engineering work; Designed for multi-agent workflows; Made for always-on background work",
      "url": "https://openai.com/codex/",
      "kind": "official product"
    },
    {
      "title": "ChatGPT Pricing",
      "owner": "OpenAI",
      "checked": "2026-08-20",
      "selector": "Codex access by plan",
      "url": "https://chatgpt.com/pricing/",
      "kind": "official pricing"
    },
    {
      "title": "About GitHub Copilot cloud agent",
      "owner": "GitHub",
      "checked": "2026-08-20",
      "selector": "About cloud agent",
      "url": "https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent",
      "kind": "official product"
    },
    {
      "title": "GitHub Copilot plans",
      "owner": "GitHub",
      "checked": "2026-08-20",
      "selector": "Plans and pricing",
      "url": "https://github.com/features/copilot/plans",
      "kind": "official pricing"
    },
    {
      "title": "2026 release notes",
      "owner": "Devin",
      "checked": "2026-08-20",
      "selector": "2026 release stream",
      "url": "https://docs.devin.ai/release-notes/2026",
      "kind": "official maturity"
    },
    {
      "title": "Plans and Pricing",
      "owner": "Devin",
      "checked": "2026-08-20",
      "selector": "Current plans",
      "url": "https://devin.ai/pricing",
      "kind": "official pricing"
    },
    {
      "title": "Cursor Documentation",
      "owner": "Cursor",
      "checked": "2026-08-20",
      "selector": "Agent; Cloud Agents; Integrations; SDK; Teams and Enterprise",
      "url": "https://cursor.com/docs",
      "kind": "official product"
    },
    {
      "title": "Cursor Pricing",
      "owner": "Cursor",
      "checked": "2026-08-20",
      "selector": "Individual; Teams; Enterprise",
      "url": "https://cursor.com/pricing",
      "kind": "official pricing"
    },
    {
      "title": "Kiro Pricing",
      "owner": "AWS/Kiro",
      "checked": "2026-08-20",
      "selector": "Free through Power; enterprise",
      "url": "https://kiro.dev/pricing/",
      "kind": "official pricing"
    },
    {
      "title": "Replit Agent overview",
      "owner": "Replit",
      "checked": "2026-08-20",
      "selector": "Agent overview",
      "url": "https://docs.replit.com/features/agent/overview",
      "kind": "official product"
    },
    {
      "title": "OpenHands Introduction",
      "owner": "OpenHands",
      "checked": "2026-08-20",
      "selector": "Agent Canvas; Software Agent SDK and Agent Server; Cloud; Enterprise; Sandbox Server; Legacy",
      "url": "https://docs.openhands.dev/overview/introduction",
      "kind": "official product/open source"
    },
    {
      "title": "State of AI-assisted Software Development 2025",
      "owner": "DORA/Google Cloud",
      "checked": "2026-08-20",
      "selector": "Report landing page",
      "url": "https://dora.dev/research/2025/dora-report/",
      "kind": "research anchor; quantitative method not extracted"
    },
    {
      "title": "2025 Stack Overflow Developer Survey — AI",
      "owner": "Stack Overflow",
      "checked": "2026-08-20",
      "selector": "Accuracy of AI tools",
      "url": "https://survey.stackoverflow.co/2025/ai",
      "kind": "independent self-selected survey"
    },
    {
      "title": "Agents on a leash",
      "owner": "Stack Overflow",
      "published": "2026-05-27",
      "checked": "2026-08-20",
      "selector": "The revolution will not be fully autonomous or orchestrated; workplace usage; concerns",
      "url": "https://stackoverflow.blog/2026/05/27/agents-on-a-leash-agentic-ai-remains-mostly-monitored-at-work/",
      "kind": "pulse survey"
    },
    {
      "title": "Which AI Coding Tools Do Developers Actually Use at Work?",
      "owner": "JetBrains Research",
      "published": "2026-04",
      "checked": "2026-08-20",
      "selector": "January 2026 adoption results; methodological notes",
      "url": "https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/",
      "kind": "vendor-run global pulse survey"
    },
    {
      "title": "Octoverse 2025",
      "owner": "GitHub",
      "published": "2025-10-28",
      "updated": "2026-02-28",
      "checked": "2026-08-20",
      "selector": "Key metrics; generative AI is now standard",
      "url": "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
      "kind": "platform-owner telemetry/vendor market evidence"
    },
    {
      "title": "Enterprise AI coding agents entering expansion and competitive realignment",
      "owner": "Gartner",
      "published": "2026-05-20",
      "checked": "2026-08-20",
      "selector": "Press-release framing only",
      "url": "https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-says-the-market-for-enterprise-ai-coding-agents-is-entering-a-new-phase-of-expansion-and-competitive-realignment",
      "kind": "analyst framing; no paid detail used"
    }
  ],
  "limitations": [
    "This is a bounded market/maturity exploration, not the deeper product-architecture lane.",
    "No vendor system was run and no repository material was uploaded.",
    "DORA's downloadable report method and exact sample were not extracted, so no DORA quantitative claim is admitted here.",
    "Gartner was used only as public analyst category framing; no paywalled evidence, estimates, or market-share conclusion was used.",
    "Several pricing pages are dynamically rendered; absent extracted values are residue, not evidence of absence.",
    "The Claude Agent SDK documentation URL failed retrieval and requires a fresh authoritative handle.",
    "The unfinished 2026 Stack Overflow annual survey was not treated as results.",
    "Survey tool-use percentages are respondent-reported adoption within their samples, never inferred market share.",
    "No procurement recommendation or arbitrary vendor ranking was produced."
  ],
  "handoff": {
    "next_owner": "synthesizer",
    "instructions": [
      "Bind exact current selectors for Devin, GitHub Copilot, Replit, Codex currency pricing, and Claude Agent SDK before quoting plan economics.",
      "Preserve the distinction between mainstream AI assistance and emerging autonomous/control-plane adoption.",
      "Treat monitored execution, isolation, approval, recovery, and evidence fidelity as buyer criteria supported by the trust/autonomy signals.",
      "Do not collapse vendor work units into DomainSpec Work Packs or vendor telemetry into governed receipts."
    ]
  }
}

## Agent 2 — Product workflow and runtime architecture

## Product/Runtime Explorer Receipt

- Action: `spawn-0002`
- Status: `partial-evidence-returned`
- Mode: read-only
- Files written: none
- Lane: closed with explicit residue

Files read:

- `.agents/skills/research-tower/SKILL.md`
- `levels/L0-corpus.md`
- `source-candidates.md`
- `dispatch-sheet.json`

Official sources sampled:

- [Factory documentation](https://docs.factory.ai/)
- [OpenAI Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [GitHub Copilot agent responsible use](https://docs.github.com/en/copilot/responsible-use/agents)
- [GitHub Copilot custom agents](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/custom-agents)
- [Cursor documentation](https://cursor.com/docs)
- [Replit Agent workflow](https://docs.replit.com/learn/build-with-agent)
- [Devin 2026 release notes](https://docs.devin.ai/release-notes/2026)
- Kiro Specs URL was redirect-only and yielded no usable evidence.

Three supported workflow archetypes:

1. Governed repository session: instructions → plan/tool loop → changes and tests → human review/merge.
2. Specification-led projection: requirements/design/tasks → execution. This remains provisional because Kiro’s detailed source was not resolved.
3. App-builder recovery loop: intent/context → reviewable plan → build/preview/test → checkpoint or rollback.

Reusable patterns:

- Explicit plan-before-mutation approval
- Isolated execution per work unit
- Bounded parent/child delegation
- Interrupt, resume, checkpoint, and human-takeover controls
- Lifecycle events and structured outputs
- Enterprise policy separated from semantic authority
- Field-preserving adapters across intent, plan, execution, and evidence

Non-equivalence rule:

`session completed` ≠ `tests green` ≠ `PR merged` ≠ `semantic conformance` ≠ `promotion authorized`

Vendor concepts such as Missions, Droids, Devin sessions, Codex threads, Replit checkpoints, Cursor Cloud Agents, and Copilot custom agents are useful precedents, but are not schema-equivalent to DomainSpec Work Packs.

Open residue includes exact isolation semantics, secrets and network controls, rollback atomicity, concurrency limits, lifecycle schemas, telemetry fields, retention, deployment modes, maturity qualifiers, pricing, and Kiro’s specification mechanics. The cohort and source freeze are therefore not complete.

## Agent 3 — DomainSpec v2 fit and ownership

{
  "action_id": "spawn-0003",
  "role": "v2-fit-exploration",
  "capability": "research-tower",
  "mode": "explore",
  "status": "completed-read-only",
  "authority_effect": "none",
  "persisted_output": "chat receipt only; receipts/v2-fit-explorer.json not written because write_scope was empty",
  "live_ledger": {
    "path": "projects/domainspec-v2/.craft/ledger.yml",
    "sha256": "2a59a2289102f7c72f1f33157ff41612c95d99b9955a11f706b90c9a97f155ba",
    "preflight_digest_match": true
  },
  "files_read": [
    ".agents/skills/research-tower/SKILL.md",
    "projects/domainspec-v2/development/research/2026-08-20-software-factory-market/strategy-inventory-packet.json",
    "projects/domainspec-v2/development/research/2026-08-20-software-factory-market/dispatch-sheet.json",
    "projects/domainspec-v2/.craft/ledger.yml",
    "projects/domainspec-v2/README.md",
    "sessions/2026-08-20-1150-factory-ai-vladimir-review/review.md",
    ".arcanum/inventory/index.json",
    ".arcanum/inventory/entries/domainspec-v2-first-production-release-roadmap-strategy-result-synthesis.md",
    ".arcanum/inventory/entries/domainspec-v2-fpr-async-execution-strategy-result-synthesis.md",
    ".arcanum/inventory/entries/domainspec-v2-implementation-structure-enforcement-research-result-synthesis.md",
    ".arcanum/inventory/entries/arcanum-codex-app-server-integration-map-audited-result-synthesis.md",
    ".arcanum/inventory/entries/domainspec-v2-operation-internal-pattern-enforcement-research-result.md"
  ],
  "claim_ceiling": "DomainSpec v2 has a bounded typed-validation and same-host reproducible-realization kernel plus substantial governed factory contracts. The inspected evidence does not establish an autonomous, operable, production-stable software factory.",
  "exact_selector_matrix": [
    {
      "capability": "typed intent and meta-types",
      "classification": "observed-or-validated, with owner-blocked extension",
      "selectors": [
        "README.md#implementation-home-impl-migrated-from-v1",
        "ledger: CTX-DSV2-META-TYPE-FORMALIZATION",
        "ledger: CTX-DSV2-MTF",
        "ledger: ART-DSV2-MTF-EXECUTION-STATE",
        "ledger: ART-DSV2-MTF-REPRODUCIBILITY",
        "ledger: BLK-DSV2-FORM-QUEUE-EMPTY"
      ],
      "evidence": "The backend meta-type scope records 13 node schemas, 30 active root relationship signatures, edge-aware validation, aggregate wiring, and instance generation/validation. MTF-001..029 are complete and same-host replay over a locked nine-node graph passed twice. Language-form decisions for all 13 tracked meta-types remain owner-blocked.",
      "proper_move": "reuse existing v2 machinery; build missing form/profile material from the existing owner",
      "duplicate_owner_risk": "high if a market-derived schema, profile registry, or meta-type authority is added beside the existing definitions and form owners"
    },
    {
      "capability": "graph and pattern enforcement",
      "classification": "observed-or-validated narrowly; candidate or blocked beyond that boundary",
      "selectors": [
        "README.md#implementation-home-impl-migrated-from-v1",
        "ledger: CTX-DSV2-SPEC-ONTOLOGY",
        "ledger: CTX-DSV2-APE",
        "Inventory entry implementation-structure:#enforcement-model",
        "Inventory entry operation-internal-pattern:#core-research-conclusion",
        "Inventory entry operation-internal-pattern:#terminal-blockers"
      ],
      "evidence": "The executable typed-graph substrate and dynamic edge-law enforcement have bounded witnesses. Portable semantics preserve semantic bindings and direct Rule-leaf use edges; file/export/function conventions remain profile-local. The current operation-internal result is blocked by stale selectors, missing row-level witness bindings, and unexecuted three-language fixtures.",
      "proper_move": "reuse the typed graph and validators; conduct a bounded empirical fixture experiment for new language-local enforcement",
      "duplicate_owner_risk": "high if product workflow conventions are promoted as universal DomainSpec semantics"
    },
    {
      "capability": "work packs and continuation",
      "classification": "planned and governed; no current autonomous controller",
      "selectors": [
        "ledger: CTX-DSV2-RMT",
        "ledger: ART-DSV2-RMT002-TRANSIENT-PROPOSAL",
        "ledger: BLK-DSV2-RMT002-TRANSIENT-API-ACCEPT",
        "Inventory async result:#accepted-result",
        "Inventory async result:#proposed-machine-model",
        "Factory review:R2"
      ],
      "evidence": "Work-pack/receipt/Craft sequencing exists, but the Task Session transient-output proposal has no owner acceptance or apply authorization. Current scheduling is manual and parent-enforced. Factory review R2 requires any projection to preserve the complete runtime-adapter envelope and fail closed on every unrepresentable field.",
      "proper_move": "project through an Arcanum runtime adapter after exact-byte owner acceptance; do not build a second controller or continuation ledger in v2",
      "duplicate_owner_risk": "critical for any new scheduler, work graph, receipt authority, or continuation source of truth"
    },
    {
      "capability": "realization and reproducibility",
      "classification": "observed-or-validated, narrowly",
      "selectors": [
        "ledger: CTX-DSV2-MTF",
        "ledger: ART-DSV2-MTF-EXECUTION-STATE",
        "ledger: ART-DSV2-MTF-REPRODUCIBILITY"
      ],
      "evidence": "The bounded architecture-reference suite has a complete 29-unit execution state and two same-host reproductions over a locked nine-node graph.",
      "proper_move": "reuse existing v2 machinery and expose its receipts through a facade",
      "duplicate_owner_risk": "medium; do not rebrand same-host replay as cross-host provisioning, release, or production proof"
    },
    {
      "capability": "scheduling and isolation",
      "classification": "absent-from-inspected-sources as deployed machinery; planned as gaps",
      "selectors": [
        "Inventory async result:#manual-operating-epochs",
        "Inventory async result:#proposed-machine-model",
        "Inventory async result:#implementation-gaps"
      ],
      "evidence": "One mutation lane is serialized manually. Research, review, diagnostics, and allowlisted preparation may occupy other lanes. No automated scheduler, lock manager, snapshot system, ready-queue controller, runner/cache isolation, or measured speedup exists.",
      "proper_move": "conduct empirical isolation and collision experiments, then build from the existing Arcanum/Craft execution owner if warranted",
      "duplicate_owner_risk": "critical if v2 gains a parallel orchestration runtime"
    },
    {
      "capability": "CLI or product surface",
      "classification": "planned and blocked; no CLI byte exists",
      "selectors": [
        "Inventory FPR roadmap:#approved-roadmap-result",
        "ledger: CTX-DSV2-SFC",
        "ledger: GAP-DSV2-SFC-UNEXECUTED",
        "ledger: BLK-DSV2-SFC-PR001-PROFILE-ABSENT",
        "ledger: GAP-DSV2-SFC-004-FUSED"
      ],
      "evidence": "The settled bounded direction is a private, repository-local, profile-bounded Validation Toolkit CLI. WP-SFC-001 has 20 planned SWUs, selected_unit null, no executed validation contracts, and no CLI bytes. It is additionally blocked by the absent profile, denominator drift, and a fused fourth unit.",
      "proper_move": "build from the existing SFC owner and expose existing kernels through the chosen product facade",
      "duplicate_owner_risk": "high if research reopens product form or introduces a hosted/public product without a new owner decision"
    },
    {
      "capability": "system-integration contracts",
      "classification": "candidate and authorization-blocked",
      "selectors": [
        "ledger: CTX-DSV2-SICL",
        "ledger: BLK-DSV2-SICL-REV2-REFRESH",
        "ledger: ART-DSV2-SICL-REPAIR-B-RESULT"
      ],
      "evidence": "The generic-factory Revision 2 candidate passed revalidation, but the required Invoke Refresh is explicitly executed=false and authorization_included=false.",
      "proper_move": "build from the existing SICL owner; require authorized refresh before treating the candidate as usable",
      "duplicate_owner_risk": "high if vendor-specific integration contracts bypass or fork the generic factory contract owner"
    },
    {
      "capability": "implementation and agent conformance",
      "classification": "candidate/planned",
      "selectors": [
        "ledger: CTX-DSV2-IMPL-CONFORMANCE",
        "ledger: CTX-DSV2-AGENT-SPEC-CONFORMANCE",
        "ledger: ART-DSV2-IMPL-CONFORMANCE-DEFINE",
        "ledger: ART-DSV2-IMPL-CONFORMANCE-ARCH",
        "Inventory implementation-structure:#required-verdict-matrix"
      ],
      "evidence": "Profile-bound composition and deterministic normalization have authored architecture. The selected Inventory result supports portable semantic bindings but leaves owner admission, three-language fixtures, exceptions, tooling parity, performance, and IDE evidence open.",
      "proper_move": "build from existing conformance owners and use experiments for profile/language witnesses",
      "duplicate_owner_risk": "high if an agent platform's success status is treated as semantic conformance"
    },
    {
      "capability": "formal evidence",
      "classification": "planned; provider and live proof absent",
      "selectors": [
        "ledger: CTX-DSV2-FMP",
        "ledger: GAP-DSV2-FMP-UNSELECTED",
        "ledger: GAP-DSV2-FMP-TRACE",
        "ledger: ART-DSV2-FMP-RESULT",
        "ledger: ART-DSV2-FMP-WORK-PACK"
      ],
      "evidence": "WP-FMP-001 is selection-ready with eight ordered SWUs, but no unit is selected and no TLA/TLC proof has run against the live factory. Zig-to-TLA trace conformance is a deliberately deferred successor.",
      "proper_move": "build from the formal-validation owner only after readiness selection; reject claims that planning or a bounded model proves the implementation",
      "duplicate_owner_risk": "high if vendor tests, PR status, or structured outputs are relabeled formal proof"
    },
    {
      "capability": "drift invalidation",
      "classification": "blocked",
      "selectors": [
        "ledger: BLK-DSV2-DRIFT-ENGINE",
        "ledger: BLK-DSV2-P2-DENOMINATOR-DRIFT",
        "ledger: GAP-DSV2-CARD-EDGE-DRIFT"
      ],
      "evidence": "Drift governance is designed but not implemented in the engine. A real denominator change from 16 to 17 failed to trigger invalidation and propagated into nine SFC artifacts; eight of thirteen meta-type cards also disagree with current edge authority.",
      "proper_move": "build the missing mechanism from the existing engine/authority owners and add exact fail-closed regression witnesses",
      "duplicate_owner_risk": "critical if a product facade invents an independent freshness or drift truth"
    },
    {
      "capability": "runtime adapters",
      "classification": "owned by adjacent Arcanum; direct integration candidate only",
      "selectors": [
        "Inventory App Server map:#architecture-first-with-the-claim-ceiling",
        "Inventory App Server map:#app-server-hook-registry-and-current-status",
        "Inventory App Server map:#nine-finite-traces-all-specified-none-executed",
        "Factory review:R2"
      ],
      "evidence": "The audited precedent places App Server beneath the durable runtime. Nine traces are specified but unexecuted, direct integration and binary/schema parity remain absent, and no integration-readiness claim is supported.",
      "proper_move": "project through the adjacent Arcanum runtime adapter; preserve every Task Session field and fail closed",
      "duplicate_owner_risk": "critical if v2 acquires a second runtime controller, ledger, receipt authority, lifecycle owner, or approval owner"
    },
    {
      "capability": "observability",
      "classification": "owned by adjacent Arcanum; desired product telemetry remains partly unverified",
      "selectors": [
        "Inventory App Server map:#authority-identity-receipt-and-approval-boundaries",
        "Factory review:R1"
      ],
      "evidence": "The local audited integration map distinguishes runtime signals from authority and receipts. Factory review R1 finds that aggregate analytics do not establish every proposed per-work-pack receipt field or per-Mission exportability.",
      "proper_move": "use an adjacent observability adapter and make field/export preservation an explicit experiment gate",
      "duplicate_owner_risk": "critical if analytics become a second evidence ledger or are treated as lifecycle closure"
    },
    {
      "capability": "promotion boundaries",
      "classification": "owned by Craft, definitions governance, and candidate authority spine—not by product/runtime",
      "selectors": [
        "README.md#how-v2-works",
        "README.md#boundaries",
        "Inventory FPR roadmap:#persistent-frontier-strategy",
        "Factory review:R4",
        "ledger: CTX-DSV2-AUTHORITY"
      ],
      "evidence": "Research Tower outputs are non-canonical until separately promoted; Craft is continuation authority; Inventory is a non-authority read model. The Factory review requires cyberAlchemy-v2 to be described as candidate/staging rather than automatically current authority.",
      "proper_move": "reject any external pattern that collapses execution success, tests, analytics, merge status, semantic acceptance, or promotion",
      "duplicate_owner_risk": "critical"
    }
  ],
  "tower_branch_comparison": [
    {
      "branch": "A — reuse/build the typed v2 kernel",
      "fit": "best evidenced core",
      "supports": "typed intent, graph validation, bounded realization, reproducibility, conformance contracts",
      "limits": "does not itself supply autonomous scheduling, operational UX, runtime adapters, or promotion",
      "verdict": "build-from-owned"
    },
    {
      "branch": "B — operationalize through Arcanum/runtime adapters",
      "fit": "necessary adjacent execution projection",
      "supports": "work-pack execution, adapter projection, runtime events, observability",
      "limits": "Task Session transient-output bytes remain unaccepted; App Server traces are unexecuted",
      "verdict": "adapter",
      "duplicate_owner_warning": "must remain below existing runtime and preserve the full handoff envelope"
    },
    {
      "branch": "C — expose a bounded product facade",
      "fit": "settled product direction but currently only planned",
      "supports": "private profile-bounded Validation Toolkit CLI experience",
      "limits": "no CLI bytes; profile and denominator blockers; 20 SWUs unexecuted",
      "verdict": "future-work/build-from-owned",
      "duplicate_owner_warning": "facade must not become a second semantic, workflow, evidence, or promotion owner"
    },
    {
      "branch": "D — integrated autonomous software factory",
      "fit": "aspirational composite, not current evidence",
      "supports": "would require scheduling, isolation, recovery, adapters, observable UX, formal/semantic evidence separation, and authority-safe promotion",
      "limits": "multiple required mechanisms are absent, planned, candidate, or blocked",
      "verdict": "empirical-experiment before architecture commitment",
      "duplicate_owner_warning": "highest risk of collapsing DomainSpec, Arcanum, Craft, observability, and authority into one new controller"
    }
  ],
  "recommended_assignment_rule": [
    "Reuse v2 for typed intent, graph/pattern validation, conformance contracts, realization, and bounded reproducibility.",
    "Build missing v2 behavior only through its recorded ledger owner.",
    "Project execution and telemetry through Arcanum/runtime adapters; never create a parallel controller or evidence authority.",
    "Expose the settled private CLI direction as a facade only after its profile, denominator, unit-split, selection, and validation gates close.",
    "Use experiments for scheduling/isolation, telemetry-field preservation, runtime-envelope preservation, language-profile enforcement, and cross-host reproducibility.",
    "Reject any pattern equating green tests, successful sessions, merged changes, analytics, formal-model adequacy, semantic conformance, lifecycle closure, or promotion."
  ],
  "limitations": [
    "Inventory entries are discovery/read-model evidence, not authority; current-state conclusions defer to the live ledger digest above.",
    "No external market-product findings were available from the two other explorer lanes, so external-pattern assignment is expressed as a decision rule rather than vendor-specific rows.",
    "Branch labels A-D were not formally defined in the inspected local sources; the comparison uses the dispatch goal's natural operating-model decomposition and must be reconciled by the synthesizer.",
    "The prior Factory handoff remains under a FIX review; its telemetry and execution-projection claims must not be imported without R1/R2 repairs.",
    "No implementation, external product execution, deployment, procurement, promotion, or production-readiness validation was performed."
  ],
  "no_write_confirmation": {
    "repository_files_changed": false,
    "forbidden_scopes_touched": false,
    "external_effects": false
  },
  "next_handoff": "Synthesizer should join this current-owner matrix with the market and product-runtime explorer returns, then require every reuse row to name its existing owner, exact local evidence state, positive and negative witness, protected boundary, and smallest falsifiable experiment."
}

## Connections

- derives → [findings.md](./findings.md)
