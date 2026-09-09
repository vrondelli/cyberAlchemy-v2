---
decisionId: DEC-CAV2-IOLM-00C-B-CROSS-FEATURE-001
scope: SWU-IOLM-00C-B
status: closed
blocking: false
selected: route-upstream-cross-feature-support
openedAt: 2026-07-20
resolvedAt: 2026-07-20
---

# Decision Gate — IOLM Cross-Feature Candidate Graph

## Blocked work

`SWU-IOLM-00C-B` requires a typed connection crossing the CyberAlchemy Method
and Craft seed features. The live DomainSpec minted compiler rejects every
cross-feature edge with `CROSS_FEATURE_UNSUPPORTED`, and its regression test
states that cross-feature edges remain unsupported until a separate
multi-feature design is admitted.

No 00C-B prototype source was created.

## Decision question

How should IOLM obtain the cross-feature candidate graph required by 00C-B
without silently weakening its proof or mutating DomainSpec outside authority?

## Resolution

The operator selected option 1 on 2026-07-20: route cross-feature support
through the existing DomainSpec v2 owner/work-pack boundary. The two-feature
IOLM done criterion remains unchanged, and 00C-B stays blocked until an upstream
support receipt exists.

The first upstream Task Session audit stopped before implementation because the
BTE manifest contradicts its task, Distill, and wave contracts about which SWU
is dependency-ready. Its receipt is:

`[repo-root]/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/session-evidence/SWU-BTE-001/execution-receipt.json`

## Options

### 1. Route upstream cross-feature support — recommended

- Benefit: preserves the two-feature done criterion and keeps the minted compiler
  as the real conformance authority.
- Cost/risk: requires a separate bounded DomainSpec design/task, owner review,
  compiler/schema/tests, and a new receipt before IOLM resumes.
- Choose when: the two-feature integration proof is load-bearing.
- Downstream impact: 00C-B remains blocked until the upstream receipt exists;
  00C-C and L0A remain untouched.

### 2. Amend 00C-B to one minted feature with two conceptual namespaces

- Benefit: fastest path through the existing compiler and current IOLM write
  scope.
- Cost/risk: no longer proves a connection across two minted features; the
  work-pack, SPEC, layering, and dispatch acceptance language must be amended.
- Choose when: conceptual CyberAlchemy/Craft separation is sufficient for L0C.
- Downstream impact: requires an apply-approved IOLM plan amendment, then a new
  00C-B context pack.

### 3. Defer 00C-B until the compiler boundary changes elsewhere

- Benefit: preserves both current contracts without creating new upstream work.
- Cost/risk: W0C and the candidate UI substrate remain blocked indefinitely.
- Choose when: this learning-map stream should not own or sponsor compiler
  capability work.
- Downstream impact: stop here; no 00C-C, broader UI, or authority rebind work.

## Recommendation

Choose option 1. The cross-feature criterion is explicit, independently
testable, and likely the point of the two seed features. Option 2 is viable only
if the product owner intentionally weakens that proof through a governed plan
amendment; doing it implicitly would be a false pass.

## Source evidence

- `work-pack/tasks/TASK-IOLM-00C-CANDIDATE-SUBSTRATE.md#SWU-IOLM-00C-B`
- `projects/domainspec-v2/impl/tools/minted-project/compiler.ts#compileMintedProject`
- `projects/domainspec-v2/impl/tools/tests/minted-project-compiler.test.ts`
- `projects/domainspec-v2/impl/spec/minted-project/feature.schema.json`

## Remaining blockers

- The DomainSpec BTE package requires an Invoke Refresh that reconciles its SWU readiness statuses and names exactly one dependency-ready unit.
- 00C-B still requires a passing upstream cross-feature-support receipt before prototype mutation.
- `G-DSV2-SG` remains independently open for L0A only.

## Historical non-decision option

Before resolution, **Explain / more context** could expand the evidence,
reversibility, and downstream consequences without resolving the gate. The
recorded option-1 selection now controls continuation.
