import {
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  createHash,
} from "node:crypto";
import { PublicKey } from "@solana/web3.js";
export const sha = (value) => createHash("sha256").update(value).digest("hex");
export const canonical = (value) => JSON.stringify(sort(value));
function sort(v) {
  if (Array.isArray(v)) return v.map(sort);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, sort(v[k])]),
    );
  return v;
}
const message = (action, payload) =>
  Buffer.from(
    "cyberalchemy-exchange:purchase:v1:" + action + ":" + canonical(payload),
  );
export function authorize(wallet, action, payload) {
  const der = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(wallet.secretKey).subarray(0, 32),
  ]);
  return sign(
    null,
    message(action, payload),
    createPrivateKey({ key: der, format: "der", type: "pkcs8" }),
  ).toString("base64");
}
export function authenticate(wallet, action, payload, signature) {
  const der = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    new PublicKey(wallet).toBuffer(),
  ]);
  if (
    !verify(
      null,
      message(action, payload),
      createPublicKey({ key: der, format: "der", type: "spki" }),
      Buffer.from(signature ?? "", "base64"),
    )
  )
    throw Error("wallet authorization rejected");
}
export function fields(o, keys) {
  if (
    !o ||
    typeof o !== "object" ||
    Array.isArray(o) ||
    Object.keys(o).some((k) => !keys.includes(k)) ||
    keys.some((k) => !(k in o))
  )
    throw Error("unexpected or missing fields");
}
