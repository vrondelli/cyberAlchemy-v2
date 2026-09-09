# CyberAlchemy Evidence Exchange - Findings

Dispatch: `2026-06-24-cyberalchemy-knowledge-market-product`

Status: product-research finding, not authority promotion

## Evidence Boundary

This finding creates a product idea from four live evidence surfaces:

- Tower System research: Tower substrate, graph-anchored personas, tensioned operations, MOGT placement, and the witness-unit D1/D2/D3 risk boundary (`research/tower-system-taxonomy/SYSTEM-VIEW.md:17-23`, `research/tower-system-taxonomy/SYSTEM-VIEW.md:112-173`, `research/tower-system-taxonomy/witness-unit/SPEC.md:47-71`).
- Shoulders of Giants / ResonantOS proposal: host-observed contribution lineage, typed work edges, local data model, credit-before-money sequencing, and token/reward adapter gates (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:41-47`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:51-77`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:102-174`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:194-271`).
- CyberAlchemy v2 authority and ontology: authority moves by owner route, ontology models but does not decide authority, and promotion requires named gates (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-46`, `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48-72`, `cyberAlchemy-v2/ontology/README.md:12-31`, `cyberAlchemy-v2/authority/promotion-policy.md:8-29`).
- Inventory lookup: `.arcanum/inventory/index.json` is parseable as `inventory.index.v0.1` with partial coverage, and the relevant read models keep Inventory as an evidence substrate, not an authority source (`.arcanum/inventory/index.json:1-6`, `.arcanum/inventory/entries/evidence-sets/2026-06-18-dispersed-knowledge-sets.md:45-68`, `.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md:31-63`).

The inventory search found strong CyberAlchemy governance and ontology context, but no first-class Tower System or Shoulders/ResonantOS inventory entry. For those two areas, this finding uses the source research files directly.

## Synthesis Constraints

The product must be a distinct exchange/workbench for governed evidence labor, not a truth market, authority market, generic DAO marketplace, or Tower rebrand. CyberAlchemy already has an authority rule, closed authority-kind table, and ontology boundary that prevent market, token, ontology, or popularity signals from becoming authority by proximity (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-72`, `cyberAlchemy-v2/ontology/README.md:12-31`).

The non-vacuity witness must be host-observed reuse. The Shoulders proposal is explicit that use outside governed host surfaces cannot honestly be rewarded, while host-mediated use can emit events with actor, artifact, capability, scope, and privacy policy intact (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:92-113`).

Vocabulary must stay narrow. `Credit` is a reviewed evidence seed, `knowledge asset` means governed reusable artifact rather than property, and token/reward language stays behind governance, legal, tax, wallet, funding, identity, and human approval gates (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:121-174`, `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122-133`).

## Verdict Matrix

| Candidate | Verdict | Finding | Evidence |
| --- | --- | --- | --- |
| CyberAlchemy Evidence Exchange | GO-CONDITIONAL | Build as a governed exchange/workbench for evidence labor, reusable context, review, challenge, packaging, and witness receipts. | Simon explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:142-169`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-72`; `cyberAlchemy-v2/ontology/README.md:12-31` |
| Work node / contribution graph | GO | Use stable Work nodes, typed edges, append-only events, and auditable reviews as the contribution graph. | Hewitt explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:46-68`; `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:51-77` |
| Host-observed reuse edge | GO | The first non-vacuous proof is host-observed reuse through a governed surface. | `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:92-113`; Hewitt explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:66-68` |
| Tower substrate candidate | GO-CONDITIONAL | Treat a Tower substrate as a candidate reusable domain asset only when source provenance, query surface, persona artifacts, run traces, and witness receipts exist. | Forrester explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:14-31`; `research/tower-system-taxonomy/PRODUCT-VIEW.md:101-119`; `research/tower-system-taxonomy/witness-unit/SPEC.md:47-71` |
| Persona candidate | GO-CONDITIONAL | Keep persona as a candidate artifact with anchor, stance, criteria, and provenance; do not imply authority, expert ownership, or payout entitlement. | `research/tower-system-taxonomy/SYSTEM-VIEW.md:145-159`; `research/tower-system-taxonomy/witness-unit/SPEC.md:49-55`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-72` |
| Node-to-opposable-stance | GO-CONDITIONAL | Highest-risk Tower element: the exchange can reward stance-formation work only after the node-to-stance rule proves genuine disagreement rather than graph adjacency. | `research/tower-system-taxonomy/SYSTEM-VIEW.md:149-155`; `research/tower-system-taxonomy/witness-unit/SPEC.md:49-55`; Forrester explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:31-40` |
| Scoring / verdict seeds | GO-CONDITIONAL | Use scores as reviewed evidence seeds and routing signals, not truth, authority, reward entitlement, or automatic payout. | `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:121-148`; Simon explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:171-186` |
| Authority promotion ledger | GO | Keep authority/promotion separate: market signals may fund, prioritize, or evidence review, but cannot promote authority. | `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-46`; `cyberAlchemy-v2/authority/promotion-policy.md:8-29`; Simon explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:145-169` |
| Token / payout / DAO adapter | KILL | MVP boundary: do not ship tokens, wallet payouts, DAO distribution, reward pools, or public token claims. | `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:164-174`; `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:413-423`; Hewitt explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:84-96` |
| Public marketplace | KILL | Do not make a public marketplace until privacy, consent, attribution, legal, identity, and anti-gaming controls are real. | `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`; `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:427-436`; Hewitt explorer, `cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/research.md:117-132` |
| Universal cross-app tracking | KILL | Track only governed host-observed use; universal cross-app surveillance breaks the evidence and privacy boundary. | `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:92-96`; `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:427-436` |
| Runtime-queryable graph | GO-CONDITIONAL | Candidate build surface, not yet a proven existing capability. | `research/tower-system-taxonomy/SYSTEM-VIEW.md:112-129`; `research/tower-system-taxonomy/PRECEDENT-RECHECK.md:24-43` |
| MOGT | GO-CONDITIONAL | Lphi-only boundary: keep MOGT as owned design-stage per-agent action selection, not market scoring or verdict aggregation. | `research/tower-system-taxonomy/SYSTEM-VIEW.md:64-74`; `research/tower-system-taxonomy/PRECEDENT-RECHECK.md:24-43` |

## Product Name And Thesis

Recommended product name: **CyberAlchemy Evidence Exchange**.

Thesis: CyberAlchemy Evidence Exchange makes reusable knowledge work visible, reviewable, challengeable, and credit-seeded while authority promotion stays owner-routed, gated, and separate from market signals.

Short promise: **make the shoulders visible first**. Observe governed reuse, preserve typed lineage, let reviewers accept or revise credit, and only later consider reward adapters after privacy, identity, funding, wallet, security, tax, legal, governance, anti-gaming, and human approval gates exist (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:292-299`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:331-423`).

This fits CyberAlchemy's product philosophy because the system may recommend, prepare, route, or execute through approved owners, but it must not erase human judgment, invent human state, silently promote knowledge, or pretend a handoff is resolved because it is neatly written (`cyberAlchemy-v2/VALUE-AND-PHILOSOPHY-PROPOSITION.md:45-48`).

## Story-First Product Idea

A researcher creates a governed artifact, `W0`, from source-backed work. It has a stable work ID, owner or steward, source provenance, privacy label, and digest (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:213-230`).

Later, a different project asks a local AI node to draft a policy, design, review, research artifact, product spec, consulting package, domain-logic module, or Tower-backed decision. The host retrieves `W0` as context, the AI uses it, and the downstream project saves `W1` as a durable artifact (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:102-113`).

This finding introduces a candidate `ObservedUseReceipt` shape to operationalize host-observed reuse. The source basis is the Shoulders proposal's host-mediated event boundary and local lineage invariants; the exact receipt name and field list are proposed here for implementation design, not promoted schema. The candidate receipt binds the source work, downstream work, project, AI node, run, retrieval query hash, selected context digest, output artifact digest, actor, timestamp, privacy export policy, trust level, and review status (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:102-113`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:264-271`).

A reviewer accepts, revises, rejects, or defers the edge. Accepted or revised edges update credit seeds, not authority. If the downstream work wants to become relied-on CyberAlchemy authority, it still enters owner-routed promotion (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:383-411`, `cyberAlchemy-v2/authority/promotion-policy.md:20-29`).

That is the product: not "buy my notes," not "vote truth into existence," but "this work was actually used, here is the receipt, here is the review, here is the credit seed, and here is the separate authority route if anyone wants to rely on it."

## Core Loop

1. Create or import a governed artifact with stable identity, provenance, privacy label, and owner/steward route (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:51-64`).
2. Register it as a Work node, Tower substrate candidate, persona candidate, verdict record candidate, or promoted authority projection depending on its real governance status (`research/tower-system-taxonomy/SYSTEM-VIEW.md:47-74`, `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48-72`).
3. Let local AI, project, reviewer, add-on, persona pack, consulting workflow, or domain-logic workflow retrieve or invoke it through governed host boundaries (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:81-96`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:178-190`).
4. Emit a host-observed receipt when reuse happens; lower-trust proposed or human-attested edges remain visibly different (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:102-113`).
5. Review the edge with accept, revise, reject, or defer actions, preserving rationale and old evidence (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:403-411`).
6. Update credit seeds with conserved budgets, ancestor damping, deduplication, trust levels, and conflict checks (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:115-136`).
7. Route authority movement separately through source evidence, import candidate, Inventory or ontology candidate, owner-routed local authority, implemented or validated behavior, and stable repository asset (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:31-46`, `cyberAlchemy-v2/authority/promotion-policy.md:8-18`).
8. Package, distribute, or sponsor review only within privacy, public/private, identity, legal, and owner-route constraints (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`, `cyberAlchemy-v2/VALUE-AND-PHILOSOPHY-PROPOSITION.md:99-106`).

## Knowledge Asset / Node / Ontology / Project Artifact Model

A **knowledge asset** here is a governed reusable artifact, not exchangeable property. It can earn reviewed recognition, review priority, sponsorship eligibility, or future reward eligibility, but it does not create ownership, authority, payout, or truth by existing in the exchange.

| Asset class | Product role | Boundary |
| --- | --- | --- |
| Work node | Stable governed artifact with provenance, privacy, digest, owner/steward, and lineage edges. | Credit can be seeded only from observed or reviewed evidence (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:51-77`). |
| Tower substrate candidate | Domain substrate built from sources and usable as context or witness track. | Queryable and inhabitable runtime behavior is conditional until D1/D2/D3 witness passes (`research/tower-system-taxonomy/PRODUCT-VIEW.md:101-119`, `research/tower-system-taxonomy/witness-unit/SPEC.md:47-71`). |
| Persona candidate | Stance-bearing reusable expert pack anchored to graph context. | Candidate only; must not imply authority, expertise ownership, or payout entitlement (`research/tower-system-taxonomy/SYSTEM-VIEW.md:145-159`). |
| Verdict record candidate | Review/adjudication artifact with proposition, outcome, confidence, route, and rationale. | It is review evidence, not truth (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:121-148`). |
| Promoted authority artifact / record / projection | Owner-approved authority state or allowed read model. | Must be produced by owner routes, not credit score, price, popularity, token weight, or ontology placement (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-72`, `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:50-82`). |

Core node and edge vocabulary should start with `work`, `edge`, `event`, and `review`, using edges such as `cites`, `uses-context`, `derives-from`, `invokes`, `verifies`, `rebuts`, `maintains`, and `packages`. Candidate additions such as `distributes` and `owns-or-stewards` can help publication and stewardship routing, but any schema vocabulary needs governance before it constrains implementation (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:66-77`, `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:39-63`).

Ontology may model authority, condense meaning, stage promotion requests, and emit projections, but it cannot decide authority, create schemas, redefine definitions, or settle public claims (`cyberAlchemy-v2/ontology/README.md:12-31`, `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:77-82`).

## Credit, Token, And Reward Model

Credit comes first; tokens and payouts are later optional adapters. The MVP should ship lineage visibility, reviewable credit seeds, recognition surfaces, and review routing before money (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:150-174`).

Credit signals:

- `observed_reuse_credit`: host-observed `uses-context`, `invokes`, or `derives-from` events.
- `verification_credit`: review, test, audit, replication, challenge, or falsification work that improves reliability.
- `maintenance_credit`: work that keeps a reusable node current.
- `packaging_credit`: work that turns scattered knowledge into reusable units.
- `novelty_seed`: unusual recombination, never sufficient alone.
- `review_confidence`: trust tier and review rationale attached to the score seed.

Credit must be conserved: downstream allocations sum to no more than the downstream credit budget, ancestors are damped, duplicate paths are deduped, and review happens before scoring becomes meaningful (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:115-136`).

Token/reward adapter gates are blocked until identity, contributor policy, funding source, wallet security, legal review, tax review, anti-gaming checks, governance acceptance, privacy/export permissions, and human approval are present. Add-ons must never receive raw wallet, signing, score-finalization, or payout authority (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:164-174`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:413-423`).

Reward language should stay with "recognition," "review sponsorship," "validation funding," "attention allocation," and "reviewed eligibility" until token/legal readiness exists.

## MVP Stages

### Stage 0 - Credit-Only Lineage Witness

Ship no money and no public market. Prove that a saved artifact can show what it built on, where it was reused, which evidence supports the edge, and whether the edge is host-observed, add-on-proposed, human-attested, or imported (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:331-342`).

### Stage 1 - Evidence Exchange Workbench

Create the local workbench for `work`, `edge`, `event`, `review`, receipt inspection, privacy-safe export, and reviewer actions. This stage proves the exchange as an operational workbench rather than a dashboard slogan (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:194-211`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:383-411`).

### Stage 2 - Tower Witness Track

Add Tower witness candidates only behind D1/D2/D3: queryable graph, persona-as-artifact, node-to-opposable-stance, scoring resolution, and verdict. The track can create high-value exchange assets, but it must remain conditional until witness receipts exist (`research/tower-system-taxonomy/witness-unit/SPEC.md:47-71`, `research/tower-system-taxonomy/SYSTEM-VIEW.md:145-173`).

### Stage 3 - Review, Challenge, And Credit Seeds

Add reviewer queues, challenge/correction actions, conserved credit budgets, reciprocal-review/collusion checks, and confidence labels. Challenge bounties stay out until anti-gaming controls are real (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:403-411`).

### Stage 4 - Authority Handoff Lane

Show when a highly reused or strongly reviewed artifact deserves owner attention, but route any promotion through CyberAlchemy authority gates. The exchange can raise attention; it cannot promote (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:31-46`, `cyberAlchemy-v2/authority/promotion-policy.md:20-29`).

### Stage 5 - Optional Token Adapter Gate

Design reward adapters only after the credit graph is useful without money and after identity, funding, wallet, security, legal, tax, privacy, governance, anti-gaming, and human approval are complete (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:413-423`).

## Data Model Sketch

This is a candidate sketch, not a promoted schema. Any production schema vocabulary needs owner/gate review before it constrains implementation (`cyberAlchemy-v2/authority/promotion-policy.md:20-29`, `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:39-63`).

```yaml
Work:
  work_id: string
  kind: living_archive_artifact | project_artifact | tower_substrate_candidate | persona_candidate | verdict_record_candidate | promoted_authority_projection
  title: string
  owner_or_steward_id: string
  source_refs: [string]
  artifact_digest: string
  privacy_label: private | shareable | public
  authority_status: draft | candidate | reviewed | promoted | revoked | blocked
  created_by:
    actor_kind: human | group | project | addon | persona_pack | ai_node | provider_runtime | external
    actor_id: string
  created_at: timestamp

Edge:
  edge_id: string
  source_work_id: string
  target_work_id: string
  edge_kind: cites | uses-context | derives-from | invokes | verifies | rebuts | maintains | packages | distributes | owns-or-stewards
  trust: host-observed | human-attested | imported | addon-proposed
  review_status: pending | accepted | revised | rejected | deferred
  evidence_refs: [string]
  credit_weight_seed: number

ObservedUseReceipt: # candidate receipt shape introduced by this finding
  receipt_id: string
  source_work_id: string
  downstream_work_id: string
  project_id: string
  ai_node_id: string
  run_id: string
  retrieval_query_hash: string
  selected_context_digest: string
  output_artifact_digest: string
  actor_id: string
  timestamp: timestamp
  privacy_export_policy: string
  trust: host-observed
  review_status: pending

Review:
  review_id: string
  edge_id: string
  reviewer_id: string
  action: accept | revise | reject | defer
  rationale_refs: [string]
  credit_delta_seed: number
  authority_effect: none
  created_at: timestamp

CreditSeed:
  work_id: string
  downstream_budget: number
  allocations:
    - source_work_id: string
      edge_id: string
      weight: number
      damped_ancestor_depth: integer
  checks:
    conserved_budget: boolean
    duplicate_paths_deduped: boolean
    coi_checked: boolean
    reciprocal_review_checked: boolean
    privacy_export_allowed: boolean
```

The sketch follows local-first lineage storage, stable IDs, typed evidence, observed-vs-self-declared distinction, reproducible scoring, auditable review, and private-content-safe export (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:194-230`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:264-271`).

## Governance And Promotion Gates

Authority moves by owner route, not by proximity, usefulness, repetition, votes, price, token weight, ontology placement, Inventory lookup frequency, or market score (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-46`).

Closed authority kinds are Definition, Constitution, Discipline, Decision, Spec, Runtime contract, Projection, Evidence, and Residue; unenumerated kinds default to blocked until a decision-gate and constitution-governance route add them. This blocks `TokenAuthority`, `MarketAuthority`, `PriceSignalAuthority`, and `CommunityConsensusAuthority` as silent authority kinds (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48-72`).

Required promotion route: source evidence -> import candidate -> Inventory or ontology candidate -> owner-routed local authority -> implemented or validated behavior -> stable repository asset. This is a review flow, not an automatic pipeline (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:31-46`, `cyberAlchemy-v2/authority/promotion-policy.md:8-18`).

Required gates:

- `authority import` for staged source material.
- `definitions-governance` when a term becomes load-bearing.
- `constitution-governance` when a structural rule constrains future artifacts.
- `discipline-governance` when recurring practice needs stewardship.
- `decision-gate` for naming, scope, ownership, public/private posture, reward language, or contested promotion.
- `task-session` only after bounded implementation is ready and owner gates pass.

The product must show two separate ledgers: a credit/participation ledger and an authority/promotion ledger. They may cross-reference each other, but they must not merge.

Market signals are allowed only as evidence, attention allocation, review priority, sponsorship, or challenge signals. They cannot decide truth, promote authority, create schema, override contradiction, or make private material public-safe.

## Non-Goals

- No truth market, authority market, generic DAO marketplace, or Tower System rebrand.
- No authority-by-score, authority-by-token, authority-by-price, authority-by-usage, or authority-by-popularity.
- No token or payout MVP.
- No public token claim, reward pool, marketplace-fee distribution, DAO payout flow, or challenge bounty until review gates pass.
- No universal cross-app tracking.
- No raw prompt, private memory, wallet context, page content, or source text export by default.
- No add-on self-certification, score-finalization, wallet authority, signing authority, or payout authority.
- No scoring every chat message.
- No reward eligibility for unreviewed artifacts or spam artifacts.
- No public reuse of private evidence without scrub and owner/public-boundary review.
- No claim that legal, tax, securities, money-transmission, wallet, identity, funding, or governance readiness already exists.

## Open Risks

- Observation risk: use outside governed host surfaces cannot be verified, so the product must avoid universal reuse claims (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:92-96`).
- Privacy risk: lineage export can leak private sources, prompts, page content, wallet context, or personal memory unless redaction and export policy are first-class (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`).
- Gaming risk: self-declared lineage, collusion, reciprocal review, synthetic novelty, spam artifacts, and clustered reviewers can inflate credit (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`).
- Double-counting risk: ancestor chains can overclaim unless credit is conserved, damped, and deduped (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:115-120`).
- Review capture risk: AI reviewers can drift, agree too easily, or overfit unless review rationale, tension, audit, COI checks, and human/configured governance are explicit (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:140-148`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`).
- Tower proof risk: persona-as-artifact, node-to-opposable-stance, runtime-queryable graph, and ELO/oracle scoring remain witness-gated (`research/tower-system-taxonomy/SYSTEM-VIEW.md:112-173`, `research/tower-system-taxonomy/witness-unit/SPEC.md:47-71`).
- MOGT risk: MOGT is owned but design-stage/unproven and belongs to per-agent action selection, not market scoring (`research/tower-system-taxonomy/PRECEDENT-RECHECK.md:24-43`, `research/tower-system-taxonomy/SYSTEM-VIEW.md:64-74`).
- Legal/token risk: payout, tokenized reward, public attribution, cross-border payments, DAO flows, securities implications, tax, and money transmission need review before any public reward adapter (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:164-174`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`).
- Vocabulary risk: "market," "asset," "credit," "reward," and "token" can imply ownership, truth, payout, or securities unless definitions and product copy keep them narrow.

## Next Decisions

1. Decide whether `CyberAlchemy Evidence Exchange` is product-language-only for now or should enter definitions-governance as a formal term.
2. Select the first host-observed surface for the MVP receipt: Living Archive context use, delegated task reads/returns, Augmentor context use, or Tower witness track.
3. Freeze the minimum `ObservedUseReceipt` candidate fields before implementation design.
4. Decide the first artifact class for credit-only lineage: Work node, project artifact, Tower substrate candidate, or review/verdict record.
5. Decide reviewer actions, trust labels, and credit conservation parameters for the first local model.
6. Decide the privacy export policy and redaction requirements before any contributor or public view.
7. Route any schema-affecting vocabulary through the appropriate governance path before implementation.
8. Hold token/reward adapter design until identity, funding, wallet, security, legal, tax, governance, anti-gaming, and human approval gates are explicitly satisfied.

## Close Metadata

```yaml
dispatch_id: 2026-06-24-cyberalchemy-knowledge-market-product
artifact: cyberAlchemy-v2/development/research/2026-06-24-knowledge-market-product-idea/findings.md
status: findings_ready_for_audit
promotion_effect: none
authority_effect: none
inventory_effect: lookup_only
recommended_followup: decision-gate for product naming and first MVP receipt surface
```
