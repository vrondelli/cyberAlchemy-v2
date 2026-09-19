# Ontology-v2 Validator Repair Refresh

## Outcome Brief

This Refresh packages one exact validator repair without changing the accepted package or any installed ontology target. The staged candidate preserves the stale-reference diagnostic and makes the wrong-generation hostile reach its intended rollback-generation mismatch; the live candidate replay passes all 37 hostile controls, and the ordinary live ontology validator passes all 24 checks.

- Objective: close the mechanical post-apply replay prerequisite for WP-RMT-002.
- Result: a complete one-target proposal package is staged and locally validated.
- Why it matters: the parent can independently audit one frozen package and request exact owner acceptance without reopening ontology semantics.

## Boundary and Next Decision

- Changed: files only inside this repair-package root, including an immutable preimage, exact staged postimage, regression, reports, and validation evidence.
- Unchanged: the accepted apply package, all five installed ontology-v2 targets, candidates, existing receipts, registry, Craft ledger, Git, authority, admission, PromotionRecords, promotion, publication, release, deployment, and production state.
- Open questions: none inside Refresh authoring; independent audit and exact owner acceptance remain outside this helper lane.
- User decision: fresh exact-byte acceptance must bind the terminal receipt and its pre-receipt inventory before any apply.
- Next action: the Goal parent independently audits this package, requests owner acceptance, and only then routes a separately authorized one-target apply.

## Technical Details

## Invoke Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: pass
- Phase status basis: proposal artifacts complete; zero Refresh-authoring blockers
- Handoff readiness: gated
- Mode contract: `arcanum/spells/invoke/refresh.md`
- Outputs: `refresh-report.json`, `REFRESH-PATCH-PROPOSAL.md`, `repair-manifest.json`, material package and receipt
- Mutation mode: proposal-only
- Source signals: three; one blocker opened and two evidence additions
- Target artifacts: exactly one accepted-package validator
- Proposed changes: `2b27e086.../149061` to `985e4c54.../149370`
- Applied changes: none
- Material package: staged and validated, target-inventory digest `817ef12b2ae3261b578b82570423ca984fd786363cd1488becabf1e9f3f04bb0`
- Mutation ready: false
- Dispatch techniques: sequence, concrete-path evidence, artifact-contract bridge, validation loop, owner-boundary check, execution-receipt handoff, observability grouping
- Distill validation: skipped because the repair is already one exact target and one independently reviewable behavior change
- Blockers by scope: Refresh authoring 0; apply authorization 1; target lifecycle 1; audit 1
- Next route: independent exact-byte audit, owner acceptance, one-target apply, post-apply replay

## Evidence Summary

- Original validator: expected exit 1 with `V2_HOSTILE_SURVIVED:promotion-wrong-generation-preimage:V2_PROMOTION_ROLLBACK_REF_STALE`.
- Candidate validator: exit 0, `37/37` hostiles, wrong-generation mapped to `V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH`, stale ref retained as `V2_PROMOTION_ROLLBACK_REF_STALE`.
- Ordinary live validator: exit 0, 24 checks, v2 result pass.
- Installed baselines: 5/5 exact and unchanged.

This package proves only proposal authoring and staged validation. It grants no apply or lifecycle authority.
