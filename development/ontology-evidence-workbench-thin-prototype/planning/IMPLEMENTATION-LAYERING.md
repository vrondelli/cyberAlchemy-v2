---
module: ontology-evidence-workbench-thin-prototype
version: current
status: approved-plan
updatedAt: 2026-07-29
docType: implementation-layering
---

# Implementation Layering: OEW Thin Prototype

## Target and scope

- Target: first local browser-testable OEW Poker-Team witness
- Scope: private feature/prototype workflow
- Current state: partially implemented UI and adapter, no final Vite artifact or
  browser witness

## Layer decisions

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether the existing OEW UI can resolve its exact evidence URLs and build from the pinned Understand-Anything workspace with strict TypeScript and zero new package manifests. | exact typed executable-loader admission plus one repeatable Vite build producer | SWU-OEWTP-001 and 002 | gateway, browser, independent acceptance verification | typed tests explicitly discovered; exact relative-base composed request probe; zero TS errors; retained Vite dist handle; before/after manifest inventory | continue to L1, repair, or stop |
| L1 | After this layer, we know whether one reviewer can complete the Poker-Team evidence journey in local Chromium with bounded current evidence. | exact gateway plus browser acceptance and read-only closure audit | SWU-OEWTP-003, 004, and TASK-OEWTP-VERIFY | independent immutable verification, full UX matrices, operations | token/cookie/path/network negative tests; thirteen named browser assertions; bounded receipt; teardown proof | retain as prototype, repair, or stop |
| L2 | After this layer, we know whether the prototype evidence is repeatable under independent governance and broader degraded-mode checks. | independently verify the immutable thin receipt and rebind the preserved historical lane | independent build/browser receipt verification, accessibility and responsive expansion, failure matrix | release and scale | separately owned current receipts | harden, narrow, or stop |
| L3 | After this layer, we know whether packaging or rollout is justified. | separately approved release candidate | packaging, deployment, operations, support | generalized future scale | release-owner evidence | pilot, package, or defer |

## Value/cost boundary

- L0 value: removes the direct measured blocker and proves no new runtime root is
  needed. Cost stays in three modules, two existing source manifests, and one
  build producer.
- L1 value: creates the first user-visible automated witness. Gateway and
  browser remain separate because each has an independently testable failure
  boundary; the closure audit is read-only.
- L2/L3 add less value to the first-prototype decision than completing L1, so
  they remain outside the active window.

## Non-regression guardrails

- L1 preserves L0 strictness, exact input binding, and zero-new-manifest proof.
- L2 preserves L1 fail-closed routes, visible authority ceiling, no outbound
  requests, and teardown.
- No layer may silently write the old OEW package, ontology, authority,
  Inventory, Poker-Team, Arcanum, or a package manifest.
- Promotion always cites a predecessor receipt; preference is insufficient.

## Recommended next layer

- Next layer: L0
- First selected unit: `SWU-OEWTP-001`
- Key decision: whether the measured typed overlay can close without changing
  runtime topology or UI semantics
- Major deferral: browser reachability waits for a passing typed/build handle
