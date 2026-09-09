# The Bug Ticket That Became an Ontology

At 08:43 on Monday morning, a bug ticket enters the product backlog:

```text
BUG-4821 — Returned laptops appear “In stock” before inspection

Severity: High
Reported by: Customer Support

Observed:
A returned laptop became purchasable immediately after warehouse intake.

Expected:
Returned units must remain unavailable until they pass quality inspection.

Evidence:
- Unit: LP-2041
- Warehouse state: ON_HAND
- Quality state: AWAITING_INSPECTION
- Storefront state: IN_STOCK
- Order accepted: ORD-99114
```

The ticket appears precise. It contains identifiers, states, an expected result
and enough evidence to begin reproducing the failure.

But its expected result contains an assumption: quality inspection participates
in the business meaning of “available.”

The engineer does not yet know whether that assumption is implemented,
documented, current or owned by the service under investigation.

## Debugging the visible failure

She starts by reproducing the defect.

A returned unit is created in the staging environment with the same relevant
state:

```text
unit_id: LP-TEST-2041
disposition: CUSTOMER_RETURN
warehouse_state: RECEIVED
quality_state: AWAITING_INSPECTION
reserved: false
```

After the warehouse intake event is published, the storefront reports:

```json
{
  "sku": "LAPTOP-14-B",
  "availability": "IN_STOCK",
  "availableQuantity": 1
}
```

The reproduction closes one uncertainty. The production incident was not caused
by corrupted data or a one-off operator mistake.

The engineer follows the unit through the event ledger:

```text
09:17:04  ReturnReceived
09:17:05  UnitScannedAtWarehouse
09:17:05  InventoryPositionUpdated
09:17:06  AvailabilityProjectionUpdated
09:17:07  StorefrontCacheInvalidated
```

There are no duplicate events. Message ordering is correct. The inventory
update is idempotent. The storefront cache contains the latest projection.
Replaying the event stream produces the same result.

Several ordinary fault hypotheses can now be rejected:

```text
duplicate message             rejected
out-of-order delivery         rejected
stale storefront cache        rejected
incorrect warehouse count     rejected
missing quality-state event   rejected
projection non-determinism     rejected
```

The data is moving correctly.

She compares the states held by each service:

```text
Warehouse:
  LP-TEST-2041 is physically present.

Quality:
  LP-TEST-2041 is awaiting inspection.

Inventory:
  One unit exists on hand and is not reserved.

Availability:
  One unit is available.

Storefront:
  The product may be purchased.
```

Each statement appears locally reasonable. The contradiction becomes visible
only when the statements are placed beside one another.

The engineer inspects the availability component—not yet searching for a wrong
line of code, but asking which facts participate in its decision.

Its decision table contains three conditions:

```text
on_hand_quantity > 0
reserved_quantity = 0
sales_channel_enabled = true
```

`quality_state` is not absent because an integration failed. It was never
declared as an input.

The component is faithfully executing the rule it was given:

```text
A unit is available when it is physically present,
unreserved and enabled for the sales channel.
```

This is not merely a projection calculation. It is a business rule embedded
inside a projection.

The debugging question changes.

It is no longer:

> Why did the availability service ignore the quality state?

The service did not ignore it. Nothing in its model said that quality clearance
constrained availability.

The new question is:

> Is the implemented definition of availability incomplete, or is the ticket
> requesting a new business rule?

## Documenting the fault before fixing it

Before changing the code, the engineer creates a fault record:

```yaml
fault_id: FAULT-4821
ticket_ref: BUG-4821
classification: semantic-rule-gap

observed_behavior:
  returned_unit_with_quality_state_awaiting_inspection:
    storefront_availability: IN_STOCK

reproduction:
  status: confirmed
  fixture: LP-TEST-2041
  deterministic_replay: true

execution_path:
  - ReturnReceived
  - InventoryPositionUpdated
  - AvailabilityProjectionUpdated
  - StorefrontAvailabilityPublished

eliminated_causes:
  - duplicate_event
  - event_ordering
  - stale_cache
  - incorrect_inventory_count
  - missing_quality_event
  - nondeterministic_projection

implemented_rule:
  available_when:
    - physically_present
    - not_reserved
    - sales_channel_enabled

ticket_implied_rule:
  available_when:
    - physically_present
    - not_reserved
    - sales_channel_enabled
    - quality_cleared

fault_boundary:
  code_defect: not_yet_established
  business_rule_gap: supported
  policy_change: unresolved

decision_required:
  owner: resale-policy-owner
  question: Does quality clearance constrain sellability for every returned unit?

forbidden_conclusions:
  - Treat the ticket expectation as authoritative policy.
  - Modify availability before confirming the rule and its scope.
```

The document preserves distinctions that an ordinary bug ticket tends to
collapse.

The ticket is evidence that a user encountered an undesirable outcome. The
trace is evidence that the system behaved deterministically. Source inspection
is evidence of the rule currently implemented.

None of those artifacts establishes the correct business rule.

The engineer searches the returns policy and finds a relevant statement:

```text
Returned electronic equipment must pass quality inspection
before it is returned to saleable stock.
```

This supports a relation that the implementation does not currently represent:

```text
QualityClearance --constrains--> Sellability
```

Even that source does not immediately settle the implementation.

The policy says “saleable stock.” The storefront says “in stock.” The
availability component says “available.” The inventory service says “on hand.”

These may be synonyms. They may also refer to four related but distinct states.

The investigation has exposed a chain of compressed meanings:

```text
physically present
    -> counted as stock
    -> available for allocation
    -> sellable
    -> offered to a customer
```

The implementation treated every transition in this chain as automatic.

Ontology engineering begins here—not when someone draws the first graph, but
when the investigation demonstrates that the defect cannot be explained safely
using the concepts already represented in the system.

## What ontology engineering contributes

Ontology engineering is the disciplined construction of a purpose-bound model
of meaning.

It identifies the kinds of things a domain cares about, the distinctions among
them, the relations that connect them, and the constraints governing valid
inference.

For `FAULT-4821`, a candidate model might distinguish:

```text
AssetUnit
WarehouseLocation
InventoryPosition
ReturnDisposition
QualityInspection
QualityState
AllocationEligibility
Sellability
AvailabilitySignal
PurchaseCommitment
```

The concepts matter because of their relations:

```text
AssetUnit --observed_at--> WarehouseLocation
AssetUnit --has_disposition--> ReturnDisposition
AssetUnit --undergoes--> QualityInspection
QualityInspection --produces--> QualityState
QualityState --constrains--> Sellability
InventoryPosition --contributes_to--> AllocationEligibility
AvailabilitySignal --claims_to_represent--> Sellability
PurchaseCommitment --relies_on--> AvailabilitySignal
```

Temporal validity matters as well. `LP-2041` may be unsellable at 09:17 and
sellable at 11:42 after passing inspection.

Sellability is not an eternal class membership. It is a time-bounded domain
judgment derived from changing conditions:

```text
Sellable(unit, time) :=
    PhysicallyPresent(unit, time)
    AND QualityCleared(unit, time)
    AND Disposition(unit, time) = RESALE
    AND NOT Allocated(unit, time)
    AND NOT Quarantined(unit, time)
```

This expression is still only a candidate rule. The ontology may represent it,
connect it to supporting evidence and expose its consequences. It cannot decide
that the organization has accepted it.

The graph is not the authority.

## Why a glossary or schema is insufficient

A glossary could define *sellable inventory*. A repository inventory could
locate the policy, ticket, service and test fixture. A search engine could
retrieve every occurrence of “in stock.” A database schema could store
`quality_state`.

Each would help, but none necessarily explains:

- whether `quality_state` is required for sellability;
- whether that requirement applies to every return category;
- which source supports it;
- who owns the decision;
- whether the relation is proposed or accepted;
- when the rule becomes invalid; or
- what a downstream service may infer from it.

A conventional graph can connect `QualityState` to `Sellability`, but the
existence of an edge does not establish whether the relation is current,
authoritative or safe to use.

CyberAlchemy therefore treats an important ontology relation as a richer
engineering object:

```yaml
relation_id: REL-QUALITY-CLEARANCE-SELLABILITY

source:
  policy: returns-resale-policy
  selector: resale-eligibility

direction:
  from: QualityClearance
  to: Sellability

scope:
  disposition: CUSTOMER_RETURN
  product_category: ELECTRONICS

validity:
  begins: inspection_passed
  expires_when:
    - material_condition_changes
    - inspection_is_invalidated

meaning_owner: resale-policy-owner
runtime_consumer: availability-contract

evidence_confidence: supported
commitment_posture: candidate
promotion_state: awaiting-owner-decision

forbidden_inferences:
  - warehouse presence implies quality clearance
  - successful intake implies sellability
  - inventory count implies customer availability

residue:
  - effect of warehouse transfer on prior inspection unresolved
```

The relation carries its meaning, source, scope, owner, lifecycle and forbidden
inferences together.

That changes what downstream work can safely do with it.

## Beginning with the product promise

CyberAlchemy does not begin by treating `quality_state` as a missing field in
the availability service.

It begins with the product promise that gave the defect its consequence.

When the storefront displays “in stock,” it is not merely reporting an
inventory quantity. It is inviting a customer to make a purchase commitment.
The customer reads the signal as a claim that the organization can accept and
fulfil the order.

The product model therefore asks:

```text
What promise does AvailabilitySignal make?
Which customer action does it invite?
Which capability must exist for that promise to be honest?
```

A product-level relation might be:

```text
AvailabilitySignal
    --invites--> PurchaseCommitment

PurchaseCommitment
    --depends_on--> FulfilmentCapability

AvailabilitySignal
    --claims--> FulfilmentCapability
```

This does not determine warehouse policy. It establishes why the distinction
matters.

From there, business ontology models the relevant domain meaning: asset units,
return dispositions, inspections, allocation and sellability.

System ontology describes what the implementation actually contains: events,
tables, projections, services and state transitions.

A bridge relates the two:

```text
availability_service.availability
    --claims_to_represent-->
Sellability
```

That bridge does not become true merely because its endpoints have similar
names. It is a correspondence claim that must be supported and tested.

In `BUG-4821`, the bridge fails. The service's decision table does not contain
all the conditions required by the candidate business meaning. Making the
bridge explicit prevents the implementation from silently redefining
*sellable* as “present and unreserved.”

It also prevents the product model from pretending that the running system
already enforces the richer rule.

## Evidence is not commitment

The fault investigation produces several kinds of evidence:

```text
BUG-4821:
  evidence of an undesirable product outcome

reproduction fixture:
  evidence that the outcome is repeatable

event trace:
  evidence that the pipeline behaved deterministically

source inspection:
  evidence of the implemented rule

returns policy:
  evidence supporting a candidate business rule
```

Strong evidence does not automatically produce organizational commitment.

The policy may be ambiguous about refurbished units. A newer operational
decision may supersede it. The quality owner may require different inspections
for batteries and accessories. The storefront may need to distinguish
“available to order” from “available for immediate dispatch.”

CyberAlchemy therefore separates three judgments:

```text
The source probably says this.
The proposed interpretation is well supported.
The responsible owner accepts this rule for this bounded use.
```

The first concerns evidence confidence.

The second concerns semantic interpretation.

The third concerns authority.

A validator can verify that the candidate relation has known endpoints, exact
source bindings, a declared owner and no unresolved structural references. It
cannot perform the owner's decision.

This yields CyberAlchemy's central authority invariant:

> The ontology models authority, but it does not decide authority.

An owner decision does not determine physical truth. It cannot make a damaged
laptop safe. It determines whether the organization adopts a bounded definition
or rule as governing a particular use.

The ontology organizes the candidate before that decision and records the
result afterward. It does not manufacture the result itself.

## Preserving what remains unknown

During review, the owner confirms that quality clearance is required before
returned electronics become sellable. But another question remains:

> If an inspected unit moves to another warehouse, does the previous inspection
> remain valid?

The available sources do not answer.

A system optimized for apparent completeness might infer a likely policy.
CyberAlchemy preserves the uncertainty as a named unresolved remainder:

```yaml
residue_id: RESIDUE-TRANSFER-INSPECTION-VALIDITY
question: Does warehouse transfer invalidate quality clearance?
owner: resale-policy-owner
status: unresolved
blocked_use:
  - transferred returned units must not be projected as sellable
```

The absence of an answer becomes part of the model.

This is honest incompleteness. A visible hole is safer than an invented
rule—especially when a machine will use the result to construct or operate
another system.

## From fault record to governed construction

The journey of the original ticket now has a monotonic structure:

```text
BUG-4821
  -> reproduction evidence
  -> execution trace
  -> FAULT-4821
  -> candidate ontology relation
  -> owner decision
  -> accepted business rule
  -> system contract
  -> implementation
  -> runtime evidence
```

Suppose the owner accepts the bounded rule:

```text
A returned electronic unit cannot be sellable
until its required quality inspection has passed.
```

An approved projection may now inform a system contract:

```text
storefront_in_stock(unit, time)
    requires
sellable(unit, time)
```

The availability component can be changed to consume the necessary quality
state. Contract tests can reject a design that has no source for quality
clearance. A regression fixture can reproduce `LP-TEST-2041` and assert:

```text
Given:
  disposition = CUSTOMER_RETURN
  warehouse_state = ON_HAND
  quality_state = AWAITING_INSPECTION

Then:
  availability = UNAVAILABLE
  purchase_allowed = false
```

After inspection:

```text
Given:
  disposition = CUSTOMER_RETURN
  warehouse_state = ON_HAND
  quality_state = PASSED
  reserved = false

Then:
  sellability = SELLABLE
  availability = IN_STOCK
```

But accepted meaning does not prove the implementation.

The evidentiary chain must continue:

```text
accepted domain meaning
    -> system contract
    -> implementation
    -> executable test
    -> runtime observation
```

Commitment does not prove implementation. Implementation does not prove runtime
correctness. A passing test does not prove the entire product thesis.

Each layer contributes evidence appropriate to its responsibility.

## Closing the ticket without losing the meaning

Eventually, the corrected service is deployed to the test environment. The
original fixture is replayed. Returned units awaiting inspection remain
unavailable. Units appear in stock only after the accepted quality transition.

`BUG-4821` can now be closed against its bounded completion criteria.

But its final record should not say only:

```text
Fixed by adding quality_state to availability filter.
```

That would preserve the code change while discarding the knowledge recovered
through the investigation.

A stronger closure records:

```yaml
ticket: BUG-4821
result: resolved

fault:
  ref: FAULT-4821
  classification: semantic-rule-gap

accepted_rule:
  ref: REL-QUALITY-CLEARANCE-SELLABILITY
  owner_decision: accepted
  scope:
    disposition: CUSTOMER_RETURN
    category: ELECTRONICS

implementation:
  availability_requires_quality_clearance: true

evidence:
  reproduction_test: pass
  contract_test: pass
  projection_test: pass
  runtime_replay: pass

remaining_residue:
  - RESIDUE-TRANSFER-INSPECTION-VALIDITY
```

The code repair closes the incident. The ontology preserves why the repair
exists, which product promise it protects, which owner accepted the meaning and
what remains unresolved.

That is the CyberAlchemy approach to ontology engineering.

It is not an attempt to accumulate the largest possible graph. Nor is it a
central tool claiming ownership of every project's language. It is a
project-owned system for keeping meaning connected, explicit, source-bound,
testable and usable by people and machines.

The ontology is not extra documentation beside construction. It is controlled
meaning infrastructure for construction.

But it retains a crucial discipline: the map cannot promote itself into the
territory.

Once meaning can be represented and governed this way, the next question is how
teams discover these distinctions during ordinary product development. Where
should each concept live? Which model owns its behaviour? How can several
contexts cooperate without collapsing their languages?

That is where ontology engineering meets Domain-Driven Design—and where the
next essay begins.

## Grounding

- [Ontology Product thesis](../product/ontology-product/PRODUCT-THESIS.md)
- [Ontology package model](../ontology/PACKAGE-MODEL.md)
- [Relation model](../ontology/RELATION-MODEL.md)
- [Lifecycle model](../ontology/LIFECYCLE-MODEL.md)
- [Branch model](../ontology/BRANCH-AS-VIEW.md)
