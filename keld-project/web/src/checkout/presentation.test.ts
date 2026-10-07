import assert from 'node:assert/strict';
import test from 'node:test';
import {checkoutPresentationState, checkoutProgressIndex, lateRefundMessage, revocationMessage, type CheckoutPresentationState} from './presentation.ts';
import type {StoredCheckout} from './client.ts';

const orderId = 'a'.repeat(32);
const base: StoredCheckout = {
  input: {provider: 'stripe', amountCents: 20000},
  requestKey: 'request-key',
  state: 'pending',
};

test('presentation reducer keeps browser activity separate from payment truth', () => {
  assert.equal(checkoutPresentationState({authState: 'checking', checkout: null}), 'unavailable');
  assert.equal(checkoutPresentationState({authState: 'anonymous', checkout: null}), 'review');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: null, activity: 'creating'}), 'creating');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: base, activity: 'verifying'}), 'verifying');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: base}), 'pending');
});

test('provider instructions and terminal states derive only from stored or verified state', () => {
  const hosted: StoredCheckout = {...base, result: {mode: 'sandbox', orderId, amountCents: 20000, currency: 'USD', checkoutUrl: 'https://checkout.stripe.com/c/pay/fixture'}};
  const pix: StoredCheckout = {...base, input: {...base.input, provider: 'mercadopago', payerEmail: 'buyer@example.test'}, result: {mode: 'sandbox', orderId, amountCents: 102000, currency: 'BRL', usdAmountCents: 20000, quoteReference: 'merchant-fixed-5.10', pixCode: '000201-fixture', paymentExpiresAt: 200}};
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: hosted}), 'awaiting_provider');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: pix, now: 199}), 'awaiting_customer_action');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: pix, now: 200}), 'pending');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: {...pix, ledgerStatus: 'expired'}, now: 200}), 'pending');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: pix, verificationStatus: 'pending', now: 200}), 'pending');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: pix, verificationStatus: 'awaiting-payment', now: 200}), 'pending');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: {...hosted, state: 'paid'}}), 'paid');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: {...hosted, state: 'revoked'}, verificationStatus: 'paid'}), 'revoked');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: {...hosted, state: 'paid'}, verificationStatus: 'revoked'}), 'revoked');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: {...hosted, state: 'failed'}}), 'failed');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: hosted, verificationStatus: 'paid-review'}), 'review_required');
  assert.equal(checkoutPresentationState({authState: 'authenticated', checkout: hosted, verificationStatus: 'cancelled'}), 'failed');
});

test('progress is orientation only and never upgrades a payment state', () => {
  const expected: Record<CheckoutPresentationState, number> = {
    review: 0,
    unavailable: 0,
    creating: 1,
    awaiting_provider: 1,
    awaiting_customer_action: 1,
    verifying: 2,
    pending: 2,
    paid: 3,
    revoked: 3,
    failed: 3,
    review_required: 3,
  };
  for (const [state, step] of Object.entries(expected)) {
    assert.equal(checkoutProgressIndex(state as CheckoutPresentationState), step);
  }
});

test('late-payment copy never promises a refund from an intent or an unresolved check', () => {
  for (const state of ['recorded', 'checking', 'review-required'] as const) {
    const message = lateRefundMessage(state);
    assert.match(message!, /No full refund is confirmed/i);
    assert.match(message!, /Do not pay again/);
    assert.doesNotMatch(message!, /refund (requested|sent|completed)/i);
  }
  assert.equal(lateRefundMessage(undefined), null);
  assert.match(lateRefundMessage('verified-full-refund')!, /verified a full refund/);
  assert.match(revocationMessage('lost-dispute'), /lost dispute/);
  assert.doesNotMatch(revocationMessage('lost-dispute'), /full refund/);
  assert.match(revocationMessage('full-refund'), /full refund/);
});
