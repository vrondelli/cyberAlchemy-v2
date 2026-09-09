import {containsPhrase, semanticKey} from "../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/consumer-runtime.mjs";
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

export const alchSemanticModuleManifest = sealModuleManifest({
  schema_version: "are.module-manifest/v1",
  module_id: "alch-semantic-prelude",
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

export function createAlchSemanticAdapter() {
  return Object.freeze({
    manifest: alchSemanticModuleManifest,
    invoke(invocation) {
      if (invocation.capability_id === SEMANTIC_KEY_CAPABILITY && typeof invocation.input?.text === "string") {
        return {key: semanticKey(invocation.input.text)};
      }
      if (invocation.capability_id === CONTAINS_PHRASE_CAPABILITY
        && typeof invocation.input?.text === "string" && typeof invocation.input?.phrase === "string") {
        return {matched: containsPhrase(invocation.input.text, invocation.input.phrase)};
      }
      throw new TypeError("Alch semantic invocation is invalid.");
    },
  });
}

export function createAlchSemanticModulePort() {
  return createModulePort({
    adapters: [createAlchSemanticAdapter()],
    output_validators: semanticTextOutputValidators,
  });
}
