# Verbatim Explorer Returns

These returns are preserved exactly as received from the three registered explorer actions. They are research evidence, not authority, findings, publication approval, or paper prose.

<a id="explorer-return-1-noether-authority"></a>

## Noether — structural authority

action_id=spawn-0001  
agent_id=/root/paper_explorer_noether  
dispatch_id=2026-08-07-domainspec-v2-paper-evidence-refresh  
role=explorer-noether  
status=pass

## Bounded research report

### 1. Corpus and source-family census

Enumerated before sampling:

| Source family | Current owner/source | Posture | Use in this lane |
|---|---|---|---|
| Repository identity and migration | `projects/domainspec-v2/README.md`; `IMPORT-MANIFEST.md` | Primary status/transition source | Current implementation-home, migration, frozen-v1, private-boundary claims |
| Authority spine | `authority/AUTHORITY-MODEL.md`; `authority/source-spine.md`; `authority/promotion-policy.md` | Primary authority | Authority kinds, source posture, promotion, external-owner and claim boundaries |
| Constitution and axioms | `authority/constitutions/domainspec-v2-CONSTITUTION.md`; `authority/AXIOMS.{md,yml}` | Primary local governance authority | Current governance rules and explicit open questions |
| Owner decisions | `authority/decisions/` | Primary decision records | Ratification, relationship changes, supersession, canonical responsibility |
| Definition registry | `definitions/DEFINITIONS.md`; `DEFINITIONS-INDEX.md` | Primary definition authority | Current term status and non-collapse rules |
| Meta-type registry | `definitions/meta-types/meta-types.{md,yml}` | Human authority companion plus machine read-model index | Active/candidate/deferred/superseded type census |
| Relationship registry | `definitions/relationships/relationships.{md,yml}` | Primary DS-D2/DS-D8 authority | Active signatures, endpoint/scope rules, generated and deprecated rows |
| Formalization snapshot | `formalization/README.md`; `DomainSpecEdgeSignature.lean` | Imported evidence/candidate instrument | Bounded formal claim only; explicitly stale and not built here |
| Ontology instantiation | `ontology/README.md` | Candidate-local surface | Ontology organization only; no authority effect |
| Public paper under audit | `arcanum/docs/paper.html` | Historical public artifact, not v2 authority | Claims to retain, rewrite, or remove |
| Inventory packet | `strategy-inventory-packet.json` | Discovery read model only | Source leads and known drift; never used as authority |
| Excluded supporting families | v1, CyberAlchemy v2, sibling Lean repo, plans, research findings, receipts | Supporting, historical, candidate, or execution evidence depending on artifact | Not allowed to override live v2 owners; not sampled except where a live owner described their posture |

The current source spine itself defines the primary/supporting distinction at `authority/source-spine.md` lines 11–20 and labels at lines 22–32. It explicitly makes v1, CyberAlchemy v2, and formal precedent supporting-only, never resolution-path authority.

### 2. Immutable local identity

Repository HEAD observed: `2f95b14d0d1006a35a7828b1bcf70106c6e11578`.

Because the worktree may contain uncommitted bytes, the exact files read are additionally bound by SHA-256:

| Source | SHA-256 |
|---|---|
| `projects/domainspec-v2/README.md` | `56e6cfbad2beaa27e46aee216f3efb380c502d099ae7f846d1523622b8f17de5` |
| `projects/domainspec-v2/IMPORT-MANIFEST.md` | `c354581e5c88b67db645ee6c9f59dfb3a9958a1b4dcbad1687f7603ec300a2b1` |
| `projects/domainspec-v2/authority/source-spine.md` | `c3a2aedbea8d3f45bb1de578db1869d3066e73f7cf70213752970d3b4d3092b2` |
| `projects/domainspec-v2/authority/AUTHORITY-MODEL.md` | `a6080927d265c2064792acca788548dbdea2497e767d822730b7d616e663f073` |
| `projects/domainspec-v2/authority/AXIOMS.md` | `da7073eb878fa73802f68159a76c629c7b2b262d7052929298c790a909db46bb` |
| `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md` | `78b93b2a70b8c56069436d5a28a5c551abb0f227b1bec825c38d9d96459f741b` |
| `projects/domainspec-v2/definitions/DEFINITIONS.md` | `04541ad0f1cb995324950fa2c04a839a236aff1cda168e1767bb2b67a7adcc4d` |
| `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md` | `2e85269bce8465c0de9ad7d538593525cead19da61dbf92244b962e4db194909` |
| `projects/domainspec-v2/definitions/meta-types/meta-types.yml` | `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede` |
| `projects/domainspec-v2/definitions/meta-types/meta-types.md` | `92e05d5b870ec86538d1f2b300a423394c8e4ff36d5a0a87803eb71e9c75ba76` |
| `projects/domainspec-v2/definitions/relationships/relationships.yml` | `ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f` |
| `projects/domainspec-v2/definitions/relationships/relationships.md` | `42166989853881f888ee5b72c9cda9e31dc1627b8082ed697ac282d37c053da6` |
| `projects/domainspec-v2/formalization/README.md` | `41e822ce140b568b5566d2464770ca4214bf427b5d6dd8b98f6da615637e0854` |
| `projects/domainspec-v2/ontology/README.md` | `40f026aaa936f03fa5925158dd554d0c53884cd2f9406e0e604612a482694ede` |
| `arcanum/docs/paper.html` | `cb430f8d5f15c917fef70fae5e0e7fc1ee3533cfb2d7f6bc044c26d473620e73` |

### 3. Reconstructed current state

#### Active

- DomainSpec v2 is the current implementation home, but migration and reformulation remain in progress: `README.md` lines 3–20; `IMPORT-MANIFEST.md` lines 1–20.
- The local authority model is active. Validation governance, layering governance, and drift governance are ratified local kinds: `AUTHORITY-MODEL.md` lines 49–64 and 75–81.
- Attestation is limited: an L1 integrity receipt exists, while external L2 actor-identity signing remains pending: `AUTHORITY-MODEL.md` lines 14–15 and 75–81.
- Three retained local axioms are active: semantic authority precedes implementation, decisions belong to the domain rather than adapters, and critical governance methods require runnable/computable validation: `AXIOMS.md` lines 45–52.
- The constitution is active and repository-local: `domainspec-v2-CONSTITUTION.md` lines 8–19.
- Root definitions own the canonical language and relationship authority; implementation surfaces consume or project it unless explicitly promoted: constitution lines 44–53.
- Current backend type authority is 13 active, non-contiguous types: `DS-D1.1..9` and `DS-D1.11..14`: `meta-types.yml` lines 9–17; `meta-types.md` lines 8–15.
- Current DS-D8 authority declares 31 active relationship signatures: `relationships.md` lines 25–37; `DEFINITIONS.md` heading `DS-D8 — Relationship Signature Authority`, especially lines 1116–1161.
- The current relationship model is a “typed composable graph fragment,” not full category law: `relationships.md` lines 3–15; `DEFINITIONS.md` heading `domainspec-v2-D19`, especially lines 1003–1042.
- `creates` is active as a same-feature, partial-one-to-one `Operation → Entity` edge; `creation_targets` is generated, not authored: `relationships.md` lines 31–36 and 100–123; decision `2026-07-22-canonical-creation-responsibility.md` lines 23–34 and 49–65.
- `enforces` is the sole canonical Rule-to-Operation verb for both same- and cross-feature placement; `enforces-cross` is deprecated: `relationships.md` lines 125–138; decision `2026-07-22-enforces-cross-feature-scope.md` lines 22–30.

#### Candidate

- Definition IDs `domainspec-v2-D6`, D7, D8, D10–D15 remain candidate even though some downstream vocabulary surfaces are active: `DEFINITIONS-INDEX.md` lines 23–32. Public prose must not flatten tracked definition-card maturity into a claim that every language concept is equally formalized.
- Nine UI types, `DS-D1.15..23`, are candidate shape evidence, explicitly not active or promotion-ready: `meta-types.yml` lines 18–27; `meta-types.md` lines 18–26.
- The ontology instantiation folder is candidate-local and has no authority effect by itself: `ontology/README.md` lines 1–15 and 93–116.
- The imported Lean file is evidence plus a candidate instrument, not authority: `formalization/README.md` lines 1–9 and 84–96.

#### Deferred

- `DS-D1.24 Adapter` is a deferred merge-candidate toward Mapping; `DS-D1.25 State Indicator` is a deferred split-candidate: `meta-types.yml` lines 28–36.
- `depends-on`, Operation-return-to-Value-Object as an edge, and the event-payload/publisher composite remain deferred for lack of a distinct non-collapse witness: `definitions/reviews/2026-07-12-deferred-relationship-candidates.md`, section `Current rulings`, lines 30–40.
- The constitution split into governance-specific files remains an open reformulation step: constitution lines 21–40 and 172–182.
- End-to-end external implementation/release decisions remain outside DomainSpec’s authority: `AUTHORITY-MODEL.md` lines 40–47 and 136–150.

#### Superseded/deprecated

- `DS-D1.10 Saga` is superseded by Workflow; the stable ID cannot be reused: `meta-types.yml` lines 37–43; `meta-types.md` lines 36–51.
- `domainspec-v2-D26 relationship source-effect binding` is superseded by D27: `DEFINITIONS.md` lines 1176–1197.
- The initial `creates` decision’s dual-authored `creation_targets` and many-to-many cardinality are superseded: `2026-07-22-operation-creates-entity.md` lines 1–20; replacement decision lines 106–119.
- `enforces-cross` is deprecated and rejected with `enforces` replacement guidance: `relationships.md` lines 125–138.

#### Generated/read-model

- `meta-types.yml` identifies itself as a read-model index, not a validation schema: lines 1–3.
- Human relationship display notation is a projection; the finite machine relation is authority: `relationships.md` lines 14–15.
- `owned-by` is generated reverse navigation and must not be authored canonically: `relationships.md` lines 140–149; `relationships.yml` generated-views section beginning line 517.
- `creation_targets` is a deterministic generated projection from the canonical `creates` edge: `relationships.md` lines 100–123.
- Inventory is a discovery read model with no authority or proof effect, per the supplied packet’s `non_authority_notice`.

#### Historical/supporting

- v1 is frozen as evidence/harvested precedent, not v2 authority: `README.md` lines 7–12 and 76–80; `source-spine.md` lines 15–20.
- CyberAlchemy v2 is harvested precedent for shape/provenance only, never a v2 resolution path: `source-spine.md` lines 17–19 and 34–53.
- The imported Lean snapshot transcribes the historical 25-meta-type/29-edge state and is intentionally stale against current root authority: `formalization/README.md` lines 59–82.
- The public paper’s inherited 25-type/29-edge model is therefore a historical snapshot, not the current v2 authority state.

### 4. Exact-binding paper claim matrix

Proof status vocabulary:

- `observed`: directly read in current owner bytes.
- `executed`: command or behavior run in this action.
- `unverified`: asserted by a source but not independently replayed here.

| Paper claim / selector | Current binding | Status | Verdict | Public-safe wording | Stale or killed wording |
|---|---|---|---|---|---|
| L0–L7 is the current DomainSpec architecture (`paper.html` lines 119–129, 162–177, 228–244) | Current v2 owners instead define typed graph, three governances, source/authority separation, and incomplete migration. No current owner read here promotes the inherited seven-layer paper model as v2 language authority. | observed negative | Rewrite as historical/architectural proposal unless another current owner explicitly binds it | “The paper proposes a layered architecture; current DomainSpec v2 authority is organized around typed definitions, relationship signatures, and separate validation, layering, and drift governance.” | “DomainSpec is an established L0–L7 architecture” |
| Closed ontology of 25 meta-types (`paper.html` lines 129, 164, 190, 218, 234, 757–759, 784) | 13 active backend types; 9 UI candidates; 2 deferred UI candidates; Saga superseded. The registry says 24 staged labels, not 25 active types. | observed | Remove count or replace with maturity-aware census | “The current backend vocabulary has 13 active meta-types, with additional UI candidates and deferred boundaries under evaluation.” | “Closed vocabulary of 25 meta-types”; “25 active types” |
| 29 typed relationships (`paper.html` lines 129, 164, 218, 234, 542, 757, 784) | 31 active DS-D8 signatures; generated, deprecated, and deferred rows excluded from that count. | observed | Rewrite | “The current relationship authority defines 31 active typed signatures.” | “29 relationships”; any count derived from the stale Lean snapshot |
| Saga as current meta-type and cross-feature repair (`paper.html` lines 758, 762) | Saga is superseded by Workflow; `enforces-cross` is deprecated; current cross-feature semantics use scope-bearing canonical verbs. | observed | Remove/rewrite | “Workflow carries current orchestration semantics; relationship scope is represented separately where admitted.” | “Saga is a current required extension”; “enforces-cross is active” |
| Ontology as a promoted base ontology (`paper.html` throughout Sections 3–4) | Local ontology instantiation is candidate-only and has no authority effect. | observed | Narrow | “DomainSpec v2 has a candidate-local ontology instantiation surface used to organize possible entries under a local owner route.” | “The ontology package is promoted/complete/authoritative” |
| Executable typed graph supports full composition/category structure (`paper.html` lines 129, 171, 175, Sections 4–5) | Current authority says typed composable graph fragment, not full category law; composition is bounded by finite DS-D8 signatures and tracked consequences. | observed | Rewrite | “DomainSpec v2 defines a finite typed graph whose current signatures support bounded validation and generation uses.” | “Full composition algebra”; “category-law proof”; universal composability |
| Deterministic derivation bridges domain knowledge to verified software (`paper.html` lines 121, 129, 151, 171, 175, 784) | Authority permits deterministic derivation of obligations from the spec, but a passing derived test is only build-time fidelity, not runtime correctness. | observed authority; implementation breadth unverified here | Narrow sharply | “DomainSpec v2 requires derivable obligations and expected values to come from the specification; passing those checks is necessary build-time fidelity, not proof of runtime correctness.” | “Bridges to verified software”; “eliminates the stochastic gap”; “typed models are sufficient for comprehensive tests” |
| Formal semantics/proof (`paper.html` Sections 4–5 and lines 757–771) | Local Lean snapshot has a decidable checker and source-proved theorems, but is not built here, is not authority, and is stale at 25/29 versus current 31 signatures. | observed documentation; source build unverified | Rewrite as bounded historical evidence | “A separate Lean artifact demonstrates a decidable checker for an earlier signature snapshot; synchronization with current authority and local replay remain open.” | “Current DomainSpec v2 is formally proved”; “the 31-signature authority is Lean-verified” |
| Governance attenuation is a formal current DomainSpec result (`paper.html` lines 129, 145, 152, 176, Section 6, 784) | Current v2 owner sources define validation/layering/drift governance and non-collapse rules, not an empirical or mathematical proof of Shannon-bounded attenuation. | observed negative | Treat as hypothesis/analogy, not result | “The architecture hypothesizes that governance fidelity can degrade as control surfaces accumulate; current v2 authority addresses this operationally by separating law, checks, and trend.” | “Formal attenuation bounds”; “more governance produces less governance” as established fact |
| Self-governance resolves regress without external authority (`paper.html` lines 129, 146, 153, 171, 177, 784) | Current authority explicitly requires external owner decisions for implementation conformance, release, and promotion. Recursive schema is depth-1 witnessed only; depth-2 and trend type remain gaps. | observed | Rewrite | “DomainSpec v2 applies a bounded recursive governance model locally, while implementation conformance, release, and promotion still require external owners.” | “Resolves infinite regress without external authority”; fully operational self-governance |
| Saturn is governance authority or a shipped loop | Saturn is an actuator acting on drift, not drift governance and not the authority defining it: `AUTHORITY-MODEL.md` lines 57–60, 93–101, 157–165; constitution lines 89–95. | observed | Enforce non-collapse | “A separate control-loop concept may act on drift signals; DomainSpec v2 locally owns the definition and governance of drift.” | Saturn described as DomainSpec’s shipped authority or as synonymous with drift |
| Constitution is fully reformed and mechanically enforced | Active local credibility constitution exists, but per-rule v1 reformulation and governance-specific split remain open; standalone build-proof is also recorded open. | observed | Narrow | “DomainSpec v2 has an active repository-local credibility constitution with hybrid and review rules; additional reformulation and standalone validation work remains open.” | “Formal constitution fully enforced end to end” |
| Framework is open-source / replication package (`paper.html` lines 129, 785, 833–850) | v2 is private; engine results/behavior may be cited, but the rule algorithm is withheld and must never enter public Arcanum. Only public-safe abstractions may be published. | observed | Remove or scope to the public artifact only | “This public paper describes selected source-abstracted aspects of a privately governed DomainSpec v2 system.” | “DomainSpec is open-source”; “full replication package”; implying private engine disclosure |
| Production validated / production system (`paper.html` lines 129, 179, 660–747, 785) | Authority expressly cannot mark obligations satisfied in production; implementation/release decisions are external. No production authorization was verified in this lane. | observed authority; production evidence unverified | Kill pending external production proof | None beyond “repository-local validation evidence exists” unless independently bound | “Production-validated”; “validated on a production system” |
| 445 obligations, 146 metrics, 89 concepts, 7 features/3 pillars | No current v2 owner source read in this lane binds these historical counts. | unverified | Defer or remove | “Earlier internal case-study artifacts reported derived outputs; current revision should omit exact totals unless rebound to immutable evidence and independently checked.” | Presenting counts as current v2 results |
| Current orchestration has 14 agents, 25 skills, nine stages (`paper.html` lines 169, 605) | Not owned by the current v2 semantic/authority sources sampled. | unverified | Remove from DomainSpec semantic claims or route to Arcanum owner | None from this lane | Treating orchestration inventory as stable DomainSpec ontology |
| Self-application proves correctness | Constitution prohibits authority laundering and separates local status, validation, implementation, and launch readiness: lines 146–170. | observed | Kill | “The governance rules are themselves subject to local source, evidence, and owner-route constraints.” | “Self-application proves the framework correct” |

### 5. Public-safe wording constraints

Any revised public paper should obey all of the following:

1. Describe DomainSpec v2 as private and current work as active/incomplete; do not imply it is a shipped public product.
2. Do not expose repository-private paths, engine rule implementation, internal ontology entries, private authority prose, or moat mechanics in proposed public prose.
3. Do not say “25 meta-types.” If an exact current count is necessary, say “13 active backend meta-types,” and separately identify other UI labels as candidates or deferred.
4. Do not say “29 relationships.” Current root authority binds 31 active signatures.
5. Do not count generated views, deprecated aliases, or deferred candidates as active signatures.
6. Do not describe Saga as active or `enforces-cross` as canonical.
7. Distinguish:
   - definition from implementation;
   - edge law from validator;
   - derived obligation from passing test;
   - passing test from runtime correctness;
   - drift signal from convergence;
   - local governance from external implementation/release authority;
   - candidate ontology from promoted ontology;
   - imported formal snapshot from current formal proof;
   - public description from open-source offering.
8. “Deterministic” may describe a bounded derivation/checking relation only where an exact implementation or receipt binds it. It may not imply comprehensive correctness, universal sufficiency, or deterministic implementation generation.
9. “Formal” must name the formal object and version. The imported Lean snapshot cannot support current 31-signature proof claims.
10. “Self-governance” must remain bounded and local; it cannot erase the external owner required for implementation conformance, promotion, release, or production.
11. Governance attenuation, Shannon/Ashby/Gödel mappings, and strange-loop language should be presented as hypotheses, analogies, or architectural interpretations unless another lane supplies direct primary proof.
12. Historical case-study numbers require immutable artifact identity, exact selectors, and independent verification before reuse.
13. Public Arcanum must not be described as shipping DomainSpec or Saturn.

### 6. Exclusions

Excluded from authority and current-count roles:

- Root Inventory entries and projections: discovery/read-model only.
- DomainSpec v1: frozen harvested precedent at the manifest-pinned commit, not v2 authority.
- CyberAlchemy v2: supporting shape/provenance only and forbidden on a v2 resolution path.
- Plans, research tower proposals, candidate ontology entries, and receipts: none independently creates semantic authority.
- `formalization/DomainSpecEdgeSignature.lean`: imported stale snapshot; not current authority and not locally built.
- Generated `owned-by`, generated `creation_targets`, display notation, generated instances, and other projections: consumers/views, not authored semantic source.
- Superseded `DS-D1.10 Saga`, D26, and the initial many-to-many/dual-authored `creates` clauses.
- Deferred `depends-on`, Operation-return edge, and event payload/publisher composite.
- Private engine rule implementation: explicitly outside report detail and forbidden for public disclosure.

### 7. Gaps and residue

- No active project-local Inventory exists; the supplied root packet remains a non-authoritative discovery seed.
- Exact current authority counts are bound, but this lane did not execute validators or replay decision receipts. Decision-file PASS totals are therefore observed receipt claims, not fresh execution evidence.
- The current relationship registry uses UI candidate/deferred endpoint labels while DS-D1 formation authority keeps those labels non-active. Public prose must preserve this tension instead of calling every endpoint type active.
- No current v2 owner source sampled here establishes L0–L7 as the promoted v2 architecture.
- No current owner source sampled here binds the paper’s production, replication, open-source, 445/146/89, seven-feature, three-pillar, 14-agent, 25-skill, or nine-stage claims.
- No current proof binds the Lean snapshot to the 31-signature authority.
- The formalization README says the sibling proof source still needs a global build-gate re-verification.
- The recursive governance model has only a depth-1 witness; depth-2 leaf inhabitation and a typed trend stream remain open.
- The constitution records standalone validation build-proof and per-rule reformulation as open.
- External owner evidence for implementation conformance, release, deployment, and production was not present in this lane.
- Public wording will require a privacy scrub after synthesis; source paths above are private research bindings and must not be copied into public prose.

## Validation summary

- Exact persisted action, targeted explorer object/prompt, Inventory packet, and research owner were read.
- Relevant v2 source families were enumerated before sampling.
- Exact local SHA-256 identities were computed for every load-bearing source used.
- Current authority/status was reconstructed with source-local line selectors or stable headings.
- Active, candidate, deferred, superseded/deprecated, generated/read-model, and historical/supporting states were separated.
- No implementation, validator, test, browser, network, or external-primary-source execution was claimed.
- Mutation policy remained read-only.
- No file, Git state, ledger, telemetry, Inventory, external system, or forbidden scope was mutated.

Residue: implementation and empirical claims remain for the computational explorer; external theory, novelty, citation, deployment, and public-artifact claims remain for the adversarial public-paper explorer. This return closes only the structural authority lane.

<a id="explorer-return-2-turing-execution"></a>

## Turing — executable evidence

action_id=spawn-0002  
agent_id=/root/paper_explorer_turing  
dispatch_id=2026-08-07-domainspec-v2-paper-evidence-refresh  
role=explorer-turing  
status=pass

## Bounded research report

### Executive verdict

The live repository supports a bounded claim that DomainSpec v2 contains an implemented, deterministic structural spec-to-obligation/test engine with a substantial passing component suite, plus several candidate-local conformance evaluators and discriminating negative controls.

It does not support claims of:

- general semantic satisfiability;
- arbitrary application generation;
- complete architecture or implementation conformance;
- complete backend-type-test-engine execution;
- general agent satisfaction;
- production validation;
- a reproducible release/replication package;
- independent end-to-end replay;
- release or production authorization.

The strongest current live execution observed was the engine suite: 29 test files and 240 tests passed, followed by a clean TypeScript typecheck. That is component evidence, not a production aggregate.

### Executable-source census

| Family | Exact source identity / selector | Current posture |
|---|---|---|
| Deterministic derivation engine | `projects/domainspec-v2/impl/test-derivation-engine/README.md:3`, `:32-35`, `:46-50`; package commands in `projects/domainspec-v2/impl/package.json#/scripts` and `projects/domainspec-v2/impl/test-derivation-engine/package.json#/scripts` | Implemented and live-tested for its bounded structural contract. |
| Engine unit/integration/generated-test suite | `projects/domainspec-v2/impl/test-derivation-engine/src/**/*.test.ts`; especially `src/emit/tests.test.ts`, `src/index.test.ts`, `src/roundtrip/negative-control.test.ts`, `src/minted-project/conformance.test.ts`, and `src/bte/*.test.ts` | Executed in this action: 29 files, 240 tests passed. Includes emitted-test syntax/runnability checks, negative controls, and bounded receipt mutation invalidation. |
| BTE command surface | `projects/domainspec-v2/impl/package.json#/scripts/verify:bte:*` and `#/scripts/verify:bte` | Commands exist and portions are covered by the main suite. Their existence and component tests do not prove the planned L0B–L8 receipt chain. |
| BTE completion lifecycle | `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/PLAN.md:3`, `:19-34`, `:62-69`, `:97-107`, `:187-193`, `:239-246` | Owner-gated. L0B freeze absent; later stages not admitted. Narrow L0A historical/repair receipts exist. |
| Narrow BTE execution receipt | `.../work-pack/session-evidence/SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/execution-receipt.json#/validation` | Historical receipt records 112/112 at that time, typecheck, document validation, byte controls, and publication verification. It explicitly has `production_authorized: false`. Current full suite has since grown to 240 tests, so old counts must not be reused as current totals. |
| Architecture realization compiler | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-003.json#/catalogue`, `#/negative_controls`, `#/claim_ceiling`, `#/residue`, `#/validation/0` | One independently owned candidate-local Enum member-bijection catalogue; one obligation; same-key semantic drift killed. Later source-emission, compilation, evaluation, mutation, and replay phases remain unexecuted. |
| Implementation-conformance design | `projects/domainspec-v2/development/implementation-conformance/README.md:3-4`, `:26-28` | Design-stage package. It explicitly contains no product code, executed fixture, deployment, release, or production-readiness proof. |
| Candidate ontology evaluator | `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/VALIDATION-REPORT.md:5-7`, `:31`, `:38-41`, `:63-65`, `:110`, `:122` | Live evaluator passed over supplied fixtures and correctly produced expected failures. Observations are hand-authored fixture facts; no real-language source adapter was executed. Authority effect is none. |
| Browser/canvas evidence | `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-012-REFRESH-RECEIPT.json#/validation`, `#/releaseAuthorized`, `#/productionAuthorized` | Historical local browser-mode passes exist. Receipt explicitly denies release and production authorization. This action did not independently replay browser evidence. |
| Governance attestation | `projects/domainspec-v2/authority/attestations/2026-07-12-governance-kinds-l1/verification-receipt.json#/result`, `#/controls`, `#/actor_binding`, `#/l2_external_signature` | L1 deterministic integrity passes and tampered manifest is rejected. Actor binding is role metadata only; L2 external identity, custody/signing, bad-signature, and unknown-actor proof are blocked. |
| General agent satisfaction | `projects/domainspec-v2/development/agent-spec-conformance/DESIGN.md:4`, `:22-73` | Candidate design and three-witness falsification plan, not an implemented general conformance runtime. |
| First production release | `projects/domainspec-v2/development/first-production-release/ROADMAP.md:3`, `:52`, `:67-75`, `:146`, `:159-161` | Production unauthorized. FPR-07 and FPR-08 partial/false-green; FPR-09, FPR-12, and FPR-13 absent; FPR-15 unauthorized. |

### Validation executed in this action

1. Current engine suite:

   `npm --prefix projects/domainspec-v2/impl run engine:test`

   Result: pass. Vitest reported exactly 29 passed files and 240 passed tests.

2. Current TypeScript check:

   `npm --prefix projects/domainspec-v2/impl run typecheck`

   Result: pass, `tsc --noEmit`.

3. L1 attestation positive:

   From `projects/domainspec-v2/authority/attestations/2026-07-12-governance-kinds-l1`:

   `python3 verify_manifest.py manifest.json`

   Result: valid seal and two source bindings verified.

4. L1 attestation negative:

   `python3 verify_manifest.py controls/manifest.content-mutated.json`

   Result: rejected with `seal_verdict: tampered` and `sources_ok: false`, as required.

5. Architecture obligation positive plus negative self-test:

   `node projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue.mjs --catalogue projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json --self-test`

   Result: positive pass, one obligation, zero positive diagnostics; mutant killed with `ARCH_OBLIGATION_PAYLOAD_STALE`; authority effect none.

6. Candidate ontology evaluator:

   `node --check projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`

   `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`

   Result: pass. Live output included four profiles, exact expected TypeScript findings, Enum positive/negative matrices, composition negatives, provenance/blocker controls, and authority non-collapse checks. The principal example’s `fail` verdict is an expected detection, not a suite failure.

### Exact-binding paper-claim matrix

| Paper claim | Binding | Proof status | Public-safe wording | Killed wording / missing evidence |
|---|---|---|---|---|
| Deterministic derivation | Engine README selectors above; current 240-test run; `src/roundtrip/negative-control.test.ts`; `src/emit/tests.test.ts` | `executed`, bounded | “A deterministic, network-free structural derivation engine compiles supported specification documents into byte-stable obligations and emitted test artifacts.” | Kill “DomainSpec deterministically derives all semantically complete tests.” Missing: full semantic denominator, behavioral inference coverage, and end-to-end admitted profile proof. |
| Test generation | `src/emit/tests.test.ts`; `src/index.test.ts`; live suite | `executed`, bounded | “Generated test artifacts are syntax-checked and exercised for supported fixtures.” | Kill “Generated tests prove the implementation.” The roadmap states generated tests are programs, not execution evidence or their own oracle. |
| Metric generation | No independent general metric-generation receipt found in the required executable families | `unverified` | At most: “Some evaluators emit bounded counts and findings for declared fixture matrices.” | Kill “DomainSpec automatically generates comprehensive quality metrics.” Missing: metric definition authority, denominator, independent recomputation, and acceptance binding. |
| Traceability | Engine receipt accounting; architecture catalogue keys/digests; SWU-ARE-003 material and predecessor bindings | `observed` and partially `executed` | “Selected artifacts carry source anchors, stable keys, digests, and receipt references that support bounded traceability.” | Kill “Every requirement is end-to-end traceable through code, execution, mutation, and release.” Missing: admitted complete graph and FPR-09 join. |
| Self-application | `src/minted-project/conformance.test.ts` executes a bounded minted-project fixture and receipt mutation invalidation | `executed`, fixture-local | “A bounded minted-project fixture exercises the engine’s own project contract and non-admission receipt behavior.” | Kill “DomainSpec fully specifies, generates, and proves itself.” The fixture is not universal self-hosting or production evidence. |
| Mutation results | `src/roundtrip/negative-control.test.ts`; minted-project mutation tests; SWU-ARE-003 `#/negative_controls`; attestation tamper control | `executed`, selected controls | “Targeted mutations are rejected in several bounded engine, catalogue, receipt, and integrity controls.” | Kill “Every obligation has a killed mutation.” FPR-07 remains partial/false-green and per-key mutation completeness is absent. |
| Counts/completeness | Current suite: 29 files/240 tests; architecture catalogue: one obligation; ontology live output supplies exact fixture-local matrices | `executed`, local denominators only | Always publish counts with date, command, and denominator: “240 tests across 29 files passed in the current private implementation checkout.” | Kill reused historical “112/112” as current completeness, and kill any relationship/profile/universe count not freshly bound to its owner. Passing test count is not obligation completeness. |
| Architecture conformance | SWU-ARE-003 receipt plus candidate ontology validator | `executed`, candidate fixture only | “A candidate evaluator and one independent architecture-obligation catalogue discriminate selected Enum and TypeScript fixture violations.” | Kill “DomainSpec proves implementation architecture conformance.” Missing real source projection/adapters, later ARE phases, complete architecture catalogue, replay, and conformance join. |
| Production validation | Roadmap `:3`, `:67-75`, `:159-161` | `killed` by owner status | “Production validation remains a gated roadmap target.” | Kill “Validated in production,” “production-ready,” or “first production release completed.” |
| Replication/reproducibility | Narrow deterministic reruns and digest-bound receipts exist; FPR-12 absent and FPR-13 absent | `deferred` | “Selected component results are locally reproducible from pinned commands and fixtures.” | Kill “A complete replication package is available” or “independently replicated.” Missing clean candidate, seeded-red CI, independent operator replay, support/rollback proof, and immutable release. |
| General agent/spec satisfaction | `agent-spec-conformance/DESIGN.md` candidate design | `unverified` / design only | “A candidate design defines how future bounded agent-action conformance witnesses could be evaluated.” | Kill “Agents satisfying a DomainSpec are generally guaranteed to conform.” No implemented general runtime, multi-domain executed witnesses, or generality proof. |
| Release authorization | Roadmap FPR-15 and browser/BTE receipts | `killed` by explicit false/unauthorized fields | “No release or production authorization has been granted.” | Kill any shipped, released, deployed, or externally authorized wording. |

### Aggregate, omission, fixture, replay, and false-green distinctions

- The 240-test engine command is an aggregate over the engine workspace only. It does not execute the complete repository, FPR roadmap, independent release replay, real provider integration, or production pilot.
- BTE scripts named `verify:bte:*` are an implemented command surface, but the lifecycle plan says the independent L0B red-fixture freeze is absent and L0B–L8 remain gated. A passing component test with the same functional name is not the planned immutable receipt chain.
- The candidate ontology’s expected `fail` result is a positive negative-control witness. Its observed facts are hand-authored fixtures, not extracted real code.
- The architecture catalogue self-test proves a same-key payload mutation is discriminated for one obligation; it does not prove catalogue breadth.
- Historical browser receipts prove local modes against their recorded artifacts. They are not independent replay in this action, accessibility acceptance, representative usability, deployment, or production proof.
- L1 attestation integrity is not identity authentication or external signature proof.
- Terms such as “production conformance” inside test-suite descriptions are test labels, not production authorization. The authoritative roadmap and receipts explicitly deny that elevation.

### Public/private safety

Public wording should describe evidence abstractly: “private implementation checkout,” “supported fixtures,” “component test suite,” “candidate evaluator,” and “digest-bound local receipt.” Do not publish private paths, internal rule tables, rule source, proprietary conformance-core details, authority-spine prose, or private release mechanics. No private engine rule implementation was included in this report.

## Validation summary

Pass:

- current engine suite: 29/29 files, 240/240 tests;
- TypeScript typecheck;
- attestation positive verification;
- attestation tampered-manifest rejection;
- one-obligation architecture catalogue positive and discriminating mutant;
- candidate ontology/evaluator fixture matrix.

No write was performed. No file, Git state, ledger, Inventory, telemetry, or external system was mutated.

## Residue

- Target-local Inventory remains unavailable; root Inventory was used only as a discovery packet and not as proof.
- The first combined shell validation attempt used the architecture validator without its required `--catalogue` flag and exited with `ARCH_OBLIGATION_CATALOGUE_ARGUMENT_MISSING` after the engine, typecheck, and attestation checks had passed. The exact documented invocation was then rerun and passed with `--self-test`; this invocation error is not a product failure.
- Full BTE L0B–L8 execution, fresh independent replay, complete required-check aggregates, real-source implementation projection, FPR-09 conformance join, clean release candidate, `14/14` pilot, external authorization, and immutable release evidence remain missing.
- No live browser replay was performed in this action; browser claims remain historical receipt observations.
- No evidence supports general semantic satisfiability, arbitrary application generation, comprehensive metric generation, universal self-application, general agent satisfaction, production validation, or release readiness.

<a id="explorer-return-3-ashby-public-paper"></a>

## Ashby — public paper and precedent

action_id=spawn-0003  
agent_id=/root/paper_explorer_ashby  
dispatch_id=2026-08-07-domainspec-v2-paper-evidence-refresh  
role=explorer-ashby  
status=pass

## Bounded research report

### 1. Scope and source-family enumeration

The audit covered the public claim surface in `arcanum/docs/paper.html` against these root-wide source families:

1. **Public Arcanum source and deployment**
   - `arcanum/README.md`
   - `arcanum/docs/README.md`
   - `arcanum/docs/paper.html`
   - `arcanum/LICENSE`
   - `arcanum/.github/workflows/pages.yml`
   - Arcanum Git history and remote metadata
   - Public repository: https://github.com/cyberAlchemyAI/Arcanum

2. **Frozen implementation and operational evidence**
   - `implementation/domainspec/tools/test-derivation-engine/`
   - `implementation/domainspec/docs/research/results/E3-results.md`
   - `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`
   - `implementation/domainspec/development/first-production-release/ROADMAP.md`
   - implementation-side dispatch telemetry and receipts

3. **Research packages**
   - `research/projects/domainspec/experiments/`
   - `research/shared/standards/EXPERIMENT-BOUNDARIES.md`
   - `research/smt-fol-test-derivation/DISTILLED-KNOWLEDGE.md`
   - E6, E9, and E11 datasets/protocols/results
   - current dispatch Inventory packet, used only as a discovery seed

4. **Architecture/unification material**
   - `projects/framework-unification/CONCEPT-MAP.md`
   - related source-map and lifecycle research under `ops/`
   - public Arcanum registries, runtime, observability, dispatch, and experiment-harness material

5. **Formalization and theory-boundary evidence**
   - `domainspec-lean-formalization/EPISTEMIC-POSITION.md`
   - `domainspec-lean-formalization/OPEN-SORRIES.md`
   - `domainspec-lean-formalization/ROOT-CONTRADICTIONS.md`
   - `domainspec-lean-formalization/STRONG-UNIFICATION-STATUS.md`
   - `domainspec-lean-formalization/docs/paper-companion.md`

6. **CyberAlchemy-v2 supporting precedent**
   - Consulted only for private/public and authority-boundary checking. It cannot be cited or paraphrased into public prose as shipped DomainSpec/Arcanum functionality.

7. **External primary literature and live publication facts**
   - Shannon, Ashby, Conant–Ashby, Miller, current arXiv records, and the public GitHub repository/license.

The target consumer Inventory is unavailable. Root Inventory passed projection validation but remains a non-authoritative, dirty read model. No Inventory absence or miss was treated as precedent-clean.

---

## 2. Executive verdict

The paper is defensible only as an **architecture/position paper with bounded pilot and corpus evidence**. It is not defensible as a generally validated empirical paper, a production-release report, or a complete replication package.

The most urgent public repairs are:

- Remove “open-source” and use the repository’s actual licensing term: **source-available for noncommercial use**.
- Remove “production-validated” and “available as a replication package.”
- Rewrite the abstract and conclusion so C1, C3, and C4 are explicitly architectural hypotheses, not validated results.
- Remove the statement that typed ontologies “eliminate” the stochastic specification–implementation gap.
- Remove the purported derivation of a 6–7 layer optimum from Miller and Ashby.
- Rewrite Shannon, Ashby, Conant–Ashby, Gödel, and Beer mappings as analogies or design inspirations, never theorem-backed proofs of DomainSpec behavior.
- Label 445 tests / 146 metrics / 89 concepts as one author-controlled artifact tabulation, not an independent production validation.
- Add stable, clickable citations and artifact-bound replication instructions for any empirical number retained.
- Resolve the 25/29 ontology counts against the live authority before publication; root evidence warns that the relationship authority has already moved beyond older counts.
- Do not publish private repository paths, private engine code, product-specific internal names, or private authority prose.

---

## 3. Exact-binding public-claim audit

### A. Identity, availability, licensing, and deployment

| Paper selector | Verdict | Proof status and source | Required public-safe wording |
|---|---|---|---|
| `#abstract`, line 129: “DomainSpec is open-source and available as a replication package.” | **REMOVE / REWRITE** | **Observed contradiction.** The public repository exists, but `arcanum/README.md` License section and public GitHub lines 435–441 identify PolyForm Noncommercial 1.0.0 and explicitly prohibit commercial use without permission. That is source-available, not open source under the OSI meaning. No bounded replication manifest is linked. Public repo checked 2026-08-07: https://github.com/cyberAlchemyAI/Arcanum | “The public Arcanum framework is source-available for noncommercial use. The evidence package described here is not yet a complete independent replication package.” |
| `#s9 §9.6`, line 789: “open-source, production-validated, and available as a replication package” | **REMOVE** | **Observed contradiction / unverified.** The release research says no unqualified production designation is authorized. GitHub shows a public repository, but no release or package evidence was shown on the repository page. | “A public, noncommercial source-available Arcanum repository exists. DomainSpec’s broader production and replication claims remain unvalidated.” |
| `#appendix §A.2`: “free, open reference path” | **REWRITE** | **Observed contradiction.** Noncommercial source availability is not equivalent to open source and may not be “free” for every intended use. | “public noncommercial reference path” |
| Hero and footer authors: “Vladimir Rondelli · Victor Boscaro” | **KEEP only after explicit authorship attestation** | **Partially observed.** Git history attributes the paper commits to Vladimir Rondelli and a copyright commit names both authors. That verifies repository attribution, not Victor Boscaro’s scholarly authorship consent or contribution statement. | Retain names only with an author-approved contribution and responsibility statement; add ORCID or stable identity links if available. |
| “The paper of CyberAlchemy” and links to `saturn.html` | **REWRITE / boundary review** | **Privacy-risk high.** Public Arcanum may describe its own framework. Private DomainSpec/Saturn architecture must not be presented as shipped public components. | Keep the public paper centered on Arcanum-visible artifacts; describe other pillars only as conceptual context if explicitly cleared for publication. |

### B. Contribution and validation claims

| Paper selector | Verdict | Evidence | Public-safe wording |
|---|---|---|---|
| `#abstract`: “We validate DomainSpec on a production system…” | **REWRITE** | **Observed bounded tabulation, not independent validation.** `#s8 §8.1` itself concedes the figures are a direct artifact tabulation, not a separately analyzed replicated experiment. | “We report an author-controlled case-study tabulation from one operational codebase…” |
| `#abstract`: “Results show that typed ontologies eliminate the stochastic gap…” | **REMOVE** | **Unsupported general causal result.** The paper later says E1, E4/E5, and E10 remain unrun, and construct validity says the derivation function itself remains incompletely tested. | “The architecture is designed to reduce nondeterminism by placing deterministic checks around selected derivation steps.” |
| `#s1`, line 179: validates “all four contributions” using 445/146/89 | **REWRITE** | **Overgeneralization.** Case-study counts can evidence artifact generation and traceability only; they cannot validate governance attenuation or self-governance. | “The case study illustrates C2-style derivation and traceability on one system; it does not validate C1, C3, or C4 empirically.” |
| `#s9 §9.4`: only C2 has partial empirical support; C1/C3/C4 architectural | **KEEP and move earlier** | **Consistent with evidence boundary.** This is the paper’s most accurate status statement. | Put this limitation in the abstract and contribution list, not only late in discussion. |
| `#appendix §A.1`: deterministic engine, byte stability, refusal/gap behavior | **KEEP narrowly, with artifact binding** | **Observed implementation support.** Engine source and tests contain explicit byte-stability, containment, honesty, and negative-control logic. However the public paper does not supply immutable receipt hashes or a public rerun command. | “A private deterministic backend-domain prototype passed a bounded internal validation; implementation details are not public and the result is not independently replicated.” |
| `#appendix §A.1`: “95 tests, 0 type errors” | **REWRITE unless exact receipt is linked** | **Unverified as a current statement in this lane.** Source tests exist, but a dated immutable execution receipt was not bound in the paper. Counts drift as code evolves. | Include dated commit, command, environment, exit status, and receipt digest, or omit the number. |
| `#appendix §A.1`: mutation 38.75%→54.37%, 17.2%→36.56%, 13/13 | **KEEP narrowly** | **Observed in internal E3 result chain** (`implementation/domainspec/docs/research/results/E3-results.md`, also summarized by `research/smt-fol-test-derivation/DISTILLED-KNOWLEDGE.md:57`). It is a single-feature pilot. | “In one author-run pilot, mutation score changed from 38.75% to 54.37% after formalizing an omitted rule; this is not corpus-level evidence.” |
| `#appendix §A.1`: “zero human variance” | **REMOVE** | **Not established.** Byte-identical deterministic execution does not show zero human variance in specification authoring, binding selection, oracle construction, or adjudication. | “zero generator variance for fixed admitted inputs” |
| `#appendix §A.1`: self-application “a fixpoint” | **REWRITE** | **Terminology exceeds evidence.** Deriving obligations from its own specification is self-application. A mathematical fixpoint requires equality/equivalence under a defined operator. | “The prototype was applied to its own specification.” |
| `#appendix §A.3`: 58 dispatches, “each human-approved” | **REWRITE unless exact ledger slice is bound** | **Potentially observable but mutable.** A count without selector, cutoff, schema, and approval-field definition is not reproducible. Dispatch volume is operational evidence, not effectiveness evidence. | “A dated ledger snapshot records N governed dispatches; this demonstrates use of the workflow, not improvement in outcome quality.” |

### C. Case-study numbers

| Selector | Verdict | Evidence boundary |
|---|---|---|
| `#s8` Table 10: 89 concepts, 445 derived tests, 146 OTel metrics, 41 stories, 7/7 UI specs | **REWRITE / retain only with reproducible manifest** | Arithmetic is internally consistent, but no public artifact manifest binds every row to immutable source files and derivation outputs. “Derived Tests” should be “test obligations” unless executable test results are separately proved. “OTel Metrics” should be “metric obligations” unless instrumentation and emission are observed. |
| `#s8` “production poker team management system” | **REWRITE** | “Production” is unbound and risks disclosing a private product context. | “one author-controlled multi-feature application” |
| `#s8 §8.4` PASS/FLAG/BLOCK/PARTIAL counts | **REWRITE** | These are audit verdicts, not evidence of runtime correctness. The sentence “caught … before reaching production” needs a dated incident/audit receipt and deployment chronology. | “The repository-local audit classified one feature as blocked; this is planning/verification evidence, not deployment evidence.” |
| `#s8 §8.5` GenerateSettlement 23 tests + 22 metrics | **REWRITE or REMOVE** | The example exposes private product semantics and has no public immutable derivation trace. | Replace with a synthetic neutral example shipped in the public repository. |
| `#s9 §9.1` E6: 747 concepts, 670 relationships, 99.87%, 98.96% | **KEEP narrowly** | Primary local protocol rows exist at `research/projects/domainspec/experiments/E6-vocabulary-sufficiency/protocol.md:173-174`, and the standards index points to result artifacts. These are author-controlled classification results, not universal completeness. |
| `#s9 §9.2` E9: 94 edges, 74.5% strained/broken, then 100% modeled | **KEEP narrowly with circularity caveat adjacent** | The paper already acknowledges deterministic classification circularity later. “100% modeled coverage in the studied dataset” is acceptable; “system-level completeness” is not. |
| `#s9 §9.4` E11 reproducibility 1.0 | **KEEP narrowly** | JSONL run/rerun data exists, but the single-reviewer override blocks promotion. “Fixed-input repeatability in one bundle” is supportable. |

### D. Ontology, derivation, and completeness language

| Selector | Verdict | Reason |
|---|---|---|
| `#abstract`, `#s1`, `#s3`, `#s4`, `#s9`: “25 meta-types and 29 relationships” | **REVERIFY / likely rewrite** | The Inventory packet warns live authority now declares 31 signatures while older evidence uses 29/30. Do not publish a frozen count until the primary owner and version are bound. |
| `#s1 H1`: typed models are “necessary and sufficient” for comprehensive tests | **KEEP only as hypothesis** | Neither necessity nor sufficiency is proved. E6/E9 concern representational coverage; E3 is one mutation pilot. |
| `#s3`: L2 artifacts “are derived, not authored” | **REWRITE** | The actual system includes authored specifications, bindings, generators, implementation, and LLM paths. | “Selected L2 obligations can be generated from admitted L1 artifacts; other artifacts remain authored or assisted.” |
| `#s5`: deterministic derivation formulas | **KEEP as architectural definitions** | A formula defines a proposed calculus; it is not proof that implementation coverage is complete or semantics are sound. Label formal notation as specification-level, not theorem-level. |
| `#s9 §9.2`: “complete within feature boundaries” | **REMOVE** | E1 and broader derivation-correctness experiments remain open. Representability does not imply complete or fault-effective derivation. |
| `#s9 §9.3`: SMT could guarantee agents “will not hallucinate behaviors” | **REMOVE** | Even a sound proof about a closed formal model cannot guarantee an agent will not act outside it unless parsing, enforcement, runtime mediation, and model–reality correspondence are also proved. | “SMT checking could search for counterexamples within a defined logical model.” |

### E. Governance attenuation and theory mappings

| Selector | Verdict | Primary-source finding and repair |
|---|---|---|
| `#s6 §6.3`: Shannon capacity equation applied to governance | **REWRITE as analogy/modeling choice** | Shannon’s 1948 paper concerns communication channels with defined probabilistic/noise assumptions: https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf (1948; checked 2026-08-07). The paper does not justify identifying context attention with bandwidth or competing instructions with physical noise. No empirical parameterization is supplied. |
| `#s6 Corollary 1`: existence of `k*` where adding layers reduces total capacity | **REMOVE “Corollary”** | It does not follow from Shannon’s theorem without a specified function for B, S, and N versus layer count and assumptions proving the derivative sign. Call it “Hypothesis GA-1.” |
| `#s6 §6.4`: Miller implies `k*≈6–7`; LLMs have analogous limits | **REMOVE** | Miller’s 1956 article concerns human information-processing spans, not governance layers or LLM instruction following. Primary bibliographic identity: DOI https://doi.org/10.1037/h0043158, 1956. A dedicated LLM citation and experiment would be required. |
| `#s6 §6.4`: `log₂(54)≈5.75` means governance dimensions are sufficient | **REMOVE** | Ashby’s requisite variety does not license adding counts of heterogeneous concept and edge labels, taking a logarithm, and concluding a controller-dimension optimum. Ashby states outcome variety can be reduced only through corresponding regulator variety; see *An Introduction to Cybernetics*, §11/7–11/8: https://ashby.info/Ashby-Introduction-to-Cybernetics.pdf (1956; checked 2026-08-07). |
| `#s6 §6.2`: observer–executor conflation “violates” Good Regulator Theorem; executor cannot model itself | **REMOVE / REWRITE** | Conant–Ashby proves, under stated conditions, that a maximally successful and simple regulator must model the regulated system. It does not prove that an executor cannot also observe itself. Primary record: https://doi.org/10.1080/00207727008920220, received 1970-06-03, pp. 89–97. | “Observer separation is a design hypothesis inspired by model-based regulation.” |
| `#s6 §6.5`: Good Regulator theorem “proves” insufficient self-detection | **REMOVE** | Same category error; the projected 30–40% and 60% figures are explicitly unmeasured. Retain only as preregistered targets with a protocol link. |
| `#s6 §6.4`, `#s9 §9.1`: Gödel implies governance gaps or taxonomy incompleteness | **REMOVE** | Gödel’s incompleteness theorems apply to sufficiently expressive, consistent, effectively axiomatized formal systems capable of arithmetic. A Markdown taxonomy, governance workflow, or finite closed-world classifier does not inherit that conclusion by metaphor. |
| `#s3 §3.4`, C4: Hofstadter “strange loop” resolves infinite regress | **REWRITE as architectural metaphor** | A bounded feedback cycle may avoid implementation recursion, but the paper does not prove resolution of epistemic or authority regress. |
| `#s6 §6.7`: Beer “proved exactly five systems—no more, no fewer” | **REMOVE / REWRITE** | VSM literature presents five necessary/sufficient functional systems as Beer’s model/theoretical claim; it is not a mathematical proof that validates DomainSpec’s mapping. Use “Beer’s VSM distinguishes five interacting functions.” |
| `#s6` Table 8 statuses “Working / Under-performing / Formal” | **REWRITE** | These statuses require observable criteria and dated evidence. “Formal” is especially misleading where the object is prose rather than machine-checked formal semantics. |
| `#s6 §6.6`: Constitutional AI mirrors dual-agent observer protocol | **REWRITE** | Constitutional AI includes critique/revision and AI-feedback stages, but “one model generates and another evaluates” is not a stable defining claim and does not prove this intervention’s effect. |

### F. Related work, novelty, and citation repair

1. **Global novelty claim (`#s2 §2.8`) — rewrite.**  
   “No existing approach combines…” is a universal literature claim unsupported by a documented systematic search. Use:  
   “In the sources reviewed here, we did not identify a system with this exact combination; this is a scoped novelty position, not proof of absence.”

2. **DDD/MBT/BDD comparisons — narrow.**  
   Statements such as DDD “remains informal,” MBT says nothing about domain rules, or BDD has no derivation function overgeneralize broad fields. Describe the specific cited sources and the paper’s selected comparison dimensions.

3. **Formal methods accessibility — rewrite.**  
   “Impractical for typical business domains” is an empirical usability claim without evidence. Use “often requires specialized expertise and separate implementation-conformance work.”

4. **Agent systems “none address specification governance” — remove.**  
   VeriGuard itself provides formal safety-policy synthesis and runtime checking, contradicting the categorical absence claim. Primary arXiv record: https://arxiv.org/abs/2510.05156, submitted 2025-10-03.

5. **Reference [13] is real but inaccurately framed.**  
   https://arxiv.org/abs/2510.23350, submitted 2025-10-27, evaluates LLM-generated test cases for validating Alloy specifications from natural-language requirements. It is not simply “combining Alloy with LLMs to lower the barrier” in the broad sense claimed.

6. **References need resolvable identifiers.**
   - Add DOI/URLs and access/version dates for online material.
   - Add publisher/version URLs for MOF and ISO 42010.
   - Give exact title/version/URL for Devin, Copilot Workspace, ADLC/Agentic Manifesto, and Domain-Code-Mapping.
   - Reference [22] currently looks like self-authored prior work and needs repository URL, immutable commit, license, and relationship/conflict disclosure.
   - Add an actual Gödel reference if Gödel remains mentioned, though the current applications should be deleted.
   - Avoid citing Hofstadter as if it proves a governance property.

7. **Formalization is precedent and a warning, not support for this paper’s broad claims.**  
   The Lean repository explicitly distinguishes positions from theorems, contains open proof obligations, and documents claim-over-proof corrections. Its strongest lesson for the public paper is to label metaphor, position, theorem, experiment, and deployment separately.

---

## 4. Architecture position versus empirical result

### Defensible as architecture or position

- A layered L0–L7 conceptual organization.
- A dual business/operational projection.
- A typed-graph representation and derivation-function specification.
- Observer/executor separation, deterministic detectors, and pruning as proposed interventions.
- A bounded feedback loop as a governance design.
- A VSM-inspired mapping.
- A claim that the architecture aims to make evidence and ownership traceable.

These should use “defines,” “proposes,” “models,” “is inspired by,” or “predicts.”

### Defensible as bounded empirical evidence

- E6 classification rates, with author-controlled corpus and residue.
- E9 studied-dataset composition coverage, with circularity caveat.
- E11 fixed-input run/rerun repeatability, with single-reviewer override.
- One mutation-testing pilot and its exact score changes.
- Repository-local implementation/test evidence where pinned to a dated commit and immutable receipt.
- A case-study artifact count, if renamed as tabulated obligations and published with a reproducible manifest.

These should use “observed in one run/corpus/pilot,” “tabulated,” or “partially supports.”

### Not currently defensible as empirical result

- General elimination of stochastic gaps.
- Complete test derivation.
- Formal governance-attenuation bounds.
- `k*≈6–7`.
- Restoration/inversion of governance fidelity.
- Resolution of infinite regress.
- General agent decision improvement.
- Production validation or release readiness.
- Independent replication.
- Universal vocabulary sufficiency.
- General zero human variance.
- Guarantee that agents will not hallucinate.
- “Exactly five systems” as a proof of the DomainSpec architecture.

---

## 5. Public/private risk

High-risk material currently includes:

- Private product domain and operation names in the case study.
- Claims about a private optimized derivation engine without a public evidence package.
- Language that collapses public Arcanum into private DomainSpec/Saturn as if all three were shipped.
- Internal agent, skill, pipeline, and authority counts that can drift and may expose private architecture assumptions.
- Proposed public prose citing private paths or internal repository organization.
- “Open framework, closed algorithm” language combined with “replication package,” which is internally inconsistent unless the replication target is explicitly limited to public artifacts.

Recommended boundary:

> “Arcanum is the public, noncommercial source-available capability framework. The paper also discusses a broader architecture and a private backend-domain prototype. Prototype measurements are reported as bounded internal evidence; they do not establish public implementation availability, production release, or independent replicability.”

No private paths should appear in the public paper or its bibliography. Public claims should cite public immutable artifacts or describe internal evidence abstractly with an explicit non-replication caveat.

---

## 6. Unresolved exact-binding gaps

1. No immutable public manifest binds the 7-feature case-study counts to source artifacts and generated outputs.
2. No current primary-authority binding establishes whether the ontology count is 29, 30, or 31 relationship signatures.
3. No dated public receipt supports “95 tests, 0 type errors.”
4. No public replication script, environment lock, expected outputs, or checksums substantiate “replication package.”
5. No production designation, release tag, deployment record, SLO evidence, or operational acceptance record supports “production-validated.”
6. No systematic-review protocol supports the universal novelty claim.
7. No empirical attenuation dataset supports C3, the projected rates, or a critical layer count.
8. No theorem supports the Shannon→governance derivative, Ashby→5.75 dimensions, Miller→6–7 layers, Gödel→governance gaps, or Beer→DomainSpec completeness mappings.
9. Victor Boscaro’s authorship consent/contribution was not independently bound; repository attribution alone is insufficient.
10. Current public GitHub availability was observed, but the GitHub Pages paper URL could not be independently opened through the web tool in this run. Local `docs/README.md` and the Pages workflow establish publication intent, not successful current deployment.
11. Current Arcanum working tree is dirty. Local bytes should not be equated with the deployed `main` bytes without commit/hash comparison.
12. The Inventory target gap remains: there is no active consumer-local Inventory for the named target repository.

---

## Validation summary

- Persisted action, targeted agent prompt, Inventory packet, research owner, and complete claim-bearing public paper sections were read.
- Named root-wide source families were enumerated and selectively checked.
- Public Arcanum repository visibility and license status were verified on 2026-08-07.
- Primary external sources were checked for Shannon (1948), Ashby (1956), Conant–Ashby (1970), Miller (1956), and the two 2025 arXiv references.
- Local mutation, E6/E9/E11, deployment-status, formalization, observability, and architecture evidence was cross-checked read-only.
- No files, Git state, telemetry, ledger, receipts, or external systems were mutated.

## Residue

The paper can be repaired into a credible public architecture paper, but publication-quality empirical and replication claims remain blocked on immutable public evidence bindings. The strongest immediate posture is: **architectural contribution plus bounded author-run evidence, with C1/C3/C4 explicitly provisional and C2 only partially supported.**
