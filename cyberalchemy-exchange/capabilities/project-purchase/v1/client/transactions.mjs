import {
  PublicKey,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
const deployment = process.env;
if (Boolean(deployment.EXCHANGE_KEP_PROGRAM_ID) !== Boolean(deployment.EXCHANGE_PURCHASE_PROGRAM_ID))
  throw Error("Both deployment program IDs are required");
export const KEP = new PublicKey(deployment.EXCHANGE_KEP_PROGRAM_ID ?? new Uint8Array(32).fill(0x65));
export const PURCHASE = new PublicKey(deployment.EXCHANGE_PURCHASE_PROGRAM_ID ?? new Uint8Array(32).fill(0x66));
if (KEP.equals(PURCHASE)) throw Error("KEP and purchase program IDs must differ");
export const LOCAL_MINT = new PublicKey(new Uint8Array(32).fill(0x71));
export const DEVNET_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
export const TOKEN = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
export const SYSTEM = new PublicKey("11111111111111111111111111111111");
const pk = (x) => new PublicKey(x),
  b = (x) => pk(x).toBuffer();
export function digestBytes(x) {
  if (!/^[0-9a-f]{64}$/.test(x)) throw Error("expected SHA-256 hex");
  return Buffer.from(x, "hex");
}
export function integer(x, signed = false) {
  if (typeof x === "number" && !Number.isSafeInteger(x))
    throw Error("unsafe integer");
  const v = BigInt(x);
  const out = Buffer.alloc(8);
  signed ? out.writeBigInt64LE(v) : out.writeBigUInt64LE(v);
  return out;
}
const cat = (...x) => Buffer.concat(x),
  meta = (pubkey, isSigner = false, isWritable = false) => ({
    pubkey: pk(pubkey),
    isSigner,
    isWritable,
  });
export const artifactAddress = (id) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("artifact-v2"), digestBytes(id)],
    KEP,
  )[0];
export const memberAddress = (artifact, identity) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("member-v2"), b(artifact), b(identity)],
    KEP,
  )[0];
export const orderAddress = (id) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("purchase-v1"), digestBytes(id)],
    PURCHASE,
  )[0];
export const vaultAddress = (order) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("escrow-v1"), b(order)],
    PURCHASE,
  )[0];
export const replayAddress = (artifactId, id) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("replay"), digestBytes(artifactId), digestBytes(id)],
    KEP,
  )[0];
export function initializeArtifact(x) {
  const artifact = artifactAddress(x.artifactId);
  return new TransactionInstruction({
    programId: KEP,
    keys: [
      meta(x.seller, true, true),
      meta(x.seller, true),
      meta(artifact, false, true),
      meta(memberAddress(artifact, x.seller), false, true),
      meta(SYSTEM),
    ],
    data: cat(
      Buffer.from([128, 0]),
      digestBytes(x.artifactId),
      digestBytes(x.policy),
      integer(x.epoch),
      digestBytes(x.ciphertext),
      digestBytes(x.locator),
      digestBytes(x.key),
      digestBytes(x.envelope),
    ),
  });
}
export function fundOrder(x) {
  const order = orderAddress(x.id),
    artifact = artifactAddress(x.artifactId);
  return new TransactionInstruction({
    programId: PURCHASE,
    keys: [
      meta(x.buyer, true, true),
      meta(x.seller, true),
      meta(x.release),
      meta(x.mint),
      meta(x.buyerToken, false, true),
      meta(x.sellerToken, false, true),
      meta(artifact),
      meta(order, false, true),
      meta(vaultAddress(order), false, true),
      meta(SYSTEM),
      meta(TOKEN),
      meta(memberAddress(artifact, x.seller)),
    ],
    data: cat(
      Buffer.from([0]),
      digestBytes(x.id),
      integer(x.amount),
      integer(x.deadline, true),
      integer(x.retentionSeconds),
      digestBytes(x.termsCommitment),
    ),
  });
}
export function prepareOrder(x) {
  const artifact = artifactAddress(x.artifactId);
  return new TransactionInstruction({
    programId: PURCHASE,
    keys: [
      meta(x.buyer, true),
      meta(x.seller, true),
      meta(x.release, true),
      meta(orderAddress(x.id), false, true),
      meta(artifact),
      meta(memberAddress(artifact, x.seller)),
    ],
    data: cat(
      Buffer.from([1]),
      digestBytes(x.keyCommitment),
      digestBytes(x.envelopeCommitment),
      integer(x.revision),
    ),
  });
}
export function unlockOrder(x) {
  const order = orderAddress(x.id),
    artifact = artifactAddress(x.artifactId);
  return new TransactionInstruction({
    programId: PURCHASE,
    keys: [
      meta(x.buyer, true, true),
      meta(x.buyer, true),
      meta(x.seller, true),
      meta(x.release, true),
      meta(order, false, true),
      meta(vaultAddress(order), false, true),
      meta(x.mint),
      meta(x.sellerToken, false, true),
      meta(artifact, false, true),
      meta(replayAddress(x.artifactId, x.id), false, true),
      meta(SYSTEM),
      meta(TOKEN),
      meta(KEP),
      meta(memberAddress(artifact, x.seller)),
      meta(memberAddress(artifact, x.buyer), false, true),
    ],
    data: Buffer.from([2]),
  });
}
export function refundOrder(x) {
  const order = orderAddress(x.id);
  return new TransactionInstruction({
    programId: PURCHASE,
    keys: [
      meta(order, false, true),
      meta(vaultAddress(order), false, true),
      meta(x.mint),
      meta(x.buyerToken, false, true),
      meta(TOKEN),
    ],
    data: Buffer.from([3]),
  });
}
export async function signedTransaction(chain, instruction, payer, signers) {
  const { blockhash } = await chain.call("blockhash");
  const tx = new Transaction({
    feePayer: pk(payer),
    recentBlockhash: blockhash,
  }).add(instruction);
  tx.sign(...signers);
  return tx.serialize().toString("base64");
}
class Reader {
  constructor(raw) {
    this.b = Buffer.from(raw, "base64");
    this.i = 0;
  }
  take(n) {
    if (this.i + n > this.b.length) throw Error("truncated account");
    const v = this.b.subarray(this.i, this.i + n);
    this.i += n;
    return v;
  }
  byte() {
    return this.take(1)[0];
  }
  hex() {
    return this.take(32).toString("hex");
  }
  key() {
    return new PublicKey(this.take(32)).toBase58();
  }
  u64() {
    return this.take(8).readBigUInt64LE().toString();
  }
  i64() {
    return this.take(8).readBigInt64LE().toString();
  }
  end() {
    if (this.i !== this.b.length) throw Error("unexpected account suffix");
  }
}
export function decodeOrder(account) {
  if (account?.owner !== PURCHASE.toBase58())
    throw Error("wrong purchase program owner");
  const r = new Reader(account.data);
  if (r.byte() !== 1) throw Error("unsupported order");
  const o = {
    id: r.hex(),
    buyer: r.key(),
    seller: r.key(),
    release: r.key(),
    mint: r.key(),
    buyerToken: r.key(),
    sellerToken: r.key(),
    artifact: r.key(),
    amount: r.u64(),
    deadline: r.i64(),
    retentionSeconds: r.u64(),
    termsCommitment: r.hex(),
    keyCommitment: r.hex(),
    envelopeCommitment: r.hex(),
    revision: r.u64(),
  };
  o.status = ["funded", "ready", "committed", "refunded"][r.byte()];
  if (!o.status) throw Error("invalid order status");
  o.committedAt = r.i64();
  r.end();
  return o;
}
export function decodeMember(account) {
  if (account?.owner !== KEP.toBase58()) throw Error("wrong KEP owner");
  const r = new Reader(account.data);
  if (r.byte() !== 2) throw Error("unsupported membership");
  const m = {
    artifact: r.key(),
    identity: r.key(),
    keyCommitment: r.hex(),
    envelopeCommitment: r.hex(),
    revision: r.u64(),
  };
  r.end();
  return m;
}
export function decodeArtifact(account) {
  if (account?.owner !== KEP.toBase58()) throw Error("wrong KEP owner");
  const r = new Reader(account.data);
  if (r.byte() !== 2) throw Error("unsupported artifact");
  const a = {
    id: r.hex(),
    originator: r.key(),
    policy: r.hex(),
    epoch: r.u64(),
    ciphertext: r.hex(),
    locator: r.hex(),
    revision: r.u64(),
  };
  r.end();
  return a;
}

export function requestReissue(x) {
  const artifact = artifactAddress(x.artifactId),
    member = memberAddress(artifact, x.buyer);
  const request = PublicKey.findProgramAddressSync(
    [Buffer.from("reissue-v2"), member.toBuffer(), integer(x.memberRevision)],
    KEP,
  )[0];
  return new TransactionInstruction({
    programId: KEP,
    keys: [
      meta(x.buyer, true, true),
      meta(x.buyer, true),
      meta(artifact),
      meta(member),
      meta(request, false, true),
      meta(SYSTEM),
    ],
    data: cat(
      Buffer.from([128, 2]),
      digestBytes(x.keyCommitment),
      integer(x.memberRevision),
    ),
  });
}
export function fulfillReissue(x) {
  const artifact = artifactAddress(x.artifactId),
    member = memberAddress(artifact, x.buyer);
  const request = PublicKey.findProgramAddressSync(
    [Buffer.from("reissue-v2"), member.toBuffer(), integer(x.memberRevision)],
    KEP,
  )[0];
  return new TransactionInstruction({
    programId: KEP,
    keys: [
      meta(x.seller, true),
      meta(artifact, false, true),
      meta(memberAddress(artifact, x.seller)),
      meta(member, false, true),
      meta(request, false, true),
    ],
    data: cat(
      Buffer.from([128, 3]),
      digestBytes(x.envelopeCommitment),
      integer(x.revision),
    ),
  });
}
