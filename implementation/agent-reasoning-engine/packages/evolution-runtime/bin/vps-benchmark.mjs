#!/usr/bin/env node
import {execFileSync} from "node:child_process";
import {existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statfsSync} from "node:fs";
import {freemem, networkInterfaces} from "node:os";
import {join, resolve} from "node:path";

import {
  createVpsBenchmarkLauncher,
  containerCredentialReferencePresent,
  runVpsOperationalPreflight,
  verifyBenchmarkCampaign,
  verifyProductionAdmissionProposal,
  verifyVpsExecutionBundle,
  verifyVpsLaunchDecision,
  verifyVpsPreflightResult,
  verifyVpsRuntimeConfig,
  verifyWorkerAssignment,
  verifyWorkerResult,
} from "../vps-benchmark-v1.mjs";

function output(value, status = 0) { process.stdout.write(`${JSON.stringify(value)}\n`); process.exitCode = status; }
function invalid(code = "vps-cli.request-invalid") { output({schema_version: "are.vps-cli-result/v1", ok: false, reason_codes: [code], authority_effect: "none"}, 2); }
function version(command, args) { try { return execFileSync(command, args, {encoding: "utf8", timeout: 5000}).trim(); } catch { return "unavailable"; } }

const args = process.argv.slice(2);
const configIndex = args.indexOf("--config");
const configPath = configIndex >= 0 ? args[configIndex + 1] : null;
if (!configPath || args.length !== 2) {
  invalid();
} else {
  let config;
  let request;
  try { config = JSON.parse(readFileSync(resolve(configPath), "utf8")); request = JSON.parse(readFileSync(0, "utf8")); }
  catch { invalid(); process.exit(2); }
  const allowedInputs = {inspect: [], verify: ["document"], preflight: [], dispatch: ["bundle", "assignment", "decision", "preflight"]};
  if (!request || request.schema_version !== "are.vps-cli-request/v1" || !Object.hasOwn(allowedInputs, request.operation) || !request.input || typeof request.input !== "object" || Array.isArray(request.input) || Object.keys(request).some((key) => !["schema_version", "operation", "input"].includes(key)) || Object.keys(request.input).some((key) => !allowedInputs[request.operation].includes(key))) {
    invalid();
  } else {
    const configCheck = verifyVpsRuntimeConfig(config);
    if (!configCheck.ok) invalid("vps-cli.config-invalid");
    else if (request.operation === "inspect") output(createVpsBenchmarkLauncher({config}).inspect());
    else if (request.operation === "verify") {
      const verifiers = new Map([
        ["are.vps-runtime-config/v1", verifyVpsRuntimeConfig],
        ["are.vps-execution-bundle/v1", verifyVpsExecutionBundle],
        ["are.benchmark-campaign/v1", verifyBenchmarkCampaign],
        ["are.vps-worker-assignment/v1", verifyWorkerAssignment],
        ["are.vps-worker-result/v1", verifyWorkerResult],
        ["are.vps-preflight-result/v1", verifyVpsPreflightResult],
        ["are.vps-production-admission-proposal/v1", verifyProductionAdmissionProposal],
        ["are.vps-launch-decision-envelope/v1", verifyVpsLaunchDecision],
      ]);
      const verifier = verifiers.get(request.input.document?.schema_version);
      output(verifier ? verifier(request.input.document) : {schema_version: "are.vps-production-validation/v1", ok: false, stage: "verify", reason_codes: ["vps-cli.schema-unsupported"], authority_effect: "none"}, verifier ? 0 : 2);
    } else if (request.operation === "preflight") {
      const addresses = Object.values(networkInterfaces()).flat().filter(Boolean).map((item) => item.address);
      const probe = {
        hostIdentity: () => addresses.includes(config.execution_host) ? config.execution_host : "unmatched-host",
        runtimeVersions: () => ({node: process.version, python: version("python3", ["--version"]), rust: version("rustc", ["--version"])}),
        containerPresent: (containerRef) => { try { return execFileSync("docker", ["inspect", "--format", "{{.Id}}", containerRef], {encoding: "utf8", timeout: 5000}).trim().length > 0; } catch { return false; } },
        availableMemoryBytes: () => freemem(),
        availableDiskBytes: (root) => { try { const value = statfsSync(root); return Number(value.bavail * value.bsize); } catch { return 0; } },
        sourcePresent: (root) => existsSync(root),
        withWritableProbe: (root) => { let probeRoot = null; try { probeRoot = mkdtempSync(join(root, ".are-preflight-")); return true; } catch { return false; } finally { if (probeRoot) rmSync(probeRoot, {recursive: true, force: true}); } },
        credentialReferencePresent: (path) => containerCredentialReferencePresent({containerRef: config.gateway.container_ref, path}),
        activeConflictingWorkers: () => { try { return readdirSync(join(config.roots.workspace_root, ".active-workers")).length; } catch { return 0; } },
      };
      try { output(runVpsOperationalPreflight({config, probe})); } catch (error) { output({schema_version: "are.vps-cli-result/v1", ok: false, reason_codes: ["vps-cli.preflight-failed"], residue: [{message: error.message}], authority_effect: "none"}, 2); }
    } else {
      const result = await createVpsBenchmarkLauncher({config}).dispatch(request.input);
      output(result, result.ok === false ? 2 : 0);
    }
  }
}
