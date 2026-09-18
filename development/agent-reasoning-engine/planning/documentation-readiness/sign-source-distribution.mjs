#!/usr/bin/env node

import {createHash, createPrivateKey, createPublicKey, sign, verify} from "node:crypto";
import {existsSync, lstatSync, readFileSync, writeFileSync} from "node:fs";
import {basename, dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../../..");
const candidatePath = resolve(repositoryRoot, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const stableJson = value => `${JSON.stringify(value, null, 2)}\n`;

function need(condition, code) {
  if (!condition) throw new Error(code);
}

function candidateBinding() {
  const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
  return {
    candidate_id: candidate.candidate_id,
    candidate_digest: candidate.candidate_digest,
    product_version: candidate.product.version,
    source_closure_digest: candidate.source_closure.closure_digest,
  };
}

function publicFingerprint(key) {
  const publicKey = key.type === "public" ? key : createPublicKey(key);
  return sha256(publicKey.export({type: "spki", format: "der"}));
}

function readArtifact(path) {
  need(typeof path === "string" && existsSync(path), "signature.artifact-missing");
  const bytes = readFileSync(path);
  return {bytes, identity: {filename: basename(path), bytes: bytes.byteLength, sha256: sha256(bytes)}};
}

export function signArtifact({artifact_path, private_key_path, statement_path, signature_path}) {
  need(typeof private_key_path === "string" && existsSync(private_key_path), "signature.private-key-missing");
  need((lstatSync(private_key_path).mode & 0o077) === 0, "signature.private-key-permissions-too-open");
  const privateKey = createPrivateKey(readFileSync(private_key_path));
  need(privateKey.asymmetricKeyType === "ed25519", "signature.private-key-algorithm-invalid");
  const artifact = readArtifact(artifact_path);
  const statement = {
    schema_version: "are.source-distribution-signing-statement/v1",
    algorithm: "Ed25519",
    candidate: candidateBinding(),
    artifact: artifact.identity,
    public_key_fingerprint_sha256: publicFingerprint(privateKey),
    authority_effect: "none",
    claim_limit: "This statement binds artifact bytes to a signing key. Trust requires an owner-selected identity and authenticated public-key distribution.",
  };
  const statementBytes = Buffer.from(stableJson(statement));
  const signature = sign(null, statementBytes, privateKey);
  const record = {
    schema_version: "are.source-distribution-signature/v1",
    algorithm: "Ed25519",
    statement_sha256: sha256(statementBytes),
    signature_base64: signature.toString("base64"),
    public_key_fingerprint_sha256: statement.public_key_fingerprint_sha256,
    authority_effect: "none",
  };
  writeFileSync(statement_path, statementBytes, {mode: 0o644});
  writeFileSync(signature_path, stableJson(record), {mode: 0o644});
  return Object.freeze({schema_version: "are.artifact-signature-result/v1", status: "PASS", operation: "sign", artifact: artifact.identity, statement_sha256: record.statement_sha256, public_key_fingerprint_sha256: record.public_key_fingerprint_sha256, authority_effect: "none"});
}

export function verifyArtifactSignature({artifact_path, public_key_path, statement_path, signature_path, expected_fingerprint = null}) {
  need(typeof public_key_path === "string" && existsSync(public_key_path), "signature.public-key-missing");
  const publicKey = createPublicKey(readFileSync(public_key_path));
  need(publicKey.asymmetricKeyType === "ed25519", "signature.public-key-algorithm-invalid");
  const fingerprint = publicFingerprint(publicKey);
  if (expected_fingerprint !== null) need(fingerprint === expected_fingerprint, "signature.expected-fingerprint-mismatch");
  const artifact = readArtifact(artifact_path);
  const statementBytes = readFileSync(statement_path);
  const statement = JSON.parse(statementBytes);
  const record = JSON.parse(readFileSync(signature_path, "utf8"));
  need(statement.schema_version === "are.source-distribution-signing-statement/v1", "signature.statement-schema-invalid");
  need(record.schema_version === "are.source-distribution-signature/v1", "signature.record-schema-invalid");
  need(statement.algorithm === "Ed25519" && record.algorithm === "Ed25519", "signature.algorithm-mismatch");
  need(statement.public_key_fingerprint_sha256 === fingerprint && record.public_key_fingerprint_sha256 === fingerprint, "signature.key-fingerprint-mismatch");
  need(record.statement_sha256 === sha256(statementBytes), "signature.statement-digest-mismatch");
  need(JSON.stringify(statement.candidate) === JSON.stringify(candidateBinding()), "signature.candidate-binding-mismatch");
  need(JSON.stringify(statement.artifact) === JSON.stringify(artifact.identity), "signature.artifact-binding-mismatch");
  need(verify(null, statementBytes, publicKey, Buffer.from(record.signature_base64, "base64")), "signature.verification-failed");
  return Object.freeze({schema_version: "are.artifact-signature-result/v1", status: "PASS", operation: "verify", artifact: artifact.identity, statement_sha256: record.statement_sha256, public_key_fingerprint_sha256: fingerprint, authority_effect: "none"});
}

function argumentsFor(operation, args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    need(flag?.startsWith("--") && value, "signature.usage-invalid");
    values[flag.slice(2).replaceAll("-", "_")] = resolve(value);
  }
  const common = {artifact_path: values.artifact, statement_path: values.statement, signature_path: values.signature};
  if (operation === "sign") return {...common, private_key_path: values.private_key};
  if (operation === "verify") return {...common, public_key_path: values.public_key, expected_fingerprint: values.expected_fingerprint ? String(args[args.indexOf("--expected-fingerprint") + 1]) : null};
  throw new Error("signature.operation-invalid");
}

function main() {
  const [operation, ...args] = process.argv.slice(2);
  need(["sign", "verify"].includes(operation), "usage: sign-source-distribution.mjs sign|verify --artifact <path> --statement <path> --signature <path> --private-key|--public-key <path> [--expected-fingerprint <sha256>]");
  const options = argumentsFor(operation, args);
  const result = operation === "sign" ? signArtifact(options) : verifyArtifactSignature(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
