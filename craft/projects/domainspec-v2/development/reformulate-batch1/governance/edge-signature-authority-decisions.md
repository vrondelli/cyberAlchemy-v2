---
node_type: decision-record
is_session: false
status: complete
created: 2026-07-02
target_scope: DomainSpec v2 R3 edge-signature authority
mode: interrogation + decision-gate
result: PASS
source_pack: ./edge-signature-authority-governance-pack.md
---

# R3 Edge-Signature Authority Decisions

## Gate Summary

- Target scope: DomainSpec v2 R3 edge-signature authority.
- Consequential work unblocked: SWU-R3A authority-surface selection, R3 refresh mutation, definitions promotion, and validator implementation may proceed through the selected root-authority route.
- Result: `PASS`; all visible blocker decisions below are resolved.
- Interview mode: one-question-at-a-time decision gate.
- Source evidence:
  - `edge-signature-authority-governance-pack.md`
  - `../refreshes/2026-07-02-r3-edge-law-artifact-refresh/REFRESH-REPORT.md`
  - `../../WORK-PACK.md`
  - `../../../.craft/ledger.yml`

## Blocker Decisions

### DEC-R3-AUTH-1 - Scope of Root Authority Rule

Question: Does `root owns authority; impl owns projections` apply only to relationship/edge signatures for R3, or to every future DomainSpec language spec surface?

Status: `resolved`

Options:

1. `R3-only now`
   - Benefit: smallest safe move; lets R3 proceed without rewriting all v2 source-boundary language.
   - Cost/risk: may need a later broader constitution amendment if the same boundary repeats for TAXONOMY, AXIOMS, TEST-PIPELINE, or other spec surfaces.
   - Choose when: the immediate blocker is edge signatures and we want SWU-R3A moving.
   - Downstream impact: creates an R3-local rule and defers broad C1 amendment to R6a/R6b.

2. `All DomainSpec language authority surfaces`
   - Benefit: one clear principle across the project: root owns authority, impl consumes views.
   - Cost/risk: broader constitutional consequence; may force re-homing beyond relationships before the R6a/R6b crosswalk is ready.
   - Choose when: the user wants to settle the entire v2 root-vs-impl boundary now.
   - Downstream impact: R3 becomes the first instance of a project-wide source-boundary amendment.

3. `Explain / more context`
   - Non-decision option. Selecting this does not resolve the gate.

Recommended default: `R3-only now`, because it resolves the current blocker while preserving the broader constitution split for R6a/R6b.

Selected option: `All DomainSpec language authority surfaces`
Rationale: User selected option 2. The root-vs-implementation boundary should be a project-wide DomainSpec v2 authority principle, with R3 relationships as the first application.
Source of decision: user answer, 2026-07-02.

### DEC-R3-AUTH-2 - Canonical Relationship Paths

Question: What exact paths own the human and machine relationship authority?

Status: `resolved`

Options:

1. `Definitions relationship folder`
   - Machine: `definitions/relationships/relationships.yml`
   - Human: `definitions/relationships/relationships.md`
   - Projection: `impl/spec/RELATIONSHIPS.md`
   - Benefit: keeps relationship meaning with the root definitions authority surface and matches the broader root-authority decision.
   - Cost/risk: introduces a new subfolder and requires projection/sync work for existing implementation validators.

2. `Root spec folder`
   - Machine: `spec/relationships.yml`
   - Human: `spec/RELATIONSHIPS.md`
   - Projection: `impl/spec/RELATIONSHIPS.md`
   - Benefit: creates a root spec namespace separate from definitions.
   - Cost/risk: introduces a new authority surface not yet present in v2 and may split term definitions from relationship signatures.

3. `Explain / more context`
   - Non-decision option. Selecting this does not resolve the gate.

Selected option: `Definitions relationship folder`
Rationale: User selected option 1. Relationship authority lives under root `definitions/relationships/`; implementation keeps only a projection/view.
Source of decision: user answer, 2026-07-02.

### DEC-R3-AUTH-3 - Projection Strategy

Question: Should implementation read root authority directly, or should `impl/spec/RELATIONSHIPS.md` be generated and sync-checked?

Status: `resolved`

Options:

1. `Direct root read`
   - Benefit: validators consume the canonical authority directly; no mirror drift.
   - Cost/risk: implementation tools must learn the new root path and shape.
   - Choose when: correctness of authority consumption matters more than preserving the old file as a parser source.
   - Downstream impact: `validate-relationships.ts` reads `definitions/relationships/relationships.yml`; `impl/spec/RELATIONSHIPS.md` becomes documentation/projection only.

2. `Generated projection with sync check`
   - Benefit: keeps implementation tools close to their current `impl/spec/RELATIONSHIPS.md` shape while preventing silent drift.
   - Cost/risk: requires a generator or sync validator, so there are two artifacts to keep aligned.
   - Choose when: backwards-compatible implementation ergonomics matter.
   - Downstream impact: root `relationships.yml` owns authority; `impl/spec/RELATIONSHIPS.md` is generated or must pass a projection-sync check before validators trust it.

3. `Explain / more context`
   - Non-decision option. Selecting this does not resolve the gate.

Recommended default: `Direct root read` for validators, with `impl/spec/RELATIONSHIPS.md` retained as a generated/checkable human projection if still useful.

Selected option: `Direct root read`
Rationale: User selected option 1. Validators consume the canonical root machine authority directly; implementation projections are not trusted as authority.
Source of decision: user answer, 2026-07-02.

### DEC-R3-AUTH-4 - C1 Amendment Timing

Question: Should the constitution C1 primary-source wording change now, or wait for R6a/R6b?

Status: `resolved`

Options:

1. `Amend C1 now`
   - Benefit: constitution immediately matches the project-wide root-authority decision.
   - Cost/risk: changes the active constitution before the planned R6a/R6b constitution crosswalk and split.
   - Choose when: the source-boundary decision must bind all subsequent R3/R7 work immediately.
   - Downstream impact: `domainspec-v2-CONSTITUTION.md` C1 changes now; later R6a/R6b preserves the amended wording.

2. `Record local rule now, amend C1 during R6a/R6b`
   - Benefit: keeps the current constitution stable while still making R3 proceed under the new decision record.
   - Cost/risk: C1 temporarily says `impl/spec/` is primary while this decision record says root authority owns DomainSpec language authority.
   - Choose when: the decision record is enough to govern SWU-R3A and C1 should be changed in the planned constitution pass.
   - Downstream impact: R3 uses this decision as source evidence; R6a/R6b performs the formal constitution amendment.

3. `Explain / more context`
   - Non-decision option. Selecting this does not resolve the gate.

Recommended default: `Amend C1 now`, because the user selected project-wide authority scope; leaving C1 stale risks confusing the next mutation route.

Selected option: `Amend C1 now`
Rationale: User selected option 1. The active constitution should immediately match the project-wide root-authority decision.
Source of decision: user answer, 2026-07-02.
Applied artifact update: `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md` C1 amended.

### DEC-R3-EDGE-1 - Entity Associations

Question: Are Entity-to-Entity associations first-class edge signatures, and if so should they be a small semantic relation family instead of one generic edge?

Status: `resolved`

Options:

1. `First-class semantic Entity relation family`
   - Benefit: ordinary domain relationships become representable with domain-readable verbs such as `owns`, `belongs-to`, and `depends-on`.
   - Cost/risk: each verb needs crisp semantics so the family does not become a vague catch-all; `owns` and `belongs-to` may be inverse views and need direction rules.
   - Choose when: entity associations should participate in the typed graph and the relation kind carries domain meaning.
   - Downstream impact: root `relationships.yml` includes explicit Entity-to-Entity signatures, initially candidates such as `Entity --[owns]--> Entity`, `Entity --[belongs-to]--> Entity`, and `Entity --[depends-on]--> Entity`; SWU-R3A must define direction, examples, and non-examples.

2. `One generic Entity association edge`
   - Benefit: one simple edge covers `Loan --[associates-with]--> Patron` style links without over-modeling.
   - Cost/risk: generic association is less intuitive and less discriminating than ownership/dependency verbs.
   - Choose when: R3 needs graph representability but not multiple Entity-to-Entity semantics yet.
   - Downstream impact: root `relationships.yml` includes one generic Entity-to-Entity edge; narrower verbs are deferred.

3. `Field-table-only references`
   - Benefit: avoids adding Entity-to-Entity graph edges and keeps ordinary foreign-key/entity references inside concept fields.
   - Cost/risk: the typed graph cannot express common domain associations; the novice-use blocker remains a documented limitation.
   - Choose when: R3 should only model behavioral/compositional relations, not ordinary entity associations.
   - Downstream impact: R3 must explicitly state associations are not edge-law relations and validators should not expect them.

4. `Explain / more context`
   - Non-decision option. Selecting this does not resolve the gate.

Recommended default: `First-class semantic Entity relation family`, because the user flagged `owns`, `belongs-to`, and `depends-on` as more intuitive than `references`.

Selected option: `First-class semantic Entity relation family`
Rationale: User selected option 1 after rejecting `references` as less intuitive. Entity-to-Entity relations should be first-class and use domain-readable verbs such as `owns`, `belongs-to`, and `depends-on`, with SWU-R3A defining direction, examples, non-examples, and whether `owns` / `belongs-to` are inverse views or distinct signatures.
Source of decision: user answer, 2026-07-02.

### DEC-R3-EDGE-2 - Saga Connectability

Question: Does Saga get its own signatures, or fold into Workflow plus cross-feature metadata?

Status: `resolved`

Options:

1. `First-class Saga signatures`
   - Benefit: Saga becomes connectable in the typed graph and can name coordinated operations directly.
   - Cost/risk: requires crisp Saga-specific semantics so Saga does not duplicate Workflow; compensation, participant, and cross-feature scope rules must be named.
   - Choose when: cross-feature orchestration deserves its own type and relation behavior.
   - Downstream impact: root `relationships.yml` includes a signature such as `Saga --[orchestrates]--> Operation[]` with `scope: cross-feature`; SWU-R3A records compensation/participant residue or follow-up.

2. `Fold Saga into Workflow plus cross-feature metadata`
   - Benefit: avoids a separate orphaned meta-type and keeps orchestration semantics in one Workflow concept.
   - Cost/risk: Saga-specific correctness/proof obligations may become less visible or require metadata conventions.
   - Choose when: Saga composes like Workflow and only differs by cross-feature scope.
   - Downstream impact: R3 removes or demotes Saga as a separate connectable edge source; Workflow carries cross-feature metadata/flag.

3. `Explain / more context`
   - Non-decision option. Selecting this does not resolve the gate.

Recommended default: `First-class Saga signatures` if Saga has distinct cross-feature orchestration and compensation semantics; otherwise fold it. Given prior DCB Saga residue, the current recommendation is first-class but with explicit residue for compensation and participants.

Selected option: `First-class Saga signatures`
Rationale: User selected first-class Saga signatures because Saga behaves like a multi-service transaction and therefore deserves first-class connectability similar to Workflow, while carrying distinct cross-feature orchestration, participant, compensation, and transaction-safety obligations.
Source of decision: user answer, 2026-07-02.
Downstream decision consequence: root `definitions/relationships/relationships.yml` should include a Saga orchestration signature such as `Saga --[orchestrates]--> Operation[]` with `scope: cross-feature`, and SWU-R3A should record compensation/participant obligations as explicit relation metadata or residue.

## Deferred Decisions

- Final canonical edge count: deferred to SWU-R3A signature encoding after all selected signatures are normalized in root authority.
- DS-D8 vs `domainspec-v2-D9`: deferred until the signature authority surface exists.
- DS-D2/DS-D8 promotion timing: deferred to definitions-governance after SWU-R3A.

## Assumptions

- Category-theory language remains rationale only; validators consume finite signatures.
- Consequential R3 mutation proceeds only through root-owned relationship authority and validator/projection updates described by this decision record.

## Validation

- Decision record initialized: pass.
- Blockers remaining: 0.
- Current gate result: `PASS`.
