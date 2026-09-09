import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { setTimeout as delay } from "node:timers/promises";
// Explicit Devnet-only successor. The existing hosted v1 finality verifier is unchanged.
export async function devnetGateway(url) {
  const connection = new Connection(url, "finalized");
  if (
    (await connection.getGenesisHash()) !==
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
  )
    throw Error("Exchange candidate requires Solana Devnet");
  return {
    network: "solana-devnet",
    async call(method, args = {}) {
      if (method === "blockhash")
        return connection.getLatestBlockhash("finalized");
      if (method === "clock") {
        const slot = await connection.getSlot("finalized"),
          timestamp = await connection.getBlockTime(slot);
        if (timestamp === null) throw Error("chain clock unavailable");
        return { timestamp };
      }
      if (method === "account") {
        const a = await connection.getAccountInfo(
          new PublicKey(args.key),
          "finalized",
        );
        return a
          ? {
              owner: a.owner.toBase58(),
              data: a.data.toString("base64"),
              lamports: a.lamports,
            }
          : null;
      }
      if (method === "submit") {
        const raw = Buffer.from(args.transaction, "base64"),
          tx = Transaction.from(raw);
        if (raw.length > 1232 || !tx.verifySignatures())
          throw Error("invalid signed transaction");
        const signature = await connection.sendRawTransaction(raw, {
          skipPreflight: false,
          preflightCommitment: "finalized",
          maxRetries: 2,
        });
        for (let i = 0; i < 30; i++) {
          const s = (
            await connection.getSignatureStatuses([signature], {
              searchTransactionHistory: true,
            })
          ).value[0];
          if (s?.err)
            throw Error("transaction rejected: " + JSON.stringify(s.err));
          if (s?.confirmationStatus === "finalized")
            return { signature, slot: s.slot };
          await delay(500);
        }
        throw Error(
          "submission outcome pending; read order state before retrying",
        );
      }
      throw Error("unsupported chain operation");
    },
  };
}
