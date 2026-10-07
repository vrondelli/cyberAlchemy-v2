#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

import {compileRepositoryPolicyBundle} from "../src/policy-bundle.mjs";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const productRoot = resolve(packageRoot, "../..");
const repositoryRoot = resolve(productRoot, "../../..");
const profilePath = resolve(packageRoot, "profiles/cyberalchemy-v1.json");
const outputPath = resolve(process.argv[2] ?? resolve(packageRoot, "profiles/cyberalchemy-route-pack-v1.json"));
const compiled = compileRepositoryPolicyBundle(profilePath, repositoryRoot);
if (!compiled.ok) {
  process.stderr.write(`${JSON.stringify(compiled)}\n`);
  process.exitCode = 1;
} else {
  writeFileSync(outputPath, `${JSON.stringify(compiled.value, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ok: true, output_path: outputPath, bundle_digest: compiled.value.bundle_digest, authority_effect: "none"})}\n`);
}
