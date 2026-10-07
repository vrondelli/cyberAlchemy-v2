// Benchmark-only candidate; mirrors durable-kernel-v1.mjs atomicCreate publication.
// Open Questions: evidence/G01-CAMPAIGN-DURABILITY-R1.json.
import {openSync, closeSync, writeFileSync, fsyncSync, linkSync, unlinkSync, lstatSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

// No overwrite or idempotent replay: an existing terminal receipt is a conflict.
// A crash may leave a private temporary file, never an empty published receipt.
export function createReceipt(path, value, {checkpoint = () => {}} = {}) {
  const directory = dirname(path);
  if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) throw Error('receipt.parent-directory');
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  let published = false;
  try {
    const descriptor = openSync(temporary, 'wx', 0o600);
    try {writeFileSync(descriptor, bytes); fsyncSync(descriptor);} finally {closeSync(descriptor);}
    checkpoint('file-synced');
    linkSync(temporary, path); // Atomic exclusive publication; refuses EEXIST.
    published = true;
    checkpoint('published');
    const parent = openSync(directory, 'r');
    try {fsyncSync(parent);} finally {closeSync(parent);}
    checkpoint('directory-synced');
    return {published, bytes: bytes.length};
  } finally {
    unlinkSync(temporary);
  }
}
