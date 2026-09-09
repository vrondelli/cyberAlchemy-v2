import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED_INVENTORY = [
  "digest-map.v1.json",
  "projection.v1.json",
  "result.v1.json",
  "terminal-receipt.json",
];
const BODY_FILES = EXPECTED_INVENTORY.filter((path) => path !== "terminal-receipt.json");
const SHA256 = /^[a-f0-9]{64}$/;
const EVIDENCE_CEILING =
  "finite private candidate-graph prototype evidence; no ontology admission or promotion";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function sameInventory(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function collectAuthorityIssues(value, path = "$", issues = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectAuthorityIssues(entry, `${path}[${index}]`, issues));
    return issues;
  }
  if (value === null || typeof value !== "object") return issues;
  for (const [key, child] of Object.entries(value)) {
    if (key === "authority_effect" && child !== "none") {
      issues.push(`AUTHORITY_EFFECT_FORBIDDEN:${path}.${key}`);
    }
    collectAuthorityIssues(child, `${path}.${key}`, issues);
  }
  return issues;
}

function validateDigestMap(map, name, issues) {
  if (map === null || typeof map !== "object" || Array.isArray(map)) {
    issues.push(`INVALID_DIGEST_MAP:${name}`);
    return;
  }
  for (const [path, digest] of Object.entries(map)) {
    if (!path || !SHA256.test(digest)) issues.push(`INVALID_DIGEST:${name}:${path}`);
  }
}

export async function verifyTerminalReceipt(receiptPath) {
  const runDir = dirname(receiptPath);
  const issues = [];
  const inventory = (await readdir(runDir)).sort();
  if (!sameInventory(inventory, EXPECTED_INVENTORY)) issues.push("INVENTORY_MISMATCH");

  const bytesByName = new Map();
  const parsedByName = new Map();
  for (const name of EXPECTED_INVENTORY) {
    try {
      const bytes = await readFile(join(runDir, name));
      bytesByName.set(name, bytes);
      parsedByName.set(name, JSON.parse(bytes.toString("utf8")));
    } catch (error) {
      issues.push(`MISSING_OR_INVALID_JSON:${name}:${error.code ?? "PARSE"}`);
    }
  }

  const receiptBytes = bytesByName.get("terminal-receipt.json");
  const receipt = parsedByName.get("terminal-receipt.json");
  const result = parsedByName.get("result.v1.json");
  const projection = parsedByName.get("projection.v1.json");
  const digestMap = parsedByName.get("digest-map.v1.json");
  if (receipt?.schema_version !== "candidate-run-receipt-v1") {
    issues.push("UNKNOWN_VERSION:terminal-receipt");
  }
  if (result?.schema_version !== "candidate-result-v1") issues.push("UNKNOWN_VERSION:result");
  if (projection?.schema_version !== "candidate-projection-v1") {
    issues.push("UNKNOWN_VERSION:projection");
  }
  if (digestMap?.schema_version !== "candidate-digest-map-v1") {
    issues.push("UNKNOWN_VERSION:digest-map");
  }

  if (receipt) {
    if (receipt.result !== "pass" || receipt.state !== "receipt-complete") {
      issues.push("TERMINAL_STATE_INVALID");
    }
    if (!receipt.task_id || !receipt.swu_id) issues.push("TERMINAL_IDENTITY_MISSING");
    if (!sameInventory(receipt.artifact_inventory ?? [], EXPECTED_INVENTORY)) {
      issues.push("RECEIPT_INVENTORY_MISMATCH");
    }
    if (receipt.evidence_ceiling !== EVIDENCE_CEILING) issues.push("EVIDENCE_CEILING_INVALID");
    const artifacts = Array.isArray(receipt.artifacts) ? receipt.artifacts : [];
    if (!sameInventory(artifacts.map(({ path }) => path), BODY_FILES)) {
      issues.push("RECEIPT_ARTIFACTS_MISMATCH");
    }
    for (const artifact of artifacts) {
      const bytes = bytesByName.get(artifact.path);
      if (!bytes || sha256(bytes) !== artifact.sha256) {
        issues.push(`RECEIPT_DIGEST_MISMATCH:${artifact.path}`);
      }
    }
  }

  if (digestMap) {
    validateDigestMap(digestMap.input_digests, "inputs", issues);
    validateDigestMap(digestMap.evaluator_digests, "evaluators", issues);
    validateDigestMap(digestMap.output_digests, "outputs", issues);
    if (!sameInventory(Object.keys(digestMap.output_digests ?? {}), [
      "projection.v1.json",
      "result.v1.json",
    ])) {
      issues.push("OUTPUT_BINDING_INVENTORY_MISMATCH");
    }
    for (const name of ["projection.v1.json", "result.v1.json"]) {
      const bytes = bytesByName.get(name);
      if (!bytes || digestMap.output_digests?.[name] !== sha256(bytes)) {
        issues.push(`OUTPUT_DIGEST_MISMATCH:${name}`);
      }
    }
  }

  const attestation = result?.isolation_attestation;
  if (
    attestation?.schema_version !== "candidate-isolation-attestation-v1" ||
    attestation.protected_set_digest_before !== attestation.protected_set_digest_after ||
    !SHA256.test(attestation.protected_set_digest_before ?? "") ||
    attestation.write_probe !== "denied" ||
    attestation.claim !== "input-isolation-only" ||
    attestation.host_security_claim !== "none"
  ) {
    issues.push("ISOLATION_ATTESTATION_INVALID");
  }
  for (const [name, value] of parsedByName) collectAuthorityIssues(value, name, issues);
  return {
    verified: issues.length === 0,
    receipt_sha256: receiptBytes ? sha256(receiptBytes) : null,
    artifact_count: inventory.length,
    issues: [...new Set(issues)].sort(),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const receiptPath = process.argv[2];
  if (!receiptPath) throw new Error("terminal receipt path is required");
  const result = await verifyTerminalReceipt(receiptPath);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.verified) process.exitCode = 1;
}
