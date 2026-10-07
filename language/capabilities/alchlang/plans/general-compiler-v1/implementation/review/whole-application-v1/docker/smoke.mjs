#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const base = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:8080";
const secret = process.env.REVIEW_WEBHOOK_SECRET;
if (!secret) throw new Error("Set REVIEW_WEBHOOK_SECRET to the value used to start the container");

const health = await fetch(`${base}/health`);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: "ready", adapter: "in-memory-review" });

const body = JSON.stringify({ id: "7", accepted: true });
const unsigned = await fetch(`${base}/orders`, { method: "POST", headers: { "content-type": "application/json" }, body });
assert.equal(unsigned.status, 401);

const signature = createHmac("sha256", secret).update(body).digest("hex");
const signed = await fetch(`${base}/orders`, { method: "POST",
  headers: { "content-type": "application/json", "x-domainspec-signature": signature }, body });
assert.equal(signed.status, 200);
assert.deepEqual(await signed.json(), { id: "7", accepted: true });

const unsupportedBody = JSON.stringify({ id: "8", accepted: true });
const unsupportedSignature = createHmac("sha256", secret).update(unsupportedBody).digest("hex");
const unsupported = await fetch(`${base}/orders`, { method: "POST",
  headers: { "content-type": "application/json", "x-domainspec-signature": unsupportedSignature }, body: unsupportedBody });
assert.equal(unsupported.status, 400);

const stored = await fetch(`${base}/orders/7`);
assert.equal(stored.status, 200);
assert.deepEqual(await stored.json(), { id: "7", accepted: true });
process.stdout.write(`${JSON.stringify({ status: "pass", health: 200, unsigned: 401,
  signed: 200, unsupported_order: 400, stored: 200, adapter: "in-memory-review" }, null, 2)}\n`);
