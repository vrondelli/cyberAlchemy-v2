import {paymentPresentation, type LateRefundStatus, type RevocationReason, type StoredCheckout} from './client.ts';

export function lateRefundMessage(status?: LateRefundStatus): string | null {
  switch (status) {
    case 'recorded': return 'Synvora recorded this late payment for resolution. No full refund is confirmed. Do not pay again.';
    case 'checking': return 'Synvora is checking this late payment and refund outcome. No full refund is confirmed yet. Do not pay again.';
    case 'review-required': return 'This late payment needs review. No full refund is confirmed. Do not pay again.';
    case 'verified-full-refund': return 'Synvora verified a full refund. Future access to this order is revoked.';
    default: return null;
  }
}

export function revocationMessage(reason?: RevocationReason): string {
  if (reason === 'full-refund') return 'Synvora verified a full refund. Future access to this order is revoked.';
  if (reason === 'lost-dispute') return 'Synvora verified a lost dispute. Future access to this order is revoked.';
  return 'Synvora revoked future access after a verified full refund or lost dispute.';
}

export type CheckoutPresentationState =
  | 'review'
  | 'creating'
  | 'awaiting_provider'
  | 'awaiting_customer_action'
  | 'verifying'
  | 'pending'
  | 'replacement_pending'
  | 'paid'
  | 'revoked'
  | 'failed'
  | 'review_required'
  | 'unavailable';

export type CheckoutActivity = 'idle' | 'creating' | 'verifying';
export type CheckoutAuthState = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

export interface CheckoutPresentationInput {
  authState: CheckoutAuthState;
  checkout: StoredCheckout | null;
  activity?: CheckoutActivity;
  verificationStatus?: string | null;
  now?: number;
}

const failedStatuses = new Set(['cancelled', 'failed', 'rejected']);

export function checkoutPresentationState({
  authState,
  checkout,
  activity = 'idle',
  verificationStatus,
  now = Math.floor(Date.now() / 1000),
}: CheckoutPresentationInput): CheckoutPresentationState {
  if (authState === 'checking' || authState === 'unavailable') return 'unavailable';
  if (activity === 'creating') return 'creating';
  if (activity === 'verifying') return 'verifying';
  if (!checkout) return 'review';
  if (checkout.replacementDraft) return 'replacement_pending';
  if (checkout.state === 'revoked' || verificationStatus === 'revoked') return 'revoked';
  if (checkout.state === 'paid' || verificationStatus === 'paid') return 'paid';
  if (checkout.state === 'failed' || failedStatuses.has(verificationStatus ?? '')) return 'failed';

  const status = verificationStatus ?? checkout.ledgerStatus ?? checkout.result?.checkoutState;
  if (status === 'paid-review' || status === 'verification-required') return 'review_required';
  if (status === 'expired') return 'pending';
  if (!checkout.result) return 'pending';

  const result = paymentPresentation(checkout.result, now);
  if (result.checkoutState === 'expired') {
    // An expired provider link is not proof that the server-owned order closed.
    // Recovery verifies the provider and server before presenting a fresh review form.
    return 'pending';
  }
  if (result.checkoutState === 'verification-required') return 'review_required';
  if (result.pixCode) return 'awaiting_customer_action';
  if (result.checkoutUrl) return 'awaiting_provider';
  return 'pending';
}

export function checkoutProgressIndex(state: CheckoutPresentationState): number {
  if (state === 'review' || state === 'unavailable') return 0;
  if (state === 'creating' || state === 'awaiting_provider' || state === 'awaiting_customer_action') return 1;
  if (state === 'verifying' || state === 'pending' || state === 'replacement_pending') return 2;
  return 3;
}
