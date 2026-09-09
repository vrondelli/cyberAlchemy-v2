# Recursivity Companion Invariant Research

Status: collected research returns
Date: 2026-06-21
Dispatch: `2026-06-21-recursivity-companion-invariant`

## Dispatch Question

Research whether CyberAlchemy v2 already has a paired or companion invariant for
`recursivity`, analogous to the way `typed coupling invariant` protects
orthogonality when orthogonality cannot be maintained. Include the user's new
hypothesis that every invariant should have an impossibility or relaxation lane
when the invariant cannot be met.

The dispatch explicitly tested owned vocabulary before coining terms.

## Source Boundaries

- CyberAlchemy v2 definitions and promotion material.
- Prior recursivity promotion verdict.
- Arcanum Craft and metadata vocabulary.
- Framework-unification schema, relation, and runtime-guard material.
- Bounded DomainSpec Lean formalization material around obstruction, restricted
  form, attenuation, reflection tower, and strange-loop evidence.
- Dispatch and ledger runtime guard material under
  `implementation/domainspec/internal_tools/subagents-dispatch-hooks/`.

## Explorer Returns

### Lawvere: Formal / Lean Vocabulary

Lawvere found useful formal vocabulary but did not find a promoted generic
counterpart for recursivity.

Key vocabulary:

- obstruction / no-go / threshold / restricted fragment / attenuation depth /
  persistence
- avoid finite Lawvere fixed-point overclaim
- avoid classical Lie-Noether invariant overclaim
- avoid broad coequalizer or dual vocabulary unless a source owns it

Useful formal anchors:

- Fully faithful threshold: `domainspec-lean-formalization/lean-formalization/F11.lean:7,81,294`
- Faithful-not-enough counterexample:
  `domainspec-lean-formalization/lean-formalization/M6Counter.lean:103,145`
- Bicyclic torsion obstruction:
  `domainspec-lean-formalization/lean-formalization/Bicyclic.lean:6,304,446`
  and `domainspec-lean-formalization/lean-formalization/LanFaithfulRefutation.lean:18`
- Restricted-fragment route:
  `domainspec-lean-formalization/lean-formalization/M6Restricted.lean:5,104`
- Malformed-domain obstruction:
  `domainspec-lean-formalization/lean-formalization/ObserverAdjunctionRefutation.lean:46,195`
- Reflection-tower persistence:
  `domainspec-lean-formalization/lean-formalization/ReflectionTower.lean:66,343`
  and
  `domainspec-lean-formalization/lean-formalization/ReflectionTowerAnchored.lean:511`
- Strange-loop finite/omega caution:
  `domainspec-lean-formalization/lean-formalization/StrangeLoop.lean:38,160,184`
- Attenuation vocabulary:
  `domainspec-lean-formalization/lean-formalization/AttenuationDepth.lean:15,157,357`

Initial recommendation:

> Recursive self-application is allowed only as level-raising promotion that
> preserves prior distinctions and carries obstruction forward; same-level or
> finite closure is rejected unless a restricted fragment, quotient, or
> attenuation witness is explicitly supplied.

After robot-talks, Lawvere accepted `invariant-guard pair` only as a generic
research name, accepted `typed residue first`, accepted `bounded re-entry guard`
as executable vocabulary, and rejected `relaxation companion` as the default or
canonical pair name. The formal recursivity phrasing should be obstruction
persistence under level-raising promotion, not fixed point, self-identity, or
automatic relaxation.

### Bateson: Governance / Authority Risk

Bateson identified the operational risk as reflexive authority collapse: a
recursive process can start treating its own output as authority without a gate.

Default route:

- typed residue first
- block promotion until the owner route is explicit
- route definitions through definitions-governance
- route contested naming, waiver, or relaxation through decision-gate
- use reflection tower only for structural residue that cannot be repaired
  locally

Useful anchors:

- Promotion policy:
  `cyberAlchemy-v2/authority/promotion-policy.md:20,27`
- Residue lane:
  `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:780`
- Reflection tower:
  `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:702`
- Decision and owner decision:
  `arcanum/framework/CYBERALCHEMY-METHOD.md:261`
- Craft recursive ledger route:
  `arcanum/arcana/craft/SKILL.md:114,312`

After robot-talks, Bateson accepted:

- `invariant-guard pair` only as candidate vocabulary
- `typed residue first` as the routing rule
- `bounded re-entry guard` as the best concrete recursivity guard candidate

Bateson rejected `relaxation companion` as a primary term because it makes
relaxation sound automatic. Relaxation is only a downstream treatment after
owner decision.

### Shannon: Relation / Schema Vocabulary

Shannon found no evidence that a single existing term owns the paired-invariant
structure.

Candidate generic name found during exploration:

- `invariant-guard pair`

Useful boundaries:

- Not just `relation` or `typed edge`; those cover graph legality rather than
  invariant failure routing.
- Not `companion`; Arcanum uses companion for explanatory prose paired with a
  canonical or machine-readable artifact:
  `arcanum/framework/ARTIFACT-METADATA-CONSTITUTION.md:58`
- Not `complement`; the repo uses `complements` as a document relationship:
  `projects/framework-unification/layers/dispatch-composition-attack/system-view.md:258`
- Not `dual`; the term is overloaded and mathematically stronger than the
  evidence.
- Not `compiler-pair`; the precedent is too narrow:
  `projects/framework-unification/layers/domainspec-language/development/refinement-runs/2026-06-08-language-validator-convergence/stages/s5-distill/CONVERGENCE-MODEL-DECISION.md:11`

After robot-talks, Shannon revised the relation model to:

```text
invariant -> typed residue -> owner-routed guard/treatment
```

Shannon accepted `typed residue first`, accepted `bounded re-entry guard`, and
rejected `relaxation companion` as current governance vocabulary.

### Turing: Runtime / Failure Guard Vocabulary

Turing found executable guard precedents but no promoted recursivity companion
guard.

Runtime failure modes:

- recursion runaway: `max_loops`, `loop_cap`, finite lineage, and
  `loop_ceiling_reached`
- ledger mutation/tampering: strict appender validation, append-only hooks,
  idempotent dispatch/close rows
- projection drift: Craft source-of-truth ledger versus generated projections
- authority collapse: source authority and owner gates
- invariant failure or false guard: bounded witness rather than proof
- observability self-loop: dedupe and signal bounds
- runtime guard overclaim: bounded claims only

Useful anchors:

- Dispatch bounds:
  `implementation/domainspec/internal_tools/subagents-dispatch-hooks/constitution/subagents-strategy-constitution-proposal.md:206,230`
- Append-only and idempotent dispatch ledger:
  `implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/append-dispatch.cjs:295`
- Craft boundaries:
  `arcanum/arcana/craft/SKILL.md:56,114`
- Bounded-witness caution:
  `projects/domainspec-v2/research/dcb-saga-correctness/SYNTHESIS.md:7`
  and
  `projects/domainspec-v2/research/dcb-saga-correctness/review/findings.md:29`

Turing initially suggested `bounded re-entry guard` as the concrete recursivity
guard. After robot-talks, Turing accepted `invariant-guard pair` only as a
generic research label, accepted `typed residue first`, narrowed `bounded
re-entry guard` to executable recursivity cases, and rejected `relaxation
companion` as canonical vocabulary.

## Synthesis Return

The synthesizer's first stable model was:

```text
invariant -> typed residue -> owner-routed guard/treatment
```

Key points:

- `invariant-guard pair`: candidate only, not canon.
- `typed residue first`: routing rule grounded in active `residue` /
  typed-residue vocabulary.
- `bounded re-entry guard`: strong candidate for recursivity-side guard.
- `relaxation companion`: reject/defer.
- `obstruction persistence under level-raising promotion`: useful formal
  candidate phrase, but avoid fixed-point or Noether overclaim.
- `restricted fragment` and `attenuation witness`: possible treatment labels
  after typed residue and owner decision.

Recommendation before reviewer repair:

- promote nothing canonical today
- adopt candidate vocabulary only
- reject `relaxation companion` as canonical wording

## Reviewer Returns

### Russell: Owner / Precedent Gate

Russell returned CONCERN, repairable.

Main objections:

- `invariant-guard pair` risks over-owning the model because CAV2 already owns
  typed coupling, residue, reflection tower, and Craft method.
- `bounded re-entry guard` cannot be treated as a recursivity companion because
  the prior recursivity verdict is still DO NOT PROMOTE.
- relaxation must not bypass owner routing.
- `obstruction persistence under level-raising promotion` must be called a
  source-backed paraphrase, not a promoted term.

Final reviewer pass:

> PASS, but only as a research-only candidate routing schema. No definition, no
> promotion, no companion invariant.

Allowed wording:

- use `invariant failure route` as research shorthand
- first record a failed preservation or closure attempt as typed residue
- use CAV2-D18 record fields
- allow `bounded re-entry guard` only as a candidate guard name
- do not use `relaxation companion`
- use `structural obstruction`, not `impossibility`, unless stronger evidence
  exists
- formal-source paraphrase may be `specific obstruction-witness persistence
  under anchored level promotion`

### Bourbaki: Non-Vacuity Gate

Bourbaki returned CONCERN.

Main objections:

- the synthesis passes only as a candidate routing schema, not as a definition
  or promotion
- `invariant-guard pair` is too broad unless it becomes a record with failure
  conditions
- `typed residue first` is checkable but already owned by CAV2-D18
- `bounded re-entry guard` is useful but under-specified unless it records prior
  artifact, new altitude, bounded scope, gate, next owner, and re-entry budget
- formal obstruction language must be narrowed to the Lean pattern

Minimal non-vacuity tests:

- one blocked case and one admitted case
- one concrete downstream safety change if the guard is absent
- explicit non-overlap with CAV2-D16, CAV2-D17, CAV2-D18, CAV2-D20, and ordinary
  recursion
- residue record before any waiver, restricted fragment, or owner treatment
- bound plus exit or treatment status
- no canonical promotion without definitions-governance

Final reviewer pass allowed research-only wording but kept one promotion
blocker:

> The synthesis still needs at least one concrete safety witness: a recursive
> self-application case where absence of the bounded re-entry route changes
> downstream safety, plus filled record fields. Without that, it is useful
> vocabulary discipline, not non-vacuous governance machinery.

### Wittgenstein: Term Discipline Gate

Wittgenstein returned CONCERN, repairable.

Term table:

- `invariant-guard pair`: only research-local shorthand; define as route, not
  symmetric pair
- `invariant failure route`: cleanest umbrella for v2 prose
- `bounded re-entry guard`: best concrete recursivity guard candidate
- `typed residue`: already owned by CAV2-D18
- `structural obstruction`: better than `impossibility` after residue is typed
  and local repair fails
- `impossibility`: defer unless theorem or refutation-backed
- `no-go`: limited to proven refutation or explicit owner decision
- `non-applicability`: collides with capability/sigil scope usage
- `relaxation companion`: reject
- `dual` and `complement`: too formal or already used locally

Final reviewer pass:

> PASS as a research finding only. Not a definition, not a promotion, not a new
> invariant family.

Allowed umbrella wording:

> When an invariant cannot be satisfied for a concrete decision, record typed
> residue before any treatment.

## Convergence

The reviewer-converged result is:

```text
invariant failure route
```

as research-only candidate route, not a canonical term.

The route is:

```text
named invariant fails for operation/scope
-> CAV2-D18 typed residue record
-> owner-routed treatment
```

The recursivity-specific candidate is:

```text
bounded re-entry guard
```

but only as a candidate concrete guard pattern, not as a promoted recursivity
companion.

`relaxation companion` is rejected. `Relaxation`, `waiver`, `restricted
fragment`, and `attenuation witness` may appear only as treatments after residue
typing and owner routing.

The Lean-backed paraphrase should be narrowed to:

```text
specific obstruction-witness persistence under anchored level promotion
```

or:

```text
specific typed obstruction persistence under anchored level-raising promotion
```

This is a source-backed paraphrase, not a Lean theorem name or CyberAlchemy v2
definition.
