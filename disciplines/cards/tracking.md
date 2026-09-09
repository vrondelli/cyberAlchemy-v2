# Tracking

Status: candidate
Steward: CyberAlchemy v2 authority owner (discipline-governance route)
Kind: instance of [CAV2-D50 discipline](../../authority/definitions/DEFINITIONS.md#cav2-d50-discipline)
Catalog: **private-parent** (cyberAlchemy-v2) — must NOT be routed into the public Arcanum catalog

## Purpose

The recurring, cross-capability practice of keeping the **governance-lifecycle
ledger** honest: logging open authority-lifecycle items — owed promotions, owed
decision-records, open OQs, drift remediation, schema gaps — as append-only
entries and routing each to its owner until resolved. It is the practice that
**unifies the scattered authority-side trackers** (promotion queue, drift-audit,
OQ-N, decision records) over one governance ledger.

## Scope (the pin)

**Authority-lifecycle STATE only** — what is open/pending in the authority layer's
own lifecycle. **NOT** operational/project work; that is Craft (`CAV2-D20`). The
*subject* axis (authority-lifecycle vs work) is the wire that keeps tracking and
Craft orthogonal (`CAV2-D16` typed coupling / `CAV2-D29` axis orthogonality);
naming it is load-bearing — **without this pin, tracking collapses into Craft.**

## Boundary (forbidden_collapse)

Tracking must **not** collapse into:

- **Craft method (`CAV2-D20`)** — Craft is the operational-**work** ledger; tracking is the authority-**lifecycle** ledger. Same shape, orthogonal subject.
- **the `ledger` primitive** (`CAV2-D26` / the deferred unified `ledger`) — tracking is the *practice* that maintains a ledger, not the ledger *mechanism*.
- **a constitution** — tracking is *validated by* one; per AUTHORITY-MODEL non-collapse rule 4, a discipline cannot author a constitution.
- **the promotion queue (`CAV2-D13`), the drift-audit, or observability** — tracking is the *unifying discipline over* the governance ledger, not a duplicate of any single tracker.
- **operational work** — authoring tracking entries is work, but the discipline-as-kind is governance.

It can recommend routes; it cannot define terms, author constitutions, or promote anything.

## Self-application guard (`CAV2-D30`)

Tracking tracks the governance system's **own** to-dos → bounded recursive
self-application. Each loop carries a label, a boundary, a reviewer, and a way
back, so the tracker-of-trackers cannot recurse unboundedly.

## Evidence

- [Definition drift audit](../../authority/definitions/DEFINITION-DRIFT-AUDIT.md) — definitions-side remediation + undefined-terms tracking (one scattered surface).
- [Authority model OQ-1/OQ-2](../../authority/AUTHORITY-MODEL.md) — open governance questions tracked per-doc.
- [Promotion policy / authority promotion queue](../../authority/promotion-policy.md) — pending-promotion tracking (`CAV2-D13`).
- [Authority-object schema proposal](../../ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md) — gaps G1–G9 tracked as an open list.
- [Non-collapsing-discipline validator handoff](../development/2026-06-23-non-collapsing-discipline-validator-HANDOFF.md) — the deterministic validation route for this discipline's own non-collapse.

Maintenance signal: these governance-lifecycle to-dos recur across
definitions/constitution/discipline/decision routes and are currently
**scattered** (drift-audit, OQ-N, promotion queue, decision records, proposal
gaps) — the drift/rework risk a single unifying practice addresses.

## Validation

- Mode: **mixed** (prose-review now; validator later)
- Now (review-mode): non-collapse validated against `CAV2-D22`/`D29` + `forbidden_collapse` — **PASS with the scope-pin** (`tracking ⊥ Craft` on the subject axis).
- Later (deterministic): the **SMT/FOL non-collapsing-discipline validator** (handoff) — encodes kinds as schema-typed records, decides orthogonality + relative non-thinness with counter-witnesses; gated by OQ-1 (schema **G2** stabilization).
- Latest result: candidate; review-mode non-collapse PASS.

## Quality Bar

A useful tracking entry must:

- be authority-lifecycle state, not work (the scope pin),
- log to an **append-only** ledger (`CAV2-D26`), never overwrite,
- name the owning route for each open item,
- carry the `CAV2-D30` self-application guard when tracking the governance system itself,
- recommend routes, never promote.

## Promotion Guardrail

Candidate only; evidence cannot self-promote. Advancing past candidate requires the
Growth Rule — a next route naming owner, evidence, validation surface, and mutation
boundary: (a) the SMT/FOL non-collapse validator (validation surface, OQ-1-gated)
and (b) a validating constitution rule (`constitution-governance`). The deferred
`ledger` primitive promotion is a related dependency (the mechanism tracking
maintains). **Do not route into the public Arcanum catalog** — private-parent.
