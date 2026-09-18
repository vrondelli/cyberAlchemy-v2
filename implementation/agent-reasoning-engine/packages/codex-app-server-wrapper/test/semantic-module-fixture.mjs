import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {createNativeSemanticAdapter} from "../../module-port/native-semantic-adapter.mjs";

export function semanticModulePort() {
  return createModulePort({
    adapters: [createNativeSemanticAdapter()],
    output_validators: semanticTextOutputValidators,
  });
}

export function semanticTextFacade() {
  return createSemanticTextFacade(semanticModulePort(), {consumer_id: "request-intent-runtime"});
}
