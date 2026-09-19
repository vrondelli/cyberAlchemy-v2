#!/usr/bin/env node

import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../../../../..");
const snapshots = [
  [
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/legacy-whole-file-snapshots/enum-v1/ontology.json",
  ],
  [
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/legacy-whole-file-snapshots/enum-v1/base-domain.profile.json",
  ],
  [
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/legacy-whole-file-snapshots/enum-v1/typescript-strict.profile.json",
  ],
];

for (const [sourcePath, targetPath] of snapshots) {
  const target = resolve(repositoryRoot, targetPath);
  if (existsSync(target)) throw new Error(`ENUM_LEGACY_SNAPSHOT_ALREADY_EXISTS:${targetPath}`);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, readFileSync(resolve(repositoryRoot, sourcePath)));
}

console.log(JSON.stringify({
  result: "pass",
  snapshot_kind: "immutable-historical-whole-file-inputs",
  files: snapshots.map(([, target]) => target),
  authority_effect: "none",
}, null, 2));
