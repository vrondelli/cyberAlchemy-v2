export const SCREEN_REGISTRY = Object.freeze({
  login: Object.freeze({ screen_key: "login", ports: [] }),
  onboarding: Object.freeze({ screen_key: "onboarding", ports: ["onBack", "onNext"] }),
  "1": Object.freeze({ screen_key: "1", ports: ["onNext"] }),
  "2": Object.freeze({ screen_key: "2", ports: ["onBack", "onNext"] }),
  "3": Object.freeze({ screen_key: "3", ports: ["onBack", "onNext"] }),
  "4": Object.freeze({ screen_key: "4", ports: ["onBack", "onNext"] }),
  "5": Object.freeze({ screen_key: "5", ports: ["onDone"] }),
  "6": Object.freeze({ screen_key: "6", ports: ["onBack", "onNext"] }),
  "7": Object.freeze({ screen_key: "7", ports: ["onBack", "onGenerate"] }),
  "8": Object.freeze({ screen_key: "8", ports: ["onBack", "onNext"] }),
  "9": Object.freeze({ screen_key: "9", ports: ["onBack", "onNext"], implementation: "baseline-feedback" }),
  "10": Object.freeze({ screen_key: "10", ports: ["onBack", "onNext", "onRestart"] }),
  "11": Object.freeze({ screen_key: "11", ports: ["onRestart"] }),
  settings: Object.freeze({ screen_key: "settings", ports: ["onBack", "onSave"] }),
});

export function selectScreen(step, registry = SCREEN_REGISTRY) {
  const screen = registry[step];
  if (!screen) throw new TypeError(`unknown screen step: ${step}`);
  return screen;
}
