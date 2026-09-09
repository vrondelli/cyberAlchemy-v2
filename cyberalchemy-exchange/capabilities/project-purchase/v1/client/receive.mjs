import { openContentKey } from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/protocol.js";
import { decryptFile } from "../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/file-client.js";
import { authorize, sha } from "./auth.mjs";
export async function receivePurchase({
  api,
  id,
  wallet,
  identity,
  attempt,
  save,
}) {
  const request = { orderId: id, buyer: wallet.publicKey.toBase58(), attempt };
  const response = await api("POST", `/v1/orders/${id}/access`, {
    request,
    signature: authorize(wallet, "access", request),
  });
  if (
    sha(Buffer.from(response.ciphertextBase64, "base64")) !==
      response.context.ciphertextSha256 ||
    sha(Buffer.from(response.envelopeBase64, "base64")) !==
      response.envelopeCommitment
  )
    throw Error("delivery digest mismatch");
  const key = await openContentKey(
    response.envelopeBase64,
    identity.privateKeyBase64,
    response.context,
  );
  const file = await decryptFile(
    response.ciphertextBase64,
    key,
    response.context,
  );
  await save(file);
  const acknowledge = () =>
    api("POST", `/v1/orders/${id}/acknowledge`, {
      request,
      signature: authorize(wallet, "acknowledge", request),
    });
  try {
    return { file, receipt: await acknowledge(), acknowledge };
  } catch (error) {
    return { file, receipt: null, receiptError: error.message, acknowledge };
  }
}
