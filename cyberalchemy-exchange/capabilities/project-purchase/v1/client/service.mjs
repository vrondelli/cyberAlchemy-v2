import { KEP, PURCHASE } from "./transactions.mjs";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { Transaction, PublicKey } from "@solana/web3.js";
import { sha, canonical, authenticate, fields } from "./auth.mjs";
import {
  artifactAddress,
  memberAddress,
  orderAddress,
  decodeArtifact,
  decodeMember,
  decodeOrder,
  fundOrder,
  prepareOrder,
  unlockOrder,
  refundOrder,
  digestBytes,
} from "./transactions.mjs";
// The service only receives encrypted material, public bindings and signed transactions.
// It holds its release signing key; buyer/seller wallet and content keys stay in clients.
export function purchaseService({ chain, store, release, mint }) {
  let work = Promise.resolve();
  const serial = (fn) => {
    const next = work.then(fn, fn);
    work = next.catch(() => {});
    return next;
  };
  const get = async (kind, id) => {
    const v = await store.get(kind, id);
    if (!v) throw Error("not found");
    return v;
  };
  const chainOrder = async (id) => {
    const account = await chain.call("account", {
      key: orderAddress(id).toBase58(),
    });
    return account ? decodeOrder(account) : null;
  };
  const chainArtifact = async (id) =>
    decodeArtifact(
      await chain.call("account", { key: artifactAddress(id).toBase58() }),
    );
  const member = async (id, wallet) =>
    decodeMember(
      await chain.call("account", {
        key: memberAddress(artifactAddress(id), wallet).toBase58(),
      }),
    );
  const summary = (o) => ({
    id: o.id,
    offerId: o.offerId,
    buyer: o.buyer,
    seller: o.seller,
    amount: o.amount,
    deadline: o.deadline,
    retentionSeconds: o.retentionSeconds,
    mint: o.mint,
    termsCommitment: o.termsCommitment,
  });
  function validateChain(local, onchain) {
    if (!onchain) throw Error("order is not funded");
    for (const k of [
      "id",
      "buyer",
      "seller",
      "release",
      "mint",
      "buyerToken",
      "sellerToken",
      "amount",
      "deadline",
      "retentionSeconds",
      "termsCommitment",
    ])
      if (String(local[k]) !== String(onchain[k]))
        throw Error("chain order binding mismatch: " + k);
    if (onchain.artifact !== artifactAddress(local.artifactId).toBase58())
      throw Error("artifact binding mismatch");
  }
  async function transaction(instruction, payer, releaseSign = false) {
    const { blockhash } = await chain.call("blockhash");
    const tx = new Transaction({
      feePayer: new PublicKey(payer),
      recentBlockhash: blockhash,
    }).add(instruction);
    if (releaseSign) tx.partialSign(release);
    return tx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64");
  }
  async function dispatch(method, path, input) {
    if (method === "GET" && path === "/health")
      return {
        product: "CyberAlchemy Exchange",
        network: chain.network,
        programs: { kep: KEP.toBase58(), purchase: PURCHASE.toBase58() },
        mint,
        release: release.publicKey.toBase58(),
        custody: "ciphertext-only",
        status: "local-candidate",
      };
    if (method === "GET" && path === "/v1/offers")
      return (await store.list("offer")).map(
        ({ ciphertextBase64, originatorEnvelope, ...o }) => o,
      );
    if (method === "POST" && path === "/v1/offers") {
      fields(input, ["offer", "signature"]);
      const o = input.offer;
      fields(o, [
        "id",
        "seller",
        "sellerToken",
        "artifactId",
        "policyId",
        "epoch",
        "amount",
        "retentionSeconds",
        "ciphertextBase64",
        "originatorEnvelope",
        "context",
      ]);
      digestBytes(o.id);
      digestBytes(o.artifactId);
      new PublicKey(o.seller);
      new PublicKey(o.sellerToken);
      authenticate(o.seller, "offer", o, input.signature);
      if (
        !/^\d+$/.test(o.amount) ||
        BigInt(o.amount) <= 0n ||
        BigInt(o.amount) > 18446744073709551615n
      )
        throw Error("invalid amount");
      if (
        !/^\d+$/.test(o.retentionSeconds) ||
        BigInt(o.retentionSeconds) <= 0n ||
        BigInt(o.retentionSeconds) > 31536000n
      )
        throw Error("invalid retention");
      if (Buffer.byteLength(o.ciphertextBase64) > 14_000_000)
        throw Error("file too large");
      const art = await chainArtifact(o.artifactId),
        seller = await member(o.artifactId, o.seller);
      const ciphertextSha256 = sha(Buffer.from(o.ciphertextBase64, "base64"));
      if (
        art.ciphertext !== ciphertextSha256 ||
        art.policy !== sha(o.policyId) ||
        String(art.epoch) !== String(o.epoch) ||
        seller.envelopeCommitment !==
          sha(Buffer.from(o.originatorEnvelope, "base64"))
      )
        throw Error("offer is not bound to KEP");
      fields(o.context, [
        "artifactId",
        "policyId",
        "epoch",
        "plaintextCommitment",
        "ciphertextSha256",
        "contentNonceBase64",
      ]);
      if (
        o.context.artifactId !== o.artifactId ||
        o.context.policyId !== o.policyId ||
        o.context.epoch !== o.epoch ||
        o.context.ciphertextSha256 !== ciphertextSha256
      )
        throw Error("context mismatch");
      const old = await store.get("offer", o.id);
      if (old && canonical(old) !== canonical(o)) throw Error("offer conflict");
      if (!old) await store.put("offer", o.id, o);
      return { id: o.id };
    }
    if (method === "POST" && path === "/v1/orders") {
      fields(input, ["order", "signature"]);
      const r = input.order;
      fields(r, ["id", "offerId", "buyer", "buyerToken", "ttl"]);
      digestBytes(r.id);
      new PublicKey(r.buyer);
      new PublicKey(r.buyerToken);
      authenticate(r.buyer, "order", r, input.signature);
      if (!Number.isInteger(r.ttl) || r.ttl < 1 || r.ttl > 3600)
        throw Error("invalid deadline");
      const old = await store.get("order", r.id);
      if (old) {
        if (canonical(old.request) !== canonical(r))
          throw Error("order conflict");
        return summary(old);
      }
      const offer = await get("offer", r.offerId),
        { timestamp } = await chain.call("clock");
      const o = {
        ...r,
        request: r,
        seller: offer.seller,
        sellerToken: offer.sellerToken,
        artifactId: offer.artifactId,
        amount: offer.amount,
        retentionSeconds: offer.retentionSeconds,
        deadline: String(timestamp + r.ttl),
        mint,
        release: release.publicKey.toBase58(),
      };
      o.termsCommitment = sha(
        canonical({
          offerId: offer.id,
          buyer: o.buyer,
          seller: o.seller,
          artifactId: o.artifactId,
          amount: o.amount,
          mint,
          deadline: o.deadline,
          retentionSeconds: o.retentionSeconds,
          context: offer.context,
        }),
      );
      await store.put("order", o.id, o);
      return summary(o);
    }
    const match = path.match(
      /^\/v1\/orders\/([0-9a-f]{64})(?:\/(fund|prepare|unlock|refund|submit|access|acknowledge|pending|recover))?$/,
    );
    if (!match) throw Error("unknown endpoint");
    const [, id, action] = match;
    const o = await get("order", id);
    if (method === "GET" && action === "pending") return o.proposal ?? null;
    if (method === "GET" && !action) {
      const onchain = await chainOrder(id);
      if (onchain) validateChain(o, onchain);
      return {
        ...summary(o),
        status: onchain?.status ?? "awaiting_funds",
        committedAt: onchain?.committedAt ?? null,
        receipt:
          o.receipt?.action ===
          {
            committed: "unlock",
            refunded: "refund",
            ready: "prepare",
            funded: "fund",
          }[onchain?.status]
            ? o.receipt
            : null,
      };
    }
    if (method !== "POST") throw Error("method not allowed");
    if (action === "fund")
      return { transaction: await transaction(fundOrder(o), o.buyer) };
    const onchain = await chainOrder(id);
    if (!(action === "submit" && input.action === "fund" && !onchain))
      validateChain(o, onchain);
    const delivery = onchain
      ? o.deliveries?.[onchain.envelopeCommitment]
      : null;
    if (action === "prepare") {
      fields(input, ["delivery", "sellerSignature"]);
      const d = input.delivery;
      fields(d, [
        "orderId",
        "publicKeyBase64",
        "keyVersion",
        "envelopeBase64",
        "context",
        "revision",
      ]);
      if (
        d.orderId !== id ||
        !Number.isSafeInteger(d.keyVersion) ||
        d.keyVersion < 1 ||
        Buffer.from(d.publicKeyBase64, "base64").length !== 32 ||
        Buffer.byteLength(d.envelopeBase64) > 4096
      )
        throw Error("invalid delivery");
      authenticate(o.seller, "prepare", d, input.sellerSignature);
      if (!["funded", "ready"].includes(onchain.status))
        throw Error("order is terminal");
      const offer = await get("offer", o.offerId),
        art = await chainArtifact(o.artifactId);
      fields(d.context, [
        ...Object.keys(offer.context),
        "recipientIdentityId",
        "recipientKeyVersion",
        "envelopeRevision",
      ]);
      for (const [k, v] of Object.entries(offer.context))
        if (d.context[k] !== v) throw Error("delivery context mismatch");
      if (
        d.context.recipientIdentityId !== o.buyer ||
        d.context.recipientKeyVersion !== d.keyVersion ||
        BigInt(d.context.envelopeRevision) !== BigInt(art.revision) + 1n ||
        String(d.revision) !== art.revision
      )
        throw Error("stale recipient context");
      const prepared = {
        ...d,
        keyCommitment: sha(Buffer.from(d.publicKeyBase64, "base64")),
        envelopeCommitment: sha(Buffer.from(d.envelopeBase64, "base64")),
      };
      // Persist opaque material BEFORE producing the Exchange readiness signature.
      await store.put("order", id, {
        ...o,
        delivery: prepared,
        deliveries: {
          ...o.deliveries,
          [prepared.envelopeCommitment]: prepared,
        },
      });
      return {
        transaction: await transaction(
          prepareOrder({ ...o, ...prepared }),
          o.buyer,
          true,
        ),
      };
    }
    if (action === "unlock") {
      if (onchain.status === "committed") return { status: "committed" };
      if (
        onchain.status !== "ready" ||
        !delivery ||
        onchain.keyCommitment !== delivery.keyCommitment ||
        onchain.envelopeCommitment !== delivery.envelopeCommitment ||
        onchain.revision !== String(delivery.revision)
      )
        throw Error("delivery not ready");
      await get("offer", o.offerId);
      return { transaction: await transaction(unlockOrder(o), o.buyer, true) };
    }
    if (action === "refund")
      return { transaction: await transaction(refundOrder(o), o.buyer) };
    if (action === "submit") {
      fields(input, ["action", "transaction"]);
      if (!["fund", "prepare", "unlock", "refund"].includes(input.action))
        throw Error("invalid transaction action");
      const tx = Transaction.from(Buffer.from(input.transaction, "base64"));
      const expected = {
        fund: () => fundOrder(o),
        prepare: () => prepareOrder({ ...o, ...o.delivery }),
        unlock: () => unlockOrder(o),
        refund: () => refundOrder(o),
      }[input.action]();
      if (
        tx.instructions.length !== 1 ||
        !tx.feePayer.equals(new PublicKey(o.buyer))
      )
        throw Error("unexpected transaction");
      const template = new Transaction({
        feePayer: new PublicKey(o.buyer),
        recentBlockhash: tx.recentBlockhash,
      }).add(expected);
      if (!tx.serializeMessage().equals(template.serializeMessage()))
        throw Error("transaction does not match order");
      if (
        !tx.verifySignatures(false) ||
        !tx.signatures.some(
          (s) =>
            s.signature && [o.buyer, o.seller].includes(s.publicKey.toBase58()),
        )
      )
        throw Error("invalid or missing participant signature");
      if (o.proposal?.action === input.action) {
        const prior = Transaction.from(
          Buffer.from(o.proposal.transaction, "base64"),
        );
        if (prior.serializeMessage().equals(tx.serializeMessage()))
          for (const entry of prior.signatures)
            if (
              entry.signature &&
              !tx.signatures.find((s) => s.publicKey.equals(entry.publicKey))
                ?.signature
            )
              tx.addSignature(entry.publicKey, entry.signature);
      }
      if (!tx.verifySignatures()) {
        const proposal = {
          action: input.action,
          transaction: tx
            .serialize({ requireAllSignatures: false })
            .toString("base64"),
        };
        await store.put("order", id, { ...o, proposal });
        return {
          status: "awaiting_signatures",
          missing: tx.signatures
            .filter((s) => !s.signature)
            .map((s) => s.publicKey.toBase58()),
        };
      }
      input.transaction = tx.serialize().toString("base64");
      if (input.action === "unlock" && onchain.status === "committed")
        return {
          status: "committed",
          receipt: o.receipt?.action === "unlock" ? o.receipt : null,
        };
      const submission = {
        action: input.action,
        transaction: input.transaction,
      };
      await store.put("order", id, { ...o, submission });
      const receipt = await chain.call("submit", {
        transaction: input.transaction,
      });
      await store.put("order", id, {
        ...o,
        submission,
        receipt: { ...receipt, action: input.action },
        proposal: null,
      });
      return receipt;
    }
    if (action === "recover") {
      fields(input, ["delivery", "buyerSignature", "sellerSignature"]);
      const d = input.delivery;
      fields(d, [
        "orderId",
        "publicKeyBase64",
        "keyVersion",
        "envelopeBase64",
        "context",
        "revision",
      ]);
      authenticate(o.buyer, "recover", d, input.buyerSignature);
      authenticate(o.seller, "recover", d, input.sellerSignature);
      if (onchain.status !== "committed" || d.orderId !== id)
        throw Error("recovery requires committed purchase");
      const offer = await get("offer", o.offerId),
        m = await member(o.artifactId, o.buyer);
      fields(d.context, [
        ...Object.keys(offer.context),
        "recipientIdentityId",
        "recipientKeyVersion",
        "envelopeRevision",
      ]);
      for (const [k, v] of Object.entries(offer.context))
        if (d.context[k] !== v) throw Error("recovery context mismatch");
      if (
        Buffer.byteLength(d.envelopeBase64) > 4096 ||
        !Number.isSafeInteger(d.keyVersion) ||
        d.keyVersion < 1 ||
        Buffer.from(d.publicKeyBase64, "base64").length !== 32 ||
        d.context.recipientIdentityId !== o.buyer ||
        d.context.recipientKeyVersion !== d.keyVersion ||
        String(d.context.envelopeRevision) !== m.revision ||
        String(d.revision) !== m.revision
      )
        throw Error("invalid recovery");
      const recovery = {
        ...d,
        keyCommitment: sha(Buffer.from(d.publicKeyBase64, "base64")),
        envelopeCommitment: sha(Buffer.from(d.envelopeBase64, "base64")),
      };
      if (
        recovery.keyCommitment !== m.keyCommitment ||
        recovery.envelopeCommitment !== m.envelopeCommitment
      )
        throw Error("recovery is not finalized in KEP");
      await store.put("order", id, {
        ...o,
        recoveries: { ...o.recoveries, [m.envelopeCommitment]: recovery },
      });
      return { status: "recoverable" };
    }
    if (action === "access" || action === "acknowledge") {
      fields(input, ["request", "signature"]);
      const r = input.request;
      fields(r, ["orderId", "buyer", "attempt"]);
      if (
        r.orderId !== id ||
        r.buyer !== o.buyer ||
        !/^[-a-zA-Z0-9]{1,80}$/.test(r.attempt)
      )
        throw Error("invalid retrieval");
      authenticate(o.buyer, action, r, input.signature);
      if (onchain.status !== "committed" || !delivery)
        throw Error("purchase has not committed");
      const attemptKey = id + ":" + r.attempt;
      if (action === "acknowledge") {
        const existing = await store.get("acknowledgement", attemptKey);
        if (existing) return existing;
      }
      const { timestamp } = await chain.call("clock");
      if (
        BigInt(timestamp) >=
        BigInt(onchain.committedAt) + BigInt(o.retentionSeconds)
      )
        throw Error("paid recovery term expired");
      const m = await member(o.artifactId, o.buyer);
      if (
        onchain.envelopeCommitment !== delivery.envelopeCommitment ||
        onchain.keyCommitment !== delivery.keyCommitment
      )
        throw Error("committed delivery binding changed");
      const current = o.recoveries?.[m.envelopeCommitment] ?? delivery;
      if (
        m.envelopeCommitment !== current.envelopeCommitment ||
        m.keyCommitment !== current.keyCommitment
      )
        throw Error("recipient binding changed");
      const offer = await get("offer", o.offerId);
      let attempt = await store.get("delivery-attempt", attemptKey);
      if (action === "acknowledge") {
        if (
          !attempt ||
          attempt.buyer !== o.buyer ||
          attempt.envelopeCommitment !== current.envelopeCommitment ||
          timestamp >= attempt.deadline
        )
          throw Error("delivery attempt missing, changed or expired");
        const receipt = {
          orderId: id,
          attempt: r.attempt,
          ciphertextSha256: offer.context.ciphertextSha256,
          envelopeCommitment: current.envelopeCommitment,
        };
        await store.put("acknowledgement", attemptKey, receipt);
        return receipt;
      }
      if (
        attempt &&
        (attempt.envelopeCommitment !== current.envelopeCommitment ||
          timestamp >= attempt.deadline)
      )
        throw Error("use a fresh retrieval attempt");
      if (!attempt) {
        attempt = {
          orderId: id,
          buyer: o.buyer,
          envelopeCommitment: current.envelopeCommitment,
          deadline: timestamp + 900,
        };
        await store.put("delivery-attempt", attemptKey, attempt);
      }
      return {
        ciphertextBase64: offer.ciphertextBase64,
        envelopeBase64: current.envelopeBase64,
        context: current.context,
        envelopeCommitment: current.envelopeCommitment,
        retentionUntil: (
          BigInt(onchain.committedAt) + BigInt(o.retentionSeconds)
        ).toString(),
      };
    }
    throw Error("unknown action");
  }
  async function expireDue() {
    return serial(async () => {
      const { timestamp } = await chain.call("clock");
      let refunded = 0;
      for (const o of await store.list("order")) {
        if (BigInt(o.deadline) > BigInt(timestamp)) continue;
        const state = await chainOrder(o.id);
        if (!state || !["funded", "ready"].includes(state.status)) continue;
        validateChain(o, state);
        const raw = await transaction(refundOrder(o), release.publicKey, true),
          submission = { action: "refund", transaction: raw };
        await store.put("order", o.id, { ...o, submission });
        const receipt = await chain.call("submit", { transaction: raw });
        await store.put("order", o.id, {
          ...o,
          submission,
          receipt: { ...receipt, action: "refund" },
          proposal: null,
        });
        refunded++;
      }
      return { refunded };
    });
  }
  return {
    expireDue,
    request: (method, path, input = {}) =>
      serial(() => dispatch(method, path, input)),
    async listen(port = 0) {
      const server = createServer(async (req, res) => {
        if (
          req.method === "GET" &&
          (req.url === "/" || req.url === "/app.js")
        ) {
          res.setHeader(
            "Content-Type",
            req.url === "/" ? "text/html; charset=utf-8" : "text/javascript",
          );
          res.end(
            readFileSync(
              new URL(
                req.url === "/" ? "../ui/index.html" : "../ui/app.js",
                import.meta.url,
              ),
            ),
          );
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        try {
          let body = "",
            size = 0;
          for await (const b of req) {
            size += b.length;
            if (size > 15_000_000) throw Error("request too large");
            body += b;
          }
          const result = await serial(() =>
            dispatch(req.method, req.url, body ? JSON.parse(body) : {}),
          );
          res.end(JSON.stringify(result));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
      return {
        url: "http://127.0.0.1:" + server.address().port,
        close: () => new Promise((resolve) => server.close(resolve)),
      };
    },
  };
}
