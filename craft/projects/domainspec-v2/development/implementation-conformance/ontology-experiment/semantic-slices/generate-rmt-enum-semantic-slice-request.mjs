#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../../../../..");
const sourcePath = resolve(repositoryRoot,
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum.request.json");
const targetPath = resolve(repositoryRoot,
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum-semantic-slice.request.json");
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const ref = (path) => ({path, sha256: sha256(resolve(repositoryRoot, path))});

const request = JSON.parse(readFileSync(sourcePath, "utf8"));
request.request_id = "rmt-enum-semantic-slice-v1";
const typescript = request.nodes.find(({node_id}) =>
  node_id === "enum.typescript.shipment-priority");
if (typescript === undefined) throw new Error("ENUM_TYPESCRIPT_NODE_MISSING");
typescript.provider_id = "typescript-enum-shipment-priority-semantic-slice-v1";
const existing = new Map(typescript.input_refs.map(({role, ref: value}) => [role, value]));
typescript.input_refs = [
  {role: "case", ref: existing.get("case")},
  {role: "expected", ref: existing.get("expected")},
  {role: "ontology_slice", ref: ref(
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/ontology.slice.json")},
  {role: "typescript_profile_slice", ref: ref(
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/typescript-profile.slice.json")},
  {role: "provider", ref: existing.get("provider")},
];
writeFileSync(targetPath, `${JSON.stringify(request, null, 2)}\n`, "utf8");
console.log(JSON.stringify({result: "pass", path: targetPath, sha256: sha256(targetPath)}, null, 2));
