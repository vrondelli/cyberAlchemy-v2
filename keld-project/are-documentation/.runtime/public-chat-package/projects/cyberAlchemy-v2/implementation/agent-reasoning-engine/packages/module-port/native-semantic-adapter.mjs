import {createModulePort, sealModuleManifest} from "./index.mjs";
import {
  CONTAINS_PHRASE_CAPABILITY,
  CONTAINS_PHRASE_INPUT_PROTOCOL,
  CONTAINS_PHRASE_OUTPUT_PROTOCOL,
  SEMANTIC_KEY_CAPABILITY,
  SEMANTIC_KEY_INPUT_PROTOCOL,
  SEMANTIC_KEY_OUTPUT_PROTOCOL,
  semanticTextOutputValidators,
} from "./semantic-text.mjs";

function canonical(value) {
  return value.normalize("NFKC").trim().toLowerCase();
}

export function semanticKey(value) {
  if (typeof value !== "string") throw new TypeError("semantic-key input must be string");
  return canonical(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function containsPhrase(text, phrase) {
  if (typeof text !== "string" || typeof phrase !== "string") throw new TypeError("contains-phrase input must be strings");
  const normalizedText = semanticKey(text);
  const normalizedPhrase = semanticKey(phrase);
  return normalizedPhrase.length > 0 && ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

export const nativeSemanticModuleManifest = sealModuleManifest({
  schema_version: "are.module-manifest/v1",
  module_id: "are-native-semantic-text",
  version: "1-candidate",
  adapter_protocol: "are.module-adapter/v1",
  capabilities: [
    {capability_id: SEMANTIC_KEY_CAPABILITY, input_protocol: SEMANTIC_KEY_INPUT_PROTOCOL, output_protocol: SEMANTIC_KEY_OUTPUT_PROTOCOL},
    {capability_id: CONTAINS_PHRASE_CAPABILITY, input_protocol: CONTAINS_PHRASE_INPUT_PROTOCOL, output_protocol: CONTAINS_PHRASE_OUTPUT_PROTOCOL},
  ],
  required_permissions: [],
  side_effects: false,
  authority_effect: "none",
});

export function createNativeSemanticAdapter() {
  return Object.freeze({
    manifest: nativeSemanticModuleManifest,
    invoke(invocation) {
      if (invocation.capability_id === SEMANTIC_KEY_CAPABILITY && typeof invocation.input?.text === "string") {
        return {key: semanticKey(invocation.input.text)};
      }
      if (invocation.capability_id === CONTAINS_PHRASE_CAPABILITY
        && typeof invocation.input?.text === "string" && typeof invocation.input?.phrase === "string") {
        return {matched: containsPhrase(invocation.input.text, invocation.input.phrase)};
      }
      throw new TypeError("Native semantic invocation is invalid.");
    },
  });
}

export function createNativeSemanticModulePort() {
  return createModulePort({adapters: [createNativeSemanticAdapter()], output_validators: semanticTextOutputValidators});
}
