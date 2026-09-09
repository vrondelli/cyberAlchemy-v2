import { CipherSuite, HkdfSha256 } from "@hpke/core";
import { DhkemX25519HkdfSha256 } from "@hpke/dhkem-x25519";
import { Chacha20Poly1305 } from "@hpke/chacha20poly1305";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes } from "@noble/ciphers/utils.js";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { normalizeFailure, ProtocolClientError } from "./errors.js";

export const PROGRAM_ID = "ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1";
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const PROFILE_ID = "KEP-SOL-CRYPTO-DEVNET-V1";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const suite = new CipherSuite({
  kem: new DhkemX25519HkdfSha256(),
  kdf: new HkdfSha256(),
  aead: new Chacha20Poly1305(),
});

export function concatBytes(...items) {
  const length = items.reduce((sum, item) => sum + item.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
}

export function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function bytesToHex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(value) {
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error("Expected exactly 32 bytes encoded as 64 hexadecimal characters.");
  }
  return Uint8Array.from(value.match(/../g), (pair) => Number.parseInt(pair, 16));
}

export async function sha256Bytes(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

export async function sha256Hex(bytes) {
  return bytesToHex(await sha256Bytes(bytes));
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

export async function publicCardDigest(value) {
  return sha256Hex(textEncoder.encode(canonicalJson(value)));
}

export function randomHex() {
  return bytesToHex(randomBytes(32));
}

function requireText(card, field) {
  if (typeof card[field] !== "string" || !card[field].trim()) {
    throw new ProtocolClientError("invalid_handoff_card", `The handoff card field ${field} is missing or invalid.`);
  }
}

function requireHex32(card, field) {
  if (!/^[0-9a-f]{64}$/i.test(String(card[field] || ""))) {
    throw new ProtocolClientError("invalid_handoff_card", `The handoff card field ${field} must be a 32-byte hexadecimal value.`);
  }
}

function requireBase64Length(card, field, bytes) {
  try {
    if (base64ToBytes(card[field]).length !== bytes) throw new Error("wrong length");
  } catch {
    throw new ProtocolClientError("invalid_handoff_card", `The handoff card field ${field} has an invalid encoding.`);
  }
}

function requireSolanaPublicKey(card, field) {
  requireText(card, field);
  try {
    new PublicKey(card[field]);
  } catch {
    throw new ProtocolClientError("invalid_handoff_card", `The handoff card field ${field} is not a valid Solana public key.`);
  }
}

export function parseHandoffCard(text, kind) {
  let card;
  try { card = JSON.parse(text); } catch {
    throw new ProtocolClientError("invalid_handoff_card", "The handoff card is not valid JSON.");
  }
  if (card?.kind !== kind) {
    throw new ProtocolClientError("invalid_handoff_card", `Expected a ${kind} handoff card.`);
  }
  if (kind === "ca2-kep-public-identity/v1") {
    requireText(card, "identityId");
    requireSolanaPublicKey(card, "walletPublicKey");
    requireBase64Length(card, "encryptionPublicKey", 32);
    if (!Number.isSafeInteger(card.keyVersion) || card.keyVersion < 1) {
      throw new ProtocolClientError("invalid_handoff_card", "The identity card keyVersion is invalid.");
    }
  } else if (kind === "ca2-kep-public-artifact/v1") {
    for (const field of ["artifactId", "policyId", "plaintextCommitment", "ciphertextSha256"]) requireHex32(card, field);
    requireBase64Length(card, "contentNonceBase64", 24);
    requireText(card, "originatorIdentityId");
    requireSolanaPublicKey(card, "artifactAccount");
    if (!Number.isSafeInteger(card.epoch) || card.epoch < 1) {
      throw new ProtocolClientError("invalid_handoff_card", "The artifact card epoch is invalid.");
    }
  } else if (kind === "ca2-kep-public-reissue/v1") {
    for (const field of ["operationId", "recipientIdentityId", "requestSignature"]) requireText(card, field);
    requireSolanaPublicKey(card, "recipientWalletPublicKey");
    requireSolanaPublicKey(card, "artifactAccount");
    requireHex32(card, "artifactId");
    requireBase64Length(card, "replacementPublicKey", 32);
    if (!Number.isSafeInteger(card.expectedRevision) || card.expectedRevision < 1
      || !Number.isSafeInteger(card.replacementKeyVersion) || card.replacementKeyVersion < 2) {
      throw new ProtocolClientError("invalid_handoff_card", "The reissue card revision or key version is invalid.");
    }
  }
  return card;
}

export class ProtocolSubmissionError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "ProtocolSubmissionError";
    this.code = code;
    this.stage = options.stage || "devnet_submission";
    this.effectStatus = options.effectStatus || "unknown";
    this.safeMessage = options.safeMessage || message;
    this.guidance = options.guidance || "Review the error and start a fresh attempt when ready.";
    this.rpcRequestId = options.rpcRequestId || null;
    this.transactionSignature = options.transactionSignature || null;
    this.technicalDetail = options.technicalDetail || message;
    for (const field of [
      "registryVersion", "sourceLayer", "retryDisposition", "rpcCode", "httpStatus",
      "correlationId", "transactionError", "instructionIndex", "instructionError",
      "customProgramCode", "programId",
    ]) this[field] = options[field] ?? null;
  }
}

export function classifySubmissionError(error, stage = "devnet_submission", transactionSignature = null) {
  if (error instanceof ProtocolSubmissionError && error.registryVersion) return error;
  const normalized = normalizeFailure(error, { stage, transactionSignature, programId: PROGRAM_ID });
  return new ProtocolSubmissionError(normalized.canonicalCode, normalized.title, {
    cause: error,
    ...normalized,
    stage: normalized.stage,
    safeMessage: normalized.safeMessage,
    technicalDetail: normalized.detail,
  });
}

export async function generateEncryptionIdentity(version = 1) {
  const pair = await suite.kem.generateKeyPair();
  const publicKey = new Uint8Array(await suite.kem.serializePublicKey(pair.publicKey));
  const privateKey = new Uint8Array(await suite.kem.serializePrivateKey(pair.privateKey));
  return {
    publicKeyBase64: bytesToBase64(publicKey),
    privateKeyBase64: bytesToBase64(privateKey),
    keyVersion: version,
  };
}

function joined(domain, fields) {
  return textEncoder.encode(`${domain}\0${fields.join("\0")}`);
}

function contentAad(context) {
  return joined("KEP:CONTENT:v1", [
    PROFILE_ID,
    context.artifactId,
    String(context.epoch),
    context.plaintextCommitment,
    context.policyId,
  ]);
}

function hpkeInfo(context) {
  return joined("KEP:HPKE-ENVELOPE:v1", [
    PROFILE_ID,
    context.artifactId,
    String(context.epoch),
    context.recipientIdentityId,
    String(context.recipientKeyVersion),
  ]);
}

function hpkeAad(context) {
  return joined("KEP:HPKE-ENVELOPE:v1:aad", [
    context.ciphertextSha256,
    context.contentNonceBase64,
    context.policyId,
    String(context.envelopeRevision),
  ]);
}

export async function encryptKnowledge(plaintext, artifactId, policyId, epoch = 1) {
  return encryptBytes(textEncoder.encode(plaintext), artifactId, policyId, epoch);
}

export async function encryptBytes(plaintextBytes, artifactId, policyId, epoch = 1) {
  if (!(plaintextBytes instanceof Uint8Array)) throw new TypeError("Expected binary bytes");
  if (plaintextBytes.length === 0) throw new Error("Knowledge cannot be empty.");
  const plaintextCommitment = await sha256Hex(
    concatBytes(textEncoder.encode("KEP:PLAINTEXT-CONTENT:v1\0"), plaintextBytes),
  );
  const contentKey = randomBytes(32);
  const nonce = randomBytes(24);
  const ciphertext = xchacha20poly1305(
    contentKey,
    nonce,
    contentAad({ artifactId, policyId, epoch, plaintextCommitment }),
  ).encrypt(plaintextBytes);
  const packaged = concatBytes(nonce, ciphertext);
  return {
    contentKeyBase64: bytesToBase64(contentKey),
    contentNonceBase64: bytesToBase64(nonce),
    ciphertextBase64: bytesToBase64(packaged),
    ciphertextSha256: await sha256Hex(packaged),
    plaintextCommitment,
  };
}

export async function decryptKnowledge(ciphertextBase64, contentKeyBase64, context) {
  return textDecoder.decode(await decryptBytes(ciphertextBase64, contentKeyBase64, context));
}

export async function decryptBytes(ciphertextBase64, contentKeyBase64, context) {
  const packaged = base64ToBytes(ciphertextBase64);
  if (packaged.length < 41) throw new Error("Encrypted artifact is truncated.");
  const nonce = packaged.subarray(0, 24);
  const ciphertext = packaged.subarray(24);
  let plaintext;
  try {
    plaintext = xchacha20poly1305(
      base64ToBytes(contentKeyBase64),
      nonce,
      contentAad(context),
    ).decrypt(ciphertext);
  } catch (cause) {
    throw new ProtocolClientError(
      "content_decryption_failed",
      "The encrypted artifact could not be authenticated with this content key.",
      { cause, stage: "local_decryption" },
    );
  }
  return plaintext;
}

export async function sealContentKey(recipientPublicKeyBase64, contentKeyBase64, context) {
  const recipientPublicKey = await suite.kem.deserializePublicKey(
    base64ToBytes(recipientPublicKeyBase64),
  );
  const sender = await suite.createSenderContext({
    recipientPublicKey,
    info: hpkeInfo(context),
  });
  const sealed = new Uint8Array(
    await sender.seal(base64ToBytes(contentKeyBase64), hpkeAad(context)),
  );
  const enc = new Uint8Array(sender.enc);
  const length = new Uint8Array([(enc.length >> 8) & 0xff, enc.length & 0xff]);
  const envelope = concatBytes(length, enc, sealed);
  return {
    envelopeBase64: bytesToBase64(envelope),
    envelopeSha256: await sha256Hex(envelope),
  };
}

export async function openContentKey(envelopeBase64, recipientPrivateKeyBase64, context) {
  const envelope = base64ToBytes(envelopeBase64);
  if (envelope.length < 35) throw new Error("Recipient envelope is truncated.");
  const length = (envelope[0] << 8) | envelope[1];
  const enc = envelope.subarray(2, 2 + length);
  const sealed = envelope.subarray(2 + length);
  const recipientKey = await suite.kem.deserializePrivateKey(
    base64ToBytes(recipientPrivateKeyBase64),
  );
  const receiver = await suite.createRecipientContext({
    recipientKey,
    enc,
    info: hpkeInfo(context),
  });
  try {
    return bytesToBase64(new Uint8Array(await receiver.open(sealed, hpkeAad(context))));
  } catch (cause) {
    throw new ProtocolClientError(
      "recipient_envelope_authentication_failed",
      "The recipient envelope does not authenticate for this key and revision.",
      { cause, stage: "recipient_envelope_open" },
    );
  }
}

export const SIGNING_AUDIENCE = 'https://kep.cyberalchemylab.com';
export const signedMessage = (action, fields) => 'ca2:kep:authorization:v2:'+JSON.stringify([
  SIGNING_AUDIENCE, 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', PROGRAM_ID, action, fields
]);
export const messages = {
  register: (...fields) => signedMessage('register', fields),
  artifact: (...fields) => signedMessage('artifact', fields),
  grant: (...fields) => signedMessage('grant', [...fields, 0]),
  access: (...fields) => signedMessage('access', fields),
  reissueRequest: (...fields) => signedMessage('reissue-request', fields),
  reissueFulfill: (...fields) => signedMessage('reissue-fulfill', fields),
};

function u64le(value) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), true);
  return bytes;
}

async function operationBytes(operationId) {
  return sha256Bytes(textEncoder.encode(`KEP:OPERATION:v1\0${operationId}`));
}

async function digestOrHash(value) {
  return /^[0-9a-f]{64}$/i.test(value)
    ? hexToBytes(value)
    : sha256Bytes(textEncoder.encode(value));
}

function instruction(programId, keys, data) {
  return new TransactionInstruction({ programId, keys, data });
}

export async function buildInitializeInstruction(input) {
  const programId = new PublicKey(PROGRAM_ID);
  const wallet = new PublicKey(input.walletPublicKey);
  const artifactId = hexToBytes(input.artifactId);
  const operationId = await operationBytes(input.operationId);
  const [artifactAccount] = PublicKey.findProgramAddressSync(
    [textEncoder.encode("artifact"), artifactId],
    programId,
  );
  const [replayAccount] = PublicKey.findProgramAddressSync(
    [textEncoder.encode("replay"), artifactId, operationId],
    programId,
  );
  const data = concatBytes(
    new Uint8Array([0]),
    artifactId,
    await digestOrHash(input.policyId),
    u64le(input.epoch),
    hexToBytes(input.ciphertextSha256),
    hexToBytes(input.originatorEnvelopeSha256),
    await sha256Bytes(textEncoder.encode(`KEP:HOSTED-LOCATOR:v1\0${input.apiBase}`)),
    operationId,
  );
  return {
    artifactAccount: artifactAccount.toString(),
    instruction: instruction(programId, [
      { pubkey: wallet, isSigner: true, isWritable: true },
      { pubkey: wallet, isSigner: true, isWritable: false },
      { pubkey: artifactAccount, isSigner: false, isWritable: true },
      { pubkey: replayAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ], data),
  };
}

export async function buildGrantInstruction(input) {
  const programId = new PublicKey(PROGRAM_ID);
  const wallet = new PublicKey(input.walletPublicKey);
  const recipient = new PublicKey(input.recipientWalletPublicKey);
  const artifactId = hexToBytes(input.artifactId);
  const operationId = await operationBytes(input.operationId);
  const [artifactAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("artifact"), artifactId], programId);
  const [replayAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("replay"), artifactId, operationId], programId);
  return {
    artifactAccount: artifactAccount.toString(),
    instruction: instruction(programId, [
      { pubkey: wallet, isSigner: true, isWritable: true },
      { pubkey: wallet, isSigner: true, isWritable: false },
      { pubkey: artifactAccount, isSigner: false, isWritable: true },
      { pubkey: replayAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ], concatBytes(
      new Uint8Array([1]),
      recipient.toBytes(),
      await sha256Bytes(base64ToBytes(input.recipientEncryptionPublicKey)),
      hexToBytes(input.recipientEnvelopeSha256),
      u64le(input.expectedRevision),
      operationId,
    )),
  };
}

export async function buildRequestReissueInstruction(input) {
  const programId = new PublicKey(PROGRAM_ID);
  const wallet = new PublicKey(input.walletPublicKey);
  const artifactId = hexToBytes(input.artifactId);
  const operationId = await operationBytes(input.operationId);
  const revision = u64le(input.expectedRevision);
  const [artifactAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("artifact"), artifactId], programId);
  const [requestAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("reissue"), artifactId, wallet.toBytes(), revision], programId);
  const [replayAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("replay"), artifactId, operationId], programId);
  return {
    artifactAccount: artifactAccount.toString(),
    requestAccount: requestAccount.toString(),
    instruction: instruction(programId, [
      { pubkey: wallet, isSigner: true, isWritable: true },
      { pubkey: wallet, isSigner: true, isWritable: false },
      { pubkey: artifactAccount, isSigner: false, isWritable: true },
      { pubkey: requestAccount, isSigner: false, isWritable: true },
      { pubkey: replayAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ], concatBytes(
      new Uint8Array([2]),
      await sha256Bytes(base64ToBytes(input.replacementPublicKey)),
      revision,
      operationId,
    )),
  };
}

export async function buildFulfillReissueInstruction(input) {
  const programId = new PublicKey(PROGRAM_ID);
  const wallet = new PublicKey(input.walletPublicKey);
  const recipient = new PublicKey(input.recipientWalletPublicKey);
  const artifactId = hexToBytes(input.artifactId);
  const operationId = await operationBytes(input.fulfillOperationId);
  const revision = u64le(input.expectedRevision);
  const [artifactAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("artifact"), artifactId], programId);
  const [requestAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("reissue"), artifactId, recipient.toBytes(), revision], programId);
  const [replayAccount] = PublicKey.findProgramAddressSync([textEncoder.encode("replay"), artifactId, operationId], programId);
  return {
    artifactAccount: artifactAccount.toString(),
    instruction: instruction(programId, [
      { pubkey: wallet, isSigner: true, isWritable: true },
      { pubkey: wallet, isSigner: true, isWritable: false },
      { pubkey: artifactAccount, isSigner: false, isWritable: true },
      { pubkey: requestAccount, isSigner: false, isWritable: true },
      { pubkey: replayAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ], concatBytes(
      new Uint8Array([3]),
      hexToBytes(input.replacementEnvelopeSha256),
      revision,
      operationId,
    )),
  };
}

export async function submitAndFinalize(provider, instruction, rpcUrl = DEVNET_RPC, options = {}) {
  const connection = options.connection || new Connection(rpcUrl, "confirmed");
  let latest;
  try {
    latest = await connection.getLatestBlockhash("confirmed");
  } catch (error) {
    throw classifySubmissionError(error, "blockhash_acquisition");
  }
  const transaction = new Transaction({
    feePayer: provider.publicKey,
    recentBlockhash: latest.blockhash,
  }).add(instruction);
  let signed;
  try {
    signed = await provider.signTransaction(transaction);
  } catch (error) {
    throw classifySubmissionError(error, "wallet_approval");
  }
  let currentHeight;
  try {
    currentHeight = await connection.getBlockHeight("confirmed");
  } catch (error) {
    throw classifySubmissionError(error, "pre_submission_height_check");
  }
  if (currentHeight > latest.lastValidBlockHeight) {
    throw new ProtocolSubmissionError(
      "blockhash_expired_before_submission",
      "The transaction expired while awaiting wallet approval.",
      {
        stage: "wallet_approval",
        effectStatus: "none",
        safeMessage: "The transaction blockhash expired before it was submitted.",
        guidance: "Nothing was submitted. Start this step again to sign a fresh transaction.",
      },
    );
  }
  let signature;
  try {
    signature = await connection.sendRawTransaction(signed.serialize(), {
      preflightCommitment: "confirmed",
      maxRetries: 0,
    });
    if (options.onSubmitted) {
      await options.onSubmitted({
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      });
    }
  } catch (error) {
    throw classifySubmissionError(error, "devnet_preflight");
  }
  try {
    const result = await connection.confirmTransaction(
      { signature, ...latest },
      "finalized",
    );
    if (result.value.err) {
      throw new ProtocolSubmissionError("devnet_finalized_failure", "The transaction finalized with a protocol error.", {
        stage: "devnet_finalization",
        effectStatus: "finalized_failure",
        safeMessage: "Solana finalized the transaction with an error.",
        guidance: "Inspect the transaction evidence before preparing another attempt.",
        transactionSignature: signature,
        technicalDetail: JSON.stringify(result.value.err),
      });
    }
  } catch (error) {
    throw classifySubmissionError(error, "devnet_finalization", signature);
  }
  return signature;
}

export async function verifyFinalizedSignature(signature, rpcUrl = DEVNET_RPC, options = {}) {
  const connection = options.connection || new Connection(rpcUrl, "confirmed");
  let response;
  try {
    response = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
  } catch (error) {
    throw classifySubmissionError(error, "devnet_finalization", signature);
  }
  const status = response?.value;
  if (!status) {
    throw new ProtocolSubmissionError(
      "devnet_finality_unavailable",
      "The submitted transaction is not yet available at finalized commitment.",
      {
        stage: "devnet_finalization",
        effectStatus: "submitted_finality_unknown",
        retryDisposition: "inspect_before_retry",
        transactionSignature: signature,
        safeMessage: "The existing transaction must be inspected before any new submission.",
        guidance: "Wait and resume reconciliation with this signature. Do not create another transaction.",
      },
    );
  }
  if (status.err) {
    throw new ProtocolSubmissionError(
      "devnet_finalized_failure",
      "The submitted transaction finalized with a protocol error.",
      {
        stage: "devnet_finalization",
        effectStatus: "finalized_failure",
        retryDisposition: "inspect_before_retry",
        transactionSignature: signature,
        transactionError: status.err,
        technicalDetail: JSON.stringify(status.err),
      },
    );
  }
  if (status.confirmationStatus !== "finalized") {
    throw new ProtocolSubmissionError(
      "devnet_finality_unavailable",
      "The existing transaction has not reached finalized commitment.",
      {
        stage: "devnet_finalization",
        effectStatus: "submitted_finality_unknown",
        retryDisposition: "inspect_before_retry",
        transactionSignature: signature,
        safeMessage: "The existing transaction is still awaiting finality.",
        guidance: "Resume this same transaction later. Do not create another transaction.",
      },
    );
  }
  return signature;
}
