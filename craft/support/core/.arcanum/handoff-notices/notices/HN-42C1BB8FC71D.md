# Handoff Notice: Victor: canonical EVF explainer, formal obligations, and remaining gates

- Code: `HN-42C1BB8FC71D`
- Status: `open`
- Type: `session-handoff`
- To: Victor (`person`)
- From: Codex workspace thread (`agent`)
- Project scope: `projects/domainspec-v2/development/evolvable-validation-framework`
- Created: `2026-08-23T23:06:51.757376Z`
- Digest: `42c1bb8fc71d7b8b7c1f6741f2cd9c8cec30c47c64f11c6e205c3eb363ad1a05`
- Remote availability: `unverified`

## Why Now

EVF now has one canonical plain-language entry point that explains its purpose beyond relationships, places formal obligations inside the evidence chain, and separates current evidence from authority. The earlier Victor handoff also contains runtime-owner and Git-transport calls that have since been resolved, so an immutable successor is needed.

## Key Points

- 1. Canonical entry point - the new EVF README is now the primary explanation and navigation document. It defines EVF as an evidence system that connects a DomainSpec claim to a normalized representation, formal obligation, implementation binding, executable or formal check, mutations, evaluator verdict, digest-bound receipt, and bounded claim.
- 2. Relationships are the first proving ground, not the entire product - the strongest implemented path starts with one Rule --[enforces]--> Operation edge because it crosses every evidence boundary in a small unit. The same pattern may later cover node invariants, data constraints, temporal ordering, graph laws, consumer contracts, runtime conformance, and observability, but those directions are not claimed as already implemented.
- 3. Formal obligations are inside EVF - an obligation states what must be true, while a test or bounded model supplies scoped validation evidence and a theorem supplies proof under explicit assumptions. EVF preserves those distinctions: a test is not a theorem, an Alloy result is bounded, and a Lean theorem is not runtime conformance without an exact implementation binding.
- 4. The README uses one aligned example ladder - L0 follows the key-and-door enforces slice, L1 adds repeatability across two frozen Financial Settlement slices, and L2 adds provider-neutral reachability evaluation across Souffle and Alloy plus an external IOLM owner boundary. Every rung states what it demonstrates and what it does not prove.
- 5. Runtime repair calls are resolved - the Dispatch Spec lifecycle owner, Orchestrate runtime lifecycle owner, and generated-package owner accepted the exact 53-path candidate with no exceptions. Public Arcanum main is verified at 8ccc16e5c6abf06410046e5e6db50c8062b7742b, and private parent master is verified at c7eeafd48becafa48eb09a88d138640599097cc1. Those acceptances and transports do not open product execution or release gates.
- 6. The current EVF evidence ceiling remains bounded - candidate-local L0 and L1 results and one selected L2 reachability property are supported. Cycle, closure, broader graph properties, unbounded correctness, external consumer integration, and L3 backend completeness are not established by those results.
- 7. The original lifecycle gates remain separate - independent BTE admission and freeze receipts, private IOLM DSC-A, proposal acceptance, canonical apply, immutable-frontier readiness, and any release or deployment decision remain unresolved or separately gated.
- 8. Transport status of this update - the earlier accepted runtime repair and chapter evidence were pushed, but the new canonical README and this successor notice are new local workspace changes. This notice does not claim that Victor or any remote reader can access them until a separate Git transport is authorized and verified.

## Open Calls

- [open] Independent BTE admission, freeze, and catalogue owners: Will the owners independently issue the exact original BTE validation, formation, profile, node-pattern, 17-relationship, and six-catalogue receipts, or explicitly decline and reroute them?
- [open] Private IOLM product owner: Will the owner satisfy DSC-A with an exact passing consumer receipt, or issue a separate decision changing that predecessor?
- [open] Proposal acceptance owner: After prerequisite review, will the owner accept or reject the exact 13-postimage proposal package?
- [open] Canonical apply owner: If and only if the proposal and prerequisites are accepted, will the owner separately authorize the exact canonical apply?
- [open] Independent implementation-readiness owner: After any authorized apply, will the owner audit the then-current immutable frontier and return a fresh independent readiness verdict before execution selection?
- [open] Release, deployment, and promotion owners: After the evidence and lifecycle gates are resolved, will the appropriate owners separately authorize any release, deployment, or broader promotion?

## Boundaries

- Use the new README as the canonical explanation and navigation entry point; use its linked contracts, receipts, and owner decisions for exact technical and lifecycle claims.
- Preserve claim <= proof. Do not convert a passing test, bounded model, formal theorem, runtime observation, or joined receipt into a stronger evidence kind than it actually is.
- Do not treat relationships as EVF's only possible scope, and do not claim that the broader listed validation categories are already implemented.
- Do not let EVF invent missing semantics or author another owner's BTE, IOLM, readiness, apply, release, or deployment evidence.
- The 13 staged postimages remain proposal evidence and are not canonical applied targets merely because they are committed inside a proposal run directory.
- The 49 format findings remain exact baselined debt; they were made drift-detectable, not repaired.
- Keep private DomainSpec and cyberAlchemy-v2 material out of public Arcanum surfaces.
- This notice and locator are communication evidence only. They authorize no implementation, apply, dispatch, task selection, Git transport, publication, readiness, promotion, deployment, or release.

## Next Actions

- Victor: Read the canonical EVF README first, then use the linked layering, work-pack, receipts, and prior notice when assigning or rerouting the six remaining owner calls.
- Independent BTE and IOLM owners: Return exact independently authored receipts or explicit decisions that preserve the unresolved status; do not substitute EVF development evidence for owner evidence.
- Proposal, apply, and readiness owners: Act in order and independently: proposal decision first, separately authorized canonical apply second, and fresh immutable-frontier readiness audit third.
- Release, deployment, and promotion owners: Consider transport or release only through a separately authorized route after the required lifecycle and readiness gates are satisfied.
- EVF documentation owner: Keep the README's current-maturity section synchronized with accepted receipts without rewriting historical evidence or inflating candidate-local results.

## Source References

- `projects/domainspec-v2/development/evolvable-validation-framework/README.md` — Canonical plain-language EVF explanation, formal-obligation boundary, example ladder, maturity, and navigation.
- `.arcanum/handoff-notices/notices/HN-AE40D0818B4F.md` — Superseded Victor handoff whose runtime-owner and Git-transport calls are updated here.
- `projects/domainspec-v2/development/evolvable-validation-framework/IMPLEMENTATION-LAYERING.md` — Canonical L0 through L3 decision questions, evidence ceilings, and boundary rule.
- `projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md` — Observed evidence overlay, task boundaries, blockers, consumer handoff, and claim ceilings.
- `projects/domainspec-v2/development/evolvable-validation-framework/dispatch-runs/20260823T140821Z-p0-owner-evidence-review/runtime-repair-candidate/OWNER-ACCEPTANCE-RECEIPT.json` — Three-of-three exact runtime lifecycle acceptances and all retained non-authorizations.
- `projects/domainspec-v2/development/evolvable-validation-framework/refreshes/20260823T124309Z-l3-17-signature-proposal-only/REFRESH-REPORT.md` — Proposal-only 13-postimage package and explicit apply and readiness blockers.
- `projects/domainspec-v2/development/evolvable-validation-framework/decision-runs/20260823T201735Z-dirty-baselines/PROOF-ENGINE-RECONCILIATION-RECEIPT.json` — Development-only BTE evidence: 42 of 42, 17 relationships, and 91 coverage points.
- `projects/domainspec-v2/development/evolvable-validation-framework/decision-runs/20260823T201735Z-dirty-baselines/FORMAT-HONESTY-BASELINE-RECEIPT.json` — Exact 49-item format baseline, focused validation, and retained debt boundary.
- `git:arcanum@8ccc16e5c6abf06410046e5e6db50c8062b7742b` — Verified public Arcanum main tip for the accepted runtime repair.
- `git:domainspec-core@c7eeafd48becafa48eb09a88d138640599097cc1` — Verified private parent master tip for the runtime integration and EVF chapter evidence.

## Suggested Next Route

- Capability: `Victor`
- Mode: `read-canonical-explainer-and-reroute-open-owner-calls`
- Target: `the six unresolved EVF lifecycle, apply, readiness, and release calls listed in this successor notice`
- Authorization: `not-granted`

## Terminal Receipt

- `projects/domainspec-v2/development/evolvable-validation-framework/dispatch-runs/20260823T140821Z-p0-owner-evidence-review/runtime-repair-candidate/OWNER-ACCEPTANCE-RECEIPT.json`

## Supersedes

- `HN-AE40D0818B4F`

## Resolution Reference

- `projects/domainspec-v2/development/evolvable-validation-framework/dispatch-runs/20260823T140821Z-p0-owner-evidence-review/runtime-repair-candidate/OWNER-ACCEPTANCE-RECEIPT.json`

## Authority Boundary

This notice is communication evidence only. The notice and locator grant no permission, authenticate no actor, resolve no open call, select no task, and authorize no mutation, dispatch, Git publication, or external delivery.
