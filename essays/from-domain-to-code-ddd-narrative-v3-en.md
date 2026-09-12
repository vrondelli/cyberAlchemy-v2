# “In stock” for whom? From domain to code with DDD

Status: narrative v3, English translation, candidate for review and rehearsal.  
Translation date: 2026-09-12.  
Format: condensed narrative with visual demonstrations and pseudocode.  
Fictional case: returned laptop `LP-2041`.

## The ticket reveals a hidden decision

A returned laptop appears as “in stock” before it has been inspected. A customer manages to buy it. The team opens a ticket, reproduces the problem, and checks for duplicate messages, out-of-order events, and a stale cache.

Everything is working as implemented. The warehouse received the unit, inventory updated the quantity, and the storefront published its availability.

The engineer places the states side by side:

```text
LP-2041
  Warehouse:     physically present
  Quality:       awaiting inspection
  Inventory:     one unreserved unit
  Storefront:    in stock — purchase allowed
```

The storefront's rule considers physical presence and the absence of a reservation. Customer Support expects quality approval as well. Before adding a condition, the team brings in the people who receive units, inspect them, and decide whether they can be resold.

“When you say ‘in stock,’ what decision are you making?”

The warehouse is asserting that it has custody of the unit. Quality has not yet approved its condition. Sales needs to decide whether it can return to sale. The storefront is offering the customer an opportunity to buy.

The shared expression concealed different meanings. This discovery begins to change the Ubiquitous Language.

## From words to boundaries

Working with domain experts, the team begins to distinguish receipt, approval, sale eligibility, availability, and reservation. These terms find a place in the model:

| Proposed Bounded Context | Question it answers | Context language |
| --- | --- | --- |
| Warehouse | Where is the unit? | Receipt, location, custody. |
| Quality | Which inspection applies, and what was its result? | Inspection, approval, validity. |
| Sales | Can the unit be sold and committed to an order? | Sale eligibility, resale disposition, holds, allocation. |
| Storefront | What do we show the customer? | Displayed availability, purchase request. |

These boundaries are Strategic Design hypotheses, to be validated through language and responsibilities. We can start by implementing them as modules. The design does not require a microservice per context.

The first change is to remove the implicit decision in the storefront projection that “received” means “eligible for sale.” Sales begins to interpret facts from Warehouse and Quality according to an explicit commercial policy.

## Discovering domain events

With these boundaries still provisional, the team reconstructs the unit's journey with the experts: “What happened between the laptop being returned and appearing in the storefront?”

Each relevant occurrence receives a name in the past tense. We begin with receipt and follow the possible paths:

```text
UnitReceived → InspectionCompleted
                       ├─ InspectionFailed → UnitRoutedForRepair
                       └─ InspectionPassed
                                  │
                       evaluate commercial policy
                       and the unit's other conditions
                                  │ if satisfied
                                  v
                         UnitReleasedForSale
                                  │ request accepted
                                  v
                             UnitReserved
```

This is a candidate journey, to be validated with the business. Does a failed inspection always lead to repair, or could it lead to disposal? Who decides the disposition? Does approval alone release the unit for sale? We leave these questions on the diagram and use them to revisit the proposed boundaries.

We also separate an intention from its outcome:

| Command — what is requested | Event — what happened |
| --- | --- |
| Receive unit | UnitReceived |
| Complete inspection | InspectionCompleted, with its result |
| Reserve unit | UnitReserved, when the rule permits it |

For each event, we ask who recognizes the fact, which unit and return cycle it refers to, and what decision it might trigger. `InspectionPassed` belongs to Quality's language; `UnitReserved` expresses a commitment made by Sales. The experts may also prefer to represent approval as the result of `InspectionCompleted`, without creating two internal events for the same conclusion.

The diagram exposes the transition that caused the bug: between `UnitReceived` and availability in the storefront, an explicit commercial decision was missing. Discovering the events makes that gap available for discussion before we choose messages, handlers, or a broker.

## Relationships reveal what is missing

We can now enrich the discovery through ontological analysis. The concepts matter because of their relationships:

```text
PhysicalUnit --observed_at--> WarehouseLocation
PhysicalUnit --has_disposition--> ReturnDisposition
PhysicalUnit --undergoes--> QualityInspection
QualityInspection --produces--> QualityState
QualityState --constrains--> SaleEligibility
InventoryPosition --contributes_to--> AllocationEligibility
AvailabilitySignal --claims_to_represent--> SaleEligibility
PurchaseCommitment --depends_on--> AvailabilitySignal
```

Read the central relationship: quality state constrains sale eligibility. It describes a dependency that the previous calculation did not express.

Another relationship deserves attention: the storefront's signal claims to represent sale eligibility. We need to demonstrate that correspondence. Giving fields similar names is not enough.

The questions also refine identity. An inspection approves a physical unit, identified by its serial number, rather than every item associated with a SKU. An approval from a previous return does not automatically release the current return either.

These discoveries feed back into DDD: `UnitId` and `ReturnCycleId` become part of the contracts; Quality remains responsible for inspection; Sales checks whether the approval applies to the current decision. Ontological analysis complements the modeling and makes its consequences visible in the design.

## Sale eligibility changes with the unit's state

The same unit evolves throughout the process: after receipt, it awaits inspection and remains blocked. With approval and the other conditions satisfied, it becomes eligible for sale. Once reserved, it is no longer available for a new sale. Each column shows the unit's state after one of these transitions.

| State of LP-2041 | After receipt | After approval | After reservation |
| --- | --- | --- | --- |
| Physically present | Yes | Yes | Yes |
| Valid approval for the current return cycle | No | Yes | Yes |
| Disposition = resale | Yes | Yes | Yes |
| Allocated to an order | No | No | Yes |
| Quarantined | No | No | No |
| **Eligible for a new sale** | **No** | **Yes** | **No** |

For this scope, we propose the following rule:

```text
EligibleForSale(unit, time) :=
    PhysicallyPresent(unit, time)
    AND QualityCleared(unit, time)
    AND Disposition(unit, time) = RESALE
    AND NOT Allocated(unit, time)
    AND NOT Quarantined(unit, time)
```

Sale eligibility is a judgment about changing conditions. The expression is still a candidate: we need to confirm its scope and acceptance with the person responsible for resale policy. The model makes the rule and its consequences explicit; the organization decides whether to adopt it.

As the case continues, the policy owner confirms these conditions for the returns workflow under investigation. We can then carry them into code.

## The rule inside the Aggregate Root

In Sales, the `SaleableUnit` Aggregate Root protects the decision about a unit. It maintains the facts required by the policy, received and translated from the other contexts. It does not need to contain the Warehouse and Quality aggregates.

The entire predicate appears in the model, and the reservation operation must consult it:

```typescript
// Pseudocode: the current state known to the aggregate.
class SaleableUnit {
  private present: boolean = false;
  private approval: QualityApproval | null = null;
  private disposition: Disposition = "AWAITING_DECISION";
  private allocatedOrder: OrderId | null = null;
  private quarantined: boolean = false;

  constructor(
    readonly id: UnitId,
    readonly cycle: ReturnCycleId,
  ) {}

  eligibleForSale(now: Instant): boolean {
    return this.present
      && this.approval?.validFor(this.id, this.cycle, now) === true
      && this.disposition === "RESALE"
      && this.allocatedOrder === null
      && !this.quarantined;
  }

  reserve(order: OrderId, now: Instant) {
    if (!this.eligibleForSale(now)) {
      throw new UnitNotEligibleForSale();
    }

    this.allocatedOrder = order;
    this.recordEvent(new UnitReserved(this.id, order, now));
  }
}
```

Each line corresponds to a condition in the expression. Approval is a Value Object whose contract checks the unit, return cycle, passing result, and validity interval. The instant comes from a clock controlled by the application. The client does not choose it to circumvent the rule.

The excerpt omits the methods that record receipt, approval, disposition, and quarantine, along with persistence and event collection. In the implementation, those changes also pass through controlled aggregate behavior that validates incoming facts. There are no public setters that bypass the policy.

There is no permanent `eligibleForSale = true` flag either. Eligibility is recalculated from current conditions. If approval expires or the unit is allocated, the result changes.

The method queries the current known state. Passing an earlier instant does not reconstruct the unit's history; a historical query would require retrieving the state corresponding to that point in time.

This is the Aggregate Root's contribution: the operation that commits the unit protects the complete rule. For two concurrent reservations, persistence must also serialize the change or detect a version conflict. Only one can succeed.

## Events allow the contexts to cooperate

The corrected path becomes visible:

```text
Warehouse                    Quality
UnitReceived                 InspectionPassed
      │                            │
      └────── integration contracts ──────┐
                                         v
                                      Sales
                                  SaleableUnit
                             [sale eligibility rule]
                                  │             ^
                     availability │             │ reserve(order)
                           change │             │
                                  v             │
                                     Storefront
                                  [read projection]
```

Warehouse records a Domain Event when it receives a unit. Its application publishes an integration contract after persisting the change. Quality does the same for the inspection. Sales handlers translate the contracts and update the aggregate. The sale eligibility evaluation also considers disposition, allocation, and quarantine according to the defined commercial behavior.

A relevant change produces a Sales Domain Event and may result in an update for the Storefront. The internal event and the external contract can have different formats. Reliable publication, idempotent consumption, and version handling support this flow.

The Storefront presents a projection, which can lag behind. A reservation attempt returns to the aggregate and reevaluates every condition. An outdated screen is therefore insufficient to confirm a purchase.

If approval expires without a new message arriving, the projection needs scheduled expiration or reevaluation to update the screen. The reservation already checks the current instant. Revocations and quarantine changes that the aggregate has not yet received require an additional integration guarantee when the business demands an immediate block.

## Tests preserve the meaning

We return to the ticket with the same unit. It has arrived, but quality approval is pending: the reservation must fail. A valid inspection result arrives and the other conditions are satisfied: the reservation can succeed.

We also test the complete rule:

```text
Present + approved + resale + unallocated + not quarantined → allows reservation
Same scenario, but physically absent                       → rejects
Same scenario, but approval expired or from another cycle  → rejects
Same scenario, but disposition is not resale               → rejects
Same scenario, but already allocated                       → rejects
Same scenario, but quarantined                             → rejects
```

These are teaching scenarios, not yet a tested implementation. They show what the code needs to preserve and allow the rule to be discussed with domain experts.

When closing the ticket, we record the decision we uncovered: receipt was being confused with authorization to sell. The language now distinguishes the states, the contexts have explicit responsibilities, and the aggregate protects the commercial commitment.

DDD guided the journey from discovery to code. Ontological analysis helped make the relationships and their validity explicit. The result appears both in the design and in the `reserve` operation: we know which facts permit the decision and which conditions prevent it.

## Sources and open questions

Translation source: [Portuguese narrative v3](do-dominio-ao-codigo-ddd-narrativa-v3.md). Its sources are the [v2 narrative](do-dominio-ao-codigo-ddd-narrativa-v2.md), the [original text and relationship map](the-bug-ticket-that-became-an-ontology.md), and the user's corrections of 2026-09-11. This version is an editorial candidate; its diagrams and code demonstrate the fictional case.

Translation convention: *comerciabilidade* is rendered as **sale eligibility**, referring to the conditions that permit a sale. The *Comercialização* Bounded Context is called **Sales**. Diagram labels and illustrative code identifiers are translated consistently; the aggregate `UnidadeComerciavel` becomes `SaleableUnit`.

### Open Questions

- Confirm the duration and diagram legibility during rehearsal.
- For a real implementation, define approval validity, ordering per source, and handling of revocation, quarantine, and new return cycles.
- Confirm the policy's conditions and scope with the domain owners before adopting it in a product.
