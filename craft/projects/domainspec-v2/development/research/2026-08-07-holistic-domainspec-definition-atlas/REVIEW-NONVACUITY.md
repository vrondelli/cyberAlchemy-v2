## Popper review — non-vacuity verdict

Verdict: **REVISE, bounded**. The synthesis has a strong falsifiable core, but it is not yet non-vacuous at the level claimed. The Financial Settlement and Body War sources witness most lifecycle distinctions; they do **not** witness every proposed field, visual encoding, optional route, or node-detail attribute. Keep the distinctions that change a concrete reader verdict. Kill duplicated presentation metadata. Defer generic features that lack a direct FS/BW witness.

### Witnessed KEEP/KILL/DEFER matrix

| Candidate | Verdict | Smallest FS/BW witness: what becomes distinguishable | Counterexample / exact repair |
|---|---|---|---|
| **Language Authority zone** | KEEP | Body War `SuggestedTrackStatus` has a feature-owned five-value vocabulary, while `DS-D1.3` identifies the hidden Enum meta-type and the scene’s complete DomainSpec Enum definition is explicitly missing (`body-war-suggested-track-lifecycle.scene.json`, BW-01/BW-02). The reader can distinguish business vocabulary, meta-type, and missing admitted definition. | Without this distinction, an existing TS union/Postgres enum can masquerade as a complete DomainSpec Enum. Require the route to reveal the meta-type and its status; do not merely add a vocabulary box. |
| **Consumer Authoring zone** | KEEP | FS begins with “pay once, never twice” and authored feature declarations; Body War begins with feature-owned status meaning. The reader can distinguish local business meaning from generic DomainSpec vocabulary. | Negative control: selecting either consumer scene must never relabel its local concepts as universal DomainSpec definitions. |
| **Admission and Normalization zone** | KEEP | FS has materially different authored and minted graph planes; the scene explicitly says the generated read model differs from the authored graph. Body War BW-04 selects a TypeScript-specific profile. Readers distinguish authored source, admitted/profile-local input, and generated projection. | Hidden-meta-type and profile-local counterexamples must be route steps, not drawer-only prose. Show: kind exists ≠ profile admits it; normalized graph exists ≠ authored truth. |
| **Derivation and Realization zone** | KEEP | FS distinguishes candidate P4, derived `FS-POST-001`, candidate code contract, and handwritten implementation. Body War distinguishes missing Enum definition, proposed realization spec, and illustrative not-generated code (BW-02–BW-06). | Negative control: obligation is not a meta-type; generated source is not an application; a TS profile does not define generic DomainSpec architecture. |
| **Observation and Evidence zone** | KEEP | FS has generated checks, handwritten checks, a skipped/unbound full obligation, planned negative control, and `receipt_status:not-issued`. Body War has passing receipts and a real rejected stronger-claims mutation, yet no complete architecture evaluator. These change the evidence verdict. | Must render “generated check exists” separately from “ran,” “observed,” “evaluated,” and “receipt issued.” Any single “proof” badge fails this gate. |
| **Drift and Owner Decisions zone** | KEEP | FS optional event handler permits payout without `PayoutCreated`, exposing `drift.P4-optional-event-handler`; no receipt or promotion follows. Body War receipts pass while every receipt says `authority_effect:none`, `release_admission:not-granted`. | Negative control: a passing receipt must terminate at an owner gate, not flow directly to promoted/released. |
| **Projection and Guided Learning as a seventh lifecycle zone** | KILL | Existing canvas already supplies routes and projection behavior. Calling presentation a peer lifecycle zone adds no new FS/BW semantic distinction and risks implying that UI state participates in the lifecycle. | Retain it only as a non-authoritative presentation layer/route system over six lifecycle zones. |
| **Projection/source drawer/route layer** | KEEP | It lets the reader return from FS/BW overlays to the same canonical node and inspect the exact source rather than infer meaning from geometry. | Must demonstrate canonical ID preservation and `authority_effect:none`; otherwise it is decorative prose. |
| **Optional Formal Depth route** | DEFER | Neither FS nor Body War supplies the required live theorem/counterexample binding. No route-level distinction is witnessed inside the required applications. | Admit only after one exact FS/BW proposition is linked to a formal result or explicit “no binding” gap. General M2/M6 educational value alone does not pass this gate. |
| **Historical/candidate language explanatory lens** | DEFER | No smallest FS/BW step presently needs contract/schema/iteration vocabulary to decide a status or edge. | Add only if it changes a concrete route verdict; otherwise keep in provenance/detail material. |
| **Source/provenance drawer** | KEEP | FS source refs bind authored spec, minted graph, obligation model, bindings, generated tests, and handwritten code by path/digest. Body War receipts bind exact parent receipts and source digests. A reader can detect stale or substituted evidence. | Require a digest mismatch/stale-handle presentation, not just a path list. Body War bridge already witnesses `BRIDGE_STALE_ONTOLOGY_DIGEST`. |
| **Explicit missing/indirect/contested/stale edges** | KEEP | FS deliberately lacks P4→`FS-POST-001`; handwritten checks are not obligation-bound. Body War has a missing Enum definition and stale-digest rejection. These directly reverse false closure conclusions. | “Contested” has no distinct FS/BW witness beyond missing/indirect; either bind one or omit it from the initial legend. |
| **Obligation identity and claim-limit fields** | KEEP | FS shows candidate clause P4 and engine-derived `FS-POST-001` with no machine identity edge. The reader can distinguish similar wording from proved identity. | Render the absence as a red broken edge; never visually snap them together because descriptions match. |
| **Receipt-to-owner-decision separation** | KEEP | All Body War receipts pass but grant neither authority nor release. | Required negative control: mutate display state to “promoted” while receipt remains `authority_effect:none`; route must reject it. |
| **Claim ceiling on every node** | KEEP, simplify | FS `derivable-pure` does not mean passed; Body War BW-06 target code is not generated today. One sentence prevents a concrete overclaim. | Do not duplicate “what this does not establish” and `claim_ceiling` as separate prose obligations. Use one testable ceiling plus structured status fields. |
| **Negative controls as a generic addition** | KEEP | FS missing event handler must fail full P4. Body War rejects direct `needs_evidence→source_backed`, stronger backend claims, stale digest, insufficient ontology state, and executable bridge duplication. | A negative-control field without named mutation, expected diagnostic, and expected verdict is vacuous. |
| **Persistent multi-axis status legend** | KEEP, reduce | It distinguishes Body War’s `status:pass`, `ontology_status:candidate-local`, `authority_effect:none`, and `release_admission:not-granted`; FS distinguishes candidate clause, handwritten code, unbound verification, and not-issued receipt. | The proposed axes overlap. Keep only axes that alter a witnessed verdict; see status repair below. |
| `semantic_state` | KEEP, rename | Needed for FS P4 candidate and generated graph versus current authored meaning. | Rename to `definition_state`; do not put `generated` on the same axis as active/candidate because generation is artifact provenance, not semantic maturity. |
| `artifact_status` | KEEP, normalize | Needed for FS not-proven/not-issued and BW current/missing/proposed. | Replace the heterogeneous list with lifecycle-neutral existence/execution values; `external-decision` is not artifact status. |
| `evidence_class` | KEEP | Distinguishes generated check, execution observation, mutation witness, receipt, and human judgment. | Route must expose the actual evidence object; a legend-only badge is insufficient. |
| `authority_class` | KEEP | Distinguishes consumer-local Body War/FS meaning from current semantic authority. | Do not duplicate this in prose owner labels. |
| `authority_effect` | KEEP | Body War supplies direct `none` witnesses on all receipts. | Required route assertion: `none` forbids automatic promotion. |
| `release_admission` | KEEP | Body War directly witnesses `not-granted`. | Do not infer `owner-gated` unless an exact owner gate is bound. |
| `confidence` | KILL as currently defined | `source-bound`, `indirect`, `contested`, and `stale` are different relation/evidence conditions, not one confidence scale. It produces ambiguous filtering. | Move these to `binding_status` on edges/evidence: direct, indirect, missing, contested, stale. |
| `claim_ceiling` | KEEP | See above. | One plain sentence only; no duplicated narrative fields. |
| **Visual line grammar** | KEEP partially | Solid/dashed/red-broken/gate distinctions alter FS/BW route verdicts. | KILL “grey halo” unless tested for an observable route meaning. A receipt badge must never mean “lifecycle joined” unless a joined receipt actually exists. |
| **18-field node-detail contract** | KILL as universal contract | Several fields are irrelevant for many nodes and repeat one another. Requiring all 18 encourages empty or prose-only fields. | Replace with a typed minimum plus conditional fields; see repair list. |
| **Placement table** | KEEP as design guidance, not evidence** | It prevents FS/BW portals from becoming generic overview meaning and keeps profile/receipt details available at the claim boundary. | It does not itself prove comprehension. Require route assertions below. |
| **Semantic-route fields** | KEEP core; KILL redundancy | Canonical IDs, exact source binding, typed relation, status/authority, and negative controls make FS/BW claims falsifiable. | `step_ids` plus canonical IDs are useful; a verbose relation tuple repeating node and edge metadata is not. Normalize to `edge_id` plus independently checked expected predicate/direction/status. |
| Entry trace / return trace | DEFER | Existing synthesis cites interaction precedent, but no live FS/BW route witness here proves suspend/restore semantics or canonical return invariance. | Admit after a deterministic route fixture asserts restoration to the same canonical selection. |
| Pointer/keyboard/reduced-motion parity | DEFER from non-vacuity review | These are legitimate UX obligations, but the inspected FS/BW semantic sources do not witness them. | Validate separately as accessibility acceptance criteria; do not present them as source-backed lifecycle distinctions. |
| **Financial Settlement route overlay** | KEEP | Its decisive observable result is failure to close at P4→`FS-POST-001`, full obligation execution, mutation/replay, and receipt issuance. | Route must finish visibly incomplete; a “tour completed” state must not become “proof completed.” |
| **Body War route overlay** | KEEP | It distinguishes real consumer-local Rule/status meaning and passing receipts from missing Enum definition, proposed generation/evaluator, and forbidden promotion. | Route must stop at BW-02 for generation and BW-12 for authority/release. Comparable external Enum mechanics must be labeled analogy, not Body War execution. |
| **Feedback: source correction** | KEEP | FS missing binding or failed P4 negative control can route to the owning clause/binding source. | Feedback arrow means routing, not automatic mutation. |
| **Feedback: implementation drift** | KEEP | FS optional handler drift routes to definition/binding/implementation owner; Body War drift returns to missing Enum definition in BW-12. | Must identify next owner and preserve pre-repair evidence. |
| **Feedback: causal proof** | KEEP | Body War’s stronger-backend-claims mutation is rejected; FS has a precise planned missing-event control. | FS remains planned, so label the loop partial; do not draw it as completed. |
| **Feedback: evidence staleness** | KEEP | Body War bridge rejects stale ontology digest with `BRIDGE_STALE_ONTOLOGY_DIGEST`. | Require stale evidence to lose current-validity styling while remaining inspectable. |
| **Feedback: lifecycle closure** | KEEP | Body War pass → authority none → release not granted is the exact negative witness. | Never render it as an automatic forward pipeline; owner decisions are independent gates. |
| **Feedback: formal learning** | DEFER | No direct FS/BW formal binding witnesses it. | Keep outside the minimum Atlas until exact application binding exists. |
| **Feedback: presentation** | KILL as lifecycle feedback loop | Selection/return is UI state, not domain or evidence feedback. It creates no new lifecycle verdict. | Keep as an interaction invariant in the presentation contract. |
| Glossary: **meta-type, profile, normalized graph, obligation, realization spec, observation, receipt, owner gate** | KEEP | Each changes an FS/BW classification at a concrete step. | Definitions must point to the witnessed node/edge and include a “not X” example. |
| Glossary: **residue, formal carrier, contract/schema/iteration, confidence** | DEFER/KILL | No minimum FS/BW route decision requires them; `confidence` is malformed as above. | Add only in optional exact-bound routes, not the default glossary. |

### Minimum route-level negative controls

1. **Hidden meta-type:** In Body War BW-01, hide `DS-D1.3`; the route must fail because a local five-value vocabulary cannot be distinguished from an admitted DomainSpec Enum definition.

2. **Candidate versus current:** Relabel Body War BW-05/BW-06 from `proposed` to `current`; validation must reject the route because the Enum definition and projector/emitter application are absent.

3. **Generated versus executed:** In FS, change “generated check exists” to “executed/passed”; reject unless an execution observation and exact result are bound. Conversely, Body War’s generated case/receipt cannot stand in for the proposed architecture generator.

4. **Business promise versus receipt:** Link FS’s “pay once, never twice” directly to `receipt.FS-POST-001`; reject because P4→obligation identity is absent, full verification is unbound, and the receipt is not issued.

5. **Profile-local versus generic architecture:** Remove the TypeScript profile qualifier from Body War BW-04–BW-06; reject any resulting claim of generic DomainSpec realization.

6. **Missing direct link:** Add P4→`FS-POST-001` based only on matching wording; reject unless a source-owned identity binding is supplied. The expected route state is a red broken edge.

7. **Stale evidence:** Substitute a stale Body War ontology digest; expect `BRIDGE_STALE_ONTOLOGY_DIGEST`, invalidate current evidence styling, and preserve the stale receipt for inspection.

8. **Owner-gated promotion:** Change Body War candidate ontology state to `source_backed` or release admission to granted solely because receipts pass; reject via the existing forbidden-transition/insufficient-state controls. Passing receipts retain `authority_effect:none`.

9. **Incomplete execution closure:** Remove FS’s event handler while permitting payout; expect full P4 failure and prohibit receipt issuance.

10. **Route-completion false green:** Complete either guided tour; assert that semantic/evidence/release status is unchanged and `authority_effect:none`.

### Exact repair list

1. Reduce the Atlas to **six lifecycle zones plus one presentation layer**. Do not count Projection and Guided Learning as a seventh peer lifecycle zone.

2. Replace `confidence` with edge/evidence `binding_status: direct | indirect | missing | contested | stale`.

3. Split status cleanly:

   - `definition_state`: active | candidate | deferred | superseded | deprecated
   - `artifact_state`: absent | design-only | generated | executable | observed | evaluated | receipt-issued
   - retain `authority_effect` and `release_admission` independently.

4. Replace the universal 18-field node contract with this minimum:

   - ID/label/class
   - owner and exact source selector
   - project/profile scope
   - definition/artifact/evidence/authority/release states
   - typed incoming/outgoing edges
   - claim ceiling
   - binding gaps
   - conditional receipt, generated-artifact, formal, or drift fields only where applicable.

5. Normalize route edges to `edge_id` plus asserted predicate, direction, binding status, and expected authority/evidence states. Avoid repeating a prose “relation tuple.”

6. Make each negative control executable as route validation data: named mutation, expected diagnostic or failed assertion, expected unchanged authority/release state.

7. Mark the FS causal-proof loop **partial/planned**, not complete; its missing-event control and receipt issuance remain unexecuted/not-issued.

8. Label Body War’s external direct TypeScript Enum mechanics as **comparable candidate-local evidence**, never as a Body War execution step.

9. Defer Formal Depth, formal-learning feedback, entry/return restoration, and accessibility claims from the minimum evidence-backed Atlas until their own exact route witnesses exist.

10. Remove glossary terms and visual encodings that do not change an FS/BW route verdict. A term earns default placement only if removing it causes one of the ten negative controls to become undetectable.

No files were edited.
