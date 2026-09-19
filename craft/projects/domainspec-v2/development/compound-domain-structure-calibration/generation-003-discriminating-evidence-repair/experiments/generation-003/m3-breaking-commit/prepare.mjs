import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(experimentRoot, "../../..");
const baselineRoot = resolve(packageRoot, "harness/browser-baseline");
const baselineFrame = resolve(experimentRoot, "frames/baseline");
const mutantFrame = resolve(experimentRoot, "frames/mutant");
mkdirSync(baselineFrame, { recursive: true });
mkdirSync(mutantFrame, { recursive: true });
for (const name of ["model.mjs", "vectors.json"]) {
  const bytes = readFileSync(resolve(baselineRoot, name));
  writeFileSync(resolve(baselineFrame, name), bytes);
  writeFileSync(resolve(mutantFrame, name), bytes);
}
const baselineApp = readFileSync(resolve(baselineRoot, "App.jsx"), "utf8");
const needle = "setStep(result.step);";
if (baselineApp.split(needle).length !== 2) throw new TypeError("commit adapter edit source is not singular");
writeFileSync(resolve(baselineFrame, "App.jsx"), baselineApp);
writeFileSync(resolve(mutantFrame, "App.jsx"), baselineApp.replace(needle, "setStep(requested);"));
