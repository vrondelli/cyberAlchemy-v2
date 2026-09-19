import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "../../browser-runtime/node_modules/esbuild/lib/main.js";

const harnessRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(harnessRoot, "../..");

export async function buildHarness() {
  const outdir = resolve(harnessRoot, "dist");
  mkdirSync(outdir, { recursive: true });
  await build({
    entryPoints: [resolve(harnessRoot, "App.jsx")],
    outfile: resolve(outdir, "bundle.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome149"],
    jsx: "automatic",
    legalComments: "none",
    sourcemap: false,
    nodePaths: [resolve(packageRoot, "browser-runtime/node_modules")],
  });
  return resolve(outdir, "bundle.js");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildHarness();
