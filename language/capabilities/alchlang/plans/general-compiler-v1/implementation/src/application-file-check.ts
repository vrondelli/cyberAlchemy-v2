import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadApplicationFile, assertApplicationFileCurrent, type ApplicationFileOptions } from "./application-file-input.js";
import { compileApplicationExecutable } from "./application-executable.js";
import { compileApplicationWhole } from "./application-whole.js";
import { digest, json } from "./domainspec-profile.js";
import { validateExactFormalSourceRef } from "./formal-claim-lowering.js";

/** Shared source plan for check/build/verify. No provider execution or destination writes. */
export async function planApplicationFile(sourcePath: string, options: ApplicationFileOptions = {}) {
  const loaded = await loadApplicationFile(sourcePath, options);
  const root = mkdtempSync(path.join(os.tmpdir(), "alch-application-check-"));
  try {
    for (const [relative, bytes] of Object.entries(loaded.candidate.projectFiles)) {
      validateExactFormalSourceRef({ path: relative, sha256: digest(bytes), size_bytes: Buffer.byteLength(bytes), current: true }, "$project");
      const target = path.join(root, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, bytes, { flag: "wx" });
    }
    const graph = loaded.compiler.compileProject(root).graph;
    const whole = loaded.observation === undefined ? undefined
      : compileApplicationWhole(loaded.candidate, graph, loaded.observation, loaded.compiler);
    const executable = whole?.executable ?? compileApplicationExecutable(loaded.candidate, graph, loaded.compiler);
    assertApplicationFileCurrent(loaded);
    const report = { status: "valid" as const, profile: "application-v1" as const,
      scope: whole ? "whole-application-artifacts" as const : "executable" as const,
      source_sha256: loaded.inputs[path.basename(loaded.source_path)]!,
      inputs_sha256: digest(json(loaded.inputs)), domain_manifest_sha256: graph.source_manifest.manifest_sha256,
      executable_trace_sha256: digest(json(executable.trace)), nodes: graph.nodes.length,
      generated_artifacts: (whole?.application.artifacts ?? executable.view.artifacts).length,
      ...(whole ? { runtime_binding_sha256: whole.runtimeBinding.runtime_binding_sha256, application_plan_sha256: whole.application.plan_sha256 } : {}),
      runtime_guarantees_observed: false as const, authority_effect: "none" as const };
    return { loaded, report, executable, whole };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

/** Public source check: compile in owned scratch space; do not execute providers. */
export async function checkApplicationFile(sourcePath: string, options: ApplicationFileOptions = {}) {
  return (await planApplicationFile(sourcePath, options)).report;
}
