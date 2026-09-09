import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { Transaction } from "@solana/web3.js";
import { createPrivateKey, sign } from "node:crypto";
export async function browserUnlock({
  url,
  id,
  buyer,
  seller,
  identity,
  original,
}) {
  const browser = await chromium.launch({
    ...(process.env.EXCHANGE_CHROMIUM
      ? { executablePath: process.env.EXCHANGE_CHROMIUM }
      : {}),
    headless: true,
  });
  try {
    const context = await browser.newContext();
    let active = buyer;
    await context.exposeBinding(
      "testWallet",
      async (_, { operation, data }) => {
        if (operation === "publicKey") return active.publicKey.toBase58();
        if (operation === "transaction") {
          const tx = Transaction.from(Buffer.from(data, "base64"));
          tx.partialSign(active);
          return tx
            .serialize({ requireAllSignatures: false })
            .toString("base64");
        }
        const key = createPrivateKey({
          key: Buffer.concat([
            Buffer.from("302e020100300506032b657004220420", "hex"),
            Buffer.from(active.secretKey).subarray(0, 32),
          ]),
          format: "der",
          type: "pkcs8",
        });
        return Array.from(sign(null, Buffer.from(data), key));
      },
    );
    await context.addInitScript(() => {
      window.solana = {
        publicKey: null,
        async connect() {
          const key = await window.testWallet({ operation: "publicKey" });
          this.publicKey = { toBase58: () => key };
        },
        async signMessage(data) {
          return {
            signature: new Uint8Array(
              await window.testWallet({
                operation: "message",
                data: Array.from(data),
              }),
            ),
          };
        },
        async signTransaction(tx) {
          const b64 = await window.testWallet({
            operation: "transaction",
            data: btoa(
              String.fromCharCode(
                ...tx.serialize({
                  requireAllSignatures: false,
                  verifySignatures: false,
                }),
              ),
            ),
          });
          return tx.constructor.from(
            Uint8Array.from(atob(b64), (x) => x.charCodeAt(0)),
          );
        },
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector("#offers article");
    await page.click("#connect");
    await page.waitForFunction(
      () => document.querySelector("#wallet").textContent.length > 0,
    );
    await page.fill("#order", id);
    await page.click("#unlock");
    await page.waitForFunction(() =>
      document
        .querySelector("#result")
        .textContent.includes("awaiting_signatures"),
    );
    active = seller;
    await page.click("#connect");
    await page.waitForFunction(
      (key) => document.querySelector("#wallet").textContent === key,
      seller.publicKey.toBase58(),
    );
    await page.click("#sign");
    await page.waitForFunction(() =>
      document.querySelector("#result").textContent.includes("signature"),
    );
    await page.click("#status");
    await page.waitForFunction(
      () => document.querySelector("#state").textContent === "committed",
    );
    active = buyer;
    await page.click("#connect");
    await page.waitForFunction(
      (key) => document.querySelector("#wallet").textContent === key,
      buyer.publicKey.toBase58(),
    );
    await page.locator("details").last().locator("summary").click();
    await page.setInputFiles("#identity", {
      name: "identity.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(identity)),
    });
    const downloading = page.waitForEvent("download");
    await page.click("#receive");
    const download = await downloading;
    assert.deepEqual(
      new Uint8Array(await readFile(await download.path())),
      original,
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#result")
        .textContent.includes("Project downloaded. Purchase complete."),
    );
    if (errors.length) throw Error("browser errors: " + errors.join("; "));
    return {
      browser: "chromium",
      wallets: 2,
      provider: "test provider with real Ed25519 signatures",
      downloadVerified: true,
      status: "committed",
    };
  } finally {
    await browser.close();
  }
}
