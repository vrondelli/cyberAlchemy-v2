import { readFile, stat } from "node:fs/promises";
import { Keypair } from "@solana/web3.js";
import { postgresStore } from "./store.mjs";
import { devnetGateway } from "./rpc.mjs";
import { DEVNET_MINT, KEP, PURCHASE } from "./transactions.mjs";
import { purchaseService } from "./service.mjs";
const { EXCHANGE_DATABASE_URL, EXCHANGE_RELEASE_KEY_FILE, EXCHANGE_RPC_URL } =
  process.env;
if (!EXCHANGE_DATABASE_URL || !EXCHANGE_RELEASE_KEY_FILE || !EXCHANGE_RPC_URL)
  throw Error(
    "Set EXCHANGE_DATABASE_URL, EXCHANGE_RELEASE_KEY_FILE and EXCHANGE_RPC_URL.",
  );
if ((await stat(EXCHANGE_RELEASE_KEY_FILE)).mode & 0o077)
  throw Error("Release key file must have mode 0600.");
const release = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(await readFile(EXCHANGE_RELEASE_KEY_FILE, "utf8")),
  ),
);
const profile = JSON.parse(await readFile(new URL('../deployment/public.json', import.meta.url), 'utf8'));
if (profile.network !== 'solana-devnet' || EXCHANGE_RPC_URL !== profile.rpc ||
    KEP.toBase58() !== profile.keys.kepProgram || PURCHASE.toBase58() !== profile.keys.purchaseProgram ||
    release.publicKey.toBase58() !== profile.keys.releaseAuthority)
  throw Error('Server bindings do not match the selected Devnet profile; use serve-devnet');
const chain = await devnetGateway(EXCHANGE_RPC_URL),
  store = await postgresStore(EXCHANGE_DATABASE_URL);
const service = purchaseService({
    chain,
    store,
    release,
    mint: DEVNET_MINT.toBase58(),
  }),
  server = await service.listen(Number(process.env.EXCHANGE_PORT ?? 8091));
console.log("CyberAlchemy Exchange candidate: " + server.url);
const expiry = setInterval(
  () =>
    service
      .expireDue()
      .catch((e) => console.error("Expiry pending: " + e.message)),
  5000,
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(expiry);
  await server.close();
  await store.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
