import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import {
  generateEncryptionIdentity,
  sealContentKey,
  openContentKey,
} from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/protocol.js";
import {
  encryptFile,
  decryptFile,
} from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/file-client.js";
import { authorize, authenticate, sha, fields } from "./auth.mjs";
import { integer, decodeOrder, LOCAL_MINT } from "./transactions.mjs";
test("a valid buyer envelope can contain a wrong content key: real-payment readiness remains unresolved", async () => {
  const bytes = Uint8Array.from([0, 255, 13, 10]),
    file = {
      name: "project.bin",
      type: "application/octet-stream",
      size: bytes.length,
      arrayBuffer: async () => bytes.buffer,
    };
  const encrypted = await encryptFile(file, "artifact", "policy");
  const buyer = await generateEncryptionIdentity();
  const context = {
    artifactId: "artifact",
    policyId: "policy",
    epoch: 1,
    plaintextCommitment: encrypted.plaintextCommitment,
    ciphertextSha256: encrypted.ciphertextSha256,
    contentNonceBase64: encrypted.contentNonceBase64,
    recipientIdentityId: "buyer",
    recipientKeyVersion: 1,
    envelopeRevision: 1,
  };
  const envelope = await sealContentKey(
    buyer.publicKeyBase64,
    randomBytes(32).toString("base64"),
    context,
  );
  assert.equal(
    sha(Buffer.from(envelope.envelopeBase64, "base64")),
    envelope.envelopeSha256,
  );
  const wrong = await openContentKey(
    envelope.envelopeBase64,
    buyer.privateKeyBase64,
    context,
  );
  await assert.rejects(() =>
    decryptFile(encrypted.ciphertextBase64, wrong, context),
  );
});
test("wallet signatures bind action and exact payload; schema rejects unexpected private fields", () => {
  const wallet = Keypair.generate(),
    payload = { orderId: "x" },
    signature = authorize(wallet, "access", payload);
  authenticate(wallet.publicKey.toBase58(), "access", payload, signature);
  assert.throws(() =>
    authenticate(
      wallet.publicKey.toBase58(),
      "acknowledge",
      payload,
      signature,
    ),
  );
  assert.throws(() =>
    authenticate(
      wallet.publicKey.toBase58(),
      "access",
      { orderId: "y" },
      signature,
    ),
  );
  assert.throws(() =>
    fields({ ...payload, contentKey: "never accepted" }, ["orderId"]),
  );
});
test("integer units reject lossy numbers and account decoding rejects wrong program owners", () => {
  assert.throws(() => integer(Number.MAX_SAFE_INTEGER + 1));
  assert.throws(() => integer(-1));
  assert.equal(
    integer("18446744073709551615").readBigUInt64LE(),
    18446744073709551615n,
  );
  assert.throws(() => decodeOrder({ owner: LOCAL_MINT.toBase58(), data: "" }));
});
