import {MODULE_INVOCATION_SCHEMA} from "./index.mjs";

export const SEMANTIC_KEY_CAPABILITY = "text.semantic-key/v1";
export const CONTAINS_PHRASE_CAPABILITY = "text.contains-phrase/v1";
export const SEMANTIC_KEY_INPUT_PROTOCOL = "are.text-input/v1";
export const SEMANTIC_KEY_OUTPUT_PROTOCOL = "are.semantic-key-output/v1";
export const CONTAINS_PHRASE_INPUT_PROTOCOL = "are.phrase-input/v1";
export const CONTAINS_PHRASE_OUTPUT_PROTOCOL = "are.phrase-match-output/v1";

export const semanticTextOutputValidators = Object.freeze({
  [SEMANTIC_KEY_OUTPUT_PROTOCOL]: (value) => value !== null && typeof value === "object"
    && !Array.isArray(value) && Object.keys(value).length === 1 && typeof value.key === "string",
  [CONTAINS_PHRASE_OUTPUT_PROTOCOL]: (value) => value !== null && typeof value === "object"
    && !Array.isArray(value) && Object.keys(value).length === 1 && typeof value.matched === "boolean",
});

function requiredText(value, field) {
  if (typeof value !== "string") throw new TypeError(`${field} must be a string.`);
  return value;
}

function invocation(consumerId, invocationId, capabilityId, input) {
  return {
    schema_version: MODULE_INVOCATION_SCHEMA,
    invocation_id: requiredText(invocationId, "invocation_id"),
    consumer_id: requiredText(consumerId, "consumer_id"),
    capability_id: capabilityId,
    input,
    dependency_posture: "required-for-judgment",
    authority_effect: "none",
  };
}

export function createSemanticTextFacade(modulePort, {consumer_id} = {}) {
  if (!modulePort || typeof modulePort.invoke !== "function") throw new TypeError("A Module Port is required.");
  const consumerId = requiredText(consumer_id, "consumer_id");
  return Object.freeze({
    semanticKey(text, {invocation_id} = {}) {
      return modulePort.invoke(invocation(consumerId, invocation_id, SEMANTIC_KEY_CAPABILITY, {text: requiredText(text, "text")}));
    },
    containsPhrase(text, phrase, {invocation_id} = {}) {
      return modulePort.invoke(invocation(consumerId, invocation_id, CONTAINS_PHRASE_CAPABILITY, {
        text: requiredText(text, "text"),
        phrase: requiredText(phrase, "phrase"),
      }));
    },
  });
}
