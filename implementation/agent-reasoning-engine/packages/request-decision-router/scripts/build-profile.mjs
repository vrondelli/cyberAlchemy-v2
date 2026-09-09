#!/usr/bin/env node
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {computeDecisionProfileDigest} from "../src/profile.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const profilePath = resolve(packageRoot, "profiles/cyberalchemy-v1.json");
const profile = JSON.parse(readFileSync(profilePath, "utf8"));

for (const source of profile.provenance) {
  source.sha256 = createHash("sha256")
    .update(readFileSync(resolve(repositoryRoot, source.path)))
    .digest("hex");
}
profile.profile_digest = computeDecisionProfileDigest(profile);
writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
