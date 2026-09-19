---
decision_id: EVF-PKG-TOPOLOGY-001
status: selected
decision_class: blocker
target_scope: EVF Candidate A planning-material topology
source: invoke-refresh-proposal-only
timestamp: 2026-08-20T10:35:20Z
---

# EVF Material-Package Topology Decision

## Decision question

How should Candidate A bind the material package and its producer receipt
without making either artifact depend on its own final digest?

This decision blocks postimage authoring because it changes the target
inventory, package identities, execution-entry evidence paths, validation
order, and exact approval scope.

## Evidence

- The current inventory includes the canonical material package and its
  producer receipt among the 25 Invoke-owned planning targets.
- The current plan requires one package to bind those 25 targets plus 11
  owner-material targets.
- Every package change requires an exact output digest.
- The validator hashes the package document and emits that digest inside the
  producer receipt.
- No Candidate A artifact declares a non-recursive carrier or inner/outer
  package scheme.

## Option A — Preserve 36 with two envelopes

Use an inner package and receipt over 34 substantive outputs, then use a
run-local outer install envelope and receipt over all 36 canonical targets.
The inner package and receipt become canonical payloads 35 and 36; the outer
package and receipt remain run-local.

- Benefit: preserves the existing 36-target apply and target-37 audit model.
- Cost: introduces two package identities, two scopes, ordered receipt
  production, and additional exact-byte approval bindings.
- Reversibility: high before canonical apply.
- Downstream effect: planning wording and inventories must explicitly define
  the two-envelope topology; fresh review and approval remain mandatory.

## Option B — Keep package evidence run-local

Remove the package and receipt from the canonical target set. Apply 23 planning
postimages plus 11 owner-material postimages as 34 targets; keep the one
material package and producer receipt in the refresh run and point the
execution entry to those durable run-local evidence paths.

- Benefit: matches existing Invoke material-package practice, needs one
  package/receipt pair, and removes the digest cycle entirely.
- Cost: changes the apply denominator from 36 to 34 and the post-audit surface
  from 37 to 35; every affected plan, inventory, entry, and audit statement
  must be regenerated.
- Reversibility: high before canonical apply.
- Downstream effect: prior 36-path approval is retired; fresh 34-path review
  and approval are required.

## Other routes

- **Defer:** preserve the current blocked Candidate A proposal and author no
  postimages.
- **Stop:** stop Candidate A postimage authoring.
- A public Invoke schema/validator extension was rejected: it is outside this
  request, crosses the public Arcanum owner boundary, and is unnecessary while
  EVF-local repairs exist.

## Recommendation

Choose **Option B**. It is the smaller and more conventional evidence model:
material packages describe target mutation from outside the target set. It
avoids nested approvals and receipts at the cost of one explicit denominator
correction, which is safer to make now than to preserve an accidental recursive
topology.

## Selection

- Selected option: `EVF-PKG-B-EVIDENCE-ONLY`
- Source: direct owner reply `1`, interpreted against the immediately preceding
  numbered option list where Option 1 was `EVF-PKG-B-EVIDENCE-ONLY`
- Selected at: `2026-08-20T10:46:01Z`
- Rationale: adopt the recommended conventional model in which material
  packages describe canonical mutation from outside the canonical target set
- Decision result: `PASS`
- Remaining decision blockers: 0
- Authority effect: none; this selects planning topology only

The selection authorizes proposal-only regeneration around a 34-target
canonical apply and target-35 audit model. It does not approve the not-yet-
authored target bytes, grant apply authority, or authorize canonical mutation.
