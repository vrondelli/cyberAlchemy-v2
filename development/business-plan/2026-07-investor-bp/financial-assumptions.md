---
document: financial-assumptions
status: flag
prepared: 2026-07-10
model_type: bottom-up-assumption-model
currency: USD
---

# Financial Assumptions

## Model Boundary

This is a bottom-up assumption model for testing a services-led commercial
wedge. It is not a validated forecast. No price, conversion rate, delivery
hour, margin, collection period, retention rate, or runway figure in this file
has been validated by paid customer work unless explicitly replaced by a dated
commercial receipt.

Current validated platform/license revenue is modeled as `$0`.

## Revenue Units

| Unit | Customer decision | Test price | Delivery hours | Present status | Promotion witness |
| --- | --- | ---: | ---: | --- | --- |
| Readiness diagnostic | Is this metric/workflow a qualified paid sprint? | $2.5k-$7.5k | 8-20 | Assumption | Paid diagnostic with measured scope, hours, and buyer verdict. |
| Metric Trust / AI Work Readiness Sprint | Can this named output support a named business action? | $15k-$35k | 60-100 | Lead assumption | Signed SOW and completed receipt-backed delivery. |
| Advanced readiness package | Can a higher-risk or confidential workflow pass a broader set of gates? | $25k-$75k | 100-180 | Expansion assumption | Repeatable package after security/custody/acceptance boundaries are proven. |
| Monitoring / continuation retainer | Can evidence, gates, and owner decisions stay current across repeated use? | $8k-$20k/month | 15-40/month | Expansion assumption | Buyer-requested continuation, renewal, and measured delivery burden. |
| Platform / license | Can repeatable receipt patterns be productized? | Not priced | Not modeled | Future-only | Repeated paid reuse with lower delivery labor and stable buyer pull. |

## Illustrative Planning Points

These points sit inside the research ranges and exist only to make unit
economics inspectable. They are not quoted prices.

| Unit | Planning price | Planning hours | Assumed direct cash cost | Contribution before founder compensation | Contribution per delivery hour |
| --- | ---: | ---: | ---: | ---: | ---: |
| Diagnostic | $5,000 | 14 | $500 | $4,500 | $321 |
| Sprint | $22,500 | 80 | $2,500 | $20,000 | $250 |
| Advanced package | $40,000 | 140 | $6,000 | $34,000 | $243 |
| Monthly retainer | $12,000 | 25 | $1,500 | $10,500 | $420 |

The contribution figures exclude founder salary, payroll burden, taxes, sales
time, product/research time, legal/entity costs, and general overhead. They are
therefore not gross-margin claims.

## Capacity Model

The initial team is modeled as two founders. The repository research cautions
against assuming several parallel pilots. The base operating constraint is one
primary active sprint at a time, with diagnostics, sales, research, and limited
retainer work around it.

| Capacity input | Conservative | Base planning case | Upside test | Validation need |
| --- | ---: | ---: | ---: | --- |
| Team delivery hours available per quarter | 180 | 320 | 480 | Time tracking across one full paid quarter. |
| Concurrent primary sprints | 1 | 1 | 1-2 only after templates stabilize | Delivery quality and founder bottleneck evidence. |
| Non-delivery allocation | High | Material | Still material | Track sales, research, productization, admin, and rework separately. |
| Contractor leverage | None | Selective | Selective | Named scope, rate, security boundary, and quality receipt. |

Capacity must be recalculated after each delivery. A scenario fails if it
requires hours above the available band, hides sales/product time, or assumes
unproven parallelization.

## Quarterly Scenario Tests

These are unit combinations, not revenue forecasts. They show what must be true
for a quarter to produce the stated revenue.

| Scenario | Unit mix | Revenue | Delivery hours | Assumed direct cash cost | Contribution before founder compensation | Key assumption |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Conservative | 2 diagnostics at $3.5k; 1 sprint at $15k | $22,000 | 140 | $2,200 | $19,800 | One sprint closes and delivery consumes the high end of estimated hours. |
| Base | 2 diagnostics at $5k; 3 sprints at $22.5k | $77,500 | 268 | $7,750 | $69,750 | One sprint per month closes, scope stays near midpoint, and collections occur. |
| Upside stress test | 3 diagnostics at $7.5k; 3 sprints at $35k; 1 retainer at $20k/month | $187,500 | 360 | $28,125 | $159,375 | Premium pricing, stable scope, one retainer, and 480-hour capacity all hold. |

The upside case is deliberately difficult. It should not enter investor
projections until paid evidence supports premium pricing, retainer pull, and
the required delivery capacity.

## Cash Timing

Test these collection structures during the first pilots:

| Structure | Cash profile | Risk | Preferred use |
| --- | --- | --- | --- |
| 50% start / 50% acceptance | Funds setup and shares completion risk | Acceptance can delay final cash | Default sprint hypothesis. |
| 40% start / 30% midpoint / 30% acceptance | Better working-capital coverage | More invoicing and milestone definition | Longer advanced packages. |
| 100% upfront diagnostic | Strong cash conversion for small fixed scope | Requires a clear standard package | Diagnostic hypothesis. |
| Monthly upfront retainer | Predictable cash timing | Scope creep and cancellation risk | Only after a completed sprint. |
| Net-30 after delivery | Familiar procurement pattern | Founder-financed working capital | Avoid unless buyer quality justifies it. |

The financial model must record invoice date, cash receipt date, days sales
outstanding, write-offs, refunds, and founder-funded working capital.

## Cost Structure Register

| Cost class | Current value | Model treatment | Evidence needed |
| --- | --- | --- | --- |
| Founder compensation | Unknown | Excluded from contribution tables; required before runway calculation | Founder decision and payroll/tax estimate. |
| Contractor/analyst support | Unknown | Direct cost per engagement | Rate card and measured hours. |
| Data access and customer systems | Unknown | Direct or pass-through cost | Pilot-specific access plan. |
| AI/model/API/tooling | Unknown | Direct usage plus fixed tooling | Three months of measured usage. |
| Hosting/security | Unknown | Fixed plus workload-dependent | Architecture and vendor estimates. |
| Legal, privacy, insurance | Unknown | Fixed startup/operating cost | Counsel and broker estimates. |
| Sales/travel | Unknown | Operating expense | Channel plan and actual acquisition work. |
| Entity/accounting/tax | Unknown | Fixed operating expense | Jurisdiction-specific professional estimate. |
| Productization/research | Founder time | Non-billable capacity | Time ledger by work class. |

## Conversion Funnel Assumptions

No conversion rate is currently validated. The first 90 days measure the
funnel rather than forecast it.

```text
buyer conversation
  -> qualified blocked decision
  -> paid diagnostic or direct sprint proposal
  -> signed paid sprint
  -> accepted receipt bundle
  -> second workflow or retainer request
```

For every stage, record count, elapsed days, loss reason, buyer role, budget
path, and whether the decision was founder-initiated or buyer-initiated.

## Break-Even Logic

Let:

- `F` = monthly fixed cash operating cost, including founder compensation;
- `P_i` = collected price for unit `i`;
- `V_i` = direct cash cost for unit `i`;
- `Q_i` = units collected in the month.

Monthly cash break-even occurs when:

```text
sum(Q_i * (P_i - V_i)) >= F
```

This cannot be solved responsibly until founder compensation, fixed costs, and
collection timing are set. Revenue booked but not collected does not satisfy
the cash break-even gate.

## Funding Ask Construction

The raise amount, instrument, and runway target remain founder decisions. Use
this formula rather than selecting a round size from narrative ambition:

```text
target raise =
  target runway months * validated monthly fixed cash burn
  + funded pilot/productization costs
  + legal/security/commercialization costs
  + 15% contingency
  - conservative collected customer contribution during runway
```

Recommended milestone categories for an eventual use-of-funds table:

| Use | Planning share | Milestone unlocked | Evidence produced |
| --- | ---: | --- | --- |
| Buyer development and sales | 30%-35% | Repeatable access to the named buyer pocket | Interviews, pipeline, objections, price tests, signed SOWs. |
| Delivery and receipt productization | 25%-30% | Standard bundle and lower delivery variance | Templates, measured labor, reuse rate, delivery receipts. |
| Technical proof and demo hardening | 20%-25% | Fresh bounded specimens and investor/customer demo | Tests, audits, readiness specimen, UI/IDE flow. |
| Legal, privacy, security, and operations | 10%-15% | Safe contracting and delivery foundations | Contract templates, privacy/security review, insurance/entity records. |
| Contingency | 10%-15% | Protection against collection and scope variance | Runway buffer. |

These shares are assumptions and must sum to the chosen ask after the founders
set the actual milestones and burn.

## Sensitivity Tests

Before investor use, test at least:

1. Sprint price at $15k, $22.5k, and $35k.
2. Sprint delivery at 60, 80, 100, and 140 hours including rework.
3. Collection at upfront/milestone, net-30, and 30-day delay beyond terms.
4. Direct cash cost at 5%, 10%, 20%, and 30% of collected revenue.
5. Zero, one, and two sprint closes per month.
6. Zero retainer attach versus one retained customer.
7. Founder delivery capacity reduced by 25% and 50% for sales/product work.
8. One failed or refunded engagement per quarter.

## Financial Promotion Gates

| Claim | Promotion gate |
| --- | --- |
| Price validated | At least one paid collection at that price and scope. |
| Delivery hours validated | Time ledger for the complete accepted engagement. |
| Positive unit contribution | Collected cash minus direct cash cost, with founder time reported separately. |
| Repeatable gross margin | Three comparable paid deliveries with stable cost classification. |
| Conversion rate | Sufficient funnel observations with a disclosed denominator. |
| Retainer potential | Buyer-requested continuation and at least one renewal/second billing period. |
| Platform economics | Productized delivery with measured reduction in service labor. |
| Runway | Actual opening cash, burn, contracted obligations, collections, and chosen financing. |

## Open Founder Decisions

- Legal entity and jurisdiction.
- Founder compensation and benefits.
- Current cash and committed liabilities.
- Raise amount, instrument, dilution/terms boundary, and runway target.
- Whether first engagements are direct sprint sales or paid diagnostics.
- Minimum acceptable price and walk-away conditions.
- Contractor/security/legal budget for sensitive workflows.

Until these are resolved, the financial section of the BP remains `FLAG`.
