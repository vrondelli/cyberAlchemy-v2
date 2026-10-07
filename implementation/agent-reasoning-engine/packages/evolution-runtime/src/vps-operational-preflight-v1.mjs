import {execFileSync} from "node:child_process";

import {materializeVpsPreflightResult} from "./vps-benchmark-protocol-v1.mjs";
import {verifyVpsRuntimeConfig} from "./vps-production-v1.mjs";

export const VPS_OPERATIONAL_PREFLIGHT_VERSION = "are.vps-operational-preflight/v1";

export function containerCredentialReferencePresent({containerRef, path, execFile = execFileSync} = {}) {
  try {
    execFile("docker", ["exec", "--user", "65532:65532", containerRef, "/nodejs/bin/node", "-e", "require('node:fs').accessSync(process.argv[1])", path], {encoding: "utf8", timeout: 5000});
    return true;
  } catch {
    return false;
  }
}

export function runVpsOperationalPreflight({config, probe, now = () => new Date().toISOString()} = {}) {
  const checked = verifyVpsRuntimeConfig(config);
  if (!checked.ok) throw new TypeError(`Runtime configuration is invalid: ${checked.reason_codes.join(",")}`);
  const methods = ["hostIdentity", "runtimeVersions", "containerPresent", "availableMemoryBytes", "availableDiskBytes", "sourcePresent", "withWritableProbe", "credentialReferencePresent", "activeConflictingWorkers"];
  if (!probe || methods.some((name) => typeof probe[name] !== "function")) throw new TypeError("Operational preflight requires a complete probe adapter.");
  const host = probe.hostIdentity();
  if (host !== config.execution_host) throw new Error("PREFLIGHT_HOST_SUBSTITUTION");
  return materializeVpsPreflightResult({
    preflight_ref: `preflight:${config.config_ref}:${Date.parse(now())}`,
    execution_host: host,
    container_ref: config.gateway.container_ref,
    runtime_versions: probe.runtimeVersions(),
    available_memory_bytes: probe.availableMemoryBytes(),
    available_disk_bytes: probe.availableDiskBytes(config.roots.evidence_root),
    source_present: probe.sourcePresent(config.roots.runtime_root),
    evidence_root_writable: probe.withWritableProbe(config.roots.evidence_root),
    gateway_present: probe.containerPresent(config.gateway.container_ref),
    credential_reference_present: probe.credentialReferencePresent(config.gateway.credential_reference_path),
    active_conflicting_workers: probe.activeConflictingWorkers(),
    checked_at: now(),
  });
}

export function preflightReady(preflight) {
  return preflight.execution_host === "187.77.163.194" && preflight.source_present === true && preflight.evidence_root_writable === true && preflight.gateway_present === true && preflight.credential_reference_present === true && preflight.active_conflicting_workers === 0 && preflight.available_memory_bytes > 0 && preflight.available_disk_bytes > 0;
}
