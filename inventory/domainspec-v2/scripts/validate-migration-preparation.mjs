#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function fail(message) {
  process.stderr.write(`migration-preparation: ${message}\n`);
  process.exitCode = 1;
}

function findRepositoryRoot(startPath) {
  let candidate = path.resolve(startPath);
  while (true) {
    if (existsSync(path.join(candidate, ".git"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) throw new Error(`cannot locate repository root from ${startPath}`);
    candidate = parent;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function canonicalDigest(value) {
  return sha256(Buffer.from(JSON.stringify(stable(value)), "utf8"));
}

const repoRoot = findRepositoryRoot(process.cwd());
const candidateDocuments = [
  "cyberAlchemy-v2/product/domainspec-v2/README.md",
  "cyberAlchemy-v2/product/domainspec-v2/PRODUCT-THESIS.md",
  "cyberAlchemy-v2/architecture/domainspec-v2/README.md",
  "cyberAlchemy-v2/architecture/domainspec-v2/SYSTEM-ARCHITECTURE.md",
  "cyberAlchemy-v2/architecture/domainspec-v2/MIGRATION-CONTRACT.md",
  "cyberAlchemy-v2/ontology/domainspec-v2/README.md",
  "cyberAlchemy-v2/authority/decisions/domainspec-v2-migration/DECISION.md",
];

let checkedLinks = 0;
for (const repoPath of candidateDocuments) {
  const absolutePath = path.join(repoRoot, repoPath);
  if (!existsSync(absolutePath)) {
    fail(`missing document: ${repoPath}`);
    continue;
  }
  const text = readFileSync(absolutePath, "utf8");
  for (const required of ["status:", "authority_effect:", "## Open Questions"]) {
    if (!text.includes(required)) fail(`${repoPath} lacks ${required}`);
  }
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) {
      continue;
    }
    checkedLinks += 1;
    const resolved = path.resolve(path.dirname(absolutePath), decodeURIComponent(target));
    if (!existsSync(resolved)) fail(`broken link in ${repoPath}: ${match[1]}`);
  }
}

const expectedSourceDigests = {
  "projects/domainspec-v2/ARCHITECTURE.md": "c9e26cd91b8795ce768e842106c78bec0d180941a86dd2cee612799bba853f35",
  "projects/domainspec-v2/PRODUCT-THESIS.md": "13e2eeb7b59cd89c02283d8e54bbb85ed0b0d0d7479f5c666ad289ff5f28a171",
  "projects/domainspec-v2/ontology/nodes.json": "db9462c6e374ab2ce8dd7f87859319342f85605a5832db9397b8bcb783751a97",
  "projects/domainspec-v2/ontology/profile.json": "faf18d783a4a8fd900f1c6921aa0a3c72cf7ab2a7d6cdd46ac7617202303b998",
  "projects/domainspec-v2/ontology/relations.json": "6bd62df22972bfa37db9cab9d5e0858c58769d810dee4d6b59299a880df246ed",
  "projects/domainspec-v2/ontology/residue.json": "cb648e5e97e0b3f1530ebdde201844fed48a0f36716cdfb8c4a668b44e951d16",
};
for (const [repoPath, expectedDigest] of Object.entries(expectedSourceDigests)) {
  const actualDigest = sha256(readFileSync(path.join(repoRoot, repoPath)));
  if (actualDigest !== expectedDigest) fail(`source digest drift: ${repoPath}`);
}

const inventoryRoot = path.join(repoRoot, "cyberAlchemy-v2/inventory/domainspec-v2");
const sourceManifest = JSON.parse(readFileSync(path.join(inventoryRoot, "source-manifest.json"), "utf8"));
const index = JSON.parse(readFileSync(path.join(inventoryRoot, "index.json"), "utf8"));
if (index.source_manifest_digest !== sourceManifest.content_digest) {
  fail("inventory index does not bind the source manifest digest");
}
if (sourceManifest.content_digest !== "377362acdbaa687839389790d92f1e6e5be9352cdcaf460f081daca12d13114d") {
  fail("unexpected DomainSpec source manifest digest");
}

const decisionRoot = path.join(
  repoRoot,
  "cyberAlchemy-v2/authority/decisions/domainspec-v2-migration",
);
const request = JSON.parse(readFileSync(path.join(decisionRoot, "option-admissibility-request.json"), "utf8"));
const receipt = JSON.parse(readFileSync(path.join(decisionRoot, "option-admissibility-receipt.json"), "utf8"));
if (receipt.requestDigest !== canonicalDigest(request)) fail("Decision Gate request digest mismatch");
if (receipt.routeOutcome !== "gate" || receipt.decisionGateRequired !== true) {
  fail("Decision Gate receipt must require an owner gate");
}
if (!receipt.rejectedOptions.some((option) => option.optionId === "MIG-C-DIRECT-RELOCATION")) {
  fail("Decision Gate receipt must reject direct relocation");
}

if (process.exitCode) process.exit(process.exitCode);
process.stdout.write(
  `pass: ${candidateDocuments.length} documents, ${checkedLinks} local links, ` +
    `${Object.keys(expectedSourceDigests).length} source digests, inventory and decision bindings\n`,
);
