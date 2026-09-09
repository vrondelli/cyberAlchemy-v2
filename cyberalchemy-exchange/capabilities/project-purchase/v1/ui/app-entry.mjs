import { Buffer } from "buffer";
import { Transaction } from "@solana/web3.js";
import {
  openContentKey,
  sha256Hex,
} from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/protocol.js";
import { decryptFile } from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/file-client.js";
globalThis.Buffer ??= Buffer;
const el = (id) => document.getElementById(id),
  output = (x) => {
    el("result").textContent =
      typeof x === "string" ? x : JSON.stringify(x, null, 2);
  };
const api = async (method, path, body) => {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const r = await res.json();
  if (!res.ok) throw Error(r.error);
  return r;
};
const sort = (v) =>
  Array.isArray(v)
    ? v.map(sort)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, sort(v[k])]),
        )
      : v;
const sign = async (action, payload) => {
  const bytes = new TextEncoder().encode(
    "cyberalchemy-exchange:purchase:v1:" +
      action +
      ":" +
      JSON.stringify(sort(payload)),
  );
  const r = await window.solana.signMessage(bytes, "utf8");
  return Buffer.from(r.signature).toString("base64");
};
const wallet = () => {
  if (!window.solana?.publicKey) throw Error("Connect your wallet first.");
  return window.solana.publicKey.toBase58();
};
const id = () => el("order").value.trim();
const submit = async (action, transaction) => {
  wallet();
  const tx = await window.solana.signTransaction(
    Transaction.from(Buffer.from(transaction, "base64")),
  );
  return api("POST", `/v1/orders/${id()}/submit`, {
    action,
    transaction: tx
      .serialize({ requireAllSignatures: false })
      .toString("base64"),
  });
};
function handle(name, fn) {
  el(name).onclick = async () => {
    try {
      output(await fn());
    } catch (e) {
      output(e.message);
    }
  };
}
handle("connect", async () => {
  if (!window.solana) throw Error("A Solana wallet is required.");
  await window.solana.connect();
  el("wallet").textContent = wallet();
  return "Wallet connected";
});
handle("status", async () => {
  const r = await api("GET", `/v1/orders/${id()}`);
  el("state").textContent = r.status.replaceAll("_", " ");
  return r;
});
handle("sign", async () => {
  const p = await api("GET", `/v1/orders/${id()}/pending`);
  if (!p) throw Error("No pending transaction.");
  return submit(p.action, p.transaction);
});
for (const action of ["unlock", "refund"])
  handle(action, async () => {
    const r = await api("POST", `/v1/orders/${id()}/${action}`, {});
    return r.transaction ? submit(action, r.transaction) : r;
  });
handle("prepare", async () => {
  const r = await api(
    "POST",
    `/v1/orders/${id()}/prepare`,
    JSON.parse(el("preparation").value),
  );
  return submit("prepare", r.transaction);
});
handle("receive", async () => {
  const selected = el("identity").files[0];
  if (!selected) throw Error("Select your local identity file.");
  const identity = JSON.parse(await selected.text());
  const request = {
    orderId: id(),
    buyer: wallet(),
    attempt: crypto.randomUUID(),
  };
  const r = await api("POST", `/v1/orders/${id()}/access`, {
    request,
    signature: await sign("access", request),
  });
  if (
    (await sha256Hex(Buffer.from(r.ciphertextBase64, "base64"))) !==
      r.context.ciphertextSha256 ||
    (await sha256Hex(Buffer.from(r.envelopeBase64, "base64"))) !==
      r.envelopeCommitment
  )
    throw Error("Delivery verification failed.");
  const key = await openContentKey(
      r.envelopeBase64,
      identity.privateKeyBase64,
      r.context,
    ),
    file = await decryptFile(r.ciphertextBase64, key, r.context);
  const url = URL.createObjectURL(new Blob([file.bytes], { type: file.type })),
    a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  try {
    await api("POST", `/v1/orders/${id()}/acknowledge`, {
      request,
      signature: await sign("acknowledge", request),
    });
    return "Project downloaded. Purchase complete.";
  } catch {
    return "Project downloaded. Receipt could not be sent; your purchase remains complete.";
  }
});
async function main() {
  const h = await api("GET", "/health");
  el("environment").textContent =
    h.network === "ephemeral-local-bank"
      ? "Local prototype · valueless test tokens"
      : "Solana Devnet · test USDC";
  for (const o of await api("GET", "/v1/offers")) {
    const article = document.createElement("article"),
      title = document.createElement("strong"),
      price = document.createElement("p"),
      button = document.createElement("button");
    title.textContent = o.id;
    price.textContent =
      (BigInt(o.amount) / 1000000n).toString() +
      "." +
      (BigInt(o.amount) % 1000000n).toString().padStart(6, "0") +
      " USDC · recovery " +
      o.retentionSeconds +
      " seconds";
    button.textContent = "Buy project";
    button.onclick = async () => {
      try {
        const order = {
          id: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
            "hex",
          ),
          offerId: o.id,
          buyer: wallet(),
          buyerToken: el("token").value.trim(),
          ttl: 600,
        };
        const r = await api("POST", "/v1/orders", {
          order,
          signature: await sign("order", order),
        });
        el("order").value = r.id;
        const p = await api("POST", `/v1/orders/${r.id}/fund`, {});
        output(await submit("fund", p.transaction));
      } catch (e) {
        output(e.message);
      }
    };
    article.append(title, price, button);
    el("offers").append(article);
  }
}
main().catch((e) => output(e.message));
