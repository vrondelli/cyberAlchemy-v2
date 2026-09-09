#!/usr/bin/env node
import { readFile, writeFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { Keypair, Transaction } from "@solana/web3.js";
import { receivePurchase } from "./receive.mjs";
import { authorize } from "./auth.mjs";
export function apiClient(base) {
  const url = new URL(base);
  if (
    url.username ||
    url.password ||
    !["http:", "https:"].includes(url.protocol)
  )
    throw Error("invalid API URL");
  return async (method, path, body) => {
    const r = await fetch(new URL(path, url), {
      method,
      headers: { "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const value = await r.json();
    if (!r.ok) throw Error(value.error);
    return value;
  };
}
async function privateJson(path) {
  if ((await stat(path)).mode & 0o077)
    throw Error("Private file must have mode 0600: " + path);
  return JSON.parse(await readFile(path, "utf8"));
}
export async function main(args) {
  const [command, ...rest] = args;
  if (command === "http") {
    const [base, method, path, file] = rest;
    return apiClient(base)(
      method,
      path,
      file ? JSON.parse(await readFile(file, "utf8")) : undefined,
    );
  }
  if (command === "authorize") {
    const [walletFile, action, payloadFile] = rest;
    const wallet = Keypair.fromSecretKey(
        Uint8Array.from(await privateJson(walletFile)),
      ),
      payload = JSON.parse(await readFile(payloadFile, "utf8"));
    return { signature: authorize(wallet, action, payload) };
  }
  if (command === "sign") {
    const [base, id, walletFile] = rest,
      api = apiClient(base),
      p = await api("GET", `/v1/orders/${id}/pending`);
    if (!p) throw Error("No pending transaction");
    const wallet = Keypair.fromSecretKey(
        Uint8Array.from(await privateJson(walletFile)),
      ),
      tx = Transaction.from(Buffer.from(p.transaction, "base64"));
    tx.partialSign(wallet);
    return api("POST", `/v1/orders/${id}/submit`, {
      action: p.action,
      transaction: tx
        .serialize({ requireAllSignatures: false })
        .toString("base64"),
    });
  }
  if (command === "receive") {
    const [base, id, walletFile, identityFile, output] = rest,
      api = apiClient(base),
      wallet = Keypair.fromSecretKey(
        Uint8Array.from(await privateJson(walletFile)),
      ),
      identity = await privateJson(identityFile),
      attempt = crypto.randomUUID();
    const r = await receivePurchase({
      api,
      id,
      wallet,
      identity,
      attempt,
      save: async (f) =>
        writeFile(output, f.bytes, { flag: "wx", mode: 0o600 }),
    });
    if (!r.receipt)
      await writeFile(
        output + ".receipt.json",
        JSON.stringify({ id, attempt }),
        { flag: "wx", mode: 0o600 },
      );
    return {
      saved: output,
      receipt: r.receipt,
      pendingReceipt: r.receipt ? null : output + ".receipt.json",
    };
  }
  if (command === "acknowledge") {
    const [base, walletFile, receiptFile] = rest,
      api = apiClient(base),
      wallet = Keypair.fromSecretKey(
        Uint8Array.from(await privateJson(walletFile)),
      ),
      { id, attempt } = JSON.parse(await readFile(receiptFile, "utf8")),
      request = { orderId: id, buyer: wallet.publicKey.toBase58(), attempt };
    return api("POST", `/v1/orders/${id}/acknowledge`, {
      request,
      signature: authorize(wallet, "acknowledge", request),
    });
  }
  throw Error(
    "Usage: exchange http API METHOD PATH [JSON_FILE] | authorize WALLET ACTION PAYLOAD | sign API ORDER WALLET | receive API ORDER WALLET IDENTITY OUTPUT | acknowledge API WALLET RECEIPT",
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2))
    .then((x) => console.log(JSON.stringify(x, null, 2)))
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
