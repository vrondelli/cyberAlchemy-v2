# CyberAlchemy Knowledge Market Product Idea - Research

Dispatch: `2026-06-24-cyberalchemy-knowledge-market-product`

This file is the strategist-appended transcript of the explorer returns. It is
source evidence for `findings.md`, not the final synthesis.

## Agent 1 - Forrester, Jay

**Forrester Readout**

The Tower-side product thesis: **a knowledge market should not trade notes; it should trade reusable, queryable expertise units that can argue, decide, and improve with receipts.** Tower's contribution is the asset shape: a domain substrate becomes reusable when it is graph-queryable, inhabited by stance-bearing personas, executable in tensioned runs, and adjudicated into scored verdicts. This is the promise in `research/tower-system-taxonomy/PRODUCT-VIEW.md` and the architecture in `research/tower-system-taxonomy/SYSTEM-VIEW.md`.

| Product primitive | Asset form for CyberAlchemy | Owned/executed vs net-new | Contribution/reuse edges to emit |
|---|---|---|---|
| Tower substrate | A domain knowledge asset: queryable graph + persona set, with source provenance | Tower construction/distill-build is owned/executed; full substrate as queryable+inhabitable runtime object is still partly unproven (`SYSTEM-VIEW.md`, `PRECEDENT-RECHECK.md`) | `built_from_source`, `promotes_artifact`, `contains_node`, `contains_persona`, `queried_by_operation`, `reused_in_domain` |
| Runtime-queryable graph | Typed nodes/edges with query surface, not prose markdown | Static ontology/tower precedent exists; runtime-queryable graph remains net-new (`SYSTEM-VIEW.md`, `PRECEDENT-RECHECK.md`, `witness-unit/SPEC.md`) | `node_defined_by_source`, `edge_typed_as`, `neighbor_of`, `anchors_persona`, `feeds_stance_rule`, `query_receipt` |
| Persona-as-artifact | A reusable expert/stance object anchored to a graph node | Net-new. The persona must carry `anchor`, `stance`, `criteria`, optional `voice`, and `provenance`; persistence alone is not enough (`findings.md`, `witness-unit/SPEC.md`, `witness-unit/GLOSSARY.md`) | `anchored_to_node`, `derives_stance`, `uses_criteria`, `participates_in_run`, `opposes_persona`, `rating_updated_by_verdict` |
| Opposable-stance rule | A contribution that turns node + proposition into genuine disagreement | Net-new/highest risk. Graph adjacency is composition, not tension; D2 must prove this works (`SYSTEM-VIEW.md`, `witness-unit/WORK-PACK.md`) | `consumes_node`, `consumes_proposition`, `emits_stance`, `validates_tension`, `rejects_composition`, `requires_reviewer_gate` |
| Tensioned operation | A reusable run pattern: instantiate one tensioned persona group for debate/design/write/dispatch | Multi-agent disagreement and dispatch are owned/executed; Tower's reuse is to feed them graph-anchored personas (`PRODUCT-VIEW.md`, `SYSTEM-VIEW.md`, `PRECEDENT-RECHECK.md`) | `instantiates_group`, `reuses_transport`, `produces_position`, `emits_disagreement_axis`, `requires_human_gate` |
| Scoring/adjudication | A verdict asset: outcome, confidence, route, and rating movement | Verdict scaffolding/tension governance is owned; ELO/oracle-consensus scoring is net-new in repo (`SYSTEM-VIEW.md`, `PRECEDENT-RECHECK.md`, `witness-unit/DESIGN.md`) | `consumes_votes`, `weights_by_rating`, `resolves_at_layer`, `updates_rating`, `emits_verdict`, `human_flagged` |
| MOGT decision policy | Per-agent action-selection policy, not verdict scoring | Owned but design-stage/unproven with zero live runs; must sit in Lphi, between application and adjudication, not in L4 (`PRECEDENT-RECHECK.md`, `SYSTEM-VIEW.md`, `witness-unit/SPEC.md`) | `scores_candidate_action`, `selects_next_move`, `uses_regime`, `observed_by_experiment`, `gates_reuse_until_evidence` |
| Witness trace | Market proof receipt for a primitive bundle | Draft witness unit only; A1-A5 must run before claiming the architecture works (`witness-unit/SPEC.md`, `witness-unit/WORK-PACK.md`) | `witnesses_D1`, `witnesses_D2`, `witnesses_D3`, `emits_trace`, `qualifies_asset_for_reuse` |

**Owned vs unproven boundary**

Owned/executed: source-to-tower construction, distill-build precedent, multi-agent debate with preserved tension, dispatch/governance scaffolding, and verdict vocabulary. These are reusable foundations, not claims to reinvent (`PRECEDENT-RECHECK.md`, `SYSTEM-VIEW.md`).

Owned but unproven: MOGT. It is real prior work, but as a design-stage decision/action-selection policy, so CyberAlchemy should label it `owned-design-stage`, require experiment receipts, and avoid presenting it as validated market scoring (`PRECEDENT-RECHECK.md`, `witness-unit/IMPLEMENTATION-LAYERING.md`).

Net-new/unproven: persona-as-artifact, runtime-queryable graph, node->opposable-stance, and ELO/oracle-consensus. These are the real market-making primitives, but they need witness receipts before they can be sold as reusable assets (`SYSTEM-VIEW.md`, `witness-unit/SPEC.md`, `witness-unit/WORK-PACK.md`).

**Overclaim Risks**

1. Calling Tower "working" before D1/D2/D3 pass. The docs explicitly say the center is still a bet (`PRODUCT-VIEW.md`, `witness-unit/SPEC.md`).
2. Treating personas as saved roles or angles. The differentiator is graph anchoring plus stance-bearing criteria (`findings.md`, `witness-unit/GLOSSARY.md`).
3. Treating graph adjacency as disagreement. D2 is the hardest risk because neighboring concepts may only compose (`SYSTEM-VIEW.md`, `witness-unit/WORK-PACK.md`).
4. Presenting ELO/oracle-consensus as production scoring. The witness thresholds and K-factor are proposals, and small judge counts are thin (`witness-unit/DESIGN.md`, `witness-unit/WORK-PACK.md`).
5. Misplacing MOGT as L4 scoring. It belongs to per-agent decision policy, and reuse should wait for experiment evidence (`PRECEDENT-RECHECK.md`, `SYSTEM-VIEW.md`).
6. Claiming world novelty. The system is an assembly over owned and known patterns; the honest novelty is the reusable market object and the D1/D2/D3 witness (`findings.md`, `PRECEDENT-RECHECK.md`).

## Agent 2 - Hewitt, Carl

Primary evidence: `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md`. The proposal is explicitly pre-build, and frames the product as a ResonantOS-native lineage layer, not a separate marketplace (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:3-7`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:19-21`).

**1. Event, Actor, Data Model**

The AI-local network should be a graph of reusable `Work` nodes connected by typed `Edge` records, with append-only `Event` records and auditable `Review` records.

Actors:
- `human`: individual contributor, reviewer, client, consultant, maintainer.
- `group`: team, DAO, organization, lab, client account.
- `project`: made product, research package, consulting deliverable, domain model.
- `addon`: capability package operating under grants.
- `persona_pack`: expert pack invoked through ResonantOS boundaries.
- `augmentor|engineer|provider_runtime`: AI/runtime actors that produced or transformed work.
- `external`: source material admitted through approved intake.

Work nodes should cover all durable governed artifacts: Living Archive bundles, research trails, prompt packages, delegated workspaces, add-on outputs, code changes, ADRs, product plans, security reviews, persona packs, domain logic packages, and external references admitted through intake (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:51-64`).

Core edges:
- `cites`, `uses-context`, `derives-from`, `invokes`, `verifies`, `rebuts`, `maintains`, `packages` (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:66-77`).
- Add `distributes` for reusable knowledge being published/exported inside ResonantOS, but treat it as credit-eligible only after actual observed use.
- Add `owns-or-stewards` between actor/group/project and work, for credit routing without pretending ownership equals contribution.

Host-observed lineage events are the hard boundary. ResonantOS can honestly record Augmentor context use, browser evidence capture, delegated task reads/returns, add-on grant-mediated consumption, persona invocation, and review decisions (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:102-113`). Add-ons may propose events, but proposed events remain lower trust than host-observed events.

Storage should be local-first: `Lineage/events.jsonl`, indexed `works/`, `edges/`, `reviews/`, and `exports/` under the user data root (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:194-211`). Invariants: stable work IDs, typed evidence, observed-vs-self-declared distinction, reproducible scoring, auditable review, and private-content-safe export (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:264-271`).

**2. Credit And Token Gating Model**

Credit comes first; token rewards are a later adapter. The proposal is blunt here: "Payment is a later adapter, not the foundation" (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:41-47`).

Credit score should be a reviewed evidence bundle, not an automatic payout:
- `observed_reuse_credit`: host-observed `uses-context`, `invokes`, `derives-from`.
- `verification_credit`: validated reviews, tests, audits.
- `maintenance_credit`: keeps another reusable node current.
- `packaging_credit`: turns scattered knowledge into a reusable unit.
- `novelty_seed`: unusual recombination, but never enough alone.
- `confidence`: host > human-attested > imported > add-on-proposed.

Use conserved weights so ancestor chains cannot all claim full value from the same descendant (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:115-120`). Score is "seed, not verdict"; review decides meaning (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:121-136`).

Token/reward eligibility gate:
1. Work is governed, durable, and has stable IDs.
2. Reuse is host-observed or reviewed with evidence.
3. Privacy policy permits credit surface.
4. Anti-gaming checks pass: spam, collusion, synthetic novelty, self-declared inflation.
5. Human/configured governance accepts review.
6. Identity/contributor policy is satisfied.
7. Funding source exists.
8. Wallet/security/legal/tax review is complete.
9. Human approval is required for any transfer.
10. Add-ons never get raw wallet, signing, score-finalization, or payout authority (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:164-174`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:413-423`).

The constraint is clean: no observable use, no honest reward graph (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:92-96`).

**3. Smallest Credible MVP**

The smallest credible MVP is credit-only lineage visibility for saved artifacts.

Build:
- Local schema for `work`, `edge`, `event`, `review`.
- Append-only event log plus indexed records.
- Living Archive instrumentation for intake, promotion, and Augmentor `uses-context`.
- Artifact detail UI with "Built on" and "Used by".
- Export that redacts private source content by default.
- Review action to accept, revise, reject, or defer lineage edges.
- Trust labels: host-observed, add-on-proposed, human-attested, imported.

Acceptance:
- A saved artifact shows real upstream shoulders and downstream reuse.
- Private prompts, memory, wallet context, page content, and source text do not leak through export.
- Self-declared/add-on-proposed edges are visibly lower trust.
- Score seeds are reproducible but make no payout or public claim (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:331-401`).

**4. Non-Goals Until Review**

Keep these out until legal/security/funding review:
- automatic wallet payout;
- public token claim;
- universal cross-app tracking;
- reward eligibility for unreviewed artifacts;
- add-on self-certification;
- scoring every chat message;
- raw prompt/private memory export;
- challenge bounties;
- DAO payout flows;
- marketplace-fee or reward-pool distribution;
- public attribution where privacy/consent is unresolved.

These match the proposal's non-goals and risks: privacy leakage, gaming, double counting, review capture, funding absence, legal exposure, and premature product timing (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:316-327`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:427-436`).

**5. Crisp ResonantOS Thesis**

ResonantOS can become the operating layer where reusable knowledge earns credit because it sits at the point of use: sources, memory, model calls, browser evidence, add-ons, delegated work, review, audit, wallet gates, and exports all pass through it.

The product thesis: make the shoulders visible first. Observe governed knowledge reuse locally, preserve a typed contribution graph, route credit through review, and only later attach wallet/DAO reward adapters after privacy, anti-gaming, identity, funding, security, and legal gates are real (`research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:292-299`, `research/SHOULDERS-OF-GIANTS-RESONANTOS-PROPOSAL.md:440-442`).

## Agent 3 - Simon, Herbert

**Simon View**
A CyberAlchemy knowledge-market product is safe only if it is a market for evidence work, attention routing, review labor, and reusable context, not a market for truth or authority. Authority remains owner-routed, closed-kind, and promotion-gated.

**1. Governance Constraints**
The hard rule is: authority moves by owner route, not by proximity, usefulness, repetition, votes, price, token weight, ontology placement, or Inventory lookup frequency. Any claim that changes what CAv2 can rely on must go to the narrowest owner before it governs work. Source: `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23`.

The closed authority kinds are: `Definition`, `Constitution`, `Discipline`, `Decision`, `Spec`, `Runtime contract`, `Projection`, `Evidence`, and `Residue`. Any unenumerated kind is default-deny. So `TokenAuthority`, `MarketAuthority`, `PriceSignalAuthority`, or `CommunityConsensusAuthority` do not exist unless first promoted through decision-gate plus constitution-governance. Source: `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48`.

Ontology is allowed to model authority, condense meaning, map owner routes, stage promotion requests, and produce projections. It is not allowed to promote itself, redefine definitions, create schemas, settle public claims, or decide authority. Source: `cyberAlchemy-v2/ontology/README.md:12`, `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:50`.

Inventory is an evidence substrate and read model, not authority. The `evset-knowledge-governance-stack` is especially useful here because it says repository knowledge becomes reusable without bypassing source evidence or owner promotion, and keeps inventory, ontology-vault, memory evidence, and observability as separate surfaces. Source: `.arcanum/inventory/entries/evidence-sets/2026-06-18-dispersed-knowledge-sets.md:45`.

The product must preserve CyberAlchemy's human-machine integration thesis: systems may recommend, prepare, route, or execute through approved owners, but must not erase human judgment, invent human state, silently promote knowledge, or pretend a handoff is resolved because it is well-written. Source: `cyberAlchemy-v2/VALUE-AND-PHILOSOPHY-PROPOSITION.md:36`.

**2. Product Boundary And Naming**
Safe product boundary: a governed knowledge exchange where humans and machines submit claims, evidence, contradictions, replications, validation runs, ontology interpretations, and promotion requests; the system rewards useful contribution and routes attention, but authority status is displayed only from owner decisions and promoted records.

Good names:
- `CyberAlchemy Evidence Exchange`
- `CyberAlchemy Knowledge Exchange`
- `CyberAlchemy Promotion Workbench`
- `CyberAlchemy Authority Router`
- `CyberAlchemy Review Market`
- `Connective Knowledge Ledger`

Use `CyberAlchemy Knowledge Market` only with a strict subtitle: "a market for evidence labor, not truth." I would avoid names like `Truth Market`, `Authority Market`, `Tokenized Ontology`, or `Knowledge Token Protocol`; they invite the exact collapse this model forbids.

The product surface should show two separate ledgers: a credit/participation ledger and an authority/promotion ledger. They can reference each other, but must not merge.

**3. Credit, Tokens, And Authority**
Credits or tokens can reward useful epistemic labor: finding source evidence, producing validation, running replications, identifying contradictions, maintaining read models, doing public/private scrub, or helping owners review faster.

They can also route attention: bounty queues, review priority, contributor reputation, challenge incentives, confidence annotations, or maintenance signals.

They cannot:
- promote a candidate;
- pass a gate;
- override a contradiction;
- convert ontology into authority;
- turn Inventory frequency into truth;
- make a private source public-safe;
- create a new authority kind;
- replace definitions-governance, constitution-governance, decision-gate, discipline-governance, or task-session.

If token weight influences a dashboard, that dashboard is a generated projection or evidence signal. If token weight influences a gate, the rule itself must first be promoted as a constitution/decision. The market can say "many people funded review of this claim"; it cannot say "therefore this claim is true."

**4. Promotion Gates And Non-Goals**
Required promotion path: source evidence -> import candidate -> Inventory or ontology candidate -> owner-routed local authority -> implemented or validated behavior -> stable repository asset. This is a review flow, not an automatic pipeline. Source: `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:31`, `cyberAlchemy-v2/authority/promotion-policy.md:8`.

Required gates:
- `authority import` for staged source material.
- `definitions-governance` when a term becomes load-bearing.
- `constitution-governance` when a structural rule constrains future artifacts.
- `discipline-governance` when a recurring practice needs stewardship.
- `decision-gate` for naming, scope, ownership, public/private posture, or contested promotion.
- `task-session` only after bounded implementation is ready and owner gates pass.

Challenge and falsification are first-class: signals do not promote; Inventory is read-model only; ontology views are not authority; contradictions block promotion; owner decisions are required; repeated success needs cross-context exercise before pattern authority. Source: `.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md:98`.

Non-goals:
- No token-weighted truth.
- No automatic promotion from popularity, usage, price, or repetition.
- No ontology-owned authority.
- No Inventory-as-canon.
- No generated projection as canonical source.
- No public reuse of private evidence without scrub.
- No automatic execution, surveillance, or replacement of human judgment.

**5. Crisp CAv2 Product Thesis**
CyberAlchemy is governed human-machine integration for complex knowledge work. A knowledge-market product inside CyberAlchemy should make the work of knowing visible, reviewable, and worth doing: sourcing, testing, challenging, routing, deciding, remembering, and handing off. Its market layer prices and rewards contribution to the loop; its governance layer decides what can be relied on.

Shortest thesis:

> CyberAlchemy turns knowledge work into a governed human-machine loop where evidence can be rewarded, meaning can be modeled, and authority can only move through named owners.

No files written.
