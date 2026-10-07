#!/usr/bin/env node
// Provider-free additive VPS storage discovery and admission. The WSL guard remains unchanged.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, readFileSync, realpathSync, statfsSync, statSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {pathToFileURL} from "node:url";

const GiB = 1024n ** 3n, DEFAULT_GROWTH = 32 * 1024 ** 2;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const fail = (code, receipt) => { throw Object.assign(new Error(`vps-storage.${code}`), {code: "VPS_STORAGE_REJECTED", receipt}); };
const decode = (value) => value.replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
const parseMounts = (text) => text.trim().split("\n").map((line) => { const [left, right] = line.split(" - "); if (!right) return null; const fields = left.split(" "), tail = right.split(" "); return {device: fields[2], root: decode(fields[3] ?? ""), mount: decode(fields[4] ?? ""), fs: tail[0], source: decode(tail[1] ?? "")}; }).filter(Boolean);
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const dependencies = (deps) => ({read: deps.read ?? ((path) => readFileSync(path, "utf8")), exists: deps.exists ?? existsSync, stat: deps.stat ?? statSync, realpath: deps.realpath ?? realpathSync, measure: deps.measure ?? ((path) => statfsSync(path, {bigint: true}))});

function inspectTarget(outputRoot, provenancePath, deps = {}) {
  const io = dependencies(deps), requested = resolve(outputRoot); if (!requested.startsWith("/opt/") || requested === "/opt") fail("output-root-policy");
  if (!io.exists(requested)) fail("output-root-missing"); const ancestor = requested;
  if (!io.stat(ancestor).isDirectory() || io.realpath(ancestor) !== ancestor) fail("output-root-identity");
  const mounts = parseMounts(io.read("/proc/self/mountinfo")), covering = mounts.filter((mount) => ancestor === mount.mount || ancestor.startsWith(mount.mount === "/" ? "/" : `${mount.mount}/`)).sort((a, b) => b.mount.length - a.mount.length);
  if (!covering.length || covering.filter((mount) => mount.mount.length === covering[0].mount.length).length !== 1) fail("mount-identity");
  const mount = covering[0]; if (mount.fs !== "ext4") fail("ext4-required");
  const machine = io.read("/etc/machine-id").trim(); if (!machine) fail("machine-id");
  const provenance = io.read(provenancePath), measured = io.measure(ancestor); if (typeof measured.bavail !== "bigint" || typeof measured.bsize !== "bigint" || measured.bavail < 0n || measured.bsize <= 0n) fail("filesystem-measurement");
  return {requested, ancestor, mount, host_fingerprint_sha256: sha(machine), provenance_sha256: sha(provenance), free_bytes: measured.bavail * measured.bsize};
}

/** Discovery emits observed facts only. It cannot approve its own binding. */
export function discoverVpsStorage({outputRoot, provenancePath}, deps = {}) {
  const observed = inspectTarget(outputRoot, provenancePath, deps);
  return {schema_version: "are.longmemeval-unexposed-vps-storage-binding/v1", status: "observed-not-approved", verified: false, target_kind: "linux-vps", output_root: observed.requested, filesystem: "ext4", host_fingerprint_sha256: observed.host_fingerprint_sha256, mount_identity: observed.mount, minimum_free_bytes: (8n * GiB).toString(), provenance: {path: resolve(provenancePath), sha256: observed.provenance_sha256}, discovery_free_bytes: observed.free_bytes.toString(), provider_calls: 0, credentials_accessed: false, authority_effect: "none", open_questions: ["An independent reviewer must approve these target-host facts before verified may become true."]};
}

/** Admission validates an independently approved exact binding against current host facts. */
export function preflightVpsStorage({binding, outputRoot, growth_reservation_bytes = DEFAULT_GROWTH}, deps = {}) {
  if (!Number.isSafeInteger(growth_reservation_bytes) || growth_reservation_bytes < 0) fail("growth-reservation");
  const keys = ["schema_version", "status", "verified", "target_kind", "output_root", "filesystem", "host_fingerprint_sha256", "mount_identity", "minimum_free_bytes", "provenance", "provider_calls", "credentials_accessed", "authority_effect", "open_questions"];
  if (!exact(binding, keys) || binding.schema_version !== "are.longmemeval-unexposed-vps-storage-binding/v1" || binding.status !== "reviewed-approved" || binding.verified !== true || binding.target_kind !== "linux-vps" || binding.filesystem !== "ext4" || binding.provider_calls !== 0 || binding.credentials_accessed !== false || binding.authority_effect !== "none") fail("verified-binding-required");
  if (!/^[a-f0-9]{64}$/.test(binding.host_fingerprint_sha256 ?? "") || !exact(binding.mount_identity, ["device", "root", "mount", "fs", "source"]) || !exact(binding.provenance, ["path", "sha256"]) || !/^[a-f0-9]{64}$/.test(binding.provenance.sha256 ?? "")) fail("binding-shape");
  const minimum = BigInt(binding.minimum_free_bytes); if (minimum !== 8n * GiB || resolve(outputRoot) !== binding.output_root) fail("binding-target");
  const observed = inspectTarget(outputRoot, binding.provenance.path, deps), required = minimum + BigInt(growth_reservation_bytes);
  const receipt = {schema_version: "are.longmemeval-unexposed-vps-storage-preflight/v1", status: observed.free_bytes >= required ? "admitted" : "rejected", output_root: observed.requested, existing_ancestor: observed.ancestor, filesystem: observed.mount.fs, mount_identity: observed.mount, host_fingerprint_sha256: observed.host_fingerprint_sha256, free_bytes: observed.free_bytes.toString(), minimum_free_bytes: minimum.toString(), growth_reservation_bytes, required_free_bytes: required.toString(), provenance: binding.provenance, provider_calls: 0, credentials_accessed: false, authority_effect: "none"};
  if (observed.host_fingerprint_sha256 !== binding.host_fingerprint_sha256 || JSON.stringify(observed.mount) !== JSON.stringify(binding.mount_identity) || observed.provenance_sha256 !== binding.provenance.sha256) fail("binding-drift", receipt);
  if (receipt.status !== "admitted") fail("capacity", receipt); return receipt;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv[2] === "--discover" && process.argv.length === 5) process.stdout.write(`${JSON.stringify(discoverVpsStorage({outputRoot: process.argv[3], provenancePath: process.argv[4]}), null, 2)}\n`);
  else if (process.argv[2] === "--preflight" && process.argv.length === 5) process.stdout.write(`${JSON.stringify(preflightVpsStorage({binding: JSON.parse(readFileSync(process.argv[3])), outputRoot: process.argv[4]}), null, 2)}\n`);
  else fail("usage");
}
