# Recursivity Companion Invariant Findings

Status: audited candidate finding
Date: 2026-06-21
Dispatch: `2026-06-21-recursivity-companion-invariant`

## Short Answer

**PASS as a research-only candidate routing schema. Do not promote to canon.**

Use **`invariant failure route`** as the umbrella for this finding. An invariant
failure route is a record used when a named invariant cannot be shown to hold
for a specific operation and scope. It first records typed residue under
`CAV2-D18`, then routes owner-selected treatment.

Do **not** promote `invariant-guard pair`, `relaxation companion`, `bounded
re-entry guard`, or `recursivity`.

## Verdict Matrix

| Question | Verdict | Reason |
| --- | --- | --- |
| Is there a useful research schema here? | **PASS** | The route reuses `CAV2-D18` residue fields and keeps treatment owner-selected. |
| Promote anything canonical? | **NO** | This is research-only; no definitions-governance decision has selected terms. |
| Umbrella term | **`invariant failure route`** | Names the failure record and treatment route without implying a symmetric companion family. |
| `invariant-guard pair` | **DEFER / DEMOTE** | Useful as exploratory shorthand, but too broad and too symmetric for v2 canon. |
| `bounded re-entry guard` | **CANDIDATE ONLY** | Best concrete recursivity guard candidate, but not a recursivity companion and not promoted. |
| `relaxation companion` | **REJECT** | Relaxation or waiver is one possible owner-selected treatment after residue typing, not the route name. |
| Recursivity status | **DO NOT PROMOTE** | Prior verdict remains: witnessed phenomenon, unsettled term, unresolved non-overlap tests. |
| Formal language strength | **structural obstruction** | Use stronger `impossibility` or `no-go` language only where a formal refutation or owner decision supports it. |

## Candidate Route

An **invariant failure route** records the case where a named invariant cannot be
shown to hold for a specific operation and scope.

Minimum record fields:

- source operation
- expected preservation or closure condition
- observed failure locus
- residue type
- evidence reference
- owner route
- proposed treatment

This field shape is inherited from the active `CAV2-D18` residue definition:
residue becomes actionable only when it records the source operation, expected
condition, failure locus, type, evidence, owner route, and treatment.
`cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:780-793`

Treatment may be:

- local repair
- typed coupling
- bounded guard
- restricted fragment
- attenuation witness
- waiver or accepted residue
- deferral
- reflection-tower climb
- owner decision

Treatment is **not direct relaxation by default**. Relaxation or waiver is only
one possible owner-selected treatment after residue has been typed. The active
residue rule says to type residue first, then repair, type a coupling, route a
gate, climb, accept, or defer. `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:822-824`

## Recursivity Guard Candidate

`bounded re-entry guard` is admissible only as a candidate concrete guard
pattern for recursive self-application. It is **not** a recursivity companion
and **not** a promoted invariant.

A bounded re-entry guard must declare:

- prior artifact
- new altitude
- bounded scope
- gate
- next owner
- re-entry budget, such as `loop_cap`, `max_loops`, or equivalent
- guard trigger
- exit or treatment status

If any of these are absent, route the case as residue instead of treating
recursive re-entry as safe.

The recursivity source cluster already says each recursive step needs bounded
scope, an artifact, a gate, and a next owner, while also leaving the canonical
term selection unresolved. `cyberAlchemy-v2/authority/definitions/source-clusters/primordial.md:76-92,203-204`

The dispatch runtime gives an executable analogy for the budget side: `max_loops`
is the whole-sequence rerun ceiling, and re-runs fire only through an approver
rejection. `implementation/domainspec/internal_tools/subagents-dispatch-hooks/constitution/subagents-strategy-constitution-proposal.md:206-212`

## Term Decisions

### Adopt For This Finding

`invariant failure route`

Use it as research-local wording for the route:

```text
named invariant fails for operation/scope
-> CAV2-D18 typed residue record
-> owner-routed treatment
```

### Reject Or Demote

`invariant-guard pair`

This is demoted to exploratory shorthand. It sounds like a symmetric companion
family and risks over-owning active neighboring canon: `CAV2-D16` typed coupling
invariant, `CAV2-D17` reflection tower method, `CAV2-D18` residue, and
`CAV2-D20` Craft method.
`cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:626-658,702-764,780-824,960-978`

`relaxation companion`

Reject as canonical. The word `companion` already has a metadata use for
explanatory companion prose, and relaxation is a treatment, not a route.
`arcanum/framework/ARTIFACT-METADATA-CONSTITUTION.md:52-59`

`impossibility`

Defer as general vocabulary. Use `structural obstruction` unless a formal
refutation, proved no-go, or explicit owner decision supports stronger language.

### Formal-Source Paraphrase

Use only as source-backed Lean paraphrase:

```text
specific obstruction-witness persistence under anchored level promotion
```

or:

```text
specific typed obstruction persistence under anchored level-raising promotion
```

This is not a Lean theorem name and not a promoted CyberAlchemy v2 term. The
Lean glossary supports the narrow reading: diagonal-axis content is persistence,
not literal self-reference; finite fixed-point closure is closed-negative; and
`persistence_lemma` is persistence of a specific obstruction, not fixed-point
closure. `domainspec-lean-formalization/GLOSSARY.md:198-200,264,272,280-282`

## Evidence Table

| Evidence item | What it supports | Status for this verdict | Anchors |
| --- | --- | --- | --- |
| CAV2-D18 residue fields | The failure route should be a typed residue record before treatment. | Active canon reused; no new primitive needed. | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:780-824` |
| CAV2-D16 typed coupling invariant | Orthogonality already has an explicit failure guard for non-orthogonal dependency. | Neighboring precedent; do not over-own with a new pair family. | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:626-658` |
| CAV2-D17 reflection tower method | Structural residue can climb only after local repair fails and a higher layer is justified. | Treatment route, not generic relaxation. | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:702-764` |
| CAV2-D20 Craft method | Recursive ledger work records residue and cannot make terms canonical. | Neighboring boundary for recursivity and recursive governance. | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:960-978,999-1009` |
| Primordial recursivity sketch | Recursivity is already candidate material and requires bounded scope, artifact, gate, and next owner. | Supports candidate guard shape; blocks promotion. | `cyberAlchemy-v2/authority/definitions/source-clusters/primordial.md:76-92,203-204` |
| Prior recursivity verdict | Recursivity remains witnessed but not definitionally settled. | Keeps this result research-only. | `cyberAlchemy-v2/development/research/2026-06-21-recursivity-promotion-verdict/findings.md:7-16,32-43,129-139` |
| Dispatch loop bounds | Recursive dispatch work has explicit `max_loops` / `loop_cap` style brakes. | Runtime analogy for bounded re-entry, not a v2 definition. | `implementation/domainspec/internal_tools/subagents-dispatch-hooks/constitution/subagents-strategy-constitution-proposal.md:206-212` |
| Lean reflection-tower caution | Obstruction persists under specific tower moves; fixed-point and absorption claims are bounded. | Supports narrow formal paraphrase only. | `domainspec-lean-formalization/GLOSSARY.md:198-200,264,272,280-282` |
| Companion metadata use | `companion_to` already names explanatory companion prose. | Blocks `relaxation companion` as clean canon. | `arcanum/framework/ARTIFACT-METADATA-CONSTITUTION.md:52-59` |

## Non-Vacuity Tests

The route is not ready for canonical governance machinery until it has concrete
witnesses.

A route is non-vacuous only if it names:

- invariant
- operation and scope
- expected condition
- observed structural obstruction
- residue type
- evidence
- owner
- proposed treatment

A guard is non-vacuous only if it admits some cases and blocks others. For
recursivity, that means at least one admitted bounded re-entry case and one
blocked or residue-routed case before the guard is treated as useful machinery.

A treatment is non-vacuous only if it changes the next obligation: repair,
type a coupling, restrict a fragment, witness attenuation, accept residue,
defer, climb, or route owner decision.

## Promotion Blockers

- `recursivity` remains unpromoted.
- `bounded re-entry guard` still needs blocked/admitted cases and a safety delta.
- any treatment must prove residue-before-treatment ordering.
- `invariant-guard pair` must not appear as canonical vocabulary unless a later
  definitions-governance pass narrows it into a concrete record type with failure
  conditions.
- the formal phrase remains source-backed paraphrase, not v2 vocabulary.

## Next Valid Move

Run **definitions-governance** next. Keep this finding as research-only input.

Required before any promotion:

- blocked and admitted cases
- safety delta
- explicit non-overlap tests against `CAV2-D16`, `CAV2-D17`, `CAV2-D18`,
  `CAV2-D20`, and ordinary recursion
- index sync
- drift check
- three-voice canonical definition draft if the term survives
