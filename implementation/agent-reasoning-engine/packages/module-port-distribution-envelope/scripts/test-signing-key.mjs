import {createPrivateKey, createPublicKey, sign} from "node:crypto";

import {TEST_KEY_ID, TEST_PUBLIC_KEY_SPKI_BASE64, TEST_TRUST_POSTURE} from "../public-trust.mjs";

// Public deterministic fixture material. It is intentionally not a secret and
// is never eligible to sign a release or establish distribution trust.
const TEST_SEED = Buffer.from("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", "hex");
const PKCS8_ED25519_SEED_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export const TEST_PRIVATE_KEY = createPrivateKey({
  key: Buffer.concat([PKCS8_ED25519_SEED_PREFIX, TEST_SEED]),
  format: "der",
  type: "pkcs8",
});
export const TEST_PUBLIC_KEY = createPublicKey(TEST_PRIVATE_KEY);
if (TEST_PUBLIC_KEY.export({format: "der", type: "spki"}).toString("base64") !== TEST_PUBLIC_KEY_SPKI_BASE64) {
  throw new Error("envelope.test-key-public-binding-invalid");
}

export {TEST_KEY_ID, TEST_PUBLIC_KEY_SPKI_BASE64, TEST_TRUST_POSTURE};

export function signTestPayload(bytes) {
  return sign(null, bytes, TEST_PRIVATE_KEY).toString("base64");
}
