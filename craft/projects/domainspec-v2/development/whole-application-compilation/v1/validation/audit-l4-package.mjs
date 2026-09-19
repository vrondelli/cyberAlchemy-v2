import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) throw new Error(`missing ${name}`);
  return path.resolve(process.argv[index + 1]);
}

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function pack(packageRoot, destination, cache) {
  fs.mkdirSync(destination, { recursive: true });
  const output = run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", destination], packageRoot, { ...process.env, npm_config_cache: cache });
  const rows = JSON.parse(output);
  assert.equal(rows.length, 1);
  const metadata = rows[0];
  const tarball = path.join(destination, metadata.filename);
  assert.equal(fs.statSync(tarball).isFile(), true);
  return { metadata, tarball, bytes: fs.readFileSync(tarball) };
}

function inventory(packed, extractionRoot) {
  fs.mkdirSync(extractionRoot, { recursive: true });
  run("tar", ["-xzf", packed.tarball, "-C", extractionRoot], extractionRoot);
  const metadataByPath = new Map(packed.metadata.files.map(row => [row.path, row]));
  return [...metadataByPath].sort(([left], [right]) => left.localeCompare(right)).map(([relativePath, metadata]) => {
    const bytes = fs.readFileSync(path.join(extractionRoot, "package", relativePath));
    assert.equal(bytes.length, metadata.size, `packed size mismatch:${relativePath}`);
    return { path: relativePath, size_bytes: bytes.length, mode: metadata.mode, sha256: sha256(bytes) };
  });
}

const packageRoot = option("--package-root");
const inventoryPath = option("--inventory");
const reportPath = option("--report");
const write = process.argv.includes("--write");
assert.notEqual(write, process.argv.includes("--check"), "choose exactly one of --write or --check");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "domainspec-l4-pack-audit-"));
try {
  const cache = path.join(temporary, "npm-cache");
  const first = pack(packageRoot, path.join(temporary, "pack-one"), cache);
  const second = pack(packageRoot, path.join(temporary, "pack-two"), cache);
  const firstDigest = sha256(first.bytes);
  const secondDigest = sha256(second.bytes);
  assert.equal(firstDigest, secondDigest, "npm pack tarballs are not byte-reproducible");
  assert.equal(first.metadata.name, "@domainspec-v2/cli");
  assert.equal(first.metadata.version, "1.0.0");
  const files = inventory(first, path.join(temporary, "extract-one"));
  const secondFiles = inventory(second, path.join(temporary, "extract-two"));
  assert.deepEqual(secondFiles, files, "packed per-file inventory is not reproducible");
  const forbiddenPatterns = [
    "(^|/)node_modules/",
    "(^|/)development/",
    "(^|/)test/",
    "(^|/)\\.env(?:$|\\.)",
    "(^|/)(?:id_rsa|id_ed25519|.*\\.pem|.*\\.key)$",
  ];
  const forbidden = forbiddenPatterns.flatMap(pattern => files.filter(row => new RegExp(pattern).test(row.path)).map(row => ({ pattern, path: row.path })));
  assert.deepEqual(forbidden, [], `forbidden packed paths:${JSON.stringify(forbidden)}`);
  const body = {
    schema_version: "domainspec.whole-application-packed-file-inventory/v1-candidate",
    package: `${first.metadata.name}@${first.metadata.version}`,
    tarball_filename: first.metadata.filename,
    tarball_size_bytes: first.bytes.length,
    tarball_sha256: firstDigest,
    npm_shasum: first.metadata.shasum,
    npm_integrity: first.metadata.integrity,
    file_count: files.length,
    forbidden_patterns: forbiddenPatterns,
    files,
    reproducible_pack_runs: 2,
    publication: false,
    release: false,
    authority_effect: "none",
  };
  const formed = { ...body, inventory_sha256: sha256(canonical(body)) };
  if (write) {
    fs.mkdirSync(path.dirname(inventoryPath), { recursive: true });
    fs.writeFileSync(inventoryPath, `${JSON.stringify(formed, null, 2)}\n`);
  } else {
    assert.deepEqual(JSON.parse(fs.readFileSync(inventoryPath, "utf8")), formed, "packed-file inventory drifted");
  }
  const toolPath = fileURLToPath(import.meta.url);
  const report = {
    schema_version: "domainspec.whole-application-pack-audit/v1-candidate",
    result: "pass",
    mode: write ? "write" : "check",
    package: body.package,
    tarball_sha256: firstDigest,
    inventory_sha256: formed.inventory_sha256,
    file_count: files.length,
    exact_path_size_mode_digest: "pass",
    reproducible_tarball: "pass",
    forbidden_path_scan: "pass",
    validator_path: path.relative(path.resolve(packageRoot, "../../../.."), toolPath).split(path.sep).join("/"),
    validator_sha256: sha256(fs.readFileSync(toolPath)),
    publication: false,
    release: false,
    authority_effect: "none",
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report)}\n`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
