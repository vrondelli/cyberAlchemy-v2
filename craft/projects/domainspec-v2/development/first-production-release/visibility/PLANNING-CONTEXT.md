# First-production-release visibility planning context

Status: approved implementation context

## Objective

Make the DomainSpec-v2 first-production-release process legible as an operational
roadmap: what is closed, what is open, what blocks release, what evidence owns each
claim, and what must happen next. The view must stay synchronized with Craft and the
existing research/roadmap projection through one deterministic refresh command.

## Authority boundary

This feature does not decide release state.

- `projects/domainspec-v2/.craft/ledger.yml` owns continuation state.
- `../craft/expected-node-edge-manifest.yml` owns the candidate node/edge/frontier
  projection.
- `../ROADMAP.md` explains the operational route.
- `../research/2026-07-12-expanded-capability-frontiers/{research,findings}.md`
  owns the source-bound research synthesis.
- The generated JSON and HTML are disposable read models. They never become a
  second ledger and never authorize production.

## Confirmed constraints

- Scope is DomainSpec-v2 only.
- Preserve the accepted FPR path and its exact 14-step Body War pilot.
- Show architecture, graph validation, code generation, generated verification,
  structural implementation validation, and directional cross-graph conformance.
- Prefer the stricter justified route, without speculative hardening.
- Keep private DomainSpec material inside the private repository boundary.
- Do not infer completion from file existence, Git state, or a green visual.
- New research frontiers continue through the existing persistent protocol and
  human-confirmed subagent dispatch gate.

## Complexity and template choice

Complexity is medium: the feature crosses Invoke planning, Craft state, a Whisper
composition, deterministic generation, testing, and a governed handoff, but it does
not require a cross-repository migration or irreversible state change. The selected
Invoke shape is a split work-pack with five single-work-unit tasks and four waves.

## Selected techniques

`sequence`, `scu_swu_reduction`, `recomposition_proof`, `artifact_contract_bridge`,
`state_namespace_boundary`, `owner_boundary_check`, `concrete_path_evidence`,
`validation_loop`, `handle_handoff`, `residue_ledger`,
`execution_receipt_handoff`, and `observability_grouping`.

## Non-goals

- No new database, service, or stateful dashboard backend.
- No mutation of FPR node state from the HTML.
- No automatic acceptance, scheduling, verification, or closure of a frontier.
- No production-readiness claim.
- No replacement of Craft, the roadmap, the research package, or owner gates.
- No CI requirement in this first slice; `--check` is the future CI-ready seam.

## Completion contract

The feature is complete when the plan package validates, the generator deterministically
produces the JSON and self-contained HTML from the two authoritative inputs, tests
prove referential/count/source invariants and stale-output detection, Craft indexes the
new artifacts without changing the FPR gate or next move, and a browser inspection
confirms the main graph/detail/filter flow.
