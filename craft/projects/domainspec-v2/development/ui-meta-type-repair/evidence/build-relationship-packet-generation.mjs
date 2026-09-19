import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createRelationshipOwnerPacket } from "./relationship-owner-packet.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const workspaceRoot = resolve(repairRoot, "../../../..");
const fixturePath = join(repairRoot, "fixtures/contracts/relationship-owner-packet.json");
const outDir = resolve(getArg("--out-dir") || join(here, "results/relationship-packet/generation-001"));
const input = JSON.parse(readFileSync(fixturePath, "utf8"));
const authorityPath = resolve(workspaceRoot, input.authority.source_path);
const actualAuthorityDigest = rawSha256(readFileSync(authorityPath, "utf8"));
const packet = createRelationshipOwnerPacket({ ...input, created_at: "2026-07-11T00:00:00Z" }, { actualAuthorityDigest });

publish(packet);

function rawSha256(value) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function publish(record) {
  const target = join(outDir, "packet.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable relationship packet already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical relationship packet at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`PASS: published pending-owner packet with ${record.semantic.questions.length} finite questions at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
