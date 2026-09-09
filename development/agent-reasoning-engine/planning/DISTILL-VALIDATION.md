# Distill validation — agent reasoning engine plan

Verdict: **PASS for the ACI-subordinate plan structure; mutation handoff
BLOCKED by external, selection, and closeout gates**

Mode: `standard` validation, two recursive rounds, Proposer/Balancer role
simulation. The runtime supports subagents, but repository policy requires a
separately presented and confirmed governed dispatch before spawning them. This
bounded plan validation had no such authorization, so it preserved the required
role trace locally.

## Optimization target

The plan must preserve the accepted ACI-subordinate whole while finding the
smallest future units that prove either containment or integration without
smuggling a second writer. No unit is selected.

Candidate local-only unit: `SWU-ARE-019`, one non-integration
namespace/posture/identity guard.

Candidate integrated unit: `SWU-ARE-016`, one admission gate for a complete
owner-receipted external conformance fixture set.

`SWU-ARE-001` remains the completed L0 semantic witness. `SWU-ARE-002` is
superseded because a local integrated journal cannot recompose into option A.

## Role conversation trace

### Round 1

- **Proposer claim:** revise the old protocol task in place and let one adapter
  SWU cover command mapping, actor facts, Bus observations, and replay.
- **Evidence/assumption:** all behaviors cross the same ACI seam.
- **Balancer objection — authority collapse/task shape:** the proposal bundles
  outbound acceptance input, inbound facts, optional publication, and pure
  replay, which have different owners and independent falsifiers.
- **Reconciliation:** retire the local journal SWU and split fixture admission,
  semantic-reference mapping, actor-event read projection, Bus proposal
  mapping, and replay.

### Round 2

- **Proposer claim:** use external fixture admission as the only next-unit
  candidate.
- **Evidence/assumption:** integration is the selected target.
- **Balancer objection — blocked navigation:** external maturity makes that unit
  non-runnable and leaves the permitted local-only interim structurally
  unguarded.
- **Reconciliation:** preserve two closed routes. `SWU-ARE-019` is the smallest
  local containment proof; `SWU-ARE-016` is the smallest integrated trust proof.
  Neither is selected, and local evidence cannot unlock integration.

Stable disagreement: none. The accepted binding fixes ownership; the two-route
plan preserves rather than reopens that decision.

## SWU atomicity and split analysis

| SWU | Candidate child units | Retained-boundary rationale | Verdict |
|---|---|---|---|
| `SWU-ARE-019` | claim guard; namespace guard; identity guard | any one omitted guard permits the same integration impersonation; one decision is “admit as explicitly local-only or block before calls” | pass |
| `SWU-ARE-016` | receipt check; digest check; fixture-completeness check | none independently admits a trustworthy external vector set; the output is one admitted manifest or one block | pass |
| `SWU-ARE-017` | dispatch mapping; semantic artifact mapping | both are fields of one outbound candidate command projection and share one total ownership check | pass |
| `SWU-ARE-018` | receipt verification; journal-cut projection | projection without verified accepted facts is invalid; together they produce one immutable actor cut | pass |
| `SWU-ARE-003` | Bus fact verification; proposed-handle mapping | one acceptance boundary maps an owner-verified Bus fact to a non-admitted proposal | pass |
| `SWU-ARE-004` | ACI fact fold; semantic evaluator replay | neither alone proves the historical semantic result; one pure replay behavior joins them | pass |
| `SWU-ARE-014` | exact gate; ACI candidate projection | the gate is an owned input; this SWU owns only the all-or-zero projection decision | pass |

Previously reviewed SWUs retain their prior split analyses. Task-shaped count:
`0`; superseded count: `1` (`SWU-ARE-002`).

## Narrow-first-unit check

PASS for candidate boundaries; `n/a` for execution because no SWU is selected.

- `SWU-ARE-019` changes only a local claim/namespace guard and is reversible.
- `SWU-ARE-016` changes only fixture admission/harness data and cannot write ACI
  lifecycle state.
- Neither combines later mapping, runtime, publication, replay, durability, or
  effect behavior.

## Recomposition proof

The completed `SWU-ARE-001` remains the semantic center. Local-only
`SWU-ARE-019` contains interim evidence without entering the integration path.
On the integrated path, `SWU-ARE-016` admits external truth about contract
bytes; `SWU-ARE-017` maps semantic artifacts outward; `SWU-ARE-018` maps
accepted actor facts inward; optional `SWU-ARE-003` maps Bus facts to proposed
observations; and `SWU-ARE-004` proves historical replay. L2 adds new-command
revalidation, semantic artifact durability, candidate exact-effect command
mapping, and owner-routed incidents. L3 packages only the resulting
ACI-subordinate adapter.

No hidden glue owns journal writes, canonical receipt identity, evaluator
admission, or effect intent.

## Acceptance-critical gaps

| Gap | Treatment | Distill effect |
|---|---|---|
| ACI runtime work-pack gate blocked | await current ACI owner receipts and executable conformance vectors | blocks `SWU-ARE-016+`, not plan authorship |
| Bus latest integration review `FIX` | exclude Bus seam until later explicit `PASS` | blocks `SWU-ARE-003` |
| ACP discovery only | require confirmed `DispatchSpec` receipt/version before integrated use | blocks protocol-dependent mapping |
| APT mutation gate blocked | keep provenance mapping excluded/projection-only | blocks APT adapter work, not core conformance |
| cross-repository fixture set absent | `SWU-ARE-016` admission cannot start | blocks integrated execution |
| Task Session closeout synchronization absent | exact one-SWU plan refresh before mutation | blocks all future source mutation |
| no SWU selected | separate explicit owner selection | blocks execution by design |
| artifact admission posture unresolved | artifact owner decision before `SWU-ARE-006` | blocks semantic artifact durability |
| incident/compensation posture unresolved | incident owner decision before `SWU-ARE-007` | blocks degraded routing |
| revision-history intent mechanics | excluded from L0 inputs | non-blocking residue |
| AntiBiasVector efficacy | separate research/governance program | blocks efficacy claim, not conformance planning |

## Plan-quality checks

- L0–L3 boundaries and promotion evidence: pass.
- Medium/high split work-pack: pass.
- Task-local SWUs and write scopes: pass.
- Algorithmic detail and failure behavior: pass.
- One parent and acceptance boundary per SWU: pass.
- First-unit candidates and no-selection posture: pass.
- Validation surface per delivery slice: pass.
- Protected/public/canonical boundaries: pass.
- Second-writer removal: pass.
- Local-only/integrated lane separation: pass.
- Task Session closeout synchronization: block, explicitly owned.

## Technique activation trace

| Technique | Activation reason | Output | Readiness effect |
|---|---|---|---|
| abstraction-level guard | plan mixed architecture, task, and runtime ownership | retained plan/SWU level; no source design rewrite | pass |
| recomposition proof | split conformance seams risk hidden glue | owner-complete composition above | pass |
| evolution profile | external contracts will evolve by version/receipt | fixture-admission boundary is the smallest extension seam | pass |
| boundary-object check | receipt/artifact/journal terms cross owners | explicit artifact-ref and ACI-receipt distinction | pass |
| requisite-variety check | local-only and integrated failures differ | two non-interchangeable lanes | pass |
| premortem | high-risk authority integration | second-writer and compatibility-by-shape guards | pass |
| set-based tournament | no competing architecture remains after option A | skipped; reopening binding options would violate the accepted decision | n/a |

## Premortem

Most likely failure: a worker sees the local Node fixtures and implements a
“temporary” integrated journal or canonicalizer, then later treats passing
shape tests as ACI compatibility. Guardrail: `SWU-ARE-002` is non-selectable,
external vectors require owner admission, and the local-only guard blocks ACI
identity/claims before calls.

## Evolution profile and deferred complexity

Expected evolution is versioned external ACI/Bus/ACP/APT contracts and
additional conformance profiles. The smallest extension boundary is the
admitted fixture manifest in `SWU-ARE-016`. Generic plugin registries,
multi-runtime canonicalization frameworks, automatic schema translation,
general AntiBiasVector machinery, and public packaging are deferred because no
current evidence requires them.

## Frame-expiry note

This optimization expires if the binding owner supersedes option A, ACI changes
its sole-writer/canonical-acceptance contract, or another accepted architecture
moves semantic derivation into ACI. Any such event requires Invoke Design
refresh before plan execution.

## Navigation

- Start here: [`WORK-PACK.md`](WORK-PACK.md).
- Local-only candidate, still unselected:
  [`TASK-ARE-ACI-CONFORMANCE-001.md#swu-are-019--local-only-non-integration-guard`](work-pack/tasks/TASK-ARE-ACI-CONFORMANCE-001.md#swu-are-019--local-only-non-integration-guard).
- Integrated candidate, externally blocked:
  [`TASK-ARE-ACI-CONFORMANCE-001.md#swu-are-016--external-conformance-fixture-admission`](work-pack/tasks/TASK-ARE-ACI-CONFORMANCE-001.md#swu-are-016--external-conformance-fixture-admission).
- Do not run Task Session until one candidate is selected and its exact closeout
  synchronization contract passes.
- Next route: `deferred`; on new external evidence use
  `invoke:refresh:proposal-only` to reassess gates, or open an explicit owner
  selection/closeout-binding route for the local-only candidate.

The Distill pass establishes plan coherence only. It grants no implementation,
compatibility, effect, promotion, or successor authority.
