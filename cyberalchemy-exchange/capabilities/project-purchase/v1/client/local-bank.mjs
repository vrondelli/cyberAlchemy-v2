import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
export async function startLocalBank(wallets) {
  const executable = fileURLToPath(
    new URL(
      "../program/target/debug/examples/local_bank",
      import.meta.url,
    ),
  );
  const child = spawn(executable, [], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, RUST_LOG: "error" },
  });
  let seq = 0,
    queue = new Map(),
    log = "";
  child.stderr.on("data", (x) => {
    log = (log + x).slice(-4000);
  });
  let readyResolve, readyReject;
  const ready = new Promise((a, b) => {
    readyResolve = a;
    readyReject = b;
  });
  child.on("error", readyReject);
  child.on("exit", (code) => {
    const err = Error("local bank exited " + code + " " + log);
    readyReject(err);
    for (const [, p] of queue) p.reject(err);
    queue.clear();
  });
  createInterface({ input: child.stdout }).on("line", (line) => {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg.ready) return readyResolve(msg);
    const p = queue.get(msg.id);
    if (p) {
      queue.delete(msg.id);
      msg.result?.error
        ? p.reject(Error(msg.result.error))
        : p.resolve(msg.result);
    }
  });
  child.stdin.write(JSON.stringify({ wallets }) + "\n");
  await ready;
  return {
    network: "ephemeral-local-bank",
    call(method, args = {}) {
      const id = ++seq;
      return new Promise((resolve, reject) => {
        queue.set(id, { resolve, reject });
        child.stdin.write(JSON.stringify({ id, method, ...args }) + "\n");
      });
    },
    async close() {
      child.stdin.end();
      await new Promise((resolve) => child.once("exit", resolve));
    },
  };
}
