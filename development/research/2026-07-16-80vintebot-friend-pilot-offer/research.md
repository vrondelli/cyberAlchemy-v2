---
title: 80VinteBot Friend Pilot Offer Research Transcript
dispatch_id: 2026-07-16-80vintebot-friend-pilot-offer-research
artifact_role: verbatim-explorer-transcript
status: complete
created: 2026-07-16
---

# 80VinteBot Friend Pilot Offer Research Transcript

This file preserves the three explorer returns verbatim. Synthesis, reviewer output, and editorial changes belong in `findings.md`, not here.

## Agent 1 - Christensen, Clayton

# Christensen Explorer Return: 80VinteBot Pilot Desirability

**Research date:** 2026-07-16<br>
**Claim boundary:** [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-07-11-investor-language-customer-value/findings.md) permits a bounded, versioned review experiment. It is not evidence of 80VinteBot fit, demand, or value.

## Evidence Labels

- **OBSERVED FACT:** directly published by 80VinteBot or its founders. Company-published metrics are observations about claims, not independently verified results.
- **INFERENCE:** plausible interpretation of multiple public facts.
- **HYPOTHESIS:** interview-only proposition requiring customer evidence.
- **UNKNOWN:** public evidence does not answer it.

## Public Workflow

**OBSERVED FACT:** 80VinteBot sells a multichannel SaaS whose AI agents answer customers, qualify leads, automate follow-up, and update pipeline state. Its implementation service is separately priced and publicly described as six stages: strategic interview, configuration, AI training, team training, 30-day follow-up, and support. The recurring SaaS starts at R$299/month; onboarding has a separate proposal. [Product, method, and pricing](https://agencia80vinte.com.br/)

**OBSERVED FACT:** Its mystery-shopper product initiates an anonymous WhatsApp conversation and reports response speed, quality, sales conduct, and professionalism. The page publishes claims of 120+ evaluations and 73% finding serious failures, plus 85%, 3x, and 70% impact figures without visible source links. These numbers are **unverified company claims**. [Mystery shopper](https://agencia80vinte.com.br/cliente-oculto)

**OBSERVED FACT:** A founder describes that workflow as four cooperating flows using n8n, Supabase, GPT-4o, and Redis: capture, dialogue, timeout monitoring, and report generation. A current Customer Success hiring post says the role should organize implementations, customer journeys, service, indicators, retention, and growth. [Founder’s public activity](https://br.linkedin.com/in/pedroantoniovcosta/pt), [company LinkedIn](https://www.linkedin.com/company/80vintebot)

**OBSERVED FACT:** The privacy policy says the service processes cross-channel messages, may retain messages/media for one year and technical logs for six months. The terms acknowledge automatic updates, third-party API dependence, possible errors, and possible feature discontinuation. [Privacy](https://www.80vintebot.com.br/politica-privacidade), [terms](https://www.80vintebot.com.br/termos-servico), [deletion process](https://www.80vintebot.com.br/exclusao-dados)

**UNKNOWN:** The linked [Instagram profile](https://www.instagram.com/80vinte.ia/) was not publicly fetchable during this run, so no Instagram-content claim is used.

## Candidate Pilots

| Rank | Candidate | Buyer / user / trigger | Current job and stakes | Measurable baseline | Pilot outcome |
|---|---|---|---|---|---|
| **1** | **Onboarding/configuration repeatability** | **INFERENCE:** buyer is Product founder or CS leader; users are implementation/CS staff. Trigger is a new customer or scaling implementation volume. | **FACT:** onboarding is separately sold and has six named stages; CS is being built to organize implementations and indicators. **HYPOTHESIS:** bespoke configuration creates founder dependence, rework, delayed activation, or inconsistent handoff. Current alternative is human expertise plus undocumented or partially templated procedures; actual practice is **UNKNOWN**. | Last 3–5 comparable onboardings: elapsed days, hours by role, customer-input waits, configuration revisions, founder interventions, time to first accepted live interaction, and first-30-day support incidents. | Versioned implementation packet for **one customer class**, connecting confirmed inputs, configuration decisions, checks, exceptions, owner acceptance, and 30-day follow-up measures. |
| **2** | **AI sales-agent behavior/release assurance** | **INFERENCE:** buyer is Product/Engineering founder; users are engineering, CS, and the release owner. Trigger is a prompt, model, workflow, integration, or channel change. | **FACT:** agents communicate externally, qualify leads, update pipeline, and depend on multiple services; terms acknowledge errors and third-party disruption. **HYPOTHESIS:** current assurance is manual/ad hoc and behavior regressions can silently damage conversations or handoffs. | For comparable recent changes: test scenarios, manual-review hours, detected defects, escaped defects, post-release corrections, rollback/rework, and time from candidate to owner verdict. | Shadow review of **one named release and one behavior**, preferably qualification-to-human-handoff, using fixed scenarios and transcript evidence. Deliver a versioned result, exceptions, deployment boundary, and observable stop/rollback triggers. |
| **3** | **Claim-to-evidence review** | **INFERENCE:** buyer is Growth or Product founder; users are marketing, product, and whoever owns privacy/legal review. Trigger is a website, pricing, campaign, legal-policy, or diligence update. | **FACT:** public surfaces contain quantified performance claims without visible sources; homepage scope is broader than the messaging-oriented service description in the terms. Privacy language also needs contextual interpretation. **HYPOTHESIS:** claim ownership and refresh are informal. | Number of material claims, source-linked percentage, owner-linked percentage, stale/ambiguous claims, review time, and time to answer one prospect’s evidence question. | Versioned registry for **one publication bundle**, classifying each claim as sourced, bounded, ambiguous, expired, or unsupported. This is not legal review, truth certification, or copywriting. |

## Desirability Verdict

**Strongest customer-workflow candidate: onboarding/configuration repeatability.** It attaches to an explicitly sold service, a six-step recurring workflow, and a publicly visible effort to scale CS. The customer job is concrete: reproduce a successful implementation without losing necessary customization or requiring the founder to reconstruct every decision.

The best **zero-fee scope** is therefore:

> Review one recently completed onboarding for one customer class and produce a versioned, customer-controlled implementation packet showing required inputs, configuration decisions, checks, exceptions, acceptance owner, and 30-day follow-up measures.

This is a **HYPOTHESIS**, not yet an offer. It should run against a completed onboarding first, avoiding production mutation and customer disruption.

Behavior assurance ranks second on desirability but first on boundary clarity. Hewitt may reasonably prefer it because one release, behavior, test environment, and owner verdict can be traced more safely. Claim review ranks third: low operational intrusion, but weaker evidence that it addresses the company’s present constraint.

## Access, Burden, Disqualifiers

| Candidate | Required access | Founder burden | Disqualifiers |
|---|---|---|---|
| Onboarding | One completed case; interview/configuration artifacts; redacted support history; acceptance owner | **Potentially high:** founders may need to reconstruct tacit decisions | No repeated customer class; no definition of “onboarding complete”; live credentials required; founder narration becomes the whole evidence base |
| Behavior assurance | Release identifier; expected behavior; staging/test number; redacted transcripts; release owner | **Medium:** scope confirmation and result adjudication | Production-only testing; no version boundary; no authorized owner; unsafe external side effects; expected behavior cannot be stated |
| Claim review | Frozen public pages; internal sources; claim owners; review cutoff | **Low–medium** | Expectation of legal certification; no evidence owners; unrestricted “review everything”; rewriting substituted for verification |

## Exact Discovery Questions

1. Which decision currently causes the most repeated work: declaring an onboarding complete, approving an agent change, or approving a public claim?
2. Show the last two real instances from trigger to final owner decision. What artifacts and timestamps exist?
3. Who has authority to say `accept`, `revise`, `pause`, or `reject`?
4. What observable result defines “done” today?
5. What work is standard across customers, and what must remain customer-specific?
6. Across the last five onboardings, how many hours did founders, CS, engineering, and the customer spend?
7. What caused configuration revisions or founder intervention after handoff?
8. For the last agent change, what behavior was expected, how was it tested, and what would have triggered rollback?
9. Can one completed onboarding or one release be examined with redacted data and no production credentials?
10. Which published numerical claims have named source records, owners, and expiration dates?
11. What customer or platform data may not leave existing systems, and what retention/deletion boundary applies to pilot evidence?
12. At the end of a zero-fee pilot, what owner decision would the result change? If no decision changes, why run it?
13. What maximum founder/CS time would make the pilot unacceptable?
14. What result would cause 80VinteBot to decline further work even if the artifact is complete?

## Predicted Disagreements

**Christensen–Hewitt:** onboarding has the strongest public customer-workflow signal, but it may be too tacit and cross-system for a safe first boundary. Hewitt can overturn the ranking if no completed case, acceptance owner, and redacted artifact set can be frozen.

**Christensen–Goldratt:** a compelling scaling story is insufficient unless one owner decision and one operational measure are explicit. Goldratt can reject onboarding if founder reconstruction burden exceeds the measured current burden or if the packet changes no decision.

## Agent 2 - Hewitt, Carl

# Hewitt Explorer Return: Technical and Agentic Assurance

## Evidence Boundary

- **[Observed fact]** 80VinteBot publicly describes AI agents that answer leads, qualify them, automate follow-up, and move CRM pipeline stages across several channels. It also advertises customized scripts, 1,000+ integrations, and a six-stage implementation method. This establishes advertised scope, not witnessed runtime behavior. [Product page](https://www.80vintebot.com.br/)
- **[Observed fact]** The iOS listing describes conversation history, contact data, dashboards, agent-to-human transfer, and conversation closure. Its developer privacy declaration says “data not collected”; Apple explicitly says this declaration is unverified. [App Store listing](https://apps.apple.com/br/app/80vintebot/id6752356317)
- **[Observed fact]** The privacy policy says the app processes messaging, account, device, integration, configuration, and usage data; it states retention of messages/media for up to one year and logs for six months. Its separate Instagram section says direct messages are not collected, creating at least a scope ambiguity with the app-level description. [Privacy policy](https://80vintebot.com.br/politica-privacidade)
- **[Observed fact]** The terms acknowledge third-party API availability and revocation risk. [Terms](https://80vintebot.com.br/termos-servico)
- **[Observed fact]** WhatsApp permits automation but requires clear, direct escalation paths; it also imposes opt-in, opt-out, template-window, data-use, and policy-enforcement constraints. This directly contradicts an unqualified “zero risk of banishment” claim, although it does not establish that 80VinteBot is violating policy. [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/)
- **[Observed fact]** NIST recommends documented, repeatable TEVV, deployment-like test conditions, traceable measurements, and explicit commissioning or go/no-go decisions. It does not certify products. [AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/), [NIST GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)

Dispatch authority and role boundaries are recorded in the [dispatch ledger](/home/vrondelli/projects/domainspec-core/telemetry/agents/subagents-dispatch.yaml:3382); explorer output semantics come from the [research owner skill](/home/vrondelli/projects/domainspec-core/implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/research/SKILL.md:44).

## Candidate Classes

### 1. AI Sales-Agent Behavior/Release Assurance

**System boundary:** One versioned agent configuration, one knowledge snapshot, one permitted CRM action such as “propose moving lead to Qualified,” and one escalation path, evaluated from synthetic inbound event to proposed response/action/record. No outbound production message and no production write.

**Required artifacts/access:** Candidate and current configurations; system/developer prompts; model/provider/version; retrieval sources; tool schemas; qualification and escalation rules; sanitized output logs; owner-defined acceptance criteria. Staging or export access only, with no production credential.

**Test design:** Replay 12-25 synthetic cases across normal qualification, ambiguity, unsupported requests, opt-out, sensitive data, prompt attack, tool-argument error, duplicate event, out-of-hours escalation, and provider failure. Compare current versus candidate using separate measures for response grounding, unauthorized claims, qualification correctness, tool-call validity, escalation, and record completeness. Do not collapse them into one “trust score.”

**Decision authority:** A named 80VinteBot Product or Engineering owner alone decides `release`, `hold`, or `retest`. CyberAlchemy supplies evidence and a recommendation only.

**Privacy/retention:** Synthetic identities by default. If shadow outputs from real conversations are requested, require documented authorization, minimization/redaction, purpose restriction, access list, and an agreed deletion date shorter than normal production retention.

**Dependencies:** Model API, Meta/WhatsApp, CRM, scheduling or automation connectors, knowledge sources, webhook/event infrastructure.

**Failure cases:** Nondeterministic output; stale knowledge; hidden configuration drift; malformed or excessive tool calls; duplicated events; missing escalation; model/provider change; connector outage; logs that cannot join message, decision, and action.

**Deliverable:** Versioned release-evidence packet: cases, expected behavior, actual outputs, diffs, failures, unresolved unknowns, and `release/hold/retest` recommendation.

**Cannot prove:** Production reliability, absence of future harmful output, security, compliance, unbiased behavior across populations, ROI, conversion impact, or correctness under untested configurations.

### 2. Onboarding/Configuration Repeatability

**System boundary:** One fictional customer intake transformed twice into one agent configuration and the same dry-run acceptance suite.

**Required artifacts/access:** Blank and completed intake form; configuration schema/export; setup checklist; defaults; scripts; knowledge-ingestion rules; environment/version identifiers; acceptance checklist. No customer data is necessary.

**Test design:** Two authorized implementers independently configure the same synthetic customer, or one implementer repeats after reset. Compare prompts, enabled tools, permissions, knowledge sources, escalation rules, and test results. Record every undocumented manual adjustment.

**Decision authority:** 80VinteBot’s implementation owner decides whether the onboarding template is reusable or needs revision.

**Privacy/retention:** Entirely synthetic pilot. Retain configuration diffs and results; delete temporary accounts and secrets immediately after testing.

**Dependencies:** Configuration UI/API, model provider, channel setup, CRM field definitions, connector defaults.

**Failure cases:** Missing intake field; inconsistent defaults; secrets copied into configuration; undocumented edits; environment drift; acceptance criteria dependent on implementer judgment.

**Deliverable:** Reproducibility report, configuration manifest, variance list, and revised acceptance checklist.

**Cannot prove:** Repeatability across industries, Meta account approval, production effectiveness, staff training quality, onboarding speed at scale, or customer value.

### 3. Claim-to-Evidence Review

**System boundary:** A frozen set of current product, legal, privacy, App Store, and mystery-shopper claims mapped to available evidence and named owners.

**Required artifacts/access:** URL snapshots; claim owner; metric definitions and denominators; data-flow diagram; provider/platform evidence; internal substantiation for selected quantitative claims. Public-only review remains possible but weaker.

**Test design:** Classify each claim as `directly evidenced`, `qualified inference`, `ambiguous scope`, `unsupported`, or `third-party dependent`. Prioritize “100% IA,” “100% leads classified automatically,” “risk zero of banishment,” privacy/data-collection statements, Meta-partner status, and mystery-shopper percentages. The mystery-shopper page documents its method and outputs but provides no public denominator or validation material for its headline percentages. [Mystery shopper](https://agencia80vinte.com.br/cliente-oculto)

**Decision authority:** Product/Marketing owns product wording; the privacy/legal owner decides legal text. The reviewer cannot approve compliance.

**Privacy/retention:** Public sources plus redacted substantiation. No customer transcript should enter the packet merely to support marketing copy.

**Dependencies:** Meta policies and directory, Apple declarations, analytics provenance, legal review.

**Failure cases:** Undefined denominator; stale page; testimonial treated as general proof; platform status asserted without directory evidence; app and policy scopes left unreconciled.

**Deliverable:** Claim register with `retain`, `qualify`, `remove`, or `needs evidence` recommendations and exact source links.

**Cannot prove:** Legal compliance, Meta partnership, historical performance, customer outcomes, market demand, or absence of contradictory private evidence.

## Concrete Workflow Trace

| Step | Public status |
|---|---|
| Customer sends WhatsApp message | **[Observed public claim; runtime unwitnessed]** Supported channel. |
| Platform receives and associates the event with a contact | **[Inference; unwitnessed]** Necessary for the advertised history/contact view. Webhook shape, deduplication, and ordering are **[Unknown]**. |
| Agent selection and prompt/knowledge assembly | **[Inference; unwitnessed]** Customized agents and scripts are advertised; routing, model, prompt, retrieval, and versioning are **[Unknown]**. |
| Model generates response and qualification | **[Observed public claim; runtime unwitnessed]** Actual guardrails, confidence handling, and unsupported-claim behavior are **[Unknown]**. |
| CRM/tool action proposes or performs a pipeline move | **[Observed public claim; runtime unwitnessed]** Tool schema, authorization, idempotency, rollback, and whether actions are autonomous are **[Unknown]**. |
| Escalation to a person | **[Observed capability; trigger unwitnessed]** App transfer is advertised and WhatsApp requires an escalation path; trigger rules and response ownership are **[Unknown]**. |
| Conversation/action record is retained | **[Observed policy and product claim; record unwitnessed]** History and retention periods are described; event-level provenance and audit linkage are **[Unknown]**. |
| Owner reviews evidence and releases/changes configuration | **[Hypothesis]** Thirty-day adjustment is advertised, but no public release authority, gate, or decision record was witnessed. |

## Recommendation: Smallest Non-Vacuous Pilot

Run a **single-agent shadow release preflight**:

- One candidate configuration versus its current baseline.
- Twelve synthetic scenarios.
- One proposed CRM action and one human-escalation path.
- No live customer data, outbound messages, autonomous production changes, production credentials, penetration testing, or broad architecture review.
- Founder burden capped at one artifact handoff and two short sessions: acceptance criteria before testing, then `release/hold/retest`.
- Stop immediately if the configuration cannot be exported/versioned, the owner cannot name the release decision, or outputs/actions cannot be recorded without production side effects.

**[Inference]** This is stronger than claim review because it can change an actual configuration decision, and narrower than a full trace because it does not require production infrastructure access. **[Unknown]** Whether 80VinteBot currently has staging, configuration versioning, dry-run tool calls, or an imminent release candidate. Without those, the correct first move is a bounded discovery interview, not an assurance claim.

**Hewitt-Christensen tension:** Reject an attractive broad customer workflow when there is no isolated configuration, expected behavior, and owner decision.

**Hewitt-Goldratt tension:** Reject a technically complete architecture review as too burdensome for the free exchange; also reject a public-page-only “AI assurance” test because it cannot witness model or tool behavior.

This is not a security audit, certification, compliance determination, or legal advice.

## Agent 3 - Goldratt, Eliyahu

# Goldratt Explorer Return: Zero-Fee 80VinteBot Pilot

## Evidence Boundary

**Observed fact:** 80VinteBot publicly describes AI agents that communicate across channels, qualify leads, and automatically move CRM pipeline stages. Its six-stage method includes customer-specific analysis, configuration, AI training, team training, 30-day optimization, and support; onboarding is separately priced. The company also operates a free AI mystery-shopper funnel. These are company-published statements, not independently validated outcomes. [Product and method](https://agencia80vinte.com.br/), [mystery shopper](https://agencia80vinte.com.br/cliente-oculto).

**Observed fact:** Its privacy policy covers customer messages, configurations, platform integrations, and retention periods; its terms acknowledge dependence on third-party APIs. [Privacy policy](https://80vintebot.com.br/politica-privacidade), [terms](https://80vintebot.com.br/termos-servico).

**Governing repository boundary:** [approved customer-value findings](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-07-11-investor-language-customer-value/findings.md:13) and [confirmed dispatch](/home/vrondelli/projects/domainspec-core/telemetry/agents/subagents-dispatch.yaml:3382). They prohibit treating completed delivery as customer value or inferring demand, ROI, compliance, certification, revenue protection, or willingness to pay.

**Unknown:** actual release/configuration process, economic buyer, review burden, failure history, safe access path, comparable baselines, and willingness to pay.

## Recommendation

**Inference:** The strongest candidate is a **shadow-mode readiness review for one customer-specific AI-agent configuration before go-live or material change**.

Freeze one configuration/version and one owner decision: **release, narrow, retest, pause, or reject**. Test 10–15 synthetic conversations covering agreed intents, qualification rules, escalation, unsupported claims, and permitted CRM actions. CyberAlchemy makes no production change.

Deliver a versioned record containing:

- agreed behavior requirements and sources;
- synthetic cases, observed outputs, and limitations;
- expected versus observed tool or pipeline actions;
- unresolved items and owner-adjudicated findings;
- recommended retest conditions;
- the owner’s pre-review and post-review decision.

This sits inside the approved fixed-scope release-review class while avoiding source-code, production-message, and broad security-audit scope. NIST recommends context-specific, documented AI testing with deployment-like conditions and explicit generalization limits. [NIST AI RMF](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/).

**Hypothesis:** This may reduce review/reconstruction burden or cause a useful configuration decision. The pilot must test that; it cannot presume it.

## Candidate Comparison

| Candidate class | Constraint economics | Verdict |
|---|---|---|
| AI sales-agent/configuration release assurance | Consequential owner decision; synthetic shadow testing can bound privacy; medium access and burden. | **Rank 1: offer only after discovery gate.** |
| Onboarding/configuration repeatability | Recurring workflow and potentially strong labor baseline, but easily expands into process redesign and may lack one decisive acceptance event. | **Rank 2:** use later after observing 3 comparable onboardings. |
| Claim-to-evidence review | Lowest access and burden; can inspect public claims without customer data. However, a polished claim register may change no operational decision and says nothing about product behavior. | **Rank 3 / fallback:** only when a named publication owner must approve, revise, or withdraw specific claims. |

**Goldratt–Christensen disagreement:** reject an attractive “better customer experience” narrative unless it resolves a named configuration decision and produces observable before/after evidence.

**Goldratt–Hewitt disagreement:** cap technical tracing at the smallest complete message-to-action witness. A broad architecture/security review exceeds a fair free exchange; a surface conversation score without owner-adjudicated requirements is cheap but vacuous.

## Fair No-Fee Exchange

Use a signed pilot memo despite the zero fee. UK pilot guidance similarly recommends explicit IP, confidentiality, data, termination, measurement, and production-transition terms. [Pilot-to-production checklist](https://www.gov.uk/government/publications/unlocking-space-for-investment-growth-hub/track-3-pilot-to-production-checklist).

| Term | Proposed boundary |
|---|---|
| Calendar | 10 business days: scope/baseline days 1–2; evidence and testing 3–6; owner review 7; one correction/retest 8–9; acceptance/deletion confirmation 10. |
| Customer time | Maximum 4 founder/owner hours: 60-minute kickoff, 90-minute evidence session, 60-minute findings review, 30-minute closeout. Track all other staff time separately. |
| Access | Read-only test account and sanitized configuration snapshot. No production credentials, raw customer conversations, bulk exports, autonomous actions, or source-code access. |
| Data | Prefer entirely synthetic cases. Before personal data enters scope, establish purpose, legal roles/basis, permitted fields, storage, authorized users, and deletion. No model training or unrelated reuse. LGPD requires purpose limitation, necessity, security, and accountability. [LGPD principles](https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/principios). |
| IP | Each party retains background IP. 80VinteBot retains its data/configuration; CyberAlchemy retains methods/templates; 80VinteBot receives an internal-use license to the final deliverable. Define any jointly created material before work. |
| Confidentiality | Mutual, need-to-know access; system-specific findings remain confidential; return or destroy materials at close. WIPO recommends explicit background/foreground IP, restricted access, and termination/destruction protocols. [WIPO collaboration guidance](https://www.wipo.int/web-publications/wipo-guide-to-trade-secrets-and-innovation/en/part-vi-trade-secrets-in-collaborative-innovation.html). |
| Case study | Separate, optional consent after acceptance; mutually approved exact wording; no condition of receiving free work; revocable until publication; no implied endorsement. |
| Support | Five business days after delivery, maximum two hours, clarification only. No remediation or implementation. |
| Changes | One scope clarification before freeze and one correction/retest. New channels, agents, integrations, production incidents, or requirements require a new agreement. |
| Exit | Either party may stop for relationship comfort, unsafe access, privacy uncertainty, burden breach, or scope conflict without fault or publicity. |

## Measurement Protocol

**Baseline:** Last three comparable configuration releases, recording elapsed time to owner verdict, minutes by role, evidence-search time, revision rounds, late-found in-scope issues, and final decision. Without comparable records, report delivery and usefulness only.

**Counterfactual:** The competent current process. For the pilot configuration, record the owner’s verdict before seeing CyberAlchemy’s review, then the post-review verdict and reasons. This paired shadow comparison is descriptive, not causal. Robust impact attribution normally requires a genuinely comparable counterfactual; a single historical or pre/post case is vulnerable to confounding. [Magenta Book](https://www.gov.uk/government/publications/the-magenta-book/magenta-book-central-government-guidance-on-evaluation-html).

Keep metrics separate:

- **Delivery:** agreed artifact completed on time; requirement/result trace coverage; unresolved items visible.
- **Usefulness:** owner actually used the deliverable; actionable findings accepted/rejected; recorded decision preserved or changed and why.
- **Operational change:** elapsed verdict time, role minutes, evidence-search minutes, revision loops, and later rework, all compared with baseline.
- **Quality limits:** owner-adjudicated false positives, false negatives, and any material missed in-scope requirement.
- **Repeat/referral:** unsolicited request for another bounded review or an introduction. This is continuation interest, not payment evidence.
- **Willingness to pay:** signed and collected follow-on purchase at a predeclared price. A free or friendship-priced engagement cannot provide it.
- **Commercial validation:** repeated paid acceptance from qualified independent prospects plus non-promotional repurchase and acceptable delivery economics.

**Total burden:** customer setup + access/security work + test-case preparation + meetings + specialist adjudication + revision/adoption + CyberAlchemy delivery, coordination, and rework. Report minutes by role; monetize only with customer-approved rates. Do not create a synthetic “decision quality” score.

**Confounders:** friendship, founder attention, novelty/Hawthorne effects, easy-case selection, simultaneous prompt/model/API changes, synthetic-versus-production behavior, changing requirements, better-than-usual documentation, staff learning, workload, and evaluator-authored tests.

## Gates

- **STOP before launch:** no authorized owner; no consequential release decision; no safe synthetic boundary; no baseline and no acceptance of delivery-only evidence; expected burden exceeds caps; or certification/compliance/security-audit expectations arise.
- **GO:** scope, owner, pre-verdict, access, deletion, metrics, and caps are signed.
- **STOP at close:** material missed requirement, unauthorized data exposure, burden-cap breach, or deliverable unused in the owner decision.
- **REPEAT:** delivery passes, the owner uses it, no material miss occurs, and at least one preregistered operational metric improves after total burden. A second free run proves only repeat use; a paid run can begin WTP evidence.
- **EXPAND:** not from this friend pilot. Require at least three comparable pilots across two organizations, two threshold passes, and one non-promotional paid repurchase, consistent with the approved findings.

## Bias And Prohibited Claims

**Inference:** Friendship creates non-random selection, higher tolerance, privileged access, reluctance to criticize, and referral courtesy. High rapport can increase socially desirable responses. [Rapport and data quality study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8535677/).

**Observed research:** zero prices change uptake and can encourage overconsumption; stated WTP instruments also suffer framing and order effects. [AEA zero-price review](https://www.aeaweb.org/articles?id=10.1257%2Fjep.23.3.21), [NBER WTP study](https://www.nber.org/papers/w30433). Therefore record list price, discount, reason, expiry, refusals, and abandonment; never relabel free acceptance as demand.

Remain **PROHIBITED**: inferred ROI, savings, payback, revenue protection, avoided loss or incidents, improved conversion, market demand, product correctness, security assurance, certification, compliance, legal approval, production safety, category ownership, or transferable performance beyond the tested configuration and conditions.
