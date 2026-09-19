import { SCREEN_REGISTRY } from "../../../harness/baseline/screen-registry.mjs";

export const M1_CHANGED_PATHS = Object.freeze(["screen-registry.9.implementation"]);

export function createM1Registry() {
  const baseline = SCREEN_REGISTRY["9"];
  const replacement = Object.freeze({
    ...baseline,
    implementation: "alternate-feedback-adapter",
  });
  return Object.freeze({
    ...SCREEN_REGISTRY,
    "9": replacement,
  });
}
