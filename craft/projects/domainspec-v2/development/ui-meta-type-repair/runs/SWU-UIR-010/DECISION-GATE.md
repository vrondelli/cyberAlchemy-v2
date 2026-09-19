---
artifact_id: DECISION-GATE-UIR-010-v1
target_scope: SWU-UIR-010
result: PASS
created: 2026-07-11
updated: 2026-07-12
active_decision: none
---

# SWU-UIR-010 Decision Gate

## Why Execution Still Stops

SWU-UIR-010 requires accepted receipts for 001-009 and closed
acceptance-critical contract gates. The receipts exist and mechanical checks
pass. All owner decisions are now resolved, including all four DEC-UIR-010
relationship subdecisions. DEC-UIR-007's selected contract implementation is
pending; DEC-UIR-008 evidence is below its threshold; DEC-UIR-009 requires a
successor classification; and DEC-UIR-010 requires successor relationship
records for its routed or retained outcomes. No integrated audit manifest or
closure result may be produced until those implementation and evidence
obligations close.

## DEC-UIR-007 - Bounded Absence Vocabulary

**Question:** Under what conditions may a corpus receipt say
`observed-absent` instead of `not-observed`?

### Option 1 - Finite Exhaustive Search

Permit `observed-absent` only when the receipt declares a finite search scope,
pins source and extractor versions/digests, enumerates all selectors, completes
without parse/extraction errors, and records zero matches. Every partial,
ambiguous, moved, stale, or untestable search remains `not-observed`.

- Benefit: admits a real typed negative without converting missing evidence
  into absence.
- Cost: requires a new bounded-search receipt and fixtures before the audit can
  use the term.
- Downstream: SWU-006 gains a versioned extension/successor; current generation
  001 remains valid and immutable.

### Option 2 - No Absence Claims In V1 (Recommended)

Close the policy by allowing only `observed` and `not-observed` in this package.
No current or successor v1 receipt may claim absence.

- Benefit: smallest and most conservative contract.
- Cost: any dossier conjunct requiring a proved absence must remain `DEFER`.
- Downstream: SWU-010 can audit the prohibition without a bounded-search
  extension, but cannot claim absence evidence is available.

### Recommendation Reassessment - 2026-07-12

Option 2 is now recommended for the v1 closeout after reviewing the live
DomainSpec frontier:

- corpus generation 001 contains pinned selectors, not an exhaustive-search
  receipt;
- adding `observed-absent` would require a new contract and successor corpus
  generation but would not close the dossier's independent-positive, contrast,
  erasure, portability, or owner-firewall gaps;
- the adjacent compound-structure calibration preserves unavailable or
  indeterminate observations as `INSUFFICIENT-EVIDENCE`, consistent with a
  conservative v1 vocabulary;
- option 2 closes DEC-UIR-007 as a prohibition, whereas option 3 leaves the
  audit blocked.

Option 1 remains a valid later extension when a real finite-search experiment
can preregister the complete source universe, extractor, selectors, and
fail-closed completeness checks. Selecting option 2 now does not foreclose that
future version.

### Option 3 - Defer The Policy

Keep DEC-UIR-007 open and retain the current `not-observed`-only behavior.

- Benefit: no premature vocabulary choice.
- Cost: SWU-UIR-010 remains blocked by its declared input contract.
- Downstream: no integrated closure audit.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 1, finite exhaustive search.
- Source: explicit user response `1` after the option-2 recommendation and
  implementation cost were explained.
- Policy state: resolved.
- Implementation state: pending. `observed-absent` remains unavailable until a
  versioned bounded-search contract, fixtures, and successor corpus generation
  are validated.
- Preservation: corpus generation 001 remains immutable and
  `not-observed`-only.

## DEC-UIR-008 - Portability Threshold And Reviewer Policy

**Question:** What minimum evidence lets the `corpus-bound-portability`
conjunct pass for one UI candidate?

### Option 1 - Two Independent Corpora, Two Styles, Dual Review (Recommended)

Require, per candidate, at least two independently authored real corpora that
collectively cover at least two implementation styles. Two independent
reviewers must agree on candidate correspondence and applicability.

- Benefit: strongest protection against framework vocabulary, one-project
  quirks, and reviewer projection becoming false replication.
- Cost: highest evidence and review burden; current Body War/Savvy evidence
  does not satisfy it per candidate.
- Downstream: current dossier stays `DEFER`; future receipts can target an
  explicit, stable threshold.

### Option 2 - One Real Corpus, Two Styles, Independent Audit

Require one real corpus represented through two implementation styles, with one
primary correspondence review and one independent audit of the receipt and
mapping.

- Benefit: faster and less expensive while retaining a second style and audit.
- Cost: weaker independence because one corpus may carry the same domain and
  authoring assumptions through both styles.
- Downstream: some candidates could reach a bounded portability pass sooner,
  but the claim must remain narrower than independent replication.

### Option 3 - Preregistered Per-Candidate Threshold

Let the empirical/DS-D1 owner define a candidate-specific corpus, style, and
reviewer threshold before collecting evidence.

- Benefit: accommodates candidates whose meaningful portability surfaces
  differ substantially.
- Cost: less uniform, harder to compare, and vulnerable to threshold tailoring
  unless preregistration and audit are strict.
- Downstream: each candidate needs its own versioned threshold record before
  evidence collection.

### Option 4 - Defer Portability Policy

Keep DEC-UIR-008 open and preserve the current disputed conjunct.

- Benefit: avoids selecting a threshold before more experiments exist.
- Cost: SWU-UIR-010 remains blocked and no dossier can become
  `EVIDENCE-COMPLETE` where portability is required.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 1, two independently authored real corpora, two styles, and
  dual independent review per candidate.
- Source: explicit user response `1` through `decision-gate`.
- Policy state: resolved.
- Current evidence state: below threshold. Body War/Savvy evidence cannot be
  pooled across different candidates.
- Preservation: current corpus, dossier, and index generations remain
  immutable; a successor evaluation must record the threshold result.

## DEC-UIR-009 - Form And Action Independent Positives

**Question:** How should the current evidence generation classify the
`independent-positive` conjunct for Form and Action?

### Option 1 - Neither Has An Independent Positive (Recommended)

Keep Body War's Form/Action behavior as bounded source facts and reviewer
projections, but record that neither candidate has an independent positive in
the current generation.

- Benefit: matches the accepted UIF-010 dissent, the missing erasure evidence,
  and the rule that reviewer correspondence is not independence by declaration.
- Cost: the independent-positive conjunct remains non-pass and both candidates
  stay deferred.
- Downstream: successor dossier records `missing` for the independent-positive
  requirement rather than leaving the owner question disputed.

### Option 2 - Form Passes; Action Does Not

Treat Body War's form structure plus submit behavior as an independent positive
for Form, while keeping Action non-pass because its source/relationship and
destination evidence remain incomplete.

- Benefit: recognizes the richer bounded Form specimen without extending the
  same judgment to Action.
- Cost: reclassifies partial correspondence as independence before label and
  criterion erasure evidence exists.
- Downstream: Form's independent-positive conjunct passes, but its dossier still
  remains `DEFER` on contrast, erasure, and portability.

### Option 3 - Both Form And Action Pass

Treat the current Body War records as independent positives for both Form and
Action.

- Benefit: advances both strongest experimental routes immediately.
- Cost: highest overclaim risk; the accepted review calls the correspondence
  partial, Action-source remains externally owned, and erasure evidence is
  missing.
- Downstream: independent-positive passes for both, but no identity or promotion
  follows and the dossier still has other non-pass conjuncts.

### Option 4 - Defer The Owner Decision

Keep the current `disputed` state.

- Benefit: preserves dissent without a forced classification.
- Cost: DEC-UIR-009 and SWU-UIR-010 remain blocked.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 1, neither Form nor Action has an independent positive in
  the current generation.
- Source: explicit user response `1` after requesting the expanded evidence
  explanation.
- Owner state: resolved.
- Evidence state: partial Body War correspondence remains preserved; the
  independent-positive conjunct becomes `missing`, not `fail` or a kill claim.
- Preservation: current corpus, dossier, and index generations remain
  immutable; a successor evaluation must record the classification.

## DEC-UIR-010.1 - Action-Source Relationship

**Question:** Should Action remain only the target of
`Form --[submits]--> Action` in the current finite signature set, or should a
distinct Action-source signature enter the authority route?

### Option 1 - Retain Action As Target Only (Recommended)

Keep the current DS-D8 signature set unchanged. Action remains the target of
`submits`; no Action-source edge is admitted in this generation.

- Benefit: matches the current authority and avoids inventing a verb, target,
  or non-collapse consequence from handler correspondence.
- Cost: any future Action-source use remains unrepresentable until a new owner
  packet and witness exist.
- Downstream: this subquestion closes with no DS-D8 mutation; future evidence
  may append a successor decision.

### Option 2 - Open A Distinct Action-Source Signature Route

Authorize a candidate Action-source signature only after its exact verb,
target, positive and negative examples, and changed DS-D8 consequence are
supplied and reviewed.

- Benefit: preserves a route for Action to participate as a relationship
  source when evidence supports it.
- Cost: the current packet does not contain an exact signature or finite
  non-collapse witness, so implementation remains blocked on another evidence
  and owner cycle.
- Downstream: no signature changes now; a successor packet must name the exact
  candidate signature and validation obligations.

### Option 3 - Defer Action-Source

Keep the subquestion pending-owner.

- Benefit: avoids closing the option space before evidence exists.
- Cost: DEC-UIR-010 and SWU-UIR-010 remain blocked.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 2, open a distinct Action-source signature route.
- Source: explicit user response `2` through `decision-gate`.
- Subdecision state: resolved-route; no signature admitted.
- Current authority effect: none. DS-D8 version 1 and its 30 signatures remain
  unchanged.
- Required successor: exact verb and target, positive/negative examples,
  validation obligations, and a finite changed consequence.

## DEC-UIR-010.2 - Hook-Binding Relationship

**Question:** Is a Hook-to-Binding relationship distinct from
`Component --[consumes]--> Hook` and the existing
`Binding --[fetches|mutates]--> Query|Operation` edges?

### Option 1 - Retain Separation (Recommended)

Keep the current signatures without a Hook-to-Binding edge. Hook consumption
and backend Binding participation remain separately represented.

- Benefit: matches current authority and avoids adding an edge whose direction,
  verb, and changed consequence are not evidenced.
- Cost: direct Hook-Binding coupling remains unrepresentable as a canonical
  relationship.
- Downstream: this subquestion closes with no DS-D8 mutation; future evidence
  may reopen it through a successor packet.

### Option 2 - Open A Hook-Binding Signature Route

Authorize a candidate route for one exact Hook-Binding direction and verb only
after it demonstrates a changed validation, composition, projection, owner, or
generation consequence beyond the existing edges.

- Benefit: preserves a governed path if Hook-Binding coupling proves
  semantically distinct.
- Cost: the current packet has no exact direction, verb, or non-collapse
  witness, so another evidence and owner cycle is required.
- Downstream: no signature changes now; a successor packet must provide the
  finite candidate signature and validator obligations.

### Option 3 - Defer Hook-Binding

Keep the subquestion pending-owner.

- Benefit: avoids closing the option space before evidence exists.
- Cost: DEC-UIR-010 and SWU-UIR-010 remain blocked.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 1, retain Hook and Binding separation without adding a
  canonical Hook-Binding edge.
- Source: explicit user confirmation after reviewing the candidate formation
  laws, adapted-fixture separation result, real-corpus limitations, and current
  DS-D8 signatures.
- Subdecision state: resolved-owner; no signature admitted or mutated.
- Rationale: current behavior is already represented by
  `Component --[consumes]--> Hook`, `Binding --[fetches]--> Query`, and
  `Binding --[mutates]--> Operation`. Co-occurrence supplies neither an exact
  new edge nor a changed domainspec-v2-D20 through D25 consequence.
- Future route: any proposed Hook-Binding edge must complete the same candidate,
  experiment, adversarial-review, replication, and owner-promotion process used
  for other UI formalization work.
- Prohibited inference: retaining separation is not proof that Hook or Binding
  is independently replicated, active, promoted, or universally non-collapsible.

## DEC-UIR-010.3 - Guard Target Set

**Question:** Are `Guard --[protects]--> Page` and
`Guard --[mirrors]--> Rule` the complete finite Guard target set for the current
authority, or should one additional target enter a governed candidate route?

### Option 1 - Retain Page And Rule (Recommended)

Keep the current finite target set unchanged.

- Benefit: reuses the existing UI and cross-layer signatures and avoids target
  widening without a positive/negative witness.
- Cost: another Guard target remains unrepresentable until a successor route
  proves it changes a tracked consequence.
- Downstream: this subquestion closes with no DS-D8 mutation.

### Option 2 - Open One Finite Guard-Target Route

Authorize a candidate route for one exact additional target and verb after a
positive witness, a negative witness, endpoint constraints, and a changed
domainspec-v2-D20 through D25 consequence are supplied.

- Benefit: preserves a governed path if the existing Page/Rule set omits a
  materially different Guard behavior.
- Cost: the current packet names no such target, verb, or witness, so another
  evidence and owner cycle is required.
- Downstream: no signature changes now; a successor packet must name and test
  the exact candidate.

### Option 3 - Defer Guard Target

Keep the subquestion pending-owner.

- Benefit: avoids closing the target set before evidence exists.
- Cost: DEC-UIR-010 and SWU-UIR-010 remain blocked.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 1, retain Page and Rule as the current finite Guard target
  set.
- Source: explicit user confirmation through `decision-gate`.
- Subdecision state: resolved-owner; no signature widened, admitted, or
  mutated.
- Rationale: `protects Page` and `mirrors Rule` already represent the evidenced
  UI-access and cross-layer-authority roles. The current packet supplies no
  exact additional target, verb, positive/negative witnesses, or changed
  domainspec-v2-D20 through D25 consequence.
- Future route: an additional Guard target must complete the full candidate,
  experiment, adversarial-review, replication, and owner-promotion process.
- Prohibited inference: retaining the finite current set does not prove that no
  other Guard target can ever be admitted.

## DEC-UIR-010.4 - Binding Node Or Relation

**Question:** Should Binding remain the source endpoint used by the active
`fetches` and `mutates` signatures, or should it be replaced by an explicit
successor endpoint model?

### Option 1 - Retain Binding As The Current Endpoint (Recommended)

Keep Binding as the source endpoint for `Binding --[fetches]--> Query` and
`Binding --[mutates]--> Operation` in the current DS-D8 authority.

- Benefit: preserves existing validation, composition, and owner routing while
  the Binding DS-D1 candidate remains experimental and deferred.
- Cost: the authority continues to name Binding as an endpoint even though its
  independent DS-D1 identity and promotion are not established.
- Downstream: this subquestion closes with no DS-D1 or DS-D8 mutation; simple
  edge-only connections still reroute to relations rather than proving a
  durable Binding node.

### Option 2 - Open A Binding-Replacement Route

Authorize a replacement route only after an explicit successor endpoint model
preserves or deliberately changes both `fetches` and `mutates` consequences.

- Benefit: permits relation-only or another endpoint model if evidence shows a
  durable Binding node is unnecessary.
- Cost: requires coordinated DS-D1 and DS-D8 decisions, positive and negative
  witnesses, migration of both signatures, validators, projections, and
  generated artifacts. The current packet cannot enact it.
- Downstream: no authority changes now; a successor formalization and migration
  packet is required.

### Option 3 - Defer Binding Node Or Relation

Keep the subquestion pending-owner.

- Benefit: avoids selecting an endpoint model before stronger evidence exists.
- Cost: DEC-UIR-010 and SWU-UIR-010 remain blocked.

**Standing choice:** Explain / more context. This does not resolve the gate.

### Selection Recorded - 2026-07-12

- Selected: option 1, retain Binding as the current source endpoint for
  `fetches` and `mutates`.
- Source: explicit user confirmation through `decision-gate`.
- Subdecision state: resolved-owner; all four DEC-UIR-010 subdecisions are now
  resolved.
- Rationale: retaining the endpoint preserves the active DS-D8 validation,
  composition, projection, and owner routes. The current evidence supplies no
  successor endpoint model or coordinated migration for both signatures.
- Authority effect: none. DS-D8 version 1 and its 30 signatures remain
  unchanged; no DS-D1 candidate is activated or promoted.
- Boundary: an edge-only connection remains a DS-D8 relation rather than proof
  of a durable Binding node. Binding's independent identity remains an
  experimental DS-D1 evidence question.
- Future route: replacing Binding requires a full candidate formalization,
  positive and negative witnesses, adversarial review, independent replication,
  coordinated DS-D1/DS-D8 owner decisions, and migration evidence.

## Closed Gate - DEC-UIR-010 Relationships

The DS-D8 owner selected a digest-bound option for each question in the SWU-007
packet. Action-source has a successor route but no admitted signature;
Hook-Binding retains separation without a new edge; Guard retains Page and Rule
as its finite current targets; Binding remains the current source endpoint for
`fetches` and `mutates`. The packet remains immutable transport; successor
records must carry these owner decisions without mutating generation 001.

## Decision Gate Result

- Target scope: SWU-UIR-010.
- Result: PASS for decision governance; SWU-UIR-010 remains blocked downstream.
- Decisions resolved: DEC-UIR-007 through DEC-UIR-009 plus all 4 DEC-UIR-010 subdecisions.
- Decision blockers remaining: none.
- Execution blockers remaining: selected-policy implementation and successor
  evidence for DEC-UIR-007 through DEC-UIR-010.
- Active question: none.
- Next step: use `invoke` to refresh the architecture and plan for the selected
  implementation and evidence obligations before resuming SWU-UIR-010.
