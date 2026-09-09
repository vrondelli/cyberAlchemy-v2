---
artifact_id: ux-rule-remove-item-runtime-contract
canonical_kind: runtime contract
authority_kind: Runtime contract
process_origin: example-task-session-after-owner-gates
durability: perennial
authority_state: candidate
example_status: illustrative
---

# Candidate Runtime Contract: Accessible-Name Check

## Scenario

Locate the cart remove-item control by its user-facing button role within a
stable fixture or finished interface.

## Deterministic Assertion

```text
accessible_name(remove_item_button).trim().length > 0
```

## Required Evidence Outputs

- run metadata;
- role/name or accessibility-tree evidence;
- screenshot;
- DOM measurement or locator receipt;
- trace when interaction is required;
- findings and residue.

## Status

Contract shape only. No Playwright implementation or browser run exists in this
package.

## Ontology Gap

The current CyberAlchemy v2 `NODE-MODEL.md` initial concept set has no
runtime-contract concept. This artifact remains source-linked but intentionally
unmapped until schema governance decides whether such a node concept is needed.

