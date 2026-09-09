import {
  mkdir,
  open,
  rename,
  unlink,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  canonicalBytes,
  sha256Bytes,
  verifyRecordDigest,
} from "./canonical-json.mjs";

function assertSealed(record) {
  if (!verifyRecordDigest(record)) {
    throw new TypeError("refusing to persist an unsealed or mutated record");
  }
}

export class MemoryRecordStore {
  constructor({ failAt = null } = {}) {
    this.failAt = failAt;
    this.records = [];
  }

  async persist(name, record) {
    assertSealed(record);
    if (this.failAt === name) {
      throw new Error(`injected persistence failure at ${name}`);
    }
    const bytes = canonicalBytes(record);
    const persisted = {
      name,
      bytes,
      exact_bytes_digest: sha256Bytes(bytes),
      record,
    };
    this.records.push(persisted);
    return persisted;
  }
}

export class AtomicFileRecordStore {
  constructor(root, { failStage = null } = {}) {
    this.root = root;
    this.failStage = failStage;
    this.records = [];
    this.sequence = 0;
  }

  inject(stage, name) {
    if (this.failStage === stage || this.failStage === `${stage}:${name}`) {
      throw new Error(`injected persistence failure at ${stage}:${name}`);
    }
  }

  async persist(name, record) {
    assertSealed(record);
    const sequence = String(++this.sequence).padStart(3, "0");
    const finalPath = join(this.root, `${sequence}-${name}.json`);
    const temporaryPath = `${finalPath}.tmp-${process.pid}-${sequence}`;
    const bytes = canonicalBytes(record);
    await mkdir(dirname(finalPath), { recursive: true });

    let handle;
    try {
      this.inject("before-open", name);
      handle = await open(temporaryPath, "wx", 0o600);
      await handle.writeFile(bytes);
      this.inject("before-file-sync", name);
      await handle.sync();
      await handle.close();
      handle = undefined;
      this.inject("before-rename", name);
      await rename(temporaryPath, finalPath);
      this.inject("before-directory-sync", name);
      const directoryHandle = await open(dirname(finalPath), "r");
      try {
        await directoryHandle.sync();
      } finally {
        await directoryHandle.close();
      }
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      await unlink(temporaryPath).catch(() => {});
      throw error;
    }

    const persisted = {
      name,
      path: finalPath,
      bytes,
      exact_bytes_digest: sha256Bytes(bytes),
      record,
    };
    this.records.push(persisted);
    return persisted;
  }
}
