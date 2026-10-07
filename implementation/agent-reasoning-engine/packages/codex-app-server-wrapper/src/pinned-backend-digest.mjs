import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

// DrvFs can transiently refuse a read of a large pinned executable under WSL
// memory pressure. Retry only that read failure, always hashing from byte zero.
export async function sha256PinnedBackend(path, {streamFactory = createReadStream,
  delay = wait} = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const hash = createHash("sha256");
    try {
      for await (const chunk of streamFactory(path)) hash.update(chunk);
      return hash.digest("hex");
    } catch (error) {
      if (error?.code !== "ENOMEM" || attempt === 2) throw error;
      await delay(100 * (attempt + 1));
    }
  }
  throw new Error("pinned-backend.digest-unreachable");
}
