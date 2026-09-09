// Local Devnet preparation only. Open questions: ../deployment/PLAN.md.
import { mkdir, lstat, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Keypair, PublicKey } from "@solana/web3.js";

export const cap = fileURLToPath(new URL("../", import.meta.url));
export const keyDirectory = process.env.EXCHANGE_DEPLOYMENT_KEY_DIR ?? join(
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
  "cyberalchemy/exchange/devnet-purchase-v1",
);
export const profilePath = join(cap, "deployment/public.json");
export const roles = ["kepProgram", "purchaseProgram", "upgradeAuthority", "feePayer", "releaseAuthority", "kepBuffer", "purchaseBuffer"];
export const genesis = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (v) => JSON.stringify(v, null, 2) + "\n";

export async function loadKey(directory, role) {
  if (!roles.includes(role)) throw Error("Unknown deployment role");
  const path = join(directory, role + ".json"), stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077))
    throw Error("Deployment key must be a private regular file: " + role);
  const bytes = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(bytes) || bytes.length !== 64 || bytes.some((x) => !Number.isInteger(x) || x < 0 || x > 255))
    throw Error("Invalid deployment key encoding: " + role);
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

export async function prepare(directory = keyDirectory, destination = profilePath) {
  let existingProfile = false;
  try { await lstat(destination); existingProfile = true; } catch (e) { if (e.code !== "ENOENT") throw e; }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077))
    throw Error("Deployment key directory must have mode 0700");
  const keys = {};
  for (const role of roles) {
    try { await lstat(join(directory, role + ".json")); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (existingProfile) throw Error("Missing key for existing deployment profile: " + role);
      const key = Keypair.generate();
      await writeFile(join(directory, role + ".json"), json([...key.secretKey]), { flag: "wx", mode: 0o600 });
    }
    keys[role] = (await loadKey(directory, role)).publicKey.toBase58();
  }
  if (new Set(Object.values(keys)).size !== roles.length) throw Error("Deployment roles must use distinct keys");
  const profile = { schema_version: "exchange-devnet-profile/v1", network: "solana-devnet", genesis,
    rpc: "https://api.devnet.solana.com", mint, sbpf_version: 3, keys,
    deployment_authorized: false, open_questions_ref: "PLAN.md#open-questions" };
  await mkdir(dirname(destination), { recursive: true });
  try {
    const current = await readFile(destination, "utf8");
    if (current !== json(profile)) throw Error("Existing public profile does not match local keys; left unchanged");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(destination, json(profile), { flag: "wx", mode: 0o644 });
  }
  return profile;
}

export async function rpc(method, params = []) {
  if (!["getGenesisHash", "getVersion", "getSlot", "getMultipleAccounts", "getBalance", "getMinimumBalanceForRentExemption"].includes(method)) throw Error("Read-only preflight method required");
  const response = await fetch("https://api.devnet.solana.com", { method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw Error("Devnet RPC HTTP " + response.status);
  const body = await response.json();
  if (body.error) throw Error("Devnet RPC " + method + ": " + body.error.message);
  return body.result;
}

export async function preflight() {
  const profile = await prepare();
  const report = { schema_version: "exchange-devnet-preflight/v1", checked_at: new Date().toISOString(),
    profile_sha256: hash(await readFile(profilePath)), status: "not-ready", checks: {},
    blockers: [], transactions_submitted: 0, open_questions_ref: "PLAN.md#open-questions" };
  try {
    const [cluster, version, slot, accounts, balance] = await Promise.all([
      rpc("getGenesisHash"), rpc("getVersion"), rpc("getSlot", [{ commitment: "finalized" }]),
      rpc("getMultipleAccounts", [[profile.keys.kepProgram, profile.keys.purchaseProgram,
        "5cC3foj77CWun58pC51ebHFUWavHWKarWyR5UUik7dnC", mint], { encoding: "base64", commitment: "finalized" }]),
      rpc("getBalance", [profile.keys.feePayer, { commitment: "finalized" }]),
    ]);
    if (cluster !== genesis) throw Error("Wrong cluster genesis");
    const [kep, purchase, feature, tokenMint] = accounts.value;
    report.checks = { genesis: cluster, version, finalized_slot: slot,
      program_addresses_unused: kep === null && purchase === null,
      fee_payer_lamports: balance.value };
    if (kep || purchase) report.blockers.push("A selected program address already exists; inspect before deployment");
    const featureData = feature && Buffer.from(feature.data[0], "base64");
    const active = feature?.owner === "Feature111111111111111111111111111111111111" && featureData?.[0] === 1 && featureData.length >= 9 && featureData.readBigUInt64LE(1) <= BigInt(slot);
    report.checks.sbpf_v3_active = Boolean(active);
    if (!active) report.blockers.push("SBPF v3 activation was not verified");
    const mintData = tokenMint && Buffer.from(tokenMint.data[0], "base64");
    report.checks.mint_valid = tokenMint?.owner === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" && mintData?.length === 82 && mintData[44] === 6 && mintData[45] === 1;
    if (!report.checks.mint_valid) report.blockers.push("Devnet USDC mint validation failed");
    const build = JSON.parse(await readFile(join(cap, "program/target/sbf-candidate/deployment/build.json"), "utf8"));
    const rent = {};
    for (const [name, artifact] of Object.entries(build.artifacts)) {
      const binary = await readFile(join(cap, "program/target/sbf-candidate/deployment", name));
      if (hash(binary) !== artifact.sha256) throw Error("Deployment binary changed");
      const [program, programData, buffer] = await Promise.all([36, artifact.bytes + 45, artifact.bytes + 37].map((size) => rpc("getMinimumBalanceForRentExemption", [size, { commitment: "finalized" }])));
      rent[name] = { program, program_data: programData, staging_buffer: buffer };
    }
    report.checks.rent_lamports = rent;
    report.checks.conservative_rent_lamports = Object.values(rent).reduce((n, x) => n + x.program + x.program_data + x.staging_buffer, 0);
    if (balance.value < report.checks.conservative_rent_lamports) report.blockers.push("Fee payer lacks estimated rent funding; transaction fees are additional");
  } catch (error) { report.blockers.push(error.message); }
  report.blockers.push("Exact deployment authorization and transaction fee ceiling remain pending");
  await writeFile(join(cap, "deployment/preflight.json"), json(report));
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const command = process.argv[2];
  if (command === "prepare") console.log(json(await prepare()));
  else if (command === "preflight") console.log(json(await preflight()));
  else throw Error("Usage: deployment.mjs prepare|preflight");
}
