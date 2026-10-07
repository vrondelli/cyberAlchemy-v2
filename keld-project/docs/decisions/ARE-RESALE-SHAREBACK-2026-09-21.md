---
title: ARE resale and share-back decision gate
status: owner-policy-selected-license-draft-only
preparedAt: 2026-09-22T02:17:00Z
recordUpdatedAt: 2026-09-22T03:10:45Z
owner: KELD product owner
authorityEffect: none
---

# ARE resale and share-back decision gate

This is owner-intent evidence for a proposed custom ARE software license. It is
not the governing license, release approval, a support contract, or permission
to sell or publish the customer bundle. The current customer distribution still
has no verified governing ARE license or complete third-party rights review.

## Resolved owner choices

| Decision | Options considered | Selection and rationale | Source |
| --- | --- | --- | --- |
| What qualifies a buyer to sell a modified ARE copy? | Any added connector/function; a numeric code-change threshold; new functionality or material improvement of existing functionality. | **New functionality or material functional improvement.** The owner rejected a merely small change and chose a capability-based threshold. Cosmetic changes, renaming, packaging, and bug fixes alone are not presumed to qualify. No percentage-of-code test is selected. | Owner messages in this task: “Modify the license only with heavy modification the buyer can sell” and “I want materially improve or new functionality.” |
| Who bears the reciprocal obligation when a buyer resells a qualifying version? | KELD; the reseller; both. | **The reseller.** Verified ARE purchasers should receive the qualifying version's source code without an additional charge from the reseller. This is a stronger proposed duty than merely giving source to that reseller's own paying recipients. | Owner message in this task: “The reseller should offer the same benefits to anyone who owns the license, kind like a gnu license.” |
| What must the reseller provide free? | Source code only; software binaries plus source; source plus future upgrades and direct human support. | **Source code only.** No free binary distribution, future upgrade service, or human support is required of the reseller by this proposed license rule. | Owner answer in this task: “Only the source code.” |
| Who qualifies for the no-charge source offer? | Every lawful ARE license holder, including free-copy recipients; verified purchasers only. | **Verified purchasers only.** The owner expressly chose the narrower direct request right; no further rationale was supplied. A free-copy recipient does not qualify merely by holding a copy. Proof details remain an implementation/legal question. | Owner answer in this task: “Verified purchasers.” |
| May a verified purchaser share the reseller's source onward? | Prohibit onward sharing; allow onward sharing without charge. | **Allow free onward sharing.** Purchaser verification limits the reseller's direct offer, not what a purchaser may share after receiving the source. The ordinary paid-resale threshold still applies to any later sale. | Owner confirmation in this task: “They can still share.” |

These selections supersede the earlier candidate interpretation that one new
connection or function, regardless of materiality, qualifies resale. They do
not establish the precise legal language or bind third-party code.

## Selected benefit scope and decision result

The decision gate is **PASS for candidate license drafting**: the five owner
choices above are explicit. The reseller must offer the complete source code of
the qualifying modified ARE version to verified ARE purchasers at no charge.
The owner did not require free binaries, later releases, or direct support from
the reseller. This does not alter KELD's separate first-100 service promise.
The purchaser-only rule limits whom the reseller must serve directly. A
purchaser may share received source code onward without charge, and a later
recipient may share it again without charge. The material-change condition
still governs any paid resale.

The [candidate license clauses](../ARE-LICENSE-CANDIDATE.md) capture this
product rule; they are not operative. The GNU comparison is an analogy, not a
license selection: the GNU GPL permits charging for copies and does not
generally require a distributor to furnish a copy gratis to everyone who
already holds a license. See the
[GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.en.html).

## Subsequent legal and release gates

- Define the exact covered ARE files and copyright owners; preserve each
  third-party component's own license and notices.
- Define how a purchaser proves eligibility and obtains a reseller's
  qualifying version's source code at no charge, and how long the offer must
  remain available. A lawful recipient of a freely shared copy may hold ARE
  software rights but is not directly eligible for this reseller source offer.
- Define downstream recipients' rights and reciprocal duties, change notices,
  patents, trademarks, warranty, termination, and dispute handling.
- Review enforceability with qualified counsel. The custom resale restriction
  is not GNU GPL and should not be labeled OSI open source: the [Open Source
  Definition](https://opensource.org/osd) requires freedom to sell copies.
- Reconcile the existing Apache-2.0 storefront statements and first-100 service
  promises before a real offer. Do not present this record as that reconciliation.

## Open Questions

The owner-policy decisions are resolved for drafting. The subsequent legal and
release gates remain open before the candidate can become a governing license.
In particular, settle purchase verification and source-offer duration. See the
[distribution audit](../DISTRIBUTION-AUDIT.md) and
[release readiness](../RELEASE-READINESS.md) for existing artifact boundaries.
