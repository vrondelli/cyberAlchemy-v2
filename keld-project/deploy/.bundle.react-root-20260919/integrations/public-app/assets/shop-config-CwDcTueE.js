/* Public storefront configuration. All price amounts below are integer USD cents.
 * Never put secrets, private download URLs or entitlement tokens in this file.
 * Buyer-selected price is validated here for UX and MUST be validated by the server.
 * Keep preview mode until payment creation and verified delivery are implemented.
 */
window.KELD_SHOP_CONFIG = {
  mode: 'preview',
  approvedForSale: false,
  fulfillmentReady: false,
  currency: 'USD',
  productName: 'Agent Reasoning Engine',
  releaseStage: 'alpha',
  earlySupporter: {
    customerLimit: 100,
    upgradesMonths: 12,
    directSupportMonths: 12,
    periodStarts: 'verified-purchase',
    entitlementReady: false // Only set true after server-side eligibility + fulfillment are implemented.
  },
  licenseId: 'Apache-2.0',
  licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
  contactEmail: '',
  deliverySummary: 'Downloadable software package under Apache License 2.0. No hosted-engine access is part of this offer.',
  releaseSummary: '',
  termsUrl: '',
  privacyUrl: '',
  refundUrl: '',
  checkoutEndpoint: '', // Same-origin HTTPS POST endpoint, e.g. /api/checkout. Not a fixed-price Payment Link.
  offers: {
    release: {
      name: 'Downloadable alpha release',
      audience: 'For independent builders and teams',
      amount: 20000,       // $200 base / initial selection.
      minimumAmount: 5000, // $50 inclusive.
      maximumAmount: 100000, // $1,000 inclusive.
      presets: [5000, 10000, 20000, 50000, 100000], // Below-base presets are hidden until discovered.
      priceSuffix: 'one-time purchase'
    }
  }
};
