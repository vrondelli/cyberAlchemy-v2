import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const STEPS = [
  ["mutation", "mutation/run-base.mjs"],
  ["reroute", "evidence/build-reroute-generation.mjs"],
  ["corpus", "evidence/build-corpus-generation.mjs"],
  ["relationship_packet", "evidence/build-relationship-packet-generation.mjs"],
  ["dossier", "evidence/build-dossier-generation.mjs"],
];

export function replayMechanicalGeneration(repairRoot, records) {
  const checks = [];
  for (const [plane, script] of STEPS) {
    const execution = spawnSync(process.execPath, [join(repairRoot, script)], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
    if (execution.status !== 0) throw new Error(`${plane} replay failed: ${execution.stdout}${execution.stderr}`);
    const observed = JSON.parse(readFileSync(join(repairRoot, records[plane].path), "utf8"));
    checks.push({
      plane,
      expected_content_digest: records[plane].content_digest,
      observed_content_digest: observed.content_digest,
      expected_generation_id: records[plane].generation_id,
      observed_generation_id: observed.generation_id,
      match: observed.content_digest === records[plane].content_digest && observed.generation_id === records[plane].generation_id,
    });
  }
  return { status: checks.every((check) => check.match) ? "identical" : "invalidated", checks };
}
