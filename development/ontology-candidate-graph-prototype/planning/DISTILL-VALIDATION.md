# Distill Validation — Ontology Candidate Graph Prototype Plan

Verdict: **PASS for Plan coherence; mutation BLOCKED until one SWU is explicitly
selected and its Task Session preflight passes**

Mode: Standard Distill, two recursive rounds, Proposer/Balancer role
simulation. Repository policy requires a separately presented and confirmed
governed dispatch before spawning subagents. The user approved Plan authoring,
not a subagent dispatch, so this bounded validation preserves the role trace
locally.

## Optimization Target

Find the smallest independently acceptable implementation units that recompose
into the L0–L2 finite candidate prototype while keeping structure, graph law,
policy, projection, evidence, isolation, verification, and authority separate.

Budget: Standard, because no custom Distill budget was requested.

## Role Conversation Trace

### Round 1

- **Proposer:** use eight units and let the final evidence unit both validate
  one receipt and compare two runs.
- **Evidence/assumption:** both checks consume the same terminal-bundle shape.
- **Balancer objection — independent falsifiers:** one bundle can be internally
  valid while two equivalent runs differ; conversely two identically corrupted
  bundles can compare equal. Receipt validity and reproducibility are separate
  acceptance decisions.
- **Reconciliation:** retain `SWU-OCGP-008` as independent single-bundle
  verification and add `SWU-OCGP-009` for two-fresh-root byte comparison.

### Round 2

- **Proposer:** once the Plan passes, execute the L0–L2 chain as one Task
  Session because every dependency is linear.
- **Evidence/assumption:** sequential dependencies remove merge risk.
- **Balancer objection — authorization collapse:** a linear graph does not
  make future units authorized. Each unit changes a distinct contract and its
  terminal evidence may expose a Plan correction.
- **Reconciliation:** keep the deterministic successor chain for navigation,
  but require an explicit human selection, fresh baseline preflight, terminal
  receipt, and Invoke Refresh closeout at every SWU boundary.

Stable disagreement: none. The final pack uses nine SWUs and selects none.

## Atomicity Review

| SWU | Tempting child split | Why retained as one behavior | Verdict |
| --- | --- | --- | --- |
| `001` | parse / validate fields | parsing without contract acceptance has no independently useful result | pass |
| `002` | endpoints / inverse / cardinality | all are table checks producing one edge-grammar decision | pass |
| `003` | closure / cycle | both are one grounding traversal contract; cycle is its fail state | pass |
| `004` | policy binding / disposition | policy binding is required input validation for one disposition | pass |
| `005` | lineage / visible conflict | both fields form one non-composing read view | pass |
| `006` | canonicalize / create-only write / receipt-last | internal steps are inseparable from emitting one valid bundle | pass |
| `007` | digest preservation / denied probe | two independent observations jointly attest one isolation claim | pass |
| `008` | inventory / digest / version checks | all decide whether one terminal bundle verifies | pass |
| `009` | run A / run B / compare | neither run independently proves reproducibility | pass |

Task-shaped SWU count: `0`. Closure-only exemption count: `1`,
`TASK-OCGP-VERIFY-001`, which performs no repository mutation.

## Narrow-First-Unit Check

PASS for candidate boundary; execution remains unselected.

`SWU-OCGP-001` writes only the package scaffold, one carrier module, one test,
and three carrier fixtures. It has no relation meaning, policy, projection,
writer, external call, product integration, or authority effect. Its files can
be removed without migrating state. It is the narrowest reversible trust
increment.

## Recomposition Proof

```text
001 closed carrier
  → 002 edge grammar
  → 003 grounding closure
  → 004 typed disposition
  → 005 O13 research-lineage view
  → 006 canonical create-only bundle
  → 007 governed-input isolation
  → 008 independent receipt verification
  → 009 two-run reproducibility
  → read-only closure review
```

There is no hidden glue:

- `001–003` own candidate structure and graph mechanics, not policy;
- `004` owns only policy disposition with `authority_effect: none`;
- `005` owns only a projection;
- `006` produces evidence but does not certify it;
- `007` observes isolation but not semantic or receipt correctness;
- `008` validates one bundle but does not prove repeatability;
- `009` proves equality for pinned inputs but not ontology completeness;
- the closure task checks the composition and grants no promotion.

## Acceptance-Critical Gaps

| Gap | Treatment | Effect |
| --- | --- | --- |
| no SWU selected | require explicit user selection | blocks all mutation |
| Task Session byte baselines absent | bind at selected-unit preflight | blocks source mutation until current bytes are known |
| runtime artifacts absent | preserve `mutationRuntimeReady=false` | no prototype claim |
| `specializes` owner absent | mandatory indeterminate fixture | blocks specialization admission, not Plan |
| L3 report absent | separate later Plan | no human inspection claim |
| IOLM/Poker Team integration absent | separate product owner work unit | no product repair/acceptance claim |
| promotion route absent | candidate wording only | no canonical ontology claim |

## Plan Quality Checks

- approved source Design and exact digests: pass;
- L0–L3 layering with L3 deferred: pass;
- split medium-complexity work pack: pass;
- exact task, wave, source, receipt, and closeout paths: pass;
- one parent and one primary behavior per mutation SWU: pass;
- independent acceptance and validation command per SWU: pass;
- split analysis and owner recommendation per SWU: pass;
- deterministic successor policy without auto-selection: pass;
- Poker Team read-only boundary: pass;
- public/private and candidate/authority boundaries: pass;
- producer/verifier separation: pass;
- Plan/runtime evidence separation: pass;
- Task Session closeout coverage: pass for Plan; live baseline preflight pending.

## Technique Activation Trace

| Technique | Activation | Result |
| --- | --- | --- |
| abstraction-level guard | Design, task, SWU, run, and authority claims could collapse | each stays in its artifact/lifecycle |
| recomposition proof | nine units risk hidden integration glue | explicit chain and owner exclusions |
| evolution profile | fixture/policy versions will change | closed version fields and unknown-major rejection |
| boundary-object check | receipt, policy result, projection, and ontology could be conflated | distinct types and authority effects |
| requisite-variety check | structural, semantic, persistence, isolation, and determinism failures differ | separate SWUs and failure codes |
| premortem | a “working ontology” label could outrun evidence | closure wording and promotion gate |
| set-based tournament | no competing accepted architecture remains | skipped; Design fixed the target |

## Premortem

Most likely failure: after the O13 happy path passes, the result JSON or static
view is called “the ontology,” and a later adapter treats `policy-pass` as
semantic/product acceptance. Guardrail: the projection and receipts carry
`authority_effect: none`, L3/L4 have no SWU, Poker Team remains read-only, and
the closure task lists the only allowed claim.

## Evolution Profile

Likely evolution is additional candidate-v1 fixtures and later policy versions.
The smallest extension points are the fixture manifest and named finite policy,
not a plugin framework, graph database, learned scorer, generic ontology
language, or product adapter. Those abstractions are deferred until two real
incompatible cases demonstrate the need.

## Frame Expiry

This Distill result expires if:

- Design changes any node/relation/policy contract;
- the owner admits `specializes`;
- Poker Team or IOLM becomes an approved runtime integration;
- Node 22 is no longer supported;
- an authority owner grants a new semantic-admission path.

Such a change requires Invoke Design or Plan refresh before Task Session.

## Navigation

- Start: [`WORK-PACK.md`](WORK-PACK.md).
- First candidate:
  [`TASK-OCGP-CARRIER-001.md`](work-pack/tasks/TASK-OCGP-CARRIER-001.md).
- Exact machine manifest:
  [`swu-manifest.json`](work-pack/swu-manifest.json).
- Execution rules: [`EXECUTION-PACK.md`](EXECUTION-PACK.md).
- Do not run Task Session without an explicit `SWU-OCGP-001` selection.

The Distill pass establishes Plan coherence only. It grants no implementation,
successor, ontology, product, promotion, publication, or production authority.
