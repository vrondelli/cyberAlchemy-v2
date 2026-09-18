# KELD license and payment choices

Date: 2026-09-17. Candidate research and interpretation of the owner's latest
answers; not an executed license, account eligibility finding, or release approval.
No ontology-runtime record or selector dependency is required for this comparison.

## Owner intent

The owner wants recipients to use, share and change the software freely, including
commercial use, but not sell an unchanged copy. Adding a connection or a new
function should permit resale. The owner requests Stripe, PayPal, USDC and Pix.
These answers supersede the previous unanswered binary license/provider questions.
Merchant country has been requested and remains unresolved in this record.

## License comparison

Apache-2.0 permits distribution with or without modifications. It does not deliver
the requested unchanged-resale restriction. Its existing notices and conditions
still apply to included Apache components. [Apache license](https://www.apache.org/licenses/LICENSE-2.0).

An ordinary restrictive proprietary license may prohibit sharing and modification;
that would be broader than the owner's request. A custom source-available license
can express the intended broad permissions with a narrow resale condition. It
should not be marketed as OSI open source: free redistribution includes permission
to sell. [OSI definition](https://opensource.org/osd).

Candidate plain-language intent, not final legal wording: use, copy, modify and
share ARE, including in commercial work; selling a redistributed software copy
requires an added function or integration. The owner's threshold does not require
a large rewrite. A working new connector or function qualifies. Cosmetic edits,
renaming and bug fixes alone do not qualify a redistributed copy for resale.
Hosted access and paid support are service activities outside this redistributed-
copy resale rule; they neither satisfy nor violate its modification threshold.
Downstream licensing remains an interpretation question. Final wording needs
legal review and a rights review of the actual distribution; do not replace
third-party licenses with this proposed restriction.
[Apache's guidance on modified licenses](https://www.apache.org/foundation/license-faq).

## Payment recommendation

Optimize for a small number of maintained integrations and reliable reconciliation,
not an unverified cheapest-fee claim. Account country and activation decide availability.

| Method | Candidate choice | Evidence and boundary |
| --- | --- | --- |
| Cards | Stripe hosted Checkout | Shared checkout also exposes eligible local/stablecoin methods |
| PayPal | Direct PayPal Checkout for a Brazil or US merchant | Stripe's native PayPal processing lists European business locations; PayPal provides server-side order creation and capture |
| Pix | Stripe if the actual account supports it; otherwise Mercado Pago for a Brazilian merchant | Stripe lists BRL presentment and Brazilian one-time acceptance as invite-only; Mercado Pago Checkout Pro supports Pix |
| USDC | Stripe for an eligible merchant; MoonPay Commerce as the alternative to evaluate | Stripe lists US acceptance plus specified private-preview regions, not Brazil. MoonPay Commerce supports USDC digital-goods payments; actual merchant approval, networks, settlement, API/webhook behavior and refunds remain unverified |

Primary sources: [Stripe Pix](https://docs.stripe.com/payments/pix),
[Stripe stablecoins](https://docs.stripe.com/payments/stablecoin-payments),
[Stripe PayPal](https://docs.stripe.com/payments/paypal),
[PayPal integration](https://developer.paypal.com/studio/checkout/standard/integrate),
[Mercado Pago Checkout Pro](https://www.mercadopago.com.br/developers/en/docs/checkout-pro-orders/overview?scope=prod),
[MoonPay Commerce](https://support.moonpay.com/en/articles/466261-what-is-moonpay-commerce).

Do not start a new Coinbase Commerce integration based on older recommendations:
its official transition guidance directs merchants to Coinbase Business.
[Coinbase transition](https://help.coinbase.com/en/transitioning-from-coinbase-commerce-to-coinbase-business).

## Implications for the next construction plan

The existing ledger is USD-only. Pix needs a server-owned BRL quote, stored quote
expiry, currency-aware bounds, and reconciliation against the quoted payment
currency. Do not relabel USD cents as BRL or accept browser FX calculations.
USDC likewise needs explicit token/network and amount handling in its adapter;
provider settlement currency is separate from customer payment currency.

All adapters should converge on one order/customer/entitlement system. Provider
IDs must be namespaced; a redirect or wallet transaction supplied by the browser
is not payment proof. One paid order grants one entitlement across retries and
competing payment attempts. Preserve asynchronous payment and refund states.

Construction order: confirm merchant country and available methods; define quote
and provider-attempt records; implement Stripe sandbox and a complete buyer journey;
add PayPal; add the eligible Pix path; add the eligible USDC path. Exercise each
method through verified payment and protected download. Merchant account activation
and secrets are operational dependencies for actual sandbox runs; final license
and distribution approval are separate release dependencies. No live payment or
public deployment is authorized by this research.

## Open Questions

- Merchant country/entity and method activation; actual fees and settlement currency.
- Required downstream permissions, attribution, trademark use and patent terms.
- USDC alternative's merchant eligibility, network, refunds and verification contract.
- BRL pricing/FX policy and shared refund, reservation and account-recovery policy.

Owner: requesting product owner. Related [intake](PROJECT-INTAKE.md) and
[commercial handoff](COMMERCIAL-HANDOFF.md).
