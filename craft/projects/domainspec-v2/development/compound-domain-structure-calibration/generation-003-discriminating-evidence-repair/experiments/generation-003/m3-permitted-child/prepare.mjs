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

for (const name of ["App.jsx", "vectors.json"]) {
  const bytes = readFileSync(resolve(baselineRoot, name));
  writeFileSync(resolve(baselineFrame, name), bytes);
  writeFileSync(resolve(mutantFrame, name), bytes);
}

const baselineModel = readFileSync(resolve(baselineRoot, "model.mjs"), "utf8");
const needle = '"9": screen("step-9-baseline", ["onBack", "onNext"]),';
const replacement = '"9": screen("step-9-alternate", ["onBack", "onNext"]),';
if (baselineModel.split(needle).length !== 2) throw new TypeError("permitted edit source is not singular");
const mutantModel = baselineModel.replace(needle, replacement);
writeFileSync(resolve(baselineFrame, "model.mjs"), baselineModel);
writeFileSync(resolve(mutantFrame, "model.mjs"), mutantModel);
