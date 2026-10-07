#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

import {compileRepositoryRuntimeBundle} from "../index.mjs";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repositoryRoot = resolve(packageRoot, "../../../../..");
const output = resolve(packageRoot, "profiles/repository-runtime-v1.json");
const compiled = compileRepositoryRuntimeBundle({
  profile_path: resolve(packageRoot, "profiles/repository-v1.json"),
  policy_bundle_path: resolve(packageRoot, "../request-decision-router/profiles/cyberalchemy-route-pack-v1.json"),
  repository_root: repositoryRoot,
});
if (!compiled.ok) {
  process.stderr.write(`${JSON.stringify(compiled)}\n`);
  process.exitCode = 1;
} else {
  writeFileSync(output, `${JSON.stringify(compiled.value, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ok: true, output, bundle_digest: compiled.value.bundle_digest, source_epoch_digest: compiled.value.source_epoch_digest, authority_effect: "none"})}\n`);
}
