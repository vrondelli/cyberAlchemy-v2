import { buildEnvelope } from "../../evaluation/canonical-json.mjs";
import { evaluateSuite } from "../../evaluation/evaluate-suite.mjs";
import { validateGenerationIndex } from "../../evaluation/generation-index.mjs";
import { validateSuiteResult } from "../../evaluation/validate-input.mjs";

export function evaluateSuccessorSuite(
  fixtureResults,
  { replayState, predecessorGenerationId, generationIndex },
) {
  validateGenerationIndex(generationIndex);
  if (generationIndex.entries.length === 0) throw new TypeError("successor requires an existing generation");
  if (typeof predecessorGenerationId !== "string") throw new TypeError("successor predecessor is required");
  const tail = generationIndex.entries.at(-1).generation_id;
  if (predecessorGenerationId !== tail) throw new TypeError("successor predecessor must equal current generation tail");

  const parentResult = evaluateSuite(fixtureResults, { replayState });
  const successor = buildEnvelope({
    schemaVersion: parentResult.schema_version,
    contractId: parentResult.contract_id,
    contractVersion: parentResult.contract_version,
    status: parentResult.status,
    semantic: parentResult.semantic,
    prohibitedInferences: parentResult.prohibited_inferences,
    predecessorGenerationId,
    inputHandles: parentResult.input_handles,
  });
  if (generationIndex.entries.some((entry) => entry.generation_id === successor.generation_id)) {
    throw new TypeError("duplicate successor generation id");
  }
  validateSuiteResult(successor);
  return successor;
}
