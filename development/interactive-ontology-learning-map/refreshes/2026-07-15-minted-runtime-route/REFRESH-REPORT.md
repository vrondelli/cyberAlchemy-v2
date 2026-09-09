# Invoke Refresh — Minted Runtime Route

- Evidence date: `2026-07-15`
- Mutation mode: `proposal-only`
- Phase status: `flag`
- Target: `cyberAlchemy-v2/development/interactive-ontology-learning-map/`
- Recommended posture: code-first candidate graph, later authority rebind

## Outcome

The learning-map plan still exists and remains structurally coherent, but its current
execution route is stale in one important way: it blocks every prototype write until
the full `FPR-01 -> FPR-04` authority chain emits the exact bounded `Sg`.

That assurance-first route is still valid and still blocked. It is no longer the only
technically credible route. DomainSpec v2 now has a tested minted-project contract,
resolver, compiler, generated views, minter, and conformance harness. Those artifacts
can support a **candidate** learning graph now, provided the graph never claims to be
the authoritative FPR `Sg` and every generated artifact carries its provenance posture.

The refresh therefore recommends one graph contract and one UI/read-model pipeline
with two provenance postures:

1. `candidate`: compiled from the minted-project runtime for learning-product work;
2. `authoritative`: later rebound to an owner-issued FPR `Sg` and receipts.

This is not a recommendation to build two graph engines or two incompatible mental
maps. It is one adapter boundary whose source and authority receipt can change.

No existing target artifact was changed. Applying the recommendation requires an
explicit posture decision followed by an `invoke refresh` in `apply-approved` mode.

## Source Evidence

| Evidence | Verified claim | Boundary |
| --- | --- | --- |
| `.arcanum/inventory/entries/domainspec-v2-retired-orchestration-guard-proof-refresh-synthesis.md` | The retired-reference guard has an accepted zero-violation receipt. | Inventory is a read model; the accepted task receipt remains authority. |
| `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md` | The authority census passed with 21 sources, 12 unresolved disagreements, and five owner queues. | The task selected no baseline and authorized no production state. |
| `projects/domainspec-v2/development/first-production-release/foundation-execution/WORK-PACK.md` | FPR-01 is incomplete; FPR-02 through FPR-04 remain predecessor-blocked. | Only their existing owners may close those nodes or issue the FPR `Sg`. |
| `projects/domainspec-v2/impl/spec/minted-project/` | Machine-readable project, feature, node, connection, graph, formation, view, and receipt contracts exist. | These are implementation contracts, not FPR release authority. |
| `projects/domainspec-v2/impl/tools/minted-project/` | Resolver, compiler, views, minter, and schema validation exist. | Candidate tooling cannot promote its output by itself. |
| `projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/task-sessions/20260715-swu-mnp-006/TASK-SESSION-RESULT.md` | Cross-package conformance passed and records `release_admission: not-granted`. | Conformance proves behavior, not release admission. |
| `projects/domainspec-v2/authority/decisions/2026-07-15-minted-project-admission-owner-route.md` | Admission was explicitly deferred to prioritize implementation code. | Candidate use must not be described as admitted or release-ready. |

## Target Inventory

The proposed delta affects the current execution contract across:

- `SPEC.md`
- `ARCHITECTURE-BUNDLE.md`
- `INVOKE-PLAN.md`
- `IMPLEMENTATION-LAYERING.md`
- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- selected task, wave, context, traceability, Dispatch, and Distill artifacts

Historical `INVOKE-DEFINE.md`, `INVOKE-DESIGN.md`, and earlier dated refresh receipts
remain immutable evidence.

## Typed Refresh Signals

| ID | Type | Current consequence | Safety |
| --- | --- | --- | --- |
| RFS-IOLM-101 | `blocker_resolved` | The projected retired-reference guard blocker is closed by accepted evidence. | safe status correction |
| RFS-IOLM-102 | `status_changed` | `SWU-FPR01-001` passed, but FPR-01 itself remains open pending dispositions, baseline, validator, and ratification. | safe status correction |
| RFS-IOLM-103 | `evidence_added` | A tested minted-project runtime and conformance surface now exist. | safe evidence addition |
| RFS-IOLM-104 | `status_changed` | Minted-project release admission is explicitly `not-granted` and deferred. | safe boundary addition |
| RFS-IOLM-105 | `artifact_drift` | The plan's all-or-nothing pre-L0 block does not represent the now-viable candidate implementation posture. | needs review |
| RFS-IOLM-106 | `route_changed` | The plan may preserve assurance-first execution or add a code-first candidate posture with later authority rebind. | needs decision |
| RFS-IOLM-107 | `blocker_opened` | A posture decision is required before the target plan can be recomposed safely. | needs decision |

## Proposed Change

Apply the detailed patch contract in [REFRESH-PATCH-PROPOSAL.md](REFRESH-PATCH-PROPOSAL.md).
The recommended option is the code-first candidate posture because it satisfies the
operator's stated priority for implementation while retaining an explicit authority
boundary.

The smallest useful first implementation unit would:

1. mint a private, machine-readable learning project;
2. add one file per concept node and one file per typed connection;
3. compile the same records into a DomainSpec graph;
4. render graph, hierarchy, and table from one shared read model;
5. stamp all receipts and UI surfaces with `candidate` provenance;
6. keep the FPR `Sg` adapter and authority rebind as a later gate.

## Applied Changes

- Created this dated proposal-only refresh package.
- Recorded the full refresh dispatch and machine-readable report.
- Did not change current plan state, implementation state, FPR state, definitions,
  ontology authority, Craft state, or publication state.

## Skipped Changes

- No existing learning-map artifact was patched.
- No prototype node, edge, content, UI, or generated view was created.
- No FPR disagreement was resolved and no FPR node was closed.
- No minted-project admission, release, rollout, or migration claim was made.
- No production website host or editorial lifecycle was selected.

## Open Blockers and Decisions

| ID | Status | Owner | Resolution |
| --- | --- | --- | --- |
| `D-IOLM-POSTURE` | proposed / unresolved | operator plus private learning-product plan owner | Choose assurance-first or code-first candidate posture. |
| `G-DSV2-SG` | open | existing DomainSpec FPR owners plus read-only verifier | Required only before an output is represented as the authoritative FPR graph. |
| `FPR-01` | open / census complete | existing FPR-01 owners | Complete dispositions, baseline, validator, and ratification. |
| `FPR-02` | blocked | existing FPR-02 owners | Wait for FPR-01 receipt. |
| `FPR-03` | blocked | existing FPR-03 owners | Wait for FPR-02 receipt and direction decision. |
| `FPR-04` | blocked | existing FPR-04 owners | Wait for FPR-03 and emit the bounded `Sg`, quotient, and retraction. |

`D-WEBSITE` and `D-EDITOR` remain deferred. Neither blocks a repository-local learning
prototype.

## Technique Trace

- `inventory`: resolved repository-local evidence handles before widening to source receipts.
- `context-builder`: retained only selectors needed to distinguish candidate behavior from authority claims.
- `artifact-contract-bridge`: mapped minted-project outputs to the learning-map import boundary.
- `owner-boundary-check`: separated implementation behavior, FPR authority, and private product ownership.
- `state-namespace-boundary`: limited writes to this dated refresh folder.
- `dispatch-spec`: validates the multi-capability route and promotion guardrails.

## Validation

Validation completed on `2026-07-15`:

- JSON parse: `PASS` for `refresh-report.json` and `REFRESH-DISPATCH.json`.
- Dispatch Spec: `VALIDATION=pass`, zero blocks, zero flags.
- Source and target paths: `PASS`; every machine-reported local path resolves.
- Proposal-only scope: `PASS`; no existing target or upstream artifact was changed.
- Whitespace/diff hygiene: `PASS` for the new refresh package.

## Next Route

`decision-gate` for `D-IOLM-POSTURE`, then `invoke refresh` with `apply-approved` if the
code-first candidate posture is selected. Until then, execution remains deferred and
the current assurance-first plan remains the active target contract.

## Residue

- The minted-project runtime proves a candidate substrate, not semantic completeness
  for the full CyberAlchemy Method and Craft corpus.
- The content ontology still needs node/edge instances, source selectors, learning
  journeys, and negative witnesses.
- A later authority rebind must preserve stable concept IDs or provide an explicit
  migration map; provenance labels alone cannot repair identity drift.
- Production website integration remains a separate host architecture decision after
  the repository-local learning loop produces evidence.
