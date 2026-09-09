export const TEST_ACTION = "record_test_recommendation";
export const TEST_TARGET =
  "test://semantic-judgment-evaluator/effect-log";

export class EffectDispatcherTestDouble {
  constructor() {
    this.calls = [];
    this.deliveries = new Map();
  }

  async attempt(delivery) {
    if (
      delivery.action !== TEST_ACTION ||
      delivery.target !== TEST_TARGET ||
      delivery.outcome !== "RecommendedUnderSnapshot" ||
      typeof delivery.reasoning_receipt_digest !== "string" ||
      typeof delivery.effect_gate_decision_digest !== "string" ||
      typeof delivery.fixed_effect_envelope_digest !== "string" ||
      typeof delivery.idempotency_key !== "string"
    ) {
      throw new TypeError("effect test double rejected a non-exact delivery");
    }

    const fingerprint = JSON.stringify(delivery);
    const prior = this.deliveries.get(delivery.idempotency_key);
    if (prior) {
      if (prior.fingerprint !== fingerprint) {
        return {
          status: "IdempotencyConflict",
          logical_attempt_id: prior.result.logical_attempt_id,
          new_attempt: false,
        };
      }
      return { ...prior.result, new_attempt: false };
    }

    const result = {
      status: "TestEffectRecorded",
      logical_attempt_id: `test-attempt:${delivery.idempotency_key}`,
      new_attempt: true,
    };
    this.deliveries.set(delivery.idempotency_key, {
      fingerprint,
      result,
    });
    this.calls.push(delivery);
    return result;
  }
}
