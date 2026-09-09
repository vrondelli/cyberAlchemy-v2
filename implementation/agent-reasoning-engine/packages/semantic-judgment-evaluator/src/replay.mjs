import { canonicalBytes, sha256Bytes } from "./canonical-json.mjs";
import { evaluateSemanticJudgment } from "./reducer.mjs";
import { assembleReasoningReceipt } from "./receipt.mjs";

export function historicalReplay(request, expectedBytes) {
  const telemetry = {
    provider_calls: 0,
    evaluator_calls: 0,
    effect_gate_calls: 0,
    effect_attempts: 0,
  };
  const semantic = evaluateSemanticJudgment(request, telemetry);
  const assembled = assembleReasoningReceipt(request, semantic);
  const bytes = canonicalBytes(assembled.receipt);
  return {
    matches_exact_bytes: Buffer.compare(bytes, expectedBytes) === 0,
    expected_exact_bytes_digest: sha256Bytes(expectedBytes),
    replay_exact_bytes_digest: sha256Bytes(bytes),
    receipt: assembled.receipt,
    bytes,
    telemetry,
  };
}
