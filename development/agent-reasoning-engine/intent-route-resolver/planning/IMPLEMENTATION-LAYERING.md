---
module: intent-route-resolver
version: current
status: candidate
updatedAt: 2026-07-30
docType: implementation-layering
---

# Implementation Layering: Intent Route Resolver

## Purpose

Keep the first implementation to the smallest deterministic advisory relation,
then promote only when evidence justifies live catalog, host, UX, and quality
claims.

## Target and scope

- Target: private Agent Reasoning Engine child package
- Current state: specified and designed; no resolver implementation
- Selected start/stop window: L0 portable adapter witness

## Layer decision table

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion decision |
|---|---|---|---|---|---|---|
| L0 | After this layer, we know whether a generic JSON intent plus a frozen finite catalog can produce deterministic, honest route dispositions through a portable add-on boundary. | dependency-free package, JSON port, selected-local mapper, literal fixtures, canonical receipt, Node/Chromium witness | request/catalog validation, explicit predicates, dominance, four-kind disposition, one clarification, replay, zero-permission manifest, browser conformance | model projection, discovery, persistence, consumer host/UI, execution | exhaustive tests, order invariance, zero-call/import boundary, materialized witness, byte-identical Node/Chromium vectors | continue, revise algebra/portability, or stop |
| L1 | After this layer, we know whether the relation composes with one owner-preserving consumer adapter. | fixture-backed Augmentor projection and ResonantOS host decision seam | admitted catalog compiler contract, immutable host decision, approval separation | production adapters, concurrency, release | contract fixtures and host-owner receipt | bind a real adapter, narrow, or stop |
| L2 | After this layer, we know whether routing quality and degraded behavior are credible. | governed labeled corpus plus missing-capability and ambiguity regimes | evaluation owner, confusion/error-cost evidence, catalog drift/revalidation | packaging and production claims | accepted metrics and browser acceptance owned outside the resolver | harden, remediate, or stop |
| L3 | After this layer, we know whether packaging and product rollout are credible. | versioned private package and accepted ResonantOS add-on integration | compatibility, rollback, observability, consumer release gates | general/global router claims | release-owner and product-owner receipts | pilot, package, or defer |

## Non-regression guardrails

- Later layers preserve `authority_effect: none`.
- Ambiguity may become more informative but cannot be silently converted to
  candidate or execution.
- A host adapter cannot move route decision, approval, run truth, or execution
  into Augmentor or the resolver.
- Live catalog compilation cannot weaken frozen digest/version/owner checks.
- Quality or browser evidence cannot promote semantic truth or effect authority.

## Recommended next layer

- Next layer: L0
- Decision unlocked: whether the core advisory relation is deterministic and
  useful at all
- Major deferral: every ResonantOS/Augmentor product mutation and product-browser claim

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
