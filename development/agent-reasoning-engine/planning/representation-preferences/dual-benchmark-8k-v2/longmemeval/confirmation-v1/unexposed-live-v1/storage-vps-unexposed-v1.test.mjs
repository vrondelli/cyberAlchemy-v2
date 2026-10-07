import test from "node:test";
import assert from "node:assert/strict";
import {discoverVpsStorage, preflightVpsStorage} from "./storage-vps-unexposed-v1.mjs";

const machine = "11111111111111111111111111111111\n", provenance = "reviewed target host provenance\n", mountinfo = "36 25 8:1 / / rw,relatime - ext4 /dev/vda1 rw\n";
const deps = (free = 12n * 1024n ** 3n) => ({
  read: (path) => path === "/proc/self/mountinfo" ? mountinfo : path === "/etc/machine-id" ? machine : provenance,
  exists: () => true, stat: () => ({isDirectory: () => true}), realpath: (path) => path,
  measure: () => ({bavail: free / 4096n, bsize: 4096n})
});
const approved = () => { const value = discoverVpsStorage({outputRoot: "/opt/are/g03-generation", provenancePath: "/opt/are/review/STORAGE.md"}, deps()); delete value.discovery_free_bytes; value.status = "reviewed-approved"; value.verified = true; value.open_questions = []; return value; };

test("provider-free discovery observes exact ext4 target without self-approval", () => {
  const result = discoverVpsStorage({outputRoot: "/opt/are/g03-generation", provenancePath: "/opt/are/review/STORAGE.md"}, deps());
  assert.equal(result.status, "observed-not-approved"); assert.equal(result.verified, false); assert.equal(result.filesystem, "ext4"); assert.equal(result.mount_identity.source, "/dev/vda1"); assert.equal(result.provider_calls, 0); assert.equal(result.credentials_accessed, false);
});

test("reviewed binding admits only identical host, mount, provenance, target, and capacity", () => {
  const binding = approved(), receipt = preflightVpsStorage({binding, outputRoot: "/opt/are/g03-generation", growth_reservation_bytes: 32 * 1024 ** 2}, deps());
  assert.equal(receipt.status, "admitted"); assert.equal(receipt.provider_calls, 0); assert.equal(receipt.credentials_accessed, false); assert.equal(receipt.filesystem, "ext4");
  assert.throws(() => preflightVpsStorage({binding: {...binding, verified: false}, outputRoot: binding.output_root}, deps()), /verified-binding-required/);
  assert.throws(() => preflightVpsStorage({binding, outputRoot: "/opt/are/other"}, deps()), /binding-target/);
  assert.throws(() => preflightVpsStorage({binding, outputRoot: binding.output_root}, {...deps(), read: (path) => path === "/etc/machine-id" ? "different\n" : path === "/proc/self/mountinfo" ? mountinfo : provenance}), /binding-drift/);
  assert.throws(() => preflightVpsStorage({binding, outputRoot: binding.output_root}, deps(8n * 1024n ** 3n)), (error) => error.message.includes("capacity") && error.receipt.status === "rejected");
  assert.throws(() => discoverVpsStorage({outputRoot: binding.output_root, provenancePath: binding.provenance.path}, {...deps(), exists: () => false}), /output-root-missing/);
  assert.throws(() => discoverVpsStorage({outputRoot: binding.output_root, provenancePath: binding.provenance.path}, {...deps(), realpath: () => "/opt/elsewhere"}), /output-root-identity/);
});

test("WSL mounts and non-/opt targets are rejected without changing the WSL guard", () => {
  assert.throws(() => discoverVpsStorage({outputRoot: "/mnt/d/g03", provenancePath: "/opt/review"}, deps()), /output-root-policy/);
  const wrongFs = {...deps(), read: (path) => path === "/proc/self/mountinfo" ? "36 25 0:50 / / rw - overlay overlay rw\n" : path === "/etc/machine-id" ? machine : provenance};
  assert.throws(() => discoverVpsStorage({outputRoot: "/opt/are/g03", provenancePath: "/opt/review"}, wrongFs), /ext4-required/);
});
