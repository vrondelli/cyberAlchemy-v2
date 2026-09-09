import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Keypair, Transaction } from "@solana/web3.js";
import { startLocalBank } from "./local-bank.mjs";
import { postgresStore } from "./store.mjs";
import { purchaseService } from "./service.mjs";
import { authorize, sha } from "./auth.mjs";
import {
  LOCAL_MINT,
  initializeArtifact,
  signedTransaction,
  artifactAddress,
  decodeArtifact,
  decodeMember,
  memberAddress,
  requestReissue,
  fulfillReissue,
} from "./transactions.mjs";
import { receivePurchase } from "./receive.mjs";
import {
  generateEncryptionIdentity,
  sealContentKey,
} from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/protocol.js";
import { encryptFile } from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/file-client.js";
const database = process.env.EXCHANGE_DATABASE_URL;
if (!database)
  throw Error(
    "Set EXCHANGE_DATABASE_URL to a dedicated local PostgreSQL database.",
  );
const seller = Keypair.generate(),
  buyer = Keypair.generate(),
  buyer2 = Keypair.generate(),
  release = Keypair.generate();
const sellerToken = Keypair.generate().publicKey.toBase58(),
  buyerToken = Keypair.generate().publicKey.toBase58(),
  buyerToken2 = Keypair.generate().publicKey.toBase58();
const wallets = [
  [seller, sellerToken, 0],
  [buyer, buyerToken, 2_000_000],
  [buyer2, buyerToken2, 2_000_000],
  [release, Keypair.generate().publicKey.toBase58(), 0],
].map(([w, token, amount]) => ({
  wallet: w.publicKey.toBase58(),
  token,
  amount,
}));
const chain = await startLocalBank(wallets);
let store, server;
const run = async () => {
  store = await postgresStore(database);
  let service = purchaseService({
    chain,
    store,
    release,
    mint: LOCAL_MINT.toBase58(),
  });
  server = await service.listen();
  const api = async (method, path, input) => {
    const res = await fetch(server.url + path, {
      method,
      headers: { "content-type": "application/json" },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
    const result = await res.json();
    if (!res.ok) throw Error(result.error);
    return result;
  };
  const prefix = randomBytes(16).toString("hex"),
    artifactId = sha("artifact:" + prefix),
    offerId = sha("offer:" + prefix),
    policyId = "exchange-local-project-v1";
  const original = Uint8Array.from([0, 255, 192, 128, 13, 10, 65, 66, 67]);
  const file = {
    name: "project.bin",
    type: "application/octet-stream",
    size: original.length,
    arrayBuffer: async () => original.buffer,
  };
  const encrypted = await encryptFile(file, artifactId, policyId, 1);
  const sellerIdentity = await generateEncryptionIdentity();
  const context = {
    artifactId,
    policyId,
    epoch: 1,
    plaintextCommitment: encrypted.plaintextCommitment,
    ciphertextSha256: encrypted.ciphertextSha256,
    contentNonceBase64: encrypted.contentNonceBase64,
  };
  const senderEnvelope = await sealContentKey(
    sellerIdentity.publicKeyBase64,
    encrypted.contentKeyBase64,
    {
      ...context,
      recipientIdentityId: seller.publicKey.toBase58(),
      recipientKeyVersion: 1,
      envelopeRevision: 0,
    },
  );
  await chain.call("submit", {
    transaction: await signedTransaction(
      chain,
      initializeArtifact({
        artifactId,
        seller: seller.publicKey,
        policy: sha(policyId),
        epoch: 1,
        ciphertext: context.ciphertextSha256,
        locator: sha("local:" + artifactId),
        key: sha(Buffer.from(sellerIdentity.publicKeyBase64, "base64")),
        envelope: senderEnvelope.envelopeSha256,
      }),
      seller.publicKey,
      [seller],
    ),
  });
  const offer = {
    id: offerId,
    seller: seller.publicKey.toBase58(),
    sellerToken,
    artifactId,
    policyId,
    epoch: 1,
    amount: "500000",
    retentionSeconds: "3600",
    ciphertextBase64: encrypted.ciphertextBase64,
    originatorEnvelope: senderEnvelope.envelopeBase64,
    context,
  };
  await api("POST", "/v1/offers", {
    offer,
    signature: authorize(seller, "offer", offer),
  });
  const transact = async (id, action, signers, input = {}) => {
    const result = await api("POST", `/v1/orders/${id}/${action}`, input);
    const tx = Transaction.from(Buffer.from(result.transaction, "base64"));
    tx.partialSign(...signers);
    return api("POST", `/v1/orders/${id}/submit`, {
      action,
      transaction: tx.serialize().toString("base64"),
    });
  };
  const create = async (wallet, token, suffix, ttl = 100) => {
    const id = sha(prefix + suffix);
    const order = {
      id,
      offerId,
      buyer: wallet.publicKey.toBase58(),
      buyerToken: token,
      ttl,
    };
    await api("POST", "/v1/orders", {
      order,
      signature: authorize(wallet, "order", order),
    });
    await transact(id, "fund", [wallet, seller]);
    return id;
  };
  const first = await create(buyer, buyerToken, "first");
  const identity = await generateEncryptionIdentity();
  const delivery = {
    orderId: first,
    publicKeyBase64: identity.publicKeyBase64,
    keyVersion: 1,
    envelopeBase64: "",
    context: {
      ...context,
      recipientIdentityId: buyer.publicKey.toBase58(),
      recipientKeyVersion: 1,
      envelopeRevision: 1,
    },
    revision: "0",
  };
  delivery.envelopeBase64 = (
    await sealContentKey(
      identity.publicKeyBase64,
      encrypted.contentKeyBase64,
      delivery.context,
    )
  ).envelopeBase64;
  const preparation = {
    delivery,
    sellerSignature: authorize(seller, "prepare", delivery),
  };
  const originalPut = store.put.bind(store);
  store.put = async () => {
    throw Error("injected persistence failure");
  };
  await assert.rejects(
    () => api("POST", `/v1/orders/${first}/prepare`, preparation),
    /persistence failure/,
  );
  store.put = originalPut;
  assert.equal((await api("GET", `/v1/orders/${first}`)).status, "funded");
  await transact(first, "prepare", [buyer, seller], preparation);
  await assert.rejects(
    () =>
      receivePurchase({
        api,
        id: first,
        wallet: buyer,
        identity,
        attempt: "before-commit",
        save: async () => {
          throw Error("must not save");
        },
      }),
    /not committed/,
  );
  let browserResult = null;
  if (process.env.EXCHANGE_BROWSER_TEST === "1") {
    const { browserUnlock } = await import("./browser-check.mjs");
    browserResult = await browserUnlock({
      url: server.url,
      id: first,
      buyer,
      seller,
      identity,
      original,
    });
  }
  const receipt = browserResult
    ? (await api("GET", `/v1/orders/${first}`)).receipt
    : await transact(first, "unlock", [buyer, seller]);
  assert.equal((await api("GET", `/v1/orders/${first}`)).status, "committed");
  // Exact Unlock replay returns committed state without another transfer.
  assert.equal(
    (await api("POST", `/v1/orders/${first}/unlock`, {})).status,
    "committed",
  );
  // Restart the entire HTTP service and PostgreSQL connection, retaining only the external bank.
  await server.close();
  await store.close();
  store = await postgresStore(database);
  service = purchaseService({
    chain,
    store,
    release,
    mint: LOCAL_MINT.toBase58(),
  });
  server = await service.listen();
  let saved = 0,
    failAck = true;
  const received = await receivePurchase({
    api: async (method, path, input) => {
      if (failAck && path.endsWith("/acknowledge"))
        throw Error("receipt connection interrupted");
      return api(method, path, input);
    },
    id: first,
    wallet: buyer,
    identity,
    attempt: "retry-receipt",
    save: async (f) => {
      assert.deepEqual(f.bytes, original);
      saved++;
    },
  });
  assert.equal(saved, 1);
  assert.equal(received.receipt, null);
  failAck = false;
  assert.ok(await received.acknowledge());
  assert.equal(saved, 1);
  const recovered = await receivePurchase({
    api,
    id: first,
    wallet: buyer,
    identity,
    attempt: "retry-receipt",
    save: async (f) => assert.deepEqual(f.bytes, original),
  });
  assert.ok(recovered.receipt);
  // A second independent buyer receives the SAME artifact version.
  const second = await create(buyer2, buyerToken2, "second");
  const identity2 = await generateEncryptionIdentity();
  const art = decodeArtifact(
    await chain.call("account", {
      key: artifactAddress(artifactId).toBase58(),
    }),
  );
  const d2 = {
    orderId: second,
    publicKeyBase64: identity2.publicKeyBase64,
    keyVersion: 1,
    envelopeBase64: "",
    context: {
      ...context,
      recipientIdentityId: buyer2.publicKey.toBase58(),
      recipientKeyVersion: 1,
      envelopeRevision: Number(art.revision) + 1,
    },
    revision: art.revision,
  };
  d2.envelopeBase64 = (
    await sealContentKey(
      identity2.publicKeyBase64,
      encrypted.contentKeyBase64,
      d2.context,
    )
  ).envelopeBase64;
  await transact(second, "prepare", [buyer2, seller], {
    delivery: d2,
    sellerSignature: authorize(seller, "prepare", d2),
  });
  const savePut = store.put.bind(store);
  let writes = 0;
  store.put = async (...args) => {
    writes++;
    if (writes === 2) throw Error("injected receipt save failure");
    return savePut(...args);
  };
  await assert.rejects(
    () => transact(second, "unlock", [buyer2, seller]),
    /receipt save failure/,
  );
  store.put = savePut;
  const reconciled = await api("GET", `/v1/orders/${second}`);
  assert.equal(reconciled.status, "committed");
  assert.equal(reconciled.receipt, null);
  assert.equal(
    (await api("POST", `/v1/orders/${second}/unlock`, {})).status,
    "committed",
  );
  await receivePurchase({
    api,
    id: second,
    wallet: buyer2,
    identity: identity2,
    attempt: "second-buyer",
    save: async (f) => assert.deepEqual(f.bytes, original),
  });
  await receivePurchase({
    api,
    id: first,
    wallet: buyer,
    identity,
    attempt: "first-still-owns",
    save: async (f) => assert.deepEqual(f.bytes, original),
  });
  const renewedIdentity = await generateEncryptionIdentity(2);
  const member = decodeMember(
    await chain.call("account", {
      key: memberAddress(
        artifactAddress(artifactId),
        buyer.publicKey,
      ).toBase58(),
    }),
  );
  const latest = decodeArtifact(
    await chain.call("account", {
      key: artifactAddress(artifactId).toBase58(),
    }),
  );
  const renewal = {
    orderId: first,
    publicKeyBase64: renewedIdentity.publicKeyBase64,
    keyVersion: 2,
    envelopeBase64: "",
    context: {
      ...context,
      recipientIdentityId: buyer.publicKey.toBase58(),
      recipientKeyVersion: 2,
      envelopeRevision: Number(latest.revision) + 1,
    },
    revision: (BigInt(latest.revision) + 1n).toString(),
  };
  renewal.envelopeBase64 = (
    await sealContentKey(
      renewedIdentity.publicKeyBase64,
      encrypted.contentKeyBase64,
      renewal.context,
    )
  ).envelopeBase64;
  const reissue = {
    artifactId,
    buyer: buyer.publicKey,
    seller: seller.publicKey,
    memberRevision: member.revision,
    revision: latest.revision,
    keyCommitment: sha(Buffer.from(renewedIdentity.publicKeyBase64, "base64")),
    envelopeCommitment: sha(Buffer.from(renewal.envelopeBase64, "base64")),
  };
  await chain.call("submit", {
    transaction: await signedTransaction(
      chain,
      requestReissue(reissue),
      buyer.publicKey,
      [buyer],
    ),
  });
  await chain.call("submit", {
    transaction: await signedTransaction(
      chain,
      fulfillReissue(reissue),
      seller.publicKey,
      [seller],
    ),
  });
  await assert.rejects(
    () =>
      receivePurchase({
        api,
        id: first,
        wallet: buyer,
        identity,
        attempt: "old-key-after-reissue",
        save: async () => {
          throw Error("old key must not save");
        },
      }),
    /recipient binding changed/,
  );
  await api("POST", `/v1/orders/${first}/recover`, {
    delivery: renewal,
    buyerSignature: authorize(buyer, "recover", renewal),
    sellerSignature: authorize(seller, "recover", renewal),
  });
  await receivePurchase({
    api,
    id: first,
    wallet: buyer,
    identity: renewedIdentity,
    attempt: "reissued-key",
    save: async (f) => assert.deepEqual(f.bytes, original),
  });
  const expiring = await create(buyer, buyerToken, "expiry", 1);
  await chain.call("advance", { seconds: 2 });
  assert.equal((await service.expireDue()).refunded, 1);
  assert.equal((await service.expireDue()).refunded, 0);
  assert.equal((await api("GET", `/v1/orders/${expiring}`)).status, "refunded");
  assert.equal((await api("GET", `/v1/orders/${first}`)).status, "committed");
  const tokenAmount = async (key) =>
    Buffer.from(
      (await chain.call("account", { key })).data,
      "base64",
    ).readBigUInt64LE(64);
  assert.equal(await tokenAmount(sellerToken), 1_000_000n);
  assert.equal(await tokenAmount(buyerToken), 1_500_000n);
  assert.equal(await tokenAmount(buyerToken2), 1_500_000n);
  console.log(
    JSON.stringify(
      {
        status: "pass",
        network: chain.network,
        realProgramExecution: true,
        realKEPCrypto: true,
        postgresConnectionRestart: true,
        browserResult,
        twoBuyers: true,
        receiptRecovery: true,
        keyReissueRecovery: true,
        persistenceFailureBeforeReadiness: true,
        receiptSaveFailureAfterCommit: true,
        refund: true,
        offlineBuyerRefund: true,
        sellerUnits: "1000000",
        firstPurchaseSignature: receipt.signature,
        serverCustody: "ciphertext-only",
      },
      null,
      2,
    ),
  );
};
try {
  await run();
} finally {
  if (server) await server.close();
  if (store) await store.close();
  await chain.close();
}
