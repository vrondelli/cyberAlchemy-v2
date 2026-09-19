# Findings — a holistic DomainSpec definition Atlas

Status: **candidate research blueprint / authority effect: none**  
Evidence closure: **ready**, dispatch sheet SHA-256 `9c4bf67dd71a196827405de96676aac78798dce7bee46b0cd9326491311bfd59`  
Scope: repository-local explanation and presentation design; no ontology, definition, implementation, promotion, release, deployment, or production effect

## Plain-language answer

Across this repository, DomainSpec is best understood as a repository-local language for writing consumer-owned domain concepts and directed relationships, checking finite rules about their shape and allowed endpoints, and producing bounded generated representations and implementation checks. “Executable” means that rules can be derived and checked; it does not mean that DomainSpec is itself a running application. Its current mathematical ceiling is a typed composable graph fragment, not a proved category or universal compiler (`projects/domainspec-v2/definitions/DEFINITIONS.md:144-170,1003-1055`). Root definitions own the shared language, while each consumer project owns its concrete domain meaning; generated graphs and implementation projections do not take that ownership over (`projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md:42-53`; `projects/domainspec-v2/impl/spec/minted-project/INDEX.md:7-12`). This paragraph is an **explanatory summary of current sources**, not a new canonical definition or ID.

The current candidate canvas already explains an important part of that story: one selected source set can be normalized into a source-bound semantic read model and shown through multiple views without making the views authoritative. Its model distinguishes source records, projected records, presentation bridges, and digest-bound scene artifacts, and its bridges declare no authority effect (`projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs:35-49,70-80,98-148,216-249`). The Financial Settlement scene already follows a business promise toward obligations and makes partial or missing proof visible (`projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/financial-settlement-business-to-obligation.scene.json:1-6,84-125,188-266,315-358`). The Body War work already supplies a bounded, deterministic scene-and-portal interaction precedent, while explicitly refusing to turn a focus scene, spatial motion, or a completed tour into ontology truth or comprehension evidence (`projects/body-war/development/reviews/20260730-ontology-ui-black-box/findings.md:21-80`). These are **candidate or consumer-local explanatory projections**, not a repository-wide DomainSpec ontology.

A holistic Atlas must add the missing lifecycle without flattening it into “more boxes.” It should let a reader move from rules for authoring, through consumer-owned sources, admission and graph generation, derived checks and attempted code shapes, observed evidence, and finally gaps and independent owner decisions. At every step it must show who owns the record, what actually happened, what remains missing, and the strongest claim the evidence permits. The existing Financial Settlement and Body War guided scenes should remain portals into that larger map, reused by reference rather than copied into generic DomainSpec meaning.

## 1. Enumerated source-family census

“Holistic” means bounded coverage of the following enumerated families and visible gaps. It does not mean they have one settled owner or form one universal lifecycle.

1. **Current, repository-local authority.** `projects/domainspec-v2/authority/AUTHORITY-MODEL.md:14-17,47-64` and `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md:42-94,136-169` own local structure, validation, drift, default-deny boundaries, and independent status axes. They do not supply external admission or production authorization.
2. **Current definition authority.** `projects/domainspec-v2/definitions/DEFINITIONS.md:144-218,220-379,1003-1055` owns the typed-graph, authoring/contract, meta-type, formation, relationship, and composability vocabulary. It does not prove runtime behavior.
3. **Current and staged meta-types.** `projects/domainspec-v2/definitions/meta-types/meta-types.md:6-52` and `meta-types.yml:8-41,45-278` own the DS-D1 identities and their active, candidate, deferred, or superseded states: thirteen backend kinds are active; UI labels remain candidate or deferred; Saga is superseded.
4. **Current relationship authority.** `projects/domainspec-v2/definitions/relationships/relationships.md:1-98,125-157` and `relationships.yml:517-546` own DS-D2 verbs, DS-D8 endpoint signatures, and generated/deferred/deprecated policy distinctions. There are 31 active signatures; endpoint legality is not behavioral proof.
5. **Current formation specifications.** `projects/domainspec-v2/definitions/DEFINITIONS.md:301-337` and `projects/domainspec-v2/impl/spec/meta-types/` own per-kind structural criteria. Passing them proves shape only.
6. **Experimental and development profiles.** `projects/domainspec-v2/impl/spec/minted-project/INDEX.md:14-28,47-54`, `supported-profiles.yml:1-67`, `ui-profile/profile.yml:1-6,15-132`, and `sfol-profile/profile.yml:1-12` own bounded support for named runs. Profile support is separate from kind status and formation validity; it does not define a universal profile.
7. **Consumer-local authored sources.** `projects/domainspec-v2/impl/spec/minted-project/node.schema.json:4-16,36` and `connection.schema.json:4-14` define the project-owned node record and its source-owned outgoing connections. They do not establish universal domain truth.
8. **Generated read models and provenance.** `projects/domainspec-v2/impl/spec/minted-project/graph.schema.json:4-23,39-54` and `INDEX.md:14-28,47-54` describe profile-scoped generated graphs and bindings to exact source/profile inputs. Generated representation is not editable semantic authority.
9. **Implemented validators and structural derivation.** `projects/domainspec-v2/impl/tools/validate-content.ts`, `validate-relationships.ts`, and `validate-meta-types-noncollapse.ts`, together with `projects/domainspec-v2/impl/test-derivation-engine/src/README.md` and its reader/rules/residue/provenance/emitter modules, witness bounded structural checking and derivation. They do not prove obligation satisfaction or business correctness.
10. **BTE executable and planned evidence.** The BTE `WORK-PACK.md` selectors “Current State,” “L0 Output Contract,” and layer/gate tables, plus `EXECUTION-PACK.md` W1–W9, distinguish joined L0A contract publication from later development fixtures, replay, receipts, and owner-gated work. Later mechanisms do not silently promote L0B–L8.
11. **Candidate architecture-conformance experiment.** `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/README.md` selectors “Execution Model” and “Demonstrated Result,” and `VALIDATION-REPORT.md` selector “Claim Ceiling,” evaluate expected versus observed properties over supplied facts. The facts are hand-authored; this is not general live-source conformance.
12. **Candidate-local Enum realization evidence.** `projects/domainspec-v2/impl/architecture-conformance/realization/`, `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json`, `SWU-ARE-002.json`, `SWU-ARE-003.json`, and `runs/order-status-v1/proof-receipt.json` witness one direct TypeScript Enum realization, compile/observe/evaluate/mutate/replay shape. The working evidence is not a general compiler and lacks the expected governed SWU closeout join.
13. **Consumer-local Financial Settlement.** The scene selectors `obligation_read_model`, `full_obligation_status`, `receipt_status`, and `proof_boundary` in `financial-settlement-business-to-obligation.scene.json`, plus `financial-settlement-proof-lifecycle.ontology.json` selector `promise-to-proof`, show authored meaning, a generated graph, a derived obligation, partial checks, drift, and an absent receipt. No source-backed identity currently closes P4 to FS-POST-001.
14. **Consumer-local Body War.** `projects/body-war/proofs/suggested-track-ontology-domainspec/receipts/` and `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/body-war-suggested-track-lifecycle.scene.json` steps BW-01–BW-12 show hidden meta-type context, profile-local realization intent, passing and rejected receipts, stale-digest handling, `authority_effect:none`, and `release_admission:not-granted`.
15. **Owner-gated First Production Release.** `projects/domainspec-v2/development/first-production-release/ROADMAP.md:25,49,54-75,100,159-161` separately owns claim review, reproduction/conformance, pilot, external authorization, and release recording. Production remains unauthorized.
16. **Historical implementation and research.** `implementation/domainspec/` and `research/projects/domainspec/definitions/DEFINITIONS.md:1-22` supply precedent. The latter explicitly transfers wedge-term authority; neither overrides current v2.
17. **Formal research.** `domainspec-formalization/GLOSSARY.md:18-42,66-72,92-120`, `lean-formalization/M2Counter.lean:1-12,49-74`, `M6Counter.lean:103-108,143-200`, and `M6Restricted.lean:65-134` own exact formal terminology, counterexamples, and conditional results. They are optional formal evidence, not current compiler semantics.
18. **Candidate language design.** `projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:15-40,102-163,214-250` supplies contract/schema/iteration and maturity/promotion lenses. These are candidate interpretations, not current canonical vocabulary.
19. **Explanatory canvas and UI precedents.** `unified-canvas-model.mjs:35-80,98-148,216-249` and the Body War review `findings.md:21-80` supply non-authoritative projection, navigation, and interaction precedents.
20. **Inventory.** `strategy-inventory-packet.md`, especially “Non-Authority Notice,” is discovery and routing evidence only. It is intentionally not a load-bearing authority source.

## 2. Current definition and lifecycle model

The current semantic core has four owner-separated acts:

1. A consumer writes a node source containing an intent statement and outgoing connections (`node.schema.json:4-16,36`; `connection.schema.json:4-14`).
2. Current DS-D1, formation, profile, and DS-D8 owners answer different questions: whether the kind is admitted, whether the record has the required shape, whether the selected profile supports it, and whether an endpoint pair is legal (`definitions/DEFINITIONS.md:229-264,301-379`; `impl/spec/minted-project/INDEX.md:47-54`). None of those judgments implies the others.
3. A named minted source pack may be normalized into a generated, layout-neutral graph bound to source/profile/registry digests (`impl/spec/minted-project/graph.schema.json:4-23,39-54`). This is a read model, not a second authority.
4. Named mechanisms may derive structural checks or attempt bounded code realization. Generation, compilation, observation, evaluation, mutation, replay, and receipt issuance remain distinct events; a technical receipt cannot accept its own claim or authorize release (`development/first-production-release/ROADMAP.md:25,75,159-161`).

The lifecycle after evidence is deliberately not automatic. A finding may be routed to a named owner for investigation; a claim owner may then decide what evidence supports; independent conformance or a pilot may still be required; external owners must authorize exact bits and boundaries; and a release operator separately records the release. The local constitution also keeps source posture, evidence, confidence, authority effect, policy effect, implementation status, and lifecycle stage separate (`authority/constitutions/domainspec-v2-CONSTITUTION.md:136-169`). A single “green” status would erase these distinctions.

## 3. Minimum Atlas: six lifecycle views and one presentation layer

The six groupings below are **candidate presentation metadata**, not DomainSpec meta-types, lifecycle states, relationship verbs, or owner registries.

1. **Rules for what can be authored:** governance, current definitions, kind status, relationship verbs, endpoint signatures, and formation rules.
2. **Where a project writes its domain meaning:** project, feature, node source, intent field, and source-owned outgoing connections. Consumer meaning remains local.
3. **Checks before and during graph generation:** co-locate—but do not merge—kind status, formation validity, selected-profile support, source validation, generated graph, and digest provenance.
4. **Checks derived and code shapes attempted:** co-locate structural-check derivation, architecture profile selection, exact Enum realization inputs, generated code, and known missing bindings while preserving their owners.
5. **What ran and what evidence exists:** show generation, compilation, execution, observation, evaluation, mutation, replay, and receipt as separately inspectable states.
6. **Problems found and decisions still required:** show drift, missing task closeout, claim acceptance, conformance, pilot, external authorization, and release recording without inventing a lifecycle controller.

The separate **Views and guided examples** layer owns overview layout, detail drawers, filters, gap annotations, and the Financial Settlement and Body War portals. It must carry `authority_effect:none`, reference owner-issued identities through collision-safe projection-local IDs, and never rewrite source statuses (`unified-canvas-model.mjs:35-49,70-80,98-148,216-249`).

### Owner-preserving displayed connections

Cross-family lines should be ordinary-language annotations over exact mechanisms, not new DS-D2 verbs. Examples include “this source node declares this outgoing connection,” “this selected profile supports this kind,” “this endpoint signature accepts this pair,” “this minted pack compiles to this generated graph,” “this derivation run produced these structural checks,” and “this adapter observed this artifact.” Where there is no owner-issued identity, the Atlas must display an absence record: for example, “no source-backed identity links P4 to FS-POST-001,” never an invented `semantic-origin-of?` relation. These boundaries follow the source record, graph, formation, profile, and endpoint contracts (`connection.schema.json:4-14`; `graph.schema.json:4-23,39-54`; `DEFINITIONS.md:301-379`; `INDEX.md:47-54`).

### Feedback overlays

The Atlas may overlay, but must not claim to implement, these separately owned paths:

- **Source correction:** a named validation failure points back to the exact source, relationship, formation, or profile owner; it does not mutate the source.
- **Implementation drift:** Financial Settlement’s `drift.P4-optional-event-handler` points toward investigation while preserving prior evidence (`financial-settlement-proof-lifecycle.ontology.json`, selector `drift.P4-optional-event-handler`).
- **Causal proof:** Financial Settlement remains partial/planned; Body War has bounded rejected mutations but no general architecture evaluator.
- **Evidence staleness:** Body War’s stale ontology digest must yield `BRIDGE_STALE_ONTOLOGY_DIGEST`, remove current-validity styling, and leave the stale receipt inspectable (`projects/body-war/proofs/suggested-track-ontology-domainspec/receipts/`).
- **Lifecycle closure:** receipt, claim decision, independent reproduction/conformance/pilot, external authorization, and release record are separate gates (`development/first-production-release/ROADMAP.md:25,49,54-75,100,159-161`).
- **Presentation interaction:** selection and route state are presentation invariants only.

## 4. Candidate projection legend

This legend is a **candidate display mapping**. It does not create a universal status registry, and owner-native values must remain visible verbatim.

| Display dimension | Minimum meaning |
|---|---|
| Artifact kind | Exact source-native kind: source, generated graph/check, observation, evaluation, receipt, decision, or other named kind |
| Owner-native status | Verbatim status from the owning artifact |
| Source posture | Constitutional or source-owned posture, where present |
| Definition status | Active, candidate, deferred, superseded, or deprecated; never “generated” |
| Formation validity | Pass, fail, not run, or not applicable for the named shape rule |
| Profile support | Supported, unsupported, or not evaluated for the exact selected profile |
| Implementation status | Constitutional or owner-native implementation state |
| Execution verdict | Exact owner verdict, or not run/pass/fail/skipped where applicable |
| Evidence status/class | Whether evidence exists and which mechanism produced it |
| Confidence status | Owner-issued constitutional axis; not presentation confidence |
| Authority and policy effect | Preserved owner-issued values; `none` cannot promote |
| Lifecycle stage | Preserved owner-native or constitutional stage |
| Release admission | Preserved owner value; never inferred |
| Binding status | Projection-only direct, indirect, missing, contested, or stale, with rationale |
| Claim ceiling | One testable sentence giving the strongest supported claim |

The legend must visually distinguish owner-issued semantic relations, source containment, generated/provenance links, observed execution, presentation correspondences, missing or stale bindings, and independent gates. Color alone cannot encode these differences (`authority/constitutions/domainspec-v2-CONSTITUTION.md:136-169`).

## 5. Minimum conditional node-detail contract

Every displayed item needs: a collision-safe presentation ID and ordinary label; owner-issued identity and exact path/selector; artifact kind, owner, project/profile scope, and native status; the relevant separate definition/formation/profile judgments; relevant implementation, execution, evidence, authority, lifecycle, and release values; owner-issued relations or explicitly labeled presentation annotations; binding status and gaps; and one claim ceiling.

Only applicable details should appear:

- A **receipt** shows exact inputs, procedure, verdict, scope, lifecycle join, authority effect, and release admission.
- A **generated artifact** shows source/profile/registry digests and generation identity.
- A **formal artifact** names the exact proposition and whether it is proved, refuted, conditional, assumed, open, or contains `sorry` (`domainspec-formalization/GLOSSARY.md:92-120`; the cited M2/M6 Lean selectors).
- A **drift record** shows the observed mismatch, preserved prior evidence, finding owner, and suggested next owner.
- A **mutation/replay record** names the mutant or raw input, expected diagnostic, process boundary, and exact result.

The contract is conditional precisely to avoid empty universal fields or a second, invented repository schema.

## 6. Overview, detail, and route placement

| Content | Overview | Detail | Guided route |
|---|---|---|---|
| Explanatory DomainSpec summary | Plain-language orientation, marked explanatory | Exact owner citations | Newcomer opening |
| Six lifecycle groupings | View-only map | Owner-separated contents | Financial Settlement and Body War lifecycle paths |
| DS-D1, formation, and profile | Three separate badges | Registry, criterion, and exact profile | Body War hidden-kind and TypeScript-local steps |
| DS-D2 and DS-D8 | Relationship summary | Exact signature and direction | Concrete authored connection |
| Authored versus generated | Visible plane boundary | Digests and provenance | Financial Settlement graph transition |
| Derivation and realization | Structural versus bounded/candidate | Exact check keys and Enum files | Financial Settlement obligation; Body War stops before absent generation |
| Generated/run/observed/evaluated/receipt | Separate states | Exact artifacts and ceilings | Both evidence routes |
| Drift and owner gates | Persistent boundary rail | Finding, decision owner, and missing gate | Financial Settlement drift; Body War non-promotion |
| Consumer scenes | Portal only | Consumer-local source | Reused by reference, never cloned |
| Formal and contract/schema/iteration material | Omitted from minimum | Optional, explicitly formal/candidate | Deferred |
| Accessibility and entry/return behavior | Not lifecycle evidence | Separate future validation contract | Deferred pending Atlas-specific fixtures |

## 7. Existing semantic guided routes

### Financial Settlement

The Atlas should preserve the existing consumer-local journey: “pay once, never twice”; authored project/feature sources; generated graph as a separate plane; candidate P4 clause; derived catalogue including FS-POST-001; a red broken P4-to-FS-POST-001 identity gap; candidate architecture contracts and handwritten implementation; generated pure checks; the full check skipped or unbound; the exact expected-red bounded verifier (52 total, 51 pass, one declared red, zero skipped/todo); a planned missing-event negative control; no FS-specific complete mutation/replay proof; `receipt_status:not-issued`; `drift.P4-optional-event-handler`; and blocked independent owner decisions (`financial-settlement-business-to-obligation.scene.json:1-6,84-125,188-266,315-358`; `financial-settlement-proof-lifecycle.ontology.json`, selectors `promise-to-proof` and `drift.P4-optional-event-handler`). The causal-proof overlay is **candidate and partial/planned**. Completing the scene does not close proof or release.

### Body War

The Atlas should preserve BW-01–BW-12: feature-owned five-value `SuggestedTrackStatus` meaning; hidden current DS-D1.3 Enum context; missing complete admitted DomainSpec Enum definition; TypeScript-specific profile selection; proposed realization; illustrative/target code not generated by an absent Body War pipeline; existing consumer-local checks and receipts; rejected stronger-claim and stale-digest cases; no complete architecture evaluator/generator chain; `authority_effect:none`; `release_admission:not-granted`; and a stop at owner/release gates (`projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/body-war-suggested-track-lifecycle.scene.json`, BW-01–BW-12; `projects/body-war/proofs/suggested-track-ontology-domainspec/receipts/`). The external `order-status-v1` direct TypeScript Enum run is **comparable candidate-local evidence**, not a Body War step (`projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/proof-receipt.json`).

### Ten required negative controls

1. Hide DS-D1.3 in Body War BW-01: reject because local vocabulary can no longer be distinguished from an admitted Enum kind.
2. Relabel proposed Body War generation/evaluation as current: reject because the admitted definition and applied pipeline are absent.
3. Relabel a generated check as executed/passed: reject without an exact observation and verdict.
4. Connect the Financial Settlement promise directly to `receipt.FS-POST-001`: reject because identity, complete evaluation, and receipt issuance are missing.
5. Remove the TypeScript qualifier from Body War: reject the resulting generic architecture claim.
6. Add P4→FS-POST-001 from similar wording: reject without owner-issued identity.
7. Substitute a stale Body War ontology digest: expect `BRIDGE_STALE_ONTOLOGY_DIGEST`; keep evidence inspectable but remove current-validity styling.
8. Promote or release Body War because receipts pass: reject; `authority_effect:none` and `release_admission:not-granted` remain unchanged.
9. Permit payout after removing the Financial Settlement event handler: expect the full P4 claim to fail and prohibit receipt issuance.
10. Complete either tour: assert that definition, evidence, authority, lifecycle, and release statuses remain unchanged.

## 8. Candidate source-backed additions

The minimum presentation may add the six view groupings; a separate non-authoritative views layer; collision-safe presentation IDs linked to owner identities; separate kind, formation, and profile judgments; a provenance drawer with digest mismatch handling; direct/indirect/missing/contested/stale binding annotations only where witnessed; separate generated/executed/observed/evaluated/receipt states; one-sentence claim ceilings; explicit receipt-to-owner-decision separation; named negative controls; and reference-only evidence and authority drawers. These are grounded in current definitions and schemas (`DEFINITIONS.md:229-379`; `minted-project/INDEX.md:14-28,47-54`; `graph.schema.json:4-23,39-54`), candidate canvas mechanics (`unified-canvas-model.mjs:35-80,98-148,216-249`), and the two consumer routes. The drawers aggregate references only; they do not compute promotion.

## 9. Deferred, excluded, and contradictory concepts

### Deferred from the minimum Atlas

- The **formal M2/M6 route** is valuable formal learning but lacks a direct Financial Settlement or Body War binding. Keep its exact refuted and conditional propositions in optional formal detail (`M2Counter.lean:1-12,49-74`; `M6Counter.lean:103-108,143-200`; `M6Restricted.lean:65-134`).
- **Contract/schema/iteration** and orthogonal maturity/promotion are useful candidate lenses, not current v2 vocabulary (`projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:15-40,102-163,214-250`).
- **Entry/return restoration and accessibility behavior** have consumer-local precedent, but require Atlas-specific fixtures. Even passing parity would prove reachability/state consistency, not comprehension (`projects/body-war/development/reviews/20260730-ontology-ui-black-box/findings.md:31-39,51-59`).
- Historical implementation vocabulary stays available as provenance, not current meaning (`research/projects/domainspec/definitions/DEFINITIONS.md:1-22`).

### Excluded

Do not add a universal Atlas ontology, cross-family ID namespace, universal bridge/status/detail schema, or invented types such as `ConsumerIntent`, `ExecutionFrontier`, `SWUTerminalReceipt`, `ImmutablePrivateRelease`, or `ObligationUniverse`. Do not add `authored-as`, `semantic-origin-of?`, or generic lifecycle predicates. Do not treat generated graphs, manifests, projections, receipts, routes, or Inventory as authority; UI candidates as active; Saga as current; formal carrier types as current DS-D1; categorical `Δ` as the current compiler; one consumer’s business meaning as generic DomainSpec; or tour completion as proof or comprehension.

### Gaps and contradictions that must remain visible

- Current v2 has 24 staged labels, thirteen active backend kinds, and Saga superseded (`definitions/meta-types/meta-types.md:6-52`), while older composability research reports 25 types/29 edges and includes Saga. The older count is historical, not an alternative current registry.
- The formal four-carrier vocabulary (`domainspec-formalization/GLOSSARY.md:92-98`) is coarser than current DS-D1/DS-D8 and must not replace it.
- The authoring-plane versus engine-contract fuse/generate decision remains interim (`definitions/DEFINITIONS.md:183-218`).
- No universal profile, generic learner projection contract, semantic-hash invariance witness, full category-law proof, general ontology-to-code compiler, Rule→Operation realization, or cross-language parity is established.
- There is no common receipt algebra or general TestCase→execution→receipt closure.
- P4→FS-POST-001 identity, Financial Settlement causal proof and receipt, and a complete admitted Body War Enum realization/evaluation chain are missing.
- `order-status-v1` lacks the expected governed terminal closeout join despite its candidate-local technical receipt.
- Generic drift-to-owner automation is absent.
- FPR-09 conformance, FPR-13 pilot, and FPR-15 authorization remain open under the route owned by `development/first-production-release/ROADMAP.md:49,54-75,100,159-161`.
- No representative-reader study establishes comprehension.

## 10. Bounded no-code enrichment blueprint

This is a presentation design sequence, not authorization to implement it.

1. Extend only the existing candidate presentation model; do not create a semantic owner.
2. Resolve every displayed owner identity to an exact path/selector and derive collision-safe projection-local IDs.
3. Add the six lifecycle groupings only as layout metadata with `authority_effect:none`.
4. Preserve source-native statuses verbatim; map them into display dimensions without writing back.
5. Display kind status, formation result, and selected-profile support separately.
6. Render only owner-issued relations as typed edges; use prose annotations for cross-family comparisons.
7. Represent absent identities as visible gap records, never question-mark semantic relations.
8. Reuse Financial Settlement and Body War manifests by reference; do not clone nodes, statuses, or receipt semantics.
9. Specify all ten negative controls as future route-validation fixtures.
10. Add reference-only evidence and authority drawers that cannot calculate admission or promotion.
11. Keep formal, historical-language, accessibility, and restoration material outside the minimum until separately witnessed.
12. Before any later implementation claim, validate exact source resolution, ID collision safety, owner/status preservation, gap visibility, stale-digest behavior, all negative controls, and unchanged authority/release state after route completion.

## 11. Validation and reader-comprehension obligations

A future implementation would need deterministic checks that every source selector resolves; every presentation ID is collision-safe; every owner/native status survives unchanged; every generated item retains its provenance digests; every missing or stale binding remains visible; every route step preserves relation direction; each of the ten negative controls fails with its expected diagnostic; and finishing a route leaves semantic, evidence, authority, and release state unchanged.

Those checks would establish structural fidelity of the presentation only. Representative readers must still be tested on whether they can distinguish authored source from generated graph, legal shape from runtime behavior, generated check from observed result, technical receipt from owner acceptance, profile-local behavior from generic DomainSpec, consumer examples from universal meaning, and missing evidence from failure. Keyboard, pointer, focus, reduced-motion, route restoration, and digest-handling tests are necessary accessibility and interaction obligations, but none demonstrates comprehension by itself (`projects/body-war/development/reviews/20260730-ontology-ui-black-box/findings.md:31-39,51-69`).

## 12. Candidate / owner / witnessed / sound / verdict matrix

| Candidate | Owner and exact evidence | Witnessed effect | Soundness boundary | Verdict |
|---|---|---|---|---|
| Exact-bound DomainSpec summary | Root `DEFINITIONS.md:144-170,1003-1055`; constitution `:42-53` | Separates typed/checkable language from runtime/release | Explanatory wording only | **KEEP; no new definition ID** |
| Six lifecycle view groupings | Owner families enumerated above | Makes incomplete joins navigable | Presentation metadata only | **KEEP with `authority_effect:none`** |
| Views/guided-examples layer | `unified-canvas-model.mjs:35-49,70-80,98-148,216-249` | Selects sources without rewriting them | No canonical graph or namespace | **KEEP** |
| Owner identities plus presentation IDs | Same canvas selectors | Avoids collisions and preserves provenance | IDs are projection-local | **KEEP** |
| DS-D1 status | `meta-types.md:6-52`; `meta-types.yml:8-41,45-278` | Exposes Body War’s hidden Enum context | Separate from formation/profile | **KEEP** |
| Formation validity | `DEFINITIONS.md:301-337`; `impl/spec/meta-types/` | Distinguishes shape from admission | Shape only | **KEEP separately** |
| Profile support | `minted-project/INDEX.md:14-28,47-54`; named profiles | Exposes TypeScript-local policy | Profile-local | **KEEP separately** |
| Endpoint check | `DEFINITIONS.md:339-379`; `relationships.md:25-35` | Distinguishes legal endpoints from behavior | Ordinary-language annotation; no new verb | **KEEP** |
| Consumer source/outgoing connection | `node.schema.json:4-16,36`; `connection.schema.json:4-14` | Preserves consumer ownership | No `ConsumerIntent` or `authored-as` | **KEEP records; KILL invented semantics** |
| Generated graph read model | `graph.schema.json:4-23,39-54`; `INDEX.md:14-28` | Separates authored and generated planes | Profile-scoped; no parallel authority | **KEEP** |
| Structural-check catalogue | `impl/test-derivation-engine/src/README.md` and named modules | Separates derivation from satisfaction | No universal `ObligationUniverse` | **KEEP exact artifacts** |
| P4→FS-POST-001 absence | Financial Settlement selectors `formal_clause`, `proof_boundary` | Reverses a false proof-closure verdict | Gap record, not a predicate | **KEEP missing binding** |
| Direct TS Enum realization | `impl/architecture-conformance/realization/`; ARE receipts; `order-status-v1/proof-receipt.json` | Shows one exact mechanism | One family/language; unjoined | **KEEP candidate-local only** |
| Generated/compiled/observed/evaluated separation | Exact Enum and derivation artifacts above | Prevents false execution claims | Exact-run scope | **KEEP distinct** |
| Mutation/replay | Enum run artifacts; Body War rejection receipts | Shows bounded causality/staleness | Name mutant, raw input, process, result | **KEEP exact-run only** |
| Technical receipt | Enum, BTE, and Body War receipts | Records bounded evidence | Expose join, authority, release, ceiling | **KEEP; never self-promoting** |
| Drift handoff | `AUTHORITY-MODEL.md:57-60`; FS `drift.P4-optional-event-handler` | Points to a named investigation owner | Suggestion, not executable routing | **KEEP annotation** |
| Claim and release gates | `first-production-release/ROADMAP.md:25,49,54-75,100,159-161` | Stops passing receipts from promoting themselves | Claim owner, authorizer, operator stay separate | **KEEP independent gates** |
| Financial Settlement route | Named scene/lifecycle selectors above | Shows promise, missing identity, partial checks, drift, no receipt | Consumer-local; causal proof partial | **KEEP by reference** |
| Body War route | BW-01–BW-12; bounded receipts | Shows kind/profile/stale/non-promotion distinctions | External Enum run is comparison only | **KEEP by reference** |
| Ten negative controls | Section 7; FS/BW owner evidence | Changes route verdict or preserves gates | Future fixtures, not current test results | **KEEP as obligations** |
| Candidate projection legend | Constitution `:136-169`; native statuses | Prevents “green” collapse | Display mapping, not registry | **KEEP** |
| Conditional detail contract | Owner sources and exact artifacts above | Makes ceilings inspectable | No empty universal schema | **KEEP candidate contract** |
| Formal M2/M6 route | Exact Lean selectors above | General educational value | No direct FS/BW witness | **DEFER from minimum** |
| Contract/schema/iteration | `DESIGN-PACKAGE.md:15-40,102-163,214-250` | Candidate explanatory precedent | Not current v2 vocabulary | **DEFER** |
| Entry/return/accessibility | Body War review `:31-39,51-69` | Potential interaction acceptance | No Atlas fixture; no comprehension proof | **DEFER** |
| Universal Atlas ontology/namespace | No owner source | No witnessed effect | Duplicate authority | **KILL** |
| Invented cross-family nodes/verbs | No tracked definitions | Presentation prose is sufficient | No owner or failure mode | **KILL** |
| Production, promotion, deployment, comprehension | Explicitly absent or owner-gated | No supporting witness | Exceeds every evidence ceiling | **EXCLUDE** |

## Final claim ceiling

These findings establish a source-addressable, owner-preserving **candidate presentation blueprint** for showing current DomainSpec semantic authority, bounded executable mechanisms, consumer-local evidence, explicit gaps, and independent decisions in one navigable Atlas while retaining the Financial Settlement and Body War guided scenes. They do not establish a new canonical DomainSpec definition, ontology, status registry, relationship vocabulary, universal lifecycle, implementation, reader comprehension, promotion, publication, release, deployment, or production readiness.
