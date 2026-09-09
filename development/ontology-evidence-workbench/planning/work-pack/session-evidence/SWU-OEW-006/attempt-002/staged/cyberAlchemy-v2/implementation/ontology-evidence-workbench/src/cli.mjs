#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { verifyAdapterReceipt } from "../scripts/verify-adapter-receipt.mjs";
import { writeAdapterRun } from "./adapter-run-writer.mjs";

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) return null;
  return args[index + 1];
}

function usage() {
  return [
    "usage:",
    "  node src/cli.mjs adapt --output <new-run-directory> [--fixture <node-subset.json>]",
    "  node src/cli.mjs verify --adapter-run <adapter-receipt.json>",
  ].join("\n");
}

export async function runCli(args, io = process) {
  const [command] = args;
  if (command === "adapt") {
    const output = option(args, "--output");
    if (!output) throw new Error("--output is required");
    const fixture = option(args, "--fixture");
    const nodeSubset = fixture
      ? JSON.parse(await readFile(resolve(fixture), "utf8"))
      : undefined;
    const result = await writeAdapterRun(output, { nodeSubset });
    io.stdout.write(`${JSON.stringify({
      result: "pass",
      receipt: result.receiptPath,
      receipt_sha256: result.receiptSha256,
      authority_effect: "none",
    })}\n`);
    return 0;
  }
  if (command === "verify") {
    const receipt = option(args, "--adapter-run");
    if (!receipt) throw new Error("--adapter-run is required");
    const result = await verifyAdapterReceipt(receipt);
    io.stdout.write(`${JSON.stringify(result)}\n`);
    return result.verified ? 0 : 1;
  }
  io.stderr.write(`${usage()}\n`);
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = await runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
